"""Build an EnergyPlus design-day sizing model from a resolved scenario.

Model form (documented in README.md):
  * Rectangular footprint, N floors. Ground, one representative middle floor and
    top floor are modelled explicitly; the middle floor's results are scaled by
    (N - 2) in post-processing (no EnergyPlus zone multipliers, so the scaling
    is explicit and auditable).
  * Each floor: four perimeter zones + core (DOE prototype zoning) when the
    plate is deep enough, otherwise one zone per floor.
  * Interior partitions and floor/ceiling slabs between floors are adiabatic
    (adjacent conditioned space at the same temperature, as in a standard
    peak-load calculation). Slabs carry thermal mass when enabled.
  * Ground floor uses the ASHRAE 90.1 F-factor method with the station's
    0.5 m monthly ground temperatures from the .stat file.
  * Optional adiabatic surfaces (adiabatic_wall_n/e/s/w, adiabatic_roof,
    adiabatic_floor) for a building that shares walls with a neighbour or is
    part of a larger one: those walls keep their construction (thermal mass)
    but exchange no heat, have no windows and no infiltration; an adiabatic
    roof or ground floor becomes an interior slab, like the middle floors.
  * HVAC is ZoneHVAC:IdealLoadsAirSystem per zone with outdoor air per
    ASHRAE 62.1 (people + area), optional sensible/enthalpy heat recovery and
    supply-humidity-ratio dehumidification, so the reported loads are the
    sensible + latent coil loads including outdoor air.
  * Only the sizing periods (ASHRAE design days from the station .ddy) run.
"""
import math

# Air-film resistances (m2-K/W) used to convert a whole-assembly U-factor into
# the resistance of a single massless layer. ASHRAE Handbook - Fundamentals,
# Ch. 26, surface resistances: still air vertical 0.12, still air horizontal
# heat-flow-up 0.11, moving air (24 km/h) 0.03.
R_FILM_IN_WALL = 0.12
R_FILM_IN_ROOF = 0.11
R_FILM_OUT = 0.03

# Material property sets from the EnergyPlus example-file / ASHRAE HOF material
# datasets (name, roughness, thickness m, conductivity W/m-K, density kg/m3,
# specific heat J/kg-K).
MAT_GYPSUM = ('G01a 19mm gypsum board', 'MediumSmooth', 0.019, 0.16, 800.0, 1090.0)
MAT_CONCRETE_HALF = ('HW CONCRETE half slab', 'Rough', 0.0508, 1.311, 2240.0, 836.8)

DESIGN_DAY_ORDER = ['htg_99.6', 'htg_99', 'clg_db_0.4', 'clg_db_1', 'clg_db_2',
                    'clg_dp_0.4', 'clg_dp_1', 'clg_dp_2']

OUTPUT_VARIABLES = [
    'Zone Ideal Loads Supply Air Sensible Cooling Rate',
    'Zone Ideal Loads Supply Air Latent Cooling Rate',
    'Zone Ideal Loads Supply Air Total Cooling Rate',
    'Zone Ideal Loads Supply Air Sensible Heating Rate',
    'Zone Ideal Loads Supply Air Total Heating Rate',
    'Zone Ideal Loads Zone Sensible Cooling Rate',
    'Zone Ideal Loads Zone Sensible Heating Rate',
    'Zone Ideal Loads Outdoor Air Total Cooling Rate',
    'Zone Ideal Loads Outdoor Air Total Heating Rate',
    'Zone Ideal Loads Heat Recovery Total Cooling Rate',
    'Zone Ideal Loads Heat Recovery Total Heating Rate',
    'Zone Ideal Loads Supply Air Standard Density Volume Flow Rate',
    'Zone Ideal Loads Outdoor Air Standard Density Volume Flow Rate',
    'Site Outdoor Air Drybulb Temperature',
]

# Annual runs: monthly totals (energy) and monthly means (airflow).
ANNUAL_VARIABLES = [
    'Zone Ideal Loads Supply Air Total Cooling Energy',
    'Zone Ideal Loads Supply Air Total Heating Energy',
    'Lights Electricity Energy',
    'Electric Equipment Electricity Energy',
    'Zone Ideal Loads Supply Air Standard Density Volume Flow Rate',
]


class IdfWriter:
    """Accumulates objects as (type, [(field name, value), ...])."""

    def __init__(self):
        self.objects = []

    def add(self, typ, fields):
        self.objects.append((typ, fields))

    def text(self):
        out = []
        for typ, fields in self.objects:
            out.append('%s,' % typ)
            if not fields:
                out[-1] = '%s;' % typ
            for i, (name, val) in enumerate(fields):
                end = ';' if i == len(fields) - 1 else ','
                out.append('  %s%s%s!- %s' % (_fmt(val), end, ' ' * max(1, 28 - len(_fmt(val))), name))
            out.append('')
        return '\n'.join(out)


def _fmt(v):
    if v is None:
        return ''
    if isinstance(v, bool):
        return 'Yes' if v else 'No'
    if isinstance(v, float):
        s = ('%.6f' % v).rstrip('0').rstrip('.')
        return s if s not in ('', '-0') else '0'
    return str(v)


# ── Geometry ────────────────────────────────────────────────────────────────

def footprint(sc):
    a_floor = sc['gfa_m2'] / sc['n_floors']
    length = math.sqrt(a_floor * sc['aspect_ratio'])   # along x (east-west)
    width = a_floor / length                            # along y (north-south)
    return length, width


def floor_types(n, h):
    """[(key, z0, scale, is_ground, has_roof)] covering all n floors."""
    if n == 1:
        return [('S', 0.0, 1, True, True)]
    if n == 2:
        return [('G', 0.0, 1, True, False), ('T', h, 1, False, True)]
    mid = (n - 1) // 2
    return [('G', 0.0, 1, True, False),
            ('M', mid * h, n - 2, False, False),
            ('T', (n - 1) * h, 1, False, True)]


def zone_polygons(length, width, depth):
    """Zone footprints, counter-clockwise from above. First edge of each
    perimeter polygon is its exterior edge. Returns [(suffix, pts, ext_edges)]."""
    L, W, d = length, width, depth
    if min(L, W) < 2 * d + 2.0:
        return [('ALL', [(0, 0), (L, 0), (L, W), (0, W)], [0, 1, 2, 3])]
    return [
        ('S', [(0, 0), (L, 0), (L - d, d), (d, d)], [0]),
        ('E', [(L, 0), (L, W), (L - d, W - d), (L - d, d)], [0]),
        ('N', [(L, W), (0, W), (d, W - d), (L - d, W - d)], [0]),
        ('W', [(0, W), (0, 0), (d, d), (d, W - d)], [0]),
        ('C', [(d, d), (L - d, d), (L - d, W - d), (d, W - d)], []),
    ]


COMPASS = ('n', 'e', 's', 'w')


def facing(a, b, north_axis_deg):
    """Compass side ('n', 'e', 's' or 'w') an exterior edge a->b of a
    counter-clockwise footprint faces, after the building is rotated by
    north_axis_deg (EnergyPlus Building North Axis, clockwise from true north).
    Mirrored in web/app.js (facadeSides)."""
    nx, ny = b[1] - a[1], -(b[0] - a[0])            # outward normal
    az = (math.degrees(math.atan2(nx, ny)) + north_axis_deg) % 360.0
    return COMPASS[int(math.floor(az / 90.0 + 0.5)) % 4]


def is_adiabatic_edge(sc, a, b):
    return bool(sc.get('adiabatic_wall_' + facing(a, b, float(sc.get('north_axis_deg', 0.0)))))


def polygon_area(pts):
    s = 0.0
    for i in range(len(pts)):
        x1, y1 = pts[i]
        x2, y2 = pts[(i + 1) % len(pts)]
        s += x1 * y2 - x2 * y1
    return s / 2.0


def window_rect(a, b, z0, h, wwr):
    """Centred ribbon window on wall a->b. Returns (vertices, area) or None."""
    if wwr <= 0:
        return None
    lw = math.hypot(b[0] - a[0], b[1] - a[1])
    target = wwr * lw * h
    max_w = lw * 0.98
    max_h = h - 0.04
    hw = min(max_h, target / max_w)
    ww = min(max_w, target / hw)
    ux, uy = (b[0] - a[0]) / lw, (b[1] - a[1]) / lw
    off = (lw - ww) / 2.0
    p1 = (a[0] + ux * off, a[1] + uy * off)
    p2 = (p1[0] + ux * ww, p1[1] + uy * ww)
    sill = z0 + (h - hw) / 2.0
    head = sill + hw
    verts = [(p1[0], p1[1], head), (p1[0], p1[1], sill), (p2[0], p2[1], sill), (p2[0], p2[1], head)]
    return verts, ww * hw


def _verts_fields(verts):
    f = [('Number of Vertices', len(verts))]
    for x, y, z in verts:
        f += [('Vertex X-coordinate', float(x)), ('Vertex Y-coordinate', float(y)), ('Vertex Z-coordinate', float(z))]
    return f


TIMESTEPS_PER_HOUR = 6   # results.py averages peaks over one hour of these
# Overhangs with a smaller projection factor are left out (sub-millimetre depth;
# EnergyPlus rejects them as zero-area surfaces).
OVERHANG_PF_MIN = 1e-3


# ── Schedules ───────────────────────────────────────────────────────────────

def hourly_profile(start, hours, on, off):
    prof = [off] * 24
    for i in range(int(hours)):
        prof[(int(start) + i) % 24] = on
    return prof


def compact_day(profile):
    """Compress a 24-value hourly profile into Schedule:Compact Until fields."""
    out = []
    for hr in range(24):
        last = hr == 23 or profile[hr + 1] != profile[hr]
        if last:
            out.append('Until: %02d:00' % (hr + 1))
            out.append(_fmt(float(profile[hr])))
    return out


WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']


def occupied_day_types(days):
    """Schedule:Compact day types for the first `days` days of the week."""
    days = int(days)
    if days == 5:
        return 'Weekdays'
    if days == 6:
        return 'Weekdays Saturday'
    return ' '.join(WEEK[:days])


def compact_schedule(w, name, limits, summer, winter, other, unoccupied=None, days=7):
    """Design days first, then the ordinary days. With fewer than 7 occupied
    days a week, the occupied days take `other` and every remaining day
    (including holidays) takes `unoccupied`. Design days are unaffected."""
    vals = ['Through: 12/31']
    rows = [('SummerDesignDay', summer), ('WinterDesignDay', winter)]
    if unoccupied is not None and int(days) < 7:
        rows += [(occupied_day_types(days), other), ('AllOtherDays', unoccupied)]
    else:
        rows += [('AllOtherDays', other)]
    for label, prof in rows:
        vals.append('For: ' + label)
        vals += compact_day(prof)
    w.add('Schedule:Compact', [('Name', name), ('Schedule Type Limits Name', limits)] +
          [('Field', v) for v in vals])


# ── Builder ─────────────────────────────────────────────────────────────────

def build(sc, ddy, stat, eplus_version='25.2', annual=False):
    """Return (idf_text, model_info). model_info carries geometry facts and
    the per-zone scale factors needed by the results parser.

    annual=True runs a full year on the station's weather file instead of the
    design days, with monthly energy outputs (lib/results.py parse_annual)."""
    w = IdfWriter()
    h = sc['floor_to_floor_m']
    length, width = footprint(sc)
    floors = floor_types(sc['n_floors'], h)
    polys = zone_polygons(length, width, sc['perimeter_depth_m'])

    w.add('Version', [('Version Identifier', eplus_version)])
    w.add('SimulationControl', [
        ('Do Zone Sizing Calculation', True),
        ('Do System Sizing Calculation', False),
        ('Do Plant Sizing Calculation', False),
        ('Run Simulation for Sizing Periods', not annual),
        ('Run Simulation for Weather File Run Periods', annual),
        ('Do HVAC Sizing Simulation for Sizing Periods', False),
        ('Maximum Number of HVAC Sizing Simulation Passes', 1)])
    w.add('Building', [
        ('Name', 'Load tool %s' % sc['type']),
        ('North Axis', float(sc['north_axis_deg'])),
        ('Terrain', 'Suburbs'),
        # Keep EnergyPlus's default warm-up tolerances: loosening the loads
        # tolerance to 0.5 W let warm-up stop early and moved heating peaks by
        # up to 1.7% on concrete-slab models. Large fully-adiabatic middle-floor
        # cores need more than the default 25 warm-up days to meet 0.04 W; 50
        # days converges them (checked against the same runs on 25 and 100).
        ('Loads Convergence Tolerance Value', 0.04),
        ('Temperature Convergence Tolerance Value', 0.4),
        ('Solar Distribution', 'FullInteriorAndExterior'),
        ('Maximum Number of Warmup Days', 50),
        ('Minimum Number of Warmup Days', 6)])
    w.add('Timestep', [('Number of Timesteps per Hour', TIMESTEPS_PER_HOUR)])
    w.add('GlobalGeometryRules', [
        ('Starting Vertex Position', 'UpperLeftCorner'),
        ('Vertex Entry Direction', 'Counterclockwise'),
        ('Coordinate System', 'Relative')])

    loc = ddy['location']['fields']
    w.add('Site:Location', [('Name', loc[0]), ('Latitude', loc[1]), ('Longitude', loc[2]),
                            ('Time Zone', loc[3]), ('Elevation', loc[4])])
    dd_names = ['Name', 'Month', 'Day of Month', 'Day Type', 'Maximum Dry-Bulb Temperature',
                'Daily Dry-Bulb Temperature Range', 'Dry-Bulb Temperature Range Modifier Type',
                'Dry-Bulb Temperature Range Modifier Day Schedule Name', 'Humidity Condition Type',
                'Wetbulb or DewPoint at Maximum Dry-Bulb', 'Humidity Condition Day Schedule Name',
                'Humidity Ratio at Maximum Dry-Bulb', 'Enthalpy at Maximum Dry-Bulb',
                'Daily Wet-Bulb Temperature Range', 'Barometric Pressure', 'Wind Speed',
                'Wind Direction', 'Rain Indicator', 'Snow Indicator',
                'Daylight Saving Time Indicator', 'Solar Model Indicator',
                'Beam Solar Day Schedule Name', 'Diffuse Solar Day Schedule Name',
                'ASHRAE Clear Sky Optical Depth for Beam Irradiance (taub)',
                'ASHRAE Clear Sky Optical Depth for Diffuse Irradiance (taud)', 'Sky Clearness']
    env_names = {}
    for key in DESIGN_DAY_ORDER:
        dd = ddy['design_days'].get(key)
        if not dd:
            continue
        flds = dd['fields']
        # Trim trailing blanks; keep field order verbatim from the .ddy.
        while flds and flds[-1] == '':
            flds = flds[:-1]
        w.add('SizingPeriod:DesignDay', list(zip(dd_names, flds)))
        env_names[dd['name'].upper()] = key

    w.add('Sizing:Parameters', [('Heating Sizing Factor', 1.0), ('Cooling Sizing Factor', 1.0)])
    if annual:
        # One year of the station's typical-year weather file. The start day of
        # the week is left blank, which EnergyPlus takes as Sunday.
        w.add('RunPeriod', [('Name', 'Annual'), ('Begin Month', 1), ('Begin Day of Month', 1), ('Begin Year', ''),
                            ('End Month', 12), ('End Day of Month', 31), ('End Year', ''),
                            ('Day of Week for Start Day', ''),
                            ('Use Weather File Holidays and Special Days', False),
                            ('Use Weather File Daylight Saving Period', False),
                            ('Apply Weekend Holiday Rule', False),
                            ('Use Weather File Rain Indicators', True),
                            ('Use Weather File Snow Indicators', True)])
    gt = stat.get('ground_temps_0p5m')
    if not gt:
        raise ValueError('station .stat file has no 0.5 m ground temperatures')
    months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
              'September', 'October', 'November', 'December']
    w.add('Site:GroundTemperature:FCfactorMethod',
          [('%s Ground Temperature' % m, float(v)) for m, v in zip(months, gt)])

    # Schedule type limits and schedules
    w.add('ScheduleTypeLimits', [('Name', 'Fraction'), ('Lower Limit Value', 0.0), ('Upper Limit Value', 1.0),
                                 ('Numeric Type', 'Continuous')])
    w.add('ScheduleTypeLimits', [('Name', 'Temperature'), ('Lower Limit Value', -60.0),
                                 ('Upper Limit Value', 200.0), ('Numeric Type', 'Continuous'),
                                 ('Unit Type', 'Temperature')])
    w.add('ScheduleTypeLimits', [('Name', 'Any Number')])
    w.add('ScheduleTypeLimits', [('Name', 'Control Type'), ('Lower Limit Value', 0.0), ('Upper Limit Value', 4.0),
                                 ('Numeric Type', 'Discrete')])
    s0, nh = sc['occ_start_h'], sc['occ_hours']
    occ = hourly_profile(s0, nh, 1.0, 0.0)
    uf = float(sc['unoccupied_internal_fraction'])
    gains = hourly_profile(s0, nh, 1.0, uf)
    zero = [0.0] * 24
    one = [1.0] * 24
    # Heating design day carries no internal gains (standard conservative practice).
    days = int(sc.get('occ_days_per_week', 7))
    compact_schedule(w, 'OCC_SCH', 'Fraction', occ, zero, occ, zero, days)
    compact_schedule(w, 'GAINS_SCH', 'Fraction', gains, zero, gains, [uf] * 24, days)
    # Systems start hvac_start_before_occ_h ahead of occupancy: ventilation at
    # the design rate and occupied setpoints from then on, so the space is
    # conditioned (and dried) before people arrive. Outside that window outdoor
    # air runs at oa_unoccupied_fraction of the design rate (1.0 = continuous,
    # e.g. laboratories).
    pre = int(sc.get('hvac_start_before_occ_h', 0))
    s_on, h_on = s0 - pre, min(24, nh + pre)
    oa = hourly_profile(s_on, h_on, 1.0, float(sc.get('oa_unoccupied_fraction', 0.0)))
    oa_off = float(sc.get('oa_unoccupied_fraction', 0.0))
    compact_schedule(w, 'OA_SCH', 'Fraction', oa, oa, oa, [oa_off] * 24, days)
    compact_schedule(w, 'ALWAYS_ON', 'Fraction', one, one, one)
    act = [float(sc['activity_w_per_person'])] * 24
    compact_schedule(w, 'ACTIVITY_SCH', 'Any Number', act, act, act)
    four = [4.0] * 24
    compact_schedule(w, 'DUAL_CTRL', 'Control Type', four, four, four)
    th, tc = sc['t_heat_c'], sc['t_cool_c']
    sb = sc['setback_heat_c'] if sc.get('setback_heat_c') is not None else th
    su = sc['setup_cool_c'] if sc.get('setup_cool_c') is not None else tc
    htg = hourly_profile(s_on, h_on, th, sb)
    clg = hourly_profile(s_on, h_on, tc, su)
    compact_schedule(w, 'HTG_SP', 'Temperature', htg, htg, htg, [sb] * 24, days)
    compact_schedule(w, 'CLG_SP', 'Temperature', clg, clg, clg, [su] * 24, days)
    w.add('ThermostatSetpoint:DualSetpoint', [('Name', 'DualSP'),
                                              ('Heating Setpoint Temperature Schedule Name', 'HTG_SP'),
                                              ('Cooling Setpoint Temperature Schedule Name', 'CLG_SP')])

    # Materials and constructions
    r_wall = 1.0 / sc['wall_u'] - R_FILM_IN_WALL - R_FILM_OUT
    r_roof = 1.0 / sc['roof_u'] - R_FILM_IN_ROOF - R_FILM_OUT
    if r_wall <= 0.001 or r_roof <= 0.001:
        raise ValueError('U-factor too high to represent after removing air films')
    w.add('Material:NoMass', [('Name', 'Wall layer'), ('Roughness', 'MediumRough'), ('Thermal Resistance', r_wall)])
    w.add('Material:NoMass', [('Name', 'Roof layer'), ('Roughness', 'MediumRough'), ('Thermal Resistance', r_roof)])
    for m in (MAT_GYPSUM, MAT_CONCRETE_HALF):
        w.add('Material', [('Name', m[0]), ('Roughness', m[1]), ('Thickness', m[2]), ('Conductivity', m[3]),
                           ('Density', m[4]), ('Specific Heat', m[5])])
    w.add('WindowMaterial:SimpleGlazingSystem', [('Name', 'Glazing'), ('U-Factor', float(sc['win_u'])),
                                                 ('Solar Heat Gain Coefficient', float(sc['shgc']))])
    w.add('Construction', [('Name', 'Ext Wall'), ('Layer', 'Wall layer')])
    w.add('Construction', [('Name', 'Roof'), ('Layer', 'Roof layer')])
    w.add('Construction', [('Name', 'Window'), ('Layer', 'Glazing')])
    w.add('Construction', [('Name', 'Partition'), ('Layer', MAT_GYPSUM[0])])
    slab_layer = MAT_CONCRETE_HALF[0] if sc['thermal_mass'] else MAT_GYPSUM[0]
    w.add('Construction', [('Name', 'Interior Slab'), ('Layer', slab_layer)])

    w.add('DesignSpecification:OutdoorAir', [
        ('Name', 'DSOA'), ('Outdoor Air Method', 'Sum'),
        ('Outdoor Air Flow per Person', sc['oa_per_person_ls'] / 1000.0),
        ('Outdoor Air Flow per Zone Floor Area', sc['oa_per_area_ls_m2'] / 1000.0),
        ('Outdoor Air Flow per Zone', 0.0),
        ('Outdoor Air Flow Air Changes per Hour', float(sc['oa_ach'])),   # added to Rp/Ra (method Sum)
        ('Outdoor Air Schedule Name', 'OA_SCH')])

    hr_type = 'None'
    if sc['erv_latent_eff'] > 0:
        hr_type = 'Enthalpy'
    elif sc['erv_sensible_eff'] > 0:
        hr_type = 'Sensible'

    zones_info = []
    totals = {'ext_wall_m2': 0.0, 'window_m2': 0.0, 'roof_m2': 0.0, 'floor_m2': 0.0}
    for fkey, z0, scale, is_ground, has_roof in floors:
        zt = z0 + h
        floor_vol = length * width * h
        # Exterior wall area of this floor, without walls marked adiabatic
        # (infiltration is shared out over the exposed walls only).
        ext_wall_floor = sum(math.hypot(p[e][0] - p[(e + 1) % len(p)][0], p[e][1] - p[(e + 1) % len(p)][1]) * h
                             for _, p, ext in polys for e in ext
                             if not is_adiabatic_edge(sc, p[e], p[(e + 1) % len(p)]))
        for suffix, pts, ext_edges in polys:
            zn = '%s_%s' % (fkey, suffix)
            area = polygon_area(pts)
            info = {'name': zn, 'floor': fkey, 'scale': scale, 'floor_m2': area,
                    'ext_wall_m2': 0.0, 'window_m2': 0.0, 'roof_m2': area if has_roof and not sc.get('adiabatic_roof') else 0.0}
            w.add('Zone', [('Name', zn), ('Direction of Relative North', 0.0), ('X Origin', 0.0),
                           ('Y Origin', 0.0), ('Z Origin', 0.0), ('Type', 1), ('Multiplier', 1)])
            n = len(pts)
            exposed_perim = 0.0
            for e in range(n):
                a, b = pts[e], pts[(e + 1) % n]
                verts = [(a[0], a[1], zt), (a[0], a[1], z0), (b[0], b[1], z0), (b[0], b[1], zt)]
                sname = '%s Wall %d' % (zn, e + 1)
                if e in ext_edges and is_adiabatic_edge(sc, a, b):
                    # Party wall: the exterior construction (it still stores
                    # heat) with no heat flow through it, no windows, no sun.
                    w.add('BuildingSurface:Detailed', [
                        ('Name', sname), ('Surface Type', 'Wall'), ('Construction Name', 'Ext Wall'),
                        ('Zone Name', zn), ('Space Name', ''), ('Outside Boundary Condition', 'Adiabatic'),
                        ('Outside Boundary Condition Object', ''), ('Sun Exposure', 'NoSun'),
                        ('Wind Exposure', 'NoWind'), ('View Factor to Ground', 'autocalculate')] +
                        _verts_fields(verts))
                elif e in ext_edges:
                    seg = math.hypot(b[0] - a[0], b[1] - a[1])
                    exposed_perim += seg
                    info['ext_wall_m2'] += seg * h
                    w.add('BuildingSurface:Detailed', [
                        ('Name', sname), ('Surface Type', 'Wall'), ('Construction Name', 'Ext Wall'),
                        ('Zone Name', zn), ('Space Name', ''), ('Outside Boundary Condition', 'Outdoors'),
                        ('Outside Boundary Condition Object', ''), ('Sun Exposure', 'SunExposed'),
                        ('Wind Exposure', 'WindExposed'), ('View Factor to Ground', 'autocalculate')] +
                        _verts_fields(verts))
                    win = window_rect(a, b, z0, h, sc['wwr'])
                    if win:
                        wverts, warea = win
                        info['window_m2'] += warea
                        wn = '%s Win %d' % (zn, e + 1)
                        w.add('FenestrationSurface:Detailed', [
                            ('Name', wn), ('Surface Type', 'Window'), ('Construction Name', 'Window'),
                            ('Building Surface Name', sname), ('Outside Boundary Condition Object', ''),
                            ('View Factor to Ground', 'autocalculate'), ('Frame and Divider Name', ''),
                            ('Multiplier', 1.0)] + _verts_fields(wverts))
                        # Numeric guard, not a design value: a projection factor
                        # this small gives a sub-millimetre overhang whose area
                        # EnergyPlus reads as 0 (severe "illegal surface area",
                        # then fatal). Its shading effect is nil, so skip it.
                        if sc['overhang_pf'] >= OVERHANG_PF_MIN:
                            w.add('Shading:Overhang:Projection', [
                                ('Name', wn + ' Overhang'), ('Window or Door Name', wn),
                                ('Height above Window or Door', 0.0), ('Tilt Angle from Window/Door', 90.0),
                                ('Left extension from Window/Door Width', 0.0),
                                ('Right extension from Window/Door Width', 0.0),
                                ('Depth as Fraction of Window/Door Height', float(sc['overhang_pf']))])
                else:
                    w.add('BuildingSurface:Detailed', [
                        ('Name', sname), ('Surface Type', 'Wall'), ('Construction Name', 'Partition'),
                        ('Zone Name', zn), ('Space Name', ''), ('Outside Boundary Condition', 'Adiabatic'),
                        ('Outside Boundary Condition Object', ''), ('Sun Exposure', 'NoSun'),
                        ('Wind Exposure', 'NoWind'), ('View Factor to Ground', 'autocalculate')] +
                        _verts_fields(verts))
            # Floor (normal down: clockwise seen from above)
            fverts = [(x, y, z0) for x, y in reversed(pts)]
            if is_ground and not sc.get('adiabatic_floor'):
                cname = '%s FFloor' % zn
                w.add('Construction:FfactorGroundFloor', [
                    ('Name', cname), ('F-Factor', float(sc['slab_f_factor_w_mk'])),
                    ('Area', area), ('PerimeterExposed', exposed_perim)])
                w.add('BuildingSurface:Detailed', [
                    ('Name', zn + ' Floor'), ('Surface Type', 'Floor'), ('Construction Name', cname),
                    ('Zone Name', zn), ('Space Name', ''), ('Outside Boundary Condition', 'GroundFCfactorMethod'),
                    ('Outside Boundary Condition Object', ''), ('Sun Exposure', 'NoSun'),
                    ('Wind Exposure', 'NoWind'), ('View Factor to Ground', 'autocalculate')] +
                    _verts_fields(fverts))
            else:
                w.add('BuildingSurface:Detailed', [
                    ('Name', zn + ' Floor'), ('Surface Type', 'Floor'), ('Construction Name', 'Interior Slab'),
                    ('Zone Name', zn), ('Space Name', ''), ('Outside Boundary Condition', 'Adiabatic'),
                    ('Outside Boundary Condition Object', ''), ('Sun Exposure', 'NoSun'),
                    ('Wind Exposure', 'NoWind'), ('View Factor to Ground', 'autocalculate')] +
                    _verts_fields(fverts))
            cverts = [(x, y, zt) for x, y in pts]
            if has_roof and not sc.get('adiabatic_roof'):
                w.add('BuildingSurface:Detailed', [
                    ('Name', zn + ' Roof'), ('Surface Type', 'Roof'), ('Construction Name', 'Roof'),
                    ('Zone Name', zn), ('Space Name', ''), ('Outside Boundary Condition', 'Outdoors'),
                    ('Outside Boundary Condition Object', ''), ('Sun Exposure', 'SunExposed'),
                    ('Wind Exposure', 'WindExposed'), ('View Factor to Ground', 'autocalculate')] +
                    _verts_fields(cverts))
            else:
                w.add('BuildingSurface:Detailed', [
                    ('Name', zn + ' Ceiling'), ('Surface Type', 'Ceiling'), ('Construction Name', 'Interior Slab'),
                    ('Zone Name', zn), ('Space Name', ''), ('Outside Boundary Condition', 'Adiabatic'),
                    ('Outside Boundary Condition Object', ''), ('Sun Exposure', 'NoSun'),
                    ('Wind Exposure', 'NoWind'), ('View Factor to Ground', 'autocalculate')] +
                    _verts_fields(cverts))

            # Internal gains
            w.add('People', [
                ('Name', zn + ' People'), ('Zone or ZoneList or Space or SpaceList Name', zn),
                ('Number of People Schedule Name', 'OCC_SCH'), ('Number of People Calculation Method', 'Area/Person'),
                ('Number of People', ''), ('People per Floor Area', ''),
                ('Floor Area per Person', float(sc['m2_per_person'])), ('Fraction Radiant', 0.3),
                ('Sensible Heat Fraction', 'autocalculate'), ('Activity Level Schedule Name', 'ACTIVITY_SCH')])
            w.add('Lights', [
                ('Name', zn + ' Lights'), ('Zone or ZoneList or Space or SpaceList Name', zn),
                ('Schedule Name', 'GAINS_SCH'), ('Design Level Calculation Method', 'Watts/Area'),
                ('Lighting Level', ''), ('Watts per Floor Area', float(sc['lpd_w_m2']))])
            w.add('ElectricEquipment', [
                ('Name', zn + ' Equipment'), ('Zone or ZoneList or Space or SpaceList Name', zn),
                ('Schedule Name', 'GAINS_SCH'), ('Design Level Calculation Method', 'Watts/Area'),
                ('Design Level', ''), ('Watts per Floor Area', float(sc['epd_w_m2']))])
            # Infiltration: floor air changes distributed by exterior wall area.
            share = info['ext_wall_m2'] / ext_wall_floor if ext_wall_floor > 0 else 0.0
            q = sc['infiltration_ach'] * floor_vol / 3600.0 * share
            info['infiltration_m3s'] = q
            if q > 0:
                w.add('ZoneInfiltration:DesignFlowRate', [
                    ('Name', zn + ' Infiltration'), ('Zone or ZoneList or Space or SpaceList Name', zn),
                    ('Schedule Name', 'ALWAYS_ON'), ('Design Flow Rate Calculation Method', 'Flow/Zone'),
                    ('Design Flow Rate', q), ('Flow Rate per Floor Area', ''),
                    ('Flow Rate per Exterior Surface Area', ''), ('Air Changes per Hour', ''),
                    ('Constant Term Coefficient', 1.0), ('Temperature Term Coefficient', 0.0),
                    ('Velocity Term Coefficient', 0.0), ('Velocity Squared Term Coefficient', 0.0)])

            # Sizing and ideal loads HVAC
            w.add('Sizing:Zone', [
                ('Zone or ZoneList Name', zn),
                ('Zone Cooling Design Supply Air Temperature Input Method', 'SupplyAirTemperature'),
                ('Zone Cooling Design Supply Air Temperature', float(sc['cooling_supply_air_c'])),
                ('Zone Cooling Design Supply Air Temperature Difference', ''),
                ('Zone Heating Design Supply Air Temperature Input Method', 'SupplyAirTemperature'),
                ('Zone Heating Design Supply Air Temperature', float(sc['heating_supply_air_c'])),
                ('Zone Heating Design Supply Air Temperature Difference', ''),
                ('Zone Cooling Design Supply Air Humidity Ratio', 0.0077),
                ('Zone Heating Design Supply Air Humidity Ratio', 0.0156),
                ('Design Specification Outdoor Air Object Name', 'DSOA'),
                ('Zone Heating Sizing Factor', ''), ('Zone Cooling Sizing Factor', ''),
                ('Cooling Design Air Flow Method', 'DesignDay'), ('Cooling Design Air Flow Rate', ''),
                ('Cooling Minimum Air Flow per Zone Floor Area', ''), ('Cooling Minimum Air Flow', ''),
                ('Cooling Minimum Air Flow Fraction', ''), ('Heating Design Air Flow Method', 'DesignDay')])
            w.add('ZoneHVAC:IdealLoadsAirSystem', [
                ('Name', zn + ' Ideal Loads'), ('Availability Schedule Name', ''),
                ('Zone Supply Air Node Name', zn + ' Supply Inlet'),
                ('Zone Exhaust Air Node Name', zn + ' Exhaust Outlet'),
                ('System Inlet Air Node Name', ''),
                ('Maximum Heating Supply Air Temperature', float(sc['heating_supply_air_c'])),
                ('Minimum Cooling Supply Air Temperature', float(sc['cooling_supply_air_c'])),
                ('Maximum Heating Supply Air Humidity Ratio', 0.0156),
                ('Minimum Cooling Supply Air Humidity Ratio', 0.0077),
                ('Heating Limit', 'NoLimit'), ('Maximum Heating Air Flow Rate', ''),
                ('Maximum Sensible Heating Capacity', ''), ('Cooling Limit', 'NoLimit'),
                ('Maximum Cooling Air Flow Rate', ''), ('Maximum Total Cooling Capacity', ''),
                ('Heating Availability Schedule Name', ''), ('Cooling Availability Schedule Name', ''),
                ('Dehumidification Control Type', 'ConstantSupplyHumidityRatio'),
                ('Cooling Sensible Heat Ratio', ''), ('Humidification Control Type', 'None'),
                ('Design Specification Outdoor Air Object Name', 'DSOA'),
                ('Outdoor Air Inlet Node Name', ''), ('Demand Controlled Ventilation Type', 'None'),
                ('Outdoor Air Economizer Type', 'NoEconomizer'), ('Heat Recovery Type', hr_type),
                ('Sensible Heat Recovery Effectiveness', float(sc['erv_sensible_eff'])),
                ('Latent Heat Recovery Effectiveness', float(sc['erv_latent_eff']))])
            w.add('ZoneHVAC:EquipmentList', [
                ('Name', zn + ' Equipment List'), ('Load Distribution Scheme', 'SequentialLoad'),
                ('Zone Equipment Object Type', 'ZoneHVAC:IdealLoadsAirSystem'),
                ('Zone Equipment Name', zn + ' Ideal Loads'),
                ('Zone Equipment Cooling Sequence', 1), ('Zone Equipment Heating or No-Load Sequence', 1),
                ('Zone Equipment Sequential Cooling Fraction Schedule Name', ''),
                ('Zone Equipment Sequential Heating Fraction Schedule Name', '')])
            w.add('ZoneHVAC:EquipmentConnections', [
                ('Zone Name', zn), ('Zone Conditioning Equipment List Name', zn + ' Equipment List'),
                ('Zone Air Inlet Node or NodeList Name', zn + ' Supply Inlet'),
                ('Zone Air Exhaust Node or NodeList Name', zn + ' Exhaust Outlet'),
                ('Zone Air Node Name', zn + ' Zone Air Node'),
                ('Zone Return Air Node or NodeList Name', '')])
            w.add('ZoneControl:Thermostat', [
                ('Name', zn + ' Thermostat'), ('Zone or ZoneList Name', zn),
                ('Control Type Schedule Name', 'DUAL_CTRL'),
                ('Control 1 Object Type', 'ThermostatSetpoint:DualSetpoint'), ('Control 1 Name', 'DualSP')])

            for k in ('ext_wall_m2', 'window_m2', 'roof_m2', 'floor_m2'):
                totals[k] += info[k] * scale
            zones_info.append(info)

    for var in (ANNUAL_VARIABLES if annual else OUTPUT_VARIABLES):
        w.add('Output:Variable', [('Key Value', '*'), ('Variable Name', var),
                                  ('Reporting Frequency', 'Monthly' if annual else 'Timestep')])
    w.add('Output:Table:SummaryReports', [('Report Name', r) for r in (
        'InputVerificationandResultsSummary', 'EnvelopeSummary', 'HVACSizingSummary',
        'ZoneComponentLoadSummary')])
    w.add('OutputControl:Table:Style', [('Column Separator', 'HTML'), ('Unit Conversion', 'None')])
    w.add('Output:SQLite', [('Option Type', 'SimpleAndTabular')])

    model = {
        'length_m': length, 'width_m': width,
        'floors': [{'key': f[0], 'z0': f[1], 'scale': f[2], 'ground': f[3], 'roof': f[4]} for f in floors],
        'zoning': 'perimeter+core' if len(polys) > 1 else 'single zone per floor',
        'zones': zones_info,
        'totals': totals,
        'wwr_modelled': totals['window_m2'] / totals['ext_wall_m2'] if totals['ext_wall_m2'] else 0.0,
        'design_day_env_names': env_names,
        'timesteps_per_hour': TIMESTEPS_PER_HOUR,
        'annual': annual,
        'eplus_version_target': eplus_version,
    }
    return w.text(), model

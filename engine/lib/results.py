"""Read an EnergyPlus eplusout.sql from a design-day run into the tool's
results structure.

Scaling: the middle floor stands in for (N - 2) floors. Every zone result is
multiplied by its floor's `scale` from the model info before summing.

Peaks are one-hour averages: every series is averaged over a sliding window
of one hour of timesteps (model['timesteps_per_hour']), as hourly design-day
load methods report them. A single-timestep value can be a start-up transient
(for example stored moisture removed in the first 10 minutes after the
ventilation starts) whose size depends on the timestep length; it is kept for
information as `block['max_timestep_w']`, not used as the peak.

Block (coincident) peak = max over one-hour windows of the scaled sum across zones.
Sum of zone peaks       = scaled sum of each zone's own one-hour maximum.
"""
import sqlite3

V_CLG_TOT = 'Zone Ideal Loads Supply Air Total Cooling Rate'
V_CLG_SEN = 'Zone Ideal Loads Supply Air Sensible Cooling Rate'
V_CLG_LAT = 'Zone Ideal Loads Supply Air Latent Cooling Rate'
V_HTG_TOT = 'Zone Ideal Loads Supply Air Total Heating Rate'
V_HTG_SEN = 'Zone Ideal Loads Supply Air Sensible Heating Rate'
V_ZN_CLG = 'Zone Ideal Loads Zone Sensible Cooling Rate'
V_ZN_HTG = 'Zone Ideal Loads Zone Sensible Heating Rate'
V_OA_CLG = 'Zone Ideal Loads Outdoor Air Total Cooling Rate'
V_OA_HTG = 'Zone Ideal Loads Outdoor Air Total Heating Rate'
# The outdoor-air rates above are the ventilation load BEFORE heat recovery
# (checked against hand calcs on the first real runs); the recovered amount
# is reported separately and is already netted out of the supply-air totals.
V_HR_CLG = 'Zone Ideal Loads Heat Recovery Total Cooling Rate'
V_HR_HTG = 'Zone Ideal Loads Heat Recovery Total Heating Rate'
V_SA_FLOW = 'Zone Ideal Loads Supply Air Standard Density Volume Flow Rate'
V_OA_FLOW = 'Zone Ideal Loads Outdoor Air Standard Density Volume Flow Rate'
V_OAT = 'Site Outdoor Air Drybulb Temperature'

COMPONENT_COLUMNS = ['Sensible - Instant', 'Sensible - Delayed', 'Sensible - Return Air', 'Latent', 'Total']


def _cols(con, table):
    return [r[1] for r in con.execute('PRAGMA table_info(%s)' % table)]


def _time_label(hour, minute):
    total = (int(hour) - 1) * 60 + int(minute)
    return '%02d:%02d' % (total // 60, total % 60)


def parse_sql(sql_path, model):
    con = sqlite3.connect(sql_path)
    try:
        return _parse(con, model)
    finally:
        con.close()


def _parse(con, model):
    scale = {z['name'].upper(): z['scale'] for z in model['zones']}
    floor_of = {z['name'].upper(): z.get('floor', '') for z in model['zones']}
    env_key = model['design_day_env_names']   # upper-case env name -> key

    envs = {}
    for idx, name in con.execute('SELECT EnvironmentPeriodIndex, EnvironmentName FROM EnvironmentPeriods'):
        key = env_key.get((name or '').upper())
        if key:
            envs[idx] = key

    tcols = _cols(con, 'Time')
    warm = 'AND (WarmupFlag IS NULL OR WarmupFlag = 0)' if 'WarmupFlag' in tcols else ''
    times = {}
    for ti, env, hr, mi in con.execute(
            'SELECT TimeIndex, EnvironmentPeriodIndex, Hour, Minute FROM Time WHERE EnvironmentPeriodIndex IS NOT NULL ' + warm):
        if env in envs:
            times[ti] = (envs[env], _time_label(hr, mi))

    dict_rows = con.execute('SELECT ReportDataDictionaryIndex, KeyValue, Name FROM ReportDataDictionary').fetchall()
    var_of = {}
    for idx, key, name in dict_rows:
        var_of[idx] = (name, (key or '').upper())

    # series[env][var][time_index] = scaled building sum
    # zser[env][var][zone][time_index] = unscaled zone value
    series, zser, oat = {}, {}, {}
    q = 'SELECT TimeIndex, ReportDataDictionaryIndex, Value FROM ReportData'
    for ti, di, val in con.execute(q):
        if ti not in times or di not in var_of:
            continue
        env, _ = times[ti]
        name, key = var_of[di]
        if name == V_OAT:
            oat.setdefault(env, {})[ti] = val
            continue
        zone = key[:-len(' IDEAL LOADS')] if key.endswith(' IDEAL LOADS') else key
        if zone not in scale:
            continue
        s = scale[zone]
        series.setdefault(env, {}).setdefault(name, {})
        series[env][name][ti] = series[env][name].get(ti, 0.0) + val * s
        zser.setdefault(env, {}).setdefault(name, {}).setdefault(zone, {})[ti] = val

    n = max(1, int(model.get('timesteps_per_hour', 1)))
    design_days = {}
    for env in sorted(set(times[t][0] for t in times)):
        is_htg = env.startswith('htg')
        main = V_HTG_TOT if is_htg else V_CLG_TOT
        ser = series.get(env, {})
        if main not in ser or not ser[main]:
            continue
        steps = sorted(ser[main])
        avg_main = hourly(ser[main], steps, n)
        ti_peak = max(avg_main, key=lambda t: (avg_main[t], -t))
        window = steps[steps.index(ti_peak) - n + 1:steps.index(ti_peak) + 1]

        def at(v, src=ser):
            vals = src.get(v)
            if not vals or any(t not in vals for t in window):
                return None
            return sum(vals[t] for t in window) / len(window)
        ti_inst = max(steps, key=lambda t: (ser[main][t], -t))
        block = {
            'total_w': avg_main[ti_peak],
            'sensible_w': at(V_HTG_SEN if is_htg else V_CLG_SEN),
            'latent_w': None if is_htg else at(V_CLG_LAT),
            'zone_sensible_w': at(V_ZN_HTG if is_htg else V_ZN_CLG),
            'outdoor_air_w': at(V_OA_HTG if is_htg else V_OA_CLG),
            'heat_recovery_w': at(V_HR_HTG if is_htg else V_HR_CLG),
            'supply_air_m3s': at(V_SA_FLOW),
            'outdoor_air_m3s': at(V_OA_FLOW),
            'time': times[ti_peak][1],            # end of the peak hour
            'averaging_minutes': 60 if n > 1 else None,
            'outdoor_db_c': at('oat', {'oat': oat.get(env, {})}),
            # Highest single-timestep value (start-up / pull-down transients), for information.
            'max_timestep_w': ser[main][ti_inst],
            'max_timestep_time': times[ti_inst][1],
        }
        sop = sum(max(hourly(vals, sorted(vals), n).values()) * scale[z]
                  for z, vals in zser.get(env, {}).get(main, {}).items())
        # Profile of the block total (for charts): keep every timestep.
        profile = [[times[t][1], ser[main][t]] for t in steps]
        # Clock-hour means of the block total, saved with training runs so a
        # change to the peak definition needs a refit, not new EnergyPlus runs.
        hourly_means = [sum(ser[main][t] for t in steps[i:i + n]) / len(steps[i:i + n])
                        for i in range(0, len(steps), n)]
        # Per modelled floor (G, M, T or S), one floor's worth (unscaled):
        # clock-hour block totals plus the ventilation load and heat recovered
        # in that floor's peak hour. Floors exchange no heat (adiabatic slabs),
        # so a building of mixed uses is the sum of its floors.
        floors = {}
        for fk in sorted(set(floor_of.values())):
            zs = [z for z, f in floor_of.items() if f == fk]

            def fsum(var):
                zv = zser.get(env, {}).get(var, {})
                return {t: sum(zv.get(z, {}).get(t, 0.0) for z in zs) for t in steps}
            ftot = fsum(main)
            fh = [sum(ftot[t] for t in steps[i:i + n]) / len(steps[i:i + n]) for i in range(0, len(steps), n)]
            ipk = max(range(len(fh)), key=lambda i: (fh[i], -i))
            hours = steps[ipk * n:(ipk + 1) * n]
            foa, fhr = fsum(V_OA_HTG if is_htg else V_OA_CLG), fsum(V_HR_HTG if is_htg else V_HR_CLG)
            floors[fk] = {'hourly_w': fh, 'oa_w': sum(foa[t] for t in hours) / len(hours),
                          'hr_w': sum(fhr[t] for t in hours) / len(hours)}
        design_days[env] = {
            'key': env,
            'floors': floors,
            'kind': 'heating' if is_htg else 'cooling',
            'block': block,
            'sum_of_zone_peaks_w': sop,
            'profile': profile,
            'hourly_means_w': hourly_means,
        }

    return {
        'eplus_version': _eplus_version(con),
        'design_days': design_days,
        'zone_sizing': _zone_sizes(con, scale),
        'components': _components(con, scale),
        'components_by_floor': _components(con, {z: 1 for z in scale}, floor_of),
    }


def hourly(vals, steps, n):
    """Mean over each window of n consecutive timesteps, keyed by the window's
    last timestep. Windows shorter than n (start of the day) are skipped unless
    the day has fewer than n steps."""
    if len(steps) < n:
        return {steps[-1]: sum(vals[t] for t in steps) / len(steps)}
    return {steps[i]: sum(vals[t] for t in steps[i - n + 1:i + 1]) / n for i in range(n - 1, len(steps))}


def _eplus_version(con):
    try:
        row = con.execute('SELECT EnergyPlusVersion FROM Simulations').fetchone()
        return row[0] if row else None
    except sqlite3.Error:
        return None


def _zone_sizes(con, scale):
    try:
        cols = _cols(con, 'ZoneSizes')
    except sqlite3.Error:
        return []
    if not cols:
        return []
    want = [c for c in ('ZoneName', 'LoadType', 'CalcDesLoad', 'CalcDesFlow', 'DesDayName', 'PeakHrMin',
                        'PeakTemp', 'PeakHumRat', 'CalcOutsideAirFlow') if c in cols]
    out = []
    for row in con.execute('SELECT %s FROM ZoneSizes' % ', '.join(want)):
        r = dict(zip(want, row))
        z = (r.get('ZoneName') or '').upper()
        r['scale'] = scale.get(z, 1)
        out.append(r)
    return out


def _components(con, scale, floor_of=None):
    """Zone component load tables, scaled and summed across zones.
    These are each zone's own peak (non-coincident). With floor_of, the sums
    are kept per modelled floor instead: {floor: {'cooling': …, 'heating': …}}."""
    try:
        rows = con.execute(
            "SELECT ReportForString, TableName, RowName, ColumnName, Value FROM TabularDataWithStrings "
            "WHERE ReportName IN ('ZoneComponentLoadSummary', 'Zone Component Load Summary') AND TableName IN "
            "('Estimated Cooling Peak Load Components', 'Estimated Heating Peak Load Components')").fetchall()
    except sqlite3.Error:
        return None
    if not rows:
        return None
    out = {'cooling': {}, 'heating': {}}
    by_floor = {}
    for zone, table, row, col, val in rows:
        if col not in COMPONENT_COLUMNS or row in ('Grand Total',):
            continue
        z = (zone or '').upper()
        if z not in scale:
            continue
        try:
            v = float(val)
        except (TypeError, ValueError):
            continue
        kind = 'cooling' if 'Cooling' in table else 'heating'
        tgt = by_floor.setdefault(floor_of[z], {'cooling': {}, 'heating': {}}) if floor_of else out
        rec = tgt[kind].setdefault(row.strip(), {c: 0.0 for c in COMPONENT_COLUMNS})
        rec[col] += v * scale[z]
    for o in ([out] if not floor_of else list(by_floor.values())):
        for kind in o:
            o[kind] = {k: v for k, v in o[kind].items() if any(abs(x) > 1e-9 for x in v.values())}
    return by_floor if floor_of else out


# EnergyPlus component rows -> the categories the page shows. Interzone
# surfaces are adiabatic here, so their rows are heat stored in and released
# by the floor/ceiling slabs and partitions ("internal mass").
COMPONENT_GROUPS = (
    ('people', ('People',)),
    ('lighting', ('Lights',)),
    ('equipment', ('Equipment', 'Refrigeration', 'Water Use Equipment', 'HVAC Equipment Losses',
                   'Power Generation Equipment')),
    ('window_solar', ('Fenestration Solar',)),
    ('window_conduction', ('Fenestration Conduction',)),
    ('walls', ('Exterior Wall', 'Other Wall', 'Ground Contact Wall', 'Opaque Door')),
    ('roof', ('Roof', 'Other Roof')),
    ('ground_floor', ('Ground Contact Floor', 'Exterior Floor', 'Other Floor')),
    ('infiltration', ('Infiltration',)),
    ('internal_mass', ('Interzone Ceiling', 'Interzone Floor', 'Interzone Wall', 'Interzone Mixing',
                       'Zone Ventilation', 'DOAS Direct to Zone')),
)
SENSIBLE_COLUMNS = ('Sensible - Instant', 'Sensible - Delayed', 'Sensible - Return Air')


def component_groups(components):
    """Zone-level load components per category, W, from EnergyPlus's Zone
    Component Load Summary (each zone at its own design peak, scaled).

    Cooling counts sensible + latent (the coil dehumidifies). Heating counts
    sensible only, as a positive loss: the ideal-loads system does not
    humidify, so EnergyPlus's latent heating rows are not a coil load."""
    if not components:
        return None
    out = {}
    for kind in ('cooling', 'heating'):
        rows = components.get(kind) or {}
        grp = {}
        for cat, names in COMPONENT_GROUPS:
            v = 0.0
            for name in names:
                r = rows.get(name)
                if not r:
                    continue
                v += r.get('Total', 0.0) if kind == 'cooling' else sum(r.get(c, 0.0) for c in SENSIBLE_COLUMNS)
            grp[cat] = v if kind == 'cooling' else -v
        out[kind] = grp
    return out


def breakdown(groups, block):
    """Where a block peak comes from, W per category, summing to block total.

    The zone part of the peak (total less the ventilation load net of heat
    recovery) is split in the proportions of the zone components; the
    ventilation load before recovery and the recovery credit come from the
    ideal-loads outputs at the block peak hour. Mirrored in web/core.js."""
    total = block['total_w']
    oa = block.get('outdoor_air_w') or 0.0
    hr = block.get('heat_recovery_w') or 0.0
    zone_part = total - oa + hr
    s = sum(groups.values()) if groups else 0.0
    out = {cat: (groups[cat] / s * zone_part if abs(s) > 1e-9 else 0.0) for cat, _ in COMPONENT_GROUPS}
    out['ventilation'] = oa
    out['heat_recovery'] = -hr
    return out


def parse_err(err_path):
    out = {'warnings': 0, 'severe': 0, 'fatal': [], 'severe_messages': []}
    try:
        with open(err_path, encoding='latin-1') as f:
            for line in f:
                s = line.strip()
                if s.startswith('** Warning **'):
                    out['warnings'] += 1
                elif s.startswith('** Severe  **'):
                    out['severe'] += 1
                    if len(out['severe_messages']) < 20:
                        out['severe_messages'].append(s)
                elif s.startswith('**  Fatal  **'):
                    out['fatal'].append(s)
    except OSError:
        pass
    return out


def summarize(design_days, cooling_pct='0.4', heating_pct='99.6'):
    """Pick the governing design days for a chosen percentile.
    Cooling governs on the larger total of the dry-bulb and dew-point days."""
    c_candidates = [design_days.get('clg_db_%s' % cooling_pct), design_days.get('clg_dp_%s' % cooling_pct)]
    c_candidates = [c for c in c_candidates if c]
    clg = max(c_candidates, key=lambda d: d['block']['total_w']) if c_candidates else None
    htg = design_days.get('htg_%s' % heating_pct)
    return clg, htg

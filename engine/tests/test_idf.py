"""Tests for the IDF builder.

Runs with plain python (no EnergyPlus needed):  python3 -m unittest discover engine/tests

If the `openstudio` Python package is importable, the generated IDF is also
validated against the EnergyPlus IDD that ships with it: field names in the
order we emit them must match the IDD, and the file must pass OpenStudio's
strict validity check.
"""
import math
import os
import re
import sys
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))

from lib import idf, scenario, weather  # noqa: E402

WEATHER = os.path.join(os.path.dirname(HERE), 'weather')
STEM = 'USA_IL_Chicago-OHare.Intl.AP.725300_TMY3'

try:
    import openstudio  # noqa: F401
    HAVE_OS = True
except ImportError:
    HAVE_OS = False


def _fmt_num(v):
    return idf._fmt(float(v))


def _build(**over):
    ddy = weather.parse_ddy(os.path.join(WEATHER, STEM + '.ddy'))
    stat = weather.parse_stat(os.path.join(WEATHER, STEM + '.stat'))
    user = {'type': 'office', 'station': 'chicago', 'gfa_m2': 10000, 'n_floors': 4}
    user.update(over)
    sc, _ = scenario.resolve(user, stat['climate_zone'])
    w_text, model = idf.build(sc, ddy, stat)
    return sc, w_text, model


class GeometryTests(unittest.TestCase):
    def test_floor_area_and_scale(self):
        for n in (1, 2, 3, 7):
            sc, _, model = _build(n_floors=n)
            self.assertAlmostEqual(model['totals']['floor_m2'], sc['gfa_m2'], delta=1e-6 * sc['gfa_m2'])
            self.assertEqual(sum(f['scale'] for f in model['floors']), n)

    def test_wwr_reproduced(self):
        for wwr in (0.1, 0.4, 0.8, 0.95):
            _, _, model = _build(wwr=wwr)
            self.assertAlmostEqual(model['wwr_modelled'], wwr, places=6)

    def test_zone_polygons_ccw_and_tile(self):
        L, W, d = 50.0, 30.0, 4.57
        polys = idf.zone_polygons(L, W, d)
        self.assertEqual(len(polys), 5)
        total = 0.0
        for _, pts, _ in polys:
            a = idf.polygon_area(pts)
            self.assertGreater(a, 0)   # counter-clockwise
            total += a
        self.assertAlmostEqual(total, L * W, places=6)

    def test_shallow_plate_single_zone(self):
        self.assertEqual(len(idf.zone_polygons(10.0, 8.0, 4.57)), 1)

    def test_wall_normals_point_outward(self):
        # For exterior edge a->b of a CCW footprint, outward normal = (dy, -dx).
        L, W = 40.0, 20.0
        for _, pts, ext in idf.zone_polygons(L, W, 4.57):
            for e in ext:
                a, b = pts[e], pts[(e + 1) % len(pts)]
                nx, ny = (b[1] - a[1]), -(b[0] - a[0])
                mx, my = (a[0] + b[0]) / 2, (a[1] + b[1]) / 2
                cx, cy = L / 2, W / 2
                self.assertGreater(nx * (mx - cx) + ny * (my - cy), 0)

    def test_schedule_compression(self):
        prof = idf.hourly_profile(8, 10, 1.0, 0.0)
        self.assertEqual(idf.compact_day(prof), ['Until: 08:00', '0', 'Until: 18:00', '1', 'Until: 24:00', '0'])
        wrap = idf.hourly_profile(20, 8, 1.0, 0.0)
        self.assertEqual(sum(wrap), 8)
        self.assertEqual(idf.compact_day([1.0] * 24), ['Until: 24:00', '1'])

    def _schedule(self, text, name):
        block = text[re.search(r'Schedule:Compact,\n\s+%s,' % name, text).start():]
        block = block[:block.index(';') + 1]
        return [ln.split('!')[0].strip().rstrip(',;') for ln in block.splitlines()[4:]]

    def test_outdoor_air_follows_occupancy_by_default(self):
        _, text, _ = _build()
        oa = self._schedule(text, 'OA_SCH')
        self.assertEqual(oa[:8], ['For: SummerDesignDay', 'Until: 08:00', '0', 'Until: 18:00', '1', 'Until: 24:00', '0',
                                  'For: WinterDesignDay'])

    def test_lab_ventilates_continuously(self):
        _, text, _ = _build(type='lab')
        self.assertEqual(self._schedule(text, 'OA_SCH')[:3], ['For: SummerDesignDay', 'Until: 24:00', '1'])

    def test_pre_start_moves_ventilation_and_setpoints_earlier(self):
        sc, text, _ = _build(hvac_start_before_occ_h=2, setup_cool_c=29.0)
        self.assertEqual(self._schedule(text, 'OA_SCH')[1:5], ['Until: 06:00', '0', 'Until: 18:00', '1'])
        self.assertEqual(self._schedule(text, 'CLG_SP')[1:5], ['Until: 06:00', '29', 'Until: 18:00', _fmt_num(sc['t_cool_c'])])
        # People and gains still start at occupancy.
        self.assertEqual(self._schedule(text, 'OCC_SCH')[1:3], ['Until: 08:00', '0'])

    def test_peaks_averaged_over_an_hour_of_timesteps(self):
        _, text, model = _build()
        self.assertRegex(text, r'Timestep,\n\s+%d;' % idf.TIMESTEPS_PER_HOUR)
        self.assertEqual(model['timesteps_per_hour'], idf.TIMESTEPS_PER_HOUR)

    def test_weekdays_only_schedules(self):
        _, text, _ = _build(occ_days_per_week=5, setup_cool_c=29.0)
        occ = self._schedule(text, 'OCC_SCH')
        i = occ.index('For: Weekdays')
        self.assertEqual(occ[i + 1:i + 7], ['Until: 08:00', '0', 'Until: 18:00', '1', 'Until: 24:00', '0'])
        self.assertEqual(occ[i + 7:i + 10], ['For: AllOtherDays', 'Until: 24:00', '0'])
        clg = self._schedule(text, 'CLG_SP')
        self.assertEqual(clg[clg.index('For: AllOtherDays') + 1:clg.index('For: AllOtherDays') + 3], ['Until: 24:00', '29'])
        # Design days keep the occupied profile, so peaks don't depend on the week.
        self.assertEqual(occ[:3], ['For: SummerDesignDay', 'Until: 08:00', '0'])
        self.assertEqual(idf.occupied_day_types(6), 'Weekdays Saturday')
        self.assertEqual(idf.occupied_day_types(3), 'Monday Tuesday Wednesday')

    def test_seven_day_week_matches_design_day_model(self):
        _, a, _ = _build()
        _, b, _ = _build(occ_days_per_week=7)
        self.assertEqual(a, b)

    def test_annual_run_period_and_monthly_outputs(self):
        ddy = weather.parse_ddy(os.path.join(WEATHER, STEM + '.ddy'))
        stat = weather.parse_stat(os.path.join(WEATHER, STEM + '.stat'))
        sc, _ = scenario.resolve({'type': 'office', 'station': 'chicago', 'gfa_m2': 10000, 'n_floors': 4}, stat['climate_zone'])
        text, model = idf.build(sc, ddy, stat, annual=True)
        self.assertIn('RunPeriod,', text)
        self.assertRegex(text, r'Run Simulation for Weather File Run Periods')
        self.assertIn('Lights Electricity Energy', text)
        self.assertNotIn('Timestep;', text.split('Output:Variable')[-1])
        self.assertTrue(model['annual'])

    def test_infiltration_total_matches_ach(self):
        sc, _, model = _build(infiltration_ach=0.3)
        q = sum(z['infiltration_m3s'] * z['scale'] for z in model['zones'])
        vol = sc['gfa_m2'] * sc['floor_to_floor_m']
        self.assertAlmostEqual(q, 0.3 * vol / 3600.0, places=9)

    def test_all_design_days_present(self):
        _, text, model = _build()
        self.assertEqual(len(model['design_day_env_names']), len(idf.DESIGN_DAY_ORDER))
        self.assertEqual(text.count('SizingPeriod:DesignDay,'), len(idf.DESIGN_DAY_ORDER))


class ReferenceIntegrityTests(unittest.TestCase):
    """Every name the model references must be defined somewhere."""

    def test_references_resolve(self):
        captured = {}
        orig = idf.IdfWriter

        class Spy(orig):
            def __init__(self):
                super().__init__()
                captured['w'] = self
        idf.IdfWriter = Spy
        try:
            _build(n_floors=5, overhang_pf=0.4, erv_sensible_eff=0.6)
        finally:
            idf.IdfWriter = orig
        objs = captured['w'].objects
        defined = {}
        for typ, fields in objs:
            if fields and fields[0][0] in ('Name', 'Zone Name') and typ != 'ZoneHVAC:EquipmentConnections':
                defined.setdefault(typ, set()).add(fields[0][1])
        zones = defined['Zone']
        constructions = defined.get('Construction', set()) | defined.get('Construction:FfactorGroundFloor', set())
        schedules = defined['Schedule:Compact']
        surfaces = defined['BuildingSurface:Detailed']
        windows = defined['FenestrationSurface:Detailed']
        materials = defined.get('Material', set()) | defined.get('Material:NoMass', set()) | \
            defined.get('WindowMaterial:SimpleGlazingSystem', set())
        limits = defined['ScheduleTypeLimits']
        checks = {
            'Zone Name': zones, 'Zone or ZoneList or Space or SpaceList Name': zones,
            'Zone or ZoneList Name': zones, 'Construction Name': constructions,
            'Building Surface Name': surfaces, 'Window or Door Name': windows,
            'Layer': materials, 'Schedule Type Limits Name': limits,
            'Zone Conditioning Equipment List Name': defined['ZoneHVAC:EquipmentList'],
            'Zone Equipment Name': defined['ZoneHVAC:IdealLoadsAirSystem'],
            'Design Specification Outdoor Air Object Name': defined['DesignSpecification:OutdoorAir'],
            'Control 1 Name': defined['ThermostatSetpoint:DualSetpoint'],
        }
        n = 0
        for typ, fields in objs:
            for name, val in fields:
                if name in checks and val not in ('', None):
                    self.assertIn(val, checks[name], '%s.%s -> %r' % (typ, name, val))
                    n += 1
                if name.endswith('Schedule Name') and val not in ('', None) and typ != 'Schedule:Compact':
                    self.assertIn(val, schedules, '%s.%s -> %r' % (typ, name, val))
                    n += 1
        self.assertGreater(n, 100)


class ScenarioTests(unittest.TestCase):
    def test_rejects_unknown_input(self):
        with self.assertRaises(scenario.ScenarioError):
            scenario.resolve({'type': 'office', 'station': 'x', 'bogus': 1}, '4A')

    def test_rejects_out_of_range(self):
        with self.assertRaises(scenario.ScenarioError):
            scenario.resolve({'type': 'office', 'station': 'x', 'wwr': 1.5}, '4A')

    def test_provenance_marks_user_values(self):
        sc, prov = scenario.resolve({'type': 'office', 'station': 'x', 'lpd_w_m2': 5}, '4A')
        self.assertEqual(sc['lpd_w_m2'], 5.0)
        self.assertEqual(prov['lpd_w_m2'], 'user')
        self.assertIn('62.1', prov['oa_per_person_ls'])


@unittest.skipUnless(HAVE_OS, 'openstudio package not installed')
class IddValidationTests(unittest.TestCase):
    def _check_names(self, writer_objects):
        import openstudio as o
        idd = o.IddFactory.instance().getIddFile(o.IddFileType('EnergyPlus'))
        for typ, fields in writer_objects:
            ob = idd.getObject(typ)
            self.assertTrue(ob.is_initialized(), typ)
            ob = ob.get()
            nonext = [f.name() for f in ob.nonextensibleFields()]
            ext = [f.name() for f in ob.extensibleGroup()]
            for i, (name, _) in enumerate(fields):
                if i < len(nonext):
                    expect = nonext[i]
                else:
                    j = (i - len(nonext)) % max(1, len(ext))
                    expect = ext[j] if ext else None
                # The IDD writes vertex fields as "Vertex 1 X-coordinate" in
                # some objects; compare ignoring the vertex index.
                norm = lambda s: s.replace('Vertex 1 ', 'Vertex ').replace('Vertex 2 ', 'Vertex ') \
                    .replace('Vertex 3 ', 'Vertex ').replace('Vertex 4 ', 'Vertex ')
                self.assertEqual(norm(name), norm(expect or ''), '%s field %d' % (typ, i))

    def _validate(self, text):
        import openstudio as o
        res = o.IdfFile.load(text, o.IddFileType('EnergyPlus'))
        self.assertTrue(res.is_initialized(), 'IDF failed to parse')
        f = res.get()
        report = f.validityReport(o.StrictnessLevel('Final'))
        self.assertEqual(report.numErrors(), 0, str(report)[:4000])
        self.assertTrue(f.isValid(o.StrictnessLevel('Final')))

    def test_variants_validate(self):
        variants = [
            {},
            {'n_floors': 1, 'gfa_m2': 400, 'wwr': 0.2},
            {'n_floors': 2, 'overhang_pf': 0.5, 'erv_sensible_eff': 0.7},
            {'n_floors': 12, 'erv_sensible_eff': 0.7, 'erv_latent_eff': 0.6, 'thermal_mass': False,
             'setback_heat_c': 15.6, 'setup_cool_c': 29.4, 'wwr': 0.0},
            {'type': 'lab', 'hvac_start_before_occ_h': 3, 'oa_unoccupied_fraction': 0.5},
            {'occ_days_per_week': 5, '_annual': True},
        ]
        for v in variants:
            ddy = weather.parse_ddy(os.path.join(WEATHER, STEM + '.ddy'))
            stat = weather.parse_stat(os.path.join(WEATHER, STEM + '.stat'))
            user = {'type': 'office', 'station': 'chicago', 'gfa_m2': 10000, 'n_floors': 4}
            user.update(v)
            annual = user.pop('_annual', False)
            sc, _ = scenario.resolve(user, stat['climate_zone'])
            # Capture the writer's objects for field-name checking.
            orig = idf.IdfWriter

            captured = {}

            class Spy(orig):
                def __init__(self):
                    super().__init__()
                    captured['w'] = self
            idf.IdfWriter = Spy
            try:
                text, _ = idf.build(sc, ddy, stat, annual=annual)
            finally:
                idf.IdfWriter = orig
            self._check_names(captured['w'].objects)
            self._validate(text)

    def test_batch_samples_validate(self):
        import batch
        import run_scenario
        for btype in scenario.load_archetypes()['types']:
            for station in ('fairbanks', 'miami', 'denver'):
                for _, user in batch.make_samples(btype, station, 6, 1):
                    _, ddy, stat, sc, _ = run_scenario.build_model(user)
                    text, _ = idf.build(sc, ddy, stat)
                    self._validate(text)


if __name__ == '__main__':
    unittest.main()

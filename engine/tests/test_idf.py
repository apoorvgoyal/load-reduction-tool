"""Tests for the IDF builder.

Runs with plain python (no EnergyPlus needed):  python3 -m unittest discover engine/tests

If the `openstudio` Python package is importable, the generated IDF is also
validated against the EnergyPlus IDD that ships with it: field names in the
order we emit them must match the IDD, and the file must pass OpenStudio's
strict validity check.
"""
import math
import os
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
        ]
        for v in variants:
            ddy = weather.parse_ddy(os.path.join(WEATHER, STEM + '.ddy'))
            stat = weather.parse_stat(os.path.join(WEATHER, STEM + '.stat'))
            user = {'type': 'office', 'station': 'chicago', 'gfa_m2': 10000, 'n_floors': 4}
            user.update(v)
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
                text, _ = idf.build(sc, ddy, stat)
            finally:
                idf.IdfWriter = orig
            self._check_names(captured['w'].objects)
            self._validate(text)

    def test_batch_samples_validate(self):
        import batch
        import run_scenario
        for btype in ('office', 'school', 'retail', 'hotel'):
            for station in ('fairbanks', 'miami', 'denver'):
                for _, user in batch.make_samples(btype, station, 6, 1):
                    _, ddy, stat, sc, _ = run_scenario.build_model(user)
                    text, _ = idf.build(sc, ddy, stat)
                    self._validate(text)


if __name__ == '__main__':
    unittest.main()

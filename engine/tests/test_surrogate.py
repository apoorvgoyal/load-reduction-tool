"""Surrogate fitting + Python/JavaScript parity.

The training data here is synthetic (a known quadratic of the features), used
only to check the fitting maths and that web/core.js evaluates the
published model exactly as Python does. Requires numpy; the parity checks also
need `node` on PATH.
"""
import json
import os
import random
import shutil
import subprocess
import sys
import tempfile
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
LOADS = os.path.dirname(HERE)
TOOL = os.path.dirname(LOADS)
sys.path.insert(0, LOADS)

from lib import features, scenario  # noqa: E402

try:
    import numpy as np  # noqa: F401
    import fit_surrogate
    HAVE_NP = True
except ImportError:
    HAVE_NP = False

NODE = shutil.which('node')


def _random_scenario(rng, btype='office'):
    user = {'type': btype, 'station': 'chicago',
            'wwr': rng.uniform(0.1, 0.8), 'wall_u': rng.uniform(0.15, 1.0), 'roof_u': rng.uniform(0.1, 0.5),
            'win_u': rng.uniform(1.0, 3.5), 'shgc': rng.uniform(0.2, 0.6), 'overhang_pf': rng.uniform(0, 1),
            'm2_per_person': rng.uniform(8, 40), 'lpd_w_m2': rng.uniform(3, 12), 'epd_w_m2': rng.uniform(3, 25),
            'oa_per_person_ls': rng.uniform(2, 5), 'oa_per_area_ls_m2': rng.uniform(0.2, 0.6),
            'erv_sensible_eff': rng.uniform(0, 0.85), 'erv_latent_eff': rng.uniform(0, 0.75),
            'infiltration_ach': rng.uniform(0.05, 0.6), 't_cool_c': rng.uniform(22, 27),
            't_heat_c': rng.uniform(18, 21.5), 'n_floors': rng.randint(1, 15),
            'aspect_ratio': rng.uniform(1, 3), 'north_axis_deg': rng.uniform(0, 360)}
    user['gfa_m2'] = rng.uniform(500, 5000) * user['n_floors']
    sc, _ = scenario.resolve(user, '5A')
    return sc


def _truth(f):
    # Arbitrary smooth function of the features with interactions.
    return 20 + 30 * f[0] * f[4] + 2 * f[7] + 1.5 * f[8] + 40 * f[9] * (1 - f[10]) - 0.5 * f[13] + 0.001 * f[17]


@unittest.skipUnless(HAVE_NP, 'numpy not installed')
class FitTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        rng = random.Random(3)
        cls.tmp = tempfile.mkdtemp()
        cls.path = os.path.join(cls.tmp, 'office__chicago.jsonl')
        with open(cls.path, 'w') as f:
            for i in range(400):
                sc = _random_scenario(rng)
                x = features.features(sc)
                y = _truth(x)
                f.write(json.dumps({'id': i, 'scenario': sc, 'features': x,
                                    'targets': {'clg_db_0.4|total_w_m2': y, 'htg_99.6|total_w_m2': 0.5 * y},
                                    'eplus': 'synthetic', 'severe': 0}) + '\n')
        cls.model, _ = fit_surrogate.fit_file(cls.path, k=5, min_samples=50)

    def test_recovers_quadratic(self):
        cv = self.model['outputs']['clg_db_0.4|total_w_m2']['cv']
        self.assertGreater(cv['r2'], 0.9999)
        self.assertLess(cv['p95_abs_pct'], 0.5)

    def test_min_samples_guard(self):
        m, why = fit_surrogate.fit_file(self.path, min_samples=10000)
        self.assertIsNone(m)

    @unittest.skipUnless(NODE, 'node not installed')
    def test_js_parity(self):
        import numpy as np
        rng = random.Random(11)
        cases = [_random_scenario(rng) for _ in range(5)]
        m = self.model
        py = []
        for sc in cases:
            x = np.array(features.features(sc))
            z = (x - np.array(m['feature_mean'])) / np.array(m['feature_std'])
            X = fit_surrogate.expand(z[None, :])[0]
            py.append({'features': list(x),
                       'pred': float(X @ np.array(m['outputs']['clg_db_0.4|total_w_m2']['coef']))})
        script = (
            "var C=require(%r);var m=%s;var cases=%s;"
            "console.log(JSON.stringify(cases.map(function(sc){"
            "return {features:C.features(sc),pred:C.predict(m,sc).perM2['clg_db_0.4|total_w_m2']};})));"
        ) % (os.path.join(TOOL, 'web', 'core.js'), json.dumps(m), json.dumps(cases))
        out = json.loads(subprocess.run([NODE, '-e', script], capture_output=True, text=True, check=True).stdout)
        for a, b in zip(py, out):
            for u, v in zip(a['features'], b['features']):
                self.assertAlmostEqual(u, v, places=9)
            self.assertAlmostEqual(a['pred'], b['pred'], places=4)


@unittest.skipUnless(NODE, 'node not installed')
class DefaultsParityTests(unittest.TestCase):
    def test_defaults_match_python(self):
        arch = scenario.load_archetypes()
        data = {'archetypes': arch}
        combos = [(t, cz) for t in arch['types'] for cz in ('2A', '5A', '7')]
        script = ("var C=require(%r);var d=%s;console.log(JSON.stringify(%s.map(function(c){"
                  "return C.defaults(d,c[0],c[1]).scenario;})));") % (
            os.path.join(TOOL, 'web', 'core.js'), json.dumps(data), json.dumps(combos))
        js = json.loads(subprocess.run([NODE, '-e', script], capture_output=True, text=True, check=True).stdout)
        for (t, cz), jsc in zip(combos, js):
            psc, _ = scenario.resolve({'type': t, 'station': 'x', 'climate_zone': cz})
            for k in scenario.FIELDS:
                if k in ('station',):
                    continue
                pv, jv = psc.get(k), jsc.get(k)
                if isinstance(pv, float) or isinstance(jv, (int, float)) and not isinstance(jv, bool):
                    if pv is None or jv is None:
                        self.assertEqual(pv, jv, k)
                    else:
                        self.assertAlmostEqual(float(pv), float(jv), places=9, msg='%s %s %s' % (t, cz, k))
                else:
                    self.assertEqual(pv, jv, '%s %s %s' % (t, cz, k))



@unittest.skipUnless(NODE, 'node not installed')
class GatingTests(unittest.TestCase):
    """A model that failed its independent EnergyPlus test is not used (web/core.js failedTest)."""
    def _failed(self, model, btype):
        script = "var C=require(%r);console.log(JSON.stringify(C.failedTest(%s,%r)));" % (
            os.path.join(TOOL, 'web', 'core.js'), json.dumps(model), btype)
        return json.loads(subprocess.run([NODE, '-e', script], capture_output=True, text=True, check=True).stdout)

    def test_failed_model_is_ruled_out(self):
        ho = {'n': 51, 'passed': False, 'worst_governing_p95_pct': 9.5, 'threshold_pct': 5.0}
        self.assertEqual(self._failed({'type': 'office', 'holdout': ho}, 'office'), {'worst': 9.5, 'limit': 5.0, 'n': 51})

    def test_passed_or_untested_model_is_used(self):
        self.assertIsNone(self._failed({'type': 'office', 'holdout': {'n': 51, 'passed': True}}, 'office'))
        self.assertIsNone(self._failed({'type': 'office'}, 'office'))

    def test_shared_model_judged_per_type(self):
        ho = {'n': 51, 'passed': False, 'threshold_pct': 5.0,
              'per_type': {'office': {'passed': True, 'worst_governing_p95_pct': 3.0},
                           'school': {'passed': False, 'worst_governing_p95_pct': 8.0}}}
        m = {'type': 'unified', 'holdout': ho}
        self.assertIsNone(self._failed(m, 'office'))
        self.assertEqual(self._failed(m, 'school'), {'worst': 8.0, 'limit': 5.0, 'n': 51})



@unittest.skipUnless(NODE, 'node not installed')
class BreakdownParityTests(unittest.TestCase):
    def test_js_breakdown_matches_python(self):
        from lib import results
        groups = {'people': 12.5, 'lighting': 30.0, 'equipment': 41.0, 'window_solar': 55.5, 'window_conduction': 20.0,
                  'walls': 8.0, 'roof': 6.0, 'ground_floor': -3.0, 'infiltration': 17.0, 'internal_mass': -4.5}
        blocks = [{'total_w': 250.0, 'outdoor_air_w': 90.0, 'heat_recovery_w': 25.0},
                  {'total_w': 180.0, 'outdoor_air_w': None, 'heat_recovery_w': None}]
        script = "var C=require(%r);console.log(JSON.stringify(%s.map(function(b){return C.breakdown(%s,b);})));" % (
            os.path.join(TOOL, 'web', 'core.js'), json.dumps(blocks), json.dumps(groups))
        js = json.loads(subprocess.run([NODE, '-e', script], capture_output=True, text=True, check=True).stdout)
        for b, j in zip(blocks, js):
            py = results.breakdown(groups, b)
            self.assertEqual(sorted(py), sorted(j))
            for k in py:
                self.assertAlmostEqual(py[k], j[k], places=9, msg=k)
        script = "var C=require(%r);console.log(JSON.stringify(C.COMPONENTS));" % os.path.join(TOOL, 'web', 'core.js')
        order = json.loads(subprocess.run([NODE, '-e', script], capture_output=True, text=True, check=True).stdout)
        self.assertEqual(order, [c for c, _ in results.COMPONENT_GROUPS])


if __name__ == '__main__':
    unittest.main()

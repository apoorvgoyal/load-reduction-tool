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

    def test_smooth_target_stays_quadratic(self):
        self.assertEqual(self.model['form'], 'quadratic')
        self.assertNotIn('mlp', self.model)

    def _with_random_mlp(self):
        """The fitted model plus a small random network taking over one output."""
        rng = random.Random(5)
        d, hdn = len(self.model['feature_mean']), 6
        layer = lambda i, o: [[rng.uniform(-1, 1) for _ in range(o)] for _ in range(i)]  # noqa: E731
        m = json.loads(json.dumps(self.model))
        m['mlp'] = {'names': ['clg_db_0.4|total_w_m2'], 'y_mean': [50.0], 'y_std': [10.0],
                    'nets': [{'W': [layer(d, hdn), layer(hdn, hdn), layer(hdn, 1)],
                              'b': [[rng.uniform(-1, 1) for _ in range(hdn)], [rng.uniform(-1, 1) for _ in range(hdn)], [0.3]]}
                             for _ in range(2)]}
        del m['outputs']['clg_db_0.4|total_w_m2']['coef']
        return m

    def test_mlp_python_matches_numpy(self):
        import numpy as np
        from lib import surrogate
        m = self._with_random_mlp()
        sc = _random_scenario(random.Random(2))
        z = (np.array(features.features(sc)) - np.array(m['feature_mean'])) / np.array(m['feature_std'])
        ref = fit_surrogate._mlp_apply(m['mlp']['nets'], z[None, :])[0][0] * 10.0 + 50.0
        self.assertAlmostEqual(surrogate.evaluate(m, list(z))['clg_db_0.4|total_w_m2'], ref, places=9)
        # The output it does not cover still comes from the quadratic.
        self.assertIn('htg_99.6|total_w_m2', surrogate.evaluate(m, list(z)))

    @unittest.skipUnless(NODE, 'node not installed')
    def test_mlp_js_parity(self):
        from lib import surrogate
        m = self._with_random_mlp()
        cases = [_random_scenario(random.Random(20 + i)) for i in range(4)]
        script = ("var C=require(%r);var m=%s;console.log(JSON.stringify(%s.map(function(sc){"
                  "return C.predict(m,sc).perM2;})));") % (os.path.join(TOOL, 'web', 'core.js'), json.dumps(m), json.dumps(cases))
        js = json.loads(subprocess.run([NODE, '-e', script], capture_output=True, text=True, check=True).stdout)
        for sc, j in zip(cases, js):
            py, _ = surrogate.predict(m, sc)
            for k in ('clg_db_0.4|total_w_m2', 'htg_99.6|total_w_m2'):
                self.assertAlmostEqual(py[k], max(0.0, j[k]), places=6, msg=k)

    def test_mlp_chosen_for_a_switch(self):
        try:
            import sklearn  # noqa: F401
        except ImportError:
            self.skipTest('scikit-learn not installed')
        rng = random.Random(8)
        scs = [_random_scenario(rng) for _ in range(400)]
        xs = [features.features(sc) for sc in scs]
        knee = sorted(x[9] for x in xs)[len(xs) // 2]
        recs = []
        for i, (sc, x) in enumerate(zip(scs, xs)):
            # A hinge at the median outdoor-air rate, as dehumidification
            # switching on: a quadratic cannot follow it.
            y = 10 + 400 * max(0.0, x[9] - knee) + 2 * x[12]
            recs.append({'id': i, 'scenario': sc, 'targets': {'clg_db_0.4|total_w_m2': y, 'clg_dp_0.4|total_w_m2': 0.8 * y,
                                                              'htg_99.6|total_w_m2': 5.0 + x[12]}})
        m, _ = fit_surrogate.fit_records(recs, k=3, min_samples=50)
        g = m['cv_governing_p95_pct']
        self.assertEqual(m['form'], 'mlp', g)
        self.assertLess(g['mlp'], g['quadratic'])

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


@unittest.skipUnless(NODE, 'node not installed')
class OptimizerTests(unittest.TestCase):
    """web/core.js optimize(): options agree with one-lever-at-a-time sensitivity."""
    def _run(self, target):
        # Linear toy model: 'a' strong, 'b' weak and sitting near the bottom of its range
        # (like infiltration 0.15 ACH in 0.05-0.6), 'c' only raises the peak.
        script = """var C=require(%r);
var L=[{key:'a',v0:0.4,lo:0.1,hi:0.8},{key:'b',v0:0.15,lo:0.05,hi:0.6},{key:'c',v0:1,lo:0.5,hi:2}];
function ev(v){return {clg:100-50*(0.4-v.a)-20*(0.15-v.b)+5*Math.abs(v.c-1),htg:50};}
var r=C.optimize(L,ev,{clg:%r,htg:null});
function d(p){return p?r.describe(p).moved.map(function(m){return [m.key,m.to,m.saves.clg];}):null;}
console.log(JSON.stringify({f:d(r.fewest),s:d(r.smallest),one:r.byCount[0].best.clg}));""" % (
            os.path.join(TOOL, 'web', 'core.js'), target)
        return json.loads(subprocess.run([NODE, '-e', script], capture_output=True, text=True, check=True).stdout)

    def test_options_use_the_strong_lever_and_no_token_moves(self):
        out = self._run(0.1)
        for opt in (out['f'], out['s']):
            self.assertEqual([m[0] for m in opt], ['a'])            # 'a' alone reaches 10%; no token 'b' move
            self.assertAlmostEqual(opt[0][1], 0.2, places=2)
        self.assertAlmostEqual(out['one'], 90.0, places=1)           # 1-change row pulled back to just meet the target

    def test_moves_listed_biggest_first(self):
        out = self._run(0.165)                                       # needs 'a' at its floor plus some 'b'
        saves = [m[2] for m in out['s']]
        self.assertEqual(saves, sorted(saves, reverse=True))
        self.assertEqual(out['s'][0][0], 'a')


@unittest.skipUnless(NODE, 'node not installed')
class SplitCheckTests(unittest.TestCase):
    def test_failed_test_uses_the_matching_domain(self):
        model = {'type': 'office', 'base_floor_plate_max_m2': 5000,
                 'holdout': {'passed': False, 'threshold_pct': 5, 'n': 101, 'worst_governing_p95_pct': 7,
                             'domains': {'base': {'n': 51, 'worst_governing_p95_pct': 3.0, 'passed': True},
                                         'extended': {'n': 50, 'worst_governing_p95_pct': 7.0, 'passed': False}}}}
        cases = [{'gfa_m2': 20000, 'n_floors': 4},                            # ordinary: base test, passed
                 {'gfa_m2': 20000, 'n_floors': 4, 'adiabatic_roof': True},    # adiabatic surface: extended
                 {'gfa_m2': 32000, 'n_floors': 4}]                            # 8,000 m2 plate: extended
        script = ("var C=require(%r);var m=%s;console.log(JSON.stringify(%s.map(function(sc){"
                  "return C.failedTest(m,'office',sc);})));") % (os.path.join(TOOL, 'web', 'core.js'), json.dumps(model), json.dumps(cases))
        out = json.loads(subprocess.run([NODE, '-e', script], capture_output=True, text=True, check=True).stdout)
        self.assertIsNone(out[0])
        self.assertEqual(out[1]['worst'], 7.0)
        self.assertEqual(out[2]['n'], 50)


if __name__ == '__main__':
    unittest.main()

"""validate.py end to end (stand-in EnergyPlus, placeholder numbers) and
Python/JavaScript parity of the surrogate predictor."""
import json
import os
import random
import shutil
import subprocess
import sys
import tempfile
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
ENGINE = os.path.dirname(HERE)
TOOL = os.path.dirname(ENGINE)
sys.path.insert(0, ENGINE)

from lib import features, scenario, surrogate  # noqa: E402

try:
    import numpy  # noqa: F401
    HAVE_NP = True
except ImportError:
    HAVE_NP = False
NODE = shutil.which('node')


class GoverningRuleTests(unittest.TestCase):
    """The pass rule on the reported peaks, with a stub model (no numpy needed)."""
    def _errors(self, cases):
        import validate
        recs = [{'scenario': {'i': i}, 'targets': t} for i, (t, _) in enumerate(cases)]
        preds = {i: p for i, (_, p) in enumerate(cases)}
        orig = validate.surrogate.predict
        validate.surrogate.predict = lambda model, sc: (preds[sc['i']], [])
        try:
            return validate.governing_errors(None, recs)
        finally:
            validate.surrogate.predict = orig

    def test_negligible_heating_judged_against_design_load(self):
        # Heating 0.5 W/m2 against 200 W/m2 of cooling: a 2 W/m2 miss is 2/(0.1*200) = 10%,
        # not 400%.
        t = {'clg_db_0.4|total_w_m2': 150.0, 'clg_dp_0.4|total_w_m2': 200.0, 'htg_99.6|total_w_m2': 0.5}
        p = dict(t, **{'htg_99.6|total_w_m2': 2.5})
        g = self._errors([(t, p)])
        self.assertAlmostEqual(g['heating 99.6%']['p95_abs_pct'], 10.0)
        self.assertEqual(g['heating 99.6%']['n_negligible'], 1)
        # Cooling governs on the larger day for both EnergyPlus and the model: exact here.
        self.assertAlmostEqual(g['cooling 0.4%']['p95_abs_pct'], 0.0)

    def test_material_peak_judged_on_itself(self):
        t = {'clg_db_0.4|total_w_m2': 100.0, 'clg_dp_0.4|total_w_m2': 80.0, 'htg_99.6|total_w_m2': 60.0}
        p = dict(t, **{'htg_99.6|total_w_m2': 63.0, 'clg_dp_0.4|total_w_m2': 110.0})
        g = self._errors([(t, p)])
        self.assertAlmostEqual(g['heating 99.6%']['p95_abs_pct'], 5.0)
        # The model wrongly lets the dew-point day govern: 110 vs 100 -> 10%.
        self.assertAlmostEqual(g['cooling 0.4%']['p95_abs_pct'], 10.0)
        self.assertEqual(g['heating 99.6%']['n_negligible'], 0)


@unittest.skipUnless(HAVE_NP, 'numpy not installed')
class ValidateEndToEnd(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = tempfile.mkdtemp()
        cls.root = os.path.join(cls.tmp, 'tool')
        os.makedirs(cls.root)
        shutil.copytree(ENGINE, os.path.join(cls.root, 'engine'), ignore=shutil.ignore_patterns('runs', 'validation', '__pycache__'))
        shutil.copytree(os.path.join(TOOL, 'web'), os.path.join(cls.root, 'web'))
        sj = os.path.join(cls.root, 'web', 'data', 'loads-surrogate.js')
        if os.path.exists(sj):
            os.remove(sj)
        shutil.rmtree(os.path.join(cls.root, 'web', 'data', 'surrogates'), ignore_errors=True)
        cls.env = dict(os.environ, ENERGYPLUS_EXE=os.path.join(cls.root, 'engine', 'tests', 'fake_energyplus.py'))
        cls.py = lambda self, *args: subprocess.run([sys.executable] + list(args), capture_output=True, text=True,
                                                    env=self.env, cwd=self.root)

    @classmethod
    def tearDownClass(cls):
        shutil.rmtree(cls.tmp, ignore_errors=True)

    def test_train_fit_validate(self):
        p = self.py('engine/batch.py', '--types', 'office', '--stations', 'chicago', '--n', '60', '--workers', '2')
        self.assertEqual(p.returncode, 0, p.stderr)
        p = self.py('engine/fit_surrogate.py', '--min-samples', '50')
        self.assertEqual(p.returncode, 0, p.stderr)
        p = self.py('engine/validate.py', '--n', '6', '--threshold', '1000', '--workers', '2')
        self.assertEqual(p.returncode, 0, p.stdout + p.stderr)
        self.assertIn('1 of 1 models passed', p.stdout)
        with open(os.path.join(self.root, 'engine', 'validation', 'report.json')) as f:
            rep = json.load(f)
        m = rep['models']['office|chicago']
        self.assertEqual(m['n_cases'], 7)                     # 6 sampled + the type default
        self.assertIsNotNone(m['default_case'])
        pub = surrogate.load_published(os.path.join(self.root, 'web', 'data', 'loads-surrogate.js'))
        self.assertEqual(pub['models']['office|chicago']['holdout']['n'], 7)
        # Test runs are kept apart from training runs and are not refitted.
        self.assertTrue(os.path.exists(os.path.join(self.root, 'engine', 'runs', 'test', 'office__chicago.jsonl')))
        # Re-scoring without EnergyPlus works, and a strict threshold fails with exit code 1.
        env = dict(self.env, ENERGYPLUS_EXE='/nonexistent')
        p = subprocess.run([sys.executable, 'engine/validate.py', '--skip-run', '--n', '6', '--threshold', '0.0001'],
                           capture_output=True, text=True, env=env, cwd=self.root)
        self.assertEqual(p.returncode, 1, p.stdout + p.stderr)
        with open(os.path.join(self.root, 'engine', 'validation', 'report.md')) as f:
            self.assertIn('FAIL', f.read())
        # Published layout: small index + one file per model
        self.assertTrue(os.path.exists(os.path.join(self.root, 'web', 'data', 'surrogates', 'office__chicago.js')))

    def test_unified_model_validated_per_type(self):
        p = self.py('engine/batch.py', '--types', 'unified', '--stations', 'denver', '--n', '120', '--workers', '2')
        self.assertEqual(p.returncode, 0, p.stderr)
        p = self.py('engine/fit_surrogate.py', '--min-samples', '50', '--only', 'unified__denver')
        self.assertEqual(p.returncode, 0, p.stderr)
        pub = surrogate.load_published(os.path.join(self.root, 'web', 'data', 'loads-surrogate.js'))
        m = pub['models']['unified|denver']
        self.assertEqual(m['type'], 'unified')
        self.assertNotIn('occ_hours', m['fixed_inputs'])          # schedules vary in the shared model
        self.assertIn('wide', m['components'])
        p = self.py('engine/validate.py', '--types', 'unified', '--stations', 'denver', '--n', '2',
                    '--threshold', '1000', '--workers', '2')
        self.assertEqual(p.returncode, 0, p.stdout + p.stderr)
        with open(os.path.join(self.root, 'engine', 'validation', 'report.json')) as f:
            r = json.load(f)['models']['unified|denver']
        types = set(scenario.load_archetypes()['types'])
        self.assertEqual(set(r['per_type']), types)
        self.assertEqual(r['n_cases'], 3 * len(types))           # 2 sampled + default, per type
        with open(os.path.join(self.root, 'engine', 'validation', 'report.md')) as f:
            self.assertIn('Shared models by building type', f.read())

    def test_refuses_training_seed(self):
        p = self.py('engine/validate.py', '--seed', '1', '--skip-run')
        self.assertNotEqual(p.returncode, 0)


@unittest.skipUnless(HAVE_NP and NODE, 'numpy and node needed')
class PredictorParity(unittest.TestCase):
    def test_python_matches_js(self):
        import numpy as np
        rng = random.Random(4)
        nf = len(features.FEATURES)
        nt = 1 + nf + nf * (nf + 1) // 2
        model = {'features': features.FEATURES,
                 'feature_mean': [rng.uniform(0, 2) for _ in range(nf)],
                 'feature_std': [rng.uniform(0.5, 2) for _ in range(nf)],
                 'feature_min': [-100.0] * nf, 'feature_max': [100.0] * nf, 'fixed_inputs': {},
                 'outputs': {k: {'coef': [rng.uniform(-0.05, 0.05) for _ in range(nt)], 'cv': {'p95_abs_pct': 1}}
                             for k in ('clg_db_0.4|total_w_m2', 'clg_db_0.4|hr_w_m2')}}
        cases = []
        for t in ('office', 'lab', 'healthcare', 'stadium'):
            sc, _ = scenario.resolve({'type': t, 'station': 'x', 'erv_sensible_eff': rng.choice([0, 0.6])}, '4A')
            cases.append(sc)
        py = [surrogate.predict(model, sc)[0] for sc in cases]
        script = ("var C=require(%r);var m=%s;console.log(JSON.stringify(%s.map(function(sc){"
                  "var r=C.surrogateResult(m,sc).dd['clg_db_0.4'];return [r.total_w/sc.gfa_m2,(r.heat_recovery_w||0)/sc.gfa_m2];})));") % (
            os.path.join(TOOL, 'web', 'core.js'), json.dumps(model), json.dumps(cases))
        js = json.loads(subprocess.run([NODE, '-e', script], capture_output=True, text=True, check=True).stdout)
        for a, b in zip(py, js):
            self.assertAlmostEqual(a['clg_db_0.4|total_w_m2'], b[0], places=6)
            self.assertAlmostEqual(a['clg_db_0.4|hr_w_m2'], b[1], places=6)


if __name__ == '__main__':
    unittest.main()

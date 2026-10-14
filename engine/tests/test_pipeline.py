"""End-to-end plumbing: run_scenario -> batch -> fit, using a stand-in
EnergyPlus executable (tests/fake_energyplus.py). Checks wiring only; the
numbers are placeholders."""
import json
import os
import subprocess
import sys
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
LOADS = os.path.dirname(HERE)
sys.path.insert(0, LOADS)

FAKE = os.path.join(HERE, 'fake_energyplus.py')


class PipelineTests(unittest.TestCase):
    def test_run_scenario_cli(self):
        env = dict(os.environ, ENERGYPLUS_EXE=FAKE)
        user = {'type': 'office', 'station': 'chicago', 'gfa_m2': 8000, 'n_floors': 5}
        p = subprocess.run([sys.executable, os.path.join(LOADS, 'run_scenario.py'), '-', '--include-idf'],
                           input=json.dumps(user), capture_output=True, text=True, env=env)
        out = json.loads(p.stdout)
        self.assertTrue(out['ok'], out)
        self.assertEqual(sorted(out['design_days']), sorted(
            ['htg_99.6', 'htg_99', 'clg_db_0.4', 'clg_db_1', 'clg_db_2', 'clg_dp_0.4', 'clg_dp_1', 'clg_dp_2']))
        # 15 zones; middle floor scaled by 3 -> 5 + 5*3 + 5 = 25 zone-equivalents
        nwin = out['idf'].count('FenestrationSurface:Detailed,')
        self.assertAlmostEqual(out['design_days']['clg_db_0.4']['block']['total_w'], 25 * (200.0 + nwin))
        self.assertEqual(out['messages']['warnings'], 1)
        self.assertEqual(out['provenance']['gfa_m2'], 'user')

    def test_bad_input_reported(self):
        env = dict(os.environ, ENERGYPLUS_EXE=FAKE)
        p = subprocess.run([sys.executable, os.path.join(LOADS, 'run_scenario.py'), '-'],
                           input=json.dumps({'type': 'office', 'station': 'chicago', 'wwr': 3}),
                           capture_output=True, text=True, env=env)
        out = json.loads(p.stdout)
        self.assertFalse(out['ok'])
        self.assertEqual(out['code'], 'bad_input')
        self.assertNotEqual(p.returncode, 0)

    def test_no_engine(self):
        env = dict(os.environ, ENERGYPLUS_EXE='/nonexistent', PATH='/usr/bin:/bin')
        p = subprocess.run([sys.executable, os.path.join(LOADS, 'run_scenario.py'), '-'],
                           input=json.dumps({'type': 'office', 'station': 'chicago'}),
                           capture_output=True, text=True, env=env)
        self.assertEqual(json.loads(p.stdout)['code'], 'no_engine')

    def test_batch_samples_are_valid_and_deterministic(self):
        import batch
        from lib import scenario
        a = batch.make_samples('school', 'houston', 40, 1)
        b = batch.make_samples('school', 'houston', 40, 1)
        self.assertEqual(a, b)
        for _, user in a:
            scenario.resolve(user, '2A')   # raises if any sample is out of range
        floors = sorted(u['n_floors'] for _, u in a)
        self.assertEqual((floors[0] >= 1, floors[-1] <= 15), (True, True))


if __name__ == '__main__':
    unittest.main()

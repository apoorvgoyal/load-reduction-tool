"""Sharded batch runs merge cleanly (stand-in EnergyPlus; placeholder numbers)."""
import json
import os
import shutil
import subprocess
import sys
import tempfile
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
ENGINE = os.path.dirname(HERE)
sys.path.insert(0, ENGINE)

from lib import runs  # noqa: E402


class ShardTests(unittest.TestCase):
    def setUp(self):
        # Work on a copy of the engine so the real engine/runs/ is untouched.
        self.tmp = tempfile.mkdtemp()
        self.eng = os.path.join(self.tmp, 'engine')
        shutil.copytree(ENGINE, self.eng, ignore=shutil.ignore_patterns('runs', '__pycache__'))
        self.env = dict(os.environ, ENERGYPLUS_EXE=os.path.join(self.eng, 'tests', 'fake_energyplus.py'))

    def tearDown(self):
        shutil.rmtree(self.tmp, ignore_errors=True)

    def _batch(self, *extra):
        p = subprocess.run([sys.executable, os.path.join(self.eng, 'batch.py'), '--types', 'lab',
                            '--stations', 'denver', '--n', '9', '--workers', '1'] + list(extra),
                           capture_output=True, text=True, env=self.env)
        self.assertEqual(p.returncode, 0, p.stderr)
        return p.stdout

    def test_shards_cover_all_ids_once(self):
        for k in (1, 2, 3):
            self._batch('--shard', '%d/3' % k)
        rd = os.path.join(self.eng, 'runs')
        files = runs.files_for(rd, 'lab', 'denver')
        self.assertEqual(len(files), 3)
        recs = runs.load(files)
        self.assertEqual([r['id'] for r in recs], list(range(9)))
        self.assertEqual(runs.pairs(rd), [('lab', 'denver')])
        # A plain run afterwards sees everything as done.
        out = self._batch()
        self.assertIn('9 of 9 done, 0 to run', out)

    def test_name_parsing(self):
        self.assertEqual(runs.parse_name('higher_ed__sanfrancisco.jsonl'), ('higher_ed', 'sanfrancisco'))
        self.assertEqual(runs.parse_name('lab__denver.shard-2-of-4.jsonl'), ('lab', 'denver'))
        self.assertIsNone(runs.parse_name('lab__denver.failed.jsonl'))
        self.assertIsNone(runs.parse_name('lab__denver.shard-2-of-4.failed.jsonl'))
        self.assertEqual(runs.parse_shard('2/4'), (2, 4))
        with self.assertRaises(ValueError):
            runs.parse_shard('5/4')



class LoadSetsTests(unittest.TestCase):
    def test_sets_with_the_same_ids_are_all_kept(self):
        # Base and extended batches both number samples from 0; combining them
        # must keep every record, not let one set replace the other.
        tmp = tempfile.mkdtemp()
        try:
            base, ext = os.path.join(tmp, 'runs'), os.path.join(tmp, 'runs', 'ext')
            os.makedirs(ext)
            for d, tag, n in ((base, 'base', 3), (ext, 'ext', 2)):
                with open(os.path.join(d, 'office__chicago.jsonl'), 'w') as f:
                    for i in range(n):
                        f.write(json.dumps({'id': i, 'tag': tag}) + '\n')
            recs = runs.load_sets([base, ext], 'office', 'chicago')
            self.assertEqual(sorted((r['tag'], r['id']) for r in recs),
                             [('base', 0), ('base', 1), ('base', 2), ('ext', 0), ('ext', 1)])
        finally:
            shutil.rmtree(tmp)


if __name__ == '__main__':
    unittest.main()

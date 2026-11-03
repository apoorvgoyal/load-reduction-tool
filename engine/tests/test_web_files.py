"""engine/web_files.py: what the in-browser runner may fetch from /engine/."""
import os
import sys
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))

import web_files  # noqa: E402


class ResolveTests(unittest.TestCase):
    def test_code_and_data_files_are_served(self):
        for rel in ('run_scenario.py', 'lib/idf.py', 'lib/results.py', 'archetypes.json', 'stations.json'):
            self.assertTrue(os.path.isfile(web_files.resolve(rel)), rel)

    def test_station_weather_is_served(self):
        stem = web_files.manifest()['stations']['chicago']
        for ext in ('.ddy', '.stat'):
            self.assertTrue(os.path.isfile(web_files.resolve('weather/' + stem + ext)))

    def test_nothing_else_is_reachable(self):
        for rel in ('../server.py', 'lib/../../server.py', 'runs/office__chicago.jsonl', 'variables.json',
                    'weather/../run_scenario.py', 'weather/unknown.ddy', 'weather/epw/unknown.epw',
                    'weather/epw/../../run_scenario.py', 'lib/missing.py', 'fit_surrogate.py', ''):
            self.assertIsNone(web_files.resolve(rel), rel)

    def test_manifest_lists_what_run_scenario_imports(self):
        files = web_files.manifest()['files']
        for rel in ('run_scenario.py', 'lib/__init__.py', 'lib/idf.py', 'lib/results.py', 'lib/scenario.py', 'lib/weather.py'):
            self.assertIn(rel, files)


if __name__ == '__main__':
    unittest.main()

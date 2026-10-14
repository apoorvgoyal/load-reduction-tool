"""Results-parser tests against a synthetic eplusout.sql that uses the
EnergyPlus SQLite schema. Fixture numbers are arbitrary test values."""
import os
import sqlite3
import sys
import tempfile
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))

from lib import results  # noqa: E402


def make_sql(path, series, env_names, components=None, warmup_noise=True):
    """series: {env_name: {var: {key: [values per timestep]}}}"""
    con = sqlite3.connect(path)
    c = con.cursor()
    c.execute('CREATE TABLE Simulations (SimulationIndex INTEGER, EnergyPlusVersion TEXT)')
    c.execute("INSERT INTO Simulations VALUES (1, 'EnergyPlus, Version 25.2.0-test')")
    c.execute('CREATE TABLE EnvironmentPeriods (EnvironmentPeriodIndex INTEGER, SimulationIndex INTEGER, '
              'EnvironmentName TEXT, EnvironmentType INTEGER)')
    c.execute('CREATE TABLE Time (TimeIndex INTEGER, Year INTEGER, Month INTEGER, Day INTEGER, Hour INTEGER, '
              'Minute INTEGER, Dst INTEGER, Interval INTEGER, IntervalType INTEGER, SimulationDays INTEGER, '
              'DayType TEXT, EnvironmentPeriodIndex INTEGER, WarmupFlag INTEGER)')
    c.execute('CREATE TABLE ReportDataDictionary (ReportDataDictionaryIndex INTEGER, IsMeter INTEGER, Type TEXT, '
              'IndexGroup TEXT, TimestepType TEXT, KeyValue TEXT, Name TEXT, ReportingFrequency TEXT, '
              'ScheduleName TEXT, Units TEXT)')
    c.execute('CREATE TABLE ReportData (ReportDataIndex INTEGER, TimeIndex INTEGER, '
              'ReportDataDictionaryIndex INTEGER, Value REAL)')
    c.execute('CREATE TABLE TabularDataWithStrings (TabularDataIndex INTEGER, Value TEXT, ReportName TEXT, '
              'ReportForString TEXT, TableName TEXT, RowName TEXT, ColumnName TEXT, Units TEXT)')
    c.execute('CREATE TABLE ZoneSizes (ZoneSizesIndex INTEGER, ZoneName TEXT, LoadType TEXT, CalcDesLoad REAL, '
              'UserDesLoad REAL, CalcDesFlow REAL, UserDesFlow REAL, DesDayName TEXT, PeakHrMin TEXT, '
              'PeakTemp REAL, PeakHumRat REAL, CalcOutsideAirFlow REAL)')
    ti = 0
    di = {}
    rdi = 0
    for e, (env, vars_) in enumerate(series.items(), start=1):
        c.execute('INSERT INTO EnvironmentPeriods VALUES (?,?,?,?)', (e, 1, env, 1))
        n = len(next(iter(next(iter(vars_.values())).values())))
        # Warm-up rows with huge values must be ignored.
        if warmup_noise:
            ti += 1
            c.execute('INSERT INTO Time VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',
                      (ti, None, 7, 21, 1, 10, 0, 10, -1, 1, 'SummerDesignDay', e, 1))
            for var, keys in vars_.items():
                for key in keys:
                    if (key, var) not in di:
                        di[(key, var)] = len(di) + 1
                        c.execute('INSERT INTO ReportDataDictionary VALUES (?,?,?,?,?,?,?,?,?,?)',
                                  (di[(key, var)], 0, 'Avg', 'Zone', 'Zone', key, var, 'Zone Timestep', '', 'W'))
                    rdi += 1
                    c.execute('INSERT INTO ReportData VALUES (?,?,?,?)', (rdi, ti, di[(key, var)], 1e9))
        first = ti + 1
        for step in range(n):
            ti += 1
            hour = step // 6 + 1
            minute = (step % 6 + 1) * 10
            c.execute('INSERT INTO Time VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',
                      (ti, None, 7, 21, hour, minute, 0, 10, -1, 1, 'SummerDesignDay', e, 0))
        for var, keys in vars_.items():
            for key, vals in keys.items():
                if (key, var) not in di:
                    di[(key, var)] = len(di) + 1
                    c.execute('INSERT INTO ReportDataDictionary VALUES (?,?,?,?,?,?,?,?,?,?)',
                              (di[(key, var)], 0, 'Avg', 'Zone', 'Zone', key, var, 'Zone Timestep', '', 'W'))
                for step, v in enumerate(vals):
                    rdi += 1
                    c.execute('INSERT INTO ReportData VALUES (?,?,?,?)', (rdi, first + step, di[(key, var)], v))
    for i, (zone, table, row, col, val) in enumerate(components or []):
        c.execute('INSERT INTO TabularDataWithStrings VALUES (?,?,?,?,?,?,?,?)',
                  (i, str(val), 'ZoneComponentLoadSummary', zone, table, row, col, 'W'))
    con.commit()
    con.close()


class ResultsTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.mkdtemp()
        self.sql = os.path.join(self.tmp, 'eplusout.sql')
        self.model = {
            'zones': [{'name': 'G_S', 'scale': 1}, {'name': 'M_S', 'scale': 3}],
            'design_day_env_names': {'X ANN CLG .4% CONDNS DB=>MWB': 'clg_db_0.4',
                                     'X ANN HTG 99.6% CONDNS DB': 'htg_99.6'},
        }
        tot = results.V_CLG_TOT
        make_sql(self.sql, {
            'X ANN CLG .4% CONDNS DB=>MWB': {
                tot: {'G_S IDEAL LOADS': [10, 50, 20], 'M_S IDEAL LOADS': [30, 10, 25]},
                results.V_CLG_SEN: {'G_S IDEAL LOADS': [8, 40, 15], 'M_S IDEAL LOADS': [20, 8, 20]},
                results.V_OAT: {'Environment': [30, 32, 34]},
            },
            'X ANN HTG 99.6% CONDNS DB': {
                results.V_HTG_TOT: {'G_S IDEAL LOADS': [5, 7], 'M_S IDEAL LOADS': [4, 1]},
            },
        }, None, components=[
            ('G_S', 'Estimated Cooling Peak Load Components', 'People', 'Total', 100),
            ('M_S', 'Estimated Cooling Peak Load Components', 'People', 'Total', 10),
            ('M_S', 'Estimated Cooling Peak Load Components', 'Grand Total', 'Total', 999),
            ('G_S', 'Estimated Heating Peak Load Components', 'Infiltration', 'Sensible - Instant', -5),
        ])

    def test_block_and_sum_of_peaks(self):
        r = results.parse_sql(self.sql, self.model)
        c = r['design_days']['clg_db_0.4']
        # Scaled sums per step: 10+90=100, 50+30=80, 20+75=95 -> block peak at step 0
        self.assertAlmostEqual(c['block']['total_w'], 100)
        self.assertAlmostEqual(c['block']['sensible_w'], 8 + 60)
        self.assertEqual(c['block']['time'], '00:10')
        self.assertEqual(c['block']['outdoor_db_c'], 30)
        # Zone peaks: G_S 50*1, M_S 30*3
        self.assertAlmostEqual(c['sum_of_zone_peaks_w'], 50 + 90)
        h = r['design_days']['htg_99.6']
        self.assertAlmostEqual(h['block']['total_w'], 5 + 12)
        self.assertAlmostEqual(h['sum_of_zone_peaks_w'], 7 + 12)
        self.assertEqual(r['eplus_version'], 'EnergyPlus, Version 25.2.0-test')

    def test_components_scaled_and_grand_total_dropped(self):
        r = results.parse_sql(self.sql, self.model)
        self.assertAlmostEqual(r['components']['cooling']['People']['Total'], 100 + 30)
        self.assertNotIn('Grand Total', r['components']['cooling'])
        self.assertAlmostEqual(r['components']['heating']['Infiltration']['Sensible - Instant'], -5)

    def test_summarize_picks_larger_cooling_day(self):
        dd = {'clg_db_1': {'key': 'clg_db_1', 'block': {'total_w': 10}},
              'clg_dp_1': {'key': 'clg_dp_1', 'block': {'total_w': 12}},
              'htg_99': {'key': 'htg_99', 'block': {'total_w': 7}}}
        clg, htg = results.summarize(dd, '1', '99')
        self.assertEqual(clg['key'], 'clg_dp_1')
        self.assertEqual(htg['key'], 'htg_99')

    def test_err_parse(self):
        p = os.path.join(self.tmp, 'eplusout.err')
        with open(p, 'w') as f:
            f.write('   ** Warning ** a\n   ** Severe  ** b\n   **  Fatal  ** c\n')
        m = results.parse_err(p)
        self.assertEqual((m['warnings'], m['severe'], len(m['fatal'])), (1, 1, 1))


if __name__ == '__main__':
    unittest.main()

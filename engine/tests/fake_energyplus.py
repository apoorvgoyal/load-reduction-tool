#!/usr/bin/env python3
"""Stand-in for the EnergyPlus executable, used ONLY by tests to exercise the
runner/batch/fit plumbing. It writes an eplusout.sql with the EnergyPlus
schema whose numbers are placeholders, not physics."""
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from test_results import make_sql  # noqa: E402

args = sys.argv[1:]
if '--version' in args:
    print('EnergyPlus, Version 25.2.0-fake')
    sys.exit(0)
out = args[args.index('-d') + 1]
idf = open(args[-1]).read()
zones = re.findall(r'^Zone,\n\s+([^,]+),', idf, re.M)
dds = re.findall(r'^SizingPeriod:DesignDay,\n\s+([^,]+),', idf, re.M)
wwr_area = len(re.findall(r'FenestrationSurface:Detailed', idf))
series = {}
for dd in dds:
    htg = 'Htg' in dd
    var = 'Zone Ideal Loads Supply Air Total Heating Rate' if htg else 'Zone Ideal Loads Supply Air Total Cooling Rate'
    series[dd] = {var: {z + ' IDEAL LOADS': [100.0 + wwr_area, 200.0 + wwr_area, 150.0] for z in zones}}
make_sql(os.path.join(out, 'eplusout.sql'), series, None)
open(os.path.join(out, 'eplusout.err'), 'w').write('   ** Warning ** fake\n')

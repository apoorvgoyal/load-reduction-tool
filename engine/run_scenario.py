"""Run one scenario through EnergyPlus (design-day sizing) and print JSON.

Usage:
  python3 engine/run_scenario.py scenario.json            # result JSON to stdout
  echo '{...}' | python3 engine/run_scenario.py -         # scenario on stdin
  python3 engine/run_scenario.py scenario.json --idf-only  # write the IDF, don't run

Options:
  --include-idf   embed the generated IDF text in the result (for download)
  --keep DIR      keep the EnergyPlus run directory at DIR

Requires EnergyPlus on PATH or ENERGYPLUS_EXE pointing at the executable.
Exit code 0 with {"ok": true, ...} on success; non-zero with {"ok": false,
"error": ...} on failure.
"""
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

from lib import idf, results, scenario, weather  # noqa: E402

DEFAULT_TIMEOUT_S = int(os.environ.get('LOADS_EPLUS_TIMEOUT', '300'))


def load_station(station_id):
    with open(os.path.join(HERE, 'stations.json')) as f:
        manifest = json.load(f)
    for st in manifest['stations']:
        if st['id'] == station_id:
            stem = os.path.basename(st['path'])
            base = os.path.join(HERE, 'weather', stem)
            return st, weather.parse_ddy(base + '.ddy'), weather.parse_stat(base + '.stat')
    raise scenario.ScenarioError('unknown station %r' % station_id)


def find_energyplus():
    exe = os.environ.get('ENERGYPLUS_EXE') or shutil.which('energyplus') or shutil.which('EnergyPlus')
    if not exe or not os.path.exists(exe):
        return None, None
    try:
        out = subprocess.run([exe, '--version'], capture_output=True, text=True, timeout=30).stdout
    except (OSError, subprocess.SubprocessError):
        return None, None
    m = re.search(r'Version (\d+)\.(\d+)', out)
    return exe, ('%s.%s' % m.groups()) if m else None


def build_model(user):
    st, ddy, stat = load_station(user.get('station'))
    sc, prov = scenario.resolve(user, stat['climate_zone'])
    return st, ddy, stat, sc, prov


def run(user, include_idf=False, keep_dir=None, exe=None, version=None):
    t0 = time.time()
    if exe is None:
        exe, version = find_energyplus()
    if not exe:
        return {'ok': False, 'error': 'EnergyPlus not found. Install EnergyPlus and set ENERGYPLUS_EXE.',
                'code': 'no_engine'}
    st, ddy, stat, sc, prov = build_model(user)
    text, model = idf.build(sc, ddy, stat, eplus_version=version or '25.2')
    work = keep_dir or tempfile.mkdtemp(prefix='loads_')
    os.makedirs(work, exist_ok=True)
    try:
        idf_path = os.path.join(work, 'in.idf')
        with open(idf_path, 'w') as f:
            f.write(text)
        proc = subprocess.run([exe, '-d', work, idf_path], capture_output=True, text=True,
                              timeout=DEFAULT_TIMEOUT_S)
        msgs = results.parse_err(os.path.join(work, 'eplusout.err'))
        sql = os.path.join(work, 'eplusout.sql')
        if proc.returncode != 0 or not os.path.exists(sql) or msgs['fatal']:
            return {'ok': False, 'error': 'EnergyPlus run failed', 'code': 'eplus_failed',
                    'messages': msgs, 'stdout_tail': proc.stdout[-2000:], 'stderr_tail': proc.stderr[-2000:]}
        parsed = results.parse_sql(sql, model)
        out = {
            'ok': True,
            'engine': {'name': 'EnergyPlus', 'version': parsed['eplus_version'] or version,
                       'run_seconds': round(time.time() - t0, 2)},
            'station': {'id': st['id'], 'label': st['label'], 'ddy_source': ddy['source_note'],
                        'climate_zone_stat': stat['climate_zone']},
            'scenario': sc,
            'provenance': prov,
            'model': {k: model[k] for k in ('length_m', 'width_m', 'floors', 'zoning', 'totals', 'wwr_modelled')},
            'design_days': parsed['design_days'],
            'zone_sizing': parsed['zone_sizing'],
            'components': parsed['components'],
            'component_groups': results.component_groups(parsed['components']),
            'components_by_floor': parsed['components_by_floor'],
            'messages': msgs,
        }
        if include_idf:
            out['idf'] = text
        return out
    finally:
        if not keep_dir:
            shutil.rmtree(work, ignore_errors=True)


def main(argv):
    args = [a for a in argv if not a.startswith('--')]
    include_idf = '--include-idf' in argv
    keep = None
    if '--keep' in argv:
        keep = argv[argv.index('--keep') + 1]
        args = [a for a in args if a != keep]
    src = args[0] if args else '-'
    raw = sys.stdin.read() if src == '-' else open(src).read()
    try:
        user = json.loads(raw)
        if '--idf-only' in argv:
            _, ddy, stat, sc, _ = build_model(user)
            text, _ = idf.build(sc, ddy, stat)
            sys.stdout.write(text)
            return 0
        out = run(user, include_idf=include_idf, keep_dir=keep)
    except scenario.ScenarioError as e:
        out = {'ok': False, 'error': str(e), 'code': 'bad_input'}
    except subprocess.TimeoutExpired:
        out = {'ok': False, 'error': 'EnergyPlus timed out', 'code': 'timeout'}
    except Exception as e:  # report, don't crash the server
        out = {'ok': False, 'error': '%s: %s' % (type(e).__name__, e), 'code': 'internal'}
    json.dump(out, sys.stdout)
    return 0 if out.get('ok') else 1


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))

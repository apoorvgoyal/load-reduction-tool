"""Run one scenario through EnergyPlus (design-day sizing) and print JSON.

Usage:
  python3 engine/run_scenario.py scenario.json            # result JSON to stdout
  echo '{...}' | python3 engine/run_scenario.py -         # scenario on stdin
  python3 engine/run_scenario.py scenario.json --idf-only  # write the IDF, don't run

A request with "annual": true runs a full year on the station's TMY3
weather file (downloaded once into engine/weather/epw) and returns monthly
energy instead of design-day peaks.

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
ANNUAL_TIMEOUT_S = int(os.environ.get('LOADS_ANNUAL_TIMEOUT', '1800'))
EPW_DIR = os.path.join(HERE, 'weather', 'epw')     # git-ignored download cache


def epw_path(station_id):
    """The station's typical-year (TMY3) weather file from the DOE EnergyPlus
    weather library, downloaded on first use and cached in engine/weather/epw."""
    with open(os.path.join(HERE, 'stations.json')) as f:
        manifest = json.load(f)
    st = next((s for s in manifest['stations'] if s['id'] == station_id), None)
    if not st:
        raise scenario.ScenarioError('unknown station %r' % station_id)
    stem = os.path.basename(st['path'])
    path = os.path.join(EPW_DIR, stem + '.epw')
    if not os.path.exists(path):
        import urllib.request
        os.makedirs(EPW_DIR, exist_ok=True)
        url = '%s/%s/%s.epw' % (manifest['base_url'], st['path'], stem)
        tmp = path + '.part'
        with urllib.request.urlopen(url, timeout=60) as r, open(tmp, 'wb') as f:
            shutil.copyfileobj(r, f)
        os.replace(tmp, path)
    return path


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


def prepare(user, version=None, annual=False):
    """Resolve the scenario and write the IDF. Shared by the native runner
    below and the in-browser runner (web/ep-browser.js), so both build the
    same model."""
    st, ddy, stat, sc, prov = build_model(user)
    text, model = idf.build(sc, ddy, stat, eplus_version=version or '25.2', annual=annual)
    return {'st': st, 'ddy': ddy, 'stat': stat, 'sc': sc, 'prov': prov, 'idf': text, 'model': model,
            'annual': annual, 'version': version or '25.2'}


def assemble(prep, sql, msgs, run_seconds, include_idf=False, weather_file=None, engine_where=None):
    """The result JSON from a finished run's eplusout.sql and error summary."""
    st, ddy, stat, sc, prov, model = (prep[k] for k in ('st', 'ddy', 'stat', 'sc', 'prov', 'model'))
    engine = {'name': 'EnergyPlus', 'version': prep['version'], 'run_seconds': round(run_seconds, 2)}
    if engine_where:
        engine['where'] = engine_where
    if prep['annual']:
        out = {'ok': True, 'mode': 'annual', 'engine': engine,
               'station': {'id': st['id'], 'label': st['label'], 'weather_file': weather_file},
               'scenario': sc, 'provenance': prov,
               'annual': results.parse_annual(sql, model), 'messages': msgs}
    else:
        parsed = results.parse_sql(sql, model)
        engine['version'] = parsed['eplus_version'] or prep['version']
        out = {
            'ok': True,
            'engine': engine,
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
        out['idf'] = prep['idf']
    return out


def run(user, include_idf=False, keep_dir=None, exe=None, version=None, annual=False):
    """Design-day sizing run, or with annual=True a full-year run on the
    station's weather file returning monthly energy."""
    t0 = time.time()
    if exe is None:
        exe, version = find_energyplus()
    if not exe:
        return {'ok': False, 'error': 'EnergyPlus not found. Install EnergyPlus and set ENERGYPLUS_EXE.',
                'code': 'no_engine'}
    prep = prepare(user, version, annual)
    epw = epw_path(prep['st']['id']) if annual else None
    work = keep_dir or tempfile.mkdtemp(prefix='loads_')
    os.makedirs(work, exist_ok=True)
    try:
        idf_path = os.path.join(work, 'in.idf')
        with open(idf_path, 'w') as f:
            f.write(prep['idf'])
        cmd = [exe, '-d', work] + (['-w', epw] if epw else []) + [idf_path]
        proc = subprocess.run(cmd, capture_output=True, text=True,
                              timeout=ANNUAL_TIMEOUT_S if annual else DEFAULT_TIMEOUT_S)
        msgs = results.parse_err(os.path.join(work, 'eplusout.err'))
        sql = os.path.join(work, 'eplusout.sql')
        if proc.returncode != 0 or not os.path.exists(sql) or msgs['fatal']:
            return {'ok': False, 'error': 'EnergyPlus run failed', 'code': 'eplus_failed',
                    'messages': msgs, 'stdout_tail': proc.stdout[-2000:], 'stderr_tail': proc.stderr[-2000:]}
        return assemble(prep, sql, msgs, time.time() - t0, include_idf,
                        weather_file=os.path.basename(epw) if epw else None)
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
        annual = bool(user.pop('annual', False)) if isinstance(user, dict) else False
        if '--idf-only' in argv:
            _, ddy, stat, sc, _ = build_model(user)
            text, _ = idf.build(sc, ddy, stat, annual=annual)
            sys.stdout.write(text)
            return 0
        out = run(user, include_idf=include_idf, keep_dir=keep, annual=annual)
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

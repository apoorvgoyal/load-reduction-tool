"""Engine files the page fetches to run EnergyPlus in the browser.

The in-browser runner (web/ep-browser.js) runs this engine's own Python
(run_scenario.prepare / assemble, under Pyodide) and needs, over HTTP at
/engine/<path>:
  - the Python and JSON the model builder reads (listed in manifest.json),
  - the station's .ddy/.stat, and for annual runs its TMY3 .epw (the DOE
    weather host sends no CORS headers, so the page can't fetch it directly).

Both servers serve /engine/ through resolve() so they agree on what is
exposed; nothing outside these files is reachable.

    python3 engine/web_files.py manifest              # JSON to stdout
    python3 engine/web_files.py resolve weather/X.ddy  # absolute path, or exit 1
    python3 engine/web_files.py build-site DIR        # static copy of the whole site
"""
import json
import os
import re
import shutil
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)

DATA_FILES = ['archetypes.json', 'stations.json']
NAME = re.compile(r'^[A-Za-z0-9_.\-]+$')


def _stations():
    with open(os.path.join(HERE, 'stations.json')) as f:
        return {s['id']: os.path.basename(s['path']) for s in json.load(f)['stations']}


def code_files():
    lib = sorted(f for f in os.listdir(os.path.join(HERE, 'lib')) if f.endswith('.py'))
    return ['run_scenario.py'] + ['lib/' + f for f in lib] + DATA_FILES


def manifest():
    return {'files': code_files(), 'stations': _stations()}


def resolve(rel):
    """Absolute path for an allowed /engine/ path, else None. A station's
    .epw is downloaded into the cache on first request."""
    rel = rel.lstrip('/')
    if rel in code_files():
        return os.path.join(HERE, rel)
    parts = rel.split('/')
    stems = _stations()
    if len(parts) == 2 and parts[0] == 'weather' and NAME.match(parts[1]):
        stem, ext = os.path.splitext(parts[1])
        if stem in stems.values() and ext in ('.ddy', '.stat'):
            p = os.path.join(HERE, 'weather', parts[1])
            return p if os.path.isfile(p) else None
    if len(parts) == 3 and parts[:2] == ['weather', 'epw'] and NAME.match(parts[2]):
        stem, ext = os.path.splitext(parts[2])
        sid = next((k for k, v in stems.items() if v == stem), None)
        if sid and ext == '.epw':
            import run_scenario
            return run_scenario.epw_path(sid)
    return None


def build_site(dest, with_epw=True):
    """Copy web/ plus the /engine/ files into DEST, ready for any static host."""
    if os.path.exists(dest):
        raise SystemExit('%s exists; remove it first' % dest)
    shutil.copytree(os.path.join(ROOT, 'web'), dest)
    eng = os.path.join(dest, 'engine')
    for rel in code_files():
        os.makedirs(os.path.dirname(os.path.join(eng, rel)), exist_ok=True)
        shutil.copy2(os.path.join(HERE, rel), os.path.join(eng, rel))
    os.makedirs(os.path.join(eng, 'weather', 'epw'))
    for stem in _stations().values():
        for ext in ('.ddy', '.stat'):
            shutil.copy2(os.path.join(HERE, 'weather', stem + ext), os.path.join(eng, 'weather', stem + ext))
    if with_epw:
        for stem in _stations().values():
            shutil.copy2(resolve('weather/epw/%s.epw' % stem), os.path.join(eng, 'weather', 'epw', stem + '.epw'))
    with open(os.path.join(eng, 'manifest.json'), 'w') as f:
        json.dump(manifest(), f)
    stamp_assets(dest, build_id())


def build_id():
    """The deployed commit (GITHUB_SHA in Actions, else git), or a timestamp."""
    sha = os.environ.get('GITHUB_SHA')
    if not sha:
        try:
            import subprocess
            sha = subprocess.run(['git', '-C', ROOT, 'rev-parse', 'HEAD'], capture_output=True, text=True).stdout.strip()
        except OSError:
            sha = ''
    if not sha:
        import time
        sha = str(int(time.time()))
    return re.sub(r'[^0-9A-Za-z]', '', sha)[:12]


def stamp_assets(dest, bid):
    """Add ?v=<build> to the page's own scripts and stylesheet, and tell the
    page the build for the files it loads later, so browsers fetch a new
    deploy instead of reusing their cached copy (GitHub Pages caches 10 min)."""
    page = os.path.join(dest, 'index.html')
    with open(page) as f:
        html = f.read()
    html = re.sub(r'((?:src|href)=")((?!https?:)[^"?#]+\.(?:js|css))"', lambda m: m.group(1) + m.group(2) + '?v=' + bid + '"', html)
    html = html.replace('<script src="data/loads-data.js', '<script>window.LOADS_BUILD = "%s";</script>\n<script src="data/loads-data.js' % bid, 1)
    with open(page, 'w') as f:
        f.write(html)


def main(argv):
    if argv[:1] == ['manifest']:
        json.dump(manifest(), sys.stdout)
        return 0
    if argv[:1] == ['resolve'] and len(argv) == 2:
        try:
            p = resolve(argv[1])
        except Exception as e:      # e.g. weather download failed
            sys.stderr.write('%s\n' % e)
            return 2
        if not p:
            return 1
        sys.stdout.write(p)
        return 0
    if argv[:1] == ['build-site'] and len(argv) >= 2:
        build_site(argv[1], with_epw='--no-epw' not in argv)
        return 0
    sys.stderr.write(__doc__)
    return 2


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))

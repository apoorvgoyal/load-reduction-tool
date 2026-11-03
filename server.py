"""Peak Load Tool server, Python edition: same pages and API as server.js,
standard library only, so the tool runs with just Python + EnergyPlus.

    python server.py                 -> http://localhost:3100 (opens your browser)
    python server.py --port 8080 --no-browser

Environment: ENERGYPLUS_EXE, LOADS_MAX_CONCURRENT (2), LOADS_EPLUS_TIMEOUT (300 s),
LOADS_ANNUAL_TIMEOUT (1800 s, annual energy runs).
EnergyPlus runs use the same Python that started this server.
"""
import argparse
import json
import mimetypes
import os
import subprocess
import sys
import threading
import time
import webbrowser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

HERE = os.path.dirname(os.path.abspath(__file__))
WEB = os.path.join(HERE, 'web')
RUNNER = os.path.join(HERE, 'engine', 'run_scenario.py')
sys.path.insert(0, os.path.join(HERE, 'engine'))

import run_scenario  # noqa: E402
import web_files  # noqa: E402

MAX_CONCURRENT = int(os.environ.get('LOADS_MAX_CONCURRENT', '2'))
TIMEOUT_S = int(os.environ.get('LOADS_EPLUS_TIMEOUT', '300')) + 30
ANNUAL_TIMEOUT_S = int(os.environ.get('LOADS_ANNUAL_TIMEOUT', '1800')) + 30
MAX_BODY = 64 * 1024
MIME = {'.js': 'application/javascript', '.css': 'text/css', '.html': 'text/html; charset=utf-8',
        '.json': 'application/json', '.svg': 'image/svg+xml'}

_slots = threading.BoundedSemaphore(MAX_CONCURRENT)
_engine_cache = {'t': 0.0, 'v': None}


def engine_status():
    if _engine_cache['v'] is not None and time.time() - _engine_cache['t'] < 60:
        return _engine_cache['v']
    exe, version = run_scenario.find_energyplus()
    if exe:
        v = {'available': True, 'version': version, 'max_concurrent': MAX_CONCURRENT}
    else:
        v = {'available': False, 'reason': 'EnergyPlus not found (install it or set ENERGYPLUS_EXE)'}
    _engine_cache.update(t=time.time(), v=v)
    return v


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):   # keep the console quiet except for runs
        pass

    def _json(self, code, obj):
        body = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        url = self.path.split('?')[0]
        if url == '/api/engine':
            return self._json(200, engine_status())
        if url == '/engine/manifest.json':
            return self._json(200, web_files.manifest())
        if url.startswith('/engine/'):
            try:
                path = web_files.resolve(url[len('/engine/'):])
            except Exception as e:      # weather download failed
                return self._json(502, {'error': 'Could not fetch the weather file: %s' % e})
        else:
            rel = 'index.html' if url == '/' else url.lstrip('/')
            path = os.path.normpath(os.path.join(WEB, rel))
            if not path.startswith(WEB + os.sep):
                path = None
        if not path or not os.path.isfile(path):
            self.send_response(404)
            self.end_headers()
            return
        with open(path, 'rb') as f:
            data = f.read()
        ext = os.path.splitext(path)[1]
        self.send_response(200)
        self.send_header('Content-Type', MIME.get(ext) or mimetypes.guess_type(path)[0] or 'text/plain')
        self.send_header('Content-Length', str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_POST(self):
        if self.path.split('?')[0] != '/api/run':
            return self._json(405, {'error': 'Method not allowed'})
        n = int(self.headers.get('Content-Length') or 0)
        if n > MAX_BODY:
            return self._json(413, {'ok': False, 'code': 'bad_input', 'error': 'Request too large'})
        raw = self.rfile.read(n)
        try:
            body = json.loads(raw or b'null')
        except ValueError:
            return self._json(400, {'ok': False, 'code': 'bad_input', 'error': 'Body must be JSON'})
        if not _slots.acquire(blocking=False):
            return self._json(429, {'ok': False, 'code': 'busy',
                                    'error': 'EnergyPlus is busy with other runs. Try again shortly.'})
        try:
            print('EnergyPlus run started', flush=True)
            t0 = time.time()
            try:
                annual = isinstance(body, dict) and bool(body.get('annual'))
                p = subprocess.run([sys.executable, RUNNER, '-', '--include-idf'], input=raw,
                                   capture_output=True, timeout=ANNUAL_TIMEOUT_S if annual else TIMEOUT_S)
                payload = json.loads(p.stdout.decode('utf-8', 'replace'))
            except subprocess.TimeoutExpired:
                payload = {'ok': False, 'code': 'timeout', 'error': 'EnergyPlus timed out'}
            except ValueError:
                payload = {'ok': False, 'code': 'internal', 'error': 'Runner produced no result',
                           'stderr_tail': p.stderr.decode('utf-8', 'replace')[-2000:]}
            print('EnergyPlus run %s in %.1f s' % ('ok' if payload.get('ok') else 'FAILED: ' + str(payload.get('error')),
                                                   time.time() - t0), flush=True)
        finally:
            _slots.release()
        code = 200 if payload.get('ok') else {'bad_input': 400, 'no_engine': 503}.get(payload.get('code'), 500)
        self._json(code, payload)


def main(argv=None):
    ap = argparse.ArgumentParser(description='Peak Load Tool server')
    ap.add_argument('--port', type=int, default=int(os.environ.get('PORT', '3100')))
    ap.add_argument('--no-browser', action='store_true')
    a = ap.parse_args(argv)
    srv = ThreadingHTTPServer(('127.0.0.1', a.port), Handler)
    url = 'http://localhost:%d' % a.port
    st = engine_status()
    print('Peak Load Tool on %s' % url)
    print('EnergyPlus: %s' % (st.get('version') if st['available'] else 'NOT FOUND - set ENERGYPLUS_EXE'))
    print('Press Ctrl+C to stop.')
    if not a.no_browser:
        threading.Timer(0.8, lambda: webbrowser.open(url)).start()
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == '__main__':
    main()

"""server.py endpoints, using the stand-in EnergyPlus (placeholder numbers)."""
import json
import os
import sys
import threading
import unittest
import urllib.error
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, ROOT)


class ServerPyTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        os.environ['ENERGYPLUS_EXE'] = os.path.join(HERE, 'fake_energyplus.py')
        import server
        from http.server import ThreadingHTTPServer
        server._engine_cache['v'] = None
        cls.srv = ThreadingHTTPServer(('127.0.0.1', 0), server.Handler)
        cls.base = 'http://127.0.0.1:%d' % cls.srv.server_address[1]
        threading.Thread(target=cls.srv.serve_forever, daemon=True).start()

    @classmethod
    def tearDownClass(cls):
        cls.srv.shutdown()
        cls.srv.server_close()
        os.environ.pop('ENERGYPLUS_EXE', None)

    def _req(self, path, body=None):
        req = urllib.request.Request(self.base + path, data=body, method='POST' if body is not None else 'GET')
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                return r.status, r.read()
        except urllib.error.HTTPError as e:
            return e.code, e.read()

    def test_static_and_traversal(self):
        code, body = self._req('/')
        self.assertEqual(code, 200)
        self.assertIn(b'Peak Load Tool', body)
        self.assertEqual(self._req('/core.js')[0], 200)
        self.assertEqual(self._req('/../server.py')[0], 404)
        self.assertEqual(self._req('/%2e%2e/server.py')[0], 404)

    def test_engine(self):
        code, body = self._req('/api/engine')
        self.assertEqual(code, 200)
        self.assertTrue(json.loads(body)['available'])

    def test_run(self):
        user = {'type': 'office', 'station': 'chicago', 'gfa_m2': 8000, 'n_floors': 3}
        code, body = self._req('/api/run', json.dumps(user).encode())
        out = json.loads(body)
        self.assertEqual(code, 200, out)
        self.assertTrue(out['ok'])
        self.assertIn('clg_db_0.4', out['design_days'])
        self.assertIn('idf', out)

    def test_bad_input(self):
        self.assertEqual(self._req('/api/run', b'nope')[0], 400)
        code, body = self._req('/api/run', json.dumps({'type': 'office', 'station': 'chicago', 'wwr': 5}).encode())
        self.assertEqual(code, 400)
        self.assertEqual(json.loads(body)['code'], 'bad_input')


if __name__ == '__main__':
    unittest.main()

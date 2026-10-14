// Peak Load Tool server — serves web/ and runs EnergyPlus design-day sizing
// via engine/run_scenario.py. Node built-ins only.
//
//   node server.js                 → http://localhost:3100
//
// Environment:
//   PORT                  port (default 3100)
//   ENERGYPLUS_EXE        EnergyPlus executable if not on PATH
//   LOADS_PYTHON          Python 3 interpreter (default python3)
//   LOADS_MAX_CONCURRENT  simultaneous EnergyPlus runs (default 2)
//   LOADS_EPLUS_TIMEOUT   seconds per run (default 300)
'use strict';
const http = require('http'), fs = require('fs'), path = require('path');
const {spawn, execFile} = require('child_process');

const PORT = +process.env.PORT || 3100;
const WEB = path.join(__dirname, 'web');
const PYTHON = process.env.LOADS_PYTHON || 'python3';
const MAX_CONCURRENT = +process.env.LOADS_MAX_CONCURRENT || 2;
const TIMEOUT_MS = (+process.env.LOADS_EPLUS_TIMEOUT || 300) * 1000 + 30000;
const MAX_BODY = 64 * 1024;
const MIME = {html: 'text/html; charset=utf-8', js: 'application/javascript', css: 'text/css',
  json: 'application/json', svg: 'image/svg+xml', png: 'image/png'};

let active = 0, engineCache = null;

function json(res, code, obj) {
  res.writeHead(code, {'Content-Type': 'application/json'});
  res.end(JSON.stringify(obj));
}

function engineStatus(cb) {
  if (engineCache && Date.now() - engineCache.t < 60000) return cb(engineCache.v);
  const exe = process.env.ENERGYPLUS_EXE || 'energyplus';
  execFile(exe, ['--version'], {timeout: 20000}, (err, stdout) => {
    const m = /Version (\d+\.\d+\.\d+)/.exec(stdout || '');
    const v = err || !m
      ? {available: false, reason: 'EnergyPlus not found on the server (install it or set ENERGYPLUS_EXE)'}
      : {available: true, version: m[1], max_concurrent: MAX_CONCURRENT};
    engineCache = {t: Date.now(), v: v};
    cb(v);
  });
}

function runScenario(req, res) {
  let body = '', tooBig = false;
  req.on('data', c => { if (tooBig) return; body += c; if (body.length > MAX_BODY) { tooBig = true; body = ''; } });
  req.on('end', () => {
    if (tooBig) return json(res, 413, {ok: false, code: 'bad_input', error: 'Request too large'});
    try { JSON.parse(body); } catch (e) { return json(res, 400, {ok: false, code: 'bad_input', error: 'Body must be JSON'}); }
    if (active >= MAX_CONCURRENT) {
      return json(res, 429, {ok: false, code: 'busy', error: 'EnergyPlus is busy with other runs. Try again shortly.'});
    }
    active++;
    const child = spawn(PYTHON, [path.join(__dirname, 'engine', 'run_scenario.py'), '-', '--include-idf'],
      {env: process.env});
    let out = '', err = '';
    const timer = setTimeout(() => child.kill('SIGKILL'), TIMEOUT_MS);
    child.stdout.on('data', d => { out += d; });
    child.stderr.on('data', d => { err += d; });
    child.on('error', e => { err += e.message; });
    child.on('close', () => {
      clearTimeout(timer);
      active--;
      let payload;
      try { payload = JSON.parse(out); } catch (e) {
        payload = {ok: false, code: 'internal', error: 'Runner produced no result', stderr_tail: err.slice(-2000)};
      }
      const code = payload.ok ? 200 : ({bad_input: 400, no_engine: 503}[payload.code] || 500);
      json(res, code, payload);
    });
    child.stdin.end(body);
  });
}

http.createServer((req, res) => {
  const url = req.url.split('?')[0];
  if (req.method === 'GET' && url === '/api/engine') return engineStatus(v => json(res, 200, v));
  if (req.method === 'POST' && url === '/api/run') return runScenario(req, res);
  if (req.method !== 'GET') return json(res, 405, {error: 'Method not allowed'});

  const file = path.normalize(path.join(WEB, url === '/' ? 'index.html' : url));
  if (!file.startsWith(WEB + path.sep)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, {'Content-Type': MIME[path.extname(file).slice(1)] || 'text/plain'});
    res.end(data);
  });
}).listen(PORT, () => console.log('Peak Load Tool on http://localhost:' + PORT));

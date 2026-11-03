// In-browser EnergyPlus. The engine's own Python (engine/run_scenario.py:
// prepare and assemble, unchanged) runs under Pyodide to write the IDF and to
// read eplusout.sql; EnergyPlus 25.2 itself runs as WebAssembly through
// @idfkit/engine. Same request and same result JSON as POST /api/run, so the
// page treats both alike. Nothing is installed and the model never leaves the
// browser. Engine and Python load on the first run (about 45 MB, then cached).
(function () {
  'use strict';
  var PYODIDE = 'https://cdn.jsdelivr.net/pyodide/v0.29.5/full/';
  var ENGINE = 'https://cdn.jsdelivr.net/npm/@idfkit/engine@0.6.0/dist/';
  var ASSETS = 'https://cdn.jsdelivr.net/npm/@idfkit/engine-assets@25.2.1/assets';
  var WASM = 'energyplus.js-25.2.wasm';
  var VERSION = '25.2';
  var OUTPUTS = {sql: true, eso: false, mtr: false, csv: false, html: false, rdd: false, mdd: false};

  var py = null, pyLoading = null, engineMod = null, idle = [], created = 0, queue = [], seq = 0;
  var stationFiles = {}, epwText = {};
  var MAX_ENGINES = Math.max(1, Math.min(4, (navigator.hardwareConcurrency || 2) - 1));

  function supported() { return typeof WebAssembly === 'object' && typeof Worker === 'function'; }

  function loadScript(src) {
    return new Promise(function (ok, fail) {
      var s = document.createElement('script');
      s.src = src; s.onload = ok; s.onerror = function () { fail(new Error('Could not load ' + src)); };
      document.head.appendChild(s);
    });
  }
  function get(url, binary) {
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error('Could not fetch ' + url + ' (' + r.status + ')');
      return binary ? r.arrayBuffer() : r.text();
    });
  }

  function loadPython(status) {
    if (py) return Promise.resolve(py);
    if (!pyLoading) {
      pyLoading = (async function () {
        status('Loading the model builder (first run only)…');
        if (!window.loadPyodide) await loadScript(PYODIDE + 'pyodide.js');
        var p = await window.loadPyodide({indexURL: PYODIDE});
        await p.loadPackage('sqlite3');
        var man, v = window.LOADS_BUILD ? '?v=' + window.LOADS_BUILD : '';
        try { man = JSON.parse(await get('engine/manifest.json' + v)); } catch (e) {
          throw new Error('this page\'s server does not provide the engine files (engine/manifest.json). ' +
            'If you run it with python server.py, stop it (Ctrl+C), git pull, and start it again; ' +
            'for a static copy, build it with python3 engine/web_files.py build-site');
        }
        p.FS.mkdirTree('/engine/lib'); p.FS.mkdirTree('/engine/weather/epw'); p.FS.mkdirTree('/work');
        await Promise.all(man.files.map(function (f) {
          return get('engine/' + f + v).then(function (t) { p.FS.writeFile('/engine/' + f, t); });
        }));
        p.runPython("import sys, json\nsys.path.insert(0, '/engine')\nimport run_scenario\nPREPS = {}");
        py = {p: p, stations: man.stations};
        return py;
      })();
      pyLoading.catch(function () { pyLoading = null; });
    }
    return pyLoading;
  }

  async function station(P, stem, annual, status) {
    if (!stationFiles[stem]) {
      var t = await Promise.all([get('engine/weather/' + stem + '.ddy'), get('engine/weather/' + stem + '.stat')]);
      P.p.FS.writeFile('/engine/weather/' + stem + '.ddy', t[0]);
      P.p.FS.writeFile('/engine/weather/' + stem + '.stat', t[1]);
      stationFiles[stem] = true;
    }
    if (annual && !epwText[stem]) {
      status('Fetching the weather file…');
      epwText[stem] = await get('engine/weather/epw/' + stem + '.epw');
    }
  }

  // A small pool of engines (each one runs in its own worker, one run at a time).
  function acquire(status) {
    if (idle.length) return Promise.resolve(idle.pop());
    if (created < MAX_ENGINES) {
      created++;
      return (async function () {
        try {
          if (!engineMod) {
            status('Loading EnergyPlus ' + VERSION + ' (first run only)…');
            engineMod = await import(ENGINE + 'index.js');
          }
          return await engineMod.createEnergyPlus({assetBaseUrl: ASSETS, workerUrl: ENGINE + 'engine.worker.js', wasmFile: WASM});
        } catch (e) { created--; throw e; }
      })();
    }
    return new Promise(function (ok) { queue.push(ok); });
  }
  function release(e) { var w = queue.shift(); if (w) w(e); else idle.push(e); }
  function discard() { created--; var w = queue.shift(); if (w) acquire(function () {}).then(w); }

  function messages(err) {
    var entries = (err && err.entries) || [];
    function of(sev, prefix) {
      return entries.filter(function (e) { return e.severity === sev; }).map(function (e) { return prefix + e.message; });
    }
    return {warnings: (err && err.warningCount) || 0, severe: (err && err.severeCount) || 0,
      fatal: of('fatal', '**  Fatal  ** '), severe_messages: of('severe', '** Severe  ** ').slice(0, 20)};
  }

  // body: the same JSON POST /api/run takes. Resolves with the same result JSON.
  async function run(body, status) {
    status = status || function () {};
    var t0 = performance.now();
    var P = await loadPython(status);
    var annual = !!body.annual, user = Object.assign({}, body);
    delete user.annual;
    var stem = P.stations[user.station];
    if (!stem) return {ok: false, code: 'bad_input', error: 'Unknown station ' + user.station};
    await station(P, stem, annual, status);
    var id = ++seq;
    P.p.globals.set('req_json', JSON.stringify(user));
    var prep = JSON.parse(P.p.runPython(
      'try:\n' +
      '    PREPS[' + id + '] = run_scenario.prepare(json.loads(req_json), annual=' + (annual ? 'True' : 'False') + ')\n' +
      '    _r = {"ok": True, "idf": PREPS[' + id + ']["idf"]}\n' +
      'except run_scenario.scenario.ScenarioError as e:\n' +
      '    _r = {"ok": False, "code": "bad_input", "error": str(e)}\n' +
      'json.dumps(_r)'));
    if (!prep.ok) return prep;
    var eng = await acquire(status), r;
    try {
      status(annual ? 'Running EnergyPlus for a full year (a few minutes)…' : 'Running EnergyPlus…');
      r = await eng.run({idf: prep.idf, epw: annual ? epwText[stem] : undefined, outputs: OUTPUTS});
      release(eng);
    } catch (e) {
      try { eng.dispose(); } catch (x) { /* already gone */ }
      discard();
      P.p.runPython('PREPS.pop(' + id + ', None)');
      return {ok: false, code: 'internal', error: 'The in-browser engine stopped: ' + (e && e.message || e)};
    }
    var msgs = messages(r.err);
    if (!r.success || !r.sql || msgs.fatal.length) {
      P.p.runPython('PREPS.pop(' + id + ', None)');
      return {ok: false, code: 'eplus_failed', error: 'EnergyPlus run failed' + (r.fatalError ? ': ' + r.fatalError : ''), messages: msgs};
    }
    var sql = '/work/run_' + id + '.sql';
    P.p.FS.writeFile(sql, new Uint8Array(r.sql));
    P.p.globals.set('msgs_json', JSON.stringify(msgs));
    try {
      return JSON.parse(P.p.runPython(
        'json.dumps(run_scenario.assemble(PREPS.pop(' + id + '), "' + sql + '", json.loads(msgs_json), ' +
        ((performance.now() - t0) / 1000) + ', include_idf=True, weather_file=' + (annual ? '"' + stem + '.epw"' : 'None') +
        ', engine_where="browser"))'));
    } finally {
      P.p.FS.unlink(sql);
    }
  }

  window.EPBrowser = {supported: supported, run: run, version: VERSION, maxParallel: MAX_ENGINES};
})();

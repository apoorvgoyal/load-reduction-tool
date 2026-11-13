// Owner view (mockup): the same models as the detailed tool (core.js), asked
// the owner's questions: how big and how costly is the plant for each design
// option, and how sure is each number. No values are invented here: options
// are bundles of the presets in data/presets.js (steps from the archetype
// default), and prices come only from rates the user types.
(function () {
  'use strict';
  var D = window.LOADS_DATA, C = window.LoadsCore, PRESETS = window.LOADS_PRESETS || {_all: {}};
  var INDEX = (window.LOADS_SURROGATE && window.LOADS_SURROGATE.index) || {};
  var SUR = window.LOADS_SURROGATE_MODELS = window.LOADS_SURROGATE_MODELS || {};
  var LOADING = {};
  var COOL_PCT = '0.4', HEAT_PCT = '99.6';      // the detailed tool's defaults
  var STORE = 'peak-load-tool.owner.v1';

  // ── Measures: one preset each (label as the owner would say it) ─────────
  function preset(k, label) {
    var list = (PRESETS._all[k] || []), p = null;
    list.forEach(function (x) { if (x.label === label) p = x; });
    if (!p) throw new Error('preset missing: ' + k + ' / ' + label);
    return p;
  }
  var MEASURES = {
    wall: {name: 'Better wall insulation', set: [['wall_u', preset('wall_u', 'Better insulated')]]},
    roof: {name: 'Better roof insulation', set: [['roof_u', preset('roof_u', 'Better insulated')]]},
    solar: {name: 'Glass that lets in less sun heat', set: [['shgc', preset('shgc', 'Lets in less sun heat')]]},
    shade: {name: 'Window shading', set: [['overhang_pf', preset('overhang_pf', 'Some shading')]]},
    tight: {name: 'Tighter envelope', set: [['infiltration_ach', preset('infiltration_ach', 'Tighter')]]},
    hr: {name: 'Heat recovery', set: [['erv_sensible_eff', preset('erv_sensible_eff', 'Standard')], ['erv_latent_eff', preset('erv_latent_eff', 'Standard')]]},
    hr_hi: {name: 'High-efficiency heat recovery', set: [['erv_sensible_eff', preset('erv_sensible_eff', 'High-efficiency')], ['erv_latent_eff', preset('erv_latent_eff', 'High-efficiency')]]},
    light: {name: 'Efficient lighting', set: [['lpd_w_m2', preset('lpd_w_m2', 'Efficient lighting')]]}
  };
  var PACKAGES = [
    {id: 'typical', name: 'Typical', desc: 'Typical values for this building type and location', m: []},
    {id: 'envelope', name: 'Better envelope', desc: 'Insulation, glass, shading and airtightness', m: ['wall', 'roof', 'solar', 'shade', 'tight']},
    {id: 'envelope_hr', name: 'Better envelope + heat recovery', desc: 'Adds standard heat recovery on the outdoor air', m: ['wall', 'roof', 'solar', 'shade', 'tight', 'hr']},
    {id: 'high', name: 'High performance', desc: 'Adds high-efficiency heat recovery and efficient lighting', m: ['wall', 'roof', 'solar', 'shade', 'tight', 'hr_hi', 'light']}
  ];
  var LEVERS = ['wall', 'roof', 'solar', 'shade', 'tight', 'hr', 'hr_hi', 'light'];

  function presetText(k, p) {
    if (p.rel != null) return (p.rel < 1 ? '−' : '+') + Math.round(Math.abs(p.rel - 1) * 100) + '% vs typical';
    if (k === 'overhang_pf') return 'projection factor ' + p.value;
    if (k.indexOf('erv_') === 0) return Math.round(p.value * 100) + '% effective';
    return String(p.value);
  }
  function applyMeasure(sc, base, id) {
    MEASURES[id].set.forEach(function (kp) {
      var k = kp[0], p = kp[1], f = D.fields[k] || {}, v;
      v = p.rel != null ? base[k] * p.rel : p.delta != null ? base[k] + p.delta : p.value;
      if (f.min !== undefined) v = Math.max(f.min, v);
      if (f.max !== undefined) v = Math.min(f.max, v);
      sc[k] = v;
    });
  }

  // ── State ───────────────────────────────────────────────────────────────
  var S = {openPkg: null, type: 'office', station: 'chicago', gfa: null, floors: null, ip: true, picked: ['typical', 'envelope', 'high'],
    rates: {clg: '', htg: '', cop: ''}};
  try { var saved = JSON.parse(localStorage.getItem(STORE) || 'null'); if (saved) Object.keys(S).forEach(function (k) { if (saved[k] != null) S[k] = saved[k]; }); } catch (e) { /* no storage */ }
  function save() { try { localStorage.setItem(STORE, JSON.stringify(S)); } catch (e) { /* no storage */ } }

  function station(id) { var s = null; D.stations.forEach(function (x) { if (x.id === id) s = x; }); return s || D.stations[0]; }
  function zone(id) {
    var z = station(id).climate_zone_stat, zs = Object.keys(D.archetypes.envelope_by_climate_zone).filter(function (k) { return k[0] !== '_'; });
    return zs.indexOf(z) >= 0 ? z : z.charAt(0);
  }
  function baseScenario() {
    var sc = C.defaults(D, S.type, zone(S.station)).scenario;
    if (S.gfa == null) { S.gfa = sc.gfa_m2; S.floors = sc.n_floors; }
    sc.gfa_m2 = S.gfa; sc.n_floors = S.floors;
    return sc;
  }
  function modelKey() { return S.type + '|' + S.station; }
  function model() {
    var k = modelKey();
    if (SUR[k]) return SUR[k];
    if (INDEX[k] && !LOADING[k]) {
      LOADING[k] = true;
      var s = document.createElement('script');
      s.src = 'data/surrogates/' + k.replace('|', '__') + '.js';
      s.onload = render; s.onerror = function () { LOADING[k] = 'error'; render(); };
      document.head.appendChild(s);
    }
    return null;
  }

  // ── Numbers ─────────────────────────────────────────────────────────────
  function peaks(m, sc) {
    var r = C.surrogateResult(m, sc), g = C.governing(r, COOL_PCT, HEAT_PCT);
    return {clg_kw: g.cooling ? g.cooling.total_w / 1000 : null, htg_kw: g.heating ? g.heating.total_w / 1000 : null,
      extrapolated: r.extrapolated && r.extrapolated.length ? r.extrapolated : null, failed: C.failedTest(m, S.type, sc)};
  }
  function evalPackage(m, base, pkg) {
    var sc = Object.assign({}, base);
    pkg.m.forEach(function (id) { applyMeasure(sc, base, id); });
    var p = peaks(m, sc); p.sc = sc; return p;
  }
  var nf = function (v, d) { return v == null || !isFinite(v) ? '–' : v.toLocaleString('en-US', {maximumFractionDigits: d || 0, minimumFractionDigits: d || 0}); };
  function clgVal(kw) { return S.ip ? kw / C.KW_PER_TON : kw; }
  function htgVal(kw) { return S.ip ? kw * C.MBH_PER_KW : kw; }
  var CU = function () { return S.ip ? 'tons' : 'kW'; }, HU = function () { return S.ip ? 'MBH' : 'kW'; };
  function rate(k) { var v = parseFloat(S.rates[k]); return v > 0 ? v : null; }
  function cost(p) {
    var rc = rate('clg'), rh = rate('htg');
    if (!rc && !rh) return null;
    return {clg: rc ? clgVal(p.clg_kw) * rc : null, htg: rh ? htgVal(p.htg_kw) * rh : null};
  }
  function money(v) { return v == null ? '–' : '$' + (v >= 1e6 ? nf(v / 1e6, 2) + 'M' : nf(Math.round(v / 1000)) + 'k'); }
  function pctChange(v, ref) { return ref ? (v / ref - 1) * 100 : 0; }
  function chg(v, ref) {
    var c = pctChange(v, ref);
    if (Math.abs(c) < 0.5) return '<span class="chg same">same as typical</span>';
    return '<span class="chg ' + (c < 0 ? 'down' : 'up') + '">' + (c < 0 ? '−' : '+') + nf(Math.abs(c)) + '% vs typical</span>';
  }
  // A saving (positive = less plant), rounded; under half a unit reads as "under 1".
  function delta(v, u) {
    if (Math.abs(v) < 0.5) return '<span class="mut">under 1 ' + u + '</span>';
    return (v >= 0 ? '−' : '+') + nf(Math.abs(v)) + ' ' + u;
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]; }); }
  function trust(p) {
    if (p.failed) return '<span class="trust ind" title="This model missed the 5% limit on its test runs">Estimate ±' + nf(Math.ceil(p.failed.worst)) + '%</span>';
    if (p.extrapolated) return '<span class="trust ind" title="Some inputs are outside the range the model was trained on">Outside tested range</span>';
    return '<span class="trust ok" title="95% of test runs within 5% of a full EnergyPlus simulation">Within 5% in testing</span>';
  }

  // ── Render ──────────────────────────────────────────────────────────────
  function pkgById(id) { var p = null; PACKAGES.forEach(function (x) { if (x.id === id) p = x; }); return p; }
  function renderPackages(base) {
    document.getElementById('pkgs').innerHTML = PACKAGES.map(function (pkg) {
      var on = S.picked.indexOf(pkg.id) >= 0, full = !on && S.picked.length >= 3;
      var items = pkg.m.map(function (id) {
        return '<li>' + esc(MEASURES[id].name) + ' <span class="mut">(' + MEASURES[id].set.map(function (kp) { return esc(presetText(kp[0], kp[1])); }).filter(function (x, i, a) { return a.indexOf(x) === i; }).join(', ') + ')</span></li>';
      }).join('');
      return '<div class="pkg' + (on ? ' on' : '') + (full ? ' off' : '') + '"><label class="pkg-l"><input type="checkbox" data-pkg="' + pkg.id + '"' + (on ? ' checked' : '') + (full ? ' disabled' : '') + '>' +
        '<span class="pkg-b"><b>' + esc(pkg.name) + '</b><span class="mut">' + esc(pkg.desc) + '</span></span></label>' +
        (items ? '<details class="pkg-d"' + (S.openPkg === pkg.id ? ' open' : '') + ' data-d="' + pkg.id + '"><summary>' + pkg.m.length + ' changes from typical</summary><ul>' + items + '</ul></details>' : '') + '</div>';
    }).join('');
  }
  function render() {
    var base = baseScenario(), m = model();
    document.getElementById('f-area').value = S.ip ? Math.round(S.gfa * C.FT2_PER_M2) : Math.round(S.gfa);
    document.getElementById('f-area-u').textContent = S.ip ? 'ft²' : 'm²';
    document.getElementById('f-floors').value = S.floors;
    document.getElementById('r-clg-u').textContent = S.ip ? 'per ton' : 'per kW';
    document.getElementById('r-htg-u').textContent = S.ip ? 'per MBH' : 'per kW';
    document.getElementById('u-ip').setAttribute('aria-pressed', S.ip); document.getElementById('u-si').setAttribute('aria-pressed', !S.ip);
    var st = station(S.station);
    document.getElementById('f-note').textContent = 'Climate zone ' + st.climate_zone_stat + '. Everything else starts at typical values for this building type and climate.';
    renderPackages(base);
    var head = document.getElementById('headline'), opts = document.getElementById('opts'), lev = document.getElementById('levers');
    if (!m) {
      var msg = INDEX[modelKey()] ? (LOADING[modelKey()] === 'error' ? 'The model for this building type and location could not be loaded.' : 'Loading the model for this building type and location…') :
        'There is no trained model for this building type and location yet. Use the detailed tool to run a full simulation.';
      head.innerHTML = '<p class="empty">' + esc(msg) + '</p>'; opts.innerHTML = ''; lev.innerHTML = ''; return;
    }
    var typical = evalPackage(m, base, PACKAGES[0]);
    var rows = S.picked.map(function (id) { var pkg = pkgById(id); var p = evalPackage(m, base, pkg); p.pkg = pkg; return p; });
    var maxC = Math.max.apply(null, rows.map(function (r) { return r.clg_kw; }).concat([typical.clg_kw]));
    var maxH = Math.max.apply(null, rows.map(function (r) { return r.htg_kw; }).concat([typical.htg_kw]));

    // Headline: the best picked option against Typical.
    var best = rows.filter(function (r) { return r.pkg.id !== 'typical'; }).sort(function (a, b) { return a.clg_kw - b.clg_kw; })[0];
    if (best) {
      var dc = pctChange(best.clg_kw, typical.clg_kw), dh = pctChange(best.htg_kw, typical.htg_kw), ct = cost(typical), cb = cost(best), save$ = null;
      if (ct && cb) save$ = (ct.clg || 0) + (ct.htg || 0) - (cb.clg || 0) - (cb.htg || 0);
      head.innerHTML = '<p class="hl-k">Best option shown</p><p class="hl"><b>' + esc(best.pkg.name) + '</b> needs a cooling plant of <b>' + nf(clgVal(best.clg_kw)) + ' ' + CU() + '</b> instead of ' +
        nf(clgVal(typical.clg_kw)) + ' (' + (dc <= 0 ? '−' : '+') + nf(Math.abs(dc)) + '%), and heating of <b>' + nf(htgVal(best.htg_kw)) + ' ' + HU() + '</b> instead of ' + nf(htgVal(typical.htg_kw)) +
        ' (' + (dh <= 0 ? '−' : '+') + nf(Math.abs(dh)) + '%).' + (save$ != null ? ' At your rates that is <b>' + money(Math.abs(save$)) + (save$ >= 0 ? ' less' : ' more') + '</b> in heating and cooling equipment.' : '') + '</p>';
    } else head.innerHTML = '<p class="hl">Pick a design option to compare with typical.</p>';

    opts.style.setProperty('--n', rows.length);
    opts.innerHTML = rows.map(function (r) {
      var c = cost(r), elec = rate('cop') ? r.htg_kw / rate('cop') : null, isT = r.pkg.id === 'typical';
      return '<article class="opt' + (isT ? ' ref' : '') + '"><div class="opt-h"><h3>' + esc(r.pkg.name) + '</h3>' + trust(r) + '</div>' +
        '<div class="meas cool"><span class="k">Cooling plant</span><span class="v">' + nf(clgVal(r.clg_kw)) + ' <small>' + CU() + '</small></span>' +
        '<span class="bar"><i style="width:' + (r.clg_kw / maxC * 100).toFixed(1) + '%"></i></span>' + (isT ? '<span class="chg same">reference</span>' : chg(r.clg_kw, typical.clg_kw)) + '</div>' +
        '<div class="meas heat"><span class="k">Heating plant</span><span class="v">' + nf(htgVal(r.htg_kw)) + ' <small>' + HU() + '</small></span>' +
        '<span class="bar"><i style="width:' + (r.htg_kw / maxH * 100).toFixed(1) + '%"></i></span>' + (isT ? '<span class="chg same">reference</span>' : chg(r.htg_kw, typical.htg_kw)) + '</div>' +
        '<dl class="extra"><div><dt>Equipment cost</dt><dd>' + (c ? money((c.clg || 0) + (c.htg || 0)) + (c.clg == null || c.htg == null ? ' <span class="mut">(partial: add both rates)</span>' : '') : '<span class="mut">add your rates</span>') + '</dd></div>' +
        '<div><dt>Heat pump electric load at design</dt><dd>' + (elec ? nf(elec) + ' kW' : '<span class="mut">add a COP</span>') + '</dd></div>' +
        '<div><dt>Per floor area</dt><dd>' + (S.ip ? nf(r.sc.gfa_m2 * C.FT2_PER_M2 / clgVal(r.clg_kw)) + ' ft² per ton' : nf(r.clg_kw * 1000 / r.sc.gfa_m2) + ' W/m² cooling') + '</dd></div></dl></article>';
    }).join('');

    // Levers: each measure on its own, from Typical.
    var lv = LEVERS.map(function (id) {
      var p = evalPackage(m, base, {m: [id]});
      return {id: id, dc: typical.clg_kw - p.clg_kw, dh: typical.htg_kw - p.htg_kw, pc: -pctChange(p.clg_kw, typical.clg_kw), ph: -pctChange(p.htg_kw, typical.htg_kw)};
    }).sort(function (a, b) { return Math.max(b.pc, b.ph) - Math.max(a.pc, a.ph); });
    var top = Math.max.apply(null, lv.map(function (x) { return Math.max(Math.abs(x.pc), Math.abs(x.ph)); })) || 1;
    document.getElementById('levers-sub').textContent = 'Each change on its own, from typical';
    function lbar(pct, cls) {
      var w = Math.min(100, Math.abs(pct) / top * 100);
      return '<span class="lbar ' + cls + (pct < 0 ? ' neg' : '') + '"><i style="width:' + w.toFixed(1) + '%"></i></span>';
    }
    lev.innerHTML = '<div class="lv-h"><span></span><span>Cooling plant</span><span>Heating plant</span></div>' + lv.map(function (x) {
      var mm = MEASURES[x.id];
      return '<div class="lv"><span class="lv-n">' + esc(mm.name) + '<span class="mut"> · ' + esc(mm.set.map(function (kp) { return presetText(kp[0], kp[1]); }).filter(function (v, i, a) { return a.indexOf(v) === i; }).join(', ')) + '</span></span>' +
        '<span class="lv-c">' + lbar(x.pc, 'cool') + '<b>' + delta(clgVal(x.dc), CU()) + '</b></span>' +
        '<span class="lv-c">' + lbar(x.ph, 'heat') + '<b>' + delta(htgVal(x.dh), HU()) + '</b></span></div>';
    }).join('');
    save();
  }

  // ── Inputs ──────────────────────────────────────────────────────────────
  var fType = document.getElementById('f-type'), fSt = document.getElementById('f-station');
  fType.innerHTML = Object.keys(D.archetypes.types).map(function (k) { return '<option value="' + k + '">' + esc(D.archetypes.types[k].label) + '</option>'; }).join('');
  fSt.innerHTML = D.stations.slice().sort(function (a, b) { return a.label.localeCompare(b.label); }).map(function (s) { return '<option value="' + s.id + '">' + esc(s.label) + '</option>'; }).join('');
  fType.value = S.type; fSt.value = S.station;
  fType.addEventListener('change', function () { S.type = fType.value; S.gfa = null; render(); });
  fSt.addEventListener('change', function () { S.station = fSt.value; render(); });
  document.getElementById('f-area').addEventListener('change', function (e) {
    var v = parseFloat(e.target.value); if (v > 0) S.gfa = S.ip ? v / C.FT2_PER_M2 : v; render();
  });
  document.getElementById('f-floors').addEventListener('change', function (e) {
    var v = Math.round(parseFloat(e.target.value)); if (v >= 1) S.floors = v; render();
  });
  ['clg', 'htg', 'cop'].forEach(function (k) {
    var el = document.getElementById('r-' + k); el.value = S.rates[k];
    el.addEventListener('input', function () { S.rates[k] = el.value; render(); });
  });
  document.getElementById('pkgs').addEventListener('toggle', function (e) {
    var id = e.target.getAttribute && e.target.getAttribute('data-d'); if (!id) return;
    S.openPkg = e.target.open ? id : (S.openPkg === id ? null : S.openPkg);
  }, true);
  document.getElementById('pkgs').addEventListener('change', function (e) {
    var id = e.target.getAttribute('data-pkg'); if (!id) return;
    var i = S.picked.indexOf(id);
    if (e.target.checked && i < 0) S.picked.push(id); else if (!e.target.checked && i >= 0) S.picked.splice(i, 1);
    S.picked.sort(function (a, b) { return PACKAGES.indexOf(pkgById(a)) - PACKAGES.indexOf(pkgById(b)); });
    render();
  });
  function setUnits(ip) {
    if (S.ip === ip) return;
    // Rates are per unit of capacity: convert so the same money stays meaning the same.
    var kc = C.KW_PER_TON, kh = 1 / C.MBH_PER_KW;          // kW per ton, kW per MBH
    if (rate('clg')) S.rates.clg = String(+(ip ? S.rates.clg * kc : S.rates.clg / kc).toFixed(0));
    if (rate('htg')) S.rates.htg = String(+(ip ? S.rates.htg * kh : S.rates.htg / kh).toFixed(1));
    document.getElementById('r-clg').value = S.rates.clg; document.getElementById('r-htg').value = S.rates.htg;
    S.ip = ip; render();
  }
  document.getElementById('u-ip').addEventListener('click', function () { setUnits(true); });
  document.getElementById('u-si').addEventListener('click', function () { setUnits(false); });
  render();
})();

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
  var S = {lcc: {}, runs: {}, openPkg: null, type: 'office', station: 'chicago', gfa: null, floors: null, ip: true, picked: ['typical', 'envelope', 'high'],
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
  function money(v) {
    if (v == null) return '–';
    var s = v < 0 ? '−' : '', a = Math.abs(v);
    return s + '$' + (a >= 1e6 ? nf(a / 1e6, 2) + 'M' : a >= 1e4 ? nf(a / 1000) + 'k' : nf(a));
  }
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
    renderLCC(m, base, typical, rows);
    save();
  }


  // ── Life-cycle cost ─────────────────────────────────────────────────────
  // Inputs are stored in one unit (SI areas, $ per therm, W per L/s) and shown
  // in the page's units. k: shown = stored x k in IP (SI when kSI is given).
  var CFM_PER_LS = 2.118880;
  var LF = [
    {g: 'Study', k: 'years', label: 'Study period', u: 'years', step: 1},
    {g: 'Study', k: 'disc', label: 'Discount rate (real)', u: '% per year', step: 0.1},
    {g: 'Study', k: 'esc', label: 'Energy price escalation above inflation', u: '% per year', step: 0.1, blank0: true},
    {g: 'Energy', k: 'pElec', label: 'Electricity price', u: '$ per kWh', step: 0.01},
    {g: 'Energy', k: 'pGas', label: 'Gas price', u: '$ per therm', uSI: '$ per kWh', kSI: 1 / 29.3071, step: 0.01, gas: true},
    {g: 'Energy', k: 'copClg', label: 'Cooling plant seasonal efficiency', u: 'COP', step: 0.1},
    {g: 'Energy', k: 'heatSrc', label: 'Heating source', select: [['gas', 'Gas boiler'], ['heatpump', 'Heat pump'], ['electric', 'Electric resistance']]},
    {g: 'Energy', k: 'heatEff', label: 'Heating seasonal efficiency', u: 'fraction or COP', step: 0.01, noElec: true},
    {g: 'Energy', k: 'sfp', label: 'Fan power', u: 'W per cfm', uSI: 'W per L/s', kIP: 1 / CFM_PER_LS, step: 0.01},
    {g: 'Costs of the changes', k: 'cWall', m: 'wall', label: 'Better wall insulation', u: '$ per ft² of wall', uSI: '$ per m² of wall', area: 'wall'},
    {g: 'Costs of the changes', k: 'cRoof', m: 'roof', label: 'Better roof insulation', u: '$ per ft² of roof', uSI: '$ per m² of roof', area: 'roof'},
    {g: 'Costs of the changes', k: 'cSolar', m: 'solar', label: 'Glass that lets in less sun heat', u: '$ per ft² of glass', uSI: '$ per m² of glass', area: 'glass'},
    {g: 'Costs of the changes', k: 'cShade', m: 'shade', label: 'Window shading', u: '$ per ft² of glass', uSI: '$ per m² of glass', area: 'glass'},
    {g: 'Costs of the changes', k: 'cTight', m: 'tight', label: 'Tighter envelope', u: '$ per ft² of facade', uSI: '$ per m² of facade', area: 'facade'},
    {g: 'Costs of the changes', k: 'cHr', m: 'hr', label: 'Heat recovery', u: '$ total', lump: true},
    {g: 'Costs of the changes', k: 'cHrHi', m: 'hr_hi', label: 'High-efficiency heat recovery', u: '$ total', lump: true},
    {g: 'Costs of the changes', k: 'cLight', m: 'light', label: 'Efficient lighting', u: '$ per ft² of floor', uSI: '$ per m² of floor', area: 'floor'},
    {g: 'Plant upkeep', k: 'maintPct', label: 'Maintenance', u: '% of plant cost per year', step: 0.1},
    {g: 'Plant upkeep', k: 'life', label: 'Plant service life', u: 'years', step: 1}
  ];
  function lfK(f) {           // shown = stored x k
    if (f.area) return S.ip ? 1 / C.FT2_PER_M2 : 1;
    if (f.kIP) return S.ip ? f.kIP : 1;
    if (f.kSI) return S.ip ? 1 : f.kSI;
    return 1;
  }
  function lfU(f) { return !S.ip && f.uSI ? f.uSI : f.u; }
  function L(k) { var v = parseFloat(S.lcc[k]); return isNaN(v) ? null : v; }
  function heatSrc() { return S.lcc.heatSrc || 'gas'; }
  // Areas the measure costs apply to, from the model's geometry (core.js features).
  function areas(sc) {
    var f = C.features(sc), gfa = sc.gfa_m2;
    return {wall: (f[0] - f[1]) * gfa, glass: f[1] * gfa, facade: f[0] * gfa, roof: sc.adiabatic_roof ? 0 : gfa / sc.n_floors, floor: gfa};
  }
  function areaText(m2) { return S.ip ? nf(m2 * C.FT2_PER_M2) + ' ft²' : nf(m2) + ' m²'; }
  function buildLccFields() {
    var g = null, h = '';
    LF.forEach(function (f) {
      if (f.g !== g) { if (g) h += '</fieldset>'; g = f.g; h += '<fieldset class="lg"><legend>' + esc(g) + '</legend>'; }
      if (f.select) {
        h += '<label class="fld"><span>' + esc(f.label) + '</span><select id="l-' + f.k + '">' + f.select.map(function (o) {
          return '<option value="' + o[0] + '"' + (heatSrc() === o[0] ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select></label>';
        return;
      }
      var v = L(f.k), shown = v == null ? '' : +(v * lfK(f)).toPrecision(6);
      h += '<label class="fld' + (f.gas ? ' if-gas' : '') + (f.noElec ? ' if-eff' : '') + '"><span>' + esc(f.label) + '</span><span class="in">' +
        (f.u.charAt(0) === '$' ? '<span class="pfx">$</span>' : '') + '<input id="l-' + f.k + '" data-l="' + f.k + '" type="number" min="0" step="' + (f.step || 'any') + '" inputmode="decimal" value="' + shown + '">' +
        '<span class="sfx">' + esc(lfU(f).replace(/^\$ /, '')) + '</span></span>' + (f.area ? '<span class="qty" data-qty="' + f.area + '"></span>' : '') + '</label>';
    });
    document.getElementById('lcc-fields').innerHTML = h + '</fieldset>';
    syncLccVisibility();
  }
  function syncLccVisibility() {
    var src = heatSrc();
    document.querySelectorAll('#lcc-fields .if-gas').forEach(function (el) { el.hidden = src !== 'gas'; });
    document.querySelectorAll('#lcc-fields .if-eff').forEach(function (el) {
      el.hidden = src === 'electric';
      var s = el.querySelector('.sfx'); if (s) s.textContent = src === 'gas' ? 'fraction, e.g. boiler' : 'seasonal COP';
    });
  }
  function runKey(sc) { var b = engineBody(sc); return JSON.stringify(b); }
  function engineBody(sc) {
    var out = {}; Object.keys(D.fields).forEach(function (k) { if (sc[k] !== undefined) out[k] = sc[k]; });
    out.station = S.station; out.type = S.type; return out;
  }
  var RUNNING = {}, RUN_MSG = '', RUN_ERR = null;
  function runYearly(scs) {
    RUN_ERR = null;
    scs.forEach(function (sc) {
      var key = runKey(sc);
      if (S.runs[key] || RUNNING[key]) return;
      RUNNING[key] = true;
      var body = engineBody(sc); body.annual = true;
      window.EPBrowser.run(body, function (msg) { RUN_MSG = msg; render(); }).then(function (r) {
        delete RUNNING[key];
        if (!r.ok) RUN_ERR = 'A yearly run failed: ' + (r.error || 'unknown error');
        else S.runs[key] = {annual: r.annual, seconds: r.engine && r.engine.run_seconds, weather: r.station && r.station.weather_file};
        render();
      }, function (e) { delete RUNNING[key]; RUN_ERR = 'EnergyPlus could not start in this browser: ' + e.message; render(); });
    });
    render();
  }
  function lineChart(series, years) {
    var W = 640, H = 240, l = 64, r = 16, tp = 14, b = 34, all = [0];
    series.forEach(function (s) { all = all.concat(s.values); });
    var mn = Math.min.apply(null, all), mx = Math.max.apply(null, all), span = (mx - mn) || 1;
    var step = Math.pow(10, Math.floor(Math.log(span / 4) / Math.LN10)), nice = [1, 2, 2.5, 5, 10], tick = step;
    for (var i = 0; i < nice.length; i++) { tick = nice[i] * step; if (span / tick <= 5) break; }
    var y0 = Math.floor(mn / tick) * tick, y1 = Math.ceil(mx / tick) * tick;
    var X = function (t) { return l + t / years * (W - l - r); }, Y = function (v) { return tp + (1 - (v - y0) / (y1 - y0 || 1)) * (H - tp - b); };
    var o = '';
    for (var v = y0; v <= y1 + tick / 2; v += tick) {
      o += '<line x1="' + l + '" x2="' + (W - r) + '" y1="' + Y(v).toFixed(1) + '" y2="' + Y(v).toFixed(1) + '" class="' + (Math.abs(v) < tick / 2 ? 'zero' : 'grid') + '"/>' +
        '<text x="' + (l - 6) + '" y="' + (Y(v) + 4).toFixed(1) + '" text-anchor="end">' + money(v) + '</text>';
    }
    var xt = years <= 10 ? 1 : years <= 30 ? 5 : 10;
    for (var t = 0; t <= years; t += xt) o += '<text x="' + X(t).toFixed(1) + '" y="' + (H - b + 16) + '" text-anchor="middle">' + t + '</text>';
    o += '<text x="' + ((l + W - r) / 2) + '" y="' + (H - 4) + '" text-anchor="middle">years</text>';
    series.forEach(function (s) {
      o += '<polyline fill="none" stroke="' + s.color + '" stroke-width="2.5" stroke-linejoin="round" points="' +
        s.values.map(function (v, t) { return X(t).toFixed(1) + ',' + Y(v).toFixed(1); }).join(' ') + '"/>';
      var e = s.values.length - 1;
      o += '<circle cx="' + X(e).toFixed(1) + '" cy="' + Y(s.values[e]).toFixed(1) + '" r="4" fill="' + s.color + '"/>';
    });
    return '<div class="lchart"><svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Cumulative discounted savings against typical">' + o + '</svg></div>' +
      '<div class="legend">' + series.map(function (s) { return '<span><i style="background:' + s.color + '"></i>' + esc(s.name) + '</span>'; }).join('') + '</div>';
  }
  var LINE_COLORS = ['#1D5FB4', '#08534A', '#7A3FB4'];
  function renderLCC(m, base, typical, rows) {
    var card = document.getElementById('lcc-card');
    document.querySelectorAll('#lcc-fields [data-qty]').forEach(function (el) {
      el.textContent = '× ' + areaText(areas(base)[el.getAttribute('data-qty')]);
    });
    var years = L('years'), disc = L('disc');
    var opts = [{pkg: PACKAGES[0], p: typical}].concat(rows.filter(function (r) { return r.pkg.id !== 'typical'; }).map(function (r) { return {pkg: r.pkg, p: r}; }));
    var scs = opts.map(function (o) { return o.p.sc; });
    var have = scs.filter(function (sc) { return S.runs[runKey(sc)]; }).length, running = scs.some(function (sc) { return RUNNING[runKey(sc)]; });
    var engineOk = window.EPBrowser && window.EPBrowser.supported();
    var h = '<div class="card-head"><h2>Life-cycle cost' + (years ? ' over ' + nf(years) + ' years' : '') + '</h2><span class="hint">Against typical as the base case</span></div>';
    if (have < scs.length) {
      h += '<p class="hint">Energy cost needs a full-year EnergyPlus run for each option (' + (scs.length - have) + ' to run). It runs in this browser; each takes a few minutes.</p>' +
        (RUN_ERR ? '<p class="note bad">' + esc(RUN_ERR) + '</p>' : '') +
        '<div><button type="button" class="btn primary" id="b-yearly"' + (engineOk && !running ? '' : ' disabled') + '>' +
        (running ? esc(RUN_MSG || 'Running yearly energy…') : 'Run yearly energy for ' + (scs.length - have === 1 ? 'one option' : (scs.length - have) + ' options')) + '</button></div>' +
        (engineOk ? '' : '<p class="hint">EnergyPlus cannot run in this browser.</p>');
      card.innerHTML = h; return;
    }
    if (!(years > 0) || disc == null) { card.innerHTML = h + '<p class="hint">Enter a study period and a discount rate under <b>4 Life-cycle cost</b>.</p>'; return; }
    var e = {copClg: L('copClg'), heatSrc: heatSrc(), heatEff: L('heatEff'), sfp: L('sfp')};
    var prm = {years: Math.round(years), disc: disc / 100, esc: (L('esc') || 0) / 100, life: L('life') || 0};
    var A = areas(base), missingAll = [];
    var res = opts.map(function (o) {
      var run = S.runs[runKey(o.p.sc)], y = OwnerLCC.yearlyEnergy(run.annual, e), missing = y.missing.slice();
      var pe = L('pElec'), pg = L('pGas');
      if (pe == null) missing.push('electricity price');
      if (y.therms > 0 && pg == null) missing.push('gas price');
      var energyCost = (y.elec_kwh == null || pe == null || (y.therms > 0 && pg == null)) ? null : y.elec_kwh * pe + (y.therms || 0) * (pg || 0);
      var c = cost(o.p), eq = c && c.clg != null && c.htg != null ? c.clg + c.htg : null;
      if (eq == null) missing.push('plant rates (section 3)');
      var meas = 0;
      o.pkg.m.forEach(function (id) {
        var f = LF.filter(function (x) { return x.m === id; })[0], v = L(f.k);
        if (v == null) { missing.push('cost of ' + MEASURES[id].name.toLowerCase()); meas = null; return; }
        if (meas != null) meas += f.lump ? v : v * A[f.area];
      });
      if (L('maintPct') == null) missing.push('maintenance');
      var maint = eq != null && L('maintPct') != null ? eq * L('maintPct') / 100 : null;
      missing.forEach(function (x) { if (missingAll.indexOf(x) < 0) missingAll.push(x); });
      var ok = energyCost != null && eq != null && meas != null && maint != null;
      return {o: o, y: y, energyCost: energyCost, eq: eq, meas: meas, maint: maint, ok: ok,
        cf: ok ? OwnerLCC.cashFlows({first_equipment: eq, first_measures: meas, energy_cost: energyCost, maint: maint}, prm) : null};
    });
    var b0 = res[0];
    res.forEach(function (r, i) { if (i && r.ok && b0.ok) r.cmp = OwnerLCC.compare(r.cf, b0.cf, r.energyCost + r.maint, b0.energyCost + b0.maint); });
    var cols = res.map(function (r) { return '<th>' + esc(r.o.pkg.name) + (r.o.pkg.id === 'typical' ? '<span class="mut"> (base)</span>' : '') + '</th>'; }).join('');
    function row(label, fn, cls) { return '<tr' + (cls ? ' class="' + cls + '"' : '') + '><th scope="row">' + label + '</th>' + res.map(function (r) { return '<td>' + fn(r) + '</td>'; }).join('') + '</tr>'; }
    var M = function (v) { return v == null ? '<span class="mut">–</span>' : money(v); };
    var t = '<div class="scroll-x"><table class="lt"><thead><tr><th></th>' + cols + '</tr></thead><tbody>' +
      '<tr class="grp"><th colspan="' + (res.length + 1) + '">First cost</th></tr>' +
      row('Heating and cooling plant', function (r) { return M(r.eq); }) +
      row('Design changes', function (r) { return r.o.pkg.m.length ? M(r.meas) : money(0); }) +
      '<tr class="grp"><th colspan="' + (res.length + 1) + '">First year</th></tr>' +
      row('Electricity', function (r) { return r.y.elec_kwh == null ? '<span class="mut">–</span>' : nf(r.y.elec_kwh / 1000) + ' MWh'; }) +
      (heatSrc() === 'gas' ? row('Gas', function (r) { return r.y.therms == null ? '<span class="mut">–</span>' : (S.ip ? nf(r.y.therms) + ' therms' : nf(r.y.therms * OwnerLCC.KWH_PER_THERM / 1000) + ' MWh'); }) : '') +
      row('Energy cost', function (r) { return M(r.energyCost); }) +
      row('Maintenance', function (r) { return M(r.maint); }) +
      '<tr class="grp"><th colspan="' + (res.length + 1) + '">Present value over ' + nf(prm.years) + ' years</th></tr>' +
      row('Energy', function (r) { return r.cf ? money(r.cf.pv.energy) : '<span class="mut">–</span>'; }) +
      row('Maintenance', function (r) { return r.cf ? money(r.cf.pv.maint) : '<span class="mut">–</span>'; }) +
      row('Plant replacement, less residual value', function (r) { return r.cf ? money(r.cf.pv.replace - r.cf.pv.residual) : '<span class="mut">–</span>'; }) +
      row('<b>Life-cycle cost</b>', function (r) { return r.cf ? '<b>' + money(r.cf.pv.lcc) + '</b>' : '<span class="mut">–</span>'; }, 'tot') +
      '<tr class="grp"><th colspan="' + (res.length + 1) + '">Against typical</th></tr>' +
      row('Net savings', function (r) { return r.cmp ? '<b class="' + (r.cmp.net_savings >= 0 ? 'pos' : 'neg') + '">' + (r.cmp.net_savings < 0 ? '−' : '') + money(Math.abs(r.cmp.net_savings)) + '</b>' : '<span class="mut">–</span>'; }) +
      row('Extra first cost', function (r) { return r.cmp ? (r.cmp.d_first < 0 ? '−' : '') + money(Math.abs(r.cmp.d_first)) : '<span class="mut">–</span>'; }) +
      row('Savings-to-investment ratio', function (r) { return r.cmp ? (r.cmp.sir == null ? (r.cmp.d_first <= 0 ? 'no extra cost' : '–') : nf(r.cmp.sir, 2)) : '<span class="mut">–</span>'; }) +
      row('Simple payback', function (r) { return r.cmp ? (r.cmp.simple_payback == null ? 'never' : r.cmp.simple_payback === 0 ? 'immediate' : nf(r.cmp.simple_payback, 1) + ' years') : '<span class="mut">–</span>'; }) +
      row('Discounted payback', function (r) { return r.cmp ? (r.cmp.discounted_payback == null ? 'not within ' + prm.years + ' years' : r.cmp.discounted_payback === 0 ? 'immediate' : 'year ' + r.cmp.discounted_payback) : '<span class="mut">–</span>'; }) +
      '</tbody></table></div>';
    h += t;
    if (missingAll.length) h += '<p class="note">To complete the table, add: ' + esc(missingAll.join(', ')) + '.</p>';
    var series = res.filter(function (r) { return r.cmp; }).map(function (r, i) { return {name: r.o.pkg.name, values: r.cmp.cumulative, color: LINE_COLORS[i % 3]}; });
    if (series.length) h += '<h3 class="sub-h">Cumulative savings against typical (discounted)</h3><p class="hint">Below zero the option has cost more so far; where a line crosses zero it has paid back.</p>' + lineChart(series, prm.years);
    var r0 = S.runs[runKey(scs[0])];
    h += '<p class="hint">Yearly energy: EnergyPlus on ' + esc((r0 && r0.weather) || 'typical-year weather') + '. Heating, cooling, fans, lighting and equipment; not hot water or process loads. ' +
      'The design changes are assumed to last the study period; the plant is replaced at the end of its service life and its remaining value is credited at the end.</p>';
    card.innerHTML = h;
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
    S.ip = ip; buildLccFields(); render();
  }
  buildLccFields();
  document.getElementById('lcc-fields').addEventListener('input', function (e) {
    var k = e.target.getAttribute('data-l'); if (!k) return;
    var f = LF.filter(function (x) { return x.k === k; })[0], v = parseFloat(e.target.value);
    S.lcc[k] = isNaN(v) ? '' : v / lfK(f); render();
  });
  document.getElementById('lcc-fields').addEventListener('change', function (e) {
    if (e.target.id === 'l-heatSrc') { S.lcc.heatSrc = e.target.value; syncLccVisibility(); render(); }
  });
  document.getElementById('lcc-card').addEventListener('click', function (e) {
    if (e.target.id !== 'b-yearly') return;
    var base = baseScenario(), m = model(); if (!m) return;
    var scs = [PACKAGES[0]].concat(S.picked.filter(function (id) { return id !== 'typical'; }).map(pkgById)).map(function (pkg) { return evalPackage(m, base, pkg).sc; });
    runYearly(scs);
  });
  document.getElementById('u-ip').addEventListener('click', function () { setUnits(true); });
  document.getElementById('u-si').addEventListener('click', function () { setUnits(false); });
  render();
})();

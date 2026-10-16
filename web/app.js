// ── Peak Load Tool UI ────────────────────────────────────────────────────────
// Inputs are SI (the engine's units); every value also shows its IP equivalent.
// Results come from one of two sources, always labelled:
//   EnergyPlus run    — engine/run_scenario.py via POST /api/run (option C)
//   Surrogate         — EnergyPlus-trained model in data/loads-surrogate.js (option B)
(function () {
  'use strict';
  var D = window.LOADS_DATA, C = window.LoadsCore;
  // Trained models: a small index is loaded with the page; each model's file
  // (data/surrogates/<type>__<station>.js) is loaded the first time it's needed.
  var SUR_INDEX = (window.LOADS_SURROGATE && (window.LOADS_SURROGATE.index || window.LOADS_SURROGATE.models)) || {};
  var SUR = window.LOADS_SURROGATE_MODELS = window.LOADS_SURROGATE_MODELS ||
    ((window.LOADS_SURROGATE && window.LOADS_SURROGATE.models) || {});
  var SUR_LOADING = {};
  // A building-type model if one was trained, else the shared model for the station.
  function modelKeyFor(type, station) {
    var k = type + '|' + station;
    if (SUR_INDEX[k] || SUR[k]) return k;
    k = 'unified|' + station;
    return (SUR_INDEX[k] || SUR[k]) ? k : null;
  }
  function loadModel(key) {
    if (SUR[key] || !SUR_INDEX[key] || SUR_LOADING[key]) return;
    SUR_LOADING[key] = true;
    var s = document.createElement('script');
    s.src = 'data/surrogates/' + key.replace('|', '__') + '.js';
    s.onload = function () { render(); };
    s.onerror = function () { SUR_LOADING[key] = 'error'; render(); };
    document.head.appendChild(s);
  }
  var STORE_KEY = 'peak-load-tool.v1';

  // ── Units ───────────────────────────────────────────────────────────────
  var IP = {
    'm2': function (v) { return fmt(v * 10.7639, 0) + ' ft²'; },
    'm': function (v) { return fmt(v * 3.28084, 1) + ' ft'; },
    'W/m2-K': function (v) { return fmt(v * 0.17611, 3) + ' Btu/h·ft²·°F'; },
    'C': function (v) { return fmt(v * 9 / 5 + 32, 1) + ' °F'; },
    'L/s-person': function (v) { return fmt(v * 2.11888, 1) + ' cfm/person'; },
    'L/s-m2': function (v) { return fmt(v * 0.19685, 3) + ' cfm/ft²'; },
    'W/m2': function (v) { return fmt(v / 10.7639, 2) + ' W/ft²'; },
    'm2/person': function (v) { return fmt(v * 10.7639, 0) + ' ft²/person'; },
    'W/m-K': function (v) { return 'F-' + fmt(v * 0.57779, 2) + ' Btu/h·ft·°F'; }
  };

  // ── Input layout ────────────────────────────────────────────────────────
  var GROUPS = [
    {title: 'Geometry', open: true, fields: [
      ['gfa_m2', 'Gross floor area', 'm2', 100],
      ['n_floors', 'Floors above grade', '-', 1],
      ['aspect_ratio', 'Plan aspect ratio (L/W)', '-', 0.1],
      ['floor_to_floor_m', 'Floor-to-floor height', 'm', 0.05],
      ['perimeter_depth_m', 'Perimeter zone depth', 'm', 0.1],
      ['north_axis_deg', 'Rotation of long axis from east (°)', 'deg', 5]]},
    {title: 'Envelope', open: true, fields: [
      ['wwr', 'Window-to-wall ratio', '-', 0.01],
      ['win_u', 'Window U-factor (assembly)', 'W/m2-K', 0.05],
      ['shgc', 'Window SHGC', '-', 0.01],
      ['overhang_pf', 'Overhang projection factor', '-', 0.05],
      ['wall_u', 'Wall U-factor (assembly)', 'W/m2-K', 0.01],
      ['roof_u', 'Roof U-factor (assembly)', 'W/m2-K', 0.01],
      ['slab_f_factor_w_mk', 'Slab-on-grade F-factor', 'W/m-K', 0.01],
      ['thermal_mass', 'Concrete floor slabs (thermal mass)', 'bool']]},
    {title: 'People, lighting, equipment', open: true, fields: [
      ['m2_per_person', 'Floor area per person', 'm2/person', 0.5],
      ['activity_w_per_person', 'Metabolic rate (total)', 'W/person', 5],
      ['lpd_w_m2', 'Lighting power density', 'W/m2', 0.1],
      ['epd_w_m2', 'Equipment power density', 'W/m2', 0.5],
      ['occ_start_h', 'Occupied from (hour)', 'h', 1],
      ['occ_hours', 'Occupied hours per day', 'h', 1],
      ['unoccupied_internal_fraction', 'Lights/equipment when unoccupied', '-', 0.05]]},
    {title: 'Ventilation & infiltration', open: true, fields: [
      ['oa_per_person_ls', 'Outdoor air per person (Rp)', 'L/s-person', 0.1],
      ['oa_per_area_ls_m2', 'Outdoor air per area (Ra)', 'L/s-m2', 0.01],
      ['oa_ach', 'Outdoor air by air changes (labs, ASHRAE 170)', '1/h', 0.5],
      ['erv_sensible_eff', 'Heat recovery sensible effectiveness', '-', 0.05],
      ['erv_latent_eff', 'Heat recovery latent effectiveness', '-', 0.05],
      ['infiltration_ach', 'Infiltration (whole building)', '1/h', 0.01]]},
    {title: 'Setpoints', open: false, fields: [
      ['t_heat_c', 'Heating setpoint (occupied)', 'C', 0.5],
      ['t_cool_c', 'Cooling setpoint (occupied)', 'C', 0.5],
      ['setback_heat_c', 'Heating setback (blank = none)', 'C', 0.5],
      ['setup_cool_c', 'Cooling setup (blank = none)', 'C', 0.5]]},
    {title: 'System sizing', open: false, fields: [
      ['cooling_supply_air_c', 'Cooling supply air temperature', 'C', 0.1],
      ['heating_supply_air_c', 'Heating supply air temperature', 'C', 0.5],
      ['cooling_sizing_factor', 'Cooling sizing factor', '-', 0.05],
      ['heating_sizing_factor', 'Heating sizing factor', '-', 0.05]]}
  ];

  // Names for surrogate features (used in out-of-range warnings).
  var FEATURE_LABELS = {
    ext_wall_m2_per_m2: 'Exterior wall area per floor area', window_m2_per_m2: 'Window area per floor area',
    wall_ua_per_m2: 'Opaque wall UA per floor area', window_ua_per_m2: 'Window UA per floor area',
    roof_ua_per_m2: 'Roof UA per floor area', slab_fp_per_m2: 'Slab F×perimeter per floor area',
    infiltration_m3h_per_m2: 'Infiltration per floor area', solar_aperture_per_m2: 'Solar aperture (SHGC × window) per floor area',
    shaded_aperture_per_m2: 'Overhang-shaded aperture', oa_ls_m2: 'Outdoor air L/s·m²',
    oa_after_sensible_hr: 'Outdoor air after sensible recovery', oa_after_latent_hr: 'Outdoor air after latent recovery',
    lpd_w_m2: 'Lighting W/m²', epd_w_m2: 'Equipment W/m²', people_per_m2: 'Occupant density',
    t_cool_c: 'Cooling setpoint', t_heat_c: 'Heating setpoint', core_fraction: 'Core fraction of floor plate',
    orient_cos2: 'Orientation', orient_sin2: 'Orientation', aspect_ratio: 'Aspect ratio'
  };

  // Design inputs swept in the sensitivity chart, over the trained design space.
  var SWEEP_LABELS = {
    wwr: 'Window-to-wall ratio', wall_u: 'Wall U', roof_u: 'Roof U', win_u: 'Window U', shgc: 'SHGC',
    overhang_pf: 'Overhang PF', m2_per_person: 'Area per person', lpd_w_m2: 'Lighting W/m²',
    epd_w_m2: 'Equipment W/m²', oa_multiplier: 'Outdoor air (× 62.1 rate)', oa_ach: 'Outdoor air ACH',
    erv_sensible_eff: 'ERV sensible eff.',
    erv_latent_eff: 'ERV latent eff.', infiltration_ach: 'Infiltration ACH', t_cool_c: 'Cooling setpoint',
    t_heat_c: 'Heating setpoint', n_floors: 'Floors (same GFA)', aspect_ratio: 'Aspect ratio',
    north_axis_deg: 'Orientation (0° vs 90°)'
  };

  var DD_LABEL = {
    'htg_99.6': 'Heating 99.6%', 'htg_99': 'Heating 99%',
    'clg_db_0.4': 'Cooling 0.4% DB/MCWB', 'clg_db_1': 'Cooling 1% DB/MCWB', 'clg_db_2': 'Cooling 2% DB/MCWB',
    'clg_dp_0.4': 'Dehum. 0.4% DP/MCDB', 'clg_dp_1': 'Dehum. 1% DP/MCDB', 'clg_dp_2': 'Dehum. 2% DP/MCDB'
  };

  // ── State ───────────────────────────────────────────────────────────────
  var S = {type: 'office', station: 'chicago', coolPct: '0.4', heatPct: '99.6',
    sc: null, prov: null, verify: null, defaults: null, baseline: null, ep: null, open: {},
    costTon: '', costMbh: '', engine: null, running: false, runError: null};

  function stationById(id) {
    for (var i = 0; i < D.stations.length; i++) if (D.stations[i].id === id) return D.stations[i];
    return D.stations[0];
  }

  function envZones() {
    return Object.keys(D.archetypes.envelope_by_climate_zone).filter(function (k) { return k[0] !== '_'; });
  }

  function resetScenario(cz) {
    var st = stationById(S.station);
    var zone = cz || st.climate_zone_stat;
    if (envZones().indexOf(zone) < 0) zone = zone.charAt(0);   // e.g. "7" for "7A"
    var keep = S.sc ? {gfa_m2: S.sc.gfa_m2, n_floors: S.sc.n_floors, aspect_ratio: S.sc.aspect_ratio,
      north_axis_deg: S.sc.north_axis_deg} : null;
    var d = C.defaults(D, S.type, zone);
    S.sc = d.scenario; S.prov = d.provenance; S.verify = d.verify; S.defaults = JSON.parse(JSON.stringify(d.scenario));
    if (keep) Object.keys(keep).forEach(function (k) { S.sc[k] = keep[k]; });
    S.sc.station = S.station;
  }

  function save() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({type: S.type, station: S.station, coolPct: S.coolPct,
        heatPct: S.heatPct, sc: S.sc, baseline: S.baseline, costTon: S.costTon, costMbh: S.costMbh}));
    } catch (e) { /* storage unavailable: state just isn't remembered */ }
  }

  function restore() {
    try {
      var s = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
      if (!s || !D.archetypes.types[s.type]) return false;
      S.type = s.type; S.station = stationById(s.station).id; S.coolPct = s.coolPct || '0.4';
      S.heatPct = s.heatPct || '99.6'; S.costTon = s.costTon || ''; S.costMbh = s.costMbh || '';
      var d = C.defaults(D, S.type, s.sc.climate_zone);
      S.prov = d.provenance; S.verify = d.verify; S.defaults = d.scenario;
      S.sc = s.sc; S.baseline = s.baseline || null;
      return true;
    } catch (e) { return false; }
  }

  // ── Helpers ─────────────────────────────────────────────────────────────
  function fmt(v, d) {
    if (v === null || v === undefined || isNaN(v)) return '–';
    return (+v).toLocaleString('en-US', {minimumFractionDigits: d, maximumFractionDigits: d});
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c];
    });
  }
  function scenarioHash(sc) {
    var o = {};
    Object.keys(sc).sort().forEach(function (k) { o[k] = sc[k]; });
    return JSON.stringify(o);
  }
  function engineInput(sc) {
    var out = {};
    Object.keys(D.fields).forEach(function (k) { if (sc[k] !== undefined) out[k] = sc[k]; });
    out.station = S.station; out.type = S.type;
    return out;
  }

  // Result for a scenario: a matching EnergyPlus run wins, else the surrogate.
  function resultFor(sc, epRun) {
    if (epRun && epRun.hash === scenarioHash(sc)) return C.energyplusResult(epRun.run);
    var key = modelKeyFor(sc.type, sc.station), m = key && SUR[key];
    if (!m && key && SUR_INDEX[key]) {
      loadModel(key);
      return {source: 'none', reason: SUR_LOADING[key] === 'error' ? 'load-error' : 'loading'};
    }
    if (!m) return {source: 'none', reason: 'no-model'};
    var r = C.surrogateResult(m, sc);
    if (r.incompatible) return {source: 'none', reason: 'incompatible'};
    if (r.fixedDiffs.length) return {source: 'none', reason: 'fixed', fixedDiffs: r.fixedDiffs};
    return r;
  }

  function governed(result, sc) {
    if (!result || !result.dd) return null;
    var g = C.governing(result, S.coolPct, S.heatPct);
    var cf = sc.cooling_sizing_factor, hf = sc.heating_sizing_factor;
    var c = g.cooling, h = g.heating;
    return {
      source: result.source, gfa: sc.gfa_m2,
      cKey: c && c.key, hKey: h && h.key,
      clg: c && c.total_w * cf, clgSens: c && c.sensible_w != null ? c.sensible_w * cf : null,
      clgLat: c && c.latent_w != null ? c.latent_w * cf : null,
      clgOA: c && c.outdoor_air_w != null ? c.outdoor_air_w : null, clgRaw: c && c.total_w,
      clgHR: c && c.heat_recovery_w != null ? c.heat_recovery_w : null,
      clgSop: c && c.sum_of_zone_peaks_w != null ? c.sum_of_zone_peaks_w * cf : null,
      supply: c && c.supply_air_m3s, time: c && c.time, oat: c && c.outdoor_db_c, errC: c && c.err_pct,
      htg: h && h.total_w * hf, htgRaw: h && h.total_w,
      htgSop: h && h.sum_of_zone_peaks_w != null ? h.sum_of_zone_peaks_w * hf : null,
      hTime: h && h.time, errH: h && h.err_pct, cf: cf, hf: hf
    };
  }

  // ── Rendering: inputs ───────────────────────────────────────────────────
  function isChanged(key, unit) {
    var v = S.sc[key], def = S.defaults[key];
    if (unit === 'bool') return !!v !== !!def;
    return !(v === def || (v != null && def != null && Math.abs(v - def) < 1e-9));
  }

  function srcHint(key, unit) {
    var def = S.defaults[key], src = S.prov[key] || '';
    if (isChanged(key, unit)) {
      return '<span style="color:var(--accent)">Changed from default ' +
        (unit === 'bool' ? (def ? 'on' : 'off') : esc(def === null ? 'none' : def)) + '</span>';
    }
    return '<span title="' + esc(src) + '">' + esc(src.length > 90 ? src.slice(0, 88) + '…' : src) + '</span>';
  }

  function unitOf(key) {
    var unit = null;
    GROUPS.forEach(function (g) { g.fields.forEach(function (f) { if (f[0] === key) unit = f[2]; }); });
    return unit;
  }

  function fieldHtml(key, label, unit, step) {
    var v = S.sc[key], spec = D.fields[key] || {};
    var vb = S.verify[key] ? '<span class="verify" title="Default needs confirmation by the MEP lead">verify</span>' : '';
    var hint = '<span class="hint" data-src="' + key + '">' + srcHint(key, unit) + '</span>';
    var ip = (IP[unit] && v !== null && v !== '' && v !== undefined) ? ' · ' + IP[unit](+v) : '';
    if (unit === 'bool') {
      return '<div class="field"><label for="f-' + key + '">' + esc(label) + vb + '</label>' +
        '<input id="f-' + key + '" type="checkbox" data-k="' + key + '"' + (v ? ' checked' : '') + ' style="width:auto;justify-self:end">' +
        hint + '</div>';
    }
    var u = unit === '-' ? '' : ' (' + unit.replace('m2', 'm²') + ')';
    return '<div class="field"><label for="f-' + key + '">' + esc(label) + '<span style="color:var(--ink-4)">' + esc(u) + '</span>' + vb + '</label>' +
      '<input id="f-' + key + '" type="number" inputmode="decimal" data-k="' + key + '" step="' + step + '"' +
      (spec.min !== undefined ? ' min="' + spec.min + '" max="' + spec.max + '"' : '') +
      ' value="' + (v === null || v === undefined ? '' : v) + '">' +
      '<span class="hint" data-ip="' + key + '">' + ip.replace(/^ · /, '') + '</span>' + hint + '</div>';
  }

  function renderInputs() {
    var st = stationById(S.station), h = '';
    h += '<details class="grp" data-g="Project"' + (S.open.Project === false ? '' : ' open') + '><summary>Project</summary>';
    h += '<div class="field"><label for="f-type">Building type</label><select id="f-type">' +
      Object.keys(D.archetypes.types).map(function (t) {
        return '<option value="' + t + '"' + (t === S.type ? ' selected' : '') + '>' + esc(D.archetypes.types[t].label) + '</option>';
      }).join('') + '</select><span class="hint">' + esc(D.archetypes.types[S.type].space_type_basis) + '</span></div>';
    h += '<div class="field"><label for="f-station">Weather station</label><select id="f-station">' +
      D.stations.map(function (s) {
        return '<option value="' + s.id + '"' + (s.id === S.station ? ' selected' : '') + '>' + esc(s.label) + '</option>';
      }).join('') + '</select></div>';
    h += '<div class="field"><label for="f-cz">Code climate zone</label><select id="f-cz">' +
      envZones().map(function (z) {
        return '<option' + (z === S.sc.climate_zone ? ' selected' : '') + '>' + z + '</option>';
      }).join('') + '</select><span class="hint">Weather file says ' + esc(st.climate_zone_stat) +
      ' (computed from the data). Confirm the county zone in ASHRAE 169; changing it resets envelope defaults.</span></div>';
    h += '<div class="field wide"><label>Cooling design condition</label><div class="seg" data-seg="coolPct">' +
      ['0.4', '1', '2'].map(function (p) { return '<button type="button" data-v="' + p + '"' + (S.coolPct === p ? ' class="on"' : '') + '>' + p + '%</button>'; }).join('') +
      '</div></div>';
    h += '<div class="field wide"><label>Heating design condition</label><div class="seg" data-seg="heatPct">' +
      ['99.6', '99'].map(function (p) { return '<button type="button" data-v="' + p + '"' + (S.heatPct === p ? ' class="on"' : '') + '>' + p + '%</button>'; }).join('') +
      '</div></div></details>';
    GROUPS.forEach(function (g) {
      var op = S.open[g.title] === undefined ? g.open : S.open[g.title];
      h += '<details class="grp" data-g="' + esc(g.title) + '"' + (op ? ' open' : '') + '><summary>' + esc(g.title) + '</summary>';
      g.fields.forEach(function (f) { h += fieldHtml(f[0], f[1], f[2], f[3]); });
      h += '</details>';
    });
    h += '<details class="grp" data-g="Cost"' + (S.open.Cost ? ' open' : '') + '><summary>Capacity cost (optional)</summary>' +
      '<p class="sub">Your installed-cost rates. The tool has no built-in cost data.</p>' +
      '<div class="field"><label for="f-cton">Cooling plant ($ per ton)</label><input id="f-cton" type="number" min="0" step="50" value="' + esc(S.costTon) + '"></div>' +
      '<div class="field"><label for="f-cmbh">Heating plant ($ per MBH)</label><input id="f-cmbh" type="number" min="0" step="5" value="' + esc(S.costMbh) + '"></div></details>';
    h += '<div class="actions"><button class="btn" id="b-reset" type="button">Reset to defaults</button></div>';
    document.getElementById('inputs').innerHTML = h;
  }

  // ── Rendering: results ──────────────────────────────────────────────────
  function renderStatus() {
    var mk = modelKeyFor(S.type, S.station), e = S.engine, m = mk && SUR_INDEX[mk], h = '';
    if (e === null) h += '<span class="pill"><span class="dot"></span>EnergyPlus: checking…</span>';
    else if (e.available) h += '<span class="pill ok"><span class="dot"></span>EnergyPlus ' + esc(e.version) + ' online</span>';
    else h += '<span class="pill off" title="' + esc(e.reason || '') + '"><span class="dot"></span>EnergyPlus offline</span>';
    if (m) h += '<span class="pill ok"><span class="dot"></span>Surrogate' + (mk.indexOf('unified|') === 0 ? ' (shared, all types)' : '') +
      ': ' + m.n_samples + ' runs</span>';
    else h += '<span class="pill off"><span class="dot"></span>Surrogate: not trained for this type/station</span>';
    document.getElementById('status').innerHTML = h;
  }

  function designConditionsCard() {
    var st = stationById(S.station), dd = st.design_days;
    function row(key, a, b, sel) {
      var r = dd[key];
      if (!r) return '';
      var hum = r.mcwb_c != null ? r.mcwb_c : r.dp_c;
      return '<tr' + (sel ? ' class="sel"' : '') + '><td>' + DD_LABEL[key] + '</td>' +
        '<td class="num">' + fmt(r.db_c, 1) + ' °C / ' + fmt(r.db_c * 9 / 5 + 32, 1) + ' °F</td>' +
        '<td class="num">' + (hum == null ? '–' : fmt(hum, 1) + ' °C / ' + fmt(hum * 9 / 5 + 32, 1) + ' °F') + '</td>' +
        '<td class="num">' + (r.db_range_c ? fmt(r.db_range_c, 1) + ' K' : '–') + '</td>' +
        '<td class="num">' + r.month + '/' + r.day + '</td></tr>';
    }
    var h = '<div class="card"><div class="card-head"><div><h2>Design conditions · ' + esc(st.label) + '</h2>' +
      '<p class="sub">' + esc(st.design_source || '') + ', from the DOE EnergyPlus weather file <code>' + esc(st.file) +
      '.ddy</code>. Lat ' + fmt(st.lat, 2) + ', elev ' + fmt(st.elev_m, 0) + ' m.</p></div></div>';
    h += '<div class="scroll-x"><table class="t"><thead><tr><th>Condition</th><th>Dry-bulb</th><th>Coincident WB / dew point</th><th>Daily range</th><th>Day</th></tr></thead><tbody>';
    ['htg_99.6', 'htg_99'].forEach(function (k) { h += row(k, 0, 0, k === 'htg_' + S.heatPct); });
    ['clg_db_0.4', 'clg_db_1', 'clg_db_2', 'clg_dp_0.4', 'clg_dp_1', 'clg_dp_2'].forEach(function (k) {
      h += row(k, 0, 0, k === 'clg_db_' + S.coolPct || k === 'clg_dp_' + S.coolPct);
    });
    h += '</tbody></table></div><p class="sub" style="margin-top:8px">Highlighted rows are simulated for the selected percentiles. Cooling is governed by whichever of the dry-bulb and dew-point days gives the larger total coil load.</p></div>';
    return h;
  }

  function sourceBadge(g) {
    if (!g) return '<span class="badge none">No result</span>';
    if (g.source === 'energyplus') return '<span class="badge ep">EnergyPlus run</span>';
    return '<span class="badge sur">Surrogate estimate</span>';
  }

  function deltaHtml(cur, base, unitFmt) {
    if (base == null || cur == null || !base) return '';
    var d = cur - base, pct = d / base * 100;
    var cls = d < 0 ? 'down' : (d > 0 ? 'up' : '');
    return '<div class="delta ' + cls + '">' + (d > 0 ? '+' : '') + unitFmt(d) + ' (' + (pct > 0 ? '+' : '') + fmt(pct, 1) + '%) vs baseline</div>';
  }

  function kpisCard(g, b) {
    var ft2 = g.gfa * C.FT2_PER_M2, tons = g.clg / 1000 / C.KW_PER_TON, mbh = g.htg / 1000 * C.MBH_PER_KW;
    var cfm = g.supply != null ? g.supply * C.CFM_PER_M3S : null;
    var bt = b && b.clg / 1000 / C.KW_PER_TON, bm = b && b.htg / 1000 * C.MBH_PER_KW;
    var h = '<div class="kpis">';
    h += '<div class="kpi cool"><div class="kpi-label">Peak cooling (block)</div><div class="kpi-value">' + fmt(tons, 1) + '<span class="kpi-unit">tons</span></div>' +
      '<div class="kpi-sec">' + fmt(g.clg / 1000, 0) + ' kW · ' + fmt(g.clg / g.gfa, 1) + ' W/m² · ' + fmt(ft2 / tons, 0) + ' ft²/ton</div>' +
      deltaHtml(tons, bt, function (v) { return fmt(v, 1) + ' tons'; }) + '</div>';
    h += '<div class="kpi heat"><div class="kpi-label">Peak heating (block)</div><div class="kpi-value">' + fmt(mbh, 0) + '<span class="kpi-unit">MBH</span></div>' +
      '<div class="kpi-sec">' + fmt(g.htg / 1000, 0) + ' kW · ' + fmt(g.htg / g.gfa, 1) + ' W/m² · ' + fmt(mbh * 1000 / ft2, 1) + ' Btu/h·ft²</div>' +
      deltaHtml(mbh, bm, function (v) { return fmt(v, 0) + ' MBH'; }) + '</div>';
    if (g.clgSens != null && g.clgLat != null) {
      h += '<div class="kpi"><div class="kpi-label">Sensible / latent</div><div class="kpi-value">' + fmt(g.clgSens / g.clg, 2) + '<span class="kpi-unit">SHR</span></div>' +
        '<div class="kpi-sec">' + fmt(g.clgSens / 1000, 0) + ' kW sensible · ' + fmt(g.clgLat / 1000, 0) + ' kW latent</div></div>';
    }
    if (cfm != null) {
      h += '<div class="kpi"><div class="kpi-label">Supply air at cooling peak</div><div class="kpi-value">' + fmt(cfm, 0) + '<span class="kpi-unit">cfm</span></div>' +
        '<div class="kpi-sec">' + fmt(cfm / ft2, 2) + ' cfm/ft² · ' + fmt(g.supply * 1000, 0) + ' L/s</div>' +
        deltaHtml(cfm, b && b.supply != null ? b.supply * C.CFM_PER_M3S : null, function (v) { return fmt(v, 0) + ' cfm'; }) + '</div>';
    }
    if (g.clgOA != null && g.clgRaw) {
      // EnergyPlus reports the outdoor-air load before heat recovery; the
      // recovered part is already netted out of the coil total.
      var net = g.clgHR != null ? g.clgOA - g.clgHR : null;
      h += '<div class="kpi"><div class="kpi-label">Ventilation air load</div><div class="kpi-value">' +
        fmt((net != null ? net : g.clgOA) / 1000, 0) + '<span class="kpi-unit">kW' + (net != null ? ' net' : ' before recovery') + '</span></div>' +
        '<div class="kpi-sec">' + fmt(g.clgOA / 1000, 0) + ' kW before heat recovery' +
        (g.clgHR != null ? ' · ' + fmt(g.clgHR / 1000, 0) + ' kW recovered' : '') + '</div></div>';
    }
    return h + '</div>';
  }

  function compareTable(g, b) {
    function row(label, cur, base, conv, d) {
      var c = cur == null ? null : conv(cur), bb = base == null ? null : conv(base);
      var dd = (c != null && bb != null) ? c - bb : null;
      return '<tr><td>' + label + '</td><td class="num">' + (b ? fmt(bb, d) : '') + '</td><td class="num">' + fmt(c, d) + '</td>' +
        '<td class="num">' + (b && dd != null ? (dd > 0 ? '+' : '') + fmt(dd, d) : '') + '</td></tr>';
    }
    var tons = function (w) { return w / 1000 / C.KW_PER_TON; }, kw = function (w) { return w / 1000; };
    var mbh = function (w) { return w / 1000 * C.MBH_PER_KW; }, cfm = function (m) { return m * C.CFM_PER_M3S; };
    var h = '<div class="scroll-x" style="margin-top:14px"><table class="t"><thead><tr><th>Metric</th><th>' + (b ? 'Baseline' : '') +
      '</th><th>Current</th><th>' + (b ? 'Δ' : '') + '</th></tr></thead><tbody>';
    h += row('Cooling, block (tons)', g.clg, b && b.clg, tons, 1);
    h += row('Cooling, sensible (kW)', g.clgSens, b && b.clgSens, kw, 1);
    h += row('Cooling, latent (kW)', g.clgLat, b && b.clgLat, kw, 1);
    h += row('Ventilation load before heat recovery (kW)', g.clgOA, b && b.clgOA, kw, 1);
    h += row('Recovered by heat recovery (kW)', g.clgHR, b && b.clgHR, kw, 1);
    h += row('Cooling, sum of zone peaks (tons)', g.clgSop, b && b.clgSop, tons, 1);
    h += row('Supply air at cooling peak (cfm)', g.supply, b && b.supply, cfm, 0);
    h += row('Heating, block (MBH)', g.htg, b && b.htg, mbh, 0);
    h += row('Heating, sum of zone peaks (MBH)', g.htgSop, b && b.htgSop, mbh, 0);
    h += '</tbody></table></div>';
    return h;
  }

  function costCard(g, b) {
    if (!b) return '';
    var ct = parseFloat(S.costTon), cm = parseFloat(S.costMbh);
    var dTon = (g.clg - b.clg) / 1000 / C.KW_PER_TON, dMbh = (g.htg - b.htg) / 1000 * C.MBH_PER_KW;
    var h = '<div class="card"><h2>Capacity cost difference</h2>';
    if (isNaN(ct) && isNaN(cm)) {
      return h + '<p class="sub">Enter your $/ton and $/MBH rates under "Capacity cost" to price the change in plant size (' +
        (dTon > 0 ? '+' : '') + fmt(dTon, 1) + ' tons, ' + (dMbh > 0 ? '+' : '') + fmt(dMbh, 0) + ' MBH).</p></div>';
    }
    var tot = (isNaN(ct) ? 0 : dTon * ct) + (isNaN(cm) ? 0 : dMbh * cm);
    h += '<div class="kpis"><div class="kpi"><div class="kpi-label">Plant capacity cost Δ</div><div class="kpi-value">' +
      (tot > 0 ? '+$' : (tot < 0 ? '−$' : '$')) + fmt(Math.abs(tot), 0) + '</div><div class="kpi-sec">' +
      (isNaN(ct) ? '' : fmt(dTon, 1) + ' tons × $' + fmt(ct, 0) + ' ') + (isNaN(cm) ? '' : '· ' + fmt(dMbh, 0) + ' MBH × $' + fmt(cm, 0)) +
      '</div></div></div><p class="sub" style="margin-top:8px">Linear $/capacity only. Real equipment comes in discrete sizes and ' +
      'redundancy (N+1) steps, so check the change against the next size up or down before banking it.</p></div>';
    return h;
  }

  function tornadoCard(g) {
    var mk = modelKeyFor(S.type, S.station), m = mk && SUR[mk];
    if (!m || !g || !g.cKey) return '';
    var out = g.cKey + '|total_w_m2';
    if (!m.outputs[out]) return '';
    var space = D.design_space.sampled, sc0 = S.sc, def = S.defaults;
    var base = C.predict(m, sc0).perM2[out];
    var conv = sc0.gfa_m2 / 1000 / C.KW_PER_TON * sc0.cooling_sizing_factor;
    function at(key, v) {
      var sc = JSON.parse(JSON.stringify(sc0));
      if (key === 'oa_multiplier') {
        sc.oa_per_person_ls = def.oa_per_person_ls * v; sc.oa_per_area_ls_m2 = def.oa_per_area_ls_m2 * v;
      } else sc[key] = v;
      return (C.predict(m, sc).perM2[out] - base) * conv;
    }
    var rows = [];
    Object.keys(space).forEach(function (key) {
      var sp = space[key], lo, hi;
      if (key === 'floor_plate_m2') return;            // covered by "Floors (same GFA)"
      if (key === 'north_axis_deg') { lo = 0; hi = 90; }
      else if (key === 'n_floors') {
        lo = Math.max(sp.min, Math.ceil(sc0.gfa_m2 / space.floor_plate_m2.max));
        hi = Math.min(sp.max, Math.floor(sc0.gfa_m2 / space.floor_plate_m2.min));
        if (hi <= lo) return;
      } else if (sp.scale_of_default) { lo = def[key] * sp.scale_of_default[0]; hi = def[key] * sp.scale_of_default[1]; }
      else if (sp.offset_of_default) { lo = def[key] + sp.offset_of_default[0]; hi = def[key] + sp.offset_of_default[1]; }
      else { lo = sp.min; hi = sp.max; }
      // Keep a deadband: heating at least 1 C below cooling, as in training.
      if (key === 't_heat_c') hi = Math.min(hi, sc0.t_cool_c - 1);
      if (key === 't_cool_c') lo = Math.max(lo, sc0.t_heat_c + 1);
      if (key === 'oa_multiplier' && !(def.oa_per_person_ls > 0) && !(def.oa_per_area_ls_m2 > 0)) return;
      if (!(hi > lo)) return;
      var dl = at(key, lo), dh = at(key, hi);
      rows.push({key: key, lo: lo, hi: hi, dl: dl, dh: dh, span: Math.abs(dh - dl)});
    });
    rows = rows.sort(function (a, b) { return b.span - a.span; }).slice(0, 10);
    var mx = Math.max.apply(null, rows.map(function (r) { return Math.max(Math.abs(r.dl), Math.abs(r.dh)); })) || 1;
    var h = '<div class="card"><h2>Which inputs move the cooling peak most</h2>' +
      '<p class="sub">Each row tries one input at the low and high end of its realistic range, with everything else ' +
      'kept as you have set it. The longest bars are your biggest levers. <span style="color:var(--good)">Green</span> = ' +
      'peak cooling goes down, <span style="color:var(--bad)">red</span> = it goes up. These are fast estimates; confirm ' +
      'a chosen option with Run EnergyPlus.</p><div class="tz">';
    rows.forEach(function (r) {
      function bar(d) {
        var w = Math.abs(d) / mx * 50, left = d < 0 ? 50 - w : 50;
        return '<div class="bar ' + (d < 0 ? 'neg' : 'pos') + '" style="left:' + left + '%;width:' + w + '%"></div>';
      }
      function effect(v, d) {
        var cls = d < 0 ? 'good' : (d > 0 ? 'bad' : '');
        return 'At ' + sweepValue(r.key, v) + ': <b class="' + cls + '">' + (d > 0 ? '+' : (d < 0 ? '−' : '')) +
          fmt(Math.abs(d), 1) + ' tons</b>';
      }
      var now = sweepNow(r.key);
      h += '<div class="tz-row"><div class="tz-name">' + esc(SWEEP_LABELS[r.key]) +
        (now !== null ? ' <span class="tz-now">now ' + now + '</span>' : '') + '</div>' +
        '<div class="bar-wrap"><div class="axis"></div>' + bar(r.dl) + bar(r.dh) + '</div>' +
        '<div class="tz-meta">' + effect(r.lo, r.dl) + ' &nbsp;·&nbsp; ' + effect(r.hi, r.dh) + '</div></div>';
    });
    return h + '</div></div>';
  }

  // Display a swept input value in everyday units.
  function sweepValue(key, v) {
    if (key === 'wwr') return fmt(v * 100, 0) + '%';
    if (key === 'erv_sensible_eff' || key === 'erv_latent_eff') return fmt(v * 100, 0) + '%';
    if (key === 'overhang_pf') return fmt(v, 2);
    if (key === 'oa_multiplier') return fmt(v, 2) + '× code rate';
    if (key === 'oa_ach') return fmt(v, 1) + ' ACH';
    if (key === 'infiltration_ach') return fmt(v, 2) + ' ACH';
    if (key === 'lpd_w_m2' || key === 'epd_w_m2') return fmt(v, 1) + ' W/m²';
    if (key === 't_cool_c' || key === 't_heat_c') return fmt(v, 1) + ' °C';
    if (key === 'm2_per_person') return fmt(v, 1) + ' m²/person';
    if (key === 'n_floors') return fmt(v, 0) + ' floors';
    if (key === 'north_axis_deg') return fmt(v, 0) + '°';
    if (key === 'wall_u' || key === 'roof_u' || key === 'win_u') return 'U-' + fmt(v, 2);
    return fmt(v, 2);
  }

  function sweepNow(key) {
    var sc = S.sc, def = S.defaults;
    if (key === 'oa_multiplier') {
      if (def.oa_per_person_ls > 0) return sweepValue(key, sc.oa_per_person_ls / def.oa_per_person_ls);
      if (def.oa_per_area_ls_m2 > 0) return sweepValue(key, sc.oa_per_area_ls_m2 / def.oa_per_area_ls_m2);
      return null;
    }
    return sc[key] === undefined || sc[key] === null ? null : sweepValue(key, sc[key]);
  }



  function profileSvg(profile, color, label) {
    if (!profile || !profile.length) return '';
    var W = 1000, H = 190, P = 34, n = profile.length;
    var mx = Math.max.apply(null, profile.map(function (p) { return p[1]; })) || 1;
    var pts = profile.map(function (p, i) {
      return (P + i / (n - 1) * (W - P - 10)).toFixed(1) + ',' + (H - 22 - p[1] / mx * (H - 40)).toFixed(1);
    }).join(' ');
    var ticks = '';
    for (var hr = 0; hr <= 24; hr += 6) {
      var x = P + hr / 24 * (W - P - 10);
      ticks += '<text x="' + x + '" y="' + (H - 6) + '" text-anchor="middle">' + hr + ':00</text>';
    }
    return '<div class="chart"><svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(label) + '">' +
      '<line x1="' + P + '" y1="' + (H - 22) + '" x2="' + (W - 10) + '" y2="' + (H - 22) + '" stroke="currentColor" stroke-opacity=".2"/>' +
      '<text x="' + P + '" y="12">' + esc(label) + ' · peak ' + fmt(mx / 1000, 0) + ' kW</text>' +
      '<polyline points="' + pts + '" fill="none" stroke="' + color + '" stroke-width="2"/>' + ticks + '</svg></div>';
  }

  function energyplusCard(result, g) {
    var run = result.run, h = '<div class="card"><div class="card-head"><div><h2>EnergyPlus run detail</h2><p class="sub">' +
      esc(run.engine.version || 'EnergyPlus') + ' · ' + fmt(run.engine.run_seconds, 1) + ' s · ' + esc(run.model.zoning) + ', ' +
      run.model.floors.length + ' modelled floor types · modelled WWR ' + fmt(run.model.wwr_modelled, 3) + '</p></div>' +
      '<div class="actions" style="margin-top:0"><button class="btn" type="button" id="b-dl-idf">Download IDF</button>' +
      '<button class="btn" type="button" id="b-dl-json">Download results JSON</button></div></div>';
    var msgs = run.messages || {};
    if (msgs.severe) h += '<div class="note bad">' + msgs.severe + ' severe EnergyPlus message(s). Review before using: ' + esc((msgs.severe_messages || []).slice(0, 3).join(' | ')) + '</div>';
    h += '<p class="sub">Governing cooling day: <b>' + esc(DD_LABEL[g.cKey] || g.cKey) + '</b>, peak at ' + esc(g.time || '–') +
      ' (outdoor ' + fmt(g.oat, 1) + ' °C). Governing heating day: <b>' + esc(DD_LABEL[g.hKey] || g.hKey) + '</b>. ' +
      (msgs.warnings || 0) + ' EnergyPlus warnings.</p>';
    var c = result.dd[g.cKey], hh = result.dd[g.hKey];
    h += profileSvg(c && c.profile, 'var(--cool)', 'Block cooling, ' + (DD_LABEL[g.cKey] || ''));
    h += profileSvg(hh && hh.profile, 'var(--heat)', 'Block heating, ' + (DD_LABEL[g.hKey] || ''));
    var comp = run.components;
    if (comp && comp.cooling && Object.keys(comp.cooling).length) {
      h += '<h3>Cooling load components (sum of each zone\'s peak, kW)</h3><div class="scroll-x"><table class="t"><thead><tr><th>Component</th><th>Sensible instant</th><th>Sensible delayed</th><th>Latent</th><th>Total</th></tr></thead><tbody>';
      Object.keys(comp.cooling).sort(function (a, b) { return comp.cooling[b].Total - comp.cooling[a].Total; }).forEach(function (k) {
        var r = comp.cooling[k];
        h += '<tr><td>' + esc(k) + '</td><td class="num">' + fmt(r['Sensible - Instant'] / 1000, 1) + '</td><td class="num">' +
          fmt(r['Sensible - Delayed'] / 1000, 1) + '</td><td class="num">' + fmt(r.Latent / 1000, 1) + '</td><td class="num">' + fmt(r.Total / 1000, 1) + '</td></tr>';
      });
      h += '</tbody></table></div><p class="sub" style="margin-top:6px">From EnergyPlus\'s Zone Component Load Summary. Excludes the outdoor-air load handled by the system (shown above).</p>';
    }
    if (run.zone_sizing && run.zone_sizing.length) {
      h += '<h3>Zone sizing (per zone, unscaled)</h3><div class="scroll-x"><table class="t"><thead><tr><th>Zone</th><th>×</th><th>Load</th><th>Design load (kW)</th><th>Airflow (cfm)</th><th>Peak</th><th>Design day</th></tr></thead><tbody>';
      run.zone_sizing.forEach(function (z) {
        h += '<tr><td>' + esc(z.ZoneName) + '</td><td class="num">' + z.scale + '</td><td>' + esc(z.LoadType || '') + '</td><td class="num">' +
          fmt((z.CalcDesLoad || 0) / 1000, 1) + '</td><td class="num">' + fmt((z.CalcDesFlow || 0) * C.CFM_PER_M3S, 0) + '</td><td>' +
          esc(z.PeakHrMin || '') + '</td><td>' + esc(z.DesDayName || '') + '</td></tr>';
      });
      h += '</tbody></table></div>';
    }
    return h + '</div>';
  }

  function assumptionsCard() {
    var rows = Object.keys(S.verify).filter(function (k) { return S.verify[k] && S.sc[k] === S.defaults[k]; });
    if (!rows.length) return '';
    var h = '<div class="card"><h2>Defaults still awaiting confirmation</h2><p class="sub">These inputs are at their default and the default is flagged for MEP review. Change them or confirm them before using results for sizing.</p><div class="scroll-x"><table class="t"><thead><tr><th>Input</th><th>Value</th><th>Source</th></tr></thead><tbody>';
    rows.forEach(function (k) {
      h += '<tr><td>' + esc(k) + '</td><td class="num">' + esc(S.sc[k]) + '</td><td style="text-align:left">' + esc(S.prov[k]) + '</td></tr>';
    });
    return h + '</tbody></table></div></div>';
  }

  function renderResults() {
    var res = resultFor(S.sc, S.ep), g = res.source === 'none' ? null : governed(res, S.sc);
    var b = null, bRes = null;
    if (S.baseline) {
      bRes = resultFor(S.baseline.sc, S.baseline.ep);
      b = bRes.source === 'none' ? null : governed(bRes, S.baseline.sc);
    }
    var engineOn = S.engine && S.engine.available;
    var h = '';
    h += '<div class="card"><div class="card-head"><div><h2>Peak loads</h2><p class="sub">' +
      esc(D.archetypes.types[S.type].label) + ' · ' + esc(stationById(S.station).label) + ' · cooling ' + S.coolPct + '%, heating ' + S.heatPct + '%</p></div>' +
      '<div>' + sourceBadge(g) + '</div></div>';
    if (g) {
      if (g.source === 'surrogate') {
        var e = Math.max(g.errC || 0, g.errH || 0);
        h += '<div class="note info">Surrogate trained on ' + res.model.n + ' EnergyPlus runs. Out-of-sample error (95th percentile): ' +
          fmt(g.errC, 1) + '% cooling, ' + fmt(g.errH, 1) + '% heating. Run EnergyPlus for numbers to put in a basis of design.</div>';
        var ho = res.model.holdout;
        if (res.model.shared) {
          h += '<div class="note info">Using the shared model trained across all building types for this station.' +
            (ho && ho.per_type && ho.per_type[S.type] ? ' Independent test for ' + esc(D.archetypes.types[S.type].label) + ': worst P95 ' +
              fmt(ho.per_type[S.type].worst_total_p95_pct, 1) + '% - ' + (ho.per_type[S.type].passed ? 'passed' : 'FAILED') + '.' : '') + '</div>';
        }
        if (ho) {
          h += '<div class="note ' + (ho.passed ? 'info' : 'bad') + '">Independent test against ' + ho.n +
            ' fresh EnergyPlus runs: worst 95th-percentile error ' + fmt(ho.worst_total_p95_pct, 1) + '% (limit ' +
            fmt(ho.threshold_pct, 1) + '%) - ' + (ho.passed ? 'passed' : 'FAILED; treat these estimates with caution') + '.</div>';
        } else {
          h += '<div class="note warn">Not yet tested against independent EnergyPlus runs (run engine/validate.py).</div>';
        }
        if (res.extrapolated.length) {
          h += '<div class="note warn">Outside the trained range: ' + res.extrapolated.map(function (x) {
            return esc(FEATURE_LABELS[x.feature]) + ' ' + fmt(x.value, 2) + ' (trained ' + fmt(x.min, 2) + '–' + fmt(x.max, 2) + ')';
          }).join('; ') + '. The estimate is an extrapolation; run EnergyPlus.</div>';
        }
      }
      if (g.cf !== 1 || g.hf !== 1) h += '<div class="note info">Includes sizing factors: cooling ×' + fmt(g.cf, 2) + ', heating ×' + fmt(g.hf, 2) + '.</div>';
      if (b && b.source !== g.source) h += '<div class="note warn">Baseline and current come from different sources (' + b.source + ' vs ' + g.source + '). Compare like with like before quoting the difference.</div>';
      h += kpisCard(g, b) + compareTable(g, b);
    } else {
      h += '<div class="empty">';
      if (res.reason === 'loading') {
        h += 'Loading the trained model…';
      } else if (res.reason === 'load-error') {
        h += 'The trained model file for this building type and station could not be loaded (data/surrogates/). Re-run <code>py engine/fit_surrogate.py</code>.';
      } else if (res.reason === 'incompatible') {
        h += 'The trained surrogate for this building type and station was fitted by an older version of the tool.<br>' +
          'Re-run <code>py engine/fit_surrogate.py</code> (no new EnergyPlus runs needed), then reload this page.';
      } else if (res.reason === 'fixed') {
        h += 'The surrogate was trained with these inputs held fixed, and you have changed them: ' + res.fixedDiffs.map(function (d) {
          return '<b>' + esc(d.input) + '</b> (trained ' + esc(d.trained === null ? 'none' : d.trained) + ', now ' + esc(d.value === null ? 'none' : d.value) + ')';
        }).join(', ') + '.<br>Run EnergyPlus for this scenario.';
      } else {
        h += 'No surrogate has been trained for ' + esc(D.archetypes.types[S.type].label) + ' in ' + esc(stationById(S.station).label) + ' yet.<br>' +
          (engineOn ? 'Run EnergyPlus to calculate this scenario.' : 'Start the tool with <code>node server.js</code> on a machine with EnergyPlus installed, or train a surrogate (see README).');
      }
      h += '</div>';
    }
    if (S.runError) h += '<div class="note bad">' + esc(S.runError) + '</div>';
    h += '<div class="actions">' +
      '<button class="btn primary" type="button" id="b-run"' + (engineOn && !S.running ? '' : ' disabled') + '>' +
      (S.running ? 'Running EnergyPlus…' : 'Run EnergyPlus') + '</button>' +
      '<button class="btn" type="button" id="b-base"' + (g ? '' : ' disabled') + '>Set as baseline</button>' +
      (S.baseline ? '<button class="btn" type="button" id="b-clear">Clear baseline</button>' : '') + '</div>';
    if (!engineOn && S.engine) h += '<p class="sub" style="margin-top:8px">' + esc(S.engine.reason || 'EnergyPlus service unavailable') + '</p>';
    h += '</div>';
    if (g) h += costCard(g, b);
    if (g && g.source === 'surrogate') h += tornadoCard(g);
    if (g && g.source === 'energyplus') h += energyplusCard(res, g);
    h += designConditionsCard();
    h += assumptionsCard();
    document.getElementById('results').innerHTML = h;
  }

  function render() { renderStatus(); renderResults(); save(); }

  // ── Actions ─────────────────────────────────────────────────────────────
  function download(name, text, type) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], {type: type}));
    a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }

  function runEnergyPlus() {
    S.running = true; S.runError = null; render();
    var sc = JSON.parse(JSON.stringify(S.sc)), hash = scenarioHash(sc);
    fetch('api/run', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(engineInput(sc))})
      .then(function (r) { return r.json(); })
      .then(function (run) {
        S.running = false;
        if (!run.ok) { S.runError = 'EnergyPlus run failed: ' + (run.error || 'unknown error'); }
        else S.ep = {hash: hash, run: run};
        render();
      })
      .catch(function (e) { S.running = false; S.runError = 'Could not reach the EnergyPlus service: ' + e.message; render(); });
  }

  function onInput(e) {
    var t = e.target;
    if (t.id === 'f-cton') { S.costTon = t.value; renderResults(); save(); return; }
    if (t.id === 'f-cmbh') { S.costMbh = t.value; renderResults(); save(); return; }
    var k = t.getAttribute('data-k');
    if (!k) return;
    var spec = D.fields[k] || {}, unit = unitOf(k);
    var hintEl = function () {
      var el = document.querySelector('[data-src="' + k + '"]');
      if (el) el.innerHTML = srcHint(k, unit);
    };
    if (t.type === 'checkbox') { S.sc[k] = t.checked; hintEl(); render(); return; }
    if (t.value === '' && spec.nullable) { S.sc[k] = null; t.classList.remove('bad'); hintEl(); render(); return; }
    var v = parseFloat(t.value);
    var ok = !isNaN(v) && (spec.min === undefined || (v >= spec.min && v <= spec.max));
    t.classList.toggle('bad', !ok);
    if (!ok) return;
    S.sc[k] = spec.int ? Math.round(v) : v;
    var ip = document.querySelector('[data-ip="' + k + '"]');
    if (ip && IP[unit]) ip.textContent = IP[unit](v);
    hintEl();
    render();
  }

  function onChange(e) {
    var t = e.target;
    if (t.id === 'f-type') { S.type = t.value; resetScenario(S.sc.climate_zone); S.ep = null; renderInputs(); render(); }
    else if (t.id === 'f-station') {
      S.station = t.value; S.ep = null; S.baseline = null;
      resetScenario(); renderInputs(); render();
    } else if (t.id === 'f-cz') { resetScenario(t.value); renderInputs(); render(); }
  }

  function onClick(e) {
    var t = e.target.closest('button');
    if (!t) return;
    var seg = t.parentNode.getAttribute && t.parentNode.getAttribute('data-seg');
    if (seg) { S[seg] = t.getAttribute('data-v'); renderInputs(); render(); return; }
    if (t.id === 'b-reset') { S.sc = null; resetScenario(); renderInputs(); render(); }
    else if (t.id === 'b-run') runEnergyPlus();
    else if (t.id === 'b-base') {
      S.baseline = {sc: JSON.parse(JSON.stringify(S.sc)), ep: S.ep && S.ep.hash === scenarioHash(S.sc) ? S.ep : null};
      render();
    } else if (t.id === 'b-clear') { S.baseline = null; render(); }
    else if (t.id === 'b-dl-idf' && S.ep) download('peak-load-' + S.type + '-' + S.station + '.idf', S.ep.run.idf || '', 'text/plain');
    else if (t.id === 'b-dl-json' && S.ep) {
      var copy = JSON.parse(JSON.stringify(S.ep.run)); delete copy.idf;
      download('peak-load-' + S.type + '-' + S.station + '.json', JSON.stringify(copy, null, 1), 'application/json');
    }
  }

  // ── Boot ────────────────────────────────────────────────────────────────
  if (!restore()) resetScenario();
  renderInputs();
  render();
  var inputs = document.getElementById('inputs');
  inputs.addEventListener('input', onInput);
  inputs.addEventListener('change', onChange);
  inputs.addEventListener('toggle', function (e) {
    var g = e.target.getAttribute && e.target.getAttribute('data-g');
    if (g) S.open[g] = e.target.open;
  }, true);
  document.addEventListener('click', onClick);
  fetch('api/engine').then(function (r) { return r.json(); })
    .then(function (st) { S.engine = st; render(); })
    .catch(function () { S.engine = {available: false, reason: 'No EnergyPlus service (page opened without node server.js).'}; render(); });
})();

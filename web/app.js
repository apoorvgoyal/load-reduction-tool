// ── Peak Load Tool UI ────────────────────────────────────────────────────────
// Inputs are SI (the engine's units); every value also shows its IP equivalent.
// Results come from one of two sources, always labelled:
//   EnergyPlus run    — EnergyPlus 25.2 in this browser (ep-browser.js: WebAssembly
//                       engine + the engine's own Python under Pyodide)
//   Surrogate         — EnergyPlus-trained model in data/loads-surrogate.js (option B)
// The page has two tabs: Summary (peaks, design-day charts, load breakdown,
// sensitivity, plant cost) and Detailed data (everything else).
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
  var STORE_KEY = 'peak-load-tool.v2';

  // ── Units ───────────────────────────────────────────────────────────────
  // Inputs are stored in SI (the engine's units). In IP mode they are shown
  // and typed in IP and converted on entry. k, off: ip = si * k + off; dp: IP
  // decimals shown in the input box.
  var UNITS = {
    'm2': {si: 'm²', ip: 'ft²', k: 10.7639, dp: 0},
    'm': {si: 'm', ip: 'ft', k: 3.28084, dp: 1},
    'W/m2-K': {si: 'W/m²·K', ip: 'Btu/h·ft²·°F', k: 0.17611, dp: 3},
    'C': {si: '°C', ip: '°F', k: 1.8, off: 32, dp: 1},
    'L/s-person': {si: 'L/s·person', ip: 'cfm/person', k: 2.11888, dp: 1},
    'L/s-m2': {si: 'L/s·m²', ip: 'cfm/ft²', k: 0.19685, dp: 3},
    'W/m2': {si: 'W/m²', ip: 'W/ft²', k: 1 / 10.7639, dp: 2},
    'm2/person': {si: 'm²/person', ip: 'ft²/person', k: 10.7639, dp: 0},
    'W/m-K': {si: 'W/m·K', ip: 'Btu/h·ft·°F', k: 0.57779, dp: 3},
    'W/(L/s)': {si: 'W per L/s', ip: 'W per cfm', k: 1 / 2.11888, dp: 3}
  };
  function isIP() { return S.units !== 'si'; }
  // Arrow-key / spinner step in the shown units: the SI step converted and
  // rounded to 1, 2 or 5 × 10^n (never "any", which steps by whole units and
  // jumps small values straight to their min or max).
  function niceStep(x) {
    var p = Math.pow(10, Math.floor(Math.log10(x))), m = x / p;
    return +((m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p).toPrecision(1);
  }
  function dispStep(unit, step) {
    var u = UNITS[unit];
    if (!isIP() || !u || !(step > 0)) return step;
    return Math.max(niceStep(step * u.k), Math.pow(10, -u.dp));
  }
  function toIP(unit, v) { var u = UNITS[unit]; return v * u.k + (u.off || 0); }
  function fromIP(unit, v) { var u = UNITS[unit]; return (v - (u.off || 0)) / u.k; }
  // Value as shown in an input box, in the selected system.
  function toDisp(unit, v) {
    if (v === null || v === undefined || v === '' || typeof v !== 'number' && isNaN(+v)) return v;
    if (!UNITS[unit] || !isIP()) return typeof v === 'number' ? +v.toFixed(4) : v;
    return +toIP(unit, +v).toFixed(UNITS[unit].dp);
  }
  function fromDisp(unit, v) { return UNITS[unit] && isIP() ? fromIP(unit, v) : v; }
  function unitLabel(unit) {
    var u = UNITS[unit];
    if (!u) return unit === '-' || unit === 'deg' || unit === 'bool' ? '' : unit;
    return isIP() ? u.ip : u.si;
  }
  // The same value in the other system, shown under the input.
  function otherUnits(unit, v) {
    var u = UNITS[unit];
    if (!u || v === null || v === undefined || v === '') return '';
    return isIP() ? fmt(+v, u.dp + 1) + ' ' + u.si : fmt(toIP(unit, +v), u.dp) + ' ' + u.ip;
  }
  // Results. Cooling: tons (IP) or kW; heating: MBH (IP) or kW.
  function capC(w) { return isIP() ? tons(w) : w / 1000; }
  function capH(w) { return isIP() ? mbh(w) : w / 1000; }
  function uC() { return isIP() ? 'tons' : 'kW'; }
  function uH() { return isIP() ? 'MBH' : 'kW'; }
  function temp(c, dp) { return isIP() ? fmt(c * 1.8 + 32, dp) + ' °F' : fmt(c, dp) + ' °C'; }
  function area(m2) { return isIP() ? fmt(m2 * C.FT2_PER_M2, 0) + ' ft²' : fmt(m2, 0) + ' m²'; }
  // Plant rates are stored per ton and per MBH; in SI they are shown per kW.
  function rateToDisp(kind, r) {
    if (r === '' || r === undefined || isIP()) return r;
    return +(kind === 'cooling' ? r / C.KW_PER_TON : r * C.MBH_PER_KW).toFixed(2);
  }
  function rateFromDisp(kind, r) {
    if (r === '' || isNaN(parseFloat(r)) || isIP()) return r;
    return kind === 'cooling' ? parseFloat(r) * C.KW_PER_TON : parseFloat(r) / C.MBH_PER_KW;
  }

  // ── Input layout ────────────────────────────────────────────────────────
  // [key, label, unit, step]. Groups marked `open` start expanded. The
  // ventilation fields that don't apply to the building type (62.1 rates for
  // labs and healthcare, air changes for the rest) move to Advanced.
  var GROUPS = [
    {title: 'Size and shape', open: true, fields: [
      ['gfa_m2', 'Gross floor area', 'm2', 100],
      ['n_floors', 'Floors above grade', '-', 1],
      ['aspect_ratio', 'Plan aspect ratio (length ÷ width)', '-', 0.1],
      ['north_axis_deg', 'Rotation of long axis from east (°)', 'deg', 5]]},
    {title: 'Envelope', open: true, fields: [
      ['wwr', 'Window-to-wall ratio', '-', 0.01],
      ['win_u', 'Window U-factor (assembly)', 'W/m2-K', 0.05],
      ['shgc', 'Window SHGC', '-', 0.01],
      ['overhang_pf', 'Overhang projection factor', '-', 0.05],
      ['wall_u', 'Wall U-factor (assembly)', 'W/m2-K', 0.01],
      ['roof_u', 'Roof U-factor (assembly)', 'W/m2-K', 0.01]]},
    {title: 'People, lighting and equipment', open: true, fields: [
      ['m2_per_person', 'Floor area per person', 'm2/person', 0.5],
      ['lpd_w_m2', 'Lighting power density', 'W/m2', 0.1],
      ['epd_w_m2', 'Equipment power density', 'W/m2', 0.5]]},
    {title: 'Ventilation and air leakage', open: true, fields: [
      ['oa_per_person_ls', 'Outdoor air per person (Rp)', 'L/s-person', 0.1],
      ['oa_per_area_ls_m2', 'Outdoor air per area (Ra)', 'L/s-m2', 0.01],
      ['oa_ach', 'Outdoor air by air changes', '1/h', 0.5],
      ['erv_sensible_eff', 'Heat recovery, sensible effectiveness', '-', 0.05],
      ['erv_latent_eff', 'Heat recovery, latent effectiveness', '-', 0.05],
      ['infiltration_ach', 'Infiltration (whole building)', '1/h', 0.01]]},
    {title: 'Schedule and controls', open: false, fields: [
      ['occ_start_h', 'Occupied from (hour)', 'h', 1],
      ['occ_hours', 'Occupied hours per day', 'h', 1],
      ['occ_days_per_week', 'Occupied days per week (annual energy)', 'days', 1],
      ['hvac_start_before_occ_h', 'Systems start before occupancy', 'h', 1],
      ['oa_unoccupied_fraction', 'Outdoor air when unoccupied (fraction of design)', '-', 0.05],
      ['t_heat_c', 'Heating setpoint (occupied)', 'C', 0.5],
      ['t_cool_c', 'Cooling setpoint (occupied)', 'C', 0.5],
      ['setback_heat_c', 'Heating setback (blank = none)', 'C', 0.5],
      ['setup_cool_c', 'Cooling setup (blank = none)', 'C', 0.5]]},
    {title: 'Advanced', open: false, fields: [
      ['floor_to_floor_m', 'Floor-to-floor height', 'm', 0.05],
      ['perimeter_depth_m', 'Perimeter zone depth', 'm', 0.1],
      ['slab_f_factor_w_mk', 'Slab-on-grade F-factor', 'W/m-K', 0.01],
      ['thermal_mass', 'Concrete floor slabs (thermal mass)', 'bool'],
      ['activity_w_per_person', 'Metabolic rate (total)', 'W/person', 5],
      ['unoccupied_internal_fraction', 'Lights/equipment when unoccupied', '-', 0.05],
      ['cooling_supply_air_c', 'Cooling supply air temperature', 'C', 0.1],
      ['heating_supply_air_c', 'Heating supply air temperature', 'C', 0.5],
      ['cooling_sizing_factor', 'Cooling sizing factor', '-', 0.05],
      ['heating_sizing_factor', 'Heating sizing factor', '-', 0.05]]}
  ];
  var VENT_6201 = ['oa_per_person_ls', 'oa_per_area_ls_m2'];

  // Plant types for costing. Labels only: the rates are the user's own.
  var PLANTS = {
    cooling: ['Air-cooled chiller', 'Water-cooled chiller plant', 'Packaged rooftop (DX)', 'Air-source heat pump', 'Other'],
    heating: ['Condensing gas boiler', 'Electric boiler', 'Air-source heat pump', 'Other']
  };

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
    overhang_pf: 'Overhang PF', m2_per_person: 'Area per person', lpd_w_m2: 'Lighting power',
    epd_w_m2: 'Equipment power', oa_multiplier: 'Outdoor air (× 62.1 rate)', oa_ach: 'Outdoor air ACH',
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

  var COMP_LABEL = {
    people: 'People', lighting: 'Lighting', equipment: 'Equipment', window_solar: 'Windows, solar',
    window_conduction: 'Windows, conduction', walls: 'Walls', roof: 'Roof', ground_floor: 'Ground floor (slab)',
    infiltration: 'Infiltration', internal_mass: 'Internal mass (slabs, partitions)',
    ventilation: 'Ventilation (outdoor air)', heat_recovery: 'Heat recovery'
  };
  // Pie slices for the breakdown; each has a fixed colour (--s-<key> in styles.css).
  var SLICE_OF = {people: 'people', lighting: 'lighting', equipment: 'equipment', window_solar: 'window_solar',
    window_conduction: 'window_conduction', walls: 'envelope', roof: 'envelope', ground_floor: 'envelope',
    infiltration: 'infiltration', internal_mass: 'other', ventilation: 'ventilation', heat_recovery: 'heat_recovery'};
  var SLICE_ORDER = ['ventilation', 'window_solar', 'window_conduction', 'envelope', 'infiltration', 'people', 'lighting',
    'equipment', 'other', 'heat_recovery'];
  var SLICE_LABEL = {ventilation: 'Ventilation (outdoor air)', window_solar: 'Windows, sun', window_conduction: 'Windows, heat through glass',
    envelope: 'Walls, roof and floor', infiltration: 'Air leakage', people: 'People', lighting: 'Lighting', equipment: 'Equipment',
    other: 'Heat stored in the structure', heat_recovery: 'Heat recovery'};

  // ── State ───────────────────────────────────────────────────────────────
  var S = {type: 'office', station: 'chicago', czOverride: null, coolPct: '0.4', heatPct: '99.6',
    sc: null, prov: null, verify: null, defaults: null, baseline: null, ep: null, open: {}, tzLoad: 'cooling',
    tab: 'summary', bdMode: 'abs', showSources: false, units: 'ip',
    plant: {cooling: PLANTS.cooling[0], heating: PLANTS.heating[0]}, rates: {cooling: {}, heating: {}},
    epSens: null, epSensRunning: null, epSensError: null,
    opt: {clg: '', htg: '', levers: {}, result: null, showLevers: false},
    energy: {cop: '', heatSource: 'gas', heatEff: '', sfp: '', efElec: '', efGas: ''}, annual: null, annualRunning: false, annualError: null,
    engine: null, running: false, runError: null, custom: {}, rebuild: false};

  function stationById(id) {
    for (var i = 0; i < D.stations.length; i++) if (D.stations[i].id === id) return D.stations[i];
    return D.stations[0];
  }

  function envZones() {
    return Object.keys(D.archetypes.envelope_by_climate_zone).filter(function (k) { return k[0] !== '_'; });
  }

  // The envelope defaults follow the station's climate zone (from its .stat
  // file) unless the user overrides it under Advanced.
  function stationZone() {
    var z = stationById(S.station).climate_zone_stat;
    return envZones().indexOf(z) >= 0 ? z : z.charAt(0);    // e.g. "7" for "7A"
  }

  function resetScenario() {
    var zone = S.czOverride || stationZone();
    var keep = S.sc ? {gfa_m2: S.sc.gfa_m2, n_floors: S.sc.n_floors, aspect_ratio: S.sc.aspect_ratio,
      north_axis_deg: S.sc.north_axis_deg} : null;
    var d = C.defaults(D, S.type, zone);
    S.sc = d.scenario; S.prov = d.provenance; S.verify = d.verify; S.defaults = JSON.parse(JSON.stringify(d.scenario));
    if (keep) Object.keys(keep).forEach(function (k) { S.sc[k] = keep[k]; });
    S.sc.station = S.station;
  }

  function save() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({type: S.type, station: S.station, czOverride: S.czOverride,
        coolPct: S.coolPct, heatPct: S.heatPct, sc: S.sc, baseline: S.baseline, tab: S.tab, bdMode: S.bdMode, units: S.units,
        showSources: S.showSources, plant: S.plant, rates: S.rates, energy: S.energy, annual: S.annual}));
    } catch (e) { /* storage unavailable: state just isn't remembered */ }
  }

  function restore() {
    try {
      var s = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
      if (!s || !D.archetypes.types[s.type]) return false;
      S.type = s.type; S.station = stationById(s.station).id; S.czOverride = s.czOverride || null;
      S.coolPct = s.coolPct || '0.4'; S.heatPct = s.heatPct || '99.6';
      S.units = s.units === 'si' ? 'si' : 'ip';
      S.tab = s.tab === 'details' ? 'details' : 'summary'; S.bdMode = s.bdMode === 'pct' ? 'pct' : 'abs';
      S.showSources = !!s.showSources;
      if (s.plant) S.plant = s.plant;
      if (s.rates) S.rates = {cooling: s.rates.cooling || {}, heating: s.rates.heating || {}};
      if (s.energy) Object.keys(S.energy).forEach(function (k) { if (s.energy[k] !== undefined) S.energy[k] = s.energy[k]; });
      S.annual = s.annual || null;
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
  function tons(w) { return w / 1000 / C.KW_PER_TON; }
  function mbh(w) { return w / 1000 * C.MBH_PER_KW; }
  function seg(name, options, current) {
    return '<div class="seg" data-seg="' + name + '">' + options.map(function (o) {
      return '<button type="button" data-v="' + esc(o[0]) + '"' + (current === o[0] ? ' class="on"' : '') + '>' + esc(o[1]) + '</button>';
    }).join('') + '</div>';
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
    // A model that missed the accuracy limit on its independent EnergyPlus test
    // is not used: the page asks for an EnergyPlus run instead.
    var failed = C.failedTest(m, sc.type);
    if (failed) return {source: 'none', reason: 'failed-test', failed: failed};
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
      source: result.source, gfa: sc.gfa_m2, result: result, cBlock: c, hBlock: h,
      cKey: c && c.key, hKey: h && h.key,
      clg: c && c.total_w * cf, clgSens: c && c.sensible_w != null ? c.sensible_w * cf : null,
      clgLat: c && c.latent_w != null ? c.latent_w * cf : null,
      clgOA: c && c.outdoor_air_w != null ? c.outdoor_air_w : null, clgRaw: c && c.total_w,
      clgHR: c && c.heat_recovery_w != null ? c.heat_recovery_w : null,
      clgSop: c && c.sum_of_zone_peaks_w != null ? c.sum_of_zone_peaks_w * cf : null,
      supply: c && c.supply_air_m3s, time: c && c.time, oat: c && c.outdoor_db_c, errC: c && c.err_pct,
      htg: h && h.total_w * hf, htgRaw: h && h.total_w,
      htgSop: h && h.sum_of_zone_peaks_w != null ? h.sum_of_zone_peaks_w * hf : null,
      hTime: h && h.time, errH: h && h.err_pct, cf: cf, hf: hf,
      clgTs: c && c.max_timestep_w, clgTsTime: c && c.max_timestep_time,
      htgTs: h && h.max_timestep_w, htgTsTime: h && h.max_timestep_time
    };
  }

  // ── Rendering: inputs ───────────────────────────────────────────────────
  function isChanged(key, unit) {
    var v = S.sc[key], def = S.defaults[key];
    if (unit === 'bool') return !!v !== !!def;
    return !(v === def || (v != null && def != null && Math.abs(v - def) < 1e-9));
  }

  // Under each input: "Changed (default X)", else the default's source when
  // sources are switched on.
  function srcHint(key, unit) {
    var def = S.defaults[key], src = S.prov[key] || '';
    if (isChanged(key, unit)) {
      return '<span class="changed">Changed (default ' +
        (unit === 'bool' ? (def ? 'on' : 'off') : esc(def === null ? 'none' : toDisp(unit, def))) + ')</span>';
    }
    return S.showSources ? esc(src) : '';
  }

  function unitOf(key) {
    var unit = null;
    GROUPS.forEach(function (g) { g.fields.forEach(function (f) { if (f[0] === key) unit = f[2]; }); });
    return unit;
  }

  function fieldHtml(key, label, unit, step) {
    var v = S.sc[key], spec = D.fields[key] || {};
    var vb = S.verify[key] ? '<span class="verify" title="Default not yet checked against its cited source">verify</span>' : '';
    var hint = '<span class="hint" data-src="' + key + '">' + srcHint(key, unit) + '</span>';
    var ip = otherUnits(unit, v), dv = toDisp(unit, v);
    if (unit === 'bool') {
      return '<div class="field"><label for="f-' + key + '">' + esc(label) + vb + '</label>' +
        '<input id="f-' + key + '" type="checkbox" data-k="' + key + '"' + (v ? ' checked' : '') + ' style="width:auto;justify-self:end">' +
        hint + '</div>';
    }
    var ul = unitLabel(unit), u = ul ? ' (' + ul + ')' : '';
    var mn = spec.min !== undefined ? toDisp(unit, spec.min) : undefined, mx = spec.max !== undefined ? toDisp(unit, spec.max) : undefined;
    // Browsers count spinner steps from min: put min on the step grid so the
    // arrows land on round values (the true limits are checked on entry).
    var st = dispStep(unit, step);
    if (mn !== undefined && st > 0) { mn = +(Math.floor(mn / st + 1e-9) * st).toFixed(6); mx = +(Math.ceil(mx / st - 1e-9) * st).toFixed(6); }
    return '<div class="field"><label for="f-' + key + '">' + esc(label) + '<span class="unit">' + esc(u) + '</span>' + vb + '</label>' +
      '<input id="f-' + key + '" type="number" inputmode="decimal" data-k="' + key + '" step="' + st + '"' +
      (mn !== undefined ? ' min="' + mn + '" max="' + mx + '"' : '') +
      ' value="' + (dv === null || dv === undefined ? '' : dv) + '">' +
      (ip ? '<span class="ip" data-ip="' + key + '">' + ip + '</span>' : '<span class="ip" data-ip="' + key + '"></span>') + hint + '</div>';
  }

  // Which fields each group shows. Ventilation shows the method the building
  // type uses (62.1 rates or air changes); the other method sits in Advanced.
  function groupFields(g) {
    var byAch = (S.defaults.oa_ach || 0) > 0 && !(S.defaults.oa_per_person_ls > 0) && !(S.defaults.oa_per_area_ls_m2 > 0);
    var other = byAch ? VENT_6201 : ['oa_ach'];
    if (g.title === 'Ventilation and air leakage') return g.fields.filter(function (f) { return other.indexOf(f[0]) < 0; });
    if (g.title === 'Advanced') {
      var vent = GROUPS[3].fields.filter(function (f) { return other.indexOf(f[0]) >= 0; });
      return vent.concat(g.fields);
    }
    return g.fields;
  }

  // Inputs changed outside the Inputs view's own boxes (type, station,
  // units, reset, applied plans): rebuild that view on its next render.
  function renderInputs() { S.rebuild = true; }

  function czFieldHtml() {
    return '<div class="field"><label for="f-cz">Code climate zone (envelope defaults)</label><select id="f-cz">' +
      '<option value="">From weather file (' + esc(stationZone()) + ')</option>' +
      envZones().map(function (z) {
        return '<option value="' + z + '"' + (z === S.czOverride ? ' selected' : '') + '>' + z + '</option>';
      }).join('') + '</select><span class="hint">Only if the project\'s county zone (ASHRAE 169) differs from the ' +
      'zone computed from the weather data (' + esc(stationById(S.station).climate_zone_stat) + '). Changing it resets the envelope defaults.</span></div>';
  }
  function energyHtml() {
    var E = S.energy, heatEffLabel = E.heatSource === 'gas' ? 'Boiler efficiency (fraction, e.g. 0.9)' :
      (E.heatSource === 'heatpump' ? 'Heat pump heating COP' : '');
    return '<p class="sub">Used to turn the annual run\'s heating and cooling into electricity and gas, and those into carbon. ' +
      'Your values: the tool has no built-in efficiencies or emission factors.</p>' +
      energyField('cop', 'Cooling plant COP (kW cooling per kW electric)', 0.1) +
      '<div class="field"><label for="f-e-heatSource">Heating source</label><select id="f-e-heatSource">' +
      [['gas', 'Gas boiler'], ['electric', 'Electric resistance'], ['heatpump', 'Heat pump']].map(function (o) {
        return '<option value="' + o[0] + '"' + (E.heatSource === o[0] ? ' selected' : '') + '>' + o[1] + '</option>';
      }).join('') + '</select></div>' +
      (heatEffLabel ? energyField('heatEff', heatEffLabel, 0.01) : '') +
      energyField('sfp', 'Fan power (' + (isIP() ? 'W per cfm' : 'W per L/s') + ' of supply air)', dispStep('W/(L/s)', 0.1), 'W/(L/s)') +
      energyField('efElec', 'Electricity carbon factor (kg CO₂e per kWh)', 0.001) +
      (E.heatSource === 'gas' ? energyField('efGas', 'Gas carbon factor (kg CO₂e per therm)', 0.01) : '');
  }
  function plantHtml() {
    var h = '<p class="sub">Your installed-cost rates per plant type. The tool has no built-in cost data.</p>';
    ['cooling', 'heating'].forEach(function (kind) {
      var unit = isIP() ? (kind === 'cooling' ? '$ per ton' : '$ per MBH') : '$ per kW', cur = S.plant[kind];
      h += '<div class="field wide"><label for="f-plant-' + kind + '">' + (kind === 'cooling' ? 'Cooling plant' : 'Heating plant') + '</label>' +
        '<select id="f-plant-' + kind + '">' + PLANTS[kind].map(function (p) {
          return '<option' + (p === cur ? ' selected' : '') + '>' + esc(p) + '</option>';
        }).join('') + '</select></div>' +
        '<div class="field"><label for="f-rate-' + kind + '">' + esc(cur) + ' (' + unit + ')</label>' +
        '<input id="f-rate-' + kind + '" type="number" min="0" step="10" value="' + esc(rateToDisp(kind, S.rates[kind][cur] || '')) + '"></div>';
    });
    return h;
  }

  function energyField(k, label, step, unit) {
    var v = S.energy[k], dv = unit && v !== '' && !isNaN(parseFloat(v)) ? toDisp(unit, parseFloat(v)) : v;
    return '<div class="field"><label for="f-e-' + k + '">' + esc(label) + '</label><input id="f-e-' + k +
      '" type="number" min="0" step="' + step + '" value="' + esc(dv) + '"></div>';
  }

  // ── Rendering: shared pieces ────────────────────────────────────────────
  function renderStatus() {
    var h = '<div class="units-toggle" role="group" aria-label="Units">' +
      '<button type="button" data-units="ip" aria-pressed="' + isIP() + '"' + (isIP() ? ' class="on"' : '') + '>US units</button>' +
      '<button type="button" data-units="si" aria-pressed="' + !isIP() + '"' + (!isIP() ? ' class="on"' : '') + '>Metric</button></div>';
    document.getElementById('status').innerHTML = h;
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

  function headlineKpis(g, b) {
    var ft2 = g.gfa * C.FT2_PER_M2, t = tons(g.clg), m = mbh(g.htg);
    var h = '<div class="kpis two">';
    var cC = capC(g.clg), cH = capH(g.htg);
    h += '<div class="kpi cool"><div class="kpi-label">Peak cooling (block)</div><div class="kpi-value">' + fmt(cC, isIP() ? 1 : 0) + '<span class="kpi-unit">' + uC() + '</span></div>' +
      '<div class="kpi-sec">' + (isIP() ? fmt(ft2 / t, 0) + ' ft²/ton · ' + fmt(g.clg / 1000, 0) + ' kW' : fmt(g.clg / g.gfa, 1) + ' W/m² · ' + fmt(t, 1) + ' tons') + '</div>' +
      deltaHtml(cC, b && capC(b.clg), function (v) { return fmt(v, isIP() ? 1 : 0) + ' ' + uC(); }) + '</div>';
    h += '<div class="kpi heat"><div class="kpi-label">Peak heating (block)</div><div class="kpi-value">' + fmt(cH, 0) + '<span class="kpi-unit">' + uH() + '</span></div>' +
      '<div class="kpi-sec">' + (isIP() ? fmt(m * 1000 / ft2, 1) + ' Btu/h·ft² · ' + fmt(g.htg / 1000, 0) + ' kW' : fmt(g.htg / g.gfa, 1) + ' W/m² · ' + fmt(m, 0) + ' MBH') + '</div>' +
      deltaHtml(cH, b && capH(b.htg), function (v) { return fmt(v, 0) + ' ' + uH(); }) + '</div>';
    return h + '</div>';
  }

  function noResultHtml(res) {
    var engineOn = S.engine && S.engine.available, h = '<div class="empty">';
    if (res.reason === 'loading') {
      h += 'Loading the trained model…';
    } else if (res.reason === 'load-error') {
      h += 'The trained model file for this building type and station could not be loaded (data/surrogates/). Re-run <code>python engine/fit_surrogate.py</code>.';
    } else if (res.reason === 'failed-test') {
      h += 'No instant estimate here: the trained model for ' + esc(D.archetypes.types[S.type].label) + ' in ' + esc(stationById(S.station).label) +
        ' missed the accuracy limit on its independent test against ' + res.failed.n + ' fresh EnergyPlus runs (worst 95th-percentile error ' +
        fmt(res.failed.worst, 1) + '%, limit ' + fmt(res.failed.limit, 1) + '%).<br>' +
        (engineOn ? 'Click <b>Run EnergyPlus</b> to calculate this scenario.' : esc((S.engine && S.engine.reason) || 'EnergyPlus cannot run in this browser.'));
    } else if (res.reason === 'incompatible') {
      h += 'The trained model for this building type and station was fitted by an older version of the tool.<br>' +
        'Re-run <code>python engine/fit_surrogate.py</code> (no new EnergyPlus runs needed), then reload this page.';
    } else if (res.reason === 'fixed') {
      h += 'The instant estimate was trained with these inputs held fixed, and you have changed them: ' + res.fixedDiffs.map(function (d) {
        return '<b>' + esc(d.input) + '</b> (trained ' + esc(d.trained === null ? 'none' : d.trained) + ', now ' + esc(d.value === null ? 'none' : d.value) + ')';
      }).join(', ') + '.<br>Click <b>Run EnergyPlus</b> for this scenario.';
    } else {
      h += 'No trained model for ' + esc(D.archetypes.types[S.type].label) + ' in ' + esc(stationById(S.station).label) + ' yet.<br>' +
        (engineOn ? 'Click <b>Run EnergyPlus</b> to calculate this scenario.' : esc((S.engine && S.engine.reason) || 'EnergyPlus cannot run in this browser.'));
    }
    return h + '</div>';
  }

  function surrogateNotes(res, g) {
    var h = '', ho = res.model.holdout;
    h += '<div class="note info">Instant estimate from a model trained on ' + res.model.n + ' EnergyPlus runs' +
      (ho ? ' and tested against ' + ho.n + ' fresh runs: worst 95th-percentile error ' +
        fmt(ho.worst_governing_p95_pct != null ? ho.worst_governing_p95_pct : ho.worst_total_p95_pct, 1) + '% (limit ' + fmt(ho.threshold_pct, 1) + '%)' : '') +
      '. Run EnergyPlus for numbers to put in a basis of design.</div>';
    if (res.extrapolated.length) {
      h += '<div class="note warn">Outside the trained range: ' + res.extrapolated.map(function (x) {
        return esc(FEATURE_LABELS[x.feature]) + ' ' + fmt(x.value, 2) + ' (trained ' + fmt(x.min, 2) + '–' + fmt(x.max, 2) + ')';
      }).join('; ') + '. The estimate is an extrapolation; run EnergyPlus.</div>';
    }
    return h;
  }

  // ── Summary: design-day bar charts ──────────────────────────────────────
  // Vertical bars in SVG. `groups` = [{label, bars:[{name, v, base, strong}]}];
  // values are already in display units.
  function barChart(groups, color, unit, dp, title, width) {
    var W = width || 560, H = 230, left = 46, right = 12, top = 30, bottom = 44;
    var vals = [];
    groups.forEach(function (gr) { gr.bars.forEach(function (b) { vals.push(b.v || 0); if (b.base != null) vals.push(b.base); }); });
    var mx = Math.max.apply(null, vals.concat([1e-9]));
    var step = Math.pow(10, Math.floor(Math.log(mx) / Math.LN10)), nice = [1, 2, 2.5, 5, 10], top0 = mx * 1.12, tick = step;
    for (var i = 0; i < nice.length; i++) { tick = nice[i] * step; if (top0 / tick <= 5) break; }
    var yMax = Math.ceil(top0 / tick) * tick;
    var Y = function (v) { return top + (1 - v / yMax) * (H - top - bottom); };
    var gw = (W - left - right) / groups.length, s = '';
    for (var t = 0; t <= yMax + 1e-9; t += tick) {
      s += '<line x1="' + left + '" x2="' + (W - right) + '" y1="' + Y(t) + '" y2="' + Y(t) + '" class="grid"/>' +
        '<text x="' + (left - 6) + '" y="' + (Y(t) + 3.5) + '" text-anchor="end">' + fmt(t, tick < 1 ? 1 : 0) + '</text>';
    }
    groups.forEach(function (gr, gi) {
      var n = gr.bars.length, bw = Math.min(46, (gw - 24) / n), x0 = left + gi * gw + (gw - bw * n - 6 * (n - 1)) / 2;
      gr.bars.forEach(function (b, bi) {
        var x = x0 + bi * (bw + 6), y = Y(b.v || 0);
        s += '<rect x="' + x + '" y="' + y + '" width="' + bw + '" height="' + (Y(0) - y) + '" rx="3" fill="' + color + '"' +
          (b.strong ? '' : ' fill-opacity="0.35"') + '><title>' + esc(b.name + ': ' + fmt(b.v, dp) + ' ' + unit) + '</title></rect>' +
          '<text x="' + (x + bw / 2) + '" y="' + (y - 5) + '" text-anchor="middle" class="val' + (b.strong ? ' strong' : '') + '">' + fmt(b.v, dp) + '</text>';
        if (b.base != null) {
          s += '<line x1="' + (x - 3) + '" x2="' + (x + bw + 3) + '" y1="' + Y(b.base) + '" y2="' + Y(b.base) + '" class="base"/>';
        }
        s += '<text x="' + (x + bw / 2) + '" y="' + (H - bottom + 14) + '" text-anchor="middle">' + esc(b.short || '') + '</text>';
      });
      s += '<text x="' + (left + gi * gw + gw / 2) + '" y="' + (H - bottom + 30) + '" text-anchor="middle" class="grp-label">' + esc(gr.label) + '</text>';
    });
    s += '<line x1="' + left + '" x2="' + (W - right) + '" y1="' + Y(0) + '" y2="' + Y(0) + '" class="axis"/>';
    return '<div class="chart bars"><svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(title) + '">' +
      '<text x="' + left + '" y="16" class="title">' + esc(title) + ' (' + esc(unit) + ')</text>' + s + '</svg></div>';
  }

  function designDayCard(g, b) {
    var dd = g.result.dd, bdd = b ? b.result.dd : null, cf = g.cf, hf = g.hf;
    var cg = [];
    ['0.4', '1', '2'].forEach(function (p) {
      var a = dd['clg_db_' + p], d = dd['clg_dp_' + p], gov = a && d ? (d.total_w > a.total_w ? 'dp' : 'db') : (a ? 'db' : 'dp');
      var bars = [];
      [['db', a, 'DB'], ['dp', d, 'DP']].forEach(function (x) {
        if (!x[1]) return;
        var bb = bdd && bdd['clg_' + x[0] + '_' + p];
        bars.push({name: (x[0] === 'db' ? 'Dry-bulb day ' : 'Dew-point day ') + p + '%', short: x[2], v: capC(x[1].total_w * cf),
          base: bb ? capC(bb.total_w * b.cf) : null, strong: x[0] === gov && p === S.coolPct});
      });
      cg.push({label: p + '%' + (p === S.coolPct ? ' (selected)' : ''), bars: bars});
    });
    var hg = ['99.6', '99'].map(function (p) {
      var r = dd['htg_' + p], bb = bdd && bdd['htg_' + p];
      return {label: p + '%' + (p === S.heatPct ? ' (selected)' : ''), bars: r ? [{name: 'Heating ' + p + '%', short: '',
        v: capH(r.total_w * hf), base: bb ? capH(bb.total_w * b.hf) : null, strong: p === S.heatPct}] : []};
    });
    var h = '<div class="card"><div class="card-head"><div><h2>Peak loads by design condition</h2>' +
      '<p class="sub">Every ASHRAE design day in the station\'s weather file. Cooling is governed by the larger of the dry-bulb (DB) and ' +
      'dew-point (DP) day; the solid bars are the selected condition' + (b ? '; black lines mark the baseline' : '') + '.</p></div></div>';
    h += '<div class="chart-pair">' + barChart(cg, 'var(--cool)', uC(), isIP() ? 1 : 0, 'Cooling') +
      barChart(hg, 'var(--heat)', uH(), 0, 'Heating', 340) + '</div>';
    h += '<p class="sub" style="margin:8px 0 0">Monthly peaks need ASHRAE monthly design conditions, which are not in the free DOE weather files. ' +
      'They will show here once that data is loaded.</p></div>';
    return h;
  }

  // ── Summary: load breakdown ─────────────────────────────────────────────
  function breakdownRows(groups, block, factor) {
    var br = C.breakdown(groups, block), total = block.total_w * factor, rows = [];
    C.COMPONENTS.concat(['ventilation', 'heat_recovery']).forEach(function (k) {
      var v = br[k] * factor;
      if (Math.abs(v) < 0.005 * Math.abs(total)) return;      // categories with no share (e.g. people on the heating day)
      rows.push({key: k, w: v, pct: total ? v / total * 100 : 0});
    });
    return rows.sort(function (a, b) { return b.w - a.w; });
  }

  function breakdownPanel(kind, g, b) {
    var cooling = kind === 'cooling', block = cooling ? g.cBlock : g.hBlock, groups = g.result.groups && g.result.groups[kind];
    var factor = cooling ? g.cf : g.hf, conv = cooling ? capC : capH, unit = cooling ? uC() : uH(), dp = cooling && isIP() ? 1 : 0;
    var h = '<div class="bd"><h3>' + (cooling ? 'Cooling' : 'Heating') + ' · ' + esc(DD_LABEL[block.key] || block.key) + '</h3>';
    if (!groups) {
      return h + '<p class="sub">' + (g.source === 'energyplus' ? 'This EnergyPlus run did not report load components.' :
        'Instant estimates will include the breakdown after the current model update. Run EnergyPlus to see it now.') + '</p></div>';
    }
    var rows = breakdownRows(groups, block, factor), base = null;
    if (b && b.result.groups && b.result.groups[kind]) {
      base = {};
      breakdownRows(b.result.groups[kind], cooling ? b.cBlock : b.hBlock, cooling ? b.cf : b.hf).forEach(function (r) { base[r.key] = r; });
    }
    // Pie slices: fixed colour per source (never by rank); walls, roof and
    // floor share one slice. Negative sources (credits) sit under the pie.
    function slices(rs) {
      var acc = {};
      rs.forEach(function (r) { var k = SLICE_OF[r.key] || 'other'; acc[k] = (acc[k] || 0) + r.w; });
      return acc;
    }
    var cur = slices(rows), prev = base ? slices(Object.keys(base).map(function (k) { return base[k]; })) : null;
    var pos = SLICE_ORDER.filter(function (k) { return cur[k] > 0; });
    var neg = SLICE_ORDER.filter(function (k) { return cur[k] < 0; });
    var gross = pos.reduce(function (t, k) { return t + cur[k]; }, 0), total = block.total_w * factor;
    var svg = '<svg class="pie" viewBox="0 0 120 120" role="img" aria-label="' + (cooling ? 'Cooling' : 'Heating') + ' peak by source">';
    var ang = -Math.PI / 2;
    pos.forEach(function (k) {
      var frac = cur[k] / gross, a1 = ang + frac * 2 * Math.PI, R = 56, r0 = 32;
      if (frac > 0.9999) {
        svg += '<circle cx="60" cy="60" r="44" fill="none" stroke="var(--s-' + k + ')" stroke-width="24"><title>' + esc(SLICE_LABEL[k]) + ' 100%</title></circle>';
      } else {
        var lg = frac > 0.5 ? 1 : 0, c = Math.cos, sn = Math.sin;
        svg += '<path d="M' + (60 + R * c(ang)) + ' ' + (60 + R * sn(ang)) + ' A' + R + ' ' + R + ' 0 ' + lg + ' 1 ' + (60 + R * c(a1)) + ' ' + (60 + R * sn(a1)) +
          ' L' + (60 + r0 * c(a1)) + ' ' + (60 + r0 * sn(a1)) + ' A' + r0 + ' ' + r0 + ' 0 ' + lg + ' 0 ' + (60 + r0 * c(ang)) + ' ' + (60 + r0 * sn(ang)) +
          'Z" fill="var(--s-' + k + ')" stroke="var(--surface)" stroke-width="1.5"><title>' + esc(SLICE_LABEL[k]) + ': ' + fmt(conv(cur[k]), dp) + ' ' + unit +
          ' (' + fmt(frac * 100, 0) + '%)</title></path>';
      }
      ang = a1;
    });
    svg += '<text x="60" y="58" text-anchor="middle" class="pie-total">' + fmt(conv(total), dp) + '</text>' +
      '<text x="60" y="71" text-anchor="middle" class="pie-unit">' + unit + ' peak</text></svg>';
    function delta(k) {
      if (!prev) return '';
      var d = conv(cur[k] || 0) - conv(prev[k] || 0);
      return Math.abs(d) > 0.05 ? ' <span class="' + (d < 0 ? 'good' : 'bad') + '">' + (d > 0 ? '+' : '−') + fmt(Math.abs(d), dp) + '</span>' : '';
    }
    h += '<div class="pie-wrap">' + svg + '<ul class="pie-key">';
    pos.forEach(function (k) {
      h += '<li><i style="background:var(--s-' + k + ')"></i><span class="pk-name">' + esc(SLICE_LABEL[k]) + '</span>' +
        '<span class="num pk-pct">' + fmt(cur[k] / gross * 100, 0) + '%</span><span class="num pk-val">' + fmt(conv(cur[k]), dp) + delta(k) + '</span></li>';
    });
    h += '</ul></div>';
    if (neg.length) {
      h += '<div class="pie-credits"><b>Reduces the peak</b> (not in the pie): ' + neg.map(function (k) {
        return esc(SLICE_LABEL[k]) + ' <span class="num">−' + fmt(Math.abs(conv(cur[k])), dp) + ' ' + unit + '</span>' + delta(k);
      }).join(' · ') + '</div>';
    }
    h += '<div class="bd-total"><span>' + (neg.length ? 'Sources ' + fmt(conv(gross), dp) + ' − credits ' + fmt(conv(gross - total), dp) + ' = peak' : 'Peak') +
      '</span><span class="num">' + fmt(conv(total), dp) + ' ' + unit + '</span></div></div>';
    return h;
  }

  function breakdownCard(g, b) {
    var h = '<div class="card"><div class="card-head"><div><h2>Where the peak load comes from</h2>' +
      '<p class="sub">Each peak split by source, at the hour the whole building peaks. Slices show each source\'s share; ' +
      'figures are in ' + (isIP() ? 'tons (cooling) and MBH (heating).' : 'kW.') + (b ? ' Coloured figures are the change from the baseline.' : '') + '</p></div></div>';
    h += '<div class="bd-pair">' + breakdownPanel('cooling', g, b) + breakdownPanel('heating', g, b) + '</div>';
    h += '<p class="sub" style="margin:10px 0 0">Method: the zone part of each peak is split in the proportions of EnergyPlus\'s Zone ' +
      'Component Load Summary; ventilation and heat recovery come from the system at the peak hour. Heating counts sensible loads only.</p></div>';
    return h;
  }

  // ── Summary: sensitivity ────────────────────────────────────────────────
  // Each input swept to the low and high end of its realistic range (the
  // trained design space), everything else as set. Bars come from an exact
  // EnergyPlus sweep when one has been run for this scenario, otherwise from
  // the trained model (marked indicative where the model failed its test).
  function sweepRanges(sc0, def) {
    var space = D.design_space.sampled, rows = [];
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
      if (key === 'oa_ach' && !(def.oa_ach > 0)) return;
      if (!(hi > lo)) return;
      rows.push({key: key, lo: lo, hi: hi});
    });
    return rows;
  }

  function sweepScenario(sc0, def, key, v) {
    var sc = JSON.parse(JSON.stringify(sc0));
    if (key === 'oa_multiplier') { sc.oa_per_person_ls = def.oa_per_person_ls * v; sc.oa_per_area_ls_m2 = def.oa_per_area_ls_m2 * v; }
    else sc[key] = (D.fields[key] || {}).int ? Math.round(v) : v;
    return sc;
  }

  // Governing peak (W) for the selected percentiles from a design-day total map.
  function govFromTotals(t, heating) {
    if (heating) return t['htg_' + S.heatPct];
    var a = t['clg_db_' + S.coolPct], b = t['clg_dp_' + S.coolPct];
    return Math.max(a || 0, b || 0);
  }

  function sensitivityCard() {
    var mk = modelKeyFor(S.type, S.station), m = mk && SUR[mk], heating = S.tzLoad === 'heating';
    var engineOn = S.engine && S.engine.available, hash = scenarioHash(S.sc), sc0 = S.sc, def = S.defaults;
    var ep = S.epSens && S.epSens.hash === hash && S.epSens.done ? S.epSens : null;
    var head = '<section class="card r-card" id="ranked"><div class="r-head"><h2>Biggest ways to shrink the ' + (heating ? 'heating' : 'cooling') + ' equipment</h2>' +
      seg('tzLoad', [['cooling', 'Cooling'], ['heating', 'Heating']], S.tzLoad) + '</div>';
    var unit = heating ? uH() : uC(), dp = heating || !isIP() ? 0 : 1;
    var conv = heating ? sc0.gfa_m2 / 1000 * (isIP() ? C.MBH_PER_KW : 1) * sc0.heating_sizing_factor
      : sc0.gfa_m2 / 1000 / (isIP() ? C.KW_PER_TON : 1) * sc0.cooling_sizing_factor;
    var rows = sweepRanges(sc0, def), notes = '', source, basePeak = null;
    if (ep) {
      var b0 = govFromTotals(ep.base, heating);
      basePeak = b0 / sc0.gfa_m2 * conv;
      rows = rows.filter(function (r) { return ep.runs[r.key]; }).map(function (r) {
        var x = ep.runs[r.key];
        return {key: r.key, lo: r.lo, hi: r.hi, dl: (govFromTotals(x.lo, heating) - b0) / sc0.gfa_m2 * conv,
          dh: (govFromTotals(x.hi, heating) - b0) / sc0.gfa_m2 * conv};
      });
      source = '<span class="badge ep">EnergyPlus sweep</span>';
    } else if (m) {
      var res = C.surrogateResult(m, sc0);
      if (res.incompatible) return head + '<p class="sub">The trained model is from an older version of the tool; refit it.</p></section>';
      var g = governed(res, sc0), out = (heating ? g.hKey : g.cKey) + '|total_w_m2';
      if (!m.outputs[out]) return head + '</section>';
      var failed = C.failedTest(m, S.type);
      if (failed) {
        notes += '<div class="note warn">The model for this type and station missed the accuracy limit (' + fmt(failed.worst, 1) +
          '%), so these bars are indicative: the direction and ranking are a guide, the sizes are not. Run the exact sweep below for EnergyPlus figures.</div>';
      }
      if (res.fixedDiffs.length) {
        notes += '<div class="note warn">You have changed inputs the model held fixed (' + res.fixedDiffs.map(function (d) { return esc(d.input); }).join(', ') +
          '); the bars are for the trained values of those inputs. Run the exact sweep below for EnergyPlus figures.</div>';
      }
      var base = C.predict(m, sc0).perM2[out];
      basePeak = base * conv;
      rows = rows.map(function (r) {
        var at = function (v) { return (C.predict(m, sweepScenario(sc0, def, r.key, v)).perM2[out] - base) * conv; };
        return {key: r.key, lo: r.lo, hi: r.hi, dl: at(r.lo), dh: at(r.hi)};
      });
      source = '<span class="badge sur">' + (failed ? 'Indicative estimate' : 'Instant estimate') + '</span>';
    } else {
      if (mk && SUR_INDEX[mk]) { loadModel(mk); return head + '<p class="sub">Loading the trained model…</p></section>'; }
      rows = [];
    }
    var nRuns = 1 + 2 * sweepRanges(sc0, def).length;
    var sweepBtn = '<div class="actions"><button class="btn" type="button" id="b-epsens"' + (engineOn && !S.epSensRunning ? '' : ' disabled') + '>' +
      (S.epSensRunning ? 'Running EnergyPlus sweep… ' + S.epSensRunning.done + ' of ' + S.epSensRunning.total :
        (ep ? 'Re-run exact sweep' : 'Run exact sweep in EnergyPlus (' + nRuns + ' runs)')) + '</button></div>' +
      (S.epSensError ? '<div class="note bad">' + esc(S.epSensError) + '</div>' : '') +
      (!engineOn ? '<p class="sub" style="margin-top:6px">' + esc((S.engine && S.engine.reason) || 'EnergyPlus cannot run in this browser.') + '</p>' : '');
    if (!rows.length) {
      return head + '<p class="sub">No trained model for this building type and station, so there is no instant sensitivity. ' +
        'Run the exact sweep to get it from EnergyPlus.</p>' + sweepBtn + '</section>';
    }
    rows.forEach(function (r) { r.span = Math.abs(r.dh - r.dl); });
    // Inputs with no effect (e.g. lighting on the heating design day) are left out.
    var small = heating ? 0.5 : 0.05;
    rows = rows.filter(function (r) { return r.span >= small; }).sort(function (a, b) { return b.span - a.span; }).slice(0, 10);
    var mx = Math.max.apply(null, rows.map(function (r) { return Math.max(Math.abs(r.dl), Math.abs(r.dh)); })) || 1;
    var load = heating ? 'heating' : 'cooling';
    // Plain view: for each input, the end of its range that lowers the peak,
    // phrased as an action, ranked by how much it saves.
    var opps = [];
    rows.forEach(function (r) {
      var best = r.dl <= r.dh ? {v: r.lo, d: r.dl} : {v: r.hi, d: r.dh};
      if (best.d < -(heating ? 0.5 : 0.05)) opps.push({key: r.key, v: best.v, d: best.d});
    });
    opps.sort(function (a, b) { return a.d - b.d; });
    opps = opps.slice(0, 8);
    var omx = opps.length ? -opps[0].d : 1;
    var h = head + '<p class="sub">' + source + ' Each change tried on its own, with everything else as you set it. ' +
      'Combine several with the goal planner below.</p>' + notes;
    if (!opps.length) h += '<p class="sub">None of the design inputs lowers this peak within its realistic range.</p>';
    h += '<ol class="ranked">';
    opps.forEach(function (o, i) {
      var pc = basePeak ? -o.d / basePeak * 100 : null;
      h += '<li><span class="rk">' + (i + 1) + '</span><div class="rk-text"><b>' + plainAction(o.key, o.v, heating) + '</b>' +
        '<span class="rk-hint">' + esc(SWEEP_LABELS[o.key]) + ': ' + sweepValue(o.key, leverValueNow(o.key)) + ' → ' + sweepValue(o.key, o.v) + '</span></div>' +
        '<div class="rk-bar"><span class="' + load + '" style="width:' + (-o.d / omx * 100) + '%"></span></div>' +
        '<div class="rk-val"><b>' + (pc != null ? '−' + fmt(pc, 0) + '%' : '') + '</b><span>−' + fmt(-o.d, dp) + ' ' + unit + '</span></div>' +
        '<a class="rk-try" href="#inputs" data-scroll="q-' + (o.key === 'oa_multiplier' ? (ventMethod() === 'ach' ? 'oa_ach' : 'oa_per_person_ls') : o.key) + '">Try this</a></li>';
    });
    h += '</ol>' + (heating ? '<p class="sub">No sun and nobody inside on the coldest morning, so people, lighting, equipment and sun ' +
      'cannot lower the heating peak.</p>' : '');
    // Technical view: both ends of every range, as before.
    h += '<details class="tech"' + (S.techView ? ' open' : '') + ' id="tech-view"><summary>Technical view: both ends of each input\'s range</summary>' +
      '<p class="sub"><span class="good">Green</span>: peak goes down; <span class="bad">red</span>: it goes up.</p><div class="tz">';
    rows.forEach(function (r) {
      function bar(d) {
        var w = Math.abs(d) / mx * 50, left = d < 0 ? 50 - w : 50;
        return '<div class="bar ' + (d < 0 ? 'neg' : 'pos') + '" style="left:' + left + '%;width:' + w + '%"></div>';
      }
      function effect(v, d) {
        var cls = d < 0 ? 'good' : (d > 0 ? 'bad' : '');
        return 'At ' + sweepValue(r.key, v) + ': <b class="' + cls + '">' + (d > 0 ? '+' : (d < 0 ? '−' : '')) +
          fmt(Math.abs(d), dp) + ' ' + unit + '</b>';
      }
      var now = sweepNow(r.key);
      h += '<div class="tz-row"><div class="tz-name">' + esc(SWEEP_LABELS[r.key]) +
        (now !== null ? ' <span class="tz-now">now ' + now + '</span>' : '') + '</div>' +
        '<div class="bar-wrap"><div class="axis"></div>' + bar(r.dl) + bar(r.dh) + '</div>' +
        '<div class="tz-meta">' + effect(r.lo, r.dl) + ' &nbsp;·&nbsp; ' + effect(r.hi, r.dh) + '</div></div>';
    });
    return h + '</div></details>' + (ep ? '' : sweepBtn) + '</section>';
  }

  // One sweep result as something a design team can act on.
  function plainAction(key, v, heating) {
    var now = leverValueNow(key), up = v > now, sv = sweepValue(key, v);
    var A = {
      wwr: up ? 'Increase window area to ' + sv + ' of the wall' : 'Reduce window area to ' + sv + ' of the wall',
      shgc: up ? 'Use higher solar-gain glass (SHGC ' + sv + ')' : 'Use lower solar-gain glass (SHGC ' + sv + ')',
      win_u: up ? 'Use less insulating windows (' + sv + ')' : 'Use better-insulated windows (' + sv + ')',
      wall_u: up ? 'Use less wall insulation (' + sv + ')' : 'Insulate walls better (' + sv + ')',
      roof_u: up ? 'Use less roof insulation (' + sv + ')' : 'Insulate the roof better (' + sv + ')',
      overhang_pf: up ? 'Add window shading overhangs (projection factor ' + sv + ')' : 'Remove shading overhangs',
      lpd_w_m2: up ? 'Raise lighting power to ' + sv : 'Lower lighting power to ' + sv,
      epd_w_m2: up ? 'Raise equipment power to ' + sv : 'Lower equipment power to ' + sv + ' <span class="tag">depends on use</span>',
      m2_per_person: up ? 'Fewer people: ' + sv + ' <span class="tag">depends on use</span>' : 'More people: ' + sv,
      oa_multiplier: up ? 'Increase outdoor air to ' + sv : 'Reduce outdoor air to ' + sv + (v < 1 ? ' <span class="tag">below code rate</span>' : ''),
      oa_ach: up ? 'Increase outdoor air to ' + sv : 'Reduce outdoor air to ' + sv + (v < S.defaults.oa_ach ? ' <span class="tag">below the type default</span>' : ''),
      erv_sensible_eff: up ? 'Add heat recovery (sensible, ' + sv + ' effective)' : 'Less heat recovery (' + sv + ')',
      erv_latent_eff: up ? 'Add heat and moisture recovery (latent, ' + sv + ' effective)' : 'Less moisture recovery (' + sv + ')',
      infiltration_ach: up ? 'Leakier envelope (' + sv + ')' : 'Tighter, less leaky envelope (' + sv + ')',
      t_cool_c: up ? 'Raise the cooling setpoint to ' + sv : 'Lower the cooling setpoint to ' + sv,
      t_heat_c: up ? 'Raise the heating setpoint to ' + sv : 'Lower the heating setpoint to ' + sv,
      n_floors: 'Stack the same floor area on ' + sv,
      aspect_ratio: (up ? 'Make the plan longer and narrower' : 'Make the plan more compact') + ' (' + fmt(v, 1) + ' : 1)',
      north_axis_deg: 'Rotate the building to ' + sv
    };
    return A[key] || esc(SWEEP_LABELS[key]) + ' → ' + sv;
  }

  // Exact sensitivity: the base scenario plus each input at its low and high
  // value, run through EnergyPlus two at a time (the server's limit).
  function runEpSweep() {
    var sc0 = JSON.parse(JSON.stringify(S.sc)), def = S.defaults, hash = scenarioHash(sc0);
    var jobs = [{key: null, sc: sc0}];
    sweepRanges(sc0, def).forEach(function (r) {
      jobs.push({key: r.key, side: 'lo', sc: sweepScenario(sc0, def, r.key, r.lo)});
      jobs.push({key: r.key, side: 'hi', sc: sweepScenario(sc0, def, r.key, r.hi)});
    });
    var out = {hash: hash, base: null, runs: {}, done: false}, next = 0, active = 0, failed = null;
    S.epSens = out; S.epSensError = null; S.epSensRunning = {done: 0, total: jobs.length}; render();
    function totals(run) {
      var t = {};
      Object.keys(run.design_days).forEach(function (k) { t[k] = run.design_days[k].block.total_w; });
      return t;
    }
    function launch() {
      while (active < window.EPBrowser.maxParallel && next < jobs.length && !failed) {
        (function (job) {
          active++;
          var body = engineInput(job.sc);
          engineRun(body)
            .then(function (run) {
              var x = {run: run};
              active--;
              if (!x.run.ok) failed = x.run.error || 'EnergyPlus run failed';
              else if (job.key === null) out.base = totals(x.run);
              else (out.runs[job.key] = out.runs[job.key] || {})[job.side] = totals(x.run);
              S.epSensRunning.done++;
              finish();
            })
            .catch(function (e) { active--; failed = 'EnergyPlus could not start in this browser: ' + e.message; finish(); });
        })(jobs[next++]);
      }
    }
    function finish() {
      if (failed && active === 0) { S.epSensRunning = null; S.epSensError = 'Sweep stopped: ' + failed; S.epSens = null; render(); return; }
      if (next >= jobs.length && active === 0) {
        Object.keys(out.runs).forEach(function (k) { if (!out.runs[k].lo || !out.runs[k].hi) delete out.runs[k]; });
        out.done = true; S.epSensRunning = null; render(); return;
      }
      render(); launch();
    }
    launch();
  }

  // ── Summary: reach a target (optimizer) ─────────────────────────────────
  // Searches the trained model for lever settings that cut the selected peaks
  // by the user's target (web/core.js optimize). Ranges default to the trained
  // design space and can only be narrowed, so every option stays inside it.
  function leverValueNow(key) {
    var sc = S.sc, def = S.defaults;
    if (key === 'oa_multiplier') {
      if (def.oa_per_person_ls > 0) return sc.oa_per_person_ls / def.oa_per_person_ls;
      if (def.oa_per_area_ls_m2 > 0) return sc.oa_per_area_ls_m2 / def.oa_per_area_ls_m2;
      return 1;
    }
    return sc[key];
  }

  // Program inputs (set by the client's use, not the design) start switched
  // off; outdoor air can't go below the code rate (the type's default) unless
  // the user lowers that limit.
  var PROGRAM_LEVERS = ['epd_w_m2', 'm2_per_person'];
  function codeFloor(key) {
    if (key === 'oa_multiplier') return 1;
    if (key === 'oa_ach') return S.defaults.oa_ach;
    return null;
  }

  // Lever bounds and costs are stored in SI; shown in the selected units.
  function leverDisp(key, v) {
    var u = unitOf(key);
    return isIP() && UNITS[u] ? +toIP(u, v).toFixed(UNITS[u].dp + 1) : +(+v).toFixed(3);
  }
  function leverStep(key) {
    var st = null;
    GROUPS.forEach(function (g) { g.fields.forEach(function (f) { if (f[0] === key) st = f[3]; }); });
    if (key === 'oa_multiplier') st = 0.05;
    return dispStep(unitOf(key), st || 0.01);
  }
  function leverFromDisp(key, v) {
    var u = unitOf(key), x = parseFloat(v);
    if (v === '' || isNaN(x)) return v;
    return isIP() && UNITS[u] ? fromIP(u, x) : x;
  }
  function leverCostDisp(key, c) {
    var u = UNITS[unitOf(key)], x = parseFloat(c);
    if (c === '' || c === undefined || isNaN(x)) return '';
    return isIP() && u ? +(x / u.k).toFixed(2) : x;
  }

  function optLevers() {
    var o = S.opt;
    return sweepRanges(S.sc, S.defaults).map(function (r) {
      var cfg = o.levers[r.key] || {}, v0 = leverValueNow(r.key), floor = codeFloor(r.key);
      var lo = cfg.lo !== undefined && cfg.lo !== '' ? Math.max(r.lo, +cfg.lo) : (floor != null ? Math.max(r.lo, floor) : r.lo);
      var hi = cfg.hi !== undefined && cfg.hi !== '' ? Math.min(r.hi, +cfg.hi) : r.hi;
      return {key: r.key, v0: v0, lo: Math.min(lo, v0), hi: Math.max(hi, v0), trainedLo: r.lo, trainedHi: r.hi,
        int: !!(D.fields[r.key] || {}).int, on: cfg.on !== undefined ? cfg.on : PROGRAM_LEVERS.indexOf(r.key) < 0, cost: parseFloat(cfg.cost) > 0 ? parseFloat(cfg.cost) : 0};
    });
  }

  function runOptimizer() {
    var mk = modelKeyFor(S.type, S.station), m = mk && SUR[mk], o = S.opt;
    var tc = parseFloat(o.clg), th = parseFloat(o.htg);
    if (!(tc > 0)) tc = NaN;
    if (!(th > 0)) th = NaN;
    if (!m || (isNaN(tc) && isNaN(th))) return;
    var sc0 = S.sc, def = S.defaults, gfa = sc0.gfa_m2;
    var names = ['clg_db_' + S.coolPct + '|total_w_m2', 'clg_dp_' + S.coolPct + '|total_w_m2', 'htg_' + S.heatPct + '|total_w_m2'];
    var levers = optLevers().filter(function (l) { return l.on && l.hi > l.lo; });
    function evaluate(vals) {
      var sc = sc0;
      Object.keys(vals).forEach(function (k) { if (vals[k] !== leverValueNow(k)) sc = sweepScenario(sc, def, k, vals[k]); });
      var p = C.predictSome(m, sc, names);
      return {clg: Math.max(p[names[0]], p[names[1]]) * gfa * sc0.cooling_sizing_factor, htg: p[names[2]] * gfa * sc0.heating_sizing_factor};
    }
    var r = C.optimize(levers, evaluate, {clg: isNaN(tc) ? null : tc / 100, htg: isNaN(th) ? null : th / 100});
    o.result = {hash: scenarioHash(sc0) + '|' + S.coolPct + '|' + S.heatPct, r: r, levers: levers, failed: C.failedTest(m, S.type)};
  }

  function optimizerCard(g) {
    var mk = modelKeyFor(S.type, S.station), m = mk && SUR[mk], o = S.opt;
    var h = '<section class="card r-card" id="planner"><h2>Set a goal and let the tool find a way there</h2>' +
      '<p class="sub">Say how much smaller you want the equipment, and the tool searches the trained model for a plan of design changes that gets there.</p>';
    if (!m) return h + '<p class="sub">Needs a trained model for this building type and location.</p></section>';
    h += '<div class="goals"><label class="goal cool"><span>' + SNOW + 'Make cooling smaller by</span><span class="goal-in"><input id="f-opt-clg" type="number" min="0" max="90" step="1" value="' +
      esc(o.clg) + '" inputmode="numeric"> %</span></label><label class="goal heat"><span>' + FLAME + 'Make heating smaller by</span><span class="goal-in"><input id="f-opt-htg" type="number" min="0" max="90" step="1" value="' +
      esc(o.htg) + '" inputmode="numeric"> %</span></label><button class="btn" type="button" id="b-opt">Find a plan</button></div>' +
      '<p class="sub">Leave a box empty or at 0 for no goal on that load.</p>';
    var levers = optLevers();
    var eng = '<details class="tech" id="opt-levers"' + (o.showLevers ? ' open' : '') + '><summary>For engineers: levers and ranges (' +
      levers.filter(function (l) { return l.on; }).length + ' of ' + levers.length + ' allowed)</summary>' +
      '<div class="scroll-x"><table class="t"><thead><tr><th>Allow</th><th>Lever</th><th>Now</th><th>Lowest</th><th>Highest</th><th>Cost per unit ($, optional)</th></tr></thead><tbody>';
    levers.forEach(function (l) {
      eng += '<tr><td><input type="checkbox" data-opt-on="' + l.key + '"' + (l.on ? ' checked' : '') + ' aria-label="Allow ' + esc(SWEEP_LABELS[l.key]) + '"></td><td>' + esc(SWEEP_LABELS[l.key]) + '</td>' +
        '<td class="num">' + sweepValue(l.key, l.v0) + '</td>' +
        '<td><input class="opt-num" type="number" step="' + leverStep(l.key) + '" data-opt-lo="' + l.key + '" value="' + esc(leverDisp(l.key, l.lo)) + '" aria-label="Lowest ' + esc(SWEEP_LABELS[l.key]) + '" title="Trained range starts at ' + esc(leverDisp(l.key, l.trainedLo)) + '"></td>' +
        '<td><input class="opt-num" type="number" step="' + leverStep(l.key) + '" data-opt-hi="' + l.key + '" value="' + esc(leverDisp(l.key, l.hi)) + '" aria-label="Highest ' + esc(SWEEP_LABELS[l.key]) + '" title="Trained range ends at ' + esc(leverDisp(l.key, l.trainedHi)) + '"></td>' +
        '<td><input class="opt-num" type="number" min="0" step="any" data-opt-cost="' + l.key + '" value="' + esc(leverCostDisp(l.key, (o.levers[l.key] || {}).cost)) + '" aria-label="Cost per unit for ' + esc(SWEEP_LABELS[l.key]) + '"></td></tr>';
    });
    eng += '</tbody></table></div><p class="sub">Equipment power and occupant density start switched off (they follow ' +
      'the client\'s use, not the design). Outdoor air starts at the code rate as its lowest value. Values are in the selected units (WWR and heat recovery as fractions). ' +
      'Cost is your $ for the whole building per unit change of that input; used only for the lowest-cost plan. "Smallest overall change" counts each move as the share ' +
      'it uses of that input\'s room, from its current value to the end of its range.</p>';
    var res = o.result, key = scenarioHash(S.sc) + '|' + S.coolPct + '|' + S.heatPct;
    if (!res) return h + eng + '</details></section>';
    if (res.hash !== key) return h + '<div class="note info">Your answers have changed since the last search. Find a plan again.</div>' + eng + '</details></section>';
    var r = res.r, b = r.baseline, wantC = r.goal.clg != null, wantH = r.goal.htg != null;
    if (res.failed) h += '<div class="note warn">The trained model for this type and location missed the accuracy limit, so this plan is indicative. Check it in EnergyPlus.</div>';
    var plans = r.feasible ? [['fewest', 'Fewest changes', r.fewest], ['smallest', 'Smallest overall change', r.smallest], ['cheapest', 'Lowest cost', r.cheapest]]
      .filter(function (x) { return x[2]; }) : [['best', 'Best possible', r.bestAchievable]];
    var pick = plans.filter(function (x) { return x[0] === S.planPick; })[0] || plans[0];
    if (plans.length > 1) h += '<div class="plan-pick">' + seg('planPick', plans.map(function (x) { return [x[0], x[1]]; }), pick[0]) + '</div>';
    var d = r.describe(pick[2]);
    o.picks = o.picks || {}; o.picks[pick[1]] = d.values;
    var gotC = (b.clg - d.result.clg) / b.clg * 100, gotH = (b.htg - d.result.htg) / b.htg * 100;
    var okC = !wantC || gotC >= (b.clg - r.goal.clg) / b.clg * 100 - 0.05, okH = !wantH || gotH >= (b.htg - r.goal.htg) / b.htg * 100 - 0.05;
    var status = wantC && wantH ? (okC && okH ? 'Both goals reached' : okC ? 'Cooling reached · heating not reachable with these levers' :
      okH ? 'Heating reached · cooling not reachable with these levers' : 'Neither goal reachable with these levers')
      : (okC && okH ? 'Goal reached' : 'Goal not reachable with these levers: this is the most they can do');
    h += '<div class="plan"><div class="plan-status ' + (okC && okH ? 'ok' : 'no') + '">' + (okC && okH ? '✓ ' : '! ') + esc(status) + '</div>' +
      '<h3>Suggested plan</h3><ul class="checklist">';
    d.moved.forEach(function (mv) {
      h += '<li><span class="tick" aria-hidden="true">✓</span><div><b>' + plainAction(mv.key, mv.to, !wantC) + '</b><span class="rk-hint">' +
        esc(SWEEP_LABELS[mv.key]) + ': ' + sweepValue(mv.key, mv.from) + ' → ' + sweepValue(mv.key, mv.to) + '</span></div>' +
        '<span class="eff cool">' + SNOW + (mv.saves.clg >= 0 ? '−' : '+') + fmt(Math.abs(capC(mv.saves.clg)), isIP() ? 1 : 0) + ' ' + uC() + '</span>' +
        '<span class="eff heat">' + FLAME + (mv.saves.htg >= 0 ? '−' : '+') + fmt(Math.abs(capH(mv.saves.htg)), 0) + ' ' + uH() + '</span></li>';
    });
    h += '</ul>';
    function prog(kind, got, want) {
      var goal = want, w = Math.max(0, Math.min(100, got / 60 * 100)), gm = goal != null ? Math.min(100, goal / 60 * 100) : null;
      return '<div class="prog ' + kind + '"><div class="prog-l">' + (kind === 'cool' ? SNOW + 'Cooling' : FLAME + 'Heating') +
        '<b>' + (got >= 0 ? '−' : '+') + fmt(Math.abs(got), 1) + '%</b>' + (goal != null ? '<span>goal −' + fmt(goal, 0) + '%</span>' : '<span>no goal</span>') + '</div>' +
        '<div class="prog-track" role="img" aria-label="' + kind + ' reduced ' + fmt(got, 1) + '%' + (goal != null ? ' of a ' + fmt(goal, 0) + '% goal' : '') + '">' +
        '<span class="prog-fill" style="width:' + w + '%"></span>' + (gm != null ? '<span class="prog-goal" style="left:' + gm + '%"></span>' : '') + '</div></div>';
    }
    h += prog('cool', gotC, wantC ? (b.clg - r.goal.clg) / b.clg * 100 : null) + prog('heat', gotH, wantH ? (b.htg - r.goal.htg) / b.htg * 100 : null);
    var ct = parseFloat(S.rates.cooling[S.plant.cooling]), cm = parseFloat(S.rates.heating[S.plant.heating]);
    if (!isNaN(ct) || !isNaN(cm)) {
      var save = (isNaN(ct) ? 0 : (tons(b.clg) - tons(d.result.clg)) * ct) + (isNaN(cm) ? 0 : (mbh(b.htg) - mbh(d.result.htg)) * cm);
      h += '<p class="plan-cost">Equipment cost ' + (save >= 0 ? '−$' : '+$') + fmt(Math.abs(save), 0) + ' at your rates' + (d.cost ? ' · your lever cost $' + fmt(d.cost, 0) : '') + '</p>';
    }
    h += '<div class="actions"><button class="btn" type="button" data-opt-apply-run="' + esc(pick[1]) + '">Check this plan in EnergyPlus · 1 run</button>' +
      '<button class="btn" type="button" data-opt-apply="' + esc(pick[1]) + '">Apply plan to my answers</button></div></div>';
    // For engineers: the best result with 1, 2, 3 … changes.
    var prevPc = null, met = false, byH = !wantC;
    eng += '<h3>How far you can get by changing 1, 2, 3 … things</h3><ol class="opt-count">';
    r.byCount.forEach(function (c) {
      var dd = r.describe(c.pt), pcC = (b.clg - dd.result.clg) / b.clg * 100, pcH = (b.htg - dd.result.htg) / b.htg * 100, pc = byH ? pcH : pcC;
      if (met) return;
      if (prevPc != null && pc < prevPc + 0.5 && c.pt.s > 0) return;
      met = c.pt.s <= 0; prevPc = pc;
      eng += '<li><div class="oc-n">' + c.levers + ' change' + (c.levers > 1 ? 's' : '') + '</div><div class="oc-what">' +
        dd.moved.map(function (mv) { return esc(SWEEP_LABELS[mv.key]) + ' ' + sweepValue(mv.key, mv.from) + ' → ' + sweepValue(mv.key, mv.to); }).join('; ') +
        '</div><div class="oc-res num">' + (byH ? 'Heating −' + fmt(pcH, 1) + '%' : 'Cooling −' + fmt(pcC, 1) + '%') +
        (c.pt.s <= 0 ? ' · meets goal' : '') + '</div></li>';
    });
    eng += '</ol>';
    return h + eng + '</details></section>';
  }

  // Display a swept input value in everyday units.
  function sweepValue(key, v) {
    if (key === 'wwr') return fmt(v * 100, 0) + '%';
    if (key === 'erv_sensible_eff' || key === 'erv_latent_eff') return fmt(v * 100, 0) + '%';
    if (key === 'overhang_pf') return fmt(v, 2);
    if (key === 'oa_multiplier') return fmt(v, 2) + '× code rate';
    if (key === 'oa_ach') return fmt(v, 1) + ' ACH';
    if (key === 'infiltration_ach') return fmt(v, 2) + ' ACH';
    if (key === 'lpd_w_m2' || key === 'epd_w_m2') return isIP() ? fmt(toIP('W/m2', v), 2) + ' W/ft²' : fmt(v, 1) + ' W/m²';
    if (key === 't_cool_c' || key === 't_heat_c') return temp(v, 1);
    if (key === 'm2_per_person') return isIP() ? fmt(toIP('m2/person', v), 0) + ' ft²/person' : fmt(v, 1) + ' m²/person';
    if (key === 'n_floors') return fmt(v, 0) + ' floors';
    if (key === 'north_axis_deg') return fmt(v, 0) + '°';
    if (key === 'wall_u' || key === 'roof_u' || key === 'win_u') return isIP() ? 'U-' + fmt(toIP('W/m2-K', v), 3) : 'U-' + fmt(v, 2);
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

  // ── Summary: plant cost ─────────────────────────────────────────────────
  function costCard(g, b) {
    var ct = parseFloat(S.rates.cooling[S.plant.cooling]), cm = parseFloat(S.rates.heating[S.plant.heating]);
    var t = tons(g.clg), m = mbh(g.htg);
    var h = '<section class="card r-card"><h2>What might the equipment cost?</h2><p class="sub">Equipment size × your own installed-cost rate. ' +
      'The tool has no built-in cost data. Sizing factors included.</p><div class="cost-in">' + plantHtml() + '</div>';
    if (isNaN(ct) && isNaN(cm)) {
      return h + '<p class="sub">Enter a rate above to see the cost.</p></section>';
    }
    function cell(label, cap, capUnit, rate, rateUnit, bcap, dcap, drate) {
      if (isNaN(rate)) return '<div class="kpi"><div class="kpi-label">' + esc(label) + '</div><div class="kpi-sec">No rate entered</div></div>';
      var cost = cap * rate, bcost = bcap != null ? bcap * rate : null;
      return '<div class="kpi"><div class="kpi-label">' + esc(label) + '</div><div class="kpi-value">$' + fmt(cost, 0) + '</div>' +
        '<div class="kpi-sec">' + fmt(dcap, capUnit === 'tons' ? 1 : 0) + ' ' + capUnit + ' × $' + fmt(drate, isIP() ? 0 : 2) + rateUnit + '</div>' +
        deltaHtml(cost, bcost, function (v) { return '$' + fmt(v, 0); }) + '</div>';
    }
    var tot = (isNaN(ct) ? 0 : t * ct) + (isNaN(cm) ? 0 : m * cm);
    var btot = b ? (isNaN(ct) ? 0 : tons(b.clg) * ct) + (isNaN(cm) ? 0 : mbh(b.htg) * cm) : null;
    h += '<div class="kpis">' + cell('Cooling · ' + S.plant.cooling, t, uC(), ct, isIP() ? '/ton' : '/kW', b && tons(b.clg), capC(g.clg), rateToDisp('cooling', ct)) +
      cell('Heating · ' + S.plant.heating, m, uH(), cm, isIP() ? '/MBH' : '/kW', b && mbh(b.htg), capH(g.htg), rateToDisp('heating', cm)) +
      '<div class="kpi"><div class="kpi-label">Total plant</div><div class="kpi-value">$' + fmt(tot, 0) + '</div>' +
      deltaHtml(tot, btot, function (v) { return '$' + fmt(v, 0); }) + '</div></div>';
    h += '<p class="sub" style="margin:8px 0 0">Linear $/capacity only. Real equipment comes in discrete sizes and redundancy (N+1) steps, ' +
      'so check a change against the next size up or down before banking it.</p></section>';
    return h;
  }

  // ── Summary: annual energy and carbon ───────────────────────────────────
  var KWH_PER_THERM = 29.3071;          // 100,000 Btu
  var KBTU_PER_KWH = 3.412142;
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Monthly end uses from an annual run, converted with the user's factors.
  // Anything the user hasn't entered stays null and is shown as missing.
  function annualFigures(a) {
    var E = S.energy, num = function (v) { v = parseFloat(v); return isNaN(v) || v <= 0 ? null : v; };
    var cop = num(E.cop), eff = num(E.heatEff), sfp = num(E.sfp), efE = num(E.efElec), efG = num(E.efGas);
    var m = MONTHS.map(function (_, i) {
      var fan = sfp != null ? sfp * a.supply_air_m3s[i] * a.hours[i] : null;     // W per L/s x m3/s x h = kWh
      var heatElec = E.heatSource === 'electric' ? a.heating_kwh[i] : (E.heatSource === 'heatpump' && eff ? a.heating_kwh[i] / eff : null);
      var gas = E.heatSource === 'gas' && eff ? a.heating_kwh[i] / eff : 0;
      return {cooling_th: a.cooling_kwh[i], heating_th: a.heating_kwh[i], lighting: a.lighting_kwh[i], equipment: a.equipment_kwh[i],
        fan: fan, cooling_el: cop ? a.cooling_kwh[i] / cop : null, heating_el: E.heatSource === 'gas' ? 0 : heatElec,
        gas_kwh: E.heatSource === 'gas' ? (eff ? gas : null) : 0};
    });
    function sum(k) {
      var t = 0;
      for (var i = 0; i < 12; i++) { if (m[i][k] == null) return null; t += m[i][k]; }
      return t;
    }
    var t = {cooling_th: sum('cooling_th'), heating_th: sum('heating_th'), lighting: sum('lighting'), equipment: sum('equipment'),
      fan: sum('fan'), cooling_el: sum('cooling_el'), heating_el: sum('heating_el'), gas_kwh: sum('gas_kwh')};
    var parts = [t.cooling_el, t.heating_el, t.lighting, t.equipment, t.fan];
    t.elec = parts.some(function (v) { return v == null; }) ? null : parts.reduce(function (x, y) { return x + y; }, 0);
    t.therms = t.gas_kwh == null ? null : t.gas_kwh / KWH_PER_THERM;
    t.co2 = (t.elec == null || efE == null || (t.therms > 0 && efG == null)) ? null : t.elec * efE + (t.therms || 0) * (efG || 0);
    t.missing = [];
    if (cop == null) t.missing.push('cooling COP');
    if (E.heatSource !== 'electric' && eff == null) t.missing.push(E.heatSource === 'gas' ? 'boiler efficiency' : 'heat pump COP');
    if (sfp == null) t.missing.push('fan power');
    if (efE == null) t.missing.push('electricity carbon factor');
    if (E.heatSource === 'gas' && efG == null) t.missing.push('gas carbon factor');
    return {months: m, total: t};
  }

  function stackedBars(months, series, unit) {
    var W = 640, H = 230, left = 52, right = 12, top = 16, bottom = 40;
    var totals = months.map(function (mo) { return series.reduce(function (s0, sr) { return s0 + Math.max(0, mo[sr.key] || 0); }, 0); });
    var mx = Math.max.apply(null, totals.concat([1e-9]));
    var step = Math.pow(10, Math.floor(Math.log(mx) / Math.LN10)), tick = step, nice = [1, 2, 2.5, 5, 10];
    for (var i = 0; i < nice.length; i++) { tick = nice[i] * step; if (mx * 1.08 / tick <= 5) break; }
    var yMax = Math.ceil(mx * 1.08 / tick) * tick, Y = function (v) { return top + (1 - v / yMax) * (H - top - bottom); };
    var bw = (W - left - right) / 12, out = '';
    for (var tt = 0; tt <= yMax + 1e-9; tt += tick) {
      out += '<line x1="' + left + '" x2="' + (W - right) + '" y1="' + Y(tt) + '" y2="' + Y(tt) + '" class="grid"/>' +
        '<text x="' + (left - 6) + '" y="' + (Y(tt) + 3.5) + '" text-anchor="end">' + fmt(tt / 1000, tt % 1000 ? 1 : 0) + '</text>';
    }
    months.forEach(function (mo, mi) {
      var y0 = Y(0), x = left + mi * bw + bw * 0.18;
      series.forEach(function (sr) {
        var v = Math.max(0, mo[sr.key] || 0), hgt = Y(0) - Y(v);
        if (hgt <= 0) return;
        out += '<rect x="' + x + '" y="' + (y0 - hgt) + '" width="' + bw * 0.64 + '" height="' + hgt + '" fill="' + sr.color + '"><title>' +
          esc(MONTHS[mi] + ' · ' + sr.label + ': ' + fmt(v, 0) + ' kWh') + '</title></rect>';
        y0 -= hgt;
      });
      out += '<text x="' + (x + bw * 0.32) + '" y="' + (H - bottom + 14) + '" text-anchor="middle">' + MONTHS[mi] + '</text>';
    });
    out += '<line x1="' + left + '" x2="' + (W - right) + '" y1="' + Y(0) + '" y2="' + Y(0) + '" class="axis"/>';
    var legend = '<div class="legend">' + series.map(function (sr) {
      return '<span><i style="background:' + sr.color + '"></i>' + esc(sr.label) + '</span>';
    }).join('') + '</div>';
    return '<div class="chart bars"><svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Monthly energy by end use">' +
      '<text x="' + left + '" y="10" class="title">' + esc(unit) + '</text>' + out + '</svg></div>' + legend;
  }

  function annualCard() {
    var engineOn = S.engine && S.engine.available, hash = scenarioHash(S.sc);
    var h = '<div class="card"><div class="card-head"><div><h2>Annual energy and carbon</h2><p class="sub">A full-year EnergyPlus run on ' +
      'the station\'s typical-year (TMY3) weather: heating, cooling, fans, lighting and equipment. Not included: hot water, ' +
      'elevators, process loads.</p></div></div>';
    var run = S.annual && S.annual.hash === hash ? S.annual.run : null;
    if (!run) {
      if (S.annual) h += '<div class="note info">Inputs have changed since the last annual run.</div>';
      if (S.annualError) h += '<div class="note bad">' + esc(S.annualError) + '</div>';
      h += '<div class="actions"><button class="btn primary" type="button" id="b-annual"' + (engineOn && !S.annualRunning ? '' : ' disabled') + '>' +
        (S.annualRunning ? esc(S.engineMsg || 'Running a full year in EnergyPlus…') : 'Run annual energy') + '</button></div>' +
        '<p class="sub" style="margin-top:8px">' + (engineOn ? 'Runs EnergyPlus in this browser; a full year takes a few minutes.' :
          esc((S.engine && S.engine.reason) || 'EnergyPlus cannot run in this browser.')) + '</p></div>';
      return h;
    }
    var f = annualFigures(run.annual), t = f.total, ft2 = S.sc.gfa_m2 * C.FT2_PER_M2;
    var site = (t.elec != null && t.gas_kwh != null) ? (t.elec + t.gas_kwh) * KBTU_PER_KWH / ft2 : null;
    h += '<div class="kpis">' +
      '<div class="kpi"><div class="kpi-label">Electricity</div><div class="kpi-value">' + (t.elec != null ? fmt(t.elec / 1000, 0) : '–') + '<span class="kpi-unit">MWh/yr</span></div>' +
        '<div class="kpi-sec">' + (t.elec != null ? (isIP() ? fmt(t.elec / ft2, 1) + ' kWh/ft²' : fmt(t.elec / S.sc.gfa_m2, 0) + ' kWh/m²') : 'needs ' + esc(t.missing.filter(function (x) { return x.indexOf('carbon') < 0; }).join(', '))) + '</div></div>' +
      (S.energy.heatSource === 'gas' ? '<div class="kpi"><div class="kpi-label">Gas</div><div class="kpi-value">' +
        (t.therms != null ? (isIP() ? fmt(t.therms, 0) : fmt(t.gas_kwh / 1000, 0)) : '–') +
        '<span class="kpi-unit">' + (isIP() ? 'therms/yr' : 'MWh/yr') + '</span></div><div class="kpi-sec">' +
        (t.therms != null ? (isIP() ? fmt(t.gas_kwh / 1000, 0) + ' MWh' : fmt(t.therms, 0) + ' therms') : 'needs boiler efficiency') + '</div></div>' : '') +
      '<div class="kpi"><div class="kpi-label">Site EUI</div><div class="kpi-value">' +
        (site != null ? (isIP() ? fmt(site, 1) : fmt(site / KBTU_PER_KWH * C.FT2_PER_M2, 0)) : '–') + '<span class="kpi-unit">' + (isIP() ? 'kBtu/ft²·yr' : 'kWh/m²·yr') + '</span></div>' +
        '<div class="kpi-sec">' + (site != null ? (isIP() ? fmt(site / KBTU_PER_KWH * C.FT2_PER_M2, 0) + ' kWh/m²·yr' : fmt(site, 1) + ' kBtu/ft²·yr') : '') + '</div></div>' +
      '<div class="kpi"><div class="kpi-label">Operational carbon</div><div class="kpi-value">' + (t.co2 != null ? fmt(t.co2 / 1000, 0) : '–') + '<span class="kpi-unit">t CO₂e/yr</span></div>' +
        '<div class="kpi-sec">' + (t.co2 != null ? (isIP() ? fmt(t.co2 / ft2, 2) + ' kg/ft²' : fmt(t.co2 / S.sc.gfa_m2, 1) + ' kg/m²') : 'needs ' + esc(t.missing.join(', '))) + '</div></div></div>';
    var siteSeries = t.elec != null && t.gas_kwh != null;
    var series = siteSeries ? [
      {key: 'heating_el', label: 'Heating (electric)', color: 'var(--heat)'}, {key: 'gas_kwh', label: 'Heating (gas)', color: 'var(--heat-2)'},
      {key: 'cooling_el', label: 'Cooling', color: 'var(--cool)'}, {key: 'fan', label: 'Fans', color: 'var(--ink-4)'},
      {key: 'lighting', label: 'Lighting', color: 'var(--warn)'}, {key: 'equipment', label: 'Equipment', color: 'var(--good)'}] : [
      {key: 'heating_th', label: 'Heating delivered', color: 'var(--heat)'}, {key: 'cooling_th', label: 'Cooling delivered', color: 'var(--cool)'},
      {key: 'lighting', label: 'Lighting', color: 'var(--warn)'}, {key: 'equipment', label: 'Equipment', color: 'var(--good)'}];
    h += '<h3>Monthly ' + (siteSeries ? 'site energy' : 'loads and electricity (enter your efficiencies to convert to site energy)') + '</h3>' +
      stackedBars(f.months, series, 'MWh');
    var rows = [['Cooling delivered (coil)', t.cooling_th, t.cooling_el, 'electricity'],
      ['Heating delivered (coil)', t.heating_th, S.energy.heatSource === 'gas' ? t.gas_kwh : t.heating_el, S.energy.heatSource === 'gas' ? 'gas' : 'electricity'],
      ['Fans', null, t.fan, 'electricity'], ['Lighting', null, t.lighting, 'electricity'], ['Equipment', null, t.equipment, 'electricity']];
    h += '<div class="scroll-x" style="margin-top:10px"><table class="t"><thead><tr><th>End use</th><th>Load (MWh)</th><th>Site energy (MWh)</th><th>Fuel</th></tr></thead><tbody>' +
      rows.map(function (r) {
        return '<tr><td>' + r[0] + '</td><td class="num">' + (r[1] != null ? fmt(r[1] / 1000, 1) : '') + '</td><td class="num">' +
          (r[2] != null ? fmt(r[2] / 1000, 1) : '–') + '</td><td>' + r[3] + '</td></tr>';
      }).join('') + '</tbody></table></div>';
    h += '<p class="sub" style="margin:8px 0 0">' + esc(run.station.weather_file) + ' · ' + fmt(S.sc.occ_days_per_week, 0) + ' occupied days a week · ' +
      fmt(run.engine.run_seconds, 0) + ' s. No economizer is modelled, so cooling in mild weather is an upper bound. Fan energy follows the airflow ' +
      'the loads need (a variable-volume fan); a constant-volume fan uses more. ' +
      'Typical-year weather, not a forecast for a specific year.</p>' +
      '<div class="actions"><button class="btn" type="button" id="b-annual">Run again</button></div></div>';
    return h;
  }

  function runAnnual() {
    S.annualRunning = true; S.annualError = null; render();
    var sc = JSON.parse(JSON.stringify(S.sc)), hash = scenarioHash(sc), body = engineInput(sc);
    body.annual = true;
    engineRun(body)
      .then(function (run) {
        S.annualRunning = false;
        if (!run.ok) S.annualError = 'Annual run failed: ' + (run.error || 'unknown error');
        else { delete run.idf; S.annual = {hash: hash, run: run}; }
        render();
      })
      .catch(function (e) { S.annualRunning = false; S.annualError = 'EnergyPlus could not start in this browser: ' + e.message; render(); });
  }

  // ── Detailed data ───────────────────────────────────────────────────────
  function detailKpis(g, b) {
    var ft2 = g.gfa * C.FT2_PER_M2, cfm = g.supply != null ? g.supply * C.CFM_PER_M3S : null, h = '<div class="kpis">';
    if (g.clgSens != null && g.clgLat != null) {
      h += '<div class="kpi"><div class="kpi-label">Sensible / latent</div><div class="kpi-value">' + fmt(g.clgSens / g.clg, 2) + '<span class="kpi-unit">SHR</span></div>' +
        '<div class="kpi-sec">' + fmt(g.clgSens / 1000, 0) + ' kW sensible · ' + fmt(g.clgLat / 1000, 0) + ' kW latent</div></div>';
    }
    if (cfm != null) {
      var air = function (m3s) { return isIP() ? m3s * C.CFM_PER_M3S : m3s * 1000; }, au = isIP() ? 'cfm' : 'L/s';
      h += '<div class="kpi"><div class="kpi-label">Supply air at cooling peak</div><div class="kpi-value">' + fmt(air(g.supply), 0) + '<span class="kpi-unit">' + au + '</span></div>' +
        '<div class="kpi-sec">' + (isIP() ? fmt(cfm / ft2, 2) + ' cfm/ft² · ' + fmt(g.supply * 1000, 0) + ' L/s' : fmt(g.supply * 1000 / g.gfa, 2) + ' L/s·m² · ' + fmt(cfm, 0) + ' cfm') + '</div>' +
        deltaHtml(air(g.supply), b && b.supply != null ? air(b.supply) : null, function (v) { return fmt(v, 0) + ' ' + au; }) + '</div>';
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
    var kw = function (w) { return w / 1000; }, cfm = function (m) { return isIP() ? m * C.CFM_PER_M3S : m * 1000; };
    var h = '<div class="scroll-x" style="margin-top:14px"><table class="t"><thead><tr><th>Metric</th><th>' + (b ? 'Baseline' : '') +
      '</th><th>Current</th><th>' + (b ? 'Δ' : '') + '</th></tr></thead><tbody>';
    h += row('Cooling, block (' + uC() + ')', g.clg, b && b.clg, capC, 1);
    h += row('Cooling, sensible (kW)', g.clgSens, b && b.clgSens, kw, 1);
    h += row('Cooling, latent (kW)', g.clgLat, b && b.clgLat, kw, 1);
    h += row('Ventilation load before heat recovery (kW)', g.clgOA, b && b.clgOA, kw, 1);
    h += row('Recovered by heat recovery (kW)', g.clgHR, b && b.clgHR, kw, 1);
    h += row('Cooling, sum of zone peaks (' + uC() + ')', g.clgSop, b && b.clgSop, capC, 1);
    h += row('Supply air at cooling peak (' + (isIP() ? 'cfm' : 'L/s') + ')', g.supply, b && b.supply, cfm, 0);
    h += row('Heating, block (' + uH() + ')', g.htg, b && b.htg, capH, 0);
    h += row('Heating, sum of zone peaks (' + uH() + ')', g.htgSop, b && b.htgSop, capH, 0);
    return h + '</tbody></table></div>';
  }

  function designConditionsCard() {
    var st = stationById(S.station), dd = st.design_days;
    function row(key, sel) {
      var r = dd[key];
      if (!r) return '';
      var hum = r.mcwb_c != null ? r.mcwb_c : r.dp_c;
      return '<tr' + (sel ? ' class="sel"' : '') + '><td>' + DD_LABEL[key] + '</td>' +
        '<td class="num">' + temp(r.db_c, 1) + '</td>' +
        '<td class="num">' + (hum == null ? '–' : temp(hum, 1)) + '</td>' +
        '<td class="num">' + (r.db_range_c ? fmt(r.db_range_c, 1) + ' K' : '–') + '</td>' +
        '<td class="num">' + r.month + '/' + r.day + '</td></tr>';
    }
    var h = '<div class="card"><h2>Design conditions · ' + esc(st.label) + '</h2><p class="sub">' + esc(st.design_source || '') +
      ', from the DOE EnergyPlus weather file <code>' + esc(st.file) + '.ddy</code>. Lat ' + fmt(st.lat, 2) + ', elev ' + fmt(st.elev_m, 0) + ' m.</p>';
    h += '<div class="scroll-x"><table class="t"><thead><tr><th>Condition</th><th>Dry-bulb</th><th>Coincident WB / dew point</th><th>Daily range</th><th>Day</th></tr></thead><tbody>';
    ['htg_99.6', 'htg_99'].forEach(function (k) { h += row(k, k === 'htg_' + S.heatPct); });
    ['clg_db_0.4', 'clg_db_1', 'clg_db_2', 'clg_dp_0.4', 'clg_dp_1', 'clg_dp_2'].forEach(function (k) {
      h += row(k, k === 'clg_db_' + S.coolPct || k === 'clg_dp_' + S.coolPct);
    });
    return h + '</tbody></table></div></div>';
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
      '<text x="' + P + '" y="12">' + esc(label) + ' · 10-minute values, highest ' + fmt(mx / 1000, 0) + ' kW</text>' +
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
    h += '<p class="sub">Governing cooling day: <b>' + esc(DD_LABEL[g.cKey] || g.cKey) + '</b>, peak hour ending ' + esc(g.time || '–') +
      ' (outdoor ' + temp(g.oat, 1) + '). Governing heating day: <b>' + esc(DD_LABEL[g.hKey] || g.hKey) + '</b>. ' +
      (msgs.warnings || 0) + ' EnergyPlus warnings.</p>';
    h += '<p class="sub">Peaks are one-hour averages, as hourly design-day load methods report them. Highest single 10-minute value: cooling ' +
      fmt((g.clgTs || 0) / 1000, 0) + ' kW at ' + esc(g.clgTsTime || '–') + ', heating ' + fmt((g.htgTs || 0) / 1000, 0) + ' kW at ' +
      esc(g.htgTsTime || '–') + '. Where these are well above the hourly peak, they are start-up (pull-down) transients: cover them by starting ' +
      'systems earlier or with extra capacity, as a deliberate choice.</p>';
    var c = result.dd[g.cKey], hh = result.dd[g.hKey];
    h += profileSvg(c && c.profile, 'var(--cool)', 'Block cooling, ' + (DD_LABEL[g.cKey] || ''));
    h += profileSvg(hh && hh.profile, 'var(--heat)', 'Block heating, ' + (DD_LABEL[g.hKey] || ''));
    var comp = run.components;
    if (comp && comp.cooling && Object.keys(comp.cooling).length) {
      h += '<h3>EnergyPlus zone component loads, cooling (sum of each zone\'s peak, kW)</h3><div class="scroll-x"><table class="t"><thead><tr><th>Component</th><th>Sensible instant</th><th>Sensible delayed</th><th>Latent</th><th>Total</th></tr></thead><tbody>';
      Object.keys(comp.cooling).sort(function (a, b) { return comp.cooling[b].Total - comp.cooling[a].Total; }).forEach(function (k) {
        var r = comp.cooling[k];
        h += '<tr><td>' + esc(k) + '</td><td class="num">' + fmt(r['Sensible - Instant'] / 1000, 1) + '</td><td class="num">' +
          fmt(r['Sensible - Delayed'] / 1000, 1) + '</td><td class="num">' + fmt(r.Latent / 1000, 1) + '</td><td class="num">' + fmt(r.Total / 1000, 1) + '</td></tr>';
      });
      h += '</tbody></table></div><p class="sub" style="margin-top:6px">From EnergyPlus\'s Zone Component Load Summary. Excludes the outdoor-air load handled by the system.</p>';
    }
    if (run.zone_sizing && run.zone_sizing.length) {
      h += '<h3>Zone sizing (per zone, unscaled)</h3><div class="scroll-x"><table class="t"><thead><tr><th>Zone</th><th>×</th><th>Load</th><th>Design load (' + (isIP() ? 'MBH' : 'kW') + ')</th><th>Airflow (' + (isIP() ? 'cfm' : 'L/s') + ')</th><th>Peak</th><th>Design day</th></tr></thead><tbody>';
      run.zone_sizing.forEach(function (z) {
        h += '<tr><td>' + esc(z.ZoneName) + '</td><td class="num">' + z.scale + '</td><td>' + esc(z.LoadType || '') + '</td><td class="num">' +
          fmt((z.CalcDesLoad || 0) / 1000 * (isIP() ? C.MBH_PER_KW : 1), 1) + '</td><td class="num">' + fmt((z.CalcDesFlow || 0) * (isIP() ? C.CFM_PER_M3S : 1000), 0) + '</td><td>' +
          esc(z.PeakHrMin || '') + '</td><td>' + esc(z.DesDayName || '') + '</td></tr>';
      });
      h += '</tbody></table></div>';
    }
    return h + '</div>';
  }

  function assumptionsCard() {
    var rows = Object.keys(S.verify).filter(function (k) { return S.verify[k] && S.sc[k] === S.defaults[k]; });
    if (!rows.length) return '';
    var h = '<div class="card"><h2>Defaults still awaiting confirmation</h2><p class="sub">These inputs are at their default and the default ' +
      'has not been checked against its cited source. Change or confirm them before using results for sizing.</p>' +
      '<div class="scroll-x"><table class="t"><thead><tr><th>Input</th><th>Value</th><th>Source</th></tr></thead><tbody>';
    rows.forEach(function (k) {
      h += '<tr><td>' + esc(k) + '</td><td class="num">' + esc(S.sc[k]) + '</td><td style="text-align:left">' + esc(S.prov[k]) + '</td></tr>';
    });
    return h + '</tbody></table></div></div>';
  }

  // ── Results page ────────────────────────────────────────────────────────
  function renderResults() { renderView(); }

  function render() { renderStatus(); renderView(); save(); }

  // ── Views (hash routing: #start, #inputs, #results) ─────────────────────
  var VIEWS = ['start', 'workspace'];
  function currentView() {
    var v = (location.hash || '').replace('#', '');
    if (v === 'inputs' || v === 'results') {            // old deep links
      history.replaceState(null, '', '#workspace'); v = 'workspace';
    }
    return VIEWS.indexOf(v) >= 0 ? v : 'start';
  }
  function renderSteps(v) {
    var labels = {start: 'Choose building', inputs: 'Describe it', results: 'Results'}, st = document.getElementById('steps');
    if (!st) return;
    st.innerHTML = '<ol>' + VIEWS.map(function (k, i) {
      var cur = k === v;
      return '<li><a href="#' + k + '"' + (cur ? ' aria-current="step" class="on"' : '') + '><span class="n">' + (i + 1) + '</span>' +
        labels[k] + '</a></li>';
    }).join('') + '</ol>';
  }
  function renderView() {
    var v = currentView(), el = document.getElementById('view');
    renderSteps(v);
    if (v === 'start') {
      el.innerHTML = startView();
    } else if (v === 'workspace') {
      if (!document.getElementById('iv') || S.rebuild) {
        var y0 = window.scrollY;
        el.innerHTML = inputsView() + resultsView();
        if (S.rebuild) window.scrollTo(0, y0);
      } else refreshInputs();
      S.rebuild = false;
    } else if (v === 'inputs') {
      if (!document.getElementById('iv') || S.rebuild) {
        var y = window.scrollY;
        el.innerHTML = inputsView();
        if (S.rebuild) window.scrollTo(0, y);
      } else refreshInputs();
      S.rebuild = false;
    } else {
      el.innerHTML = resultsView();
    }
    el.setAttribute('data-view', v);
  }
  function route() {
    var el = document.getElementById('view');
    el.innerHTML = '';                         // views rebuild their own panels
    S.rebuild = false;
    render();
    var go = null;
    try { go = sessionStorage.getItem('scrollTo'); sessionStorage.removeItem('scrollTo'); } catch (x) { /* no storage */ }
    var t = go && document.getElementById(go);
    if (t) t.scrollIntoView(); else window.scrollTo(0, 0);
  }

  // Building-type presentation: category, one-line description and icon.
  // The archetypes carry none of these, so they live here; a type without an
  // entry still shows (generic icon, "Other").
  var TYPE_UI = {
    office: {cat: 'work', desc: 'Offices, desks and meeting rooms', icon: 'office'},
    retail: {cat: 'work', desc: 'Shops and sales floors', icon: 'retail'},
    school: {cat: 'education', desc: 'Primary and secondary classrooms', icon: 'school'},
    higher_ed: {cat: 'education', desc: 'University teaching buildings', icon: 'college'},
    lab: {cat: 'education', desc: 'Research labs with high fresh-air needs', icon: 'lab'},
    healthcare: {cat: 'healthcare', desc: 'Patient rooms, occupied day and night', icon: 'health'},
    hotel: {cat: 'living', desc: 'Guestroom floors, occupied day and night', icon: 'hotel'},
    sports: {cat: 'venues', desc: 'Gyms and sports halls', icon: 'sports'},
    stadium: {cat: 'venues', desc: 'Enclosed arenas with spectator seating', icon: 'stadium'}
  };
  var TYPE_CATS = [['all', 'All'], ['work', 'Work & commercial'], ['education', 'Education'], ['healthcare', 'Healthcare'],
    ['living', 'Living'], ['venues', 'Sports & venues'], ['other', 'Other']];
  var ICONS = {
    building: '<path d="M6 28V6h14v22M20 12h6v16M10 11h2M14 11h2M10 16h2M14 16h2M10 21h2M14 21h2M3 28h26"/>',
    office: '<path d="M5 28V5h16v23M21 11h6v17M9 10h2M15 10h2M9 15h2M15 15h2M9 20h2M15 20h2M3 28h26M12 28v-4h2v4"/>',
    retail: '<path d="M6 11h20l-2 17H8L6 11zM11 11V8a5 5 0 0 1 10 0v3"/>',
    school: '<path d="M4 14l12-7 12 7M7 13v15h18V13M13 28v-6h6v6M16 12v3"/>',
    college: '<path d="M2 12l14-6 14 6-14 6-14-6zM8 15v7c0 2 4 4 8 4s8-2 8-4v-7M28 12v8"/>',
    lab: '<path d="M12 4h8M13 4v9L6 26a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2l-7-13V4M9 20h14"/>',
    health: '<path d="M5 28V8h22v20M3 28h26M14 12h4v4h4v4h-4v4h-4v-4h-4v-4h4z"/>',
    hotel: '<path d="M3 26V8M3 20h26v6M3 15h8v5M13 15h12a4 4 0 0 1 4 4v1"/>',
    sports: '<circle cx="16" cy="16" r="11"/><path d="M5 16h22M16 5c4 3 4 19 0 22M16 5c-4 3-4 19 0 22"/>',
    stadium: '<path d="M3 13c0-3 6-5 13-5s13 2 13 5v10c0 3-6 5-13 5S3 26 3 23V13zM3 13c0 3 6 5 13 5s13-2 13-5"/>'
  };
  function icon(name, cls) {
    return '<svg class="' + (cls || 'ico') + '" viewBox="0 0 32 32" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" ' +
      'stroke-linecap="round" stroke-linejoin="round">' + (ICONS[name] || ICONS.building) + '</svg>';
  }
  var SNOW = '<svg class="ico-s" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 2v20M3.3 7l17.4 10M3.3 17L20.7 7M9 4l3 3 3-3M9 20l3-3 3 3"/></svg>';
  var FLAME = '<svg class="ico-s" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 22c4 0 7-3 7-7 0-5-4-7-5-12-3 2-4 5-4 7-1-1-2-2-2-4-2 2-3 5-3 9 0 4 3 7 7 7z"/></svg>';

  // ASHRAE 169 climate zone descriptors: thermal (1-8) and moisture (A/B/C).
  var ZONE_TEMP = {1: 'very hot', 2: 'hot', 3: 'warm', 4: 'mixed', 5: 'cool', 6: 'cold', 7: 'very cold', 8: 'subarctic'};
  var ZONE_MOIST = {A: 'humid', B: 'dry', C: 'marine'};
  function climateNote(z) {
    var t = ZONE_TEMP[z.charAt(0)], m = ZONE_MOIST[z.charAt(1)];
    return 'Climate zone ' + z + ': ' + (t || '') + (m ? ', ' + m : '') + ' (ASHRAE 169).';
  }

  function startView() {
    var types = D.archetypes.types, cat = S.typeCat || 'all';
    var keys = Object.keys(types);
    var used = {};
    keys.forEach(function (k) { used[(TYPE_UI[k] || {}).cat || 'other'] = true; });
    var h = '<div class="wrap">';
    h += '<section class="hero"><div class="hero-text"><h1>How much heating and cooling will your building need?</h1>' +
      '<p class="lead">Describe your building and where it is. The tool works out the peak heating and cooling the HVAC equipment must be ' +
      'sized for, and shows what drives it, using EnergyPlus.</p></div>' +
      '<div class="hero-cards"><div class="hc cool">' + SNOW + '<div><b>Cooling</b><span>sized for the hottest summer afternoon</span></div></div>' +
      '<div class="hc heat">' + FLAME + '<div><b>Heating</b><span>sized for the coldest winter night</span></div></div></div></section>';
    h += '<section class="how" id="how" aria-labelledby="how-title"><h2 id="how-title">How it works</h2><ol class="how-steps">' +
      '<li><span class="n">1</span><b>Describe your building.</b><span>Typical values are filled in for the type and location; change only what you know.</span></li>' +
      '<li><span class="n">2</span><b>We test it on extreme days.</b><span>An instant estimate right away, and a full EnergyPlus run in about 4 seconds when you want it.</span></li>' +
      '<li><span class="n">3</span><b>See what drives the size.</b><span>Where the load comes from, and the changes that would shrink the equipment most.</span></li></ol></section>';
    h += '<section class="card start-card" aria-labelledby="gs-title"><h2 id="gs-title">Get started</h2>';
    h += '<fieldset class="q"><legend>What kind of building is it?</legend>';
    h += '<div class="chips" role="group" aria-label="Filter building types">' + TYPE_CATS.filter(function (c) {
      return c[0] === 'all' || used[c[0]];
    }).map(function (c) {
      return '<button type="button" class="chip' + (cat === c[0] ? ' on' : '') + '" aria-pressed="' + (cat === c[0]) + '" data-cat="' + c[0] + '">' + esc(c[1]) + '</button>';
    }).join('') + '</div>';
    h += '<div class="tiles">' + keys.filter(function (k) {
      return cat === 'all' || ((TYPE_UI[k] || {}).cat || 'other') === cat;
    }).map(function (k) {
      var u = TYPE_UI[k] || {}, on = k === S.type;
      return '<button type="button" class="tile' + (on ? ' on' : '') + '" aria-pressed="' + on + '" data-type="' + k + '">' +
        icon(u.icon) + '<span class="t-name">' + esc(types[k].label) + '</span>' +
        (u.desc ? '<span class="t-desc">' + esc(u.desc) + '</span>' : '') + (on ? '<span class="t-check">Selected</span>' : '') + '</button>';
    }).join('') + '</div></fieldset>';
    var st = stationById(S.station);
    h += '<div class="q loc"><label for="f-station">Where is it?</label><div class="loc-row"><select id="f-station">' +
      D.stations.map(function (s) {
        return '<option value="' + s.id + '"' + (s.id === S.station ? ' selected' : '') + '>' + esc(s.label) + '</option>';
      }).join('') + '</select><p class="climate">' + esc(climateNote(st.climate_zone_stat)) + '</p></div>' +
      '<p class="hint">The nearest of the weather stations with ASHRAE design data. Typical envelope values follow its climate zone.</p></div>';
    h += '<div class="start-actions"><a class="btn primary big" href="#workspace">Next: Describe your building →</a></div>';
    h += '</section></div>';
    return h;
  }

  // ── Inputs view: one page of plain-language questions ──────────────────
  // One generic renderer, driven by this config. kind 'number' = a value box;
  // otherwise presets (data/presets.js) plus Typical (the archetype default)
  // and Custom. fx: which peak the input moves (cool, heat, both, none).
  var SECTIONS = [
    {id: 'size', title: 'Size & shape', desc: 'How big the building is and how it sits on the site.', qs: [
      {k: 'gfa_m2', label: 'Total floor area', tech: 'Gross floor area', fx: 'both', kind: 'number'},
      {k: 'n_floors', label: 'Number of floors', tech: 'Floors above grade', fx: 'both', kind: 'number'},
      {k: 'aspect_ratio', label: 'Floor plan shape', tech: 'Plan aspect ratio (length ÷ width)', fx: 'both'},
      {k: 'north_axis_deg', label: 'Which way the long sides face', tech: 'Rotation of the long axis from east', fx: 'cool'}]},
    {id: 'envelope', title: 'Walls & windows', desc: 'How much glass there is, and how well walls, roof and windows keep heat and sun out.', qs: [
      {k: 'wwr', label: 'How much of the wall is glass', tech: 'Window-to-wall ratio', fx: 'both', sketch: true},
      {k: 'win_u', label: 'How well the windows keep heat in', tech: 'Window U-factor (assembly)', fx: 'both'},
      {k: 'shgc', label: 'How much sun heat the windows let in', tech: 'Solar heat gain coefficient (SHGC)', fx: 'cool'},
      {k: 'overhang_pf', label: 'Shading over the windows', tech: 'Overhang projection factor', fx: 'cool'},
      {k: 'wall_u', label: 'Wall insulation', tech: 'Wall U-factor (assembly)', fx: 'both'},
      {k: 'roof_u', label: 'Roof insulation', tech: 'Roof U-factor (assembly)', fx: 'both'}]},
    {id: 'people', title: 'People & equipment', desc: 'Who and what is inside, giving off heat.', qs: [
      {k: 'm2_per_person', label: 'How busy the building is', tech: 'Floor area per person', fx: 'both'},
      {k: 'lpd_w_m2', label: 'Lighting', tech: 'Lighting power density', fx: 'cool'},
      {k: 'epd_w_m2', label: 'Equipment and plug loads', tech: 'Equipment power density', fx: 'cool'}]},
    {id: 'air', title: 'Fresh air', desc: 'Outdoor air brought in on purpose, and air leaking through the envelope.', qs: [
      {k: 'oa_per_person_ls', label: 'Fresh air per person', tech: 'Outdoor air rate per person (ASHRAE 62.1 Rp)', fx: 'both', vent: '6201'},
      {k: 'oa_per_area_ls_m2', label: 'Fresh air per floor area', tech: 'Outdoor air rate per area (ASHRAE 62.1 Ra)', fx: 'both', vent: '6201'},
      {k: 'oa_ach', label: 'Fresh air changes per hour', tech: 'Outdoor air by air changes', fx: 'both', vent: 'ach'},
      {k: 'erv_sensible_eff', label: 'Heat recovery from exhaust air', tech: 'Heat recovery, sensible effectiveness', fx: 'both'},
      {k: 'erv_latent_eff', label: 'Moisture recovery from exhaust air', tech: 'Heat recovery, latent effectiveness', fx: 'cool'},
      {k: 'infiltration_ach', label: 'Airtightness', tech: 'Infiltration, whole building (air changes per hour)', fx: 'both'}]},
    {id: 'schedule', title: 'Schedule & temperatures', desc: 'When the building is used, and how warm or cool it is kept.', qs: [
      {k: 'occ_start_h', label: 'Opens at (hour of day)', tech: 'Occupied from', fx: 'both', kind: 'number'},
      {k: 'occ_hours', label: 'Hours in use per day', tech: 'Occupied hours per day', fx: 'both', kind: 'number'},
      {k: 'occ_days_per_week', label: 'Days in use per week', tech: 'Occupied days per week (annual energy only)', fx: 'none', kind: 'number'},
      {k: 'hvac_start_before_occ_h', label: 'How early the systems switch on', tech: 'Start-up before occupancy (hours)', fx: 'both'},
      {k: 't_heat_c', label: 'Winter inside temperature', tech: 'Heating setpoint (occupied)', fx: 'heat'},
      {k: 't_cool_c', label: 'Summer inside temperature', tech: 'Cooling setpoint (occupied)', fx: 'cool'}]}
  ];
  // Fields not asked as questions: labelled number boxes under Advanced settings.
  var ADVANCED_EXTRA = ['oa_unoccupied_fraction', 'setback_heat_c', 'setup_cool_c'];

  function ventMethod() {
    return (S.defaults.oa_ach || 0) > 0 && !(S.defaults.oa_per_person_ls > 0) && !(S.defaults.oa_per_area_ls_m2 > 0) ? 'ach' : '6201';
  }
  function sectionQs(sec) {
    var m = ventMethod();
    return sec.qs.filter(function (q) { return !q.vent || q.vent === m; });
  }
  function fieldSpec(k) {
    var f = null;
    GROUPS.forEach(function (g) { g.fields.forEach(function (x) { if (x[0] === k) f = x; }); });
    return f || [k, k, '-', 0.01];
  }
  function advancedKeys() {
    var asked = {};
    SECTIONS.forEach(function (sec) { sectionQs(sec).forEach(function (q) { asked[q.k] = true; }); });
    var keys = [];
    GROUPS.forEach(function (g) { g.fields.forEach(function (f) { if (!asked[f[0]]) keys.push(f[0]); }); });
    return keys;
  }
  function changedCount(keys) {
    return keys.filter(function (k) { return isChanged(k, fieldSpec(k)[2]); }).length;
  }
  function statusText(n) { return n ? n + (n === 1 ? ' change' : ' changes') : 'Typical values'; }

  // A value as shown on a preset button.
  function presetValue(k, v) {
    if (v == null) return 'to be confirmed';
    if (k === 'wwr' || k === 'erv_sensible_eff' || k === 'erv_latent_eff') return fmt(v * 100, 0) + '%';
    if (k === 'aspect_ratio') return fmt(v, 1) + ' : 1';
    if (k === 'north_axis_deg') return fmt(v, 0) + '°';
    if (k === 'hvac_start_before_occ_h') return fmt(v, 0) + ' h';
    var u = fieldSpec(k)[2], d = UNITS[u] ? toDisp(u, v) : v;
    return fmt(d, UNITS[u] && isIP() ? UNITS[u].dp : (Math.abs(d) < 10 ? 2 : 1)) + (unitLabel(u) ? ' ' + unitLabel(u) : '');
  }
  function presetsFor(k) {
    var P = window.LOADS_PRESETS || {_all: {}, byType: {}}, list = ((P.byType[S.type] || {})[k] || P._all[k] || []).slice();
    var def = S.defaults[k], same = function (a, b) { return a != null && b != null && Math.abs(a - b) < 1e-9; };
    var out = list.map(function (p) { return {label: p.label, value: p.value, typical: same(p.value, def)}; });
    if (!out.some(function (p) { return p.typical; })) out.splice(Math.min(1, out.length), 0, {label: 'Typical', value: def, typical: true});
    return out;
  }
  function fxChips(fx) {
    var h = '';
    if (fx === 'cool' || fx === 'both') h += '<span class="fx cool">' + SNOW + 'Cooling</span>';
    if (fx === 'heat' || fx === 'both') h += '<span class="fx heat">' + FLAME + 'Heating</span>';
    if (fx === 'none') h += '<span class="fx none">Annual energy only</span>';
    return h;
  }
  function wwrSketch() {
    var w = Math.max(0, Math.min(0.95, +S.sc.wwr || 0)), H = 96, band = H * w;
    var h = '<svg class="facade" viewBox="0 0 240 120" role="img" aria-label="Facade with ' + fmt(w * 100, 0) + '% glass">' +
      '<rect x="10" y="12" width="220" height="' + H + '" fill="#EEF1F4" stroke="#15202B" stroke-width="1.5"/>';
    for (var i = 0; i < 6; i++) {
      h += '<rect x="' + (18 + i * 35.5) + '" y="' + (12 + (H - band) / 2) + '" width="29" height="' + band + '" fill="#9DB9DA" stroke="#15202B" stroke-width="1"/>';
    }
    return h + '</svg><span class="facade-cap">' + fmt(w * 100, 0) + '% glass</span>';
  }
  function questionHtml(q) {
    var k = q.k, spec = fieldSpec(k), unit = spec[2], v = S.sc[k];
    var vb = S.verify[k] ? ' <span class="verify" title="Default not yet checked against its cited source">verify</span>' : '';
    var h = '<div class="qq" id="q-' + k + '"><div class="qq-head"><div>' +
      '<div class="qq-label" id="ql-' + k + '">' + esc(q.label) + '</div>' +
      '<div class="qq-tech">' + esc(q.tech) + (unitLabel(unit) ? ' · ' + esc(unitLabel(unit)) : '') + vb + '</div></div>' +
      '<div class="fxs">' + fxChips(q.fx) + '</div></div>';
    if (q.sketch) h += '<div class="sketch" id="wwr-sketch">' + wwrSketch() + '</div>';
    var showBox = q.kind === 'number';
    if (q.kind !== 'number') {
      var ps = presetsFor(k), any = false;
      h += '<div class="opts" role="group" aria-labelledby="ql-' + k + '">';
      ps.forEach(function (p) {
        var on = !S.custom[k] && p.value != null && v != null && Math.abs(v - p.value) < 1e-9;
        any = any || on;
        h += '<button type="button" class="opt' + (on ? ' on' : '') + (p.value == null ? ' todo' : '') + '" aria-pressed="' + on + '"' +
          (p.value == null ? ' disabled title="Preset value not set yet (TODO in data/presets.js)"' : ' data-pk="' + k + '" data-pv="' + p.value + '"') + '>' +
          '<span class="ol">' + esc(p.label) + '</span>' +
          '<span class="ov">' + esc(presetValue(k, p.value)) + '</span>' +
          (p.typical && p.label !== 'Typical' ? '<span class="typ">Typical</span>' : '') +
          (p.typical ? '<span class="typ-hint">Default for this location</span>' : '') + '</button>';
      });
      var custom = !any;
      h += '<button type="button" class="opt' + (custom ? ' on' : '') + '" aria-pressed="' + custom + '" data-custom="' + k + '">' +
        '<span class="ol">Custom</span><span class="ov" id="cv-' + k + '">' + (custom ? esc(presetValue(k, v)) : 'Enter a value') + '</span></button></div>';
      showBox = custom;
    }
    if (showBox) h += '<div class="custom">' + fieldHtml(k, q.kind === 'number' ? 'Value' : 'Exact value', unit, spec[3]) + '</div>';
    else if (S.showSources) h += '<p class="src">' + esc(S.prov[k] || '') + '</p>';
    return h + '</div>';
  }
  function inputsView() {
    var types = D.archetypes.types, st = stationById(S.station);
    var h = '<div class="wrap iv" id="iv"><div class="iv-head"><div><h1>Describe your building</h1>' +
      '<p class="lead">Everything is on this page. Typical values are filled in — change only what you know.</p>' +
      '<div class="ctx"><span class="ctx-chip">' + icon((TYPE_UI[S.type] || {}).icon, 'ico-xs') + esc(types[S.type].label) + '</span>' +
      '<span class="ctx-chip">' + esc(st.label) + ' · ' + esc(st.climate_zone_stat) + '</span><a href="#start">Change</a></div></div>' +
      '<div class="iv-actions"><label class="toggle"><input type="checkbox" id="f-sources"' + (S.showSources ? ' checked' : '') +
      '> Show where each default comes from</label><button type="button" class="btn" id="b-reset">Reset to typical values</button></div></div>';
    h += '<div class="iv-cols"><nav class="jump" aria-label="Jump to section"><div class="jump-title">Jump to</div><ol>';
    SECTIONS.forEach(function (sec, i) {
      var n = changedCount(sectionQs(sec).map(function (q) { return q.k; }));
      h += '<li><button type="button" data-jump="sec-' + sec.id + '"><span class="n">' + (i + 1) + '</span><span class="jt">' + esc(sec.title) +
        '<span class="js' + (n ? ' ch' : '') + '" data-status="' + sec.id + '">' + statusText(n) + '</span></span></button></li>';
    });
    var na = changedCount(advancedKeys());
    h += '<li><button type="button" data-jump="sec-advanced"><span class="n">+</span><span class="jt">Advanced settings<span class="js' + (na ? ' ch' : '') +
      '" data-status="advanced">' + statusText(na) + '</span></span></button></li></ol>' +
      '<div class="legend"><span class="fx cool">' + SNOW + 'Affects cooling (summer)</span><span class="fx heat">' + FLAME + 'Affects heating (winter)</span></div></nav>';
    h += '<div class="sections">';
    SECTIONS.forEach(function (sec, i) {
      var qs = sectionQs(sec), n = changedCount(qs.map(function (q) { return q.k; }));
      h += '<section class="sec card" id="sec-' + sec.id + '" aria-labelledby="st-' + sec.id + '"><div class="sec-head"><span class="n">' + (i + 1) + '</span>' +
        '<div><h2 id="st-' + sec.id + '">' + esc(sec.title) + '</h2><p>' + esc(sec.desc) + '</p></div>' +
        '<span class="js' + (n ? ' ch' : '') + '" data-status="' + sec.id + '">' + statusText(n) + '</span></div>';
      qs.forEach(function (q) { h += questionHtml(q); });
      h += '</section>';
    });
    var adv = advancedKeys();
    h += '<details class="sec card adv" id="sec-advanced"' + (S.open.advanced ? ' open' : '') + ' data-g="advanced"><summary><span class="n">+</span>' +
      '<div><h2>Advanced settings</h2><p>Geometry details, supply air, sizing factors, setbacks, energy and carbon factors, plant cost.</p></div>' +
      '<span class="js' + (na ? ' ch' : '') + '" data-status="advanced">' + statusText(na) + '</span></summary><div class="adv-body">';
    adv.forEach(function (k) { var f = fieldSpec(k); h += fieldHtml(f[0], f[1], f[2], f[3]); });
    h += czFieldHtml() + '<h3>Energy and carbon</h3>' + energyHtml() + '<h3>Plant cost</h3>' + plantHtml() + '</div></details>';
    h += '<div class="iv-next"><a class="btn big" href="#results">Next: See my results →</a></div></div>';
    h += '<aside class="live" aria-label="Your building so far" id="live">' + liveHtml() + '</aside></div></div>';
    return h;
  }
  // Statuses, the facade sketch and the live panel update in place while the
  // user types (no rebuild, so focus stays in the box).
  function refreshInputs() {
    SECTIONS.forEach(function (sec) {
      var n = changedCount(sectionQs(sec).map(function (q) { return q.k; }));
      setStatus(sec.id, n);
    });
    setStatus('advanced', changedCount(advancedKeys()));
    Object.keys(S.custom).forEach(function (k) {
      var cv = document.getElementById('cv-' + k);
      if (cv && S.custom[k]) cv.textContent = presetValue(k, S.sc[k]);
    });
    var sk = document.getElementById('wwr-sketch');
    if (sk) sk.innerHTML = wwrSketch();
    clearTimeout(S.liveTimer);
    S.liveTimer = setTimeout(function () {
      var lv = document.getElementById('live');
      if (lv) lv.innerHTML = liveHtml();
    }, 150);
  }
  function setStatus(id, n) {
    [].forEach.call(document.querySelectorAll('[data-status="' + id + '"]'), function (el) {
      el.textContent = statusText(n); el.classList.toggle('ch', n > 0);
    });
  }
  // "Your building so far": both peaks, the change against typical values
  // (the type's defaults at the same size and shape), and where each load
  // comes from as a stacked bar.
  function typicalResult() {
    var typ = JSON.parse(JSON.stringify(S.defaults));
    ['gfa_m2', 'n_floors', 'aspect_ratio', 'north_axis_deg'].forEach(function (k) { typ[k] = S.sc[k]; });
    typ.station = S.station;
    var r = resultFor(typ, null);
    return r.source === 'none' ? null : governed(r, typ);
  }
  function sliceTotals(kind, g) {
    var groups = g.result.groups && g.result.groups[kind];
    if (!groups) return null;
    var rows = breakdownRows(groups, kind === 'cooling' ? g.cBlock : g.hBlock, kind === 'cooling' ? g.cf : g.hf), acc = {};
    rows.forEach(function (r) { var k = SLICE_OF[r.key] || 'other'; acc[k] = (acc[k] || 0) + r.w; });
    return acc;
  }
  function stackedBreakdown(kind, g, compact) {
    var acc = sliceTotals(kind, g);
    if (!acc) return '<p class="sub">The breakdown appears after a full simulation for this case.</p>';
    var pos = SLICE_ORDER.filter(function (k) { return acc[k] > 0; });
    var gross = pos.reduce(function (t, k) { return t + acc[k]; }, 0);
    var h = '<div class="stack" role="img" aria-label="' + (kind === 'cooling' ? 'Cooling' : 'Heating') + ' load by source: ' +
      pos.map(function (k) { return SLICE_LABEL[k] + ' ' + fmt(acc[k] / gross * 100, 0) + '%'; }).join(', ') + '">';
    pos.forEach(function (k) {
      h += '<span style="width:' + (acc[k] / gross * 100) + '%;background:var(--s-' + k + ')" title="' + esc(SLICE_LABEL[k]) + ' ' + fmt(acc[k] / gross * 100, 0) + '%"></span>';
    });
    h += '</div><ul class="stack-key' + (compact ? ' compact' : '') + '">';
    pos.slice().sort(function (a, b) { return acc[b] - acc[a]; }).forEach(function (k) {
      h += '<li><i style="background:var(--s-' + k + ')"></i><span>' + esc(SLICE_LABEL[k]) + '</span><b>' + fmt(acc[k] / gross * 100, 0) + '%</b></li>';
    });
    return h + '</ul>';
  }
  function deltaVsTypical(cur, typ, unit, dp) {
    if (typ == null) return '';
    var d = cur - typ;
    if (Math.abs(d) < Math.pow(10, -dp) / 2) return '<div class="vs same">Same as typical values</div>';
    return '<div class="vs ' + (d < 0 ? 'down' : 'up') + '">' + (d < 0 ? '▼ ' : '▲ ') + fmt(Math.abs(d), dp) + ' ' + unit +
      (d < 0 ? ' smaller' : ' bigger') + ' than typical</div>';
  }
  function liveHtml() {
    var res = resultFor(S.sc, S.ep), g = res.source === 'none' ? null : governed(res, S.sc);
    var h = '<div class="live-card card"><div class="live-title">Your building so far</div>';
    if (!g) {
      return h + '<div class="note warn">' + noResultHtml(res) + '</div><button type="button" class="btn" id="b-run"' +
        (S.engine && S.engine.available && !S.running ? '' : ' disabled') + '>' + (S.running ? esc(S.engineMsg || 'Running…') : 'Run full simulation · ~4 sec') + '</button></div>';
    }
    var t = g.source === 'surrogate' ? typicalResult() : null;
    var m = SUR[modelKeyFor(S.type, S.station)], ho = m && m.holdout;
    h += '<span class="badge-src ' + (g.source === 'energyplus' ? 'ep' : 'sur') + '">' + (g.source === 'energyplus' ? 'Full simulation · EnergyPlus' : 'Instant estimate') + '</span>';
    var dpC = isIP() ? 1 : 0;
    h += '<div class="live-num cool"><span class="ln-label">' + SNOW + 'Cooling</span><span class="ln-val">' + fmt(capC(g.clg), dpC) + '</span><span class="ln-unit">' + uC() + '</span>' +
      '<div class="ln-more">' + deltaVsTypical(capC(g.clg), t && capC(t.clg), uC(), dpC) + stackedBreakdown('cooling', g, true) + '</div></div>';
    h += '<div class="live-num heat"><span class="ln-label">' + FLAME + 'Heating</span><span class="ln-val">' + fmt(capH(g.htg), 0) + '</span><span class="ln-unit">' + uH() + '</span>' +
      '<div class="ln-more">' + deltaVsTypical(capH(g.htg), t && capH(t.htg), uH(), 0) + stackedBreakdown('heating', g, true) + '</div></div>';
    if (g.source === 'surrogate' && ho && ho.worst_governing_p95_pct != null) {
      h += '<p class="live-note">Instant estimates for this type and location are within about ' + fmt(Math.ceil(ho.worst_governing_p95_pct), 0) +
        '% of EnergyPlus (tested on ' + ho.n + ' separate runs).</p>';
    }
    return h + '<a class="btn" href="#results">See full results</a></div>';
  }

  // ── Results view ────────────────────────────────────────────────────────
  // The peak design day in plain words, with the hour when a full run gave it.
  function busyPhrase(key, time) {
    var p = (key || '').split('_'), s;
    if (p[0] === 'htg') s = 'the coldest winter day (' + p[1] + '% heating design day)';
    else if (p[1] === 'db') s = 'the hottest summer day (' + p[2] + '% dry-bulb design day)';
    else s = 'a very humid summer day (' + p[2] + '% dew-point design day)';
    if (time && /^\d{1,2}:\d{2}/.test(time)) {
      var hh = Math.round(+time.split(':')[0] + (+time.split(':')[1]) / 60) % 24;
      s += ', around ' + (hh === 0 ? 'midnight' : hh === 12 ? 'noon' : (hh % 12) + (hh < 12 ? ' am' : ' pm'));
    }
    return s;
  }
  function answerCard(kind, g, b) {
    var cool = kind === 'cool', v = cool ? capC(g.clg) : capH(g.htg), dp = cool && isIP() ? 1 : 0, ft2 = g.gfa * C.FT2_PER_M2;
    var sec = cool ? (isIP() ? fmt(ft2 / tons(g.clg), 0) + ' ft² per ton · ' + fmt(g.clg / 1000, 0) + ' kW' : fmt(g.clg / g.gfa, 1) + ' W/m² · ' + fmt(tons(g.clg), 1) + ' tons')
      : (isIP() ? fmt(mbh(g.htg) * 1000 / ft2, 1) + ' Btu/h per ft² · ' + fmt(g.htg / 1000, 0) + ' kW' : fmt(g.htg / g.gfa, 1) + ' W/m² · ' + fmt(mbh(g.htg), 0) + ' MBH');
    var bv = b ? (cool ? capC(b.clg) : capH(b.htg)) : null, unit = cool ? uC() : uH();
    var chip = '';
    if (bv != null) {
      var d = v - bv, pc = bv ? d / bv * 100 : 0;
      chip = Math.abs(d) < Math.pow(10, -dp) / 2 ? '<span class="dchip same">Same as your baseline</span>' :
        '<span class="dchip ' + (d < 0 ? 'down' : 'up') + '">' + (d < 0 ? '▼ ' : '▲ ') + fmt(Math.abs(d), dp) + ' ' + unit + ' (' + fmt(Math.abs(pc), 1) + '%) ' +
        (d < 0 ? 'smaller' : 'bigger') + ' than your baseline</span>';
    }
    return '<div class="ans ' + kind + '"><div class="ans-label">' + (cool ? SNOW + 'Cooling equipment size' : FLAME + 'Heating equipment size') + '</div>' +
      '<div class="ans-num">' + fmt(v, dp) + '<span>' + unit + '</span></div><div class="ans-sec">' + sec + '</div>' +
      '<div class="busy"><b>Busiest moment:</b> ' + esc(busyPhrase(cool ? g.cKey : g.hKey, cool ? g.time : g.hTime)) + '</div>' + chip + '</div>';
  }
  function loadSidebar(g) {
    function block(kind) {
      var cool = kind === 'cooling', acc = sliceTotals(kind, g), conv = cool ? capC : capH, unit = cool ? uC() : uH(), dp = cool && isIP() ? 1 : 0;
      var h = '<div class="ls-block ' + (cool ? 'cool' : 'heat') + '"><div class="ls-title">' + (cool ? SNOW + 'Cooling' : FLAME + 'Heating') +
        '<b>' + fmt(conv(cool ? g.clg : g.htg), dp) + ' ' + unit + '</b></div>' + stackedBreakdown(kind, g, false);
      if (acc) {
        var neg = SLICE_ORDER.filter(function (k) { return acc[k] < 0; });
        if (neg.length) h += '<p class="ls-note">Lowers the peak: ' + neg.map(function (k) {
          return esc(SLICE_LABEL[k]) + ' −' + fmt(Math.abs(conv(acc[k])), dp) + ' ' + unit; }).join(', ') + '.</p>';
      }
      if (!cool) h += '<p class="ls-note">No sun and nobody inside on the coldest morning, so the heating peak is fresh air and heat lost through the envelope.</p>';
      return h + '</div>';
    }
    return '<section class="card ls" aria-labelledby="ls-title"><h2 id="ls-title">Where does the load come from?</h2>' +
      '<p class="sub">Each source\'s share at the hour the whole building peaks.</p>' + block('cooling') + block('heating') + '</section>';
  }
  function confidenceCard(g) {
    var m = SUR[modelKeyFor(S.type, S.station)], ho = m && m.holdout;
    return '<section class="card r-card"><h2>How sure are these numbers?</h2><dl class="conf">' +
      '<dt><span class="badge-src ep">Full simulation · EnergyPlus</span></dt><dd>EnergyPlus 25.2, the US Department of Energy\'s simulation engine, ' +
      'ran your exact answers in this browser.</dd>' +
      '<dt><span class="badge-src sur">Instant estimate</span></dt><dd>A model trained on ' + (m ? fmt(m.n_samples, 0) : 'many') + ' EnergyPlus runs for this type and location' +
      (ho && ho.worst_governing_p95_pct != null ? ', within about ' + fmt(Math.ceil(ho.worst_governing_p95_pct), 0) + '% of EnergyPlus on ' + ho.n + ' separate test runs' : '') +
      '. Run a full simulation for numbers that go into a basis of design.</dd></dl>' +
      '<p class="sub">This tool is at validation stage: heating peaks have been checked against hand calculations; cooling peaks not yet against an ' +
      'independent reference.</p></section>';
  }
  function engineersSection(res, g, b) {
    var h = '<details class="card eng" id="eng"' + (S.open.eng ? ' open' : '') + '><summary><h2>For engineers: detailed data</h2>' +
      '<span class="sub">Design conditions, airflow, outdoor-air loads, every design day, profiles, zone sizing, defaults and downloads.</span></summary>';
    h += '<div class="conds"><span>Design condition: cooling</span>' + seg('coolPct', [['0.4', '0.4%'], ['1', '1%'], ['2', '2%']], S.coolPct) +
      '<span>heating</span>' + seg('heatPct', [['99.6', '99.6%'], ['99', '99%']], S.heatPct) + '</div>';
    if (g) {
      h += '<div class="card"><h2>Peak load detail</h2><p class="sub">Selected condition: cooling ' + S.coolPct + '%, heating ' + S.heatPct + '%.</p>' +
        detailKpis(g, b) + compareTable(g, b) + '</div>';
      h += designDayCard(g, b) + breakdownCard(g, b);
      if (g.source === 'energyplus') h += energyplusCard(res, g);
    }
    return h + designConditionsCard() + assumptionsCard() + '</details>';
  }
  function resultsView() {
    var res = resultFor(S.sc, S.ep), g = res.source === 'none' ? null : governed(res, S.sc);
    var b = null;
    if (S.baseline) {
      var bRes = resultFor(S.baseline.sc, S.baseline.ep);
      b = bRes.source === 'none' ? null : governed(bRes, S.baseline.sc);
    }
    var st = stationById(S.station), engineOn = S.engine && S.engine.available;
    var h = '<div class="wrap rv"><div class="rv-head"><div>' +
      (g ? '<span class="badge-src ' + (g.source === 'energyplus' ? 'ep' : 'sur') + '">' + (g.source === 'energyplus' ? 'Full simulation · EnergyPlus' : 'Instant estimate') + '</span>' : '') +
      '<h1>Your results</h1><p class="lead">' + esc(D.archetypes.types[S.type].label) + ' · ' + esc(st.label) + ' · ' + area(S.sc.gfa_m2) + ' on ' +
      fmt(S.sc.n_floors, 0) + ' floor' + (S.sc.n_floors > 1 ? 's' : '') + '</p><a class="back" href="#inputs">← Change my answers</a></div>' +
      '<div class="rv-actions"><button type="button" class="btn" id="b-base"' + (g ? '' : ' disabled') + '>Save as my baseline</button>' +
      (S.baseline ? '<button type="button" class="btn" id="b-clear">Clear baseline</button>' : '') +
      '<button type="button" class="btn" id="b-report"' + (g ? '' : ' disabled') + '>Download report</button></div></div>';
    if (g) {
      if (g.source === 'surrogate') h += surrogateNotes(res, g);
      if (g.cf !== 1 || g.hf !== 1) h += '<div class="note info">Includes sizing factors: cooling ×' + fmt(g.cf, 2) + ', heating ×' + fmt(g.hf, 2) + '.</div>';
      if (b && b.source !== g.source) h += '<div class="note warn">Your baseline and these results come from different sources (' + b.source + ' vs ' + g.source + '). Compare like with like before quoting the difference.</div>';
      h += '<div class="answers">' + answerCard('cool', g, b) + answerCard('heat', g, b) + '</div>';
    } else {
      h += '<div class="card no-res">' + noResultHtml(res) + '</div>';
    }
    if (S.runError) h += '<div class="note bad">' + esc(S.runError) + '</div>';
    var running = S.running ? esc(S.engineMsg || 'Running EnergyPlus…') : null;
    if (!g || g.source !== 'energyplus') {
      h += '<div class="run-strip' + (g ? '' : ' need') + '"><p>' + (g ? 'Want the exact numbers for these answers?' : 'This combination needs a full simulation.') + '</p>' +
        '<button type="button" class="btn" id="b-run"' + (engineOn && !S.running ? '' : ' disabled') + '>' + (running || 'Run full simulation · ~4 sec') + '</button>' +
        (!engineOn ? '<p class="sub">' + esc((S.engine && S.engine.reason) || '') + '</p>' : '') + '</div>';
    } else {
      h += '<div class="run-strip done"><p>Full simulation of your current answers' + (S.ep.run.engine && S.ep.run.engine.run_seconds ? ', ' + fmt(S.ep.run.engine.run_seconds, 1) + ' s' : '') + '.</p></div>';
    }
    h += '<details class="gloss-q"><summary>What do “tons” and “MBH” mean?</summary><dl class="gloss">' +
      '<dt>Ton (of cooling)</dt><dd>12,000 Btu per hour, or 3.517 kW: the usual US unit for cooling equipment size.</dd>' +
      '<dt>MBH</dt><dd>1,000 Btu per hour, or 0.293 kW: the usual US unit for heating equipment size.</dd>' +
      '<dt>Peak</dt><dd>The most heating or cooling needed in any one hour on an extreme design day. The equipment is sized for it.</dd></dl></details>';
    h += '<div class="rv-cols"><div class="rv-main">' + sensitivityCard();
    if (g) h += optimizerCard(g);
    h += '<div class="pair">' + (g ? costCard(g, b) : '') + confidenceCard(g) + '</div>';
    h += annualCard() + engineersSection(res, g, b) + '</div>';
    if (g) h += '<aside class="rv-side">' + loadSidebar(g) + '</aside>';
    return h + '</div></div>';
  }

  // A one-page report of the current results (HTML, opens in any browser).
  function reportHtml() {
    var res = resultFor(S.sc, S.ep), g = res.source === 'none' ? null : governed(res, S.sc), st = stationById(S.station);
    if (!g) return null;
    var changed = [];
    GROUPS.forEach(function (gr) { gr.fields.forEach(function (f) {
      if (isChanged(f[0], f[2])) changed.push('<li>' + esc(f[1]) + ': ' + esc(String(toDisp(f[2], S.defaults[f[0]]))) + ' → ' + esc(String(toDisp(f[2], S.sc[f[0]]))) +
        (unitLabel(f[2]) ? ' ' + esc(unitLabel(f[2])) : '') + '</li>');
    }); });
    function shares(kind) {
      var acc = sliceTotals(kind, g); if (!acc) return '<p>Not available for this result.</p>';
      var pos = SLICE_ORDER.filter(function (k) { return acc[k] > 0; }), gross = pos.reduce(function (t, k) { return t + acc[k]; }, 0);
      return '<ul>' + pos.sort(function (a, c) { return acc[c] - acc[a]; }).map(function (k) { return '<li>' + esc(SLICE_LABEL[k]) + ': ' + fmt(acc[k] / gross * 100, 0) + '%</li>'; }).join('') + '</ul>';
    }
    return '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Peak load report</title><style>body{font:15px/1.5 system-ui,sans-serif;max-width:760px;margin:32px auto;padding:0 16px;color:#15202B}' +
      'h1{font-size:26px}h2{font-size:18px;margin-top:24px}.big{font-size:28px;font-weight:800}</style></head><body>' +
      '<h1>Peak heating and cooling: ' + esc(D.archetypes.types[S.type].label) + '</h1><p>' + esc(st.label) + ' (climate zone ' + esc(st.climate_zone_stat) + ') · ' +
      area(S.sc.gfa_m2) + ' on ' + fmt(S.sc.n_floors, 0) + ' floors · ' + new Date().toISOString().slice(0, 10) + '</p>' +
      '<p><b>Source:</b> ' + (g.source === 'energyplus' ? 'Full simulation (EnergyPlus ' + esc((S.ep.run.engine || {}).version || '') + ')' : 'Instant estimate (model trained on EnergyPlus runs)') +
      '. Design condition: cooling ' + S.coolPct + '%, heating ' + S.heatPct + '%. Validation-stage tool.</p>' +
      '<h2>Cooling</h2><p class="big">' + fmt(capC(g.clg), isIP() ? 1 : 0) + ' ' + uC() + '</p><p>Busiest moment: ' + esc(busyPhrase(g.cKey, g.time)) + '.</p>' + shares('cooling') +
      '<h2>Heating</h2><p class="big">' + fmt(capH(g.htg), 0) + ' ' + uH() + '</p><p>Busiest moment: ' + esc(busyPhrase(g.hKey, g.hTime)) + '.</p>' + shares('heating') +
      '<h2>Answers changed from typical values</h2>' + (changed.length ? '<ul>' + changed.join('') + '</ul>' : '<p>None: typical values for this type and location.</p>') +
      '</body></html>';
  }

  // ── Actions ─────────────────────────────────────────────────────────────
  function download(name, text, type) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], {type: type}));
    a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }

  // Every EnergyPlus run happens in this browser (ep-browser.js). Progress
  // messages (first-run downloads, running) show on the busy button.
  function engineRun(body) {
    return window.EPBrowser.run(body, function (msg) { S.engineMsg = msg; renderResults(); })
      .then(function (run) { S.engineMsg = null; return run; }, function (e) { S.engineMsg = null; throw e; });
  }

  function runEnergyPlus() {
    S.running = true; S.runError = null; render();
    var sc = JSON.parse(JSON.stringify(S.sc)), hash = scenarioHash(sc);
    engineRun(engineInput(sc))
      .then(function (run) {
        S.running = false;
        if (!run.ok) { S.runError = 'EnergyPlus run failed: ' + (run.error || 'unknown error'); }
        else S.ep = {hash: hash, run: run};
        render();
      })
      .catch(function (e) { S.running = false; S.runError = 'EnergyPlus could not start in this browser: ' + e.message; render(); });
  }

  function onInput(e) {
    var t = e.target;
    var en = t.id && t.id.match(/^f-e-(\w+)$/);
    if (en && en[1] !== 'heatSource') {
      var ev = t.value;
      if (en[1] === 'sfp' && isIP() && ev !== '' && !isNaN(parseFloat(ev))) ev = +fromIP('W/(L/s)', parseFloat(ev)).toFixed(6);
      S.energy[en[1]] = ev; save(); return;
    }
    var rate = t.id && t.id.match(/^f-rate-(cooling|heating)$/);
    if (rate) { S.rates[rate[1]][S.plant[rate[1]]] = rateFromDisp(rate[1], t.value); save(); return; }
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
    if (!isNaN(v) && isIP() && UNITS[unit]) {
      // Typing back the shown default restores the exact SI default.
      var d0 = S.defaults[k];
      v = d0 != null && Math.abs(toDisp(unit, d0) - v) < 1e-9 ? d0 : +fromIP(unit, v).toFixed(6);
    }
    var ok = !isNaN(v) && (spec.min === undefined || (v >= spec.min - 1e-9 && v <= spec.max + 1e-9));
    t.classList.toggle('bad', !ok);
    if (!ok) return;
    S.sc[k] = spec.int ? Math.round(v) : v;
    var ip = document.querySelector('[data-ip="' + k + '"]');
    if (ip) ip.textContent = otherUnits(unit, v);
    hintEl();
    render();
  }

  function onChange(e) {
    var t = e.target;
    if (t.id && /^f-(e-(?!heatSource)|rate-)/.test(t.id)) { render(); return; }
    if (t.id === 'f-type') { S.type = t.value; resetScenario(); S.ep = null; renderInputs(); render(); }
    else if (t.id === 'f-station') {
      S.station = t.value; S.czOverride = null; S.ep = null; S.baseline = null;
      resetScenario(); renderInputs(); render();
    } else if (t.id === 'f-cz') { S.czOverride = t.value || null; resetScenario(); renderInputs(); render(); }
    else if (t.id === 'f-sources') { S.showSources = t.checked; renderInputs(); render(); }
    else if (t.id === 'f-e-heatSource') { S.energy.heatSource = t.value; S.energy.heatEff = ''; renderInputs(); render(); }
    else if (t.id === 'f-plant-cooling' || t.id === 'f-plant-heating') {
      S.plant[t.id === 'f-plant-cooling' ? 'cooling' : 'heating'] = t.value; renderInputs(); render();
    }
  }

  function onClick(e) {
    var t = e.target.closest('button');
    if (!t) return;
    var sg = t.parentNode.getAttribute && t.parentNode.getAttribute('data-seg');
    if (sg) { S[sg] = t.getAttribute('data-v'); render(); return; }
    if (t.getAttribute('data-tab')) { S.tab = t.getAttribute('data-tab'); render(); return; }
    if (t.getAttribute('data-type')) { S.type = t.getAttribute('data-type'); S.sc = null; resetScenario(); S.ep = null; S.baseline = null; render(); return; }
    if (t.getAttribute('data-pk')) {
      var pk = t.getAttribute('data-pk'), pv = +t.getAttribute('data-pv');
      S.sc[pk] = (D.fields[pk] || {}).int ? Math.round(pv) : pv; S.custom[pk] = false; S.rebuild = true; render(); return;
    }
    if (t.getAttribute('data-custom')) {
      var ck = t.getAttribute('data-custom'); S.custom[ck] = true; S.rebuild = true; render();
      var box = document.getElementById('f-' + ck); if (box) box.focus(); return;
    }
    if (t.getAttribute('data-jump')) {
      var sec = document.getElementById(t.getAttribute('data-jump'));
      if (sec) { if (sec.tagName === 'DETAILS') sec.open = true; sec.scrollIntoView({behavior: 'smooth', block: 'start'}); }
      return;
    }
    if (t.getAttribute('data-cat')) { S.typeCat = t.getAttribute('data-cat'); render(); return; }
    if (t.id === 'b-help') { document.getElementById('help').showModal(); return; }
    if (t.id === 'b-help-close') { document.getElementById('help').close(); return; }
    if (t.getAttribute('data-units')) { S.units = t.getAttribute('data-units'); renderStatus(); renderInputs(); render(); return; }
    if (t.id === 'b-reset') { S.sc = null; S.czOverride = null; S.custom = {}; resetScenario(); renderInputs(); render(); }
    else if (t.id === 'b-run') runEnergyPlus();
    else if (t.id === 'b-annual') runAnnual();
    else if (t.id === 'b-epsens') runEpSweep();
    else if (t.id === 'b-opt') { t.disabled = true; t.textContent = 'Searching…'; setTimeout(function () { runOptimizer(); render(); }, 20); }
    else if (t.getAttribute('data-opt-apply') || t.getAttribute('data-opt-apply-run')) {
      var vals = S.opt.picks[t.getAttribute('data-opt-apply') || t.getAttribute('data-opt-apply-run')];
      if (vals) {
        Object.keys(vals).forEach(function (k) { if (vals[k] !== leverValueNow(k)) S.sc = sweepScenario(S.sc, S.defaults, k, vals[k]); });
        renderInputs(); render();
        if (t.getAttribute('data-opt-apply-run') && S.engine && S.engine.available) runEnergyPlus();
      }
    }
    else if (t.id === 'b-base') {
      S.baseline = {sc: JSON.parse(JSON.stringify(S.sc)), ep: S.ep && S.ep.hash === scenarioHash(S.sc) ? S.ep : null};
      render();
    } else if (t.id === 'b-clear') { S.baseline = null; render(); }
    else if (t.id === 'b-report') { var rh = reportHtml(); if (rh) download('peak-load-report-' + S.type + '-' + S.station + '.html', rh, 'text/html'); }
    else if (t.id === 'b-dl-idf' && S.ep) download('peak-load-' + S.type + '-' + S.station + '.idf', S.ep.run.idf || '', 'text/plain');
    else if (t.id === 'b-dl-json' && S.ep) {
      var copy = JSON.parse(JSON.stringify(S.ep.run)); delete copy.idf;
      download('peak-load-' + S.type + '-' + S.station + '.json', JSON.stringify(copy, null, 1), 'application/json');
    }
  }

  // ── Boot ────────────────────────────────────────────────────────────────
  if (!restore()) resetScenario();
  S.engine = window.EPBrowser && window.EPBrowser.supported()
    ? {available: true, version: window.EPBrowser.version, where: 'browser'}
    : {available: false, reason: 'EnergyPlus runs in the browser and needs a current Chrome, Edge, Firefox or Safari.'};
  // Views are rebuilt on every route, so listen on the document.
  document.addEventListener('input', function (e) { onInput(e); onOptInput(e); });
  document.addEventListener('change', function (e) { onChange(e); onOptInput(e); });
  document.addEventListener('toggle', function (e) {
    var g = e.target.getAttribute && e.target.getAttribute('data-g');
    if (g) S.open[g] = e.target.open;
    if (e.target.id === 'sec-advanced') S.open.advanced = e.target.open;
    if (e.target.id === 'eng') S.open.eng = e.target.open;
    if (e.target.id === 'opt-levers') S.opt.showLevers = e.target.open;
    if (e.target.id === 'tech-view') S.techView = e.target.open;
  }, true);
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[data-scroll]');
    if (a) { try { sessionStorage.setItem('scrollTo', a.getAttribute('data-scroll')); } catch (x) { /* no storage */ }
      if (location.hash === a.getAttribute('href')) { e.preventDefault(); route(); } }
    onClick(e);
  });
  window.addEventListener('hashchange', route);
  // Optimizer inputs live in the results panel: store them without
  // re-rendering, so typing keeps focus; the search runs on "Find options".
  function onOptInput(e) {
    var t = e.target, o = S.opt, k;
    if (!t.getAttribute) return;
    if (t.id === 'f-opt-clg') o.clg = t.value;
    else if (t.id === 'f-opt-htg') o.htg = t.value;
    else if ((k = t.getAttribute('data-opt-on'))) (o.levers[k] = o.levers[k] || {}).on = t.checked;
    else if ((k = t.getAttribute('data-opt-lo'))) (o.levers[k] = o.levers[k] || {}).lo = leverFromDisp(k, t.value);
    else if ((k = t.getAttribute('data-opt-hi'))) (o.levers[k] = o.levers[k] || {}).hi = leverFromDisp(k, t.value);
    else if ((k = t.getAttribute('data-opt-cost'))) {
      var cv = parseFloat(t.value), lu = UNITS[unitOf(k)];
      (o.levers[k] = o.levers[k] || {}).cost = isNaN(cv) ? '' : (isIP() && lu ? cv * lu.k : cv);   // stored per SI unit
    }
  }
  route();
})();

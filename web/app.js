// ── Peak Load Tool UI ────────────────────────────────────────────────────────
// Inputs are SI (the engine's units); every value also shows its IP equivalent.
// Results come from one of two sources, always labelled:
//   EnergyPlus run    — engine/run_scenario.py via POST /api/run (option C)
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

  var COMP_LABEL = {
    people: 'People', lighting: 'Lighting', equipment: 'Equipment', window_solar: 'Windows, solar',
    window_conduction: 'Windows, conduction', walls: 'Walls', roof: 'Roof', ground_floor: 'Ground floor (slab)',
    infiltration: 'Infiltration', internal_mass: 'Internal mass (slabs, partitions)',
    ventilation: 'Ventilation (outdoor air)', heat_recovery: 'Heat recovery'
  };

  // ── State ───────────────────────────────────────────────────────────────
  var S = {type: 'office', station: 'chicago', czOverride: null, coolPct: '0.4', heatPct: '99.6',
    sc: null, prov: null, verify: null, defaults: null, baseline: null, ep: null, open: {}, tzLoad: 'cooling',
    tab: 'summary', bdMode: 'abs', showSources: false,
    plant: {cooling: PLANTS.cooling[0], heating: PLANTS.heating[0]}, rates: {cooling: {}, heating: {}},
    energy: {cop: '', heatSource: 'gas', heatEff: '', sfp: '', efElec: '', efGas: ''}, annual: null, annualRunning: false, annualError: null,
    engine: null, running: false, runError: null};

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
        coolPct: S.coolPct, heatPct: S.heatPct, sc: S.sc, baseline: S.baseline, tab: S.tab, bdMode: S.bdMode,
        showSources: S.showSources, plant: S.plant, rates: S.rates, energy: S.energy, annual: S.annual}));
    } catch (e) { /* storage unavailable: state just isn't remembered */ }
  }

  function restore() {
    try {
      var s = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
      if (!s || !D.archetypes.types[s.type]) return false;
      S.type = s.type; S.station = stationById(s.station).id; S.czOverride = s.czOverride || null;
      S.coolPct = s.coolPct || '0.4'; S.heatPct = s.heatPct || '99.6';
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
        (unit === 'bool' ? (def ? 'on' : 'off') : esc(def === null ? 'none' : def)) + ')</span>';
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
    var ip = (IP[unit] && v !== null && v !== '' && v !== undefined) ? IP[unit](+v) : '';
    if (unit === 'bool') {
      return '<div class="field"><label for="f-' + key + '">' + esc(label) + vb + '</label>' +
        '<input id="f-' + key + '" type="checkbox" data-k="' + key + '"' + (v ? ' checked' : '') + ' style="width:auto;justify-self:end">' +
        hint + '</div>';
    }
    var u = unit === '-' || unit === 'deg' ? '' : ' (' + unit.replace('m2', 'm²') + ')';
    return '<div class="field"><label for="f-' + key + '">' + esc(label) + '<span class="unit">' + esc(u) + '</span>' + vb + '</label>' +
      '<input id="f-' + key + '" type="number" inputmode="decimal" data-k="' + key + '" step="' + step + '"' +
      (spec.min !== undefined ? ' min="' + spec.min + '" max="' + spec.max + '"' : '') +
      ' value="' + (v === null || v === undefined ? '' : v) + '">' +
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

  function renderInputs() {
    var st = stationById(S.station), h = '', zone = S.czOverride || stationZone();
    var types = D.archetypes.types;
    h += '<div class="panel-head"><div class="step">Building</div>';
    h += '<div class="field wide"><label for="f-type">Building type</label><select id="f-type">' +
      Object.keys(types).map(function (t) {
        return '<option value="' + t + '"' + (t === S.type ? ' selected' : '') + '>' + esc(types[t].label) + '</option>';
      }).join('') + '</select></div>';
    h += '<div class="field wide"><label for="f-station">Location (weather station)</label><select id="f-station">' +
      D.stations.map(function (s) {
        return '<option value="' + s.id + '"' + (s.id === S.station ? ' selected' : '') + '>' + esc(s.label) + '</option>';
      }).join('') + '</select><span class="hint">Climate zone ' + esc(zone) + (S.czOverride ? ' (set under Advanced)' :
        ' from the weather file') + '. Envelope defaults follow it.</span></div>';
    h += '<label class="toggle"><input type="checkbox" id="f-sources"' + (S.showSources ? ' checked' : '') +
      '> Show where each default comes from</label></div>';
    GROUPS.forEach(function (g) {
      var op = S.open[g.title] === undefined ? g.open : S.open[g.title];
      h += '<details class="grp" data-g="' + esc(g.title) + '"' + (op ? ' open' : '') + '><summary>' + esc(g.title) + '</summary>';
      groupFields(g).forEach(function (f) { h += fieldHtml(f[0], f[1], f[2], f[3]); });
      if (g.title === 'Advanced') {
        h += '<div class="field"><label for="f-cz">Code climate zone (envelope defaults)</label><select id="f-cz">' +
          '<option value="">From weather file (' + esc(stationZone()) + ')</option>' +
          envZones().map(function (z) {
            return '<option value="' + z + '"' + (z === S.czOverride ? ' selected' : '') + '>' + z + '</option>';
          }).join('') + '</select><span class="hint">Only if the project\'s county zone (ASHRAE 169) differs from the ' +
          'zone computed from the weather data (' + esc(st.climate_zone_stat) + '). Changing it resets the envelope defaults.</span></div>';
      }
      h += '</details>';
    });
    var E = S.energy, heatEffLabel = E.heatSource === 'gas' ? 'Boiler efficiency (fraction, e.g. 0.9)' :
      (E.heatSource === 'heatpump' ? 'Heat pump heating COP' : '');
    h += '<details class="grp" data-g="Energy and carbon"' + (S.open['Energy and carbon'] ? ' open' : '') + '><summary>Energy and carbon</summary>' +
      '<p class="sub">Used to turn the annual run\'s heating and cooling into electricity and gas, and those into carbon. ' +
      'Your values: the tool has no built-in efficiencies or emission factors.</p>' +
      energyField('cop', 'Cooling plant COP (kW cooling per kW electric)', 0.1) +
      '<div class="field"><label for="f-e-heatSource">Heating source</label><select id="f-e-heatSource">' +
      [['gas', 'Gas boiler'], ['electric', 'Electric resistance'], ['heatpump', 'Heat pump']].map(function (o) {
        return '<option value="' + o[0] + '"' + (E.heatSource === o[0] ? ' selected' : '') + '>' + o[1] + '</option>';
      }).join('') + '</select></div>' +
      (heatEffLabel ? energyField('heatEff', heatEffLabel, 0.01) : '') +
      energyField('sfp', 'Fan power (W per L/s of supply air)', 0.1) +
      energyField('efElec', 'Electricity carbon factor (kg CO₂e per kWh)', 0.001) +
      (E.heatSource === 'gas' ? energyField('efGas', 'Gas carbon factor (kg CO₂e per therm)', 0.01) : '') + '</details>';
    h += '<details class="grp" data-g="Plant cost"' + (S.open['Plant cost'] ? ' open' : '') + '><summary>Plant cost</summary>' +
      '<p class="sub">Your installed-cost rates per plant type. The tool has no built-in cost data.</p>';
    ['cooling', 'heating'].forEach(function (kind) {
      var unit = kind === 'cooling' ? '$ per ton' : '$ per MBH', cur = S.plant[kind];
      h += '<div class="field wide"><label for="f-plant-' + kind + '">' + (kind === 'cooling' ? 'Cooling plant' : 'Heating plant') + '</label>' +
        '<select id="f-plant-' + kind + '">' + PLANTS[kind].map(function (p) {
          return '<option' + (p === cur ? ' selected' : '') + '>' + esc(p) + '</option>';
        }).join('') + '</select></div>' +
        '<div class="field"><label for="f-rate-' + kind + '">' + esc(cur) + ' (' + unit + ')</label>' +
        '<input id="f-rate-' + kind + '" type="number" min="0" step="10" value="' + esc(S.rates[kind][cur] || '') + '"></div>';
    });
    h += '</details>';
    h += '<div class="actions"><button class="btn" id="b-reset" type="button">Reset to defaults</button></div>';
    document.getElementById('inputs').innerHTML = h;
  }

  function energyField(k, label, step) {
    return '<div class="field"><label for="f-e-' + k + '">' + esc(label) + '</label><input id="f-e-' + k +
      '" type="number" min="0" step="' + step + '" value="' + esc(S.energy[k]) + '"></div>';
  }

  // ── Rendering: shared pieces ────────────────────────────────────────────
  function renderStatus() {
    var mk = modelKeyFor(S.type, S.station), e = S.engine, m = mk && SUR_INDEX[mk], h = '';
    if (e === null) h += '<span class="pill"><span class="dot"></span>EnergyPlus: checking…</span>';
    else if (e.available) h += '<span class="pill ok"><span class="dot"></span>EnergyPlus ' + esc(e.version) + ' online</span>';
    else h += '<span class="pill off" title="' + esc(e.reason || '') + '"><span class="dot"></span>EnergyPlus offline</span>';
    if (m) {
      var passed = !(m.holdout && m.holdout.passed === false);
      h += '<span class="pill ' + (passed ? 'ok' : 'off') + '"><span class="dot"></span>Instant estimates: ' +
        (passed ? 'tested' : 'not used here') + '</span>';
    } else h += '<span class="pill off"><span class="dot"></span>Instant estimates: none for this type/station</span>';
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
    h += '<div class="kpi cool"><div class="kpi-label">Peak cooling (block)</div><div class="kpi-value">' + fmt(t, 1) + '<span class="kpi-unit">tons</span></div>' +
      '<div class="kpi-sec">' + fmt(g.clg / 1000, 0) + ' kW · ' + fmt(g.clg / g.gfa, 1) + ' W/m² · ' + fmt(ft2 / t, 0) + ' ft²/ton</div>' +
      deltaHtml(t, b && tons(b.clg), function (v) { return fmt(v, 1) + ' tons'; }) + '</div>';
    h += '<div class="kpi heat"><div class="kpi-label">Peak heating (block)</div><div class="kpi-value">' + fmt(m, 0) + '<span class="kpi-unit">MBH</span></div>' +
      '<div class="kpi-sec">' + fmt(g.htg / 1000, 0) + ' kW · ' + fmt(g.htg / g.gfa, 1) + ' W/m² · ' + fmt(m * 1000 / ft2, 1) + ' Btu/h·ft²</div>' +
      deltaHtml(m, b && mbh(b.htg), function (v) { return fmt(v, 0) + ' MBH'; }) + '</div>';
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
        (engineOn ? 'Click <b>Run EnergyPlus</b> to calculate this scenario.' : 'Start the tool with <code>python server.py</code> on a machine with EnergyPlus installed to calculate this scenario.');
    } else if (res.reason === 'incompatible') {
      h += 'The trained model for this building type and station was fitted by an older version of the tool.<br>' +
        'Re-run <code>python engine/fit_surrogate.py</code> (no new EnergyPlus runs needed), then reload this page.';
    } else if (res.reason === 'fixed') {
      h += 'The instant estimate was trained with these inputs held fixed, and you have changed them: ' + res.fixedDiffs.map(function (d) {
        return '<b>' + esc(d.input) + '</b> (trained ' + esc(d.trained === null ? 'none' : d.trained) + ', now ' + esc(d.value === null ? 'none' : d.value) + ')';
      }).join(', ') + '.<br>Click <b>Run EnergyPlus</b> for this scenario.';
    } else {
      h += 'No trained model for ' + esc(D.archetypes.types[S.type].label) + ' in ' + esc(stationById(S.station).label) + ' yet.<br>' +
        (engineOn ? 'Click <b>Run EnergyPlus</b> to calculate this scenario.' : 'Start the tool with <code>python server.py</code> on a machine with EnergyPlus installed.');
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
        bars.push({name: (x[0] === 'db' ? 'Dry-bulb day ' : 'Dew-point day ') + p + '%', short: x[2], v: tons(x[1].total_w * cf),
          base: bb ? tons(bb.total_w * b.cf) : null, strong: x[0] === gov && p === S.coolPct});
      });
      cg.push({label: p + '%' + (p === S.coolPct ? ' (selected)' : ''), bars: bars});
    });
    var hg = ['99.6', '99'].map(function (p) {
      var r = dd['htg_' + p], bb = bdd && bdd['htg_' + p];
      return {label: p + '%' + (p === S.heatPct ? ' (selected)' : ''), bars: r ? [{name: 'Heating ' + p + '%', short: '',
        v: mbh(r.total_w * hf), base: bb ? mbh(bb.total_w * b.hf) : null, strong: p === S.heatPct}] : []};
    });
    var h = '<div class="card"><div class="card-head"><div><h2>Peak loads by design condition</h2>' +
      '<p class="sub">Every ASHRAE design day in the station\'s weather file. Cooling is governed by the larger of the dry-bulb (DB) and ' +
      'dew-point (DP) day; the solid bars are the selected condition' + (b ? '; black lines mark the baseline' : '') + '.</p></div></div>';
    h += '<div class="chart-pair">' + barChart(cg, 'var(--cool)', 'tons', 1, 'Cooling') +
      barChart(hg, 'var(--heat)', 'MBH', 0, 'Heating', 340) + '</div>';
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
    var factor = cooling ? g.cf : g.hf, conv = cooling ? tons : mbh, unit = cooling ? 'tons' : 'MBH', dp = cooling ? 1 : 0;
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
    var pct = S.bdMode === 'pct';
    var mx = Math.max.apply(null, rows.map(function (r) { return Math.abs(pct ? r.pct : r.w); }).concat([1e-9]));
    var hasNeg = rows.some(function (r) { return r.w < 0; }), zero = hasNeg ? 30 : 0;
    rows.forEach(function (r) {
      // Positive bars run right from the zero line; credits run left into the space before it.
      var v = pct ? r.pct : r.w, w = Math.abs(v) / mx * (100 - zero);
      var shown = pct ? fmt(r.pct, 1) + '%' : fmt(conv(r.w), dp) + ' ' + unit;
      var bv = base && base[r.key], d = bv ? (pct ? r.pct - bv.pct : conv(r.w) - conv(bv.w)) : null;
      h += '<div class="bd-row"><div class="bd-name">' + esc(COMP_LABEL[r.key]) + '</div>' +
        '<div class="bd-bar"><div class="fill ' + kind + (v < 0 ? ' neg' : '') + '" style="left:' + (v < 0 ? zero - w * zero / (100 - zero) : zero) +
        '%;width:' + (v < 0 ? w * zero / (100 - zero) : w) + '%"></div>' + (hasNeg ? '<div class="zero" style="left:' + zero + '%"></div>' : '') + '</div>' +
        '<div class="bd-val num">' + shown + (d != null && Math.abs(d) > 0.05 ? ' <span class="' + (d < 0 ? 'good' : 'bad') + '">' +
          (d > 0 ? '+' : '−') + fmt(Math.abs(d), pct ? 1 : dp) + (pct ? ' pt' : '') + '</span>' : '') + '</div></div>';
    });
    var total = block.total_w * factor;
    h += '<div class="bd-total"><span>Total</span><span class="num">' + (pct ? '100%' : fmt(conv(total), dp) + ' ' + unit) + '</span></div></div>';
    return h;
  }

  function breakdownCard(g, b) {
    var h = '<div class="card"><div class="card-head"><div><h2>Where the peak load comes from</h2>' +
      '<p class="sub">Each peak split by source, at the hour the whole building peaks. Negative bars are credits (heat stored in slabs, ' +
      'heat recovered).' + (b ? ' Coloured figures are the change from the baseline.' : '') + '</p></div>' +
      seg('bdMode', [['abs', 'Absolute'], ['pct', '% of peak']], S.bdMode) + '</div>';
    h += '<div class="bd-pair">' + breakdownPanel('cooling', g, b) + breakdownPanel('heating', g, b) + '</div>';
    h += '<p class="sub" style="margin:10px 0 0">Method: the zone part of each peak is split in the proportions of EnergyPlus\'s Zone ' +
      'Component Load Summary; ventilation and heat recovery come from the system at the peak hour. Heating counts sensible loads only.</p></div>';
    return h;
  }

  // ── Summary: sensitivity (always shown when a model exists) ─────────────
  function sensitivityCard() {
    var mk = modelKeyFor(S.type, S.station), m = mk && SUR[mk];
    var head = '<div class="card"><div class="card-head"><div><h2>Which design choices move the peak most</h2></div>' +
      seg('tzLoad', [['cooling', 'Cooling'], ['heating', 'Heating']], S.tzLoad) + '</div>';
    if (!m) {
      if (mk && SUR_INDEX[mk]) { loadModel(mk); return head + '<p class="sub">Loading the trained model…</p></div>'; }
      return head + '<p class="sub">No trained model for this building type and station, so there is no instant sensitivity.</p></div>';
    }
    var res = C.surrogateResult(m, S.sc);
    if (res.incompatible) return head + '<p class="sub">The trained model is from an older version of the tool; refit it.</p></div>';
    var g = governed(res, S.sc), heating = S.tzLoad === 'heating', ddKey = heating ? g.hKey : g.cKey;
    var out = ddKey + '|total_w_m2';
    if (!m.outputs[out]) return head + '</div>';
    var failed = C.failedTest(m, S.type), notes = '';
    if (failed) {
      notes += '<div class="note warn">The model for this type and station missed the accuracy limit (' + fmt(failed.worst, 1) +
        '%), so its bars are indicative: the direction and ranking are a guide, the sizes are not. Confirm a chosen option with Run EnergyPlus.</div>';
    }
    if (res.fixedDiffs.length) {
      notes += '<div class="note warn">You have changed inputs the model held fixed (' + res.fixedDiffs.map(function (d) { return esc(d.input); }).join(', ') +
        '); the bars are for the trained values of those inputs.</div>';
    }
    var space = D.design_space.sampled, sc0 = S.sc, def = S.defaults;
    var base = C.predict(m, sc0).perM2[out];
    var unit = heating ? 'MBH' : 'tons', dp = heating ? 0 : 1;
    var conv = heating ? sc0.gfa_m2 / 1000 * C.MBH_PER_KW * sc0.heating_sizing_factor
      : sc0.gfa_m2 / 1000 / C.KW_PER_TON * sc0.cooling_sizing_factor;
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
    // Inputs with no effect (e.g. lighting on the heating design day) are left out.
    var small = heating ? 0.5 : 0.05;
    rows = rows.filter(function (r) { return r.span >= small; })
      .sort(function (a, b) { return b.span - a.span; }).slice(0, 10);
    var mx = Math.max.apply(null, rows.map(function (r) { return Math.max(Math.abs(r.dl), Math.abs(r.dh)); })) || 1;
    var load = heating ? 'heating' : 'cooling';
    var h = head + '<p class="sub">Each row tries one input at the low and high end of its realistic range, everything else as you have ' +
      'set it. Longest bars = biggest levers. <span class="good">Green</span>: peak ' + load + ' goes down; ' +
      '<span class="bad">red</span>: it goes up.' +
      (heating ? ' The heating design day has no sun and no people, lighting or equipment, so those inputs do not appear.' : '') +
      '</p>' + notes + '<div class="tz">';
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

  // ── Summary: plant cost ─────────────────────────────────────────────────
  function costCard(g, b) {
    var ct = parseFloat(S.rates.cooling[S.plant.cooling]), cm = parseFloat(S.rates.heating[S.plant.heating]);
    var t = tons(g.clg), m = mbh(g.htg);
    var h = '<div class="card"><h2>Plant cost</h2><p class="sub">Capacity × your installed-cost rate for the plant types chosen under ' +
      '"Plant cost" (left panel). Sizing factors included.</p>';
    if (isNaN(ct) && isNaN(cm)) {
      return h + '<div class="empty">Enter your $/ton and $/MBH rates under <b>Plant cost</b> to price the plant.</div></div>';
    }
    function cell(label, cap, capUnit, rate, rateUnit, bcap) {
      if (isNaN(rate)) return '<div class="kpi"><div class="kpi-label">' + esc(label) + '</div><div class="kpi-sec">No rate entered</div></div>';
      var cost = cap * rate, bcost = bcap != null ? bcap * rate : null;
      return '<div class="kpi"><div class="kpi-label">' + esc(label) + '</div><div class="kpi-value">$' + fmt(cost, 0) + '</div>' +
        '<div class="kpi-sec">' + fmt(cap, capUnit === 'tons' ? 1 : 0) + ' ' + capUnit + ' × $' + fmt(rate, 0) + rateUnit + '</div>' +
        deltaHtml(cost, bcost, function (v) { return '$' + fmt(v, 0); }) + '</div>';
    }
    var tot = (isNaN(ct) ? 0 : t * ct) + (isNaN(cm) ? 0 : m * cm);
    var btot = b ? (isNaN(ct) ? 0 : tons(b.clg) * ct) + (isNaN(cm) ? 0 : mbh(b.htg) * cm) : null;
    h += '<div class="kpis">' + cell('Cooling · ' + S.plant.cooling, t, 'tons', ct, '/ton', b && tons(b.clg)) +
      cell('Heating · ' + S.plant.heating, m, 'MBH', cm, '/MBH', b && mbh(b.htg)) +
      '<div class="kpi"><div class="kpi-label">Total plant</div><div class="kpi-value">$' + fmt(tot, 0) + '</div>' +
      deltaHtml(tot, btot, function (v) { return '$' + fmt(v, 0); }) + '</div></div>';
    h += '<p class="sub" style="margin:8px 0 0">Linear $/capacity only. Real equipment comes in discrete sizes and redundancy (N+1) steps, ' +
      'so check a change against the next size up or down before banking it.</p></div>';
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
        (S.annualRunning ? 'Running a full year in EnergyPlus…' : 'Run annual energy') + '</button></div>' +
        '<p class="sub" style="margin-top:8px">' + (engineOn ? 'Typically a minute or two; the weather file is downloaded on first use.' :
          'Needs EnergyPlus (start the tool with python server.py on a machine with EnergyPlus).') + '</p></div>';
      return h;
    }
    var f = annualFigures(run.annual), t = f.total, ft2 = S.sc.gfa_m2 * C.FT2_PER_M2;
    var site = (t.elec != null && t.gas_kwh != null) ? (t.elec + t.gas_kwh) * KBTU_PER_KWH / ft2 : null;
    h += '<div class="kpis">' +
      '<div class="kpi"><div class="kpi-label">Electricity</div><div class="kpi-value">' + (t.elec != null ? fmt(t.elec / 1000, 0) : '–') + '<span class="kpi-unit">MWh/yr</span></div>' +
        '<div class="kpi-sec">' + (t.elec != null ? fmt(t.elec / S.sc.gfa_m2, 0) + ' kWh/m²' : 'needs ' + esc(t.missing.filter(function (x) { return x.indexOf('carbon') < 0; }).join(', '))) + '</div></div>' +
      (S.energy.heatSource === 'gas' ? '<div class="kpi"><div class="kpi-label">Gas</div><div class="kpi-value">' + (t.therms != null ? fmt(t.therms, 0) : '–') +
        '<span class="kpi-unit">therms/yr</span></div><div class="kpi-sec">' + (t.therms != null ? fmt(t.gas_kwh / 1000, 0) + ' MWh' : 'needs boiler efficiency') + '</div></div>' : '') +
      '<div class="kpi"><div class="kpi-label">Site EUI</div><div class="kpi-value">' + (site != null ? fmt(site, 1) : '–') + '<span class="kpi-unit">kBtu/ft²·yr</span></div>' +
        '<div class="kpi-sec">' + (site != null ? fmt(site / KBTU_PER_KWH * C.FT2_PER_M2, 0) + ' kWh/m²·yr' : '') + '</div></div>' +
      '<div class="kpi"><div class="kpi-label">Operational carbon</div><div class="kpi-value">' + (t.co2 != null ? fmt(t.co2 / 1000, 0) : '–') + '<span class="kpi-unit">t CO₂e/yr</span></div>' +
        '<div class="kpi-sec">' + (t.co2 != null ? fmt(t.co2 / S.sc.gfa_m2, 1) + ' kg/m²' : 'needs ' + esc(t.missing.join(', '))) + '</div></div></div>';
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
      fmt(run.engine.run_seconds, 0) + ' s. No economizer is modelled, so cooling in mild weather is an upper bound. ' +
      'Typical-year weather, not a forecast for a specific year.</p>' +
      '<div class="actions"><button class="btn" type="button" id="b-annual">Run again</button></div></div>';
    return h;
  }

  function runAnnual() {
    S.annualRunning = true; S.annualError = null; render();
    var sc = JSON.parse(JSON.stringify(S.sc)), hash = scenarioHash(sc), body = engineInput(sc);
    body.annual = true;
    fetch('api/run', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body)})
      .then(function (r) { return r.json(); })
      .then(function (run) {
        S.annualRunning = false;
        if (!run.ok) S.annualError = 'Annual run failed: ' + (run.error || 'unknown error');
        else { delete run.idf; S.annual = {hash: hash, run: run}; }
        render();
      })
      .catch(function (e) { S.annualRunning = false; S.annualError = 'Could not reach the EnergyPlus service: ' + e.message; render(); });
  }

  // ── Detailed data ───────────────────────────────────────────────────────
  function detailKpis(g, b) {
    var ft2 = g.gfa * C.FT2_PER_M2, cfm = g.supply != null ? g.supply * C.CFM_PER_M3S : null, h = '<div class="kpis">';
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
    var kw = function (w) { return w / 1000; }, cfm = function (m) { return m * C.CFM_PER_M3S; };
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
    return h + '</tbody></table></div>';
  }

  function designConditionsCard() {
    var st = stationById(S.station), dd = st.design_days;
    function row(key, sel) {
      var r = dd[key];
      if (!r) return '';
      var hum = r.mcwb_c != null ? r.mcwb_c : r.dp_c;
      return '<tr' + (sel ? ' class="sel"' : '') + '><td>' + DD_LABEL[key] + '</td>' +
        '<td class="num">' + fmt(r.db_c, 1) + ' °C / ' + fmt(r.db_c * 9 / 5 + 32, 1) + ' °F</td>' +
        '<td class="num">' + (hum == null ? '–' : fmt(hum, 1) + ' °C / ' + fmt(hum * 9 / 5 + 32, 1) + ' °F') + '</td>' +
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
      ' (outdoor ' + fmt(g.oat, 1) + ' °C). Governing heating day: <b>' + esc(DD_LABEL[g.hKey] || g.hKey) + '</b>. ' +
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
    var h = '<div class="card"><h2>Defaults still awaiting confirmation</h2><p class="sub">These inputs are at their default and the default ' +
      'has not been checked against its cited source. Change or confirm them before using results for sizing.</p>' +
      '<div class="scroll-x"><table class="t"><thead><tr><th>Input</th><th>Value</th><th>Source</th></tr></thead><tbody>';
    rows.forEach(function (k) {
      h += '<tr><td>' + esc(k) + '</td><td class="num">' + esc(S.sc[k]) + '</td><td style="text-align:left">' + esc(S.prov[k]) + '</td></tr>';
    });
    return h + '</tbody></table></div></div>';
  }

  // ── Results page ────────────────────────────────────────────────────────
  function renderResults() {
    var res = resultFor(S.sc, S.ep), g = res.source === 'none' ? null : governed(res, S.sc);
    var b = null;
    if (S.baseline) {
      var bRes = resultFor(S.baseline.sc, S.baseline.ep);
      b = bRes.source === 'none' ? null : governed(bRes, S.baseline.sc);
    }
    var engineOn = S.engine && S.engine.available;
    var h = '<div class="card"><div class="card-head"><div><h2>Peak loads</h2><p class="sub">' +
      esc(D.archetypes.types[S.type].label) + ' · ' + esc(stationById(S.station).label) + '</p></div>' +
      '<div>' + sourceBadge(g) + '</div></div>';
    h += '<div class="conds"><span>Cooling design condition</span>' + seg('coolPct', [['0.4', '0.4%'], ['1', '1%'], ['2', '2%']], S.coolPct) +
      '<span>Heating</span>' + seg('heatPct', [['99.6', '99.6%'], ['99', '99%']], S.heatPct) + '</div>';
    if (g) {
      h += headlineKpis(g, b);
      if (g.source === 'surrogate') h += surrogateNotes(res, g);
      if (g.cf !== 1 || g.hf !== 1) h += '<div class="note info">Includes sizing factors: cooling ×' + fmt(g.cf, 2) + ', heating ×' + fmt(g.hf, 2) + '.</div>';
      if (b && b.source !== g.source) h += '<div class="note warn">Baseline and current come from different sources (' + b.source + ' vs ' + g.source + '). Compare like with like before quoting the difference.</div>';
    } else {
      h += noResultHtml(res);
    }
    if (S.runError) h += '<div class="note bad">' + esc(S.runError) + '</div>';
    h += '<div class="actions">' +
      '<button class="btn primary" type="button" id="b-run"' + (engineOn && !S.running ? '' : ' disabled') + '>' +
      (S.running ? 'Running EnergyPlus…' : 'Run EnergyPlus') + '</button>' +
      '<button class="btn" type="button" id="b-base"' + (g ? '' : ' disabled') + '>Set as baseline</button>' +
      (S.baseline ? '<button class="btn" type="button" id="b-clear">Clear baseline</button>' : '') + '</div>';
    if (!engineOn && S.engine) h += '<p class="sub" style="margin-top:8px">' + esc(S.engine.reason || 'EnergyPlus service unavailable') + '</p>';
    h += '</div>';
    h += '<div class="tabs" role="tablist">' +
      '<button type="button" role="tab" data-tab="summary"' + (S.tab === 'summary' ? ' class="on" aria-selected="true"' : '') + '>Summary</button>' +
      '<button type="button" role="tab" data-tab="details"' + (S.tab === 'details' ? ' class="on" aria-selected="true"' : '') + '>Detailed data</button></div>';
    if (S.tab === 'summary') {
      if (g) h += designDayCard(g, b) + breakdownCard(g, b);
      h += sensitivityCard();
      if (g) h += costCard(g, b);
      h += annualCard();
    } else {
      if (g) {
        h += '<div class="card"><h2>Peak load detail</h2><p class="sub">Selected condition: cooling ' + S.coolPct + '%, heating ' + S.heatPct + '%.</p>' +
          detailKpis(g, b) + compareTable(g, b) + '</div>';
        if (g.source === 'energyplus') h += energyplusCard(res, g);
      }
      h += designConditionsCard() + assumptionsCard();
    }
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
    var en = t.id && t.id.match(/^f-e-(\w+)$/);
    if (en && en[1] !== 'heatSource') { S.energy[en[1]] = t.value; renderResults(); save(); return; }
    var rate = t.id && t.id.match(/^f-rate-(cooling|heating)$/);
    if (rate) { S.rates[rate[1]][S.plant[rate[1]]] = t.value; renderResults(); save(); return; }
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
    if (t.id === 'f-type') { S.type = t.value; resetScenario(); S.ep = null; renderInputs(); render(); }
    else if (t.id === 'f-station') {
      S.station = t.value; S.czOverride = null; S.ep = null; S.baseline = null;
      resetScenario(); renderInputs(); render();
    } else if (t.id === 'f-cz') { S.czOverride = t.value || null; resetScenario(); renderInputs(); render(); }
    else if (t.id === 'f-sources') { S.showSources = t.checked; renderInputs(); save(); }
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
    if (t.id === 'b-reset') { S.sc = null; S.czOverride = null; resetScenario(); renderInputs(); render(); }
    else if (t.id === 'b-run') runEnergyPlus();
    else if (t.id === 'b-annual') runAnnual();
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
    .catch(function () { S.engine = {available: false, reason: 'No EnergyPlus service (page opened without python server.py).'}; render(); });
})();

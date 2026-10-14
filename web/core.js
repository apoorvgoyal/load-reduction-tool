// ── Peak-load tool: pure logic (no DOM) ──────────────────────────────────────
// Used by web/app.js in the browser and by engine/tests under Node.
// Mirrors engine/lib/scenario.py (defaults) and engine/lib/features.py (surrogate
// features); engine/tests/test_features_parity.py checks they agree.
(function (root) {
  var KW_PER_TON = 3.516853;      // 12,000 Btu/h
  var MBH_PER_KW = 3.412142;      // 1 kW = 3,412.142 Btu/h
  var CFM_PER_M3S = 2118.88;
  var FT2_PER_M2 = 10.7639;

  var FEATURES = ['wwr', 'wall_u', 'roof_u', 'win_u', 'shgc', 'overhang_pf',
    'people_per_m2', 'lpd_w_m2', 'epd_w_m2', 'oa_ls_m2',
    'erv_sensible_eff', 'erv_latent_eff', 'infiltration_ach',
    't_cool_c', 't_heat_c', 'n_floors', 'aspect_ratio', 'floor_plate_m2', 'north_axis_fold'];

  // Placeholders for project geometry with no standard default (scenario.py).
  var PLACEHOLDERS = {gfa_m2: 10000, n_floors: 4, aspect_ratio: 1.5, north_axis_deg: 0, overhang_pf: 0,
    erv_sensible_eff: 0, erv_latent_eff: 0, setback_heat_c: null, setup_cool_c: null, thermal_mass: true};

  function defaults(data, type, cz) {
    var arch = data.archetypes, sc = {}, prov = {}, verify = {};
    Object.keys(PLACEHOLDERS).forEach(function (k) {
      sc[k] = PLACEHOLDERS[k];
      prov[k] = 'placeholder (no standard default - set per project)';
    });
    Object.keys(arch.common).forEach(function (k) {
      sc[k] = arch.common[k].value; prov[k] = arch.common[k].source; verify[k] = !!arch.common[k].verify;
    });
    var t = arch.types[type];
    Object.keys(t).forEach(function (k) {
      if (t[k] && typeof t[k] === 'object' && 'value' in t[k]) {
        sc[k] = t[k].value; prov[k] = t[k].source; verify[k] = !!t[k].verify;
      }
    });
    var env = arch.envelope_by_climate_zone[cz];
    if (env) {
      Object.keys(env).forEach(function (k) {
        sc[k] = env[k];
        prov[k] = arch.envelope_by_climate_zone._source + ' [CZ ' + cz + ']';
        verify[k] = !!arch.envelope_by_climate_zone._verify;
      });
    }
    sc.type = type;
    sc.climate_zone = cz;
    return {scenario: sc, provenance: prov, verify: verify};
  }

  function features(sc) {
    var ppl = 1 / sc.m2_per_person;
    var ax = ((sc.north_axis_deg % 180) + 180) % 180;
    return [sc.wwr, sc.wall_u, sc.roof_u, sc.win_u, sc.shgc, sc.overhang_pf,
      ppl, sc.lpd_w_m2, sc.epd_w_m2, sc.oa_per_person_ls * ppl + sc.oa_per_area_ls_m2,
      sc.erv_sensible_eff, sc.erv_latent_eff, sc.infiltration_ach,
      sc.t_cool_c, sc.t_heat_c, +sc.n_floors, sc.aspect_ratio, sc.gfa_m2 / sc.n_floors, ax];
  }

  function expand(z) {
    var out = [1], d = z.length, i, j;
    for (i = 0; i < d; i++) out.push(z[i]);
    for (i = 0; i < d; i++) for (j = i; j < d; j++) out.push(z[i] * z[j]);
    return out;
  }

  function dot(a, b) { var s = 0; for (var i = 0; i < a.length; i++) s += a[i] * b[i]; return s; }

  function sameValue(a, b) {
    if (a === null || a === undefined) return b === null || b === undefined;
    if (typeof a === 'boolean' || typeof b === 'boolean') return !!a === !!b;
    return Math.abs(+a - +b) < 1e-6;
  }

  // Evaluate a fitted model. Returns per-m2 outputs plus applicability flags.
  function predict(model, sc) {
    var x = features(sc), z = [], i;
    var extrap = [];
    for (i = 0; i < x.length; i++) {
      z.push((x[i] - model.feature_mean[i]) / model.feature_std[i]);
      // Sampling rarely lands exactly on a bound (e.g. ERV = 0), so allow 3% of
      // the trained span before calling a point an extrapolation.
      var lo = model.feature_min[i], hi = model.feature_max[i], tol = 1e-9 + 0.03 * Math.abs(hi - lo);
      if (x[i] < lo - tol || x[i] > hi + tol) extrap.push({feature: FEATURES[i], value: x[i], min: lo, max: hi});
    }
    var fixedDiffs = [];
    Object.keys(model.fixed_inputs || {}).forEach(function (k) {
      if (!sameValue(model.fixed_inputs[k], sc[k])) fixedDiffs.push({input: k, trained: model.fixed_inputs[k], value: sc[k]});
    });
    var X = expand(z), out = {};
    Object.keys(model.outputs).forEach(function (name) { out[name] = dot(model.outputs[name].coef, X); });
    return {perM2: out, extrapolated: extrap, fixedDiffs: fixedDiffs};
  }

  // Evaluate one output directly from a feature vector (sensitivity sweeps).
  function predictFeatures(model, x, output) {
    var z = x.map(function (v, i) { return (v - model.feature_mean[i]) / model.feature_std[i]; });
    return dot(model.outputs[output].coef, expand(z));
  }

  // Convert surrogate per-m2 outputs into the common result shape.
  function surrogateResult(model, sc, factors) {
    var p = predict(model, sc), dd = {}, gfa = sc.gfa_m2;
    Object.keys(p.perM2).forEach(function (name) {
      var parts = name.split('|'), key = parts[0], metric = parts[1];
      var r = dd[key] || (dd[key] = {key: key, kind: key.indexOf('htg') === 0 ? 'heating' : 'cooling'});
      var v = p.perM2[name], err = model.outputs[name].cv.p95_abs_pct;
      if (metric === 'total_w_m2') { r.total_w = v * gfa; r.err_pct = err; }
      else if (metric === 'sensible_w_m2') r.sensible_w = v * gfa;
      else if (metric === 'latent_w_m2') r.latent_w = v * gfa;
      else if (metric === 'oa_w_m2') r.outdoor_air_w = v * gfa;
      else if (metric === 'supply_ls_m2') r.supply_air_m3s = v * gfa / 1000;
      else if (metric === 'sum_of_peaks_w_m2') r.sum_of_zone_peaks_w = v * gfa;
    });
    return {source: 'surrogate', gfa: gfa, dd: dd, extrapolated: p.extrapolated, fixedDiffs: p.fixedDiffs,
      model: {n: model.n_samples, eplus: model.eplus_versions, fitted: model.fitted_at}};
  }

  // Convert an EnergyPlus run (engine/run_scenario.py JSON) into the same shape.
  function energyplusResult(run) {
    var dd = {};
    Object.keys(run.design_days || {}).forEach(function (k) {
      var d = run.design_days[k], b = d.block;
      dd[k] = {key: k, kind: d.kind, total_w: b.total_w, sensible_w: b.sensible_w, latent_w: b.latent_w,
        outdoor_air_w: b.outdoor_air_w, supply_air_m3s: b.supply_air_m3s, outdoor_air_m3s: b.outdoor_air_m3s,
        sum_of_zone_peaks_w: d.sum_of_zone_peaks_w, time: b.time, outdoor_db_c: b.outdoor_db_c,
        profile: d.profile};
    });
    return {source: 'energyplus', gfa: run.scenario.gfa_m2, dd: dd, run: run};
  }

  // Governing design days for the chosen percentiles; sizing factors applied
  // on top (reported separately so the unfactored load stays visible).
  function governing(result, coolingPct, heatingPct) {
    var a = result.dd['clg_db_' + coolingPct], b = result.dd['clg_dp_' + coolingPct];
    var clg = (a && b) ? (b.total_w > a.total_w ? b : a) : (a || b || null);
    var htg = result.dd['htg_' + heatingPct] || null;
    return {cooling: clg, heating: htg};
  }

  var api = {
    FEATURES: FEATURES, defaults: defaults, features: features, expand: expand, predict: predict, predictFeatures: predictFeatures,
    surrogateResult: surrogateResult, energyplusResult: energyplusResult, governing: governing,
    KW_PER_TON: KW_PER_TON, MBH_PER_KW: MBH_PER_KW, CFM_PER_M3S: CFM_PER_M3S, FT2_PER_M2: FT2_PER_M2
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.LoadsCore = api;
})(this);

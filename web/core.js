// ── Peak-load tool: pure logic (no DOM) ──────────────────────────────────────
// Used by web/app.js in the browser and by engine/tests under Node.
// Mirrors engine/lib/scenario.py (defaults) and engine/lib/features.py (surrogate
// features); engine/tests/test_features_parity.py checks they agree.
(function (root) {
  var KW_PER_TON = 3.516853;      // 12,000 Btu/h
  var MBH_PER_KW = 3.412142;      // 1 kW = 3,412.142 Btu/h
  var CFM_PER_M3S = 2118.88;
  var FT2_PER_M2 = 10.7639;

  var FEATURES = [
    'ext_wall_m2_per_m2', 'window_m2_per_m2', 'wall_ua_per_m2', 'window_ua_per_m2', 'roof_ua_per_m2',
    'slab_fp_per_m2', 'infiltration_m3h_per_m2', 'solar_aperture_per_m2', 'shaded_aperture_per_m2',
    'oa_ls_m2', 'oa_after_sensible_hr', 'oa_after_latent_hr',
    'lpd_w_m2', 'epd_w_m2', 'people_per_m2', 't_cool_c', 't_heat_c', 'core_fraction',
    'orient_cos2', 'orient_sin2', 'aspect_ratio',
    'occ_hours_frac', 'occ_peak_overlap', 'occ_overnight'];

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

  // Physics-shaped features per m2 of floor area (see engine/lib/features.py).
  function features(sc) {
    var n = +sc.n_floors, gfa = sc.gfa_m2, h = sc.floor_to_floor_m;
    var a = gfa / n, length = Math.sqrt(a * sc.aspect_ratio), width = a / length;
    var perim = 2 * (length + width), ew = perim * h * n / gfa;
    var ppl = 1 / sc.m2_per_person;
    var oa = sc.oa_per_person_ls * ppl + sc.oa_per_area_ls_m2 + (sc.oa_ach || 0) * h / 3.6;
    var d = sc.perimeter_depth_m;
    var core = Math.max(0, width - 2 * d) * Math.max(0, length - 2 * d) / a;
    var th = sc.north_axis_deg * Math.PI / 180;
    var aperture = sc.shgc * sc.wwr * ew;
    // Schedule shape (engine/lib/features.py): occupied share of the day, of
    // 12:00-18:00 and of 00:00-06:00.
    var occ = {}, nOcc = 0, nPeak = 0, nNight = 0, i;
    for (i = 0; i < (+sc.occ_hours); i++) occ[((+sc.occ_start_h) + i) % 24] = true;
    for (i = 0; i < 24; i++) if (occ[i]) { nOcc++; if (i >= 12 && i < 18) nPeak++; if (i < 6) nNight++; }
    return [ew, sc.wwr * ew, sc.wall_u * (1 - sc.wwr) * ew, sc.win_u * sc.wwr * ew, sc.roof_u / n,
      sc.slab_f_factor_w_mk * perim / gfa, sc.infiltration_ach * h, aperture, aperture * sc.overhang_pf,
      oa, oa * (1 - sc.erv_sensible_eff), oa * (1 - sc.erv_latent_eff),
      sc.lpd_w_m2, sc.epd_w_m2, ppl, sc.t_cool_c, sc.t_heat_c, core,
      Math.cos(2 * th), Math.sin(2 * th), sc.aspect_ratio,
      nOcc / 24, nPeak / 6, nNight / 6];
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
    if (JSON.stringify(model.features) !== JSON.stringify(FEATURES)) {
      return {perM2: {}, extrapolated: [], fixedDiffs: [], incompatible: true};
    }
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
    var noRecovery = !(sc.erv_sensible_eff > 0) && !(sc.erv_latent_eff > 0);
    var groups = null;
    Object.keys(p.perM2).forEach(function (name) {
      var parts = name.split('|'), key = parts[0], metric = parts[1];
      // Zone load components (engine/lib/results.py component_groups): per m2,
      // may be negative, never clamped.
      if (key === 'comp_clg' || key === 'comp_htg') {
        groups = groups || {cooling: {}, heating: {}};
        groups[key === 'comp_clg' ? 'cooling' : 'heating'][metric.replace(/_w_m2$/, '')] = p.perM2[name] * gfa;
        return;
      }
      var r = dd[key] || (dd[key] = {key: key, kind: key.indexOf('htg') === 0 ? 'heating' : 'cooling'});
      // Loads can't be negative; with no heat recovery the recovered amount is
      // exactly zero (otherwise the fit's noise around zero would show).
      var v = Math.max(0, p.perM2[name]), err = model.outputs[name].cv.p95_abs_pct;
      if (metric === 'hr_w_m2' && noRecovery) v = 0;
      if (metric === 'total_w_m2') { r.total_w = v * gfa; r.err_pct = err; }
      else if (metric === 'sensible_w_m2') r.sensible_w = v * gfa;
      else if (metric === 'latent_w_m2') r.latent_w = v * gfa;
      else if (metric === 'oa_w_m2') r.outdoor_air_w = v * gfa;        // before heat recovery
      else if (metric === 'hr_w_m2') r.heat_recovery_w = v * gfa;
      else if (metric === 'supply_ls_m2') r.supply_air_m3s = v * gfa / 1000;
      else if (metric === 'sum_of_peaks_w_m2') r.sum_of_zone_peaks_w = v * gfa;
    });
    return {source: 'surrogate', gfa: gfa, dd: dd, groups: groups, extrapolated: p.extrapolated, fixedDiffs: p.fixedDiffs,
      incompatible: !!p.incompatible,
      model: {n: model.n_samples, eplus: model.eplus_versions, fitted: model.fitted_at, holdout: model.holdout || null,
        shared: model.type === 'unified'}};
  }

  // Independent-test result that rules the model out for this building type:
  // null when the model passed (or has not been tested), else the failing record.
  // A shared (unified) model is judged on its result for this type.
  function failedTest(model, type) {
    var ho = model && model.holdout;
    if (!ho) return null;
    if (model.type === 'unified' && ho.per_type && ho.per_type[type]) {
      return ho.per_type[type].passed ? null : {worst: ho.per_type[type].worst_governing_p95_pct, limit: ho.threshold_pct, n: ho.n};
    }
    if (ho.passed !== false) return null;
    return {worst: ho.worst_governing_p95_pct != null ? ho.worst_governing_p95_pct : ho.worst_total_p95_pct,
      limit: ho.threshold_pct, n: ho.n};
  }

  // Convert an EnergyPlus run (engine/run_scenario.py JSON) into the same shape.
  function energyplusResult(run) {
    var dd = {};
    Object.keys(run.design_days || {}).forEach(function (k) {
      var d = run.design_days[k], b = d.block;
      dd[k] = {key: k, kind: d.kind, total_w: b.total_w, sensible_w: b.sensible_w, latent_w: b.latent_w,
        outdoor_air_w: b.outdoor_air_w, heat_recovery_w: b.heat_recovery_w, supply_air_m3s: b.supply_air_m3s, outdoor_air_m3s: b.outdoor_air_m3s,
        sum_of_zone_peaks_w: d.sum_of_zone_peaks_w, time: b.time, outdoor_db_c: b.outdoor_db_c,
        profile: d.profile};
    });
    return {source: 'energyplus', gfa: run.scenario.gfa_m2, dd: dd, groups: run.component_groups || null, run: run};
  }

  // Load breakdown categories, in display order (engine/lib/results.py).
  var COMPONENTS = ['people', 'lighting', 'equipment', 'window_solar', 'window_conduction', 'walls', 'roof',
    'ground_floor', 'infiltration', 'internal_mass'];

  // Where a block peak comes from, W per category, summing to the block total.
  // Mirrors engine/lib/results.py breakdown(): the zone part of the peak is
  // split in the proportions of the zone components; ventilation (before
  // recovery) and the recovery credit come from the block peak itself.
  function breakdown(groups, block) {
    var total = block.total_w, oa = block.outdoor_air_w || 0, hr = block.heat_recovery_w || 0;
    var zonePart = total - oa + hr, s = 0, out = {};
    COMPONENTS.forEach(function (c) { s += (groups && groups[c]) || 0; });
    COMPONENTS.forEach(function (c) { out[c] = Math.abs(s) > 1e-9 ? ((groups && groups[c]) || 0) / s * zonePart : 0; });
    out.ventilation = oa;
    out.heat_recovery = -hr;
    return out;
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
    FEATURES: FEATURES, defaults: defaults, features: features, expand: expand, predict: predict, predictFeatures: predictFeatures, failedTest: failedTest, breakdown: breakdown, COMPONENTS: COMPONENTS,
    surrogateResult: surrogateResult, energyplusResult: energyplusResult, governing: governing,
    KW_PER_TON: KW_PER_TON, MBH_PER_KW: MBH_PER_KW, CFM_PER_M3S: CFM_PER_M3S, FT2_PER_M2: FT2_PER_M2
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.LoadsCore = api;
})(this);

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
    erv_sensible_eff: 0, erv_latent_eff: 0, setback_heat_c: null, setup_cool_c: null, thermal_mass: true,
    adiabatic_wall_n: false, adiabatic_wall_e: false, adiabatic_wall_s: false, adiabatic_wall_w: false,
    adiabatic_roof: false, adiabatic_floor: false};
  // Inputs no trained model has seen: every training run had all surfaces
  // exposed, so any adiabatic surface needs an EnergyPlus run.
  var UNTRAINED_BOOLS = ['adiabatic_wall_n', 'adiabatic_wall_e', 'adiabatic_wall_s', 'adiabatic_wall_w', 'adiabatic_roof', 'adiabatic_floor'];

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
    UNTRAINED_BOOLS.forEach(function (k) { if (sc[k]) fixedDiffs.push({input: k, trained: false, value: true}); });
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

  // Evaluate only the named outputs (per m2) - the optimizer calls this
  // many thousands of times, so it skips everything else.
  function predictSome(model, sc, names) {
    var x = features(sc), z = [], i, out = {};
    for (i = 0; i < x.length; i++) z.push((x[i] - model.feature_mean[i]) / model.feature_std[i]);
    var X = expand(z);
    names.forEach(function (n) { out[n] = Math.max(0, dot(model.outputs[n].coef, X)); });
    return out;
  }

  // ── Optimizer ─────────────────────────────────────────────────────────
  // Find lever settings that reach a peak-reduction target.
  //   levers   [{key, v0, lo, hi, int, cost}]   cost = user's $ per unit change (optional)
  //   evaluate function(values) -> {clg, htg}   peak loads (W) for a {key: value} map
  //   target   {clg: 0.2, htg: null}           fractional reductions; null = no target
  // Returns the baseline, the three ranked options (fewest levers changed,
  // smallest overall change, lowest cost) or, when the target can't be met,
  // the best achievable, plus the best reduction reachable with 1, 2, ... levers.
  // Deterministic: a fixed-seed random search, then refinement.
  function optimize(levers, evaluate, target, opts) {
    opts = opts || {};
    var rnd = (function (a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; })(opts.seed || 7);
    var n = levers.length, base = {}, i;
    levers.forEach(function (l) { base[l.key] = l.v0; });
    var b = evaluate(base);
    var goalC = target.clg != null ? b.clg * (1 - target.clg) : null, goalH = target.htg != null ? b.htg * (1 - target.htg) : null;
    function snap(l, v) { v = Math.min(l.hi, Math.max(l.lo, v)); return l.int ? Math.round(v) : v; }
    // Shortfall <= 0 means every target is met; smaller is better.
    function score(vals) {
      var r = evaluate(vals), s = -Infinity;
      if (goalC != null) s = Math.max(s, (r.clg - goalC) / b.clg);
      if (goalH != null) s = Math.max(s, (r.htg - goalH) / b.htg);
      return {vals: vals, r: r, s: s};
    }
    // How much of a lever's room is used: the move as a fraction of the
    // distance from its current value to the end of its range in that
    // direction (0.15 -> 0.05 ACH with a 0.05 floor is all of it, 1.0).
    function used(l, v) {
      var room = v < l.v0 ? l.v0 - l.lo : l.hi - l.v0;
      return room > 0 ? Math.abs(v - l.v0) / room : 0;
    }
    function change(vals) {
      var d = 0; levers.forEach(function (l) { d += used(l, vals[l.key]); }); return d;
    }
    function cost(vals) {
      var c = 0; levers.forEach(function (l) { if (l.cost) c += l.cost * Math.abs(vals[l.key] - l.v0); }); return c;
    }
    function moved(vals) {
      return levers.filter(function (l) { return Math.abs(vals[l.key] - l.v0) > 1e-9 * Math.max(1, Math.abs(l.v0)); });
    }
    function copy(v) { var o = {}; Object.keys(v).forEach(function (k) { o[k] = v[k]; }); return o; }
    // Pull each lever back toward its current value as far as the target allows.
    function shrink(pt, order) {
      var vals = copy(pt.vals);
      for (var pass = 0; pass < 3; pass++) {
        (order || levers).forEach(function (l) {
          var far = vals[l.key], near = l.v0, trial = copy(vals);
          trial[l.key] = near;
          if (score(trial).s <= 0) { vals = trial; return; }
          for (var it = 0; it < 14; it++) {
            var mid = snap(l, (far + near) / 2);
            trial[l.key] = mid;
            if (score(trial).s <= 0) far = mid; else near = mid;
            if (l.int && Math.abs(far - near) <= 1) break;
          }
          vals[l.key] = far;
        });
      }
      return score(vals);
    }
    // Drop token moves (under 5% of a lever's room) when the target can be
    // met without them, re-tightening the remaining levers.
    function tidy(pt) {
      if (!pt) return pt;
      var cur = pt, again = true;
      while (again) {
        again = false;
        var small = moved(cur.vals).filter(function (l) { return used(l, cur.vals[l.key]) < 0.05; })
          .sort(function (a, c) { return used(a, cur.vals[a.key]) - used(c, cur.vals[c.key]); });
        for (var i = 0; i < small.length && !again; i++) {
          var l = small[i], best = null;
          // Put it back and make up the shortfall with one of the other moved levers.
          moved(cur.vals).forEach(function (l2) {
            if (l2.key === l.key) return;
            var t = copy(cur.vals); t[l.key] = l.v0;
            if (score(t).s > 0) {
              var near = t[l2.key], far = t[l2.key] < l2.v0 ? l2.lo : l2.hi;
              t[l2.key] = far;
              if (score(t).s > 0) return;
              for (var it = 0; it < 20; it++) {
                var mid = snap(l2, (far + near) / 2); t[l2.key] = mid;
                if (score(t).s <= 0) far = mid; else near = mid;
              }
              t[l2.key] = far;
            }
            var c = score(t);
            if (c.s <= 0 && (!best || change(c.vals) < change(best.vals))) best = c;
          });
          if (best && change(best.vals) <= change(cur.vals) + 0.1) { cur = best; again = true; }
        }
      }
      return cur;
    }
    // Improve the shortfall by coordinate moves (used when the target is out of reach).
    function climb(pt, keys) {
      var cur = pt;
      for (var step = 0.5; step > 0.01; step /= 2) {
        var better = true;
        while (better) {
          better = false;
          levers.forEach(function (l) {
            if (keys && keys.indexOf(l.key) < 0) return;
            [-1, 1].forEach(function (sg) {
              var t = copy(cur.vals); t[l.key] = snap(l, t[l.key] + sg * step * (l.hi - l.lo));
              var c = score(t); if (c.s < cur.s - 1e-9) { cur = c; better = true; }
            });
          });
        }
      }
      return cur;
    }
    // Walk from the baseline in small steps, each time moving the lever that
    // buys the most reduction per unit of change ('change': fraction of its
    // range; 'cost': the user's $), until the target is met or nothing helps.
    function greedy(keys, metric) {
      var cur = score(copy(base)), h = 0.02;
      for (var it = 0; it < 400 && cur.s > 0; it++) {
        var pick = null;
        levers.forEach(function (l) {
          if (keys.indexOf(l.key) < 0) return;
          [-1, 1].forEach(function (sg) {
            var t = copy(cur.vals); t[l.key] = snap(l, t[l.key] + sg * h * (l.hi - l.lo));
            if (t[l.key] === cur.vals[l.key]) return;
            var c = score(t), gain = cur.s - c.s;
            if (gain <= 1e-12) return;
            var spend = metric === 'cost' ? (l.cost || 0) * Math.abs(t[l.key] - cur.vals[l.key]) : used(l, t[l.key]) - used(l, cur.vals[l.key]);
            var eff = spend > 0 ? gain / spend : Infinity;
            if (!pick || eff > pick.eff) pick = {eff: eff, pt: c};
          });
        });
        if (!pick) break;
        cur = pick.pt;
      }
      return cur;
    }
    function sampleIn(keys, count) {
      var pts = [];
      for (var k = 0; k < count; k++) {
        var v = copy(base);
        levers.forEach(function (l) { if (keys.indexOf(l.key) >= 0) v[l.key] = snap(l, l.lo + rnd() * (l.hi - l.lo)); });
        pts.push(score(v));
      }
      // Corners of the sub-box (each lever at an end of its range) when few levers.
      if (keys.length <= 6) {
        for (var m = 0; m < (1 << keys.length); m++) {
          var c = copy(base);
          keys.forEach(function (key, j) { var l = levers.filter(function (x) { return x.key === key; })[0]; c[key] = (m >> j) & 1 ? l.hi : l.lo; });
          pts.push(score(c));
        }
      }
      return pts;
    }
    var all = levers.map(function (l) { return l.key; });
    var pts = sampleIn(all, opts.samples || 3000);
    var best = pts.reduce(function (a, c) { return c.s < a.s ? c : a; });
    best = climb(best);
    var out = {baseline: b, goal: {clg: goalC, htg: goalH}, feasible: best.s <= 0};
    // Best reduction reachable with 1, 2, ... levers (levers ranked by their own reach).
    var single = levers.map(function (l) { return {l: l, p: climb(sampleIn([l.key], 24).reduce(function (a, c) { return c.s < a.s ? c : a; }), [l.key])}; })
      .sort(function (a, c) { return a.p.s - c.p.s; });
    var top = single.slice(0, Math.min(10, n)).map(function (x) { return x.l.key; });
    function combos(arr, k) {
      var res = [];
      (function rec(start, acc) {
        if (acc.length === k) { res.push(acc.slice()); return; }
        for (var j = start; j < arr.length; j++) { acc.push(arr[j]); rec(j + 1, acc); acc.pop(); }
      })(0, []);
      return res;
    }
    out.byCount = [];
    var fewest = null;
    for (var k = 1; k <= Math.min(6, top.length); k++) {
      var bestK = null, feasK = [];
      combos(top, k).forEach(function (keys) {
        var p = sampleIn(keys, 120).reduce(function (a, c) { return c.s < a.s ? c : a; });
        p = climb(p, keys);
        if (!bestK || p.s < bestK.s) bestK = p;
        if (p.s <= 0) feasK.push(p);
      });
      out.byCount.push({levers: k, best: bestK.r, pt: bestK.s <= 0 ? shrink(bestK) : bestK});
      if (!fewest && feasK.length) {
        fewest = combos(top, k).map(function (keys) { return greedy(keys, 'change'); })
          .filter(function (p) { return p.s <= 0; }).concat(feasK).map(function (p) { return shrink(p); })
          .filter(function (p) { return moved(p.vals).length <= k; })
          .sort(function (a, c) { return change(a.vals) - change(c.vals); })[0] || null;
      }
    }
    if (out.feasible) {
      var feas = pts.filter(function (p) { return p.s <= 0; }).concat([best]);
      var g = greedy(all, 'change');
      var smallest = feas.sort(function (a, c) { return change(a.vals) - change(c.vals); }).slice(0, 8)
        .concat(g.s <= 0 ? [g] : [])
        .map(function (p) { return shrink(p); }).sort(function (a, c) { return change(a.vals) - change(c.vals); })[0];
      out.smallest = tidy(smallest);
      out.fewest = fewest;
      out.byCount.forEach(function (c) { if (fewest && c.pt.s <= 0 && moved(c.pt.vals).length >= moved(fewest.vals).length) { c.pt = fewest; c.best = fewest.r; } });
      if (levers.some(function (l) { return l.cost; })) {
        // Spend on the cheapest levers first: pull the dearest back first.
        var order = levers.slice().sort(function (a, c) { return (c.cost || 0) - (a.cost || 0); });
        var gc = greedy(all, 'cost');
        out.cheapest = feas.sort(function (a, c) { return cost(a.vals) - cost(c.vals); }).slice(0, 8)
          .concat(gc.s <= 0 ? [gc] : [])
          .map(function (p) { return shrink(p, order); }).sort(function (a, c) { return cost(a.vals) - cost(c.vals); })[0];
        out.cheapest = tidy(out.cheapest);
      }
    } else {
      out.bestAchievable = best;
    }
    // Each moved lever's part of the reduction: how much the peak rises if
    // that lever alone is put back. Biggest first, by the targeted load.
    out.describe = function (pt) {
      var byH = goalC == null;
      var mv = moved(pt.vals).map(function (l) {
        var back = copy(pt.vals); back[l.key] = l.v0;
        var r = evaluate(back);
        return {key: l.key, from: l.v0, to: pt.vals[l.key], saves: {clg: r.clg - pt.r.clg, htg: r.htg - pt.r.htg}};
      }).sort(function (a, c) { return byH ? c.saves.htg - a.saves.htg : c.saves.clg - a.saves.clg; });
      return {values: pt.vals, result: pt.r, moved: mv, change: change(pt.vals), cost: cost(pt.vals)};
    };
    return out;
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
    FEATURES: FEATURES, defaults: defaults, features: features, expand: expand, predict: predict, predictFeatures: predictFeatures, failedTest: failedTest, breakdown: breakdown, COMPONENTS: COMPONENTS, predictSome: predictSome, optimize: optimize,
    surrogateResult: surrogateResult, energyplusResult: energyplusResult, governing: governing,
    KW_PER_TON: KW_PER_TON, MBH_PER_KW: MBH_PER_KW, CFM_PER_M3S: CFM_PER_M3S, FT2_PER_M2: FT2_PER_M2
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.LoadsCore = api;
})(this);

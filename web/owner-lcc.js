// Life-cycle cost for the owner view, in constant dollars with real rates
// (the present-value method of NIST Handbook 135). Pure functions: no prices
// or rates are built in; every number comes from the caller.
(function (root) {
  'use strict';
  var KWH_PER_THERM = 29.3071;          // 100,000 Btu

  // Yearly site energy from an annual run's monthly totals (engine/lib/results.py
  // parse_annual), converted with the user's efficiencies, as the detailed tool does.
  // e: {copClg, heatSrc: 'gas'|'heatpump'|'electric', heatEff, sfp (W per L/s)}
  // Returns {elec_kwh, therms, parts, missing[]}; a part is null when its input is missing.
  function yearlyEnergy(a, e) {
    var sum = function (k) { return (a[k] || []).reduce(function (s, v) { return s + v; }, 0); };
    var clg = sum('cooling_kwh'), htg = sum('heating_kwh'), missing = [];
    var fan = 0;
    if (e.sfp > 0) for (var i = 0; i < 12; i++) fan += e.sfp * a.supply_air_m3s[i] * a.hours[i];   // W per L/s x m3/s x h = kWh
    else missing.push('fan power');
    var parts = {cooling: e.copClg > 0 ? clg / e.copClg : null, lighting: sum('lighting_kwh'), equipment: sum('equipment_kwh'), fans: e.sfp > 0 ? fan : null,
      heating_elec: 0, heating_gas_kwh: 0, cooling_load: clg, heating_load: htg};
    if (!(e.copClg > 0)) missing.push('cooling efficiency');
    if (e.heatSrc === 'electric') parts.heating_elec = htg;
    else if (e.heatEff > 0) { if (e.heatSrc === 'gas') parts.heating_gas_kwh = htg / e.heatEff; else parts.heating_elec = htg / e.heatEff; }
    else { missing.push(e.heatSrc === 'gas' ? 'boiler efficiency' : 'heat pump seasonal COP'); parts.heating_elec = parts.heating_gas_kwh = null; }
    var elec = [parts.cooling, parts.heating_elec, parts.lighting, parts.equipment, parts.fans];
    return {elec_kwh: elec.some(function (v) { return v == null; }) ? null : elec.reduce(function (s, v) { return s + v; }, 0),
      therms: parts.heating_gas_kwh == null ? null : parts.heating_gas_kwh / KWH_PER_THERM, parts: parts, missing: missing};
  }

  // One option's cash flows over the study period.
  // o: {first_equipment, first_measures, energy_cost (year 1, today's prices), maint (per year)}
  // p: {years, disc (fraction), esc (energy escalation above inflation, fraction), life (equipment, years)}
  // Returns per-year discounted costs (index 0 = today) and the totals.
  function cashFlows(o, p) {
    var N = p.years, flows = [], pv = {first: o.first_equipment + o.first_measures, energy: 0, maint: 0, replace: 0, residual: 0};
    flows.push(pv.first);
    var last = 0;
    for (var t = 1; t <= N; t++) {
      var df = Math.pow(1 + p.disc, -t), c = 0;
      var en = o.energy_cost * Math.pow(1 + p.esc, t) * df, mt = o.maint * df;
      pv.energy += en; pv.maint += mt; c += en + mt;
      if (p.life > 0 && t < N && t - last >= p.life) { var rp = o.first_equipment * df; pv.replace += rp; c += rp; last = t; }
      if (t === N && p.life > 0) {
        var rv = o.first_equipment * Math.max(0, 1 - (N - last) / p.life) * df;
        pv.residual += rv; c -= rv;
      }
      flows.push(c);
    }
    pv.lcc = pv.first + pv.energy + pv.maint + pv.replace - pv.residual;
    return {flows: flows, pv: pv};
  }

  // Comparison of an option with the base case (both from cashFlows).
  function compare(opt, base, oYear1, bYear1) {
    var dFirst = opt.pv.first - base.pv.first;
    var dOper = (base.pv.energy + base.pv.maint + base.pv.replace - base.pv.residual) - (opt.pv.energy + opt.pv.maint + opt.pv.replace - opt.pv.residual);
    var cum = [], acc = 0, payback = null;
    for (var t = 0; t < opt.flows.length; t++) {
      acc += base.flows[t] - opt.flows[t]; cum.push(acc);
      if (payback == null && acc >= 0) payback = t;
    }
    var dYear1 = bYear1 - oYear1;     // first-year operating saving (energy + maintenance)
    return {net_savings: base.pv.lcc - opt.pv.lcc, d_first: dFirst, sir: dFirst > 0 ? dOper / dFirst : null,
      simple_payback: dFirst <= 0 ? 0 : (dYear1 > 0 ? dFirst / dYear1 : null), discounted_payback: payback, cumulative: cum};
  }

  var api = {yearlyEnergy: yearlyEnergy, cashFlows: cashFlows, compare: compare, KWH_PER_THERM: KWH_PER_THERM};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.OwnerLCC = api;
})(this);

// Preset answers for the Inputs view (web/app.js, SECTIONS), per question, in SI.
//
// Every question also gets a "Typical" preset: the archetype default for the
// chosen building type and location (engine/archetypes.json), read at run
// time and never stored here. When a preset below equals that default, the
// two merge into one button marked "Typical".
//
// rel: a multiple of Typical, chosen by the user (2026-11-03): presets sit
// 20% below and above the archetype default (rel 0.8 / 1.2), clamped to the
// input's allowed range. They are relative steps for exploring, not values
// from a standard; the page labels them "typical −20%" / "+20%".
//
// value: an absolute number. Either true by definition (none = 0, a square
// plan = 1, compass directions, whole hours) or chosen by the user
// (2026-11-03) where Typical is 0 and a percentage can't apply: shading
// projection factor 0.25 / 0.5, heat recovery effectiveness 50% / 75%.
// delta: Typical plus this many °C, chosen by the user (2026-11-03) for
// setpoints (±1 °C), where a percentage would depend on the scale.
// value: null means TODO(MEP lead): shown as "to be confirmed".
//
// Glazing (win_u), chosen by the user (2026-11-09): single, double or triple
// pane, or Custom, with no Typical button (noTypical below). Values are the
// ASHRAE Handbook - Fundamentals, Chapter 15, Table 4 centre-of-glass
// U-factors for clear, uncoated glass with 13 mm (1/2 in) air gaps:
// single 1/8 in glass 1.04, double 0.48, triple 0.31 Btu/h-ft2-F
// (5.91, 2.73, 1.76 W/m2-K). VERIFY against the current edition. They are
// glass only: the tool's input is the whole-window (assembly) U-factor, which
// a frame raises, and low-e coatings lower; use Custom for a product value.
//
// byType overrides _all for one building type (key as in archetypes.json).
window.LOADS_PRESETS = {
  _all: {
    aspect_ratio: [{label: 'Square', value: 1}, {label: 'Long and narrow', rel: 1.2}],
    north_axis_deg: [{label: 'Long sides face north and south', value: 0}, {label: 'Turned 45°', value: 45},
      {label: 'Long sides face east and west', value: 90}],
    wwr: [{label: 'Less glass', rel: 0.8}, {label: 'More glass', rel: 1.2}],
    win_u: [{label: 'Single pane', value: 5.91, note: 'clear glass, centre-of-glass (ASHRAE HOF Ch. 15 Table 4; verify)'},
      {label: 'Double pane', value: 2.73, note: 'clear glass, 13 mm air gap, centre-of-glass (ASHRAE HOF Ch. 15 Table 4; verify)'},
      {label: 'Triple pane', value: 1.76, note: 'clear glass, 13 mm air gaps, centre-of-glass (ASHRAE HOF Ch. 15 Table 4; verify)'}],
    shgc: [{label: 'Lets in less sun heat', rel: 0.8}, {label: 'Lets in more sun heat', rel: 1.2}],
    overhang_pf: [{label: 'No shading', value: 0}, {label: 'Some shading', value: 0.25}, {label: 'Deep shading', value: 0.5}],
    wall_u: [{label: 'Better insulated', rel: 0.8}, {label: 'Less insulated', rel: 1.2}],
    roof_u: [{label: 'Better insulated', rel: 0.8}, {label: 'Less insulated', rel: 1.2}],
    m2_per_person: [{label: 'Quieter (more space each)', rel: 1.2}, {label: 'Busier (less space each)', rel: 0.8}],
    lpd_w_m2: [{label: 'Efficient lighting', rel: 0.8}, {label: 'More lighting', rel: 1.2}],
    epd_w_m2: [{label: 'Light use', rel: 0.8}, {label: 'Heavy use', rel: 1.2}],
    oa_per_person_ls: [{label: 'Less', rel: 0.8}, {label: 'More', rel: 1.2}],
    oa_per_area_ls_m2: [{label: 'Less', rel: 0.8}, {label: 'More', rel: 1.2}],
    oa_ach: [{label: 'Less', rel: 0.8}, {label: 'More', rel: 1.2}],
    erv_sensible_eff: [{label: 'None', value: 0}, {label: 'Standard', value: 0.5}, {label: 'High-efficiency', value: 0.75}],
    erv_latent_eff: [{label: 'None', value: 0}, {label: 'Standard', value: 0.5}, {label: 'High-efficiency', value: 0.75}],
    infiltration_ach: [{label: 'Tighter', rel: 0.8}, {label: 'Leakier', rel: 1.2}],
    hvac_start_before_occ_h: [{label: 'At opening time', value: 0}, {label: '1 hour early', value: 1}, {label: '2 hours early', value: 2}],
    t_heat_c: [{label: 'Cooler', delta: -1}, {label: 'Warmer', delta: 1}],
    t_cool_c: [{label: 'Cooler', delta: -1}, {label: 'Warmer', delta: 1}]
  },
  byType: {},
  noTypical: ['win_u']
};

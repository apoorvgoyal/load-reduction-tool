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
// value: an absolute number, used only where it is true by definition (none
// = 0, a square plan = 1, compass directions, whole hours).
// value: null means TODO(MEP lead): shown as "to be confirmed" until a value
// with a source is filled in. Setpoints stay so: a percentage of a
// temperature depends on the scale (°C or °F), so ±20% has no meaning there.
//
// byType overrides _all for one building type (key as in archetypes.json).
window.LOADS_PRESETS = {
  _all: {
    aspect_ratio: [{label: 'Square', value: 1}, {label: 'Long and narrow', rel: 1.2}],
    north_axis_deg: [{label: 'Long sides face north and south', value: 0}, {label: 'Turned 45°', value: 45},
      {label: 'Long sides face east and west', value: 90}],
    wwr: [{label: 'Less glass', rel: 0.8}, {label: 'More glass', rel: 1.2}],
    win_u: [{label: 'Better insulated', rel: 0.8}, {label: 'Less insulated', rel: 1.2}],
    shgc: [{label: 'Lets in less sun heat', rel: 0.8}, {label: 'Lets in more sun heat', rel: 1.2}],
    overhang_pf: [{label: 'No shading', value: 0}, {label: 'Some shading', value: null}, {label: 'Deep shading', value: null}],
    wall_u: [{label: 'Better insulated', rel: 0.8}, {label: 'Less insulated', rel: 1.2}],
    roof_u: [{label: 'Better insulated', rel: 0.8}, {label: 'Less insulated', rel: 1.2}],
    m2_per_person: [{label: 'Quieter (more space each)', rel: 1.2}, {label: 'Busier (less space each)', rel: 0.8}],
    lpd_w_m2: [{label: 'Efficient lighting', rel: 0.8}, {label: 'More lighting', rel: 1.2}],
    epd_w_m2: [{label: 'Light use', rel: 0.8}, {label: 'Heavy use', rel: 1.2}],
    oa_per_person_ls: [{label: 'Less', rel: 0.8}, {label: 'More', rel: 1.2}],
    oa_per_area_ls_m2: [{label: 'Less', rel: 0.8}, {label: 'More', rel: 1.2}],
    oa_ach: [{label: 'Less', rel: 0.8}, {label: 'More', rel: 1.2}],
    erv_sensible_eff: [{label: 'None', value: 0}, {label: 'Standard', value: null}, {label: 'High-efficiency', value: null}],
    erv_latent_eff: [{label: 'None', value: 0}, {label: 'Standard', value: null}, {label: 'High-efficiency', value: null}],
    infiltration_ach: [{label: 'Tighter', rel: 0.8}, {label: 'Leakier', rel: 1.2}],
    hvac_start_before_occ_h: [{label: 'At opening time', value: 0}, {label: '1 hour early', value: 1}, {label: '2 hours early', value: 2}],
    t_heat_c: [{label: 'Cooler', value: null}, {label: 'Warmer', value: null}],
    t_cool_c: [{label: 'Cooler', value: null}, {label: 'Warmer', value: null}]
  },
  byType: {}
};

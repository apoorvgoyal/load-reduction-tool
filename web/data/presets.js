// Preset answers for the Inputs view (web/app.js, SECTIONS), per question, in SI.
//
// Every question also gets a "Typical" preset: the archetype default for the
// chosen building type and location (engine/archetypes.json), read at run
// time and never stored here. When a preset below equals that default, the
// two merge into one button marked "Typical".
//
// value: null means TODO(MEP lead): the preset is shown as "to be confirmed"
// and can't be picked until a value with a source is filled in here. The only
// numbers in this file are true by definition (none = 0, a square plan = 1,
// compass directions, whole hours); no engineering defaults are invented.
//
// byType overrides _all for one building type (key as in archetypes.json).
window.LOADS_PRESETS = {
  _all: {
    aspect_ratio: [{label: 'Square', value: 1}, {label: 'Long and narrow', value: null}],
    north_axis_deg: [{label: 'Long sides face north and south', value: 0}, {label: 'Turned 45°', value: 45},
      {label: 'Long sides face east and west', value: 90}],
    wwr: [{label: 'Less glass', value: null}, {label: 'More glass', value: null}],
    win_u: [{label: 'Better insulated', value: null}, {label: 'Less insulated', value: null}],
    shgc: [{label: 'Lets in less sun heat', value: null}, {label: 'Lets in more sun heat', value: null}],
    overhang_pf: [{label: 'No shading', value: 0}, {label: 'Some shading', value: null}, {label: 'Deep shading', value: null}],
    wall_u: [{label: 'Better insulated', value: null}, {label: 'Less insulated', value: null}],
    roof_u: [{label: 'Better insulated', value: null}, {label: 'Less insulated', value: null}],
    m2_per_person: [{label: 'Quieter (more space each)', value: null}, {label: 'Busier (less space each)', value: null}],
    lpd_w_m2: [{label: 'Efficient lighting', value: null}, {label: 'More lighting', value: null}],
    epd_w_m2: [{label: 'Light use', value: null}, {label: 'Heavy use', value: null}],
    oa_per_person_ls: [{label: 'Less', value: null}, {label: 'More', value: null}],
    oa_per_area_ls_m2: [{label: 'Less', value: null}, {label: 'More', value: null}],
    oa_ach: [{label: 'Less', value: null}, {label: 'More', value: null}],
    erv_sensible_eff: [{label: 'None', value: 0}, {label: 'Standard', value: null}, {label: 'High-efficiency', value: null}],
    erv_latent_eff: [{label: 'None', value: 0}, {label: 'Standard', value: null}, {label: 'High-efficiency', value: null}],
    infiltration_ach: [{label: 'Tighter', value: null}, {label: 'Leakier', value: null}],
    hvac_start_before_occ_h: [{label: 'At opening time', value: 0}, {label: '1 hour early', value: 1}, {label: '2 hours early', value: 2}],
    t_heat_c: [{label: 'Cooler', value: null}, {label: 'Warmer', value: null}],
    t_cool_c: [{label: 'Cooler', value: null}, {label: 'Warmer', value: null}]
  },
  byType: {}
};

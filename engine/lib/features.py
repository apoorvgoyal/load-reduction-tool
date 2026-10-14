"""Surrogate feature definition. Mirrored exactly in web/core.js
(features); tests/test_surrogate.py checks the two agree."""

FEATURES = [
    'wwr', 'wall_u', 'roof_u', 'win_u', 'shgc', 'overhang_pf',
    'people_per_m2', 'lpd_w_m2', 'epd_w_m2', 'oa_ls_m2',
    'erv_sensible_eff', 'erv_latent_eff', 'infiltration_ach',
    't_cool_c', 't_heat_c', 'n_floors', 'aspect_ratio', 'floor_plate_m2', 'north_axis_fold',
]


def features(sc):
    """Map a resolved scenario to the surrogate feature vector."""
    ppl = 1.0 / sc['m2_per_person']
    return [
        sc['wwr'], sc['wall_u'], sc['roof_u'], sc['win_u'], sc['shgc'], sc['overhang_pf'],
        ppl, sc['lpd_w_m2'], sc['epd_w_m2'],
        sc['oa_per_person_ls'] * ppl + sc['oa_per_area_ls_m2'],
        sc['erv_sensible_eff'], sc['erv_latent_eff'], sc['infiltration_ach'],
        sc['t_cool_c'], sc['t_heat_c'], float(sc['n_floors']), sc['aspect_ratio'],
        sc['gfa_m2'] / sc['n_floors'],
        # A rectangle is symmetric under 180 degree rotation.
        sc['north_axis_deg'] % 180.0,
    ]


# Targets fitted per design day, all normalised per m2 of gross floor area.
def targets(design_days, gfa):
    out = {}
    for key, dd in design_days.items():
        b = dd['block']
        out[key + '|total_w_m2'] = b['total_w'] / gfa
        if b.get('sensible_w') is not None:
            out[key + '|sensible_w_m2'] = b['sensible_w'] / gfa
        if b.get('latent_w') is not None:
            out[key + '|latent_w_m2'] = b['latent_w'] / gfa
        if b.get('outdoor_air_w') is not None:
            out[key + '|oa_w_m2'] = b['outdoor_air_w'] / gfa
        if b.get('supply_air_m3s') is not None:
            out[key + '|supply_ls_m2'] = b['supply_air_m3s'] * 1000.0 / gfa
        out[key + '|sum_of_peaks_w_m2'] = dd['sum_of_zone_peaks_w'] / gfa
    return out

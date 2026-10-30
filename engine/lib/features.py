"""Surrogate feature definition. Mirrored exactly in web/core.js
(features); tests/test_surrogate.py checks the two agree.

Features are physics-shaped quantities per m2 of floor area (areas, UA
values, solar aperture, ventilation after heat recovery) rather than raw
inputs. On the first 500 real EnergyPlus runs (office, Chicago) this cut the
worst out-of-fold P95 error on block totals from 10.9% to 4.2% compared with
the raw-input feature set.
"""
import math

from . import results

FEATURES = [
    'ext_wall_m2_per_m2', 'window_m2_per_m2', 'wall_ua_per_m2', 'window_ua_per_m2', 'roof_ua_per_m2',
    'slab_fp_per_m2', 'infiltration_m3h_per_m2', 'solar_aperture_per_m2', 'shaded_aperture_per_m2',
    'oa_ls_m2', 'oa_after_sensible_hr', 'oa_after_latent_hr',
    'lpd_w_m2', 'epd_w_m2', 'people_per_m2', 't_cool_c', 't_heat_c', 'core_fraction',
    'orient_cos2', 'orient_sin2', 'aspect_ratio',
    'occ_hours_frac', 'occ_peak_overlap', 'occ_overnight',
]

PEAK_HOURS = range(12, 18)       # 12:00-18:00, when outdoor temperature and west sun peak
NIGHT_HOURS = range(0, 6)


def occupied_hours(sc):
    s, n = int(sc['occ_start_h']), int(sc['occ_hours'])
    return {(s + i) % 24 for i in range(n)}


def geometry(sc):
    """Footprint length/width/perimeter per floor, as built by lib/idf.py."""
    a = sc['gfa_m2'] / sc['n_floors']
    length = math.sqrt(a * sc['aspect_ratio'])
    width = a / length
    return a, length, width, 2 * (length + width)


def features(sc):
    """Map a resolved scenario to the surrogate feature vector."""
    n, gfa, h = sc['n_floors'], sc['gfa_m2'], sc['floor_to_floor_m']
    a, length, width, perim = geometry(sc)
    ew = perim * h * n / gfa
    ppl = 1.0 / sc['m2_per_person']
    # Outdoor air in L/s per m2 floor: 62.1-style rates plus any air-change rate
    # (ACH x floor-to-floor height / 3.6 converts 1/h to L/s per m2). Runs made
    # before oa_ach existed had none, i.e. 0.
    oa = sc['oa_per_person_ls'] * ppl + sc['oa_per_area_ls_m2'] + sc.get('oa_ach', 0.0) * h / 3.6
    d = sc['perimeter_depth_m']
    core = max(0.0, width - 2 * d) * max(0.0, length - 2 * d) / a
    th = math.radians(sc['north_axis_deg'])
    aperture = sc['shgc'] * sc['wwr'] * ew
    occ = occupied_hours(sc)
    return [
        ew, sc['wwr'] * ew,
        sc['wall_u'] * (1 - sc['wwr']) * ew,
        sc['win_u'] * sc['wwr'] * ew,
        sc['roof_u'] / n,
        sc['slab_f_factor_w_mk'] * perim / gfa,
        sc['infiltration_ach'] * h,
        aperture, aperture * sc['overhang_pf'],
        oa, oa * (1 - sc['erv_sensible_eff']), oa * (1 - sc['erv_latent_eff']),
        sc['lpd_w_m2'], sc['epd_w_m2'], ppl,
        sc['t_cool_c'], sc['t_heat_c'], core,
        math.cos(2 * th), math.sin(2 * th),   # a rectangle repeats every 180 degrees
        sc['aspect_ratio'],
        # Schedule shape: lets one model cover buildings with different hours.
        len(occ) / 24.0,
        len(occ & set(PEAK_HOURS)) / float(len(PEAK_HOURS)),
        len(occ & set(NIGHT_HOURS)) / float(len(NIGHT_HOURS)),
    ]


# Targets fitted per design day, all normalised per m2 of gross floor area.
def targets(design_days, gfa, components=None):
    out = {}
    for key, dd in design_days.items():
        b = dd['block']
        out[key + '|total_w_m2'] = b['total_w'] / gfa
        if b.get('sensible_w') is not None:
            out[key + '|sensible_w_m2'] = b['sensible_w'] / gfa
        if b.get('latent_w') is not None:
            out[key + '|latent_w_m2'] = b['latent_w'] / gfa
        if b.get('outdoor_air_w') is not None:
            out[key + '|oa_w_m2'] = b['outdoor_air_w'] / gfa          # before heat recovery
        if b.get('heat_recovery_w') is not None:
            out[key + '|hr_w_m2'] = b['heat_recovery_w'] / gfa
        if b.get('supply_air_m3s') is not None:
            out[key + '|supply_ls_m2'] = b['supply_air_m3s'] * 1000.0 / gfa
        out[key + '|sum_of_peaks_w_m2'] = dd['sum_of_zone_peaks_w'] / gfa
    # Zone load components (lib/results.py component_groups), per m2. These can
    # be negative (a slab storing heat), so predictions are not clamped at 0.
    groups = results.component_groups(components)
    for kind, prefix in (('cooling', 'comp_clg'), ('heating', 'comp_htg')):
        for cat, v in ((groups or {}).get(kind) or {}).items():
            out['%s|%s_w_m2' % (prefix, cat)] = v / gfa
    return out

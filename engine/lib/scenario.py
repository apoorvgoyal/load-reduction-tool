"""Scenario schema: resolve archetype + climate-zone defaults + user overrides.

A scenario is a flat dict of SI inputs. `resolve()` returns the complete dict
plus a provenance map saying where each value came from.
"""
import json
import os

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Every input the engine understands, with unit and allowed range. Ranges are
# physical-plausibility guards, not design recommendations.
FIELDS = {
    'type':                         {'unit': '-'},
    'station':                      {'unit': '-'},
    'climate_zone':                 {'unit': '-'},
    'gfa_m2':                       {'unit': 'm2', 'min': 100, 'max': 500000},
    'n_floors':                     {'unit': '-', 'min': 1, 'max': 60, 'int': True},
    'aspect_ratio':                 {'unit': '-', 'min': 1, 'max': 6},
    'floor_to_floor_m':             {'unit': 'm', 'min': 2.5, 'max': 8},
    'perimeter_depth_m':            {'unit': 'm', 'min': 2, 'max': 10},
    'north_axis_deg':               {'unit': 'deg', 'min': -180, 'max': 360},
    'wwr':                          {'unit': '-', 'min': 0.0, 'max': 0.95},
    'overhang_pf':                  {'unit': '-', 'min': 0.0, 'max': 2.0},
    'wall_u':                       {'unit': 'W/m2-K', 'min': 0.08, 'max': 3.0},
    'roof_u':                       {'unit': 'W/m2-K', 'min': 0.05, 'max': 3.0},
    'win_u':                        {'unit': 'W/m2-K', 'min': 0.5, 'max': 6.0},
    'shgc':                         {'unit': '-', 'min': 0.05, 'max': 0.9},
    'm2_per_person':                {'unit': 'm2/person', 'min': 0.3, 'max': 200},
    'activity_w_per_person':        {'unit': 'W/person', 'min': 70, 'max': 400},
    'lpd_w_m2':                     {'unit': 'W/m2', 'min': 0, 'max': 40},
    'epd_w_m2':                     {'unit': 'W/m2', 'min': 0, 'max': 200},
    'unoccupied_internal_fraction': {'unit': '-', 'min': 0, 'max': 1},
    'occ_start_h':                  {'unit': 'h', 'min': 0, 'max': 23, 'int': True},
    'occ_hours':                    {'unit': 'h', 'min': 1, 'max': 24, 'int': True},
    'occ_days_per_week':            {'unit': 'days', 'min': 1, 'max': 7, 'int': True},
    't_heat_c':                     {'unit': 'C', 'min': 10, 'max': 26},
    't_cool_c':                     {'unit': 'C', 'min': 20, 'max': 32},
    'setback_heat_c':               {'unit': 'C', 'min': 5, 'max': 26, 'nullable': True},
    'setup_cool_c':                 {'unit': 'C', 'min': 20, 'max': 40, 'nullable': True},
    'oa_per_person_ls':             {'unit': 'L/s-person', 'min': 0, 'max': 30},
    'oa_per_area_ls_m2':            {'unit': 'L/s-m2', 'min': 0, 'max': 10},
    'oa_ach':                       {'unit': '1/h', 'min': 0, 'max': 30},
    'oa_unoccupied_fraction':       {'unit': '-', 'min': 0, 'max': 1},
    'hvac_start_before_occ_h':      {'unit': 'h', 'min': 0, 'max': 12, 'int': True},
    'erv_sensible_eff':             {'unit': '-', 'min': 0, 'max': 0.95},
    'erv_latent_eff':               {'unit': '-', 'min': 0, 'max': 0.95},
    'infiltration_ach':             {'unit': '1/h', 'min': 0, 'max': 3},
    'cooling_supply_air_c':         {'unit': 'C', 'min': 5, 'max': 20},
    'heating_supply_air_c':         {'unit': 'C', 'min': 25, 'max': 60},
    'slab_f_factor_w_mk':           {'unit': 'W/m-K', 'min': 0.1, 'max': 3},
    'thermal_mass':                 {'unit': 'bool'},
    'cooling_sizing_factor':        {'unit': '-', 'min': 1.0, 'max': 2.0},
    'heating_sizing_factor':        {'unit': '-', 'min': 1.0, 'max': 2.0},
}

# Geometry inputs with no standard default. The UI always sends them; these
# are only used when a scenario omits them and are flagged as such.
GEOMETRY_PLACEHOLDERS = {
    'gfa_m2': 10000.0,
    'n_floors': 4,
    'aspect_ratio': 1.5,
    'north_axis_deg': 0.0,
    'overhang_pf': 0.0,
    'erv_sensible_eff': 0.0,
    'erv_latent_eff': 0.0,
    'setback_heat_c': None,
    'setup_cool_c': None,
    'thermal_mass': True,
}


def load_archetypes():
    with open(os.path.join(HERE, 'archetypes.json')) as f:
        return json.load(f)


class ScenarioError(ValueError):
    pass


def resolve(user, stat_climate_zone=None, archetypes=None):
    """Merge defaults and user inputs. Returns (scenario, provenance)."""
    arch = archetypes or load_archetypes()
    t = user.get('type', 'office')
    if t not in arch['types']:
        raise ScenarioError('unknown building type %r' % t)
    if not user.get('station'):
        raise ScenarioError('station is required')
    cz = user.get('climate_zone') or stat_climate_zone
    env_table = arch['envelope_by_climate_zone']
    if cz not in env_table:
        raise ScenarioError('no envelope defaults for climate zone %r' % cz)

    sc, prov = {}, {}
    for k, v in GEOMETRY_PLACEHOLDERS.items():
        sc[k] = v
        prov[k] = 'placeholder (no standard default - set per project)'
    for k, spec in arch['common'].items():
        sc[k] = spec['value']
        prov[k] = spec['source']
    for k, spec in arch['types'][t].items():
        if isinstance(spec, dict) and 'value' in spec:
            sc[k] = spec['value']
            prov[k] = spec['source']
    for k, v in env_table[cz].items():
        sc[k] = v
        prov[k] = env_table['_source'] + ' [CZ %s]' % cz
    sc['type'] = t
    sc['station'] = user['station']
    sc['climate_zone'] = cz
    prov['climate_zone'] = 'user' if user.get('climate_zone') else 'station .stat file (algorithmic)'

    for k, v in user.items():
        if k not in FIELDS:
            raise ScenarioError('unknown input %r' % k)
        if k in ('type', 'station', 'climate_zone'):
            continue
        sc[k] = v
        prov[k] = 'user'

    for k, spec in FIELDS.items():
        v = sc.get(k)
        if spec['unit'] in ('-',) and k in ('type', 'station', 'climate_zone'):
            continue
        if v is None:
            if spec.get('nullable'):
                continue
            raise ScenarioError('missing value for %s' % k)
        if spec['unit'] == 'bool':
            sc[k] = bool(v)
            continue
        try:
            v = float(v)
        except (TypeError, ValueError):
            raise ScenarioError('%s must be numeric' % k)
        if spec.get('int'):
            v = int(round(v))
        if 'min' in spec and not (spec['min'] <= v <= spec['max']):
            raise ScenarioError('%s=%s outside [%s, %s] %s' % (k, v, spec['min'], spec['max'], spec['unit']))
        sc[k] = v
    if sc['t_heat_c'] >= sc['t_cool_c']:
        raise ScenarioError('heating setpoint must be below cooling setpoint')
    if sc['cooling_supply_air_c'] >= sc['t_cool_c']:
        raise ScenarioError('cooling supply air must be colder than the cooling setpoint')
    if sc['heating_supply_air_c'] <= sc['t_heat_c']:
        raise ScenarioError('heating supply air must be warmer than the heating setpoint')
    return sc, prov

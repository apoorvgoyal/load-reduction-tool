"""Read an EnergyPlus eplusout.sql from a design-day run into the tool's
results structure.

Scaling: the middle floor stands in for (N - 2) floors. Every zone result is
multiplied by its floor's `scale` from the model info before summing.

Block (coincident) peak = max over timesteps of the scaled sum across zones.
Sum of zone peaks       = scaled sum of each zone's own maximum.
"""
import sqlite3

V_CLG_TOT = 'Zone Ideal Loads Supply Air Total Cooling Rate'
V_CLG_SEN = 'Zone Ideal Loads Supply Air Sensible Cooling Rate'
V_CLG_LAT = 'Zone Ideal Loads Supply Air Latent Cooling Rate'
V_HTG_TOT = 'Zone Ideal Loads Supply Air Total Heating Rate'
V_HTG_SEN = 'Zone Ideal Loads Supply Air Sensible Heating Rate'
V_ZN_CLG = 'Zone Ideal Loads Zone Sensible Cooling Rate'
V_ZN_HTG = 'Zone Ideal Loads Zone Sensible Heating Rate'
V_OA_CLG = 'Zone Ideal Loads Outdoor Air Total Cooling Rate'
V_OA_HTG = 'Zone Ideal Loads Outdoor Air Total Heating Rate'
V_SA_FLOW = 'Zone Ideal Loads Supply Air Standard Density Volume Flow Rate'
V_OA_FLOW = 'Zone Ideal Loads Outdoor Air Standard Density Volume Flow Rate'
V_OAT = 'Site Outdoor Air Drybulb Temperature'

COMPONENT_COLUMNS = ['Sensible - Instant', 'Sensible - Delayed', 'Sensible - Return Air', 'Latent', 'Total']


def _cols(con, table):
    return [r[1] for r in con.execute('PRAGMA table_info(%s)' % table)]


def _time_label(hour, minute):
    total = (int(hour) - 1) * 60 + int(minute)
    return '%02d:%02d' % (total // 60, total % 60)


def parse_sql(sql_path, model):
    con = sqlite3.connect(sql_path)
    try:
        return _parse(con, model)
    finally:
        con.close()


def _parse(con, model):
    scale = {z['name'].upper(): z['scale'] for z in model['zones']}
    env_key = model['design_day_env_names']   # upper-case env name -> key

    envs = {}
    for idx, name in con.execute('SELECT EnvironmentPeriodIndex, EnvironmentName FROM EnvironmentPeriods'):
        key = env_key.get((name or '').upper())
        if key:
            envs[idx] = key

    tcols = _cols(con, 'Time')
    warm = 'AND (WarmupFlag IS NULL OR WarmupFlag = 0)' if 'WarmupFlag' in tcols else ''
    times = {}
    for ti, env, hr, mi in con.execute(
            'SELECT TimeIndex, EnvironmentPeriodIndex, Hour, Minute FROM Time WHERE EnvironmentPeriodIndex IS NOT NULL ' + warm):
        if env in envs:
            times[ti] = (envs[env], _time_label(hr, mi))

    dict_rows = con.execute('SELECT ReportDataDictionaryIndex, KeyValue, Name FROM ReportDataDictionary').fetchall()
    var_of = {}
    for idx, key, name in dict_rows:
        var_of[idx] = (name, (key or '').upper())

    # series[env][var][time_index] = scaled building sum
    # zmax[env][var][zone] = max of unscaled zone value
    series, zmax, oat = {}, {}, {}
    q = 'SELECT TimeIndex, ReportDataDictionaryIndex, Value FROM ReportData'
    for ti, di, val in con.execute(q):
        if ti not in times or di not in var_of:
            continue
        env, _ = times[ti]
        name, key = var_of[di]
        if name == V_OAT:
            oat.setdefault(env, {})[ti] = val
            continue
        zone = key[:-len(' IDEAL LOADS')] if key.endswith(' IDEAL LOADS') else key
        if zone not in scale:
            continue
        s = scale[zone]
        series.setdefault(env, {}).setdefault(name, {})
        series[env][name][ti] = series[env][name].get(ti, 0.0) + val * s
        zm = zmax.setdefault(env, {}).setdefault(name, {})
        if val > zm.get(zone, float('-inf')):
            zm[zone] = val

    design_days = {}
    for env in sorted(set(times[t][0] for t in times)):
        is_htg = env.startswith('htg')
        main = V_HTG_TOT if is_htg else V_CLG_TOT
        ser = series.get(env, {})
        if main not in ser or not ser[main]:
            continue
        ti_peak = max(ser[main], key=lambda t: (ser[main][t], -t))
        at = lambda v: ser.get(v, {}).get(ti_peak)
        block = {
            'total_w': ser[main][ti_peak],
            'sensible_w': at(V_HTG_SEN if is_htg else V_CLG_SEN),
            'latent_w': None if is_htg else at(V_CLG_LAT),
            'zone_sensible_w': at(V_ZN_HTG if is_htg else V_ZN_CLG),
            'outdoor_air_w': at(V_OA_HTG if is_htg else V_OA_CLG),
            'supply_air_m3s': at(V_SA_FLOW),
            'outdoor_air_m3s': at(V_OA_FLOW),
            'time': times[ti_peak][1],
            'outdoor_db_c': oat.get(env, {}).get(ti_peak),
        }
        sop = sum(v * scale[z] for z, v in zmax.get(env, {}).get(main, {}).items())
        # Hourly profile of the block total (for charts): keep every timestep.
        profile = [[times[t][1], ser[main][t]] for t in sorted(ser[main])]
        design_days[env] = {
            'key': env,
            'kind': 'heating' if is_htg else 'cooling',
            'block': block,
            'sum_of_zone_peaks_w': sop,
            'profile': profile,
        }

    return {
        'eplus_version': _eplus_version(con),
        'design_days': design_days,
        'zone_sizing': _zone_sizes(con, scale),
        'components': _components(con, scale),
    }


def _eplus_version(con):
    try:
        row = con.execute('SELECT EnergyPlusVersion FROM Simulations').fetchone()
        return row[0] if row else None
    except sqlite3.Error:
        return None


def _zone_sizes(con, scale):
    try:
        cols = _cols(con, 'ZoneSizes')
    except sqlite3.Error:
        return []
    if not cols:
        return []
    want = [c for c in ('ZoneName', 'LoadType', 'CalcDesLoad', 'CalcDesFlow', 'DesDayName', 'PeakHrMin',
                        'PeakTemp', 'PeakHumRat', 'CalcOutsideAirFlow') if c in cols]
    out = []
    for row in con.execute('SELECT %s FROM ZoneSizes' % ', '.join(want)):
        r = dict(zip(want, row))
        z = (r.get('ZoneName') or '').upper()
        r['scale'] = scale.get(z, 1)
        out.append(r)
    return out


def _components(con, scale):
    """Zone component load tables, scaled and summed across zones.
    These are each zone's own peak (non-coincident)."""
    try:
        rows = con.execute(
            "SELECT ReportForString, TableName, RowName, ColumnName, Value FROM TabularDataWithStrings "
            "WHERE ReportName = 'ZoneComponentLoadSummary' AND TableName IN "
            "('Estimated Cooling Peak Load Components', 'Estimated Heating Peak Load Components')").fetchall()
    except sqlite3.Error:
        return None
    if not rows:
        return None
    out = {'cooling': {}, 'heating': {}}
    for zone, table, row, col, val in rows:
        if col not in COMPONENT_COLUMNS or row in ('Grand Total',):
            continue
        z = (zone or '').upper()
        if z not in scale:
            continue
        try:
            v = float(val)
        except (TypeError, ValueError):
            continue
        kind = 'cooling' if 'Cooling' in table else 'heating'
        rec = out[kind].setdefault(row.strip(), {c: 0.0 for c in COMPONENT_COLUMNS})
        rec[col] += v * scale[z]
    for kind in out:
        out[kind] = {k: v for k, v in out[kind].items() if any(abs(x) > 1e-9 for x in v.values())}
    return out


def parse_err(err_path):
    out = {'warnings': 0, 'severe': 0, 'fatal': [], 'severe_messages': []}
    try:
        with open(err_path, encoding='latin-1') as f:
            for line in f:
                s = line.strip()
                if s.startswith('** Warning **'):
                    out['warnings'] += 1
                elif s.startswith('** Severe  **'):
                    out['severe'] += 1
                    if len(out['severe_messages']) < 20:
                        out['severe_messages'].append(s)
                elif s.startswith('**  Fatal  **'):
                    out['fatal'].append(s)
    except OSError:
        pass
    return out


def summarize(design_days, cooling_pct='0.4', heating_pct='99.6'):
    """Pick the governing design days for a chosen percentile.
    Cooling governs on the larger total of the dry-bulb and dew-point days."""
    c_candidates = [design_days.get('clg_db_%s' % cooling_pct), design_days.get('clg_dp_%s' % cooling_pct)]
    c_candidates = [c for c in c_candidates if c]
    clg = max(c_candidates, key=lambda d: d['block']['total_w']) if c_candidates else None
    htg = design_days.get('htg_%s' % heating_pct)
    return clg, htg

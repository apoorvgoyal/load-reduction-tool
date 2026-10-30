"""Generate surrogate training data: Latin-hypercube samples of the design
space in variables.json, each run through EnergyPlus.

Usage:
  python3 engine/batch.py --types office --stations chicago,houston --n 500 --workers 4
  python3 engine/batch.py --types all --stations all --n 5000             # everything
  python3 engine/batch.py --types unified --stations chicago --n 3000     # one shared model for all types
  python3 engine/batch.py --types all --stations all --n 5000 --shard 2/4 # this PC's quarter

Sharding: with --shard K/N a machine runs only every N-th sample (ids where
id % N == K - 1) and writes <type>__<station>.shard-K-of-N.jsonl. Run each
K on a different PC with identical --types/--stations/--n/--seed, then copy all
the result files into one engine/runs/ folder; fit_surrogate.py merges them.

Output: engine/runs/<type>__<station>.jsonl, one line per completed sample:
  {"id": 17, "scenario": {...}, "features": [...], "targets": {...}, "eplus": "..."}
Runs are resumable: samples already in the file are skipped. Failed samples are
written to <type>__<station>.failed.jsonl with the error; that file only exists
if something failed.
"""
import argparse
import json
import math
import os
import random
import sys
import time
from concurrent.futures import ProcessPoolExecutor, as_completed

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import run_scenario  # noqa: E402
from lib import results, features, runs, scenario  # noqa: E402

RUNS = os.path.join(HERE, 'runs')


def lhs(n, dims, rng):
    """Latin hypercube in [0,1)^dims."""
    cols = []
    for _ in range(dims):
        perm = list(range(n))
        rng.shuffle(perm)
        cols.append([(p + rng.random()) / n for p in perm])
    return [[cols[d][i] for d in range(dims)] for i in range(n)]


def make_samples(btype, station, n, seed):
    with open(os.path.join(HERE, 'variables.json')) as f:
        space = json.load(f)['sampled']
    arch = scenario.load_archetypes()['types'][btype]
    names = sorted(space)
    rng = random.Random('%s|%s|%d' % (btype, station, seed))
    out = []
    for i, u in enumerate(lhs(n, len(names), rng)):
        v = {}
        for name, x in zip(names, u):
            spec = space[name]
            if 'scale_of_default' in spec:
                lo, hi = spec['scale_of_default']
                base = arch[name]['value']
                val = base * (lo + (hi - lo) * x)
            elif 'offset_of_default' in spec:
                lo, hi = spec['offset_of_default']
                val = arch[name]['value'] + lo + (hi - lo) * x
            else:
                val = spec['min'] + (spec['max'] - spec['min']) * x
                if spec.get('int'):
                    val = int(min(spec['max'], spec['min'] + int(x * (spec['max'] - spec['min'] + 1))))
            v[name] = val
        user = {'type': btype, 'station': station}
        for k, val in v.items():
            if k in ('oa_multiplier', 'floor_plate_m2'):
                continue
            user[k] = val
        user['t_heat_c'] = min(user['t_heat_c'], user['t_cool_c'] - 1.0)   # keep a deadband
        user['oa_per_person_ls'] = arch['oa_per_person_ls']['value'] * v['oa_multiplier']
        user['oa_per_area_ls_m2'] = arch['oa_per_area_ls_m2']['value'] * v['oa_multiplier']
        user['gfa_m2'] = v['floor_plate_m2'] * v['n_floors']
        out.append((i, user))
    return out


UNIFIED = 'unified'


def make_samples_unified(station, n, seed):
    """Shared design space for all building types (see variables.json 'unified').

    Returns [(id, user, component)] where component is the preset type a
    sample was drawn around, or 'wide'.
    """
    with open(os.path.join(HERE, 'variables.json')) as f:
        cfg = json.load(f)
    space, uni = cfg['sampled'], cfg['unified']
    types = list(scenario.load_archetypes()['types'])
    n_preset = int(round(n * uni['preset_share']))
    out = []
    # Preset part: an equal share per type, sampled exactly like a per-type model.
    for j, t in enumerate(types):
        k = n_preset // len(types) + (1 if j < n_preset % len(types) else 0)
        for _, user in make_samples(t, station, k, seed):
            out.append((user, t))
    # Wide part: every input across the combined range, schedules included.
    wide = dict(uni['wide'])
    for name, spec in space.items():
        if name not in wide and name not in ('m2_per_person', 'lpd_w_m2', 'epd_w_m2', 'oa_multiplier', 'oa_ach',
                                             't_cool_c', 't_heat_c'):
            wide[name] = spec
    names = sorted(wide)
    rng = random.Random('%s|%s|%d|wide' % (UNIFIED, station, seed))
    for u in lhs(n - n_preset, len(names), rng):
        user = {'type': types[0], 'station': station}
        for name, x in zip(names, u):
            spec = wide[name]
            if 'log_min' in spec:
                val = math.exp(math.log(spec['log_min']) + (math.log(spec['log_max']) - math.log(spec['log_min'])) * x)
            elif spec.get('int'):
                val = int(min(spec['max'], spec['min'] + int(x * (spec['max'] - spec['min'] + 1))))
            else:
                val = spec['min'] + (spec['max'] - spec['min']) * x
            user[name] = val
        if rng.random() < uni['wide']['oa_ach'].get('zero_share', 0):
            user['oa_ach'] = 0.0
        user['gfa_m2'] = user.pop('floor_plate_m2') * user['n_floors']
        user['t_heat_c'] = min(user['t_heat_c'], user['t_cool_c'] - 1.0)
        out.append((user, 'wide'))
    return [(i, user, comp) for i, (user, comp) in enumerate(out)]


def samples_for(btype, station, n, seed):
    """[(id, user, component)] for a per-type model or the unified one."""
    if btype == UNIFIED:
        return make_samples_unified(station, n, seed)
    return [(i, u, btype) for i, u in make_samples(btype, station, n, seed)]


def _work(args):
    i, user, exe, version = args[:4]
    component = args[4] if len(args) > 4 else None
    try:
        r = run_scenario.run(user, exe=exe, version=version)
    except Exception as e:
        return i, user, None, '%s: %s' % (type(e).__name__, e)
    if not r.get('ok'):
        return i, user, None, json.dumps({k: r.get(k) for k in ('error', 'messages')})
    sc = r['scenario']
    plate = sc['gfa_m2'] / sc['n_floors']
    rec = {'id': i, 'scenario': sc, 'features': features.features(sc),
           'targets': features.targets(r['design_days'], sc['gfa_m2'], r.get('components')),
           'eplus': r['engine']['version'], 'warnings': r['messages']['warnings'],
           'severe': r['messages']['severe'],
           'severe_messages': r['messages'].get('severe_messages', [])[:5],
           # Clock-hour block totals (W/m2) per design day, plus the highest
           # single-timestep value: enough to re-derive peaks under another
           # definition without new EnergyPlus runs.
           'hourly_w_m2': {k: [round(v / sc['gfa_m2'], 2) for v in dd.get('hourly_means_w', [])]
                           for k, dd in r['design_days'].items()},
           'max_timestep_w_m2': {k: round(dd['block']['max_timestep_w'] / sc['gfa_m2'], 2)
                                 for k, dd in r['design_days'].items() if dd['block'].get('max_timestep_w') is not None},
           # Per modelled floor (G ground, M one middle floor, T top, S single),
           # per m2 of that floor: clock-hour totals per design day, the
           # ventilation load and heat recovered in its peak hour, and its load
           # components. Lets mixed-use buildings be assembled floor by floor.
           'floors_w_m2': {k: {f: {'hourly': [round(v / plate, 2) for v in fd['hourly_w']],
                                   'oa': round(fd['oa_w'] / plate, 2), 'hr': round(fd['hr_w'] / plate, 2)}
                               for f, fd in (dd.get('floors') or {}).items()}
                           for k, dd in r['design_days'].items()},
           'floor_components_w_m2': {f: {kind: {c: round(v / plate, 3) for c, v in g.items()} for kind, g in grp.items()}
                                     for f, grp in ((f, results.component_groups(c))
                                                    for f, c in (r.get('components_by_floor') or {}).items()) if grp}}
    if component:
        rec['component'] = component
    return i, user, rec, None


def _hms(sec):
    sec = int(round(sec))
    return '%d:%02d:%02d' % (sec // 3600, sec % 3600 // 60, sec % 60)


def main(argv):
    ap = argparse.ArgumentParser()
    ap.add_argument('--types', required=True, help="comma list of building types, or 'all'")
    ap.add_argument('--stations', required=True, help="comma list of station ids, or 'all'")
    ap.add_argument('--shard', default=None, help="K/N: run only this machine's share, e.g. 2/4")
    ap.add_argument('--n', type=int, default=500)
    ap.add_argument('--workers', type=int, default=max(1, (os.cpu_count() or 2) - 1))
    ap.add_argument('--seed', type=int, default=1)
    a = ap.parse_args(argv)
    shard = runs.parse_shard(a.shard) if a.shard else None

    exe, version = run_scenario.find_energyplus()
    if not exe:
        sys.exit('EnergyPlus not found. Install it and set ENERGYPLUS_EXE.')
    if a.stations == 'all':
        with open(os.path.join(HERE, 'stations.json')) as f:
            stations = [s['id'] for s in json.load(f)['stations']]
    else:
        stations = a.stations.split(',')
    types = list(scenario.load_archetypes()['types']) if a.types == 'all' else a.types.split(',')
    unknown = [t for t in types if t not in scenario.load_archetypes()['types'] and t != UNIFIED]
    if unknown:
        sys.exit('Unknown building type(s): %s' % ', '.join(unknown))
    os.makedirs(RUNS, exist_ok=True)

    for btype in types:
        for station in stations:
            path = runs.result_file(RUNS, btype, station, shard)
            # Skip ids already done in ANY file for this pair (other shards copied in).
            done = {r['id'] for r in runs.load(runs.files_for(RUNS, btype, station))}
            samples = samples_for(btype, station, a.n, a.seed)
            if shard:
                samples = [s for s in samples if s[0] % shard[1] == shard[0] - 1]
            todo = [(i, u, exe, version, c) for i, u, c in samples if i not in done]
            print('%s/%s%s: %d of %d done, %d to run' % (
                btype, station, ' (shard %d/%d)' % shard if shard else '',
                len(samples) - len(todo), len(samples), len(todo)), flush=True)
            if not todo:
                continue
            failed_path = path[:-len('.jsonl')] + '.failed.jsonl'
            n_ok = n_bad = 0
            t0 = time.time()
            with ProcessPoolExecutor(max_workers=a.workers) as pool, open(path, 'a') as ok_f:
                futs = [pool.submit(_work, t) for t in todo]
                for k, fut in enumerate(as_completed(futs), 1):
                    i, user, rec, err = fut.result()
                    if rec:
                        ok_f.write(json.dumps(rec) + '\n')
                        ok_f.flush()
                        n_ok += 1
                    else:
                        # Only created when something actually fails.
                        with open(failed_path, 'a') as bad_f:
                            bad_f.write(json.dumps({'id': i, 'user': user, 'error': err}) + '\n')
                        n_bad += 1
                    if k % 25 == 0:
                        el = time.time() - t0
                        print('  %d/%d  %s elapsed, about %s left' % (
                            k, len(todo), _hms(el), _hms(el / k * (len(todo) - k))), flush=True)
            el = time.time() - t0
            print('  finished: %d ok, %d failed in %s (%.1f s per run)%s' % (
                n_ok, n_bad, _hms(el), el / max(1, len(todo)),
                (' - see %s' % failed_path) if n_bad else ''), flush=True)


if __name__ == '__main__':
    main(sys.argv[1:])

"""Generate surrogate training data: Latin-hypercube samples of the design
space in variables.json, each run through EnergyPlus.

Usage:
  python3 engine/batch.py --types office --stations chicago,houston --n 500 --workers 4

Output: engine/runs/<type>__<station>.jsonl, one line per completed sample:
  {"id": 17, "scenario": {...}, "features": [...], "targets": {...}, "eplus": "..."}
Runs are resumable: samples already in the file are skipped. Failed samples are
written to <type>__<station>.failed.jsonl with the error.
"""
import argparse
import json
import os
import random
import sys
from concurrent.futures import ProcessPoolExecutor, as_completed

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import run_scenario  # noqa: E402
from lib import features, scenario  # noqa: E402

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
        user['oa_per_person_ls'] = arch['oa_per_person_ls']['value'] * v['oa_multiplier']
        user['oa_per_area_ls_m2'] = arch['oa_per_area_ls_m2']['value'] * v['oa_multiplier']
        user['gfa_m2'] = v['floor_plate_m2'] * v['n_floors']
        out.append((i, user))
    return out


def _work(args):
    i, user, exe, version = args
    try:
        r = run_scenario.run(user, exe=exe, version=version)
    except Exception as e:
        return i, user, None, '%s: %s' % (type(e).__name__, e)
    if not r.get('ok'):
        return i, user, None, json.dumps({k: r.get(k) for k in ('error', 'messages')})
    sc = r['scenario']
    rec = {'id': i, 'scenario': sc, 'features': features.features(sc),
           'targets': features.targets(r['design_days'], sc['gfa_m2']),
           'eplus': r['engine']['version'], 'warnings': r['messages']['warnings'],
           'severe': r['messages']['severe']}
    return i, user, rec, None


def main(argv):
    ap = argparse.ArgumentParser()
    ap.add_argument('--types', required=True)
    ap.add_argument('--stations', required=True, help="comma list of station ids, or 'all'")
    ap.add_argument('--n', type=int, default=500)
    ap.add_argument('--workers', type=int, default=max(1, (os.cpu_count() or 2) - 1))
    ap.add_argument('--seed', type=int, default=1)
    a = ap.parse_args(argv)

    exe, version = run_scenario.find_energyplus()
    if not exe:
        sys.exit('EnergyPlus not found. Install it and set ENERGYPLUS_EXE.')
    if a.stations == 'all':
        with open(os.path.join(HERE, 'stations.json')) as f:
            stations = [s['id'] for s in json.load(f)['stations']]
    else:
        stations = a.stations.split(',')
    os.makedirs(RUNS, exist_ok=True)

    for btype in a.types.split(','):
        for station in stations:
            path = os.path.join(RUNS, '%s__%s.jsonl' % (btype, station))
            done = set()
            if os.path.exists(path):
                with open(path) as f:
                    done = {json.loads(l)['id'] for l in f if l.strip()}
            todo = [(i, u, exe, version) for i, u in make_samples(btype, station, a.n, a.seed) if i not in done]
            print('%s/%s: %d done, %d to run' % (btype, station, len(done), len(todo)), flush=True)
            if not todo:
                continue
            with ProcessPoolExecutor(max_workers=a.workers) as pool, \
                    open(path, 'a') as ok_f, open(path.replace('.jsonl', '.failed.jsonl'), 'a') as bad_f:
                futs = [pool.submit(_work, t) for t in todo]
                for k, fut in enumerate(as_completed(futs), 1):
                    i, user, rec, err = fut.result()
                    if rec:
                        ok_f.write(json.dumps(rec) + '\n')
                        ok_f.flush()
                    else:
                        bad_f.write(json.dumps({'id': i, 'user': user, 'error': err}) + '\n')
                        bad_f.flush()
                    if k % 25 == 0:
                        print('  %d/%d' % (k, len(todo)), flush=True)


if __name__ == '__main__':
    main(sys.argv[1:])

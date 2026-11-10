"""Learning curves: how a model's tested accuracy changes with the number of
training runs, using only runs that already exist.

For each type x station, refit on random subsets of its training runs (the
same fit as fit_surrogate.py: ridge, alpha chosen by k-fold CV) and score
every fit against that model's independent test runs (engine/runs/test/,
seed 9001) with validate.score, the published pass rule (worst P95 error on
the governing peaks, 5% limit). Test runs are never used for fitting.

    python3 engine/learning_curve.py                       # every model with runs
    python3 engine/learning_curve.py --types lab --stations denver --sizes 100,250,500,750,1000
    python3 engine/learning_curve.py -j 4 --out engine/validation/learning_curve.json

Only the peak outputs the pass rule scores (|total_w_m2) are fitted, which
gives the same scores as a full fit and is about ten times faster.
"""
import argparse
import json
import os
import random
import sys
from concurrent.futures import ProcessPoolExecutor, as_completed

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import fit_surrogate  # noqa: E402
import validate  # noqa: E402
from lib import runs  # noqa: E402

TRAIN_DIR = os.path.join(HERE, 'runs')


def curve(key, sizes, repeats, threshold, extra_dirs=()):
    btype, station = key.split('|')
    train = runs.load_sets([TRAIN_DIR] + list(extra_dirs), btype, station)
    test = runs.load([runs.result_file(validate.TEST_RUNS, btype, station)])
    only = lambda name: name.endswith('|total_w_m2')  # noqa: E731
    out = {'key': key, 'n_train': len(train), 'n_test': len(test), 'points': []}
    for n in sizes:
        if n > len(train):
            continue
        reps = 1 if n == len(train) else repeats
        for rep in range(reps):
            sub = train if n == len(train) else random.Random(1000 * n + rep).sample(train, n)
            model, err = fit_surrogate.fit_records(sub, only=only, min_samples=min(100, n))
            if not model:
                continue
            s = validate.score(model, test, threshold)
            out['points'].append({'n': n, 'rep': rep, 'worst': s['worst_governing_p95_pct'],
                                  'worst_output': s['worst_governing_output'],
                                  'by_peak': {k: v['p95_abs_pct'] for k, v in s['governing'].items()}})
    return out


def main(argv):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--types')
    ap.add_argument('--stations')
    ap.add_argument('--sizes', default='100,200,300,400,500')
    ap.add_argument('--repeats', type=int, default=5)
    ap.add_argument('--threshold', type=float, default=5.0)
    ap.add_argument('--extra-runs', action='append', default=[], help='another directory of training runs to add')
    ap.add_argument('--min-train', type=int, default=0, help='only models with at least this many training runs')
    ap.add_argument('-j', type=int, default=os.cpu_count() or 1)
    ap.add_argument('--out', default=os.path.join(HERE, 'validation', 'learning_curve.json'))
    a = ap.parse_args(argv)
    sizes = [int(x) for x in a.sizes.split(',')]
    keys = ['%s|%s' % p for p in runs.pairs(TRAIN_DIR)]
    if a.types:
        keys = [k for k in keys if k.split('|')[0] in a.types.split(',')]
    if a.stations:
        keys = [k for k in keys if k.split('|')[1] in a.stations.split(',')]
    keys = [k for k in keys if os.path.exists(runs.result_file(validate.TEST_RUNS, *k.split('|')))]
    if a.min_train:
        keys = [k for k in keys if sum(1 for f in runs.files_for(TRAIN_DIR, *k.split('|')) for _ in open(f)) >= a.min_train]
    results = {}
    with ProcessPoolExecutor(max_workers=a.j) as ex:
        futs = {ex.submit(curve, k, sizes, a.repeats, a.threshold, a.extra_runs): k for k in keys}
        for i, f in enumerate(as_completed(futs), 1):
            r = f.result()
            results[r['key']] = r
            full = [p['worst'] for p in r['points'] if p['n'] == max(pp['n'] for pp in r['points'])]
            sys.stderr.write('[%d/%d] %s  worst P95 at n=%d: %s\n' % (i, len(keys), r['key'], r['n_train'],
                                                                     ', '.join('%.2f%%' % x for x in full)))
    os.makedirs(os.path.dirname(a.out), exist_ok=True)
    with open(a.out, 'w') as f:
        json.dump({'sizes': sizes, 'repeats': a.repeats, 'threshold_pct': a.threshold, 'models': results}, f)
    sys.stderr.write('wrote %s\n' % a.out)
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))

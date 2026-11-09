"""How many extended-design-space runs (batch.py --extended) a model needs.

For each type x station with extended runs: train on all base runs plus a
random subset of m extended runs (m = 0, 100, ...), the same fit as
fit_surrogate.py, and score with validate.score on the base test runs and,
separately, on the extended test runs (runs/test/ext). Test runs are never
used for fitting.

    python3 engine/extension_curve.py --pairs office:chicago,lab:boston --sizes 0,100,200,300,400,500
"""
import argparse
import json
import os
import random
import sys
from concurrent.futures import ProcessPoolExecutor

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import fit_surrogate  # noqa: E402
import validate  # noqa: E402
from lib import runs  # noqa: E402


def curve(pair, sizes, repeats, threshold):
    bt, st = pair.split(':')
    base = runs.load(runs.files_for(os.path.join(HERE, 'runs'), bt, st))
    ext = runs.load(runs.files_for(os.path.join(HERE, 'runs', 'ext'), bt, st))
    t_base = runs.load([runs.result_file(validate.TEST_RUNS, bt, st)])
    t_ext = runs.load([runs.result_file(validate.TEST_RUNS_EXT, bt, st)])
    only = lambda name: name.endswith('|total_w_m2')  # noqa: E731
    pts = []
    for m in sizes:
        if m > len(ext):
            continue
        for rep in range(1 if m in (0, len(ext)) else repeats):
            sub = ext if m == len(ext) else random.Random(7919 * m + rep).sample(ext, m)
            model, _ = fit_surrogate.fit_records(base + sub, only=only)
            sb, se = validate.score(model, t_base, threshold), validate.score(model, t_ext, threshold)
            pts.append({'m': m, 'rep': rep, 'base': sb['worst_governing_p95_pct'], 'ext': se['worst_governing_p95_pct'],
                        'ext_by_peak': {k: v['p95_abs_pct'] for k, v in se['governing'].items()}})
            sys.stderr.write('%s m=%d rep=%d  base %.2f%%  extended %.2f%%\n' % (pair, m, rep, pts[-1]['base'], pts[-1]['ext']))
    return pair, {'n_base': len(base), 'n_ext': len(ext), 'n_test_base': len(t_base), 'n_test_ext': len(t_ext), 'points': pts}


def main(argv):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--pairs', required=True, help='type:station,...')
    ap.add_argument('--sizes', default='0,100,200,300,400,500')
    ap.add_argument('--repeats', type=int, default=3)
    ap.add_argument('--threshold', type=float, default=5.0)
    ap.add_argument('-j', type=int, default=os.cpu_count() or 1)
    ap.add_argument('--out', default=os.path.join(HERE, 'validation', 'extension_curve.json'))
    a = ap.parse_args(argv)
    sizes = [int(x) for x in a.sizes.split(',')]
    with ProcessPoolExecutor(max_workers=a.j) as ex:
        res = dict(ex.map(curve, a.pairs.split(','), [sizes] * 99, [a.repeats] * 99, [a.threshold] * 99))
    os.makedirs(os.path.dirname(a.out), exist_ok=True)
    with open(a.out, 'w') as f:
        json.dump(res, f)
    sys.stderr.write('wrote %s\n' % a.out)


if __name__ == '__main__':
    main(sys.argv[1:])

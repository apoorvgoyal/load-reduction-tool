"""Fit the surrogate (option B) from batch.py output and publish it to
web/data/loads-surrogate.js for the browser.

Model: quadratic polynomial (all squares and pairwise interactions) on
standardised features, ridge-regularised; the ridge strength is chosen by
k-fold cross-validation. The reported error statistics are out-of-fold, i.e.
each sample is predicted by a model that never saw it.

Usage:
  python3 engine/fit_surrogate.py                    # every runs/*.jsonl
  python3 engine/fit_surrogate.py --only office__chicago
  python3 engine/fit_surrogate.py --min-samples 200

Requires numpy.
"""
import argparse
import datetime
import json
import os
import sys

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

from lib import features, runs, surrogate  # noqa: E402

OUT_JS = os.path.join(os.path.dirname(HERE), 'web', 'data', 'loads-surrogate.js')
ALPHAS = [1e-6, 1e-5, 1e-4, 1e-3, 1e-2, 1e-1, 1.0, 10.0]


def expand(z):
    """Quadratic expansion of standardised features z (n x d)."""
    n, d = z.shape
    cols = [np.ones(n)]
    cols += [z[:, i] for i in range(d)]
    for i in range(d):
        for j in range(i, d):
            cols.append(z[:, i] * z[:, j])
    return np.column_stack(cols)


def ridge(X, y, alpha):
    p = X.shape[1]
    reg = alpha * np.eye(p)
    reg[0, 0] = 0.0     # don't shrink the intercept
    return np.linalg.solve(X.T @ X + reg, X.T @ y)


def kfold_predict(X, y, alpha, k, rng):
    idx = rng.permutation(len(y))
    folds = np.array_split(idx, k)
    pred = np.empty_like(y)
    for f in folds:
        mask = np.ones(len(y), bool)
        mask[f] = False
        coef = ridge(X[mask], y[mask], alpha)
        pred[f] = X[f] @ coef
    return pred


def stats(y, pred):
    err = pred - y
    rmse = float(np.sqrt(np.mean(err ** 2)))
    ss = float(np.sum((y - y.mean()) ** 2))
    r2 = 1.0 - float(np.sum(err ** 2)) / ss if ss > 0 else None
    denom = np.maximum(np.abs(y), 1e-9)
    pct = np.abs(err) / denom * 100.0
    big = np.abs(y) > 0.05 * np.max(np.abs(y)) if np.max(np.abs(y)) > 0 else np.zeros_like(y, bool)
    return {
        'rmse': rmse, 'r2': r2,
        'p50_abs_pct': float(np.percentile(pct[big], 50)) if big.any() else None,
        'p95_abs_pct': float(np.percentile(pct[big], 95)) if big.any() else None,
        'max_abs_pct': float(np.max(pct[big])) if big.any() else None,
        'y_min': float(y.min()), 'y_max': float(y.max()),
    }


def fit_file(paths, k=5, min_samples=100, btype=None):
    """Fit one type x station from one result file or a list of them (shards)."""
    recs = runs.load([paths] if isinstance(paths, str) else paths)
    if len(recs) < min_samples:
        return None, '%d samples < %d' % (len(recs), min_samples)
    # Features are recomputed from each saved scenario, so a change to the
    # feature set only needs a refit, not new EnergyPlus runs.
    Xraw = np.array([features.features(r['scenario']) for r in recs], float)
    mean = Xraw.mean(0)
    std = Xraw.std(0)
    std[std == 0] = 1.0
    X = expand((Xraw - mean) / std)
    names = sorted(set().union(*[r['targets'].keys() for r in recs]))
    rng = np.random.default_rng(0)
    outs = {}
    for name in names:
        rows = [i for i, r in enumerate(recs) if name in r['targets']]
        if len(rows) < min_samples:
            continue
        y = np.array([recs[i]['targets'][name] for i in rows], float)
        Xi = X[rows]
        best = None
        for a in ALPHAS:
            pred = kfold_predict(Xi, y, a, k, np.random.default_rng(0))
            s = stats(y, pred)
            if best is None or s['rmse'] < best[1]['rmse']:
                best = (a, s, pred)
        alpha, s, _ = best
        coef = ridge(Xi, y, alpha)
        outs[name] = {'coef': [round(float(c), 8) for c in coef], 'alpha': alpha, 'cv': s}
    sc0 = recs[0]['scenario']
    fixed = {}
    with open(os.path.join(HERE, 'variables.json')) as f:
        cfg = json.load(f)
    unified = btype == 'unified'
    # The shared model varies schedules, so fewer inputs are held fixed.
    fixed_keys = cfg['unified']['fixed_inputs'] if unified else cfg['fixed_inputs']
    for kname in fixed_keys:
        fixed[kname] = sc0.get(kname)
    components = {}
    for r in recs:
        components[r.get('component', sc0['type'])] = components.get(r.get('component', sc0['type']), 0) + 1
    return {
        'type': 'unified' if unified else sc0['type'], 'station': sc0['station'],
        'components': components, 'climate_zone': sc0['climate_zone'],
        'n_samples': len(recs),
        'eplus_versions': sorted(set(r.get('eplus') or '' for r in recs)),
        'samples_with_severe_errors': sum(1 for r in recs if r.get('severe')),
        'features': features.FEATURES,
        'feature_mean': [float(x) for x in mean],
        'feature_std': [float(x) for x in std],
        'feature_min': [float(x) for x in Xraw.min(0)],
        'feature_max': [float(x) for x in Xraw.max(0)],
        'fixed_inputs': fixed,
        'cv_folds': k,
        'outputs': outs,
        'fitted_at': datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='seconds'),
    }, None


def load_existing():
    if not os.path.exists(OUT_JS):
        return {}
    return surrogate.load_published(OUT_JS)['models']


def main(argv):
    ap = argparse.ArgumentParser()
    ap.add_argument('--only', default=None)
    ap.add_argument('--min-samples', type=int, default=100)
    ap.add_argument('--folds', type=int, default=5)
    a = ap.parse_args(argv)
    models = load_existing()
    runs_dir = os.path.join(HERE, 'runs')
    todo = runs.pairs(runs_dir)
    if a.only:
        todo = [p for p in todo if ('%s__%s' % p).startswith(a.only)]
    for btype, station in todo:
        files = runs.files_for(runs_dir, btype, station)
        m, why = fit_file(files, a.folds, a.min_samples, btype=btype)
        key = '%s|%s' % (btype, station)
        if not m:
            print('skip %s: %s' % (key, why))
            continue
        worst = max((o['cv']['p95_abs_pct'] or 0) for k, o in m['outputs'].items() if '|total_w_m2' in k)
        print('%s: n=%d, worst P95 out-of-fold error on block totals %.1f%%' % (key, m['n_samples'], worst))
        models[key] = m          # replaces any earlier fit, including its validation result;
                                 # re-run validate.py (use --skip-run to reuse existing test runs)
    payload = {'meta': {'generator': 'engine/fit_surrogate.py', 'model': 'quadratic ridge, standardised features',
                        'features': features.FEATURES},
               'models': models}
    surrogate.write_published(OUT_JS, payload)
    print('wrote', OUT_JS, '(%d models)' % len(models))


if __name__ == '__main__':
    main(sys.argv[1:])

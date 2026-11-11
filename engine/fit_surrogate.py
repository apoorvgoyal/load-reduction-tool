"""Fit the surrogate (option B) from batch.py output and publish it to
web/data/loads-surrogate.js for the browser.

Model: quadratic polynomial (all squares and pairwise interactions) on
standardised features, ridge-regularised; the ridge strength is chosen by
k-fold cross-validation. The reported error statistics are out-of-fold, i.e.
each sample is predicted by a model that never saw it.

Where the quadratic's out-of-fold error on the reported peaks is above
MLP_TRY_ABOVE_PCT, a small neural-network ensemble (MLP) is also fitted
(needs scikit-learn) and kept instead if its own out-of-fold error on those
peaks is lower. Both are judged on training runs only; the independent test
runs (validate.py) are never used to choose. The networks capture switch-like
behaviour, e.g. dehumidification turning on and off on humid design days in
dry and mild climates, which a quadratic cannot follow.

Usage:
  python3 engine/fit_surrogate.py                    # every runs/*.jsonl
  python3 engine/fit_surrogate.py --only office__chicago
  python3 engine/fit_surrogate.py --min-samples 200

Requires numpy; scikit-learn for the neural-network form (optional: without
it every model is quadratic).
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
ADIABATIC_FLAGS = ['adiabatic_wall_n', 'adiabatic_wall_e', 'adiabatic_wall_s', 'adiabatic_wall_w',
                   'adiabatic_roof', 'adiabatic_floor']
ALPHAS = [1e-6, 1e-5, 1e-4, 1e-3, 1e-2, 1e-1, 1.0, 10.0]
# Neural-network form (see module docstring). Tuning settings, not physical values.
MLP_TRY_ABOVE_PCT = 3.0        # quadratic out-of-fold governing P95 above this -> also try the MLP
MLP_HIDDEN = (64, 64)
MLP_ALPHA = 1e-3
MLP_MEMBERS = 5                # networks averaged in the published ensemble
MLP_CV_MEMBERS = 3             # networks per fold when estimating the out-of-fold error


def _mlp_nets(Z, Y, members, seed0=0):
    """Fit `members` ReLU networks on standardised Z, Y (scikit-learn)."""
    import warnings
    from sklearn.neural_network import MLPRegressor
    nets = []
    with warnings.catch_warnings():
        warnings.simplefilter('ignore')
        for i in range(members):
            m = MLPRegressor(hidden_layer_sizes=MLP_HIDDEN, alpha=MLP_ALPHA, max_iter=4000, random_state=seed0 + i,
                             learning_rate_init=2e-3, tol=1e-6, n_iter_no_change=50).fit(Z, Y)
            nets.append({'W': [w.tolist() for w in m.coefs_], 'b': [b.tolist() for b in m.intercepts_]})
    return nets


def _mlp_apply(nets, Z):
    acc = 0
    for net in nets:
        a = Z
        for li, (W, b) in enumerate(zip(net['W'], net['b'])):
            a = a @ np.array(W) + np.array(b)
            if li < len(net['W']) - 1:
                a = np.maximum(a, 0)
        acc = acc + a
    return acc / len(nets)


def mlp_available():
    try:
        import sklearn  # noqa: F401
        return True
    except ImportError:
        return False


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
    return fit_records(recs, k=k, min_samples=min_samples, btype=btype)


def fit_records(recs, k=5, min_samples=100, btype=None, only=None, mlp=True):
    """Fit from loaded run records. `only(name)` limits the outputs fitted
    (the learning-curve study fits just the peaks it scores). `mlp=False`
    keeps every model quadratic."""
    if len(recs) < min_samples:
        return None, '%d samples < %d' % (len(recs), min_samples)
    # Features are recomputed from each saved scenario, so a change to the
    # feature set only needs a refit, not new EnergyPlus runs.
    Xraw = np.array([features.features(r['scenario']) for r in recs], float)
    mean = Xraw.mean(0)
    std = Xraw.std(0)
    # A feature that does not vary (or only by rounding noise) is a constant:
    # leave it unscaled rather than blow its noise up to unit size.
    std[std < 1e-9 * np.maximum(1.0, np.abs(mean))] = 1.0
    X = expand((Xraw - mean) / std)
    names = sorted(set().union(*[r['targets'].keys() for r in recs]))
    if only:
        names = [nm for nm in names if only(nm)]
    outs, oof = {}, {}
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
        alpha, s, pred = best
        coef = ridge(Xi, y, alpha)
        outs[name] = {'coef': [round(float(c), 8) for c in coef], 'alpha': alpha, 'cv': s}
        if len(rows) == len(recs):
            oof[name] = pred
    form, mlp_model, gov_cv = _choose_form(recs, Xraw, mean, std, outs, oof, k, mlp)
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
        # On/off inputs that took both values in this model's training runs;
        # the page asks for EnergyPlus when another one is switched on.
        # Inputs beyond this floor plate, or with an adiabatic surface, belong to
        # the extended design space and are judged on its own test (validate.py).
        'base_floor_plate_max_m2': cfg['sampled']['floor_plate_m2']['max'],
        'varied_flags': [f for f in ADIABATIC_FLAGS
                         if len({bool(r['scenario'].get(f)) for r in recs}) == 2],
        'cv_folds': k,
        # 'quadratic' or 'mlp', and the out-of-fold error on the reported peaks
        # (validate.py rule, training runs only) that chose it.
        'form': form,
        'cv_governing_p95_pct': gov_cv,
        'outputs': outs,
        **({'mlp': mlp_model} if mlp_model else {}),
        'fitted_at': datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='seconds'),
    }, None


def _governing_p95(preds, recs):
    import validate
    g = validate.governing_from_predictions(preds, recs)
    vals = [float(v['p95_abs_pct']) for v in g.values() if v['p95_abs_pct'] is not None]
    return max(vals) if vals else None


def _rows_to_preds(names, P):
    """Per-record prediction dicts with the page's clamp (loads >= 0)."""
    return [{nm: (v if nm.startswith('comp_') else max(0.0, v)) for nm, v in zip(names, row)} for row in P]


def _choose_form(recs, Xraw, mean, std, outs, oof, k, allow_mlp):
    """Quadratic unless an MLP ensemble has a lower out-of-fold error on the
    reported peaks. Rewrites `outs` for the outputs the MLP takes over."""
    names = sorted(oof)
    if not names or not any(nm.endswith('|total_w_m2') for nm in names):
        return 'quadratic', None, None
    q_gov = _governing_p95(_rows_to_preds(names, np.column_stack([oof[nm] for nm in names])), recs)
    if not allow_mlp or q_gov is None or q_gov <= MLP_TRY_ABOVE_PCT or not mlp_available():
        return 'quadratic', None, {'quadratic': q_gov}
    # The networks predict the peaks only (block totals per design day): fitted
    # on those alone they are clearly more accurate than spread over every
    # output. Breakdowns (sensible, latent, components, ...) stay quadratic.
    names = [nm for nm in names if nm.endswith('|total_w_m2')]
    Z = (Xraw - mean) / std
    Y = np.array([[r['targets'][nm] for nm in names] for r in recs], float)
    ym, ys = Y.mean(0), Y.std(0)
    ys[ys < 1e-12] = 1.0
    Yz = (Y - ym) / ys
    # Same folds as the quadratic's alpha search (kfold_predict, seed 0).
    folds = np.array_split(np.random.default_rng(0).permutation(len(recs)), k)
    P = np.empty_like(Y)
    for fi, f in enumerate(folds):
        mask = np.ones(len(recs), bool)
        mask[f] = False
        P[f] = _mlp_apply(_mlp_nets(Z[mask], Yz[mask], MLP_CV_MEMBERS, seed0=100 * fi), Z[f]) * ys + ym
    m_gov = _governing_p95(_rows_to_preds(names, P), recs)
    gov = {'quadratic': q_gov, 'mlp': m_gov}
    if m_gov is None or m_gov >= q_gov:
        return 'quadratic', None, gov
    for j, nm in enumerate(names):
        outs[nm] = {'cv': stats(Y[:, j], P[:, j]), 'form': 'mlp'}
    mlp = {'names': names, 'hidden': list(MLP_HIDDEN), 'alpha': MLP_ALPHA,
           'y_mean': [float(v) for v in ym], 'y_std': [float(v) for v in ys],
           'nets': _mlp_nets(Z, Yz, MLP_MEMBERS)}
    return 'mlp', mlp, gov


def load_existing():
    if not os.path.exists(OUT_JS):
        return {}
    return surrogate.load_published(OUT_JS)['models']


def _fit_pair(args):
    btype, station, runs_dir, folds, min_samples, mlp = args
    # Base runs plus any extended-design-space runs (batch.py --extended).
    recs = runs.load_sets([runs_dir, os.path.join(runs_dir, 'ext')], btype, station)
    m, why = fit_records(recs, folds, min_samples, btype=btype, mlp=mlp)
    return btype, station, m, why


def main(argv):
    ap = argparse.ArgumentParser()
    ap.add_argument('--only', default=None)
    ap.add_argument('--min-samples', type=int, default=100)
    ap.add_argument('--folds', type=int, default=5)
    ap.add_argument('--no-mlp', action='store_true', help='keep every model quadratic')
    ap.add_argument('-j', type=int, default=1, help='models fitted in parallel')
    a = ap.parse_args(argv)
    models = load_existing()
    runs_dir = os.path.join(HERE, 'runs')
    todo = runs.pairs(runs_dir)
    if a.only:
        todo = [p for p in todo if ('%s__%s' % p).startswith(a.only)]
    jobs = [(bt, st, runs_dir, a.folds, a.min_samples, not a.no_mlp) for bt, st in todo]
    if a.j > 1:
        os.environ.setdefault('OMP_NUM_THREADS', '1')
        from concurrent.futures import ProcessPoolExecutor
        with ProcessPoolExecutor(a.j) as ex:
            results = list(ex.map(_fit_pair, jobs))
    else:
        results = [_fit_pair(j) for j in jobs]
    for btype, station, m, why in results:
        key = '%s|%s' % (btype, station)
        if not m:
            print('skip %s: %s' % (key, why))
            continue
        worst = max((o['cv']['p95_abs_pct'] or 0) for k, o in m['outputs'].items() if '|total_w_m2' in k)
        g = m.get('cv_governing_p95_pct') or {}
        print('%s: n=%d, %s, worst P95 out-of-fold error on block totals %.1f%%; reported peaks %s' % (
            key, m['n_samples'], m['form'], worst, ', '.join('%s %.1f%%' % kv for kv in g.items() if kv[1] is not None)))
        models[key] = m          # replaces any earlier fit, including its validation result;
                                 # re-run validate.py (use --skip-run to reuse existing test runs)
    payload = {'meta': {'generator': 'engine/fit_surrogate.py', 'model': 'quadratic ridge or MLP ensemble, standardised features',
                        'features': features.FEATURES},
               'models': models}
    surrogate.write_published(OUT_JS, payload)
    print('wrote', OUT_JS, '(%d models)' % len(models))


if __name__ == '__main__':
    main(sys.argv[1:])

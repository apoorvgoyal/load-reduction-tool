"""Test the published surrogate against fresh EnergyPlus runs it never saw.

For each building type x station that has a trained model:
  1. Draw an independent test set: a Latin-hypercube sample with a different
     seed from training, plus the building type's default scenario.
  2. Run any test cases not already run through EnergyPlus (resumable; stored
     in engine/runs/test/, kept separate from training data).
  3. Predict every case with the model exactly as the page does, and compare.
  4. Write engine/validation/report.md and report.json, record the result in
     web/data/loads-surrogate.js (the page shows it), and exit non-zero if any
     model misses the threshold.

Usage:
  python3 engine/validate.py                                  # every trained model
  python3 engine/validate.py --types office --stations chicago --n 50
  python3 engine/validate.py --skip-run                       # re-score existing test runs only
  python3 engine/validate.py --threshold 5                    # worst P95 % on block totals

The default threshold is 5%: the worst 95th-percentile absolute error across
every design day's block total (cooling and heating) must not exceed it.
"""
import argparse
import datetime
import json
import math
import os
import sys
from concurrent.futures import ProcessPoolExecutor, as_completed

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import batch  # noqa: E402
import run_scenario  # noqa: E402
from lib import runs, scenario, surrogate  # noqa: E402

TEST_RUNS = os.path.join(HERE, 'runs', 'test')
REPORT_DIR = os.path.join(HERE, 'validation')
SURROGATE_JS = os.path.join(os.path.dirname(HERE), 'web', 'data', 'loads-surrogate.js')
TEST_SEED = 9001          # training uses seed 1; never reuse the training seed here
DEFAULT_CASE_ID = -1


def test_cases(btype, station, n, seed):
    """Independent test scenarios: LHS with a separate seed + the type default."""
    cases = batch.make_samples(btype, station, n, seed)
    cases.append((DEFAULT_CASE_ID, {'type': btype, 'station': station}))
    return cases


def ensure_runs(btype, station, cases, workers, exe, version):
    os.makedirs(TEST_RUNS, exist_ok=True)
    path = runs.result_file(TEST_RUNS, btype, station)
    done = {r['id'] for r in runs.load([path])} if os.path.exists(path) else set()
    todo = [(i, u, exe, version) for i, u in cases if i not in done]
    print('%s/%s: %d test cases, %d to run in EnergyPlus' % (btype, station, len(cases), len(todo)), flush=True)
    failed = 0
    if todo:
        with ProcessPoolExecutor(max_workers=workers) as pool, open(path, 'a') as f:
            for fut in as_completed([pool.submit(batch._work, t) for t in todo]):
                i, user, rec, err = fut.result()
                if rec:
                    f.write(json.dumps(rec) + '\n')
                    f.flush()
                else:
                    failed += 1
                    print('  test case %s failed: %s' % (i, (err or '')[:200]), flush=True)
    return path, failed


def _pct(vals, q):
    s = sorted(vals)
    if not s:
        return None
    k = (len(s) - 1) * q / 100.0
    lo, hi = int(math.floor(k)), int(math.ceil(k))
    return s[lo] + (s[hi] - s[lo]) * (k - lo)


def score(model, recs, threshold):
    """Compare predictions with EnergyPlus for every output the model has."""
    errs, abs_errs, extrap_cases = {}, {}, 0
    for r in recs:
        pred, extrap = surrogate.predict(model, r['scenario'])
        if extrap:
            extrap_cases += 1
        for name, y in r['targets'].items():
            if name not in pred:
                continue
            e = pred[name] - y
            abs_errs.setdefault(name, []).append(abs(e))
            # Percent errors only where the value is meaningful (same rule as the fit).
            errs.setdefault(name, []).append((e, y))
    per_output = {}
    for name, pairs in errs.items():
        ys = [abs(y) for _, y in pairs]
        floor = 0.05 * max(ys) if ys else 0
        pct = [abs(e) / abs(y) * 100 for e, y in pairs if abs(y) > floor and abs(y) > 1e-9]
        per_output[name] = {
            'n': len(pairs),
            'p50_abs_pct': _pct(pct, 50), 'p95_abs_pct': _pct(pct, 95), 'max_abs_pct': max(pct) if pct else None,
            'rmse_w_m2': math.sqrt(sum(e * e for e, _ in pairs) / len(pairs)),
            'mean_error_pct': (sum(e / y for e, y in pairs if abs(y) > floor) / max(1, len(pct))) * 100,
        }
    totals = {k: v for k, v in per_output.items() if k.endswith('|total_w_m2') and v['p95_abs_pct'] is not None}
    worst_key = max(totals, key=lambda k: totals[k]['p95_abs_pct']) if totals else None
    worst = totals[worst_key]['p95_abs_pct'] if worst_key else None
    return {
        'n_cases': len(recs),
        'cases_outside_trained_range': extrap_cases,
        'worst_total_p95_pct': worst,
        'worst_total_output': worst_key,
        'threshold_pct': threshold,
        'passed': worst is not None and worst <= threshold,
        'per_output': per_output,
    }


def default_case_row(model, recs):
    """Prediction vs EnergyPlus for the type's default scenario (governing days)."""
    r = next((x for x in recs if x['id'] == DEFAULT_CASE_ID), None)
    if not r:
        return None
    pred, _ = surrogate.predict(model, r['scenario'])
    row = {}
    for key in ('clg_db_0.4|total_w_m2', 'clg_dp_0.4|total_w_m2', 'htg_99.6|total_w_m2'):
        if key in pred and key in r['targets']:
            row[key] = {'energyplus': r['targets'][key], 'surrogate': pred[key],
                        'error_pct': (pred[key] / r['targets'][key] - 1) * 100 if r['targets'][key] else None}
    return row


def write_report(results, path_md, path_json):
    os.makedirs(os.path.dirname(path_md), exist_ok=True)
    with open(path_json, 'w') as f:
        json.dump(results, f, indent=1)
    lines = ['# Surrogate validation against EnergyPlus', '',
             'Generated %s by `engine/validate.py`. Each model is tested on EnergyPlus runs it was not trained on '
             '(independent Latin-hypercube sample, seed %d, plus the building type default).' % (
                 results['generated'], results['seed']), '',
             'Pass rule: worst 95th-percentile absolute error across all design-day block totals <= %.1f%%.' %
             results['threshold_pct'], '',
             '| Model | Test runs | Worst P95 (block totals) | Worst output | Cooling 0.4%% DB P95 | Heating 99.6%% P95 | Result |',
             '|---|---|---|---|---|---|---|']
    for key, r in sorted(results['models'].items()):
        if 'error' in r:
            lines.append('| %s | – | – | – | – | – | %s |' % (key, r['error']))
            continue
        po = r['per_output']
        g = lambda k: ('%.1f%%' % po[k]['p95_abs_pct']) if k in po and po[k]['p95_abs_pct'] is not None else '–'
        lines.append('| %s | %d | %s | %s | %s | %s | %s |' % (
            key, r['n_cases'], ('%.1f%%' % r['worst_total_p95_pct']) if r['worst_total_p95_pct'] is not None else '–',
            r['worst_total_output'] or '–', g('clg_db_0.4|total_w_m2'), g('htg_99.6|total_w_m2'),
            'PASS' if r['passed'] else '**FAIL**'))
    shared = {k: r for k, r in results['models'].items() if r.get('per_type')}
    if shared:
        lines += ['', '## Shared models by building type', '',
                  '| Model | Building type | Test runs | Worst P95 (block totals) | Cooling 0.4%% DB P95 | Heating 99.6%% P95 | Result |',
                  '|---|---|---|---|---|---|---|']
        for key, r in sorted(shared.items()):
            for t, x in sorted(r['per_type'].items()):
                if 'error' in x:
                    lines.append('| %s | %s | – | – | – | – | %s |' % (key, t, x['error']))
                    continue
                po = x['per_output']
                g = lambda k: ('%.1f%%' % po[k]['p95_abs_pct']) if k in po and po[k]['p95_abs_pct'] is not None else '–'
                lines.append('| %s | %s | %d | %.1f%% | %s | %s | %s |' % (
                    key, t, x['n_cases'], x['worst_total_p95_pct'], g('clg_db_0.4|total_w_m2'),
                    g('htg_99.6|total_w_m2'), 'PASS' if x['passed'] else '**FAIL**'))
    lines += ['', '## Type defaults (prediction vs EnergyPlus)', '',
              '| Model | Output | EnergyPlus W/m² | Surrogate W/m² | Error |', '|---|---|---|---|---|']
    for key, r in sorted(results['models'].items()):
        rows = [(key, r.get('default_case'))] if not r.get('per_type') else \
            [('%s @ %s' % (key, t), x.get('default_case')) for t, x in sorted(r['per_type'].items())]
        for label, dc in rows:
            for out, v in (dc or {}).items():
                lines.append('| %s | %s | %.1f | %.1f | %+.1f%% |' % (label, out, v['energyplus'], v['surrogate'],
                                                                      v['error_pct'] or 0))
    with open(path_md, 'w') as f:
        f.write('\n'.join(lines) + '\n')


def main(argv):
    ap = argparse.ArgumentParser(description=__doc__.split('\n\n')[0])
    ap.add_argument('--types', default='all')
    ap.add_argument('--stations', default='all')
    ap.add_argument('--n', type=int, default=50, help='test cases per model (plus the type default)')
    ap.add_argument('--seed', type=int, default=TEST_SEED)
    ap.add_argument('--threshold', type=float, default=5.0)
    ap.add_argument('--workers', type=int, default=max(1, (os.cpu_count() or 2) - 1))
    ap.add_argument('--skip-run', action='store_true', help='score existing test runs only; run nothing')
    ap.add_argument('--no-write', action='store_true', help="don't record results in loads-surrogate.js")
    a = ap.parse_args(argv)
    if a.seed == 1:
        sys.exit('Seed 1 is the training seed; pick another so the test set is independent.')
    if not os.path.exists(SURROGATE_JS):
        sys.exit('No trained surrogate yet (%s). Run fit_surrogate.py first.' % SURROGATE_JS)
    payload = surrogate.load_published(SURROGATE_JS)
    models = payload['models']
    keys = sorted(models)
    if a.types != 'all':
        keys = [k for k in keys if k.split('|')[0] in a.types.split(',')]
    if a.stations != 'all':
        keys = [k for k in keys if k.split('|')[1] in a.stations.split(',')]
    if not keys:
        sys.exit('No trained models match --types/--stations.')

    exe = version = None
    if not a.skip_run:
        exe, version = run_scenario.find_energyplus()
        if not exe:
            sys.exit('EnergyPlus not found. Install it and set ENERGYPLUS_EXE (or use --skip-run).')

    results = {'generated': datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='seconds'),
               'seed': a.seed, 'threshold_pct': a.threshold, 'models': {}}
    all_types = list(scenario.load_archetypes()['types'])
    for key in keys:
        btype, station = key.split('|')
        model = models[key]
        # A shared ('unified') model is tested on every building type's own test set.
        test_types = all_types if btype == 'unified' else [btype]
        per_type, all_recs = {}, []
        for t in test_types:
            cases = test_cases(t, station, a.n, a.seed)
            path = runs.result_file(TEST_RUNS, t, station)
            if not a.skip_run:
                path, _ = ensure_runs(t, station, cases, a.workers, exe, version)
            wanted = {i for i, _ in cases}
            recs = [r for r in (runs.load([path]) if os.path.exists(path) else []) if r['id'] in wanted]
            if not recs:
                per_type[t] = {'error': 'no test runs', 'passed': False}
                continue
            try:
                r = score(model, recs, a.threshold)
            except ValueError as e:
                per_type[t] = {'error': str(e), 'passed': False}
                continue
            r['default_case'] = default_case_row(model, recs)
            per_type[t] = r
            all_recs += recs
        scored = {t: r for t, r in per_type.items() if 'error' not in r}
        if not scored:
            err = next(iter(per_type.values())).get('error', 'no test runs')
            results['models'][key] = {'error': err, 'passed': False}
            print('%s: %s' % (key, err))
            continue
        worst_t = max(scored, key=lambda t: scored[t]['worst_total_p95_pct'] or 0)
        r = dict(scored[worst_t]) if len(test_types) == 1 else {
            'n_cases': sum(x['n_cases'] for x in scored.values()),
            'cases_outside_trained_range': sum(x['cases_outside_trained_range'] for x in scored.values()),
            'worst_total_p95_pct': scored[worst_t]['worst_total_p95_pct'],
            'worst_total_output': '%s @ %s' % (scored[worst_t]['worst_total_output'], worst_t),
            'threshold_pct': a.threshold,
            'passed': all(x.get('passed') for x in per_type.values()),
            'per_output': score(model, all_recs, a.threshold)['per_output'],
            'per_type': per_type,
        }
        r['eplus_versions'] = sorted(set(x.get('eplus') or '' for x in all_recs))
        results['models'][key] = r
        print('%s: %d test runs, worst P95 on block totals %.1f%% (%s) -> %s' % (
            key, r['n_cases'], r['worst_total_p95_pct'], r['worst_total_output'], 'PASS' if r['passed'] else 'FAIL'),
            flush=True)
        for t, x in sorted(per_type.items()) if len(test_types) > 1 else []:
            print('    %-11s %s' % (t, ('worst P95 %.1f%% -> %s' % (x['worst_total_p95_pct'], 'PASS' if x['passed'] else 'FAIL'))
                                  if 'error' not in x else x['error']), flush=True)
        if not a.no_write:
            model['holdout'] = {
                'n': r['n_cases'], 'seed': a.seed, 'tested_at': results['generated'],
                'worst_total_p95_pct': r['worst_total_p95_pct'], 'threshold_pct': a.threshold, 'passed': r['passed'],
                'total_p95_pct': {k: v['p95_abs_pct'] for k, v in r['per_output'].items() if k.endswith('|total_w_m2')},
                'per_type': {t: {'worst_total_p95_pct': x.get('worst_total_p95_pct'), 'passed': x.get('passed', False)}
                             for t, x in per_type.items()} if len(test_types) > 1 else None,
            }
    write_report(results, os.path.join(REPORT_DIR, 'report.md'), os.path.join(REPORT_DIR, 'report.json'))
    if not a.no_write:
        surrogate.write_published(SURROGATE_JS, payload)
    n_fail = sum(1 for r in results['models'].values() if not r.get('passed'))
    print('%d of %d models passed. Report: %s' % (len(results['models']) - n_fail, len(results['models']),
                                                  os.path.join(REPORT_DIR, 'report.md')))
    return 1 if n_fail else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))

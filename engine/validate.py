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
  python3 engine/validate.py --threshold 5                    # worst P95 % on the reported peaks

The default threshold is 5%: the worst 95th-percentile absolute error on the
peaks the page reports must not exceed it - the governing cooling peak for each
percentile (larger of the dry-bulb and dew-point days) and the heating peak for
each percentile. Every individual design day is also scored, for information.
A peak below 10% of the case's design load (heating in a hot climate, say) is
judged as a share of that 10% rather than of itself (NEGLIGIBLE_FRACTION).
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
TEST_RUNS_EXT = os.path.join(TEST_RUNS, 'ext')     # extended design space (adiabatic surfaces, large plates)
REPORT_DIR = os.path.join(HERE, 'validation')
SURROGATE_JS = os.path.join(os.path.dirname(HERE), 'web', 'data', 'loads-surrogate.js')
TEST_SEED = 9001          # training uses seed 1; never reuse the training seed here
DEFAULT_CASE_ID = -1


def test_cases(btype, station, n, seed):
    """Independent test scenarios: LHS with a separate seed + the type default."""
    cases = batch.make_samples(btype, station, n, seed)
    cases.append((DEFAULT_CASE_ID, {'type': btype, 'station': station}))
    return cases


def ensure_runs(btype, station, cases, workers, exe, version, test_dir=TEST_RUNS):
    os.makedirs(test_dir, exist_ok=True)
    path = runs.result_file(test_dir, btype, station)
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
    governing = governing_errors(model, recs)
    gov = {k: v for k, v in governing.items() if v['p95_abs_pct'] is not None}
    gov_key = max(gov, key=lambda k: gov[k]['p95_abs_pct']) if gov else None
    gov_worst = gov[gov_key]['p95_abs_pct'] if gov_key else None
    return {
        'n_cases': len(recs),
        'cases_outside_trained_range': extrap_cases,
        # Pass rule: the peaks the page reports (governing cooling day per
        # percentile, heating per percentile).
        'worst_governing_p95_pct': gov_worst,
        'worst_governing_output': gov_key,
        'governing': governing,
        # For information: every design day judged on its own value, including
        # mild days that never govern and can sit near zero.
        'worst_total_p95_pct': worst,
        'worst_total_output': worst_key,
        'threshold_pct': threshold,
        'passed': gov_worst is not None and gov_worst <= threshold,
        'per_output': per_output,
    }


GOVERNING = {
    'cooling 0.4%': (['clg_db_0.4', 'clg_dp_0.4']), 'cooling 1%': (['clg_db_1', 'clg_dp_1']),
    'cooling 2%': (['clg_db_2', 'clg_dp_2']), 'heating 99.6%': (['htg_99.6']), 'heating 99%': (['htg_99']),
}


# A peak far smaller than the building's design load (heating in Honolulu,
# a fraction of a W/m2 against ~270 W/m2 of cooling) makes a percentage error
# meaningless. Errors are therefore taken relative to the larger of the peak
# itself and NEGLIGIBLE_FRACTION of the case's design load (the larger of its
# 0.4% governing cooling and 99.6% heating peaks, from EnergyPlus). A peak
# above that share is judged on its own value, exactly as before.
NEGLIGIBLE_FRACTION = 0.10


def _design_load(targets):
    vals = [targets.get(k) for k in ('clg_db_0.4|total_w_m2', 'clg_dp_0.4|total_w_m2', 'htg_99.6|total_w_m2')]
    return max([v for v in vals if v is not None] or [0.0])


def governing_errors(model, recs):
    """Error on the peak the page shows: the larger of the dry-bulb and dew-point
    cooling days (as EnergyPlus and the model each see it), and the heating day.
    A wrong prediction that flips which cooling day governs is caught here,
    because the model's own maximum is compared with EnergyPlus's maximum.
    Negligible peaks are judged against NEGLIGIBLE_FRACTION of the design load."""
    return governing_from_predictions([surrogate.predict(model, r['scenario'])[0] for r in recs], recs)


def governing_from_predictions(preds, recs):
    """governing_errors for given per-record prediction dicts (also used by
    fit_surrogate.py to compare model forms on out-of-fold predictions)."""
    out = {label: [] for label in GOVERNING}
    floored = {label: 0 for label in GOVERNING}
    for pred, r in zip(preds, recs):
        ref = NEGLIGIBLE_FRACTION * _design_load(r['targets'])
        for label, days in GOVERNING.items():
            keys = [d + '|total_w_m2' for d in days]
            if not all(k in r['targets'] and k in pred for k in keys):
                continue
            y = max(r['targets'][k] for k in keys)
            p = max(pred[k] for k in keys)
            denom = max(y, ref)
            if denom > 1e-9:
                out[label].append(abs(p - y) / denom * 100)
                floored[label] += y < ref
    return {label: {'n': len(pct), 'p50_abs_pct': _pct(pct, 50), 'p95_abs_pct': _pct(pct, 95),
                    'max_abs_pct': max(pct) if pct else None, 'n_negligible': floored[label]}
            for label, pct in out.items()}


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
             'Pass rule: worst 95th-percentile absolute error on the peaks the page reports <= %.1f%%. Those are '
             'the governing cooling peak for each percentile (the larger of the dry-bulb and dew-point days, as EnergyPlus '
             'and the model each see it) and the heating peak for each percentile. "Any single day" judges every design '
             'day on its own value, including mild days that never govern and can sit near zero; it is shown for '
             'information. Peaks are one-hour averages. A peak below %d%% of the case\'s design load (larger of '
             '0.4%% cooling and 99.6%% heating) is judged as a share of that %d%%, not of itself.' % (
                 results['threshold_pct'], NEGLIGIBLE_FRACTION * 100, NEGLIGIBLE_FRACTION * 100), '',
             '| Model | Test runs | Worst P95, reported peaks | Which peak | Cooling 0.4% | Heating 99.6% | Any single day (info) | Result |',
             '|---|---|---|---|---|---|---|---|']

    def row(label, r):
        gv = r.get('governing', {})
        g = lambda k: ('%.1f%%' % gv[k]['p95_abs_pct']) if k in gv and gv[k]['p95_abs_pct'] is not None else '–'
        f = lambda v: ('%.1f%%' % v) if v is not None else '–'
        return '| %s | %d | %s | %s | %s | %s | %s | %s |' % (
            label, r['n_cases'], f(r.get('worst_governing_p95_pct')), r.get('worst_governing_output') or '–',
            g('cooling 0.4%'), g('heating 99.6%'), f(r.get('worst_total_p95_pct')),
            'PASS' if r['passed'] else '**FAIL**')

    for key, r in sorted(results['models'].items()):
        if 'error' in r:
            lines.append('| %s | – | – | – | – | – | – | %s |' % (key, r['error']))
            continue
        lines.append(row(key, r) if not r.get('per_type') else row(key, dict(r, governing={})))
    shared = {k: r for k, r in results['models'].items() if r.get('per_type')}
    if shared:
        lines += ['', '## Shared models by building type', '',
                  '| Model @ type | Test runs | Worst P95, reported peaks | Which peak | Cooling 0.4% | Heating 99.6% | Any single day (info) | Result |',
                  '|---|---|---|---|---|---|---|---|']
        for key, r in sorted(shared.items()):
            for t, x in sorted(r['per_type'].items()):
                if 'error' in x:
                    lines.append('| %s @ %s | – | – | – | – | – | – | %s |' % (key, t, x['error']))
                    continue
                lines.append(row('%s @ %s' % (key, t), x))
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
    ap.add_argument('--extended-n', type=int, default=0,
                    help='extra test cases per model from the extended design space (runs/test/ext/); existing ones are always scored')
    ap.add_argument('--seed', type=int, default=TEST_SEED)
    ap.add_argument('--threshold', type=float, default=5.0)
    ap.add_argument('--workers', type=int, default=max(1, (os.cpu_count() or 2) - 1))
    ap.add_argument('--skip-run', action='store_true', help='score existing test runs only; run nothing')
    ap.add_argument('--no-write', action='store_true',
                    help="write nothing: no report files and no results recorded in loads-surrogate.js")
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
            # Extended-design-space test cases (same seed, own folder and ids).
            ext_path = runs.result_file(TEST_RUNS_EXT, t, station)
            if a.extended_n and not a.skip_run and t != 'unified':
                ext_cases = batch.make_samples(t, station, a.extended_n, a.seed, extended=True)
                ext_path, _ = ensure_runs(t, station, ext_cases, a.workers, exe, version, TEST_RUNS_EXT)
            if os.path.exists(ext_path):
                recs += runs.load([ext_path])
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
        worst_t = max(scored, key=lambda t: scored[t]['worst_governing_p95_pct'] or 0)
        r = dict(scored[worst_t]) if len(test_types) == 1 else {
            'n_cases': sum(x['n_cases'] for x in scored.values()),
            'cases_outside_trained_range': sum(x['cases_outside_trained_range'] for x in scored.values()),
            'worst_governing_p95_pct': scored[worst_t]['worst_governing_p95_pct'],
            'worst_governing_output': '%s @ %s' % (scored[worst_t]['worst_governing_output'], worst_t),
            'worst_total_p95_pct': max(x['worst_total_p95_pct'] or 0 for x in scored.values()),
            'worst_total_output': None,
            'threshold_pct': a.threshold,
            'passed': all(x.get('passed') for x in per_type.values()),
            'per_output': score(model, all_recs, a.threshold)['per_output'],
            'per_type': per_type,
        }
        r['eplus_versions'] = sorted(set(x.get('eplus') or '' for x in all_recs))
        results['models'][key] = r
        print('%s: %d test runs, worst P95 on reported peaks %.1f%% (%s) -> %s   [any single design day: %.1f%%]' % (
            key, r['n_cases'], r['worst_governing_p95_pct'], r['worst_governing_output'],
            'PASS' if r['passed'] else 'FAIL', r['worst_total_p95_pct'] or 0), flush=True)
        for t, x in sorted(per_type.items()) if len(test_types) > 1 else []:
            print('    %-11s %s' % (t, ('worst P95 %.1f%% -> %s' % (x['worst_governing_p95_pct'], 'PASS' if x['passed'] else 'FAIL'))
                                  if 'error' not in x else x['error']), flush=True)
        if not a.no_write:
            model['holdout'] = {
                'n': r['n_cases'], 'seed': a.seed, 'tested_at': results['generated'],
                'worst_governing_p95_pct': r['worst_governing_p95_pct'],
                'worst_total_p95_pct': r['worst_total_p95_pct'], 'threshold_pct': a.threshold, 'passed': r['passed'],
                'total_p95_pct': {k: v['p95_abs_pct'] for k, v in r['per_output'].items() if k.endswith('|total_w_m2')},
                'per_type': {t: {'worst_governing_p95_pct': x.get('worst_governing_p95_pct'), 'passed': x.get('passed', False)}
                             for t, x in per_type.items()} if len(test_types) > 1 else None,
            }
    if not a.no_write:
        write_report(results, os.path.join(REPORT_DIR, 'report.md'), os.path.join(REPORT_DIR, 'report.json'))
        surrogate.write_published(SURROGATE_JS, payload)
    n_fail = sum(1 for r in results['models'].values() if not r.get('passed'))
    print('%d of %d models passed.%s' % (len(results['models']) - n_fail, len(results['models']),
                                         '' if a.no_write else ' Report: ' + os.path.join(REPORT_DIR, 'report.md')))
    return 1 if n_fail else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))

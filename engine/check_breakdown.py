#!/usr/bin/env python3
# Usage (repo root): python3 engine/check_breakdown.py
# Predicted vs EnergyPlus load breakdown on the independent test runs (seed 9001).
# Metric per test case: for cooling and heating, the largest error in any source's
# share of the peak, in percentage points of the sum of |components|.
import sys, json, glob, collections
sys.path.insert(0, 'engine')
from lib import surrogate
pub = surrogate.load_published('web/data/loads-surrogate.js')
models = pub['models'] if 'models' in pub else pub
def p95(a): a = sorted(a); return a[min(len(a) - 1, int(0.95 * len(a)))] if a else float('nan')
agg = {True: collections.defaultdict(list), False: collections.defaultdict(list)}
worst = []
for f in sorted(glob.glob('engine/runs/test/*.jsonl')):
    key = f.split('/')[-1][:-6].replace('__', '|')
    m = models.get(key)
    if not m: continue
    ok = bool((m.get('holdout') or {}).get('passed'))
    errs = {'clg': [], 'htg': []}
    for line in open(f):
        r = json.loads(line); t = r['targets']
        if not any(k.startswith('comp_') for k in t): continue
        pr = surrogate.predict(m, r['scenario'])
        pr = pr[0]
        for kind in ('clg', 'htg'):
            ks = [k for k in t if k.startswith('comp_' + kind + '|')]
            sa = sum(abs(t[k]) for k in ks)
            if sa < 1e-6: continue
            sp = sum(abs(pr[k]) for k in ks) or 1e-9
            errs[kind].append(max(abs(pr[k] / sp - t[k] / sa) * 100 for k in ks))
    for kind in ('clg', 'htg'):
        if errs[kind]:
            agg[ok][kind].append(p95(errs[kind])); worst.append((p95(errs[kind]), key, kind, ok))
for ok in (True, False):
    for kind in ('clg', 'htg'):
        v = sorted(agg[ok][kind])
        if v: print(f"{'passed' if ok else 'failed'} models, {kind}: n={len(v)}  median P95 share error {v[len(v)//2]:.1f} pt  worst {v[-1]:.1f} pt")
print('worst 8:', [(round(e, 1), k, kind, 'pass' if ok else 'fail') for e, k, kind, ok in sorted(worst)[-8:]])

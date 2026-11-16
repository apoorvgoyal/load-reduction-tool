"""Write valdata.json for make_val.py: each test run of two example models,
scored with the published models (cooling 0.4% day: max of dry-bulb and
dew-point; heating 99.6%), as [EnergyPlus W/m2, surrogate W/m2, error %].

Run from the repo root after a refit and validate.py:
    python3 docs/figures/extract_valdata.py
Needs engine/runs/test/ and engine/runs/test/ext/ (git-ignored run files)."""
import json, os, sys
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(ROOT, 'engine'))
import validate as V                      # noqa: E402
from lib import runs, surrogate           # noqa: E402
EXAMPLES = ['office|chicago', 'sports|sanfrancisco']
pub = surrogate.load_published(os.path.join(ROOT, 'web', 'data', 'loads-surrogate.js'))['models']
out = {}
for key in EXAMPLES:
    t, st = key.split('|'); m = pub[key]; rows = []
    for d, dom in ((V.TEST_RUNS, 'base'), (V.TEST_RUNS_EXT, 'ext')):
        p = runs.result_file(d, t, st)
        for r in (runs.load([p]) if os.path.exists(p) else []):
            pred, _ = surrogate.predict(m, r['scenario'])
            ref = V.NEGLIGIBLE_FRACTION * V._design_load(r['targets'])
            row = {'dom': dom}
            for lab, keys in (('clg', ['clg_db_0.4', 'clg_dp_0.4']), ('htg', ['htg_99.6'])):
                ks = [k + '|total_w_m2' for k in keys]
                y = max(r['targets'][k] for k in ks); pp = max(pred[k] for k in ks)
                row[lab] = [y, pp, abs(pp - y) / max(y, ref) * 100]
            rows.append(row)
    out[key] = {'rows': rows, 'holdout': m['holdout']['domains'], 'worst': m['holdout']['worst_governing_p95_pct']}
    print(key, len(rows), 'test runs, worst P95 %.1f%%' % out[key]['worst'])
json.dump(out, open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'valdata.json'), 'w'))

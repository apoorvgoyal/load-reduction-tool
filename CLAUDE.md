# CLAUDE.md

Peak Load Tool: heating/cooling design loads on ASHRAE design days, calculated with EnergyPlus (`engine/`), served by a small Node server (`server.js`) to a vanilla-JS page (`web/`). See `README.md` for the methodology and limitations.

## Setup

- **Node 18+** for the server. No npm packages.
- **Python 3.9+** for the engine. The runner and server need only the standard library.
- **EnergyPlus 24.x/25.x** for real runs: on `PATH` as `energyplus`, or set `ENERGYPLUS_EXE=/path/to/energyplus`. The IDF `Version` is taken from `energyplus --version`.
- **Optional:**
  - `numpy`: surrogate fitting (`engine/fit_surrogate.py`) and its tests.
  - `openstudio`: IDD validation tests.
  - `node`: Python/JS parity tests.

```bash
python3 -m venv .venv && . .venv/bin/activate
pip install numpy openstudio        # openstudio wheel is ~80 MB; it bundles the EnergyPlus IDD, not the engine
node server.js                      # http://localhost:3100  (PORT, ENERGYPLUS_EXE, LOADS_PYTHON, LOADS_MAX_CONCURRENT, LOADS_EPLUS_TIMEOUT)
```

## Tests

Run from the repo root:

```bash
python3 -m unittest discover -s engine/tests -t engine
```

- Without `openstudio`, the IDD validation tests are **skipped**; without `numpy` or `node`, the surrogate and parity tests are skipped. Install all three before declaring a change to `engine/lib/idf.py`, `engine/lib/features.py`, `web/core.js` or `engine/archetypes.json` done. "OK (skipped=N)" is not a pass for those files.
- **No EnergyPlus needed for tests.** `engine/tests/fake_energyplus.py` stands in for the executable in the pipeline tests and writes placeholder numbers. Never present its output as results.
- **Real-engine smoke test**, when EnergyPlus is installed:
  ```bash
  echo '{"type":"office","station":"chicago","gfa_m2":10000,"n_floors":4}' | python3 engine/run_scenario.py - | python3 -m json.tool | head -40
  ```
  Check that `messages.severe` is 0 and `messages.fatal` is empty. Add `--keep DIR` to inspect `eplusout.err`.
- **UI check:** `node --check web/app.js && node --check web/core.js && node --check server.js`, then load the page. It must work at 390 px width without horizontal scroll.

## Regenerated files (don't hand-edit)

- `web/data/loads-data.js`: rerun `python3 engine/build_data.py` after editing `engine/stations.json`, `engine/archetypes.json`, `engine/variables.json` or `engine/lib/scenario.py` (FIELDS).
- `web/data/loads-surrogate.js`: produced by `python3 engine/fit_surrogate.py` from `engine/runs/*.jsonl`, which come from `engine/batch.py`. `engine/runs/` is git-ignored.
- `engine/weather/*.ddy|*.stat`: fetched by `python3 engine/fetch_weather.py` from the DOE EnergyPlus weather library and committed.

## Rules for this codebase

- **No invented numbers.** Every default lives in `engine/archetypes.json` with a `source`. Set `"verify": true` unless it was checked against the cited standard. Values with no source stay out of the defaults, or are added as user inputs. Sampling ranges in `engine/variables.json` are design-space bounds, not defaults.
- **Keep these pairs in sync:**
  - `engine/lib/features.py` ↔ `web/core.js` (`features`, `expand`).
  - `engine/lib/scenario.py` (`resolve`, `GEOMETRY_PLACEHOLDERS`) ↔ `web/core.js` (`defaults`, `PLACEHOLDERS`).
  - `engine/tests/test_surrogate.py` checks both. Changing the feature list invalidates trained surrogates; retrain.
- **IDF objects are written as named fields.** In `engine/lib/idf.py`, each object is a list of `(IDD field name, value)` pairs, and the tests compare the names and their order with the EnergyPlus IDD. Add new objects the same way, using the exact IDD field names.
- **Result labelling.**
  - Results are always tagged by source, EnergyPlus run or surrogate, and the surrogate's out-of-fold error is shown with it.
  - Don't show surrogate output when a fixed input has changed (`fixed_inputs` in `variables.json`).
  - Sizing factors stay explicit and default to 1.0.
- **Middle-floor scaling** is done in `engine/lib/results.py` with the model's per-zone `scale`, not with EnergyPlus zone multipliers. Keep it that way so the scaling stays auditable.
- **Status:** the pipeline has not yet been validated against a real EnergyPlus run (see the README Status section). Treat the first real runs as validation, not production.

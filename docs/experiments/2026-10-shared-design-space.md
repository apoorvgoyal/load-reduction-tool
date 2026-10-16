# Experiment: one shared model for all building types (Chicago)

**Question.** Building types in this tool are only presets of the same inputs (occupancy, outdoor air, lighting, equipment, setpoints, schedule). Can one surrogate trained on a single shared design space replace one model per building type?

**Setup (October 2026).**
- **Engine:** EnergyPlus 25.2.0-cf7368216c, built from source. It reproduced the user's PC runs to 0.000% with identical settings.
- **Training data:** 3,000 runs for Chicago, split into 4 shards run in parallel cloud sessions. 70% were drawn around the nine building-type presets (233–234 each). The other 30% (900) were spread across the combined range with schedules varied.
- **Independent test set:** 459 fresh EnergyPlus runs (51 per building type, seed 9001), never used for training.
- **Pass rule:** worst 95th-percentile absolute error across design-day block totals at or below 5%.
- **Warm-up messages:** 5 of the 3,000 training runs logged warm-up non-convergence. All were very large 11–12-storey cases; they were kept.

## Results

| Model | Worst P95 across building types | Notes |
|---|---|---|
| Office-only quadratic, 500 runs (user's PC) | **3.4% – PASS** | First independent validation of the per-type approach |
| Shared quadratic (3,000 runs) | 11–29% per type – all FAIL | |
| Shared neural network (MLP 128×128, log target) | 7–17% per type – all FAIL | Better than the quadratic, still short |

Where the shared quadratic's error comes from (P95 %, independent test set):

| Design day | office | school | retail | hotel | higher ed | lab | healthcare | sports | stadium |
|---|---|---|---|---|---|---|---|---|---|
| Heating 99.6% | 0.5 | 0.3 | 0.4 | 0.4 | 0.7 | 0.2 | 0.3 | 0.3 | 0.1 |
| Cooling 0.4% dry-bulb | 7.5 | 7.1 | 7.7 | 9.3 | 6.7 | 5.5 | 7.0 | 7.4 | 6.6 |
| Cooling 0.4% dew-point | 26.7 | 17.9 | 21.3 | 23.5 | 21.0 | 12.7 | 14.2 | 29.2 | 11.4 |

## Findings

- **Heating:** the shared model is excellent (≤0.7%). It is better than per-type models trained on each type's 233 preset runs (1.2–3.7%), because heating is close to linear physics and more data helps.
- **Cooling on the humid (dew-point) design day:** this is the failure. Latent load depends jointly on the outdoor-air rate, supply airflow (set by the sensible load until outdoor air governs) and heat recovery, which EnergyPlus applies only when it reduces the load.
  - Across the full range of all building types, that response has kinks a single smooth model does not capture.
  - Errors grow with latent heat-recovery effectiveness (P95 17% at <0.15, 26% at >0.4), but are large even without it.
  - Adding airflow-kink features did not help.
- **Cooling on the dry-bulb day** is borderline (5.5–9.3%).

## Decision

Keep per-type models; they pass (office 3.4%). The shared-model machinery stays in the code:
- `batch.py --types unified`
- per-type validation of a shared model
- page fallback when a type has no model of its own

It can be revisited with more data or a different model form; heating in particular could come from a shared model.

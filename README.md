# Peak Load Tool

A standalone prototype for testing design variables against **heating and cooling design loads**. The variables include window-to-wall ratio, glazing, envelope, occupant density, lighting and equipment, outdoor air, heat recovery, infiltration and set points. Loads are calculated on **ASHRAE design days** with **EnergyPlus**.

It is independent of the Total Carbon Tool: its own server, its own page, no shared code or data files.

## Status

> **First real-EnergyPlus check (EnergyPlus 25.2, 20 office cases in Chicago, 1–15 floors, randomised inputs):** all runs completed with no severe errors and every output was read.
>
> - Peak heating (99.6% day: steady −20 °C, no sun, no internal gains) matched an independent steady-state hand calculation within −7.5% to +3.7%, mostly within ±3%. The hand calculation covered envelope conduction, F-factor slab, infiltration and ventilation with heat recovery.
> - The outdoor-air output matched a hand calculation within 2% once it was understood to be the load *before* heat recovery. It is now labelled that way, with the recovered amount reported separately.
> - Cooling outputs are internally consistent: sensible + latent = total, zone peaks ≥ block peak, percentile ordering holds, and the dew-point day governs in some humid-load cases.
>
> - **Surrogate on 500 real runs (office, Chicago):** worst out-of-fold P95 error on block totals is 4.2%: heating about 1%, cooling 3–4%. This uses the physics-shaped features in `engine/lib/features.py`; the earlier raw-input features gave 10.9%. Latent load alone is about ±1.4 W/m² (RMSE), which reads as a large percentage because latent loads are small.
> - **Resolved:** 62 of the 500 runs reported a severe EnergyPlus error (3+ floors, mostly floor plates over 4,000 m²). `eplusout.err` confirmed warm-up non-convergence in the middle-floor core zone on the heating days. The day-to-day cooling-load change was 0.127 W against the 0.04 W default tolerance: negligible for a ~3,000 m² zone. Their heating results matched the hand calc as well as the clean runs, so they were kept. The fix is up to 50 warm-up days with EnergyPlus's default tolerances. A first attempt that loosened the loads tolerance to 0.5 W was reverted: it let warm-up stop early and moved heating peaks by up to 1.7%. With 50 days, results match the original converged runs within 0.003%. `engine/diagnostics/large_floor_plate.json` remains as a regression case.
>
> Still to do: compare cooling peaks against an independent reference (an existing Trace/HAP calc or an ASHRAE 140 case). Cooling depends on solar and thermal-mass timing, which a steady-state hand calc can't check.
>
> **Checks that don't need EnergyPlus** (run by the test suite):
>
> - Every generated model passes the EnergyPlus 25.2 input data dictionary check (via the OpenStudio 3.11 Python package). Field order, choices and numeric types are all checked, plus name-reference integrity.
> - The results parser, scaling and peak arithmetic are tested against synthetic `eplusout.sql` files in the EnergyPlus schema.
> - The runner → batch → fit → browser chain is tested end to end with a stand-in executable.
>

## Two ways to get a number

| | EnergyPlus run (option C) | Surrogate (option B) |
|---|---|---|
| What | Design-day sizing run of the current scenario | Fast model fitted to many EnergyPlus runs per building type × station |
| Speed | Seconds to minutes per run | Instant; drives the sliders and the sensitivity chart |
| Use for | Numbers that go into a basis of design | Exploring options, ranking strategies |
| Shown as | Green **EnergyPlus run** badge, with component breakdown, zone sizing, IDF download | Blue **Surrogate estimate** badge, with its out-of-sample error (95th percentile) |

The surrogate is only used when the scenario is inside what it was trained on. If any input it held fixed during training has changed (for example supply air temperature or occupied hours), the page asks for an EnergyPlus run. If a varied input is outside its trained range, the page shows an extrapolation warning.

## Quick start

```bash
# 1. EnergyPlus 24.x/25.x from https://energyplus.net (any OS). Check:
energyplus --version            # or set ENERGYPLUS_EXE=/path/to/energyplus

# 2. Run the tool (Python 3.9+ only, no packages needed for this step)
cd load-reduction-tool
python server.py                # opens http://localhost:3100 in your browser; Ctrl+C to stop
```

On Windows, use `py` if `python` isn't recognized. Setting the EnergyPlus path in Command Prompt:
`set ENERGYPLUS_EXE=C:\EnergyPlusV25-2-0\energyplus.exe` (adjust to your install), then `py server.py`.

`node server.js` is an equivalent server if you prefer Node (it also needs `LOADS_PYTHON` when Python isn't `python3`).

Opening `web/index.html` directly (without a server) still shows the design conditions and any trained surrogate; EnergyPlus runs need a server.

Server environment variables: `PORT` (3100), `ENERGYPLUS_EXE`, `LOADS_MAX_CONCURRENT` (2), `LOADS_EPLUS_TIMEOUT` (300 s); `server.js` also reads `LOADS_PYTHON` (python3).

## Training the surrogate (option B)

```bash
pip install numpy
python3 engine/batch.py --types office --stations chicago --n 5000      # resumable; Ctrl+C and re-run to continue
python3 engine/fit_surrogate.py                                         # publishes web/data/loads-surrogate.js + surrogates/
python3 engine/validate.py --types office --stations chicago            # independent test (see below)
```

- `--types all --stations all` covers every building type and station.
- `engine/variables.json` defines the sampled design space. Ranges given as `scale_of_default` or `offset_of_default` are relative to each building type's defaults, so every type's defaults sit inside its trained range.
- Each sample is one EnergyPlus run, and every run simulates all eight design days.
- The fit is a quadratic ridge regression on 21 physics-shaped features (`engine/lib/features.py`). Ridge strength is chosen by 5-fold cross-validation; the error statistics stored with each model are out-of-fold.
- **More data helps:** on 500 real office/Chicago runs, held-out P95 cooling error fell from 32% (100 runs) to 3% (400 runs) and was still falling.
- Failed runs go to `engine/runs/*.failed.jsonl`. Samples with severe EnergyPlus errors are counted in the model metadata, with their first messages kept.
- Published models are a small index (`web/data/loads-surrogate.js`) plus one file per model (`web/data/surrogates/<type>__<station>.js`, about 160 kB). The page loads only the model it needs.

### Running at scale: all types × all stations

9 building types × 27 stations = **243 models**. At 5,000 runs each that is **about 1.2 million EnergyPlus runs**.

**Time:** one 8-core Windows PC ran 500 runs in about 12.5 minutes (≈1.5 s per run with parallel workers). At that rate the full set takes **about 500 hours (≈21 days) on one PC**. Split it across machines:

```bash
# Same command on each PC, changing only K (1..N):
python3 engine/batch.py --types all --stations all --n 5000 --shard 1/4    # PC 1
python3 engine/batch.py --types all --stations all --n 5000 --shard 2/4    # PC 2  ... and so on
```

- With N machines the wall time divides by about N. For example, 10 PCs (or cloud VMs) take about 2 days.
- Each shard writes `<type>__<station>.shard-K-of-N.jsonl`.
- Copy every machine's `engine/runs/*.jsonl` into one `engine/runs/` folder; `fit_surrogate.py` merges and de-duplicates them.
- A machine can stop and resume at any time.

**Disk:** about 3.7 kB per run, so roughly 4.5 GB of result files in total.

**Suggested order:** finish one model to 5,000 runs and validate it before committing the full compute. Then prioritise the building types and cities you use most.

### One shared model for all building types? (tested: not yet)

`batch.py --types unified` trains one model across every building type's range, with schedules varied. Tested on Chicago with 3,000 runs against 459 independent EnergyPlus runs:
- heating is excellent (≤0.7% error);
- cooling on the humid dew-point design day fails (11–29%), so per-type models remain the recommended approach.

The office-only model passed the same test at 3.4%. Details: `docs/experiments/2026-10-shared-design-space.md`.

### Automatic testing against EnergyPlus

```bash
python3 engine/validate.py                    # every trained model; 50 test cases each + the type default
python3 engine/validate.py --skip-run         # re-score existing test runs (e.g. after a refit), no EnergyPlus needed
python3 engine/validate.py --threshold 5      # pass limit: worst P95 % on the peaks the page reports
```

What `validate.py` does for each trained model:
1. Draws an independent test set: a Latin-hypercube sample with seed 9001, separate from the training seed, plus the building type's default scenario.
2. Runs any missing cases in EnergyPlus. These go in `engine/runs/test/`, which is never used for training.
3. Predicts every case exactly as the page does, and compares it with EnergyPlus.

**Pass rule.** For each of the five peaks the page reports (governing cooling at 0.4/1/2%, the larger of the dry-bulb and dew-point days as EnergyPlus and the model each see it; heating at 99.6/99%), take the absolute error of each test case and its 95th percentile across the cases. The model passes if the worst of the five is at or below the threshold (default 5%, a project choice rather than a standard). A peak below 10% of that case's design load (for example heating in Honolulu) is judged as a share of that 10% rather than of itself, so a fraction of a W/m² can't produce a meaningless percentage. Every individual design day is also scored, for information.

It then:
- writes `engine/validation/report.md` and `report.json`;
- records the result on the model, which the page shows as "Independent test against N fresh EnergyPlus runs";
- exits with code 1 if any model misses the threshold, so it can gate a release or a CI job.

Refitting a model clears its recorded test result; re-run `validate.py --skip-run` to re-score it. At 50 cases per model the full set adds about 12,400 runs (about 5 hours on one PC).

## Diagnostics

`engine/diagnostics/large_floor_plate.json` is one of the training cases that raised a severe EnergyPlus error. To see the message:

```
py engine/run_scenario.py engine/diagnostics/large_floor_plate.json --keep diag1 > diag1.json
```

Then open `diag1\eplusout.err` and look for the `** Severe  **` lines.

## What the model is

`engine/lib/idf.py` builds the EnergyPlus input; read its header for the full description. In short:

- **Geometry.** Rectangular footprint with DOE-prototype zoning: four perimeter zones and a core per floor, perimeter depth 4.57 m (15 ft). Ground, middle and top floors are modelled explicitly. The middle floor stands in for N−2 floors, and that scaling is applied in post-processing so it is visible and auditable.
- **Windows.** Centred ribbon windows that reproduce the chosen window-to-wall ratio exactly. Optional overhang set by projection factor.
- **Envelope.** Assembly U-factors are converted to a massless layer after removing ASHRAE Fundamentals Ch. 26 air-film resistances. Glazing uses U, SHGC. Slab-on-grade uses the ASHRAE 90.1 F-factor method with the station's 0.5 m monthly ground temperatures from the `.stat` file. Floor/ceiling slabs carry concrete mass when enabled.
- **Partitions.** Interior partitions and inter-floor slabs are adiabatic: adjacent conditioned space at the same temperature, as in a standard peak-load calculation.
- **Internal gains.** People (area per person, metabolic rate), lighting and equipment (W/m²) at full value during occupied hours on the cooling design day. **Zero internal gains on the heating design day** (standard conservative practice).
- **Ventilation.** Outdoor air per ASHRAE 62.1 (Rp × people + Ra × area), or by air changes, during occupied hours on both design days. Outside occupied hours it runs at `oa_unoccupied_fraction` of the design rate: 0 by default, 1 (continuous) for laboratories. Optional sensible or enthalpy heat recovery.
- **Start-up.** `hvac_start_before_occ_h` starts ventilation and occupied setpoints that many hours before people arrive (optimal start, pre-event pre-cooling). The default is 0: there is no standard value, so set it to the building's sequence. Starting earlier dries and conditions the space before occupancy, which removes the start-up pull-down from the occupied peak.
- **HVAC.** `ZoneHVAC:IdealLoadsAirSystem` per zone, with supply-air temperatures from the inputs and dehumidification to a constant supply humidity ratio. Reported loads are therefore **coil loads including outdoor air**, split into sensible and latent.
- **Design days.** Taken verbatim from the station's `.ddy` file: heating 99.6% and 99%; cooling 0.4/1/2% dry-bulb with mean coincident wet-bulb; dehumidification 0.4/1/2% dew point with mean coincident dry-bulb. **Cooling is governed by whichever of the dry-bulb and dew-point days gives the larger total.**
- **Outputs.**
  - Block (coincident) peak and sum of zone peaks. **Peaks are one-hour averages** (a sliding one-hour window over the 10-minute timesteps), as hourly design-day load methods report them. The highest single 10-minute value is shown alongside. Where it is well above the hourly peak, it is a start-up transient (for example moisture stored overnight being removed in the first timestep after the ventilation starts). Its size depends on the timestep length, so it is not used as the peak. Cover it by starting earlier or with deliberate extra capacity.
  - Sensible and latent loads, the ventilation (outdoor-air) load before heat recovery and the amount recovered, and supply airflow at peak. The coil totals already include the recovery credit.
  - Peak hour (time = end of the hour) and the 24-hour profile at 10-minute resolution.
  - EnergyPlus's zone component load summary and zone sizing table.
  - The IDF, for anyone who wants to inspect or rerun it.
- **Sizing factors.** Default 1.0 and applied visibly. Results always show whether a factor is included.

### Known limitations (read before using for sizing)

- One representative space type per floor plate; mixed-use buildings need separate runs or blending.
- Simplified geometry: no self-shading form, no plenums, no below-grade floors.
- Exterior walls and roofs are massless layers. Only the floor slabs carry mass.
- Ideal loads stand in for a real system: no fan heat, duct gains or reheat. Add these per system type, or apply a sizing factor.
- Infiltration is a constant whole-building air-change rate distributed by exterior wall area.
- The design data in the DOE weather files is **ASHRAE 2009**. For current values (2021 Handbook), replace the `.ddy` files with ones built from the licensed ASHRAE Climatic Design Conditions data. The parser reads any EnergyPlus `.ddy` with the standard object names.
- The weather file's climate zone is computed from the data and can differ from the code (county) zone in ASHRAE 169; the page asks you to confirm it.

## Defaults and where they come from

`engine/archetypes.json` holds every default, each with a source. Values marked `"verify": true` were transcribed from a standard or carried over from the Total Carbon Tool's energy module, and **need sign-off from the MEP lead**. The page lists any that are still at their default.

| Building type | Basis |
|---|---|
| Office, K-12 school, retail, hospitality (hotel guestrooms) | Outdoor air and occupant density: ASHRAE 62.1-2019 Table 6-1. Lighting: ASHRAE 90.1-2019 building area method (to verify). Equipment, setpoints, hours: carried over (to verify). |
| Higher education | 62.1 lecture-classroom outdoor air rates; blended building density, equipment, setpoints and hours carried over (to verify). |
| Laboratory | Outdoor air by air changes (`oa_ach`, default 6 ACH: a common design minimum, not a code value; set per program). Fume-hood exhaust beyond that is not modelled. Lighting, equipment, density and setpoints carried over (to verify). |
| Healthcare (patient rooms) | ASHRAE 170-2017 Table 7.1 patient-room outdoor air (2 ACH). The total-air requirement is not modelled. Lighting: 90.1 hospital (to verify). |
| Sports (gym / play area) | 62.1 "Gym, sports arena (play area)" outdoor air and density (to verify). |
| Stadium / arena | 62.1 "Spectator areas" outdoor air and density across the whole floor plate (conservative). Enclosed venues only; the box geometry is not a seating bowl. Event timing is an assumption (afternoon, 4 h). |

Envelope defaults by climate zone were carried over from the Total Carbon Tool and still need checking against 90.1-2019 Tables 5.5. There are no built-in cost data; enter your own $/ton and $/MBH rates.

## Validation plan

1. **Engine checks.** ASHRAE Standard 140 and the RP-1052 load-calculation test cases, run through this model generator where they fit its form.
2. **Prototype cross-check.** Compare against DOE/PNNL prototype autosized capacities for the same city and inputs.
3. **Project back-checks.** Take 3–5 past projects with Trace/HAP load calculations, enter their inputs, and record the differences per load component.
4. **Before release.** Set an acceptance band per output (for example block cooling within ±10% of the reference), and document the results here.

## Layout

```
load-reduction-tool/
  server.py                 server (Python stdlib): web/ + /api/engine, /api/run
  server.js                 same server in Node (optional alternative)
  web/                      index.html, app.js (UI), core.js (pure logic, also used by tests), styles.css
  web/data/loads-data.js    stations + design conditions, defaults, design space (built by engine/build_data.py)
  web/data/loads-surrogate.js  index of trained models (built by engine/fit_surrogate.py; absent until trained)
  web/data/surrogates/      one file per trained model, loaded on demand
  engine/
    run_scenario.py         one scenario → EnergyPlus → JSON
    batch.py                Latin-hypercube training runs
    fit_surrogate.py        fit + publish surrogate
    validate.py             test published surrogates against fresh EnergyPlus runs
    validation/             validate.py reports (report.md, report.json)
    build_data.py           publish station/defaults data for the page
    fetch_weather.py        download .ddy/.stat files listed in stations.json
    archetypes.json         defaults with sources
    variables.json          surrogate design space
    stations.json           27 US stations (DOE EnergyPlus weather library)
    weather/                committed .ddy/.stat files
    lib/                    weather parsing, scenario resolution, IDF builder, results parser, features
    tests/                  python3 -m unittest discover -s engine/tests -t engine
```

Tests: `python3 -m unittest discover -s engine/tests -t engine`. The IDD validation tests run when the `openstudio` Python package is installed (`pip install openstudio`); the browser-parity tests need `node`.

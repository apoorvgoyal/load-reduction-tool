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
| What | Design-day sizing run of the current scenario, run by EnergyPlus 25.2 **in your browser** | Fast model fitted to many EnergyPlus runs per building type × station |
| Speed | About 4 s per run (the first run also loads ~45 MB, then cached) | Instant; drives the sliders and the sensitivity chart |
| Use for | Numbers that go into a basis of design | Exploring options, ranking strategies |
| Shown as | Green **EnergyPlus run** badge, with component breakdown, zone sizing, IDF download | Blue **Surrogate estimate** badge, with its out-of-sample error (95th percentile) |

The surrogate is only used when it passed its independent test against fresh EnergyPlus runs (see "Automatic testing against EnergyPlus"). Where a building type × station model missed the limit, the page shows no estimate and asks for an EnergyPlus run, giving the model's tested error. It is also only used when the scenario is inside what it was trained on. If any input it held fixed during training has changed (for example supply air temperature or occupied hours), the page asks for an EnergyPlus run. If a varied input is outside its trained range, the page shows an extrapolation warning.

## What the page shows

**Layout.** Two screens (hash routing): **Start** (`#start`: what the tool does, building type tiles generated from `engine/archetypes.json`, location) and the **Workspace** (`#workspace`): inputs on the left as a six-section accordion of plain-language questions (presets in `web/data/presets.js`: "Typical" is the archetype default; other presets stay `TODO(MEP lead)` until a sourced value is added), results on the right, updating as you type. Suggestions on the right have an **Apply** button that sets the input on the left and highlights it. Below 900 px the two panes become tabs. The sections below describe the result content, which is the same as before the redesign.

- **Units (IP / SI)**, top right. Inputs are stored in SI (the engine's units) and shown and typed in the selected system; results switch between tons/MBH and kW, cfm and L/s, °F and °C, kBtu/ft² and kWh/m². Plant rates are stored per ton and per MBH and shown per kW in SI. Retyping a shown default restores the exact SI default, so rounding never marks an input as changed.
- **Summary tab**
  - Headline block peaks (cooling tons, heating MBH) for the selected design condition, with change against a saved baseline.
  - Bar charts of every design day in the weather file: cooling 0.4/1/2% on the dry-bulb and dew-point days, heating 99.6/99%.
  - **Where the peak load comes from**: each peak split into people, lighting, equipment, window solar and conduction, walls, roof, ground floor, infiltration, internal mass, ventilation and heat recovery, as a pie per load with each source's value and share; sources that lower the peak (heat recovery, heat stored in the structure) are listed under it. Sources less credits equal the peak (method under "What the model is").
  - **Which design choices move the peak most**: a ranked list of the changes that lower the peak most, each tried on its own (each input at the end of its realistic range that lowers the peak), with a collapsed technical view of both ends of every range. The figures come from the trained model when one exists (marked indicative where it failed its test). **Run exact sweep in EnergyPlus** replaces them with EnergyPlus results: the scenario plus two runs per input, about a minute on a PC.
  - **Plant cost**: capacity × your own $/ton and $/MBH for the plant type you choose. No built-in cost data.
  - **Annual energy and carbon**: see below.
- **Detailed data tab**: SHR, supply air, ventilation load, the comparison table, EnergyPlus run detail (profiles, component table, zone sizing, IDF and JSON downloads), design conditions, and defaults still awaiting confirmation.
- **Adiabatic surfaces** (Walls & windows): north, east, south and west walls (the compass direction each faces after rotation), roof and ground floor can be marked as shared with conditioned space, such as a party wall or a floor of a larger building. In the EnergyPlus model an adiabatic wall keeps its construction (thermal mass) but exchanges no heat and has no windows and no infiltration; an adiabatic roof or ground floor becomes an interior slab like the middle floors. No training run had adiabatic surfaces, so the page shows no instant estimate while any is set and asks for a full simulation.
- **Airtightness per facade area**: infiltration is entered in cfm/ft² (L/s·m²) of exposed facade, at normal operating conditions, not the 75 Pa test rate. The engine spreads a whole-building air-change rate over the exposed walls, so the two convert exactly: ACH = rate × exposed perimeter × 3600 ÷ floor-plate area. Adiabatic walls are not facade. A rate you type is kept when the shape, size or adiabatic walls change; the air-change rate follows. The trained models are unchanged.
- **Glazing presets**: Single, Double or Triple pane, or Custom. The values are ASHRAE Handbook – Fundamentals Ch. 15 Table 4 centre-of-glass U-factors for clear glass with 13 mm air gaps (5.91, 2.73 and 1.76 W/m²·K); they are marked *verify*. They are glass only: the input is the whole-window U-factor, which a frame raises and a low-e coating lowers, so use Custom for a product value. Single pane (5.91) is above the trained U-factor range (1.0–3.5 W/m²·K), but the models see glazing as U × window area per floor area, which the training covers (high glass fractions at high U), so no extrapolation is flagged. Checked for an office in Chicago, the instant estimate was within 3.3% (cooling) and 1.7% (heating) of EnergyPlus for single pane, and within 2% for double and triple.
- **System allowances** (left pane, optional, no defaults). The peaks are ideal loads: what the spaces and their outdoor air need, with no fans, reheat or distribution. When you enter any of these, each answer card adds an **At the plant** line with each allowance shown separately; the space peak itself is unchanged, and costs, comparisons and the optimizer still use it.
  - *Fan heat* (cooling) = cooling design supply airflow × your specific fan power, all taken as heat in the air stream. The fan power input is the same one the yearly energy uses.
  - *VAV reheat* (heating): with a cold supply all winter, boxes at their minimum airflow reheat it. Extra heating = max(0, min% × cooling design airflow × ρc<sub>p</sub> × (heating setpoint − cooling supply temperature) − outdoor-air heating load net of recovery), because the outdoor air already in the ideal load covers that much. ρc<sub>p</sub> = 1.2041 kg/m³ × 1006 J/(kg·K). On a cold design day this is often zero; it grows with heat recovery or a mild winter.
  - *Distribution losses*: your % of each load. Sizing factors apply on top, as they do to the space load.
  - Not covered: reheat at the cooling design hour (it needs zone-by-zone loads) and economizer control.
- **Compare** (`#compare`): **Save to compare** keeps up to three versions of the inputs. The page shows their peaks with the change against the first, the breakdown bars on one scale, and the inputs that differ.
- **Campus** (`#campus`): buildings at one location served by one plant, each with a type, floor area and floors (typical inputs) or the full inputs it had in the workspace. The sum of building peaks comes from the instant estimates. **Run in EnergyPlus** runs each building in the browser and adds their hour-by-hour loads on each design day; the campus peak is the highest hour, and the diversity factor is campus peak ÷ sum of building peaks. All buildings see the same design day, so the diversity comes only from when each building peaks: buildings with the same schedules peak together. System allowances are not included in the campus totals.

### Annual energy and carbon

**Run annual energy** runs the same model for a full year on the station's TMY3 weather file. The file is downloaded once from the DOE EnergyPlus weather library into `engine/weather/epw/`, which is git-ignored.

- **What it reports**: monthly cooling and heating delivered at the coil (ideal loads, outdoor air net of heat recovery), lighting and equipment electricity, and supply airflow.
- **Conversion to energy and carbon** uses only your inputs under *Energy and carbon*: cooling COP, heating source with its efficiency or COP, fan power in W per L/s, and electricity and gas carbon factors. Missing inputs are named rather than assumed.
- **Weekly schedule**: *Occupied days per week* sets it. Unoccupied days use the unoccupied gains, outdoor air and setback/setup. Design days are unaffected.
- **Not included**: domestic hot water, elevators and process loads.
- **No economizer is modelled.** EnergyPlus's ideal-loads economizer does not modulate outdoor air and added spurious heating in testing, so annual cooling in mild weather is an upper bound.
- **Fans**: fan energy follows the airflow the loads need, as a variable-volume fan would. A constant-volume fan uses more.

## Quick start

```bash
cd load-reduction-tool
python server.py                # Python 3.9+ only; opens http://localhost:3100. Ctrl+C to stop
```

On Windows, use `py` if `python` isn't recognized. `node server.js` is an equivalent server.

**No EnergyPlus install is needed to use the page.** Instant estimates are the default; **Run EnergyPlus**, the exact sensitivity sweep and annual energy run EnergyPlus 25.2 inside the browser:

- `web/ep-browser.js` loads the engine's own Python (`engine/run_scenario.py`: `prepare` writes the IDF, `assemble` reads `eplusout.sql`) under [Pyodide](https://pyodide.org) 0.29.5, and EnergyPlus 25.2 compiled to WebAssembly from [`@idfkit/engine`](https://github.com/idfkit/idfkit-engine) 0.6.0 with `@idfkit/engine-assets` 25.2.1. Both load from the jsDelivr CDN at pinned versions on the first run (about 45 MB, then cached by the browser). Needs a current Chrome, Edge, Firefox or Safari.
- The page fetches the engine's Python, the station's `.ddy`/`.stat` and, for annual runs, its TMY3 `.epw` from `/engine/` on the same site. `engine/web_files.py` lists what is served (both servers use it); the DOE weather host sends no CORS headers, so the server downloads the `.epw` once into `engine/weather/epw`.
- Runs use up to three parallel engines (cores − 1), so the 37-run exact sweep takes about 80 s.
- **Checked against native EnergyPlus 25.2:** the same requests through both give the same IDF text and the same results to 1e-11 relative, across lab (Denver), hotel with heat recovery (Miami), healthcare (Fairbanks), stadium (Phoenix), school with changed inputs (Seattle) and an annual office run (Chicago), about 19,400 values. The only difference seen: on a heating design day with constant overnight conditions, a zone's reported peak *time* can fall on a different timestep of the same flat plateau (same load).

`engine/run_scenario.py` still runs native EnergyPlus for the command line, the batch runs that train the surrogates, and `POST /api/run` (set `ENERGYPLUS_EXE`); see Setup in `CLAUDE.md`.

### Sharing on GitHub Pages

The page is a static site, so it can be published without a server:

```bash
python3 engine/web_files.py build-site _site     # web/ + engine files + the 27 weather files (~100 MB)
```

`.github/workflows/pages.yml` does this and deploys it: in the repository, **Settings → Pages → Source: GitHub Actions**, then **Actions → Deploy to GitHub Pages → Run workflow** (after that it redeploys on every push to `main` that changes `web/` or `engine/`). Don't use "Deploy from a branch": it publishes the repository as-is, without the engine files and weather the in-browser runs need, and they fail with *Could not fetch engine/manifest.json (404)*. The site appears at `https://<owner>.github.io/<repo>/`. Pages from a private repository needs a paid GitHub plan, and the published site is public unless the repository belongs to a GitHub Enterprise Cloud organisation that restricts Pages access to its members.

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
  - **Load breakdown** (`results.breakdown`): where each block peak comes from (people, lighting, equipment, window solar, window conduction, walls, roof, ground floor, infiltration, internal mass, ventilation, heat recovery), summing exactly to the block peak. The zone part of the peak (total less the ventilation load net of recovery) is split in the proportions of EnergyPlus's Zone Component Load Summary (each zone at its own design peak, scaled); ventilation and recovery come from the ideal-loads outputs at the block peak hour. Cooling counts sensible + latent components; heating counts sensible only, because the ideal-loads system does not humidify. The proportions come from each zone's governing design peak, so at other percentiles the split is an approximation.
  - **Breakdown in instant estimates:** the surrogates also predict each component (`comp_clg|*`, `comp_htg|*`). On the independent test runs (seed 9001, 51 per model), the 95th-percentile error in the largest-off source's share of the peak is typically 2.7 percentage points for cooling and 0.7 for heating; the worst model is 8.2 points (cooling, office Fairbanks) among passing models and 10.1 points (heating, stadium Honolulu) among failed ones. Failed models stay gated as for peaks.
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

## Surrogate test results

Each building type × station model was tested by `engine/validate.py` against 51 EnergyPlus runs it never saw (independent sample, seed 9001, plus the type default). Peaks are one-hour averages. A model passes when the worst 95th-percentile error on the peaks the page reports is at most 5%. Models that fail are **not used by the page**; it asks for an EnergyPlus run instead.

Training: 500 EnergyPlus runs per model, 1,500 for the 40 models that were still improving at 500 (EnergyPlus 25.2.0). Results from 2026-10-23.

**194 of 243 models pass.** Cells show the worst P95 error on the reported peaks; failures in bold.

| Station | higher ed | office | hotel | retail | healthcare | school | lab | stadium | sports |
|---|---|---|---|---|---|---|---|---|---|
| Albuquerque | 5.0 | 4.8 | 4.5 | 4.1 | **5.9** | **9.7** | **16.0** | **10.7** | **6.3** |
| Atlanta | 2.0 | 2.0 | 2.1 | 2.3 | 1.4 | 1.6 | 1.7 | 2.9 | 2.7 |
| Boston | 2.4 | 2.9 | 3.4 | 3.0 | 2.5 | 2.2 | 2.8 | 3.1 | 4.4 |
| Buffalo | 3.7 | 3.5 | 2.7 | 3.6 | 3.0 | 2.9 | 1.2 | 4.1 | **5.6** |
| Chicago | 1.9 | 3.1 | 2.4 | 2.7 | 2.8 | 2.7 | 0.9 | 3.2 | 3.1 |
| Dallas-Fort Worth | 1.8 | 2.5 | 2.8 | 1.9 | 2.1 | 2.0 | 0.8 | 3.1 | 2.1 |
| Denver | 3.8 | 4.9 | 4.3 | **5.3** | **8.8** | **7.8** | **13.7** | **11.8** | **5.9** |
| El Paso | 2.3 | 2.6 | 2.9 | 4.3 | 4.4 | 2.9 | 4.2 | **7.4** | **12.2** |
| Fairbanks | 3.4 | 4.8 | 2.9 | 3.5 | 4.5 | 4.5 | **10.4** | **5.7** | **6.6** |
| Great Falls | 3.6 | 3.8 | 4.4 | 3.9 | 4.9 | **5.6** | **10.0** | 3.9 | **6.1** |
| Honolulu | 2.9 | 3.8 | 4.3 | 3.6 | 2.4 | 2.7 | 3.5 | **8.7** | **6.1** |
| Houston | 2.2 | 2.3 | 2.8 | 2.4 | 1.3 | 1.6 | 1.2 | 2.2 | 1.8 |
| International Falls | 2.6 | 4.3 | 4.4 | 4.4 | 4.6 | 3.5 | **6.8** | **8.9** | **8.5** |
| Kansas City | 2.2 | 2.8 | 2.6 | 2.5 | 1.8 | 2.7 | 1.8 | 3.0 | 2.3 |
| Los Angeles | 3.4 | 4.3 | 3.9 | 3.6 | **8.0** | **10.4** | **11.7** | **23.6** | **22.3** |
| Miami | 1.7 | 2.5 | 2.5 | 2.4 | 2.3 | 1.3 | 2.6 | 2.8 | 2.7 |
| New York | 2.3 | 4.7 | 2.3 | 3.7 | 2.1 | 3.2 | 2.7 | 3.4 | 3.1 |
| Phoenix | 2.0 | 2.3 | 2.0 | 1.6 | 1.5 | 2.0 | 2.3 | 3.9 | 1.8 |
| Port Angeles | 3.9 | 3.7 | **6.3** | **6.2** | **6.5** | 4.7 | **12.0** | **17.1** | **50.3** |
| Rochester | 3.2 | 3.0 | 4.2 | 4.7 | 3.4 | 2.0 | 1.6 | 4.7 | 4.2 |
| San Diego | 2.1 | 3.7 | 2.7 | 3.7 | 3.0 | 2.4 | **5.6** | **12.6** | **13.2** |
| San Francisco | 4.8 | 4.6 | 4.5 | **6.2** | **16.0** | **10.2** | **20.2** | **14.3** | **15.1** |
| Seattle | 3.5 | 4.5 | 4.1 | 3.5 | 4.1 | 4.9 | **10.4** | **5.8** | **7.4** |
| St. Louis | 2.4 | 2.3 | 2.1 | 3.0 | 1.4 | 1.8 | 2.4 | 2.5 | 2.2 |
| Tampa | 2.3 | 2.9 | 2.1 | 1.7 | 1.9 | 2.0 | 1.9 | 2.1 | 1.9 |
| Tucson | 2.8 | 3.2 | 3.6 | 3.4 | 2.6 | 3.4 | 1.5 | 5.0 | **7.2** |
| Washington | 1.9 | 2.1 | 3.9 | 2.3 | 1.9 | 2.7 | 1.2 | 3.2 | 2.7 |
| **Passing** | 27/27 | 27/27 | 26/27 | 24/27 | 22/27 | 22/27 | 17/27 | 16/27 | 13/27 |

**Where the surrogate is not used, and why.** Almost every failure is a cooling peak in a mild coastal, dry or very cold climate (San Francisco, Los Angeles, San Diego, Port Angeles, Seattle, Denver, Albuquerque, El Paso, Great Falls, Fairbanks, International Falls). There the outdoor air is a load in some designs and a free-cooling credit in others, cooling peaks are small, and heat recovery switches on and off across the design space. Checked and ruled out as causes: EnergyPlus noise (sweeps of every input are smooth after the one-hour averaging), the regression form (gradient-boosted trees, a neural network and a hybrid did no better), a log scale, separate sensible and latent fits, and an outdoor-air load/credit feature. For the worst cases more training runs stopped helping between 250 and 500 runs. EnergyPlus runs remain accurate there; only the instant estimate is withheld.

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

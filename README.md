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
> - **Open issue:** 62 of the 500 runs reported a severe EnergyPlus error. All of them had 3+ floors, and almost all had floor plates over 4,000 m². Their heating results match the hand calc as well as the clean runs do, so they were kept. The likely cause is warm-up non-convergence in the large, fully adiabatic middle-floor core zone, but this is unconfirmed. Reproduce with `engine/diagnostics/large_floor_plate.json` (see *Diagnostics*). Batch records now keep the first severe messages.
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
python3 engine/batch.py --types office --stations chicago --n 500 --workers 8   # resumable
python3 engine/fit_surrogate.py                                                    # writes web/data/loads-surrogate.js
```

- `engine/variables.json` defines the sampled design space. Each sample is one EnergyPlus run, and every run simulates all eight design days.
- The fit is a quadratic ridge regression on 19 features. Ridge strength is chosen by 5-fold cross-validation, and the error statistics stored with each model are out-of-fold.
- Plan roughly 400–600 runs per building type × station. Check the reported P95 error before relying on a model; if it is poor, add samples or narrow the design space.
- Failed runs go to `engine/runs/*.failed.jsonl`. Samples with severe EnergyPlus errors are counted in the model metadata.

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
- **Ventilation.** Outdoor air per ASHRAE 62.1 (Rp × people + Ra × area) during occupied hours, on both design days. Optional sensible or enthalpy heat recovery.
- **HVAC.** `ZoneHVAC:IdealLoadsAirSystem` per zone, with supply-air temperatures from the inputs and dehumidification to a constant supply humidity ratio. Reported loads are therefore **coil loads including outdoor air**, split into sensible and latent.
- **Design days.** Taken verbatim from the station's `.ddy` file: heating 99.6% and 99%; cooling 0.4/1/2% dry-bulb with mean coincident wet-bulb; dehumidification 0.4/1/2% dew point with mean coincident dry-bulb. **Cooling is governed by whichever of the dry-bulb and dew-point days gives the larger total.**
- **Outputs.**
  - Block (coincident) peak and sum of zone peaks.
  - Sensible and latent loads, the ventilation (outdoor-air) load before heat recovery and the amount recovered, and supply airflow at peak. The coil totals already include the recovery credit.
  - Peak time and the 24-hour profile.
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
| Office, K-12 school, retail, hotel | Outdoor air and occupant density: ASHRAE 62.1-2019 Table 6-1. Lighting: ASHRAE 90.1-2019 building area method (to verify). Equipment, setpoints, hours: carried over (to verify). |

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
  web/data/loads-surrogate.js  trained models (built by engine/fit_surrogate.py; absent until trained)
  engine/
    run_scenario.py         one scenario → EnergyPlus → JSON
    batch.py                Latin-hypercube training runs
    fit_surrogate.py        fit + publish surrogate
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

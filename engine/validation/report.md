# Surrogate validation against EnergyPlus

Generated 2026-10-20T18:01:22+00:00 by `engine/validate.py`. Each model is tested on EnergyPlus runs it was not trained on (independent Latin-hypercube sample, seed 9001, plus the building type default).

Pass rule: worst 95th-percentile absolute error on the peaks the page reports <= 5.0%. Those are the governing cooling peak for each percentile (the larger of the dry-bulb and dew-point days, as EnergyPlus and the model each see it) and the heating peak for each percentile. "Any single day" judges every design day on its own value, including mild days that never govern and can sit near zero; it is shown for information. Peaks are one-hour averages. A peak below 10% of the case's design load (larger of 0.4% cooling and 99.6% heating) is judged as a share of that 10%, not of itself.

| Model | Test runs | Worst P95, reported peaks | Which peak | Cooling 0.4% | Heating 99.6% | Any single day (info) | Result |
|---|---|---|---|---|---|---|---|
| office|albuquerque | 51 | 4.8% | cooling 2% | 4.1% | 0.8% | 9.3% | PASS |
| office|atlanta | 51 | 2.0% | cooling 0.4% | 2.0% | 0.6% | 3.1% | PASS |
| office|boston | 51 | 2.9% | cooling 1% | 2.7% | 0.7% | 3.5% | PASS |
| office|buffalo | 51 | 3.5% | cooling 2% | 2.9% | 0.6% | 4.2% | PASS |
| office|chicago | 51 | 3.1% | cooling 2% | 2.6% | 0.9% | 3.3% | PASS |
| office|dallas | 51 | 2.5% | cooling 2% | 2.5% | 0.6% | 2.9% | PASS |
| office|denver | 51 | 4.9% | cooling 2% | 4.5% | 0.7% | 11.9% | PASS |
| office|elpaso | 51 | 2.6% | cooling 2% | 2.4% | 0.9% | 6.2% | PASS |
| office|fairbanks | 51 | 4.8% | cooling 2% | 3.8% | 1.0% | 11.3% | PASS |
| office|greatfalls | 51 | 3.8% | cooling 2% | 3.3% | 0.7% | 10.2% | PASS |
| office|honolulu | 51 | 3.8% | heating 99.6% | 2.5% | 3.8% | 4.5% | PASS |
| office|houston | 51 | 2.3% | cooling 0.4% | 2.3% | 0.8% | 2.8% | PASS |
| office|intlfalls | 51 | 4.3% | cooling 1% | 4.2% | 0.7% | 7.0% | PASS |
| office|kansascity | 51 | 2.8% | cooling 1% | 2.5% | 0.6% | 3.3% | PASS |
| office|losangeles | 51 | 4.3% | cooling 0.4% | 4.3% | 1.5% | 4.5% | PASS |
| office|miami | 51 | 2.5% | heating 99% | 2.1% | 1.5% | 2.6% | PASS |
| office|newyork | 51 | 4.7% | cooling 2% | 4.1% | 0.7% | 4.7% | PASS |
| office|phoenix | 51 | 2.3% | cooling 0.4% | 2.3% | 0.7% | 2.3% | PASS |
| office|portangeles | 51 | 6.2% | cooling 2% | 3.4% | 0.8% | 13.6% | **FAIL** |
| office|rochestermn | 51 | 3.0% | cooling 2% | 2.3% | 0.7% | 3.2% | PASS |
| office|sandiego | 51 | 3.7% | cooling 1% | 3.6% | 1.5% | 3.9% | PASS |
| office|sanfrancisco | 51 | 10.2% | cooling 2% | 7.2% | 1.1% | 23.3% | **FAIL** |
| office|seattle | 51 | 4.5% | cooling 2% | 3.4% | 0.8% | 11.3% | PASS |
| office|stlouis | 51 | 2.3% | cooling 2% | 2.1% | 0.7% | 3.1% | PASS |
| office|tampa | 51 | 2.9% | cooling 1% | 2.8% | 0.8% | 3.4% | PASS |
| office|tucson | 51 | 3.2% | cooling 0.4% | 3.2% | 0.9% | 5.4% | PASS |
| office|washington | 51 | 2.1% | cooling 2% | 1.9% | 0.6% | 2.5% | PASS |

## Type defaults (prediction vs EnergyPlus)

| Model | Output | EnergyPlus W/m² | Surrogate W/m² | Error |
|---|---|---|---|---|
| office|albuquerque | clg_db_0.4|total_w_m2 | 41.2 | 41.5 | +0.8% |
| office|albuquerque | clg_dp_0.4|total_w_m2 | 35.9 | 36.2 | +0.9% |
| office|albuquerque | htg_99.6|total_w_m2 | 28.6 | 28.5 | -0.2% |
| office|atlanta | clg_db_0.4|total_w_m2 | 51.9 | 51.5 | -0.7% |
| office|atlanta | clg_dp_0.4|total_w_m2 | 50.2 | 49.8 | -0.8% |
| office|atlanta | htg_99.6|total_w_m2 | 31.5 | 31.5 | +0.0% |
| office|boston | clg_db_0.4|total_w_m2 | 52.3 | 51.8 | -1.0% |
| office|boston | clg_dp_0.4|total_w_m2 | 53.1 | 52.9 | -0.5% |
| office|boston | htg_99.6|total_w_m2 | 37.4 | 37.4 | -0.1% |
| office|buffalo | clg_db_0.4|total_w_m2 | 49.1 | 48.1 | -2.1% |
| office|buffalo | clg_dp_0.4|total_w_m2 | 51.4 | 50.4 | -1.9% |
| office|buffalo | htg_99.6|total_w_m2 | 39.6 | 39.5 | -0.3% |
| office|chicago | clg_db_0.4|total_w_m2 | 54.9 | 53.8 | -1.9% |
| office|chicago | clg_dp_0.4|total_w_m2 | 56.9 | 55.9 | -1.8% |
| office|chicago | htg_99.6|total_w_m2 | 43.6 | 43.5 | -0.3% |
| office|dallas | clg_db_0.4|total_w_m2 | 54.8 | 54.1 | -1.2% |
| office|dallas | clg_dp_0.4|total_w_m2 | 53.7 | 52.9 | -1.5% |
| office|dallas | htg_99.6|total_w_m2 | 33.2 | 33.1 | -0.3% |
| office|denver | clg_db_0.4|total_w_m2 | 40.7 | 40.5 | -0.6% |
| office|denver | clg_dp_0.4|total_w_m2 | 36.4 | 37.1 | +2.1% |
| office|denver | htg_99.6|total_w_m2 | 36.0 | 35.9 | -0.4% |
| office|elpaso | clg_db_0.4|total_w_m2 | 42.6 | 42.1 | -1.2% |
| office|elpaso | clg_dp_0.4|total_w_m2 | 38.7 | 38.4 | -0.8% |
| office|elpaso | htg_99.6|total_w_m2 | 27.7 | 27.5 | -0.8% |
| office|fairbanks | clg_db_0.4|total_w_m2 | 40.2 | 40.3 | +0.1% |
| office|fairbanks | clg_dp_0.4|total_w_m2 | 37.2 | 36.7 | -1.3% |
| office|fairbanks | htg_99.6|total_w_m2 | 61.9 | 62.3 | +0.6% |
| office|greatfalls | clg_db_0.4|total_w_m2 | 40.6 | 39.3 | -3.2% |
| office|greatfalls | clg_dp_0.4|total_w_m2 | 34.2 | 32.2 | -6.0% |
| office|greatfalls | htg_99.6|total_w_m2 | 46.0 | 46.1 | +0.0% |
| office|honolulu | clg_db_0.4|total_w_m2 | 49.9 | 49.6 | -0.5% |
| office|honolulu | clg_dp_0.4|total_w_m2 | 50.7 | 50.1 | -1.2% |
| office|honolulu | htg_99.6|total_w_m2 | 6.5 | 6.4 | -2.3% |
| office|houston | clg_db_0.4|total_w_m2 | 55.9 | 56.0 | +0.2% |
| office|houston | clg_dp_0.4|total_w_m2 | 55.2 | 55.3 | +0.1% |
| office|houston | htg_99.6|total_w_m2 | 27.3 | 27.3 | -0.1% |
| office|intlfalls | clg_db_0.4|total_w_m2 | 49.4 | 48.6 | -1.7% |
| office|intlfalls | clg_dp_0.4|total_w_m2 | 50.8 | 50.0 | -1.6% |
| office|intlfalls | htg_99.6|total_w_m2 | 53.3 | 53.0 | -0.4% |
| office|kansascity | clg_db_0.4|total_w_m2 | 58.1 | 58.1 | +0.1% |
| office|kansascity | clg_dp_0.4|total_w_m2 | 59.8 | 59.8 | -0.0% |
| office|kansascity | htg_99.6|total_w_m2 | 42.6 | 42.7 | +0.2% |
| office|losangeles | clg_db_0.4|total_w_m2 | 36.6 | 36.5 | -0.5% |
| office|losangeles | clg_dp_0.4|total_w_m2 | 39.5 | 39.5 | -0.1% |
| office|losangeles | htg_99.6|total_w_m2 | 16.6 | 16.5 | -1.0% |
| office|miami | clg_db_0.4|total_w_m2 | 56.3 | 56.0 | -0.5% |
| office|miami | clg_dp_0.4|total_w_m2 | 57.0 | 56.8 | -0.3% |
| office|miami | htg_99.6|total_w_m2 | 15.4 | 15.3 | -0.6% |
| office|newyork | clg_db_0.4|total_w_m2 | 52.9 | 52.6 | -0.7% |
| office|newyork | clg_dp_0.4|total_w_m2 | 54.7 | 54.4 | -0.7% |
| office|newyork | htg_99.6|total_w_m2 | 35.8 | 35.8 | +0.1% |
| office|phoenix | clg_db_0.4|total_w_m2 | 51.8 | 51.7 | -0.1% |
| office|phoenix | clg_dp_0.4|total_w_m2 | 48.7 | 48.3 | -0.8% |
| office|phoenix | htg_99.6|total_w_m2 | 21.1 | 21.0 | -0.3% |
| office|portangeles | clg_db_0.4|total_w_m2 | 38.8 | 38.4 | -0.9% |
| office|portangeles | clg_dp_0.4|total_w_m2 | 33.8 | 32.6 | -3.5% |
| office|portangeles | htg_99.6|total_w_m2 | 26.9 | 26.7 | -0.6% |
| office|rochestermn | clg_db_0.4|total_w_m2 | 52.5 | 52.3 | -0.2% |
| office|rochestermn | clg_dp_0.4|total_w_m2 | 54.9 | 54.7 | -0.5% |
| office|rochestermn | htg_99.6|total_w_m2 | 47.8 | 47.8 | -0.0% |
| office|sandiego | clg_db_0.4|total_w_m2 | 41.0 | 41.5 | +1.3% |
| office|sandiego | clg_dp_0.4|total_w_m2 | 44.8 | 45.8 | +2.3% |
| office|sandiego | htg_99.6|total_w_m2 | 16.6 | 16.4 | -0.9% |
| office|sanfrancisco | clg_db_0.4|total_w_m2 | 34.4 | 34.8 | +1.2% |
| office|sanfrancisco | clg_dp_0.4|total_w_m2 | 29.5 | 29.4 | -0.4% |
| office|sanfrancisco | htg_99.6|total_w_m2 | 20.3 | 20.2 | -0.3% |
| office|seattle | clg_db_0.4|total_w_m2 | 42.5 | 42.0 | -1.4% |
| office|seattle | clg_dp_0.4|total_w_m2 | 36.4 | 36.2 | -0.4% |
| office|seattle | htg_99.6|total_w_m2 | 28.0 | 28.0 | +0.0% |
| office|stlouis | clg_db_0.4|total_w_m2 | 59.2 | 58.5 | -1.2% |
| office|stlouis | clg_dp_0.4|total_w_m2 | 59.5 | 58.9 | -1.0% |
| office|stlouis | htg_99.6|total_w_m2 | 40.6 | 40.6 | +0.0% |
| office|tampa | clg_db_0.4|total_w_m2 | 56.5 | 56.0 | -0.9% |
| office|tampa | clg_dp_0.4|total_w_m2 | 58.2 | 57.8 | -0.8% |
| office|tampa | htg_99.6|total_w_m2 | 21.1 | 21.1 | -0.1% |
| office|tucson | clg_db_0.4|total_w_m2 | 46.0 | 45.8 | -0.4% |
| office|tucson | clg_dp_0.4|total_w_m2 | 41.5 | 41.6 | +0.2% |
| office|tucson | htg_99.6|total_w_m2 | 24.3 | 24.2 | -0.2% |
| office|washington | clg_db_0.4|total_w_m2 | 57.5 | 56.7 | -1.4% |
| office|washington | clg_dp_0.4|total_w_m2 | 57.5 | 56.9 | -1.1% |
| office|washington | htg_99.6|total_w_m2 | 33.4 | 33.3 | -0.2% |

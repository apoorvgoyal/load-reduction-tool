# Surrogate validation against EnergyPlus

Generated 2026-10-20T18:42:15+00:00 by `engine/validate.py`. Each model is tested on EnergyPlus runs it was not trained on (independent Latin-hypercube sample, seed 9001, plus the building type default).

Pass rule: worst 95th-percentile absolute error on the peaks the page reports <= 5.0%. Those are the governing cooling peak for each percentile (the larger of the dry-bulb and dew-point days, as EnergyPlus and the model each see it) and the heating peak for each percentile. "Any single day" judges every design day on its own value, including mild days that never govern and can sit near zero; it is shown for information. Peaks are one-hour averages. A peak below 10% of the case's design load (larger of 0.4% cooling and 99.6% heating) is judged as a share of that 10%, not of itself.

| Model | Test runs | Worst P95, reported peaks | Which peak | Cooling 0.4% | Heating 99.6% | Any single day (info) | Result |
|---|---|---|---|---|---|---|---|
| hotel|albuquerque | 51 | 4.5% | cooling 1% | 4.3% | 0.7% | 8.6% | PASS |
| hotel|atlanta | 51 | 2.1% | cooling 0.4% | 2.1% | 0.6% | 2.6% | PASS |
| hotel|boston | 51 | 3.4% | cooling 2% | 2.9% | 0.7% | 3.6% | PASS |
| hotel|buffalo | 51 | 2.7% | cooling 2% | 2.2% | 0.8% | 3.2% | PASS |
| hotel|chicago | 51 | 2.4% | cooling 2% | 2.0% | 0.8% | 2.5% | PASS |
| hotel|dallas | 51 | 2.8% | cooling 2% | 2.7% | 0.7% | 3.1% | PASS |
| hotel|denver | 51 | 4.3% | cooling 2% | 3.8% | 0.6% | 12.8% | PASS |
| hotel|elpaso | 51 | 2.9% | cooling 2% | 2.8% | 0.5% | 5.7% | PASS |
| hotel|fairbanks | 51 | 2.9% | cooling 0.4% | 2.9% | 0.6% | 29.7% | PASS |
| hotel|greatfalls | 51 | 4.4% | cooling 0.4% | 4.4% | 0.4% | 9.9% | PASS |
| hotel|honolulu | 51 | 4.3% | cooling 1% | 4.2% | 1.3% | 4.5% | PASS |
| hotel|houston | 51 | 2.8% | cooling 1% | 2.8% | 0.7% | 2.7% | PASS |
| hotel|intlfalls | 51 | 4.4% | cooling 2% | 3.7% | 0.7% | 5.5% | PASS |
| hotel|kansascity | 51 | 2.6% | cooling 2% | 2.3% | 0.5% | 2.7% | PASS |
| hotel|losangeles | 51 | 3.9% | cooling 1% | 3.5% | 0.8% | 4.2% | PASS |
| hotel|miami | 51 | 2.5% | cooling 2% | 2.4% | 0.9% | 2.5% | PASS |
| hotel|newyork | 51 | 2.3% | cooling 2% | 2.2% | 0.7% | 2.9% | PASS |
| hotel|phoenix | 51 | 2.0% | cooling 0.4% | 2.0% | 0.8% | 2.8% | PASS |
| hotel|portangeles | 51 | 7.6% | cooling 2% | 4.5% | 0.5% | 18.6% | **FAIL** |
| hotel|rochestermn | 51 | 4.2% | cooling 2% | 3.9% | 0.7% | 4.8% | PASS |
| hotel|sandiego | 51 | 2.7% | cooling 0.4% | 2.7% | 1.2% | 3.2% | PASS |
| hotel|sanfrancisco | 51 | 6.2% | cooling 2% | 4.9% | 0.6% | 17.6% | **FAIL** |
| hotel|seattle | 51 | 4.1% | cooling 1% | 3.1% | 0.8% | 13.3% | PASS |
| hotel|stlouis | 51 | 2.1% | cooling 2% | 2.0% | 0.5% | 2.3% | PASS |
| hotel|tampa | 51 | 2.1% | cooling 2% | 2.0% | 0.6% | 2.1% | PASS |
| hotel|tucson | 51 | 3.6% | cooling 2% | 3.3% | 0.6% | 4.2% | PASS |
| hotel|washington | 51 | 3.9% | cooling 2% | 3.2% | 0.9% | 4.5% | PASS |

## Type defaults (prediction vs EnergyPlus)

| Model | Output | EnergyPlus W/m² | Surrogate W/m² | Error |
|---|---|---|---|---|
| hotel|albuquerque | clg_db_0.4|total_w_m2 | 44.2 | 44.5 | +0.8% |
| hotel|albuquerque | clg_dp_0.4|total_w_m2 | 41.2 | 41.2 | +0.2% |
| hotel|albuquerque | htg_99.6|total_w_m2 | 32.2 | 32.0 | -0.5% |
| hotel|atlanta | clg_db_0.4|total_w_m2 | 58.6 | 57.8 | -1.3% |
| hotel|atlanta | clg_dp_0.4|total_w_m2 | 57.9 | 57.2 | -1.2% |
| hotel|atlanta | htg_99.6|total_w_m2 | 35.5 | 35.4 | -0.2% |
| hotel|boston | clg_db_0.4|total_w_m2 | 58.5 | 58.0 | -1.0% |
| hotel|boston | clg_dp_0.4|total_w_m2 | 60.0 | 59.5 | -0.9% |
| hotel|boston | htg_99.6|total_w_m2 | 42.6 | 42.7 | +0.1% |
| hotel|buffalo | clg_db_0.4|total_w_m2 | 54.9 | 53.9 | -1.8% |
| hotel|buffalo | clg_dp_0.4|total_w_m2 | 58.3 | 57.4 | -1.6% |
| hotel|buffalo | htg_99.6|total_w_m2 | 45.1 | 45.1 | -0.1% |
| hotel|chicago | clg_db_0.4|total_w_m2 | 61.6 | 60.7 | -1.6% |
| hotel|chicago | clg_dp_0.4|total_w_m2 | 64.7 | 63.8 | -1.4% |
| hotel|chicago | htg_99.6|total_w_m2 | 49.7 | 49.6 | -0.1% |
| hotel|dallas | clg_db_0.4|total_w_m2 | 61.5 | 60.9 | -0.9% |
| hotel|dallas | clg_dp_0.4|total_w_m2 | 61.9 | 61.4 | -0.7% |
| hotel|dallas | htg_99.6|total_w_m2 | 37.3 | 37.3 | +0.0% |
| hotel|denver | clg_db_0.4|total_w_m2 | 43.9 | 43.4 | -1.2% |
| hotel|denver | clg_dp_0.4|total_w_m2 | 41.6 | 40.8 | -2.0% |
| hotel|denver | htg_99.6|total_w_m2 | 40.7 | 40.7 | -0.0% |
| hotel|elpaso | clg_db_0.4|total_w_m2 | 47.0 | 46.2 | -1.7% |
| hotel|elpaso | clg_dp_0.4|total_w_m2 | 45.2 | 44.5 | -1.5% |
| hotel|elpaso | htg_99.6|total_w_m2 | 31.2 | 31.1 | -0.3% |
| hotel|fairbanks | clg_db_0.4|total_w_m2 | 43.2 | 42.5 | -1.6% |
| hotel|fairbanks | clg_dp_0.4|total_w_m2 | 40.6 | 39.8 | -2.0% |
| hotel|fairbanks | htg_99.6|total_w_m2 | 71.3 | 71.4 | +0.2% |
| hotel|greatfalls | clg_db_0.4|total_w_m2 | 44.0 | 43.3 | -1.5% |
| hotel|greatfalls | clg_dp_0.4|total_w_m2 | 38.7 | 37.1 | -4.2% |
| hotel|greatfalls | htg_99.6|total_w_m2 | 52.5 | 52.4 | -0.0% |
| hotel|honolulu | clg_db_0.4|total_w_m2 | 56.2 | 55.8 | -0.7% |
| hotel|honolulu | clg_dp_0.4|total_w_m2 | 58.2 | 57.9 | -0.5% |
| hotel|honolulu | htg_99.6|total_w_m2 | 7.3 | 7.2 | -1.2% |
| hotel|houston | clg_db_0.4|total_w_m2 | 63.2 | 62.9 | -0.5% |
| hotel|houston | clg_dp_0.4|total_w_m2 | 63.8 | 63.6 | -0.4% |
| hotel|houston | htg_99.6|total_w_m2 | 30.7 | 30.7 | -0.1% |
| hotel|intlfalls | clg_db_0.4|total_w_m2 | 54.9 | 53.7 | -2.1% |
| hotel|intlfalls | clg_dp_0.4|total_w_m2 | 57.4 | 56.6 | -1.4% |
| hotel|intlfalls | htg_99.6|total_w_m2 | 61.0 | 61.2 | +0.2% |
| hotel|kansascity | clg_db_0.4|total_w_m2 | 65.4 | 65.1 | -0.5% |
| hotel|kansascity | clg_dp_0.4|total_w_m2 | 68.1 | 67.7 | -0.5% |
| hotel|kansascity | htg_99.6|total_w_m2 | 48.3 | 48.1 | -0.4% |
| hotel|losangeles | clg_db_0.4|total_w_m2 | 40.3 | 39.4 | -2.2% |
| hotel|losangeles | clg_dp_0.4|total_w_m2 | 45.3 | 44.3 | -2.1% |
| hotel|losangeles | htg_99.6|total_w_m2 | 18.8 | 18.7 | -0.6% |
| hotel|miami | clg_db_0.4|total_w_m2 | 63.8 | 63.9 | +0.1% |
| hotel|miami | clg_dp_0.4|total_w_m2 | 65.3 | 65.4 | +0.1% |
| hotel|miami | htg_99.6|total_w_m2 | 17.3 | 17.2 | -0.5% |
| hotel|newyork | clg_db_0.4|total_w_m2 | 59.2 | 58.5 | -1.3% |
| hotel|newyork | clg_dp_0.4|total_w_m2 | 62.0 | 61.5 | -0.8% |
| hotel|newyork | htg_99.6|total_w_m2 | 40.6 | 40.6 | -0.0% |
| hotel|phoenix | clg_db_0.4|total_w_m2 | 57.2 | 56.1 | -1.9% |
| hotel|phoenix | clg_dp_0.4|total_w_m2 | 56.0 | 54.9 | -2.0% |
| hotel|phoenix | htg_99.6|total_w_m2 | 23.6 | 23.5 | -0.3% |
| hotel|portangeles | clg_db_0.4|total_w_m2 | 42.5 | 42.0 | -1.0% |
| hotel|portangeles | clg_dp_0.4|total_w_m2 | 37.9 | 36.9 | -2.5% |
| hotel|portangeles | htg_99.6|total_w_m2 | 30.7 | 30.7 | -0.1% |
| hotel|rochestermn | clg_db_0.4|total_w_m2 | 59.0 | 58.3 | -1.1% |
| hotel|rochestermn | clg_dp_0.4|total_w_m2 | 62.5 | 62.1 | -0.7% |
| hotel|rochestermn | htg_99.6|total_w_m2 | 54.6 | 54.7 | +0.1% |
| hotel|sandiego | clg_db_0.4|total_w_m2 | 45.6 | 44.7 | -1.9% |
| hotel|sandiego | clg_dp_0.4|total_w_m2 | 51.0 | 50.0 | -2.0% |
| hotel|sandiego | htg_99.6|total_w_m2 | 18.7 | 18.5 | -0.8% |
| hotel|sanfrancisco | clg_db_0.4|total_w_m2 | 38.0 | 37.6 | -1.1% |
| hotel|sanfrancisco | clg_dp_0.4|total_w_m2 | 33.9 | 33.0 | -2.8% |
| hotel|sanfrancisco | htg_99.6|total_w_m2 | 22.9 | 22.8 | -0.4% |
| hotel|seattle | clg_db_0.4|total_w_m2 | 46.7 | 45.8 | -1.9% |
| hotel|seattle | clg_dp_0.4|total_w_m2 | 41.0 | 39.4 | -3.9% |
| hotel|seattle | htg_99.6|total_w_m2 | 31.7 | 31.7 | -0.1% |
| hotel|stlouis | clg_db_0.4|total_w_m2 | 66.7 | 65.8 | -1.4% |
| hotel|stlouis | clg_dp_0.4|total_w_m2 | 67.6 | 66.8 | -1.2% |
| hotel|stlouis | htg_99.6|total_w_m2 | 46.0 | 45.9 | -0.3% |
| hotel|tampa | clg_db_0.4|total_w_m2 | 64.0 | 63.4 | -1.0% |
| hotel|tampa | clg_dp_0.4|total_w_m2 | 66.8 | 66.1 | -1.1% |
| hotel|tampa | htg_99.6|total_w_m2 | 23.8 | 23.7 | -0.3% |
| hotel|tucson | clg_db_0.4|total_w_m2 | 50.1 | 50.0 | -0.3% |
| hotel|tucson | clg_dp_0.4|total_w_m2 | 48.4 | 48.6 | +0.3% |
| hotel|tucson | htg_99.6|total_w_m2 | 27.2 | 27.2 | -0.1% |
| hotel|washington | clg_db_0.4|total_w_m2 | 64.7 | 64.1 | -0.9% |
| hotel|washington | clg_dp_0.4|total_w_m2 | 65.3 | 64.8 | -0.8% |
| hotel|washington | htg_99.6|total_w_m2 | 37.9 | 37.8 | -0.2% |

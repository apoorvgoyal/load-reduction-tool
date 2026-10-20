# Surrogate validation against EnergyPlus

Generated 2026-10-20T18:06:27+00:00 by `engine/validate.py`. Each model is tested on EnergyPlus runs it was not trained on (independent Latin-hypercube sample, seed 9001, plus the building type default).

Pass rule: worst 95th-percentile absolute error on the peaks the page reports <= 5.0%. Those are the governing cooling peak for each percentile (the larger of the dry-bulb and dew-point days, as EnergyPlus and the model each see it) and the heating peak for each percentile. "Any single day" judges every design day on its own value, including mild days that never govern and can sit near zero; it is shown for information. Peaks are one-hour averages. A peak below 10% of the case's design load (larger of 0.4% cooling and 99.6% heating) is judged as a share of that 10%, not of itself.

| Model | Test runs | Worst P95, reported peaks | Which peak | Cooling 0.4% | Heating 99.6% | Any single day (info) | Result |
|---|---|---|---|---|---|---|---|
| retail|albuquerque | 51 | 5.7% | cooling 1% | 5.0% | 0.8% | 10.9% | **FAIL** |
| retail|atlanta | 51 | 2.3% | cooling 2% | 2.1% | 0.5% | 2.7% | PASS |
| retail|boston | 51 | 3.0% | cooling 2% | 2.3% | 0.7% | 3.0% | PASS |
| retail|buffalo | 51 | 3.6% | cooling 2% | 2.8% | 0.5% | 3.7% | PASS |
| retail|chicago | 51 | 2.7% | cooling 2% | 2.3% | 0.6% | 2.9% | PASS |
| retail|dallas | 51 | 1.9% | cooling 0.4% | 1.9% | 0.4% | 2.4% | PASS |
| retail|denver | 51 | 7.2% | cooling 0.4% | 7.2% | 0.4% | 20.5% | **FAIL** |
| retail|elpaso | 51 | 4.3% | cooling 1% | 4.1% | 0.7% | 5.4% | PASS |
| retail|fairbanks | 51 | 5.4% | cooling 2% | 3.9% | 0.3% | 35.4% | **FAIL** |
| retail|greatfalls | 51 | 7.7% | cooling 1% | 6.0% | 0.5% | 31.5% | **FAIL** |
| retail|honolulu | 51 | 3.6% | cooling 1% | 3.5% | 1.8% | 17.3% | PASS |
| retail|houston | 51 | 2.4% | cooling 0.4% | 2.4% | 0.5% | 2.5% | PASS |
| retail|intlfalls | 51 | 4.4% | cooling 2% | 3.3% | 0.4% | 7.0% | PASS |
| retail|kansascity | 51 | 2.5% | cooling 2% | 2.1% | 0.7% | 2.8% | PASS |
| retail|losangeles | 51 | 3.6% | cooling 0.4% | 3.6% | 0.5% | 4.0% | PASS |
| retail|miami | 51 | 2.4% | cooling 2% | 2.3% | 1.1% | 2.6% | PASS |
| retail|newyork | 51 | 3.7% | cooling 2% | 3.3% | 0.4% | 3.7% | PASS |
| retail|phoenix | 51 | 1.6% | cooling 2% | 1.4% | 0.6% | 2.3% | PASS |
| retail|portangeles | 51 | 9.7% | cooling 2% | 4.9% | 0.4% | 26.7% | **FAIL** |
| retail|rochestermn | 51 | 4.7% | cooling 2% | 4.0% | 0.7% | 5.1% | PASS |
| retail|sandiego | 51 | 3.7% | cooling 2% | 2.6% | 1.1% | 3.8% | PASS |
| retail|sanfrancisco | 51 | 9.9% | cooling 2% | 7.7% | 0.6% | 43.3% | **FAIL** |
| retail|seattle | 51 | 5.8% | cooling 0.4% | 5.8% | 0.6% | 32.1% | **FAIL** |
| retail|stlouis | 51 | 3.0% | cooling 2% | 2.5% | 0.4% | 3.7% | PASS |
| retail|tampa | 51 | 1.7% | cooling 2% | 1.6% | 0.6% | 1.7% | PASS |
| retail|tucson | 51 | 3.4% | cooling 0.4% | 3.4% | 1.0% | 4.7% | PASS |
| retail|washington | 51 | 2.3% | cooling 2% | 2.0% | 0.5% | 2.3% | PASS |

## Type defaults (prediction vs EnergyPlus)

| Model | Output | EnergyPlus W/m² | Surrogate W/m² | Error |
|---|---|---|---|---|
| retail|albuquerque | clg_db_0.4|total_w_m2 | 50.8 | 50.3 | -0.8% |
| retail|albuquerque | clg_dp_0.4|total_w_m2 | 46.7 | 45.9 | -1.8% |
| retail|albuquerque | htg_99.6|total_w_m2 | 48.3 | 48.3 | -0.1% |
| retail|atlanta | clg_db_0.4|total_w_m2 | 78.4 | 77.7 | -0.9% |
| retail|atlanta | clg_dp_0.4|total_w_m2 | 79.3 | 78.6 | -0.9% |
| retail|atlanta | htg_99.6|total_w_m2 | 53.2 | 53.1 | -0.2% |
| retail|boston | clg_db_0.4|total_w_m2 | 76.1 | 74.3 | -2.3% |
| retail|boston | clg_dp_0.4|total_w_m2 | 80.5 | 78.6 | -2.3% |
| retail|boston | htg_99.6|total_w_m2 | 66.6 | 66.6 | -0.0% |
| retail|buffalo | clg_db_0.4|total_w_m2 | 69.8 | 69.1 | -1.1% |
| retail|buffalo | clg_dp_0.4|total_w_m2 | 77.3 | 76.2 | -1.4% |
| retail|buffalo | htg_99.6|total_w_m2 | 70.5 | 70.4 | -0.1% |
| retail|chicago | clg_db_0.4|total_w_m2 | 81.9 | 80.5 | -1.7% |
| retail|chicago | clg_dp_0.4|total_w_m2 | 88.8 | 87.2 | -1.8% |
| retail|chicago | htg_99.6|total_w_m2 | 77.8 | 77.8 | +0.0% |
| retail|dallas | clg_db_0.4|total_w_m2 | 81.4 | 80.4 | -1.3% |
| retail|dallas | clg_dp_0.4|total_w_m2 | 85.7 | 84.4 | -1.5% |
| retail|dallas | htg_99.6|total_w_m2 | 55.5 | 55.5 | +0.1% |
| retail|denver | clg_db_0.4|total_w_m2 | 49.9 | 49.8 | -0.3% |
| retail|denver | clg_dp_0.4|total_w_m2 | 46.8 | 45.6 | -2.6% |
| retail|denver | htg_99.6|total_w_m2 | 62.7 | 62.6 | -0.1% |
| retail|elpaso | clg_db_0.4|total_w_m2 | 55.4 | 54.7 | -1.4% |
| retail|elpaso | clg_dp_0.4|total_w_m2 | 56.1 | 55.3 | -1.5% |
| retail|elpaso | htg_99.6|total_w_m2 | 46.5 | 46.3 | -0.3% |
| retail|fairbanks | clg_db_0.4|total_w_m2 | 44.5 | 44.7 | +0.5% |
| retail|fairbanks | clg_dp_0.4|total_w_m2 | 40.9 | 40.1 | -1.8% |
| retail|fairbanks | htg_99.6|total_w_m2 | 115.8 | 116.0 | +0.1% |
| retail|greatfalls | clg_db_0.4|total_w_m2 | 49.2 | 47.8 | -2.8% |
| retail|greatfalls | clg_dp_0.4|total_w_m2 | 40.6 | 37.9 | -6.7% |
| retail|greatfalls | htg_99.6|total_w_m2 | 82.6 | 82.8 | +0.2% |
| retail|honolulu | clg_db_0.4|total_w_m2 | 74.7 | 74.4 | -0.5% |
| retail|honolulu | clg_dp_0.4|total_w_m2 | 80.4 | 79.8 | -0.8% |
| retail|honolulu | htg_99.6|total_w_m2 | 8.8 | 8.7 | -1.7% |
| retail|houston | clg_db_0.4|total_w_m2 | 86.3 | 85.6 | -0.9% |
| retail|houston | clg_dp_0.4|total_w_m2 | 90.2 | 89.5 | -0.7% |
| retail|houston | htg_99.6|total_w_m2 | 45.6 | 45.6 | -0.0% |
| retail|intlfalls | clg_db_0.4|total_w_m2 | 68.3 | 66.5 | -2.7% |
| retail|intlfalls | clg_dp_0.4|total_w_m2 | 73.6 | 71.2 | -3.4% |
| retail|intlfalls | htg_99.6|total_w_m2 | 97.8 | 97.8 | -0.0% |
| retail|kansascity | clg_db_0.4|total_w_m2 | 88.6 | 87.1 | -1.7% |
| retail|kansascity | clg_dp_0.4|total_w_m2 | 95.4 | 94.1 | -1.4% |
| retail|kansascity | htg_99.6|total_w_m2 | 74.4 | 74.4 | -0.0% |
| retail|losangeles | clg_db_0.4|total_w_m2 | 45.2 | 44.8 | -0.9% |
| retail|losangeles | clg_dp_0.4|total_w_m2 | 55.8 | 55.0 | -1.5% |
| retail|losangeles | htg_99.6|total_w_m2 | 27.4 | 27.4 | -0.1% |
| retail|miami | clg_db_0.4|total_w_m2 | 88.3 | 88.3 | -0.0% |
| retail|miami | clg_dp_0.4|total_w_m2 | 93.1 | 93.0 | -0.1% |
| retail|miami | htg_99.6|total_w_m2 | 24.5 | 24.4 | -0.2% |
| retail|newyork | clg_db_0.4|total_w_m2 | 77.4 | 76.4 | -1.3% |
| retail|newyork | clg_dp_0.4|total_w_m2 | 84.3 | 83.0 | -1.5% |
| retail|newyork | htg_99.6|total_w_m2 | 62.4 | 62.3 | -0.1% |
| retail|phoenix | clg_db_0.4|total_w_m2 | 70.9 | 70.5 | -0.5% |
| retail|phoenix | clg_dp_0.4|total_w_m2 | 74.8 | 74.4 | -0.5% |
| retail|phoenix | htg_99.6|total_w_m2 | 34.1 | 34.1 | -0.1% |
| retail|portangeles | clg_db_0.4|total_w_m2 | 45.2 | 44.1 | -2.4% |
| retail|portangeles | clg_dp_0.4|total_w_m2 | 37.6 | 35.8 | -4.7% |
| retail|portangeles | htg_99.6|total_w_m2 | 47.6 | 47.6 | -0.1% |
| retail|rochestermn | clg_db_0.4|total_w_m2 | 77.9 | 76.9 | -1.2% |
| retail|rochestermn | clg_dp_0.4|total_w_m2 | 85.3 | 84.5 | -0.9% |
| retail|rochestermn | htg_99.6|total_w_m2 | 86.5 | 86.3 | -0.2% |
| retail|sandiego | clg_db_0.4|total_w_m2 | 55.1 | 54.5 | -1.1% |
| retail|sandiego | clg_dp_0.4|total_w_m2 | 66.5 | 65.8 | -1.1% |
| retail|sandiego | htg_99.6|total_w_m2 | 27.2 | 27.0 | -0.6% |
| retail|sanfrancisco | clg_db_0.4|total_w_m2 | 40.9 | 40.2 | -1.8% |
| retail|sanfrancisco | clg_dp_0.4|total_w_m2 | 35.1 | 34.4 | -2.2% |
| retail|sanfrancisco | htg_99.6|total_w_m2 | 33.8 | 33.7 | -0.3% |
| retail|seattle | clg_db_0.4|total_w_m2 | 52.7 | 52.2 | -0.8% |
| retail|seattle | clg_dp_0.4|total_w_m2 | 43.6 | 44.1 | +1.1% |
| retail|seattle | htg_99.6|total_w_m2 | 48.4 | 48.4 | -0.1% |
| retail|stlouis | clg_db_0.4|total_w_m2 | 90.5 | 88.9 | -1.8% |
| retail|stlouis | clg_dp_0.4|total_w_m2 | 94.2 | 92.4 | -1.9% |
| retail|stlouis | htg_99.6|total_w_m2 | 70.9 | 70.8 | -0.1% |
| retail|tampa | clg_db_0.4|total_w_m2 | 88.2 | 87.4 | -1.0% |
| retail|tampa | clg_dp_0.4|total_w_m2 | 95.2 | 94.0 | -1.3% |
| retail|tampa | htg_99.6|total_w_m2 | 34.8 | 34.7 | -0.4% |
| retail|tucson | clg_db_0.4|total_w_m2 | 61.5 | 60.3 | -2.0% |
| retail|tucson | clg_dp_0.4|total_w_m2 | 62.0 | 60.8 | -1.9% |
| retail|tucson | htg_99.6|total_w_m2 | 39.8 | 39.7 | -0.2% |
| retail|washington | clg_db_0.4|total_w_m2 | 86.9 | 85.9 | -1.1% |
| retail|washington | clg_dp_0.4|total_w_m2 | 90.1 | 89.3 | -0.9% |
| retail|washington | htg_99.6|total_w_m2 | 58.2 | 58.1 | -0.2% |

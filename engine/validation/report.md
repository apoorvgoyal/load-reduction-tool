# Surrogate validation against EnergyPlus

Generated 2026-10-20T17:40:10+00:00 by `engine/validate.py`. Each model is tested on EnergyPlus runs it was not trained on (independent Latin-hypercube sample, seed 9001, plus the building type default).

Pass rule: worst 95th-percentile absolute error on the peaks the page reports <= 5.0%. Those are the governing cooling peak for each percentile (the larger of the dry-bulb and dew-point days, as EnergyPlus and the model each see it) and the heating peak for each percentile. "Any single day" judges every design day on its own value, including mild days that never govern and can sit near zero; it is shown for information. Peaks are one-hour averages. A peak below 10% of the case's design load (larger of 0.4% cooling and 99.6% heating) is judged as a share of that 10%, not of itself.

| Model | Test runs | Worst P95, reported peaks | Which peak | Cooling 0.4% | Heating 99.6% | Any single day (info) | Result |
|---|---|---|---|---|---|---|---|
| sports|albuquerque | 51 | 7.9% | cooling 0.4% | 7.9% | 0.6% | 67.2% | **FAIL** |
| sports|atlanta | 51 | 2.7% | cooling 2% | 2.7% | 0.5% | 4.9% | PASS |
| sports|boston | 51 | 4.4% | cooling 2% | 3.4% | 0.4% | 6.9% | PASS |
| sports|buffalo | 51 | 7.4% | cooling 2% | 3.0% | 0.3% | 10.4% | **FAIL** |
| sports|chicago | 51 | 3.1% | cooling 2% | 3.0% | 0.4% | 3.4% | PASS |
| sports|dallas | 51 | 2.1% | cooling 0.4% | 2.1% | 0.4% | 2.2% | PASS |
| sports|denver | 51 | 7.4% | cooling 1% | 6.9% | 0.6% | 171.6% | **FAIL** |
| sports|elpaso | 51 | 12.2% | cooling 0.4% | 12.2% | 0.5% | 32.5% | **FAIL** |
| sports|fairbanks | 51 | 6.8% | cooling 2% | 5.8% | 0.3% | 143.3% | **FAIL** |
| sports|greatfalls | 51 | 7.3% | cooling 2% | 4.1% | 0.4% | 169.9% | **FAIL** |
| sports|honolulu | 51 | 6.8% | heating 99.6% | 2.2% | 6.8% | 66.9% | **FAIL** |
| sports|houston | 51 | 1.8% | cooling 1% | 1.8% | 0.5% | 2.1% | PASS |
| sports|intlfalls | 51 | 11.4% | cooling 2% | 5.1% | 0.4% | 34.0% | **FAIL** |
| sports|kansascity | 51 | 2.3% | cooling 2% | 2.2% | 0.5% | 3.0% | PASS |
| sports|losangeles | 51 | 22.3% | cooling 1% | 19.4% | 0.6% | 63.7% | **FAIL** |
| sports|miami | 51 | 2.7% | cooling 2% | 2.7% | 0.6% | 3.0% | PASS |
| sports|newyork | 51 | 3.1% | cooling 1% | 2.7% | 0.4% | 3.5% | PASS |
| sports|phoenix | 51 | 1.8% | cooling 1% | 1.6% | 0.4% | 2.4% | PASS |
| sports|portangeles | 51 | 50.3% | cooling 2% | 4.7% | 0.3% | 78.8% | **FAIL** |
| sports|rochestermn | 51 | 5.3% | cooling 2% | 2.2% | 0.5% | 7.0% | **FAIL** |
| sports|sandiego | 51 | 13.2% | cooling 2% | 3.0% | 0.6% | 16.3% | **FAIL** |
| sports|sanfrancisco | 51 | 18.1% | cooling 2% | 9.7% | 0.5% | 134.0% | **FAIL** |
| sports|seattle | 51 | 9.3% | cooling 2% | 4.2% | 0.4% | 55.3% | **FAIL** |
| sports|stlouis | 51 | 2.2% | cooling 1% | 2.2% | 0.3% | 3.9% | PASS |
| sports|tampa | 51 | 1.9% | cooling 2% | 1.8% | 0.6% | 1.9% | PASS |
| sports|tucson | 51 | 7.1% | cooling 0.4% | 7.1% | 0.6% | 24.6% | **FAIL** |
| sports|washington | 51 | 2.7% | cooling 1% | 2.4% | 0.4% | 2.7% | PASS |

## Type defaults (prediction vs EnergyPlus)

| Model | Output | EnergyPlus W/m² | Surrogate W/m² | Error |
|---|---|---|---|---|
| sports|albuquerque | clg_db_0.4|total_w_m2 | 51.0 | 49.5 | -2.8% |
| sports|albuquerque | clg_dp_0.4|total_w_m2 | 42.2 | 39.7 | -6.1% |
| sports|albuquerque | htg_99.6|total_w_m2 | 57.3 | 57.3 | -0.0% |
| sports|atlanta | clg_db_0.4|total_w_m2 | 85.2 | 84.5 | -0.9% |
| sports|atlanta | clg_dp_0.4|total_w_m2 | 87.4 | 86.6 | -0.9% |
| sports|atlanta | htg_99.6|total_w_m2 | 62.9 | 62.8 | -0.1% |
| sports|boston | clg_db_0.4|total_w_m2 | 81.5 | 80.4 | -1.3% |
| sports|boston | clg_dp_0.4|total_w_m2 | 88.0 | 86.6 | -1.6% |
| sports|boston | htg_99.6|total_w_m2 | 81.1 | 81.0 | -0.1% |
| sports|buffalo | clg_db_0.4|total_w_m2 | 73.1 | 72.0 | -1.5% |
| sports|buffalo | clg_dp_0.4|total_w_m2 | 83.6 | 82.3 | -1.6% |
| sports|buffalo | htg_99.6|total_w_m2 | 86.1 | 86.0 | -0.2% |
| sports|chicago | clg_db_0.4|total_w_m2 | 89.2 | 87.8 | -1.6% |
| sports|chicago | clg_dp_0.4|total_w_m2 | 99.0 | 97.0 | -2.0% |
| sports|chicago | htg_99.6|total_w_m2 | 95.5 | 95.5 | -0.0% |
| sports|dallas | clg_db_0.4|total_w_m2 | 88.4 | 88.1 | -0.3% |
| sports|dallas | clg_dp_0.4|total_w_m2 | 95.7 | 95.7 | -0.0% |
| sports|dallas | htg_99.6|total_w_m2 | 65.3 | 65.4 | +0.1% |
| sports|denver | clg_db_0.4|total_w_m2 | 49.9 | 48.6 | -2.7% |
| sports|denver | clg_dp_0.4|total_w_m2 | 42.0 | 31.4 | -25.4% |
| sports|denver | htg_99.6|total_w_m2 | 76.3 | 76.2 | -0.1% |
| sports|elpaso | clg_db_0.4|total_w_m2 | 56.3 | 55.7 | -1.1% |
| sports|elpaso | clg_dp_0.4|total_w_m2 | 56.6 | 60.7 | +7.2% |
| sports|elpaso | htg_99.6|total_w_m2 | 54.5 | 54.4 | -0.3% |
| sports|fairbanks | clg_db_0.4|total_w_m2 | 40.4 | 40.1 | -0.7% |
| sports|fairbanks | clg_dp_0.4|total_w_m2 | 32.7 | 26.4 | -19.3% |
| sports|fairbanks | htg_99.6|total_w_m2 | 146.5 | 146.8 | +0.2% |
| sports|greatfalls | clg_db_0.4|total_w_m2 | 48.8 | 47.2 | -3.2% |
| sports|greatfalls | clg_dp_0.4|total_w_m2 | 32.9 | 26.8 | -18.5% |
| sports|greatfalls | htg_99.6|total_w_m2 | 102.4 | 102.3 | -0.1% |
| sports|honolulu | clg_db_0.4|total_w_m2 | 80.5 | 81.0 | +0.6% |
| sports|honolulu | clg_dp_0.4|total_w_m2 | 88.9 | 89.3 | +0.5% |
| sports|honolulu | htg_99.6|total_w_m2 | 5.7 | 5.3 | -7.4% |
| sports|houston | clg_db_0.4|total_w_m2 | 95.7 | 95.1 | -0.7% |
| sports|houston | clg_dp_0.4|total_w_m2 | 102.0 | 101.4 | -0.6% |
| sports|houston | htg_99.6|total_w_m2 | 52.8 | 52.7 | -0.3% |
| sports|intlfalls | clg_db_0.4|total_w_m2 | 70.5 | 69.4 | -1.6% |
| sports|intlfalls | clg_dp_0.4|total_w_m2 | 78.1 | 76.3 | -2.3% |
| sports|intlfalls | htg_99.6|total_w_m2 | 122.4 | 122.3 | -0.1% |
| sports|kansascity | clg_db_0.4|total_w_m2 | 98.0 | 97.2 | -0.8% |
| sports|kansascity | clg_dp_0.4|total_w_m2 | 107.9 | 106.8 | -1.0% |
| sports|kansascity | htg_99.6|total_w_m2 | 90.7 | 90.5 | -0.2% |
| sports|losangeles | clg_db_0.4|total_w_m2 | 40.9 | 41.2 | +0.7% |
| sports|losangeles | clg_dp_0.4|total_w_m2 | 56.3 | 58.3 | +3.5% |
| sports|losangeles | htg_99.6|total_w_m2 | 29.8 | 29.7 | -0.4% |
| sports|miami | clg_db_0.4|total_w_m2 | 98.6 | 98.4 | -0.2% |
| sports|miami | clg_dp_0.4|total_w_m2 | 105.7 | 105.3 | -0.4% |
| sports|miami | htg_99.6|total_w_m2 | 25.7 | 25.6 | -0.3% |
| sports|newyork | clg_db_0.4|total_w_m2 | 83.1 | 82.4 | -0.9% |
| sports|newyork | clg_dp_0.4|total_w_m2 | 93.1 | 92.6 | -0.5% |
| sports|newyork | htg_99.6|total_w_m2 | 75.0 | 75.0 | -0.1% |
| sports|phoenix | clg_db_0.4|total_w_m2 | 74.4 | 73.9 | -0.6% |
| sports|phoenix | clg_dp_0.4|total_w_m2 | 80.9 | 80.3 | -0.7% |
| sports|phoenix | htg_99.6|total_w_m2 | 38.1 | 38.0 | -0.2% |
| sports|portangeles | clg_db_0.4|total_w_m2 | 39.4 | 38.6 | -1.9% |
| sports|portangeles | clg_dp_0.4|total_w_m2 | 28.8 | 21.0 | -27.1% |
| sports|portangeles | htg_99.6|total_w_m2 | 56.7 | 56.5 | -0.2% |
| sports|rochestermn | clg_db_0.4|total_w_m2 | 84.1 | 84.0 | -0.2% |
| sports|rochestermn | clg_dp_0.4|total_w_m2 | 94.5 | 94.0 | -0.5% |
| sports|rochestermn | htg_99.6|total_w_m2 | 107.3 | 107.1 | -0.2% |
| sports|sandiego | clg_db_0.4|total_w_m2 | 54.3 | 54.3 | +0.0% |
| sports|sandiego | clg_dp_0.4|total_w_m2 | 70.2 | 69.9 | -0.4% |
| sports|sandiego | htg_99.6|total_w_m2 | 29.5 | 29.4 | -0.3% |
| sports|sanfrancisco | clg_db_0.4|total_w_m2 | 35.3 | 35.0 | -0.9% |
| sports|sanfrancisco | clg_dp_0.4|total_w_m2 | 27.8 | 24.6 | -11.5% |
| sports|sanfrancisco | htg_99.6|total_w_m2 | 38.1 | 37.9 | -0.3% |
| sports|seattle | clg_db_0.4|total_w_m2 | 49.1 | 47.8 | -2.6% |
| sports|seattle | clg_dp_0.4|total_w_m2 | 37.9 | 29.8 | -21.2% |
| sports|seattle | htg_99.6|total_w_m2 | 57.2 | 57.1 | -0.2% |
| sports|stlouis | clg_db_0.4|total_w_m2 | 100.5 | 100.0 | -0.4% |
| sports|stlouis | clg_dp_0.4|total_w_m2 | 106.2 | 105.6 | -0.6% |
| sports|stlouis | htg_99.6|total_w_m2 | 86.0 | 86.0 | -0.1% |
| sports|tampa | clg_db_0.4|total_w_m2 | 98.4 | 97.8 | -0.6% |
| sports|tampa | clg_dp_0.4|total_w_m2 | 108.4 | 107.5 | -0.8% |
| sports|tampa | htg_99.6|total_w_m2 | 39.1 | 39.0 | -0.2% |
| sports|tucson | clg_db_0.4|total_w_m2 | 65.2 | 64.1 | -1.8% |
| sports|tucson | clg_dp_0.4|total_w_m2 | 64.5 | 65.2 | +1.1% |
| sports|tucson | htg_99.6|total_w_m2 | 45.6 | 45.5 | -0.2% |
| sports|washington | clg_db_0.4|total_w_m2 | 95.7 | 94.0 | -1.8% |
| sports|washington | clg_dp_0.4|total_w_m2 | 100.8 | 98.7 | -2.0% |
| sports|washington | htg_99.6|total_w_m2 | 69.7 | 69.6 | -0.2% |

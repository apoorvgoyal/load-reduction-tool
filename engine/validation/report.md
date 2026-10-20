# Surrogate validation against EnergyPlus

Generated 2026-10-20T18:58:20+00:00 by `engine/validate.py`. Each model is tested on EnergyPlus runs it was not trained on (independent Latin-hypercube sample, seed 9001, plus the building type default).

Pass rule: worst 95th-percentile absolute error on the peaks the page reports <= 5.0%. Those are the governing cooling peak for each percentile (the larger of the dry-bulb and dew-point days, as EnergyPlus and the model each see it) and the heating peak for each percentile. "Any single day" judges every design day on its own value, including mild days that never govern and can sit near zero; it is shown for information. Peaks are one-hour averages. A peak below 10% of the case's design load (larger of 0.4% cooling and 99.6% heating) is judged as a share of that 10%, not of itself.

| Model | Test runs | Worst P95, reported peaks | Which peak | Cooling 0.4% | Heating 99.6% | Any single day (info) | Result |
|---|---|---|---|---|---|---|---|
| higher_ed|albuquerque | 51 | 5.0% | cooling 0.4% | 5.0% | 0.8% | 9.8% | PASS |
| higher_ed|atlanta | 51 | 2.0% | cooling 2% | 1.8% | 0.6% | 2.4% | PASS |
| higher_ed|boston | 51 | 2.4% | cooling 0.4% | 2.4% | 0.6% | 2.9% | PASS |
| higher_ed|buffalo | 51 | 3.7% | cooling 2% | 3.2% | 0.6% | 3.7% | PASS |
| higher_ed|chicago | 51 | 1.9% | cooling 2% | 1.8% | 0.5% | 2.0% | PASS |
| higher_ed|dallas | 51 | 1.8% | cooling 1% | 1.8% | 0.7% | 2.1% | PASS |
| higher_ed|denver | 51 | 3.8% | cooling 1% | 2.6% | 0.7% | 21.1% | PASS |
| higher_ed|elpaso | 51 | 2.3% | cooling 2% | 2.3% | 0.7% | 3.2% | PASS |
| higher_ed|fairbanks | 51 | 3.4% | cooling 2% | 3.2% | 0.4% | 10.2% | PASS |
| higher_ed|greatfalls | 51 | 3.6% | cooling 1% | 3.5% | 0.8% | 9.5% | PASS |
| higher_ed|honolulu | 51 | 2.9% | cooling 2% | 2.8% | 2.1% | 3.9% | PASS |
| higher_ed|houston | 51 | 2.2% | cooling 2% | 2.0% | 0.6% | 2.8% | PASS |
| higher_ed|intlfalls | 51 | 2.6% | cooling 1% | 2.2% | 0.4% | 3.4% | PASS |
| higher_ed|kansascity | 51 | 2.2% | cooling 2% | 1.8% | 0.6% | 2.4% | PASS |
| higher_ed|losangeles | 51 | 3.4% | cooling 2% | 2.6% | 0.8% | 3.8% | PASS |
| higher_ed|miami | 51 | 1.7% | cooling 2% | 1.7% | 0.9% | 1.9% | PASS |
| higher_ed|newyork | 51 | 2.3% | cooling 0.4% | 2.3% | 0.5% | 2.4% | PASS |
| higher_ed|phoenix | 51 | 2.0% | cooling 0.4% | 2.0% | 0.8% | 2.4% | PASS |
| higher_ed|portangeles | 51 | 5.1% | cooling 2% | 3.7% | 0.6% | 13.6% | **FAIL** |
| higher_ed|rochestermn | 51 | 3.2% | cooling 1% | 2.9% | 0.6% | 3.5% | PASS |
| higher_ed|sandiego | 51 | 2.1% | cooling 0.4% | 2.1% | 0.7% | 2.1% | PASS |
| higher_ed|sanfrancisco | 51 | 4.8% | cooling 2% | 3.6% | 0.6% | 15.2% | PASS |
| higher_ed|seattle | 51 | 3.5% | cooling 2% | 2.6% | 0.6% | 8.8% | PASS |
| higher_ed|stlouis | 51 | 2.4% | cooling 2% | 2.1% | 0.5% | 2.8% | PASS |
| higher_ed|tampa | 51 | 2.3% | cooling 2% | 2.1% | 0.6% | 2.2% | PASS |
| higher_ed|tucson | 51 | 2.8% | cooling 0.4% | 2.8% | 0.7% | 3.1% | PASS |
| higher_ed|washington | 51 | 1.9% | cooling 2% | 1.6% | 0.5% | 2.0% | PASS |

## Type defaults (prediction vs EnergyPlus)

| Model | Output | EnergyPlus W/m² | Surrogate W/m² | Error |
|---|---|---|---|---|
| higher_ed|albuquerque | clg_db_0.4|total_w_m2 | 56.1 | 56.3 | +0.3% |
| higher_ed|albuquerque | clg_dp_0.4|total_w_m2 | 53.8 | 54.1 | +0.7% |
| higher_ed|albuquerque | htg_99.6|total_w_m2 | 40.6 | 40.5 | -0.3% |
| higher_ed|atlanta | clg_db_0.4|total_w_m2 | 78.0 | 77.3 | -0.9% |
| higher_ed|atlanta | clg_dp_0.4|total_w_m2 | 78.1 | 77.5 | -0.8% |
| higher_ed|atlanta | htg_99.6|total_w_m2 | 44.8 | 44.7 | -0.4% |
| higher_ed|boston | clg_db_0.4|total_w_m2 | 76.9 | 75.7 | -1.6% |
| higher_ed|boston | clg_dp_0.4|total_w_m2 | 79.9 | 78.7 | -1.4% |
| higher_ed|boston | htg_99.6|total_w_m2 | 54.9 | 54.9 | -0.1% |
| higher_ed|buffalo | clg_db_0.4|total_w_m2 | 72.0 | 70.5 | -2.2% |
| higher_ed|buffalo | clg_dp_0.4|total_w_m2 | 77.3 | 75.6 | -2.2% |
| higher_ed|buffalo | htg_99.6|total_w_m2 | 58.1 | 58.2 | +0.2% |
| higher_ed|chicago | clg_db_0.4|total_w_m2 | 81.3 | 79.8 | -1.9% |
| higher_ed|chicago | clg_dp_0.4|total_w_m2 | 86.2 | 84.7 | -1.7% |
| higher_ed|chicago | htg_99.6|total_w_m2 | 63.9 | 63.7 | -0.2% |
| higher_ed|dallas | clg_db_0.4|total_w_m2 | 81.0 | 80.4 | -0.6% |
| higher_ed|dallas | clg_dp_0.4|total_w_m2 | 83.2 | 82.4 | -1.0% |
| higher_ed|dallas | htg_99.6|total_w_m2 | 46.9 | 46.8 | -0.2% |
| higher_ed|denver | clg_db_0.4|total_w_m2 | 55.9 | 55.4 | -0.9% |
| higher_ed|denver | clg_dp_0.4|total_w_m2 | 54.0 | 53.7 | -0.5% |
| higher_ed|denver | htg_99.6|total_w_m2 | 51.9 | 51.8 | -0.2% |
| higher_ed|elpaso | clg_db_0.4|total_w_m2 | 60.9 | 61.0 | +0.2% |
| higher_ed|elpaso | clg_dp_0.4|total_w_m2 | 60.4 | 60.9 | +0.8% |
| higher_ed|elpaso | htg_99.6|total_w_m2 | 39.3 | 39.2 | -0.1% |
| higher_ed|fairbanks | clg_db_0.4|total_w_m2 | 53.8 | 53.7 | -0.2% |
| higher_ed|fairbanks | clg_dp_0.4|total_w_m2 | 50.7 | 49.8 | -1.6% |
| higher_ed|fairbanks | htg_99.6|total_w_m2 | 93.2 | 93.4 | +0.2% |
| higher_ed|greatfalls | clg_db_0.4|total_w_m2 | 55.9 | 54.1 | -3.1% |
| higher_ed|greatfalls | clg_dp_0.4|total_w_m2 | 49.6 | 48.4 | -2.4% |
| higher_ed|greatfalls | htg_99.6|total_w_m2 | 67.5 | 67.6 | +0.1% |
| higher_ed|honolulu | clg_db_0.4|total_w_m2 | 75.1 | 74.8 | -0.4% |
| higher_ed|honolulu | clg_dp_0.4|total_w_m2 | 78.9 | 78.6 | -0.4% |
| higher_ed|honolulu | htg_99.6|total_w_m2 | 9.0 | 8.8 | -1.9% |
| higher_ed|houston | clg_db_0.4|total_w_m2 | 84.2 | 84.0 | -0.3% |
| higher_ed|houston | clg_dp_0.4|total_w_m2 | 86.4 | 86.2 | -0.3% |
| higher_ed|houston | htg_99.6|total_w_m2 | 38.8 | 38.6 | -0.4% |
| higher_ed|intlfalls | clg_db_0.4|total_w_m2 | 71.3 | 69.8 | -2.0% |
| higher_ed|intlfalls | clg_dp_0.4|total_w_m2 | 75.0 | 73.3 | -2.2% |
| higher_ed|intlfalls | htg_99.6|total_w_m2 | 79.3 | 79.4 | +0.2% |
| higher_ed|kansascity | clg_db_0.4|total_w_m2 | 86.5 | 85.6 | -1.0% |
| higher_ed|kansascity | clg_dp_0.4|total_w_m2 | 91.1 | 90.4 | -0.8% |
| higher_ed|kansascity | htg_99.6|total_w_m2 | 61.6 | 61.6 | +0.0% |
| higher_ed|losangeles | clg_db_0.4|total_w_m2 | 52.7 | 52.9 | +0.5% |
| higher_ed|losangeles | clg_dp_0.4|total_w_m2 | 60.2 | 59.9 | -0.5% |
| higher_ed|losangeles | htg_99.6|total_w_m2 | 23.8 | 23.7 | -0.5% |
| higher_ed|miami | clg_db_0.4|total_w_m2 | 85.6 | 85.5 | -0.0% |
| higher_ed|miami | clg_dp_0.4|total_w_m2 | 88.8 | 88.7 | -0.1% |
| higher_ed|miami | htg_99.6|total_w_m2 | 21.7 | 21.6 | -0.4% |
| higher_ed|newyork | clg_db_0.4|total_w_m2 | 77.9 | 76.6 | -1.7% |
| higher_ed|newyork | clg_dp_0.4|total_w_m2 | 82.7 | 81.2 | -1.8% |
| higher_ed|newyork | htg_99.6|total_w_m2 | 51.8 | 51.9 | +0.1% |
| higher_ed|phoenix | clg_db_0.4|total_w_m2 | 73.6 | 73.0 | -0.9% |
| higher_ed|phoenix | clg_dp_0.4|total_w_m2 | 74.8 | 74.1 | -1.0% |
| higher_ed|phoenix | htg_99.6|total_w_m2 | 29.5 | 29.5 | -0.2% |
| higher_ed|portangeles | clg_db_0.4|total_w_m2 | 53.6 | 52.4 | -2.3% |
| higher_ed|portangeles | clg_dp_0.4|total_w_m2 | 47.6 | 46.8 | -1.7% |
| higher_ed|portangeles | htg_99.6|total_w_m2 | 39.6 | 39.5 | -0.2% |
| higher_ed|rochestermn | clg_db_0.4|total_w_m2 | 78.0 | 77.7 | -0.4% |
| higher_ed|rochestermn | clg_dp_0.4|total_w_m2 | 83.4 | 83.1 | -0.4% |
| higher_ed|rochestermn | htg_99.6|total_w_m2 | 70.6 | 70.6 | -0.0% |
| higher_ed|sandiego | clg_db_0.4|total_w_m2 | 60.2 | 59.5 | -1.2% |
| higher_ed|sandiego | clg_dp_0.4|total_w_m2 | 68.5 | 67.8 | -1.0% |
| higher_ed|sandiego | htg_99.6|total_w_m2 | 23.7 | 23.6 | -0.4% |
| higher_ed|sanfrancisco | clg_db_0.4|total_w_m2 | 49.3 | 48.2 | -2.2% |
| higher_ed|sanfrancisco | clg_dp_0.4|total_w_m2 | 44.6 | 43.6 | -2.3% |
| higher_ed|sanfrancisco | htg_99.6|total_w_m2 | 29.0 | 28.9 | -0.4% |
| higher_ed|seattle | clg_db_0.4|total_w_m2 | 59.4 | 58.9 | -0.9% |
| higher_ed|seattle | clg_dp_0.4|total_w_m2 | 52.1 | 51.4 | -1.4% |
| higher_ed|seattle | htg_99.6|total_w_m2 | 40.6 | 40.5 | -0.2% |
| higher_ed|stlouis | clg_db_0.4|total_w_m2 | 88.0 | 86.8 | -1.3% |
| higher_ed|stlouis | clg_dp_0.4|total_w_m2 | 90.4 | 89.2 | -1.3% |
| higher_ed|stlouis | htg_99.6|total_w_m2 | 58.7 | 58.9 | +0.2% |
| higher_ed|tampa | clg_db_0.4|total_w_m2 | 85.6 | 85.3 | -0.4% |
| higher_ed|tampa | clg_dp_0.4|total_w_m2 | 90.5 | 90.2 | -0.3% |
| higher_ed|tampa | htg_99.6|total_w_m2 | 30.0 | 29.9 | -0.2% |
| higher_ed|tucson | clg_db_0.4|total_w_m2 | 64.6 | 63.5 | -1.7% |
| higher_ed|tucson | clg_dp_0.4|total_w_m2 | 64.8 | 63.7 | -1.8% |
| higher_ed|tucson | htg_99.6|total_w_m2 | 34.1 | 34.0 | -0.3% |
| higher_ed|washington | clg_db_0.4|total_w_m2 | 85.3 | 84.5 | -0.9% |
| higher_ed|washington | clg_dp_0.4|total_w_m2 | 87.2 | 86.6 | -0.7% |
| higher_ed|washington | htg_99.6|total_w_m2 | 48.4 | 48.3 | -0.3% |

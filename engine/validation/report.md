# Surrogate validation against EnergyPlus

Generated 2026-10-16T19:46:09+00:00 by `engine/validate.py`. Each model is tested on EnergyPlus runs it was not trained on (independent Latin-hypercube sample, seed 9001, plus the building type default).

Pass rule: worst 95th-percentile absolute error across all design-day block totals <= 5.0%.

| Model | Test runs | Worst P95 (block totals) | Worst output | Cooling 0.4%% DB P95 | Heating 99.6%% P95 | Result |
|---|---|---|---|---|---|---|
| retail|albuquerque | 51 | 11.1% | clg_dp_1|total_w_m2 | 5.8% | 0.8% | **FAIL** |
| retail|atlanta | 51 | 2.7% | clg_dp_2|total_w_m2 | 2.0% | 0.5% | PASS |
| retail|boston | 51 | 3.1% | clg_dp_2|total_w_m2 | 2.3% | 0.6% | PASS |
| retail|buffalo | 51 | 3.7% | clg_dp_2|total_w_m2 | 2.8% | 0.5% | PASS |
| retail|chicago | 51 | 2.9% | clg_dp_2|total_w_m2 | 1.9% | 0.6% | PASS |
| retail|dallas | 51 | 2.4% | clg_dp_2|total_w_m2 | 1.9% | 0.6% | PASS |
| retail|denver | 51 | 22.3% | clg_dp_0.4|total_w_m2 | 6.3% | 0.5% | **FAIL** |
| retail|elpaso | 51 | 5.4% | clg_dp_1|total_w_m2 | 3.3% | 0.6% | **FAIL** |
| retail|fairbanks | 51 | 33.2% | clg_dp_0.4|total_w_m2 | 5.1% | 0.3% | **FAIL** |
| retail|greatfalls | 51 | 29.9% | clg_dp_1|total_w_m2 | 7.0% | 0.5% | **FAIL** |
| retail|honolulu | 51 | 18.5% | htg_99|total_w_m2 | 3.1% | 2.3% | **FAIL** |
| retail|houston | 51 | 2.4% | clg_dp_2|total_w_m2 | 2.0% | 0.5% | PASS |
| retail|intlfalls | 51 | 6.5% | clg_dp_2|total_w_m2 | 3.1% | 0.4% | **FAIL** |
| retail|kansascity | 51 | 2.8% | clg_dp_2|total_w_m2 | 2.3% | 0.7% | PASS |
| retail|losangeles | 51 | 4.2% | clg_db_2|total_w_m2 | 4.1% | 0.5% | PASS |
| retail|miami | 51 | 2.6% | clg_dp_2|total_w_m2 | 1.9% | 0.8% | PASS |
| retail|newyork | 51 | 4.1% | clg_dp_2|total_w_m2 | 2.5% | 0.4% | PASS |
| retail|phoenix | 51 | 2.4% | clg_dp_0.4|total_w_m2 | 1.5% | 0.6% | PASS |
| retail|portangeles | 51 | 26.5% | clg_dp_0.4|total_w_m2 | 5.0% | 0.5% | **FAIL** |
| retail|rochestermn | 51 | 5.1% | clg_dp_2|total_w_m2 | 3.3% | 0.7% | **FAIL** |
| retail|sandiego | 51 | 3.8% | clg_dp_2|total_w_m2 | 3.1% | 0.9% | PASS |
| retail|sanfrancisco | 51 | 39.7% | clg_dp_0.4|total_w_m2 | 5.8% | 0.7% | **FAIL** |
| retail|seattle | 51 | 30.2% | clg_dp_2|total_w_m2 | 6.4% | 0.5% | **FAIL** |
| retail|stlouis | 51 | 3.8% | clg_dp_2|total_w_m2 | 2.5% | 0.4% | PASS |
| retail|tampa | 51 | 1.8% | clg_dp_2|total_w_m2 | 1.5% | 0.5% | PASS |
| retail|tucson | 51 | 4.8% | clg_dp_0.4|total_w_m2 | 2.8% | 0.6% | PASS |
| retail|washington | 51 | 2.3% | clg_dp_2|total_w_m2 | 1.5% | 0.4% | PASS |

## Type defaults (prediction vs EnergyPlus)

| Model | Output | EnergyPlus W/m² | Surrogate W/m² | Error |
|---|---|---|---|---|
| retail|albuquerque | clg_db_0.4|total_w_m2 | 50.9 | 50.4 | -1.0% |
| retail|albuquerque | clg_dp_0.4|total_w_m2 | 46.8 | 46.0 | -1.6% |
| retail|albuquerque | htg_99.6|total_w_m2 | 48.3 | 48.3 | -0.1% |
| retail|atlanta | clg_db_0.4|total_w_m2 | 78.5 | 77.8 | -0.9% |
| retail|atlanta | clg_dp_0.4|total_w_m2 | 79.5 | 78.7 | -1.0% |
| retail|atlanta | htg_99.6|total_w_m2 | 53.3 | 53.2 | -0.2% |
| retail|boston | clg_db_0.4|total_w_m2 | 76.2 | 74.4 | -2.3% |
| retail|boston | clg_dp_0.4|total_w_m2 | 80.6 | 78.7 | -2.4% |
| retail|boston | htg_99.6|total_w_m2 | 66.6 | 66.6 | -0.0% |
| retail|buffalo | clg_db_0.4|total_w_m2 | 70.0 | 69.2 | -1.2% |
| retail|buffalo | clg_dp_0.4|total_w_m2 | 77.4 | 76.3 | -1.5% |
| retail|buffalo | htg_99.6|total_w_m2 | 70.5 | 70.4 | -0.1% |
| retail|chicago | clg_db_0.4|total_w_m2 | 82.0 | 80.6 | -1.8% |
| retail|chicago | clg_dp_0.4|total_w_m2 | 89.0 | 87.4 | -1.8% |
| retail|chicago | htg_99.6|total_w_m2 | 77.8 | 77.8 | +0.0% |
| retail|dallas | clg_db_0.4|total_w_m2 | 81.6 | 80.5 | -1.4% |
| retail|dallas | clg_dp_0.4|total_w_m2 | 85.9 | 84.5 | -1.6% |
| retail|dallas | htg_99.6|total_w_m2 | 55.5 | 55.6 | +0.2% |
| retail|denver | clg_db_0.4|total_w_m2 | 50.1 | 49.9 | -0.3% |
| retail|denver | clg_dp_0.4|total_w_m2 | 47.0 | 45.6 | -2.9% |
| retail|denver | htg_99.6|total_w_m2 | 62.7 | 62.6 | -0.1% |
| retail|elpaso | clg_db_0.4|total_w_m2 | 55.6 | 54.7 | -1.6% |
| retail|elpaso | clg_dp_0.4|total_w_m2 | 56.3 | 55.5 | -1.5% |
| retail|elpaso | htg_99.6|total_w_m2 | 46.5 | 46.3 | -0.3% |
| retail|fairbanks | clg_db_0.4|total_w_m2 | 44.7 | 44.8 | +0.3% |
| retail|fairbanks | clg_dp_0.4|total_w_m2 | 41.0 | 40.4 | -1.4% |
| retail|fairbanks | htg_99.6|total_w_m2 | 115.9 | 116.0 | +0.1% |
| retail|greatfalls | clg_db_0.4|total_w_m2 | 49.4 | 48.2 | -2.4% |
| retail|greatfalls | clg_dp_0.4|total_w_m2 | 40.8 | 38.2 | -6.5% |
| retail|greatfalls | htg_99.6|total_w_m2 | 82.6 | 82.8 | +0.2% |
| retail|honolulu | clg_db_0.4|total_w_m2 | 74.8 | 74.4 | -0.4% |
| retail|honolulu | clg_dp_0.4|total_w_m2 | 80.5 | 79.8 | -0.8% |
| retail|honolulu | htg_99.6|total_w_m2 | 8.9 | 8.7 | -1.6% |
| retail|houston | clg_db_0.4|total_w_m2 | 86.5 | 85.6 | -1.0% |
| retail|houston | clg_dp_0.4|total_w_m2 | 90.4 | 89.6 | -0.8% |
| retail|houston | htg_99.6|total_w_m2 | 45.6 | 45.6 | -0.1% |
| retail|intlfalls | clg_db_0.4|total_w_m2 | 68.5 | 66.5 | -2.9% |
| retail|intlfalls | clg_dp_0.4|total_w_m2 | 73.8 | 71.2 | -3.5% |
| retail|intlfalls | htg_99.6|total_w_m2 | 97.8 | 97.8 | -0.0% |
| retail|kansascity | clg_db_0.4|total_w_m2 | 88.7 | 87.2 | -1.7% |
| retail|kansascity | clg_dp_0.4|total_w_m2 | 95.5 | 94.1 | -1.5% |
| retail|kansascity | htg_99.6|total_w_m2 | 74.5 | 74.4 | -0.0% |
| retail|losangeles | clg_db_0.4|total_w_m2 | 45.3 | 44.8 | -1.1% |
| retail|losangeles | clg_dp_0.4|total_w_m2 | 55.9 | 55.0 | -1.6% |
| retail|losangeles | htg_99.6|total_w_m2 | 27.4 | 27.4 | -0.1% |
| retail|miami | clg_db_0.4|total_w_m2 | 88.3 | 88.3 | +0.0% |
| retail|miami | clg_dp_0.4|total_w_m2 | 93.1 | 93.0 | -0.1% |
| retail|miami | htg_99.6|total_w_m2 | 24.5 | 24.4 | -0.3% |
| retail|newyork | clg_db_0.4|total_w_m2 | 77.5 | 76.5 | -1.3% |
| retail|newyork | clg_dp_0.4|total_w_m2 | 84.4 | 83.0 | -1.6% |
| retail|newyork | htg_99.6|total_w_m2 | 62.4 | 62.3 | -0.1% |
| retail|phoenix | clg_db_0.4|total_w_m2 | 71.1 | 70.7 | -0.6% |
| retail|phoenix | clg_dp_0.4|total_w_m2 | 74.9 | 74.5 | -0.6% |
| retail|phoenix | htg_99.6|total_w_m2 | 34.1 | 34.1 | -0.2% |
| retail|portangeles | clg_db_0.4|total_w_m2 | 45.3 | 44.2 | -2.5% |
| retail|portangeles | clg_dp_0.4|total_w_m2 | 37.7 | 35.9 | -4.7% |
| retail|portangeles | htg_99.6|total_w_m2 | 47.6 | 47.6 | -0.0% |
| retail|rochestermn | clg_db_0.4|total_w_m2 | 78.0 | 77.0 | -1.3% |
| retail|rochestermn | clg_dp_0.4|total_w_m2 | 85.5 | 84.6 | -1.0% |
| retail|rochestermn | htg_99.6|total_w_m2 | 86.5 | 86.3 | -0.2% |
| retail|sandiego | clg_db_0.4|total_w_m2 | 55.2 | 54.6 | -1.1% |
| retail|sandiego | clg_dp_0.4|total_w_m2 | 66.6 | 65.9 | -1.1% |
| retail|sandiego | htg_99.6|total_w_m2 | 27.2 | 27.1 | -0.4% |
| retail|sanfrancisco | clg_db_0.4|total_w_m2 | 41.1 | 40.4 | -1.7% |
| retail|sanfrancisco | clg_dp_0.4|total_w_m2 | 35.3 | 34.4 | -2.5% |
| retail|sanfrancisco | htg_99.6|total_w_m2 | 33.8 | 33.7 | -0.3% |
| retail|seattle | clg_db_0.4|total_w_m2 | 52.8 | 52.3 | -0.9% |
| retail|seattle | clg_dp_0.4|total_w_m2 | 43.8 | 44.3 | +1.1% |
| retail|seattle | htg_99.6|total_w_m2 | 48.4 | 48.4 | -0.1% |
| retail|stlouis | clg_db_0.4|total_w_m2 | 90.6 | 89.0 | -1.8% |
| retail|stlouis | clg_dp_0.4|total_w_m2 | 94.4 | 92.6 | -1.9% |
| retail|stlouis | htg_99.6|total_w_m2 | 70.9 | 70.8 | -0.1% |
| retail|tampa | clg_db_0.4|total_w_m2 | 88.4 | 87.5 | -1.0% |
| retail|tampa | clg_dp_0.4|total_w_m2 | 95.4 | 94.1 | -1.3% |
| retail|tampa | htg_99.6|total_w_m2 | 34.8 | 34.7 | -0.4% |
| retail|tucson | clg_db_0.4|total_w_m2 | 61.6 | 60.3 | -2.2% |
| retail|tucson | clg_dp_0.4|total_w_m2 | 62.2 | 61.1 | -1.7% |
| retail|tucson | htg_99.6|total_w_m2 | 39.8 | 39.8 | -0.2% |
| retail|washington | clg_db_0.4|total_w_m2 | 87.0 | 86.0 | -1.2% |
| retail|washington | clg_dp_0.4|total_w_m2 | 90.3 | 89.4 | -0.9% |
| retail|washington | htg_99.6|total_w_m2 | 58.2 | 58.1 | -0.2% |

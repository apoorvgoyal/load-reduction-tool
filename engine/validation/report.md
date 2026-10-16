# Surrogate validation against EnergyPlus

Generated 2026-10-16T19:54:14+00:00 by `engine/validate.py`. Each model is tested on EnergyPlus runs it was not trained on (independent Latin-hypercube sample, seed 9001, plus the building type default).

Pass rule: worst 95th-percentile absolute error across all design-day block totals <= 5.0%.

| Model | Test runs | Worst P95 (block totals) | Worst output | Cooling 0.4%% DB P95 | Heating 99.6%% P95 | Result |
|---|---|---|---|---|---|---|
| higher_ed|albuquerque | 51 | 10.5% | clg_dp_0.4|total_w_m2 | 4.3% | 0.8% | **FAIL** |
| higher_ed|atlanta | 51 | 2.6% | clg_dp_2|total_w_m2 | 1.9% | 0.8% | PASS |
| higher_ed|boston | 51 | 3.1% | clg_db_2|total_w_m2 | 2.3% | 0.6% | PASS |
| higher_ed|buffalo | 51 | 3.6% | clg_dp_2|total_w_m2 | 3.1% | 0.6% | PASS |
| higher_ed|chicago | 51 | 2.0% | clg_db_1|total_w_m2 | 1.9% | 0.5% | PASS |
| higher_ed|dallas | 51 | 2.2% | clg_dp_2|total_w_m2 | 1.9% | 0.9% | PASS |
| higher_ed|denver | 51 | 20.7% | clg_dp_2|total_w_m2 | 2.6% | 0.6% | **FAIL** |
| higher_ed|elpaso | 51 | 3.3% | clg_dp_2|total_w_m2 | 2.6% | 0.6% | PASS |
| higher_ed|fairbanks | 51 | 10.1% | clg_dp_2|total_w_m2 | 3.2% | 0.4% | **FAIL** |
| higher_ed|greatfalls | 51 | 9.1% | clg_dp_0.4|total_w_m2 | 3.6% | 0.8% | **FAIL** |
| higher_ed|honolulu | 51 | 3.8% | htg_99|total_w_m2 | 2.9% | 2.4% | PASS |
| higher_ed|houston | 51 | 2.7% | clg_dp_1|total_w_m2 | 2.2% | 0.5% | PASS |
| higher_ed|intlfalls | 51 | 3.6% | clg_dp_2|total_w_m2 | 2.1% | 0.4% | PASS |
| higher_ed|kansascity | 51 | 2.5% | clg_dp_2|total_w_m2 | 1.9% | 0.6% | PASS |
| higher_ed|losangeles | 51 | 3.8% | clg_dp_2|total_w_m2 | 3.1% | 0.8% | PASS |
| higher_ed|miami | 51 | 2.8% | clg_dp_2|total_w_m2 | 2.1% | 1.1% | PASS |
| higher_ed|newyork | 51 | 2.5% | clg_db_2|total_w_m2 | 2.1% | 0.5% | PASS |
| higher_ed|phoenix | 51 | 2.4% | clg_dp_2|total_w_m2 | 2.0% | 0.8% | PASS |
| higher_ed|portangeles | 51 | 13.2% | clg_dp_2|total_w_m2 | 3.6% | 0.6% | **FAIL** |
| higher_ed|rochestermn | 51 | 3.6% | clg_dp_2|total_w_m2 | 3.4% | 0.6% | PASS |
| higher_ed|sandiego | 51 | 3.9% | clg_dp_0.4|total_w_m2 | 2.2% | 0.6% | PASS |
| higher_ed|sanfrancisco | 51 | 15.8% | clg_dp_2|total_w_m2 | 3.8% | 0.6% | **FAIL** |
| higher_ed|seattle | 51 | 8.4% | clg_dp_0.4|total_w_m2 | 2.6% | 0.6% | **FAIL** |
| higher_ed|stlouis | 51 | 3.0% | clg_dp_2|total_w_m2 | 2.3% | 0.5% | PASS |
| higher_ed|tampa | 51 | 2.6% | clg_db_2|total_w_m2 | 2.2% | 0.7% | PASS |
| higher_ed|tucson | 51 | 3.1% | clg_dp_1|total_w_m2 | 2.6% | 0.7% | PASS |
| higher_ed|washington | 51 | 2.1% | clg_dp_2|total_w_m2 | 1.5% | 0.5% | PASS |

## Type defaults (prediction vs EnergyPlus)

| Model | Output | EnergyPlus W/m² | Surrogate W/m² | Error |
|---|---|---|---|---|
| higher_ed|albuquerque | clg_db_0.4|total_w_m2 | 56.2 | 56.5 | +0.5% |
| higher_ed|albuquerque | clg_dp_0.4|total_w_m2 | 53.8 | 54.3 | +0.8% |
| higher_ed|albuquerque | htg_99.6|total_w_m2 | 40.6 | 40.5 | -0.3% |
| higher_ed|atlanta | clg_db_0.4|total_w_m2 | 78.1 | 77.4 | -1.0% |
| higher_ed|atlanta | clg_dp_0.4|total_w_m2 | 78.2 | 77.4 | -1.1% |
| higher_ed|atlanta | htg_99.6|total_w_m2 | 44.8 | 44.6 | -0.5% |
| higher_ed|boston | clg_db_0.4|total_w_m2 | 77.0 | 75.8 | -1.6% |
| higher_ed|boston | clg_dp_0.4|total_w_m2 | 80.0 | 78.5 | -1.9% |
| higher_ed|boston | htg_99.6|total_w_m2 | 54.9 | 54.9 | -0.1% |
| higher_ed|buffalo | clg_db_0.4|total_w_m2 | 72.2 | 70.5 | -2.3% |
| higher_ed|buffalo | clg_dp_0.4|total_w_m2 | 77.5 | 75.7 | -2.3% |
| higher_ed|buffalo | htg_99.6|total_w_m2 | 58.1 | 58.2 | +0.2% |
| higher_ed|chicago | clg_db_0.4|total_w_m2 | 81.4 | 79.7 | -2.2% |
| higher_ed|chicago | clg_dp_0.4|total_w_m2 | 86.3 | 84.8 | -1.8% |
| higher_ed|chicago | htg_99.6|total_w_m2 | 63.9 | 63.7 | -0.2% |
| higher_ed|dallas | clg_db_0.4|total_w_m2 | 81.1 | 80.3 | -1.0% |
| higher_ed|dallas | clg_dp_0.4|total_w_m2 | 83.3 | 82.5 | -1.1% |
| higher_ed|dallas | htg_99.6|total_w_m2 | 46.9 | 46.8 | -0.1% |
| higher_ed|denver | clg_db_0.4|total_w_m2 | 56.1 | 55.4 | -1.2% |
| higher_ed|denver | clg_dp_0.4|total_w_m2 | 54.1 | 53.8 | -0.7% |
| higher_ed|denver | htg_99.6|total_w_m2 | 51.9 | 51.9 | -0.1% |
| higher_ed|elpaso | clg_db_0.4|total_w_m2 | 61.1 | 61.1 | +0.1% |
| higher_ed|elpaso | clg_dp_0.4|total_w_m2 | 60.5 | 61.0 | +0.8% |
| higher_ed|elpaso | htg_99.6|total_w_m2 | 39.3 | 39.2 | -0.1% |
| higher_ed|fairbanks | clg_db_0.4|total_w_m2 | 53.9 | 53.7 | -0.3% |
| higher_ed|fairbanks | clg_dp_0.4|total_w_m2 | 50.7 | 49.8 | -1.7% |
| higher_ed|fairbanks | htg_99.6|total_w_m2 | 93.2 | 93.4 | +0.2% |
| higher_ed|greatfalls | clg_db_0.4|total_w_m2 | 56.0 | 54.2 | -3.2% |
| higher_ed|greatfalls | clg_dp_0.4|total_w_m2 | 49.7 | 48.4 | -2.7% |
| higher_ed|greatfalls | htg_99.6|total_w_m2 | 67.5 | 67.6 | +0.1% |
| higher_ed|honolulu | clg_db_0.4|total_w_m2 | 75.1 | 74.6 | -0.8% |
| higher_ed|honolulu | clg_dp_0.4|total_w_m2 | 78.9 | 78.4 | -0.7% |
| higher_ed|honolulu | htg_99.6|total_w_m2 | 9.0 | 8.9 | -1.6% |
| higher_ed|houston | clg_db_0.4|total_w_m2 | 84.4 | 84.0 | -0.4% |
| higher_ed|houston | clg_dp_0.4|total_w_m2 | 86.6 | 86.2 | -0.4% |
| higher_ed|houston | htg_99.6|total_w_m2 | 38.8 | 38.7 | -0.3% |
| higher_ed|intlfalls | clg_db_0.4|total_w_m2 | 71.4 | 69.9 | -2.2% |
| higher_ed|intlfalls | clg_dp_0.4|total_w_m2 | 75.2 | 73.4 | -2.3% |
| higher_ed|intlfalls | htg_99.6|total_w_m2 | 79.3 | 79.4 | +0.2% |
| higher_ed|kansascity | clg_db_0.4|total_w_m2 | 86.6 | 85.6 | -1.1% |
| higher_ed|kansascity | clg_dp_0.4|total_w_m2 | 91.2 | 90.5 | -0.8% |
| higher_ed|kansascity | htg_99.6|total_w_m2 | 61.6 | 61.6 | -0.0% |
| higher_ed|losangeles | clg_db_0.4|total_w_m2 | 52.8 | 53.0 | +0.4% |
| higher_ed|losangeles | clg_dp_0.4|total_w_m2 | 60.3 | 59.9 | -0.7% |
| higher_ed|losangeles | htg_99.6|total_w_m2 | 23.8 | 23.7 | -0.5% |
| higher_ed|miami | clg_db_0.4|total_w_m2 | 85.6 | 85.3 | -0.3% |
| higher_ed|miami | clg_dp_0.4|total_w_m2 | 88.8 | 88.0 | -0.9% |
| higher_ed|miami | htg_99.6|total_w_m2 | 21.7 | 21.6 | -0.5% |
| higher_ed|newyork | clg_db_0.4|total_w_m2 | 78.0 | 76.7 | -1.7% |
| higher_ed|newyork | clg_dp_0.4|total_w_m2 | 82.8 | 81.2 | -2.0% |
| higher_ed|newyork | htg_99.6|total_w_m2 | 51.9 | 51.9 | +0.1% |
| higher_ed|phoenix | clg_db_0.4|total_w_m2 | 73.8 | 73.1 | -1.0% |
| higher_ed|phoenix | clg_dp_0.4|total_w_m2 | 75.0 | 74.2 | -1.0% |
| higher_ed|phoenix | htg_99.6|total_w_m2 | 29.5 | 29.5 | -0.3% |
| higher_ed|portangeles | clg_db_0.4|total_w_m2 | 53.7 | 52.4 | -2.4% |
| higher_ed|portangeles | clg_dp_0.4|total_w_m2 | 47.7 | 47.0 | -1.4% |
| higher_ed|portangeles | htg_99.6|total_w_m2 | 39.6 | 39.5 | -0.3% |
| higher_ed|rochestermn | clg_db_0.4|total_w_m2 | 78.1 | 77.9 | -0.2% |
| higher_ed|rochestermn | clg_dp_0.4|total_w_m2 | 83.5 | 83.2 | -0.4% |
| higher_ed|rochestermn | htg_99.6|total_w_m2 | 70.6 | 70.6 | -0.0% |
| higher_ed|sandiego | clg_db_0.4|total_w_m2 | 60.3 | 59.5 | -1.2% |
| higher_ed|sandiego | clg_dp_0.4|total_w_m2 | 68.6 | 67.9 | -0.9% |
| higher_ed|sandiego | htg_99.6|total_w_m2 | 23.7 | 23.6 | -0.4% |
| higher_ed|sanfrancisco | clg_db_0.4|total_w_m2 | 49.4 | 48.2 | -2.3% |
| higher_ed|sanfrancisco | clg_dp_0.4|total_w_m2 | 44.7 | 43.5 | -2.6% |
| higher_ed|sanfrancisco | htg_99.6|total_w_m2 | 29.0 | 28.9 | -0.4% |
| higher_ed|seattle | clg_db_0.4|total_w_m2 | 59.6 | 59.0 | -0.9% |
| higher_ed|seattle | clg_dp_0.4|total_w_m2 | 52.2 | 51.4 | -1.5% |
| higher_ed|seattle | htg_99.6|total_w_m2 | 40.6 | 40.5 | -0.2% |
| higher_ed|stlouis | clg_db_0.4|total_w_m2 | 88.2 | 86.9 | -1.4% |
| higher_ed|stlouis | clg_dp_0.4|total_w_m2 | 90.5 | 89.1 | -1.5% |
| higher_ed|stlouis | htg_99.6|total_w_m2 | 58.7 | 58.9 | +0.2% |
| higher_ed|tampa | clg_db_0.4|total_w_m2 | 85.7 | 84.9 | -0.9% |
| higher_ed|tampa | clg_dp_0.4|total_w_m2 | 90.6 | 90.2 | -0.4% |
| higher_ed|tampa | htg_99.6|total_w_m2 | 30.0 | 29.9 | -0.3% |
| higher_ed|tucson | clg_db_0.4|total_w_m2 | 64.7 | 63.6 | -1.7% |
| higher_ed|tucson | clg_dp_0.4|total_w_m2 | 65.0 | 63.8 | -1.8% |
| higher_ed|tucson | htg_99.6|total_w_m2 | 34.1 | 34.0 | -0.2% |
| higher_ed|washington | clg_db_0.4|total_w_m2 | 85.4 | 84.6 | -1.0% |
| higher_ed|washington | clg_dp_0.4|total_w_m2 | 87.3 | 86.6 | -0.8% |
| higher_ed|washington | htg_99.6|total_w_m2 | 48.4 | 48.3 | -0.3% |

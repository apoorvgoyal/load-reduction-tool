# Surrogate validation against EnergyPlus

Generated 2026-10-16T19:42:07+00:00 by `engine/validate.py`. Each model is tested on EnergyPlus runs it was not trained on (independent Latin-hypercube sample, seed 9001, plus the building type default).

Pass rule: worst 95th-percentile absolute error across all design-day block totals <= 5.0%.

| Model | Test runs | Worst P95 (block totals) | Worst output | Cooling 0.4%% DB P95 | Heating 99.6%% P95 | Result |
|---|---|---|---|---|---|---|
| sports|albuquerque | 51 | 77.3% | clg_dp_0.4|total_w_m2 | 4.5% | 0.6% | **FAIL** |
| sports|atlanta | 51 | 6.7% | clg_dp_0.4|total_w_m2 | 2.3% | 0.4% | **FAIL** |
| sports|boston | 51 | 6.9% | clg_dp_0.4|total_w_m2 | 2.4% | 0.4% | **FAIL** |
| sports|buffalo | 51 | 10.6% | clg_dp_2|total_w_m2 | 2.3% | 0.3% | **FAIL** |
| sports|chicago | 51 | 6.1% | clg_dp_2|total_w_m2 | 2.9% | 0.4% | **FAIL** |
| sports|dallas | 51 | 6.2% | clg_dp_2|total_w_m2 | 1.9% | 0.4% | **FAIL** |
| sports|denver | 51 | 134.6% | clg_dp_2|total_w_m2 | 5.3% | 0.5% | **FAIL** |
| sports|elpaso | 51 | 32.7% | clg_dp_0.4|total_w_m2 | 2.0% | 0.5% | **FAIL** |
| sports|fairbanks | 51 | 149.0% | clg_dp_0.4|total_w_m2 | 6.3% | 0.3% | **FAIL** |
| sports|greatfalls | 51 | 181.2% | clg_dp_0.4|total_w_m2 | 3.6% | 0.4% | **FAIL** |
| sports|honolulu | 51 | 67.8% | htg_99|total_w_m2 | 2.2% | 35.2% | **FAIL** |
| sports|houston | 51 | 4.2% | clg_dp_2|total_w_m2 | 1.5% | 0.5% | PASS |
| sports|intlfalls | 51 | 35.4% | clg_dp_2|total_w_m2 | 2.6% | 0.4% | **FAIL** |
| sports|kansascity | 51 | 3.1% | clg_dp_1|total_w_m2 | 1.9% | 0.5% | PASS |
| sports|losangeles | 51 | 66.9% | clg_dp_2|total_w_m2 | 4.4% | 0.6% | **FAIL** |
| sports|miami | 51 | 3.2% | clg_dp_2|total_w_m2 | 2.1% | 0.5% | PASS |
| sports|newyork | 51 | 8.3% | clg_dp_2|total_w_m2 | 1.6% | 0.4% | **FAIL** |
| sports|phoenix | 51 | 3.5% | clg_dp_0.4|total_w_m2 | 1.8% | 0.6% | PASS |
| sports|portangeles | 51 | 123.9% | clg_dp_0.4|total_w_m2 | 4.2% | 0.3% | **FAIL** |
| sports|rochestermn | 51 | 8.2% | clg_dp_2|total_w_m2 | 2.1% | 0.5% | **FAIL** |
| sports|sandiego | 51 | 14.8% | clg_dp_2|total_w_m2 | 3.0% | 0.6% | **FAIL** |
| sports|sanfrancisco | 51 | 170.4% | clg_dp_0.4|total_w_m2 | 5.8% | 0.6% | **FAIL** |
| sports|seattle | 51 | 54.5% | clg_dp_1|total_w_m2 | 4.4% | 0.4% | **FAIL** |
| sports|stlouis | 51 | 8.3% | clg_dp_2|total_w_m2 | 1.8% | 0.3% | **FAIL** |
| sports|tampa | 51 | 2.6% | clg_dp_2|total_w_m2 | 1.9% | 0.8% | PASS |
| sports|tucson | 51 | 25.8% | clg_dp_0.4|total_w_m2 | 2.8% | 0.5% | **FAIL** |
| sports|washington | 51 | 5.3% | clg_dp_2|total_w_m2 | 2.3% | 0.4% | **FAIL** |

## Type defaults (prediction vs EnergyPlus)

| Model | Output | EnergyPlus W/m² | Surrogate W/m² | Error |
|---|---|---|---|---|
| sports|albuquerque | clg_db_0.4|total_w_m2 | 51.2 | 50.0 | -2.2% |
| sports|albuquerque | clg_dp_0.4|total_w_m2 | 42.4 | 40.0 | -5.6% |
| sports|albuquerque | htg_99.6|total_w_m2 | 57.3 | 57.3 | -0.0% |
| sports|atlanta | clg_db_0.4|total_w_m2 | 85.4 | 84.7 | -0.9% |
| sports|atlanta | clg_dp_0.4|total_w_m2 | 87.6 | 86.5 | -1.2% |
| sports|atlanta | htg_99.6|total_w_m2 | 62.9 | 62.8 | -0.1% |
| sports|boston | clg_db_0.4|total_w_m2 | 81.6 | 80.6 | -1.3% |
| sports|boston | clg_dp_0.4|total_w_m2 | 88.1 | 86.6 | -1.7% |
| sports|boston | htg_99.6|total_w_m2 | 81.1 | 81.0 | -0.1% |
| sports|buffalo | clg_db_0.4|total_w_m2 | 73.3 | 72.2 | -1.5% |
| sports|buffalo | clg_dp_0.4|total_w_m2 | 83.8 | 82.2 | -1.9% |
| sports|buffalo | htg_99.6|total_w_m2 | 86.1 | 86.0 | -0.2% |
| sports|chicago | clg_db_0.4|total_w_m2 | 89.4 | 88.0 | -1.6% |
| sports|chicago | clg_dp_0.4|total_w_m2 | 99.2 | 97.6 | -1.6% |
| sports|chicago | htg_99.6|total_w_m2 | 95.5 | 95.5 | -0.0% |
| sports|dallas | clg_db_0.4|total_w_m2 | 88.6 | 88.2 | -0.4% |
| sports|dallas | clg_dp_0.4|total_w_m2 | 95.9 | 96.4 | +0.5% |
| sports|dallas | htg_99.6|total_w_m2 | 65.3 | 65.4 | +0.1% |
| sports|denver | clg_db_0.4|total_w_m2 | 50.2 | 49.2 | -1.9% |
| sports|denver | clg_dp_0.4|total_w_m2 | 42.3 | 31.4 | -25.6% |
| sports|denver | htg_99.6|total_w_m2 | 76.3 | 76.2 | -0.0% |
| sports|elpaso | clg_db_0.4|total_w_m2 | 56.5 | 55.9 | -1.1% |
| sports|elpaso | clg_dp_0.4|total_w_m2 | 56.8 | 60.6 | +6.6% |
| sports|elpaso | htg_99.6|total_w_m2 | 54.5 | 54.4 | -0.3% |
| sports|fairbanks | clg_db_0.4|total_w_m2 | 40.6 | 40.2 | -1.0% |
| sports|fairbanks | clg_dp_0.4|total_w_m2 | 32.9 | 26.5 | -19.4% |
| sports|fairbanks | htg_99.6|total_w_m2 | 146.5 | 146.8 | +0.2% |
| sports|greatfalls | clg_db_0.4|total_w_m2 | 49.0 | 47.7 | -2.7% |
| sports|greatfalls | clg_dp_0.4|total_w_m2 | 33.1 | 27.6 | -16.8% |
| sports|greatfalls | htg_99.6|total_w_m2 | 102.4 | 102.3 | -0.1% |
| sports|honolulu | clg_db_0.4|total_w_m2 | 80.7 | 81.0 | +0.4% |
| sports|honolulu | clg_dp_0.4|total_w_m2 | 89.0 | 89.0 | -0.0% |
| sports|honolulu | htg_99.6|total_w_m2 | 5.7 | 5.3 | -7.7% |
| sports|houston | clg_db_0.4|total_w_m2 | 95.9 | 95.2 | -0.7% |
| sports|houston | clg_dp_0.4|total_w_m2 | 102.2 | 101.5 | -0.7% |
| sports|houston | htg_99.6|total_w_m2 | 52.8 | 52.7 | -0.3% |
| sports|intlfalls | clg_db_0.4|total_w_m2 | 70.7 | 69.5 | -1.7% |
| sports|intlfalls | clg_dp_0.4|total_w_m2 | 78.4 | 76.1 | -2.9% |
| sports|intlfalls | htg_99.6|total_w_m2 | 122.4 | 122.3 | -0.1% |
| sports|kansascity | clg_db_0.4|total_w_m2 | 98.2 | 97.3 | -0.9% |
| sports|kansascity | clg_dp_0.4|total_w_m2 | 108.1 | 106.9 | -1.1% |
| sports|kansascity | htg_99.6|total_w_m2 | 90.7 | 90.6 | -0.1% |
| sports|losangeles | clg_db_0.4|total_w_m2 | 41.0 | 41.2 | +0.6% |
| sports|losangeles | clg_dp_0.4|total_w_m2 | 56.4 | 57.7 | +2.2% |
| sports|losangeles | htg_99.6|total_w_m2 | 29.8 | 29.7 | -0.4% |
| sports|miami | clg_db_0.4|total_w_m2 | 98.7 | 98.5 | -0.2% |
| sports|miami | clg_dp_0.4|total_w_m2 | 105.8 | 105.4 | -0.4% |
| sports|miami | htg_99.6|total_w_m2 | 25.7 | 25.6 | -0.3% |
| sports|newyork | clg_db_0.4|total_w_m2 | 83.2 | 82.4 | -1.0% |
| sports|newyork | clg_dp_0.4|total_w_m2 | 93.2 | 91.1 | -2.3% |
| sports|newyork | htg_99.6|total_w_m2 | 75.0 | 75.0 | -0.1% |
| sports|phoenix | clg_db_0.4|total_w_m2 | 74.6 | 74.1 | -0.7% |
| sports|phoenix | clg_dp_0.4|total_w_m2 | 81.2 | 81.2 | -0.0% |
| sports|phoenix | htg_99.6|total_w_m2 | 38.1 | 38.0 | -0.2% |
| sports|portangeles | clg_db_0.4|total_w_m2 | 39.6 | 38.7 | -2.1% |
| sports|portangeles | clg_dp_0.4|total_w_m2 | 29.0 | 21.0 | -27.6% |
| sports|portangeles | htg_99.6|total_w_m2 | 56.7 | 56.6 | -0.1% |
| sports|rochestermn | clg_db_0.4|total_w_m2 | 84.3 | 84.1 | -0.2% |
| sports|rochestermn | clg_dp_0.4|total_w_m2 | 94.7 | 93.6 | -1.1% |
| sports|rochestermn | htg_99.6|total_w_m2 | 107.3 | 107.1 | -0.2% |
| sports|sandiego | clg_db_0.4|total_w_m2 | 54.4 | 54.4 | +0.0% |
| sports|sandiego | clg_dp_0.4|total_w_m2 | 70.3 | 69.6 | -1.0% |
| sports|sandiego | htg_99.6|total_w_m2 | 29.5 | 29.4 | -0.3% |
| sports|sanfrancisco | clg_db_0.4|total_w_m2 | 35.4 | 35.2 | -0.6% |
| sports|sanfrancisco | clg_dp_0.4|total_w_m2 | 28.0 | 25.4 | -9.3% |
| sports|sanfrancisco | htg_99.6|total_w_m2 | 38.1 | 37.9 | -0.3% |
| sports|seattle | clg_db_0.4|total_w_m2 | 49.3 | 47.9 | -2.8% |
| sports|seattle | clg_dp_0.4|total_w_m2 | 38.4 | 29.7 | -22.5% |
| sports|seattle | htg_99.6|total_w_m2 | 57.2 | 57.1 | -0.2% |
| sports|stlouis | clg_db_0.4|total_w_m2 | 100.6 | 100.2 | -0.4% |
| sports|stlouis | clg_dp_0.4|total_w_m2 | 106.4 | 105.7 | -0.6% |
| sports|stlouis | htg_99.6|total_w_m2 | 86.0 | 86.0 | -0.1% |
| sports|tampa | clg_db_0.4|total_w_m2 | 98.6 | 98.0 | -0.6% |
| sports|tampa | clg_dp_0.4|total_w_m2 | 108.6 | 107.6 | -0.9% |
| sports|tampa | htg_99.6|total_w_m2 | 39.1 | 38.9 | -0.4% |
| sports|tucson | clg_db_0.4|total_w_m2 | 65.4 | 64.3 | -1.8% |
| sports|tucson | clg_dp_0.4|total_w_m2 | 64.7 | 64.7 | -0.1% |
| sports|tucson | htg_99.6|total_w_m2 | 45.6 | 45.6 | -0.2% |
| sports|washington | clg_db_0.4|total_w_m2 | 95.9 | 94.1 | -1.9% |
| sports|washington | clg_dp_0.4|total_w_m2 | 100.9 | 97.4 | -3.6% |
| sports|washington | htg_99.6|total_w_m2 | 69.7 | 69.6 | -0.2% |

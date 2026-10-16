# Surrogate validation against EnergyPlus

Generated 2026-10-16T18:57:45+00:00 by `engine/validate.py`. Each model is tested on EnergyPlus runs it was not trained on (independent Latin-hypercube sample, seed 9001, plus the building type default).

Pass rule: worst 95th-percentile absolute error across all design-day block totals <= 5.0%.

| Model | Test runs | Worst P95 (block totals) | Worst output | Cooling 0.4%% DB P95 | Heating 99.6%% P95 | Result |
|---|---|---|---|---|---|---|
| hotel|albuquerque | 51 | 8.7% | clg_dp_0.4|total_w_m2 | 4.0% | 0.7% | **FAIL** |
| hotel|atlanta | 51 | 2.6% | clg_dp_2|total_w_m2 | 2.0% | 0.6% | PASS |
| hotel|boston | 51 | 3.5% | clg_dp_2|total_w_m2 | 2.8% | 0.7% | PASS |
| hotel|buffalo | 51 | 3.2% | clg_dp_2|total_w_m2 | 1.9% | 0.8% | PASS |
| hotel|chicago | 51 | 2.6% | clg_dp_1|total_w_m2 | 2.2% | 0.8% | PASS |
| hotel|dallas | 51 | 3.1% | clg_dp_2|total_w_m2 | 2.8% | 0.7% | PASS |
| hotel|denver | 51 | 13.7% | clg_dp_1|total_w_m2 | 3.6% | 0.6% | **FAIL** |
| hotel|elpaso | 51 | 5.6% | clg_dp_0.4|total_w_m2 | 2.9% | 0.5% | **FAIL** |
| hotel|fairbanks | 51 | 28.4% | clg_dp_2|total_w_m2 | 2.8% | 0.6% | **FAIL** |
| hotel|greatfalls | 51 | 9.7% | clg_dp_1|total_w_m2 | 4.1% | 0.4% | **FAIL** |
| hotel|honolulu | 51 | 4.6% | clg_dp_2|total_w_m2 | 4.1% | 1.3% | PASS |
| hotel|houston | 51 | 2.7% | clg_db_0.4|total_w_m2 | 2.7% | 0.7% | PASS |
| hotel|intlfalls | 51 | 5.4% | clg_dp_2|total_w_m2 | 4.0% | 0.7% | **FAIL** |
| hotel|kansascity | 51 | 2.7% | clg_dp_2|total_w_m2 | 2.3% | 0.5% | PASS |
| hotel|losangeles | 51 | 4.1% | clg_dp_2|total_w_m2 | 3.2% | 0.8% | PASS |
| hotel|miami | 51 | 2.4% | clg_dp_2|total_w_m2 | 2.4% | 0.9% | PASS |
| hotel|newyork | 51 | 3.0% | clg_db_2|total_w_m2 | 2.7% | 0.7% | PASS |
| hotel|phoenix | 51 | 2.8% | clg_dp_0.4|total_w_m2 | 2.2% | 0.8% | PASS |
| hotel|portangeles | 51 | 17.9% | clg_dp_2|total_w_m2 | 4.6% | 0.5% | **FAIL** |
| hotel|rochestermn | 51 | 4.8% | clg_dp_2|total_w_m2 | 3.4% | 0.7% | PASS |
| hotel|sandiego | 51 | 3.3% | clg_dp_2|total_w_m2 | 2.1% | 1.2% | PASS |
| hotel|sanfrancisco | 51 | 18.1% | clg_dp_2|total_w_m2 | 4.8% | 0.6% | **FAIL** |
| hotel|seattle | 51 | 13.2% | clg_dp_2|total_w_m2 | 3.2% | 0.8% | **FAIL** |
| hotel|stlouis | 51 | 2.3% | clg_dp_2|total_w_m2 | 2.1% | 0.5% | PASS |
| hotel|tampa | 51 | 2.1% | clg_dp_2|total_w_m2 | 1.8% | 0.6% | PASS |
| hotel|tucson | 51 | 4.3% | clg_dp_0.4|total_w_m2 | 3.5% | 0.6% | PASS |
| hotel|washington | 51 | 4.7% | clg_dp_2|total_w_m2 | 3.4% | 0.9% | PASS |

## Type defaults (prediction vs EnergyPlus)

| Model | Output | EnergyPlus W/m² | Surrogate W/m² | Error |
|---|---|---|---|---|
| hotel|albuquerque | clg_db_0.4|total_w_m2 | 44.2 | 44.5 | +0.6% |
| hotel|albuquerque | clg_dp_0.4|total_w_m2 | 41.2 | 41.3 | +0.2% |
| hotel|albuquerque | htg_99.6|total_w_m2 | 32.2 | 32.0 | -0.5% |
| hotel|atlanta | clg_db_0.4|total_w_m2 | 58.6 | 57.8 | -1.4% |
| hotel|atlanta | clg_dp_0.4|total_w_m2 | 58.0 | 57.3 | -1.2% |
| hotel|atlanta | htg_99.6|total_w_m2 | 35.5 | 35.4 | -0.2% |
| hotel|boston | clg_db_0.4|total_w_m2 | 58.6 | 58.0 | -1.0% |
| hotel|boston | clg_dp_0.4|total_w_m2 | 60.1 | 59.6 | -0.9% |
| hotel|boston | htg_99.6|total_w_m2 | 42.6 | 42.7 | +0.1% |
| hotel|buffalo | clg_db_0.4|total_w_m2 | 55.0 | 53.9 | -1.9% |
| hotel|buffalo | clg_dp_0.4|total_w_m2 | 58.4 | 57.4 | -1.7% |
| hotel|buffalo | htg_99.6|total_w_m2 | 45.1 | 45.1 | -0.1% |
| hotel|chicago | clg_db_0.4|total_w_m2 | 61.7 | 60.7 | -1.7% |
| hotel|chicago | clg_dp_0.4|total_w_m2 | 64.8 | 63.8 | -1.5% |
| hotel|chicago | htg_99.6|total_w_m2 | 49.7 | 49.6 | -0.1% |
| hotel|dallas | clg_db_0.4|total_w_m2 | 61.6 | 61.0 | -0.9% |
| hotel|dallas | clg_dp_0.4|total_w_m2 | 62.0 | 61.5 | -0.7% |
| hotel|dallas | htg_99.6|total_w_m2 | 37.3 | 37.3 | +0.0% |
| hotel|denver | clg_db_0.4|total_w_m2 | 44.1 | 43.5 | -1.4% |
| hotel|denver | clg_dp_0.4|total_w_m2 | 41.7 | 40.7 | -2.4% |
| hotel|denver | htg_99.6|total_w_m2 | 40.7 | 40.7 | -0.0% |
| hotel|elpaso | clg_db_0.4|total_w_m2 | 47.1 | 46.2 | -1.9% |
| hotel|elpaso | clg_dp_0.4|total_w_m2 | 45.3 | 44.6 | -1.7% |
| hotel|elpaso | htg_99.6|total_w_m2 | 31.2 | 31.1 | -0.3% |
| hotel|fairbanks | clg_db_0.4|total_w_m2 | 43.2 | 42.6 | -1.5% |
| hotel|fairbanks | clg_dp_0.4|total_w_m2 | 40.7 | 39.9 | -1.9% |
| hotel|fairbanks | htg_99.6|total_w_m2 | 71.3 | 71.4 | +0.2% |
| hotel|greatfalls | clg_db_0.4|total_w_m2 | 44.1 | 43.4 | -1.5% |
| hotel|greatfalls | clg_dp_0.4|total_w_m2 | 38.8 | 37.2 | -4.1% |
| hotel|greatfalls | htg_99.6|total_w_m2 | 52.5 | 52.4 | -0.0% |
| hotel|honolulu | clg_db_0.4|total_w_m2 | 56.2 | 55.8 | -0.7% |
| hotel|honolulu | clg_dp_0.4|total_w_m2 | 58.2 | 57.9 | -0.5% |
| hotel|honolulu | htg_99.6|total_w_m2 | 7.3 | 7.2 | -1.2% |
| hotel|houston | clg_db_0.4|total_w_m2 | 63.3 | 62.9 | -0.6% |
| hotel|houston | clg_dp_0.4|total_w_m2 | 63.9 | 63.6 | -0.5% |
| hotel|houston | htg_99.6|total_w_m2 | 30.7 | 30.7 | -0.1% |
| hotel|intlfalls | clg_db_0.4|total_w_m2 | 55.0 | 53.7 | -2.3% |
| hotel|intlfalls | clg_dp_0.4|total_w_m2 | 57.5 | 56.6 | -1.6% |
| hotel|intlfalls | htg_99.6|total_w_m2 | 61.0 | 61.2 | +0.2% |
| hotel|kansascity | clg_db_0.4|total_w_m2 | 65.5 | 65.2 | -0.6% |
| hotel|kansascity | clg_dp_0.4|total_w_m2 | 68.1 | 67.8 | -0.5% |
| hotel|kansascity | htg_99.6|total_w_m2 | 48.3 | 48.1 | -0.4% |
| hotel|losangeles | clg_db_0.4|total_w_m2 | 40.4 | 39.5 | -2.3% |
| hotel|losangeles | clg_dp_0.4|total_w_m2 | 45.4 | 44.4 | -2.2% |
| hotel|losangeles | htg_99.6|total_w_m2 | 18.8 | 18.7 | -0.6% |
| hotel|miami | clg_db_0.4|total_w_m2 | 63.8 | 64.0 | +0.2% |
| hotel|miami | clg_dp_0.4|total_w_m2 | 65.3 | 65.4 | +0.2% |
| hotel|miami | htg_99.6|total_w_m2 | 17.3 | 17.2 | -0.5% |
| hotel|newyork | clg_db_0.4|total_w_m2 | 59.3 | 58.5 | -1.3% |
| hotel|newyork | clg_dp_0.4|total_w_m2 | 62.1 | 61.5 | -0.9% |
| hotel|newyork | htg_99.6|total_w_m2 | 40.6 | 40.6 | -0.0% |
| hotel|phoenix | clg_db_0.4|total_w_m2 | 57.3 | 56.2 | -1.9% |
| hotel|phoenix | clg_dp_0.4|total_w_m2 | 56.1 | 55.0 | -2.1% |
| hotel|phoenix | htg_99.6|total_w_m2 | 23.6 | 23.5 | -0.3% |
| hotel|portangeles | clg_db_0.4|total_w_m2 | 42.6 | 42.1 | -1.2% |
| hotel|portangeles | clg_dp_0.4|total_w_m2 | 38.0 | 37.1 | -2.3% |
| hotel|portangeles | htg_99.6|total_w_m2 | 30.7 | 30.7 | -0.1% |
| hotel|rochestermn | clg_db_0.4|total_w_m2 | 59.1 | 58.3 | -1.3% |
| hotel|rochestermn | clg_dp_0.4|total_w_m2 | 62.6 | 62.1 | -0.9% |
| hotel|rochestermn | htg_99.6|total_w_m2 | 54.6 | 54.7 | +0.1% |
| hotel|sandiego | clg_db_0.4|total_w_m2 | 45.6 | 44.8 | -1.8% |
| hotel|sandiego | clg_dp_0.4|total_w_m2 | 51.0 | 50.0 | -2.0% |
| hotel|sandiego | htg_99.6|total_w_m2 | 18.7 | 18.5 | -0.8% |
| hotel|sanfrancisco | clg_db_0.4|total_w_m2 | 38.1 | 37.6 | -1.2% |
| hotel|sanfrancisco | clg_dp_0.4|total_w_m2 | 34.0 | 32.9 | -3.1% |
| hotel|sanfrancisco | htg_99.6|total_w_m2 | 22.9 | 22.8 | -0.4% |
| hotel|seattle | clg_db_0.4|total_w_m2 | 46.8 | 45.8 | -2.1% |
| hotel|seattle | clg_dp_0.4|total_w_m2 | 41.1 | 39.5 | -3.9% |
| hotel|seattle | htg_99.6|total_w_m2 | 31.7 | 31.7 | -0.1% |
| hotel|stlouis | clg_db_0.4|total_w_m2 | 66.8 | 65.8 | -1.5% |
| hotel|stlouis | clg_dp_0.4|total_w_m2 | 67.7 | 66.8 | -1.4% |
| hotel|stlouis | htg_99.6|total_w_m2 | 46.0 | 45.9 | -0.3% |
| hotel|tampa | clg_db_0.4|total_w_m2 | 64.1 | 63.4 | -1.1% |
| hotel|tampa | clg_dp_0.4|total_w_m2 | 66.9 | 66.1 | -1.1% |
| hotel|tampa | htg_99.6|total_w_m2 | 23.8 | 23.7 | -0.3% |
| hotel|tucson | clg_db_0.4|total_w_m2 | 50.2 | 50.0 | -0.4% |
| hotel|tucson | clg_dp_0.4|total_w_m2 | 48.5 | 48.6 | +0.2% |
| hotel|tucson | htg_99.6|total_w_m2 | 27.2 | 27.2 | -0.1% |
| hotel|washington | clg_db_0.4|total_w_m2 | 64.8 | 64.1 | -1.0% |
| hotel|washington | clg_dp_0.4|total_w_m2 | 65.4 | 64.8 | -0.9% |
| hotel|washington | htg_99.6|total_w_m2 | 37.9 | 37.8 | -0.2% |

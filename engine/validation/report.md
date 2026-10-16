# Surrogate validation against EnergyPlus

Generated 2026-10-16T22:24:01+00:00 by `engine/validate.py`. Each model is tested on EnergyPlus runs it was not trained on (independent Latin-hypercube sample, seed 9001, plus the building type default).

Pass rule: worst 95th-percentile absolute error across all design-day block totals <= 5.0%.

| Model | Test runs | Worst P95 (block totals) | Worst output | Cooling 0.4%% DB P95 | Heating 99.6%% P95 | Result |
|---|---|---|---|---|---|---|
| office|albuquerque | 51 | 9.5% | clg_dp_0.4|total_w_m2 | 3.7% | 0.8% | **FAIL** |
| office|atlanta | 51 | 3.2% | clg_dp_2|total_w_m2 | 1.8% | 0.5% | PASS |
| office|boston | 51 | 3.6% | clg_dp_2|total_w_m2 | 2.8% | 0.8% | PASS |
| office|buffalo | 51 | 4.2% | clg_dp_2|total_w_m2 | 3.4% | 0.6% | PASS |
| office|chicago | 51 | 3.4% | clg_dp_0.4|total_w_m2 | 3.3% | 0.8% | PASS |
| office|dallas | 51 | 3.0% | clg_dp_2|total_w_m2 | 2.6% | 0.6% | PASS |
| office|denver | 51 | 12.1% | clg_dp_2|total_w_m2 | 4.5% | 0.8% | **FAIL** |
| office|elpaso | 51 | 6.7% | clg_dp_2|total_w_m2 | 2.4% | 1.0% | **FAIL** |
| office|fairbanks | 51 | 11.0% | clg_dp_0.4|total_w_m2 | 3.8% | 1.0% | **FAIL** |
| office|greatfalls | 51 | 11.8% | clg_dp_1|total_w_m2 | 3.3% | 0.6% | **FAIL** |
| office|honolulu | 51 | 5.2% | htg_99.6|total_w_m2 | 2.7% | 5.2% | **FAIL** |
| office|houston | 51 | 2.8% | clg_db_2|total_w_m2 | 2.2% | 0.8% | PASS |
| office|intlfalls | 51 | 6.9% | clg_dp_2|total_w_m2 | 4.3% | 0.7% | **FAIL** |
| office|kansascity | 51 | 3.6% | clg_db_2|total_w_m2 | 3.1% | 0.6% | PASS |
| office|losangeles | 51 | 4.6% | clg_dp_2|total_w_m2 | 3.6% | 1.5% | PASS |
| office|miami | 51 | 6.5% | clg_dp_2|total_w_m2 | 3.3% | 1.0% | **FAIL** |
| office|newyork | 51 | 4.8% | clg_dp_2|total_w_m2 | 3.1% | 0.7% | PASS |
| office|phoenix | 51 | 2.4% | clg_dp_0.4|total_w_m2 | 2.3% | 0.9% | PASS |
| office|portangeles | 51 | 13.4% | clg_dp_2|total_w_m2 | 3.7% | 0.8% | **FAIL** |
| office|rochestermn | 51 | 3.6% | clg_db_0.4|total_w_m2 | 3.6% | 0.6% | PASS |
| office|sandiego | 51 | 5.6% | clg_dp_0.4|total_w_m2 | 3.4% | 1.5% | **FAIL** |
| office|sanfrancisco | 51 | 24.7% | clg_dp_2|total_w_m2 | 7.6% | 1.1% | **FAIL** |
| office|seattle | 51 | 11.7% | clg_dp_2|total_w_m2 | 3.3% | 0.8% | **FAIL** |
| office|stlouis | 51 | 2.7% | clg_dp_2|total_w_m2 | 1.8% | 0.6% | PASS |
| office|tampa | 51 | 3.5% | clg_db_2|total_w_m2 | 2.7% | 0.9% | PASS |
| office|tucson | 51 | 5.0% | clg_dp_0.4|total_w_m2 | 3.2% | 0.8% | PASS |
| office|washington | 51 | 2.6% | clg_dp_1|total_w_m2 | 2.3% | 0.6% | PASS |

## Type defaults (prediction vs EnergyPlus)

| Model | Output | EnergyPlus W/m² | Surrogate W/m² | Error |
|---|---|---|---|---|
| office|albuquerque | clg_db_0.4|total_w_m2 | 41.2 | 41.4 | +0.6% |
| office|albuquerque | clg_dp_0.4|total_w_m2 | 35.9 | 36.3 | +1.0% |
| office|albuquerque | htg_99.6|total_w_m2 | 28.6 | 28.5 | -0.3% |
| office|atlanta | clg_db_0.4|total_w_m2 | 51.9 | 51.5 | -0.9% |
| office|atlanta | clg_dp_0.4|total_w_m2 | 50.2 | 49.8 | -0.8% |
| office|atlanta | htg_99.6|total_w_m2 | 31.5 | 31.5 | -0.0% |
| office|boston | clg_db_0.4|total_w_m2 | 52.4 | 51.8 | -1.1% |
| office|boston | clg_dp_0.4|total_w_m2 | 53.2 | 52.8 | -0.8% |
| office|boston | htg_99.6|total_w_m2 | 37.4 | 37.4 | -0.2% |
| office|buffalo | clg_db_0.4|total_w_m2 | 49.2 | 47.9 | -2.6% |
| office|buffalo | clg_dp_0.4|total_w_m2 | 51.5 | 50.5 | -2.0% |
| office|buffalo | htg_99.6|total_w_m2 | 39.7 | 39.5 | -0.4% |
| office|chicago | clg_db_0.4|total_w_m2 | 55.0 | 53.9 | -1.9% |
| office|chicago | clg_dp_0.4|total_w_m2 | 57.0 | 55.9 | -1.9% |
| office|chicago | htg_99.6|total_w_m2 | 43.6 | 43.5 | -0.3% |
| office|dallas | clg_db_0.4|total_w_m2 | 54.9 | 54.2 | -1.3% |
| office|dallas | clg_dp_0.4|total_w_m2 | 53.8 | 53.0 | -1.5% |
| office|dallas | htg_99.6|total_w_m2 | 33.2 | 33.1 | -0.3% |
| office|denver | clg_db_0.4|total_w_m2 | 40.8 | 40.6 | -0.5% |
| office|denver | clg_dp_0.4|total_w_m2 | 36.4 | 37.1 | +2.0% |
| office|denver | htg_99.6|total_w_m2 | 36.0 | 35.9 | -0.3% |
| office|elpaso | clg_db_0.4|total_w_m2 | 42.7 | 42.1 | -1.3% |
| office|elpaso | clg_dp_0.4|total_w_m2 | 38.8 | 38.4 | -0.9% |
| office|elpaso | htg_99.6|total_w_m2 | 27.7 | 27.5 | -0.9% |
| office|fairbanks | clg_db_0.4|total_w_m2 | 40.3 | 40.3 | -0.0% |
| office|fairbanks | clg_dp_0.4|total_w_m2 | 37.2 | 36.7 | -1.2% |
| office|fairbanks | htg_99.6|total_w_m2 | 61.9 | 62.3 | +0.6% |
| office|greatfalls | clg_db_0.4|total_w_m2 | 40.7 | 39.3 | -3.2% |
| office|greatfalls | clg_dp_0.4|total_w_m2 | 34.3 | 32.1 | -6.2% |
| office|greatfalls | htg_99.6|total_w_m2 | 46.0 | 46.1 | +0.1% |
| office|honolulu | clg_db_0.4|total_w_m2 | 49.9 | 49.6 | -0.6% |
| office|honolulu | clg_dp_0.4|total_w_m2 | 50.8 | 49.8 | -2.0% |
| office|honolulu | htg_99.6|total_w_m2 | 6.6 | 6.5 | -1.4% |
| office|houston | clg_db_0.4|total_w_m2 | 56.0 | 56.1 | +0.1% |
| office|houston | clg_dp_0.4|total_w_m2 | 55.3 | 55.3 | +0.1% |
| office|houston | htg_99.6|total_w_m2 | 27.3 | 27.3 | +0.0% |
| office|intlfalls | clg_db_0.4|total_w_m2 | 49.5 | 48.6 | -1.7% |
| office|intlfalls | clg_dp_0.4|total_w_m2 | 50.9 | 50.0 | -1.8% |
| office|intlfalls | htg_99.6|total_w_m2 | 53.3 | 53.1 | -0.4% |
| office|kansascity | clg_db_0.4|total_w_m2 | 58.2 | 57.9 | -0.4% |
| office|kansascity | clg_dp_0.4|total_w_m2 | 59.8 | 60.3 | +0.8% |
| office|kansascity | htg_99.6|total_w_m2 | 42.7 | 42.8 | +0.2% |
| office|losangeles | clg_db_0.4|total_w_m2 | 36.7 | 36.5 | -0.6% |
| office|losangeles | clg_dp_0.4|total_w_m2 | 39.6 | 39.4 | -0.5% |
| office|losangeles | htg_99.6|total_w_m2 | 16.6 | 16.6 | -0.5% |
| office|miami | clg_db_0.4|total_w_m2 | 56.3 | 55.6 | -1.3% |
| office|miami | clg_dp_0.4|total_w_m2 | 57.0 | 56.4 | -1.2% |
| office|miami | htg_99.6|total_w_m2 | 15.4 | 15.4 | -0.4% |
| office|newyork | clg_db_0.4|total_w_m2 | 53.0 | 52.4 | -1.0% |
| office|newyork | clg_dp_0.4|total_w_m2 | 54.8 | 54.0 | -1.4% |
| office|newyork | htg_99.6|total_w_m2 | 35.8 | 35.8 | +0.1% |
| office|phoenix | clg_db_0.4|total_w_m2 | 51.9 | 51.8 | -0.2% |
| office|phoenix | clg_dp_0.4|total_w_m2 | 48.7 | 48.3 | -0.9% |
| office|phoenix | htg_99.6|total_w_m2 | 21.1 | 21.0 | -0.1% |
| office|portangeles | clg_db_0.4|total_w_m2 | 38.8 | 38.5 | -1.0% |
| office|portangeles | clg_dp_0.4|total_w_m2 | 33.8 | 32.6 | -3.5% |
| office|portangeles | htg_99.6|total_w_m2 | 26.9 | 26.8 | -0.5% |
| office|rochestermn | clg_db_0.4|total_w_m2 | 52.5 | 52.3 | -0.4% |
| office|rochestermn | clg_dp_0.4|total_w_m2 | 55.0 | 54.8 | -0.5% |
| office|rochestermn | htg_99.6|total_w_m2 | 47.8 | 47.8 | -0.0% |
| office|sandiego | clg_db_0.4|total_w_m2 | 41.1 | 41.6 | +1.2% |
| office|sandiego | clg_dp_0.4|total_w_m2 | 44.9 | 46.2 | +3.0% |
| office|sandiego | htg_99.6|total_w_m2 | 16.6 | 16.4 | -0.8% |
| office|sanfrancisco | clg_db_0.4|total_w_m2 | 34.5 | 34.8 | +1.1% |
| office|sanfrancisco | clg_dp_0.4|total_w_m2 | 29.6 | 29.4 | -0.4% |
| office|sanfrancisco | htg_99.6|total_w_m2 | 20.3 | 20.2 | -0.2% |
| office|seattle | clg_db_0.4|total_w_m2 | 42.6 | 42.0 | -1.5% |
| office|seattle | clg_dp_0.4|total_w_m2 | 36.4 | 36.3 | -0.5% |
| office|seattle | htg_99.6|total_w_m2 | 28.0 | 28.0 | +0.0% |
| office|stlouis | clg_db_0.4|total_w_m2 | 59.3 | 58.4 | -1.5% |
| office|stlouis | clg_dp_0.4|total_w_m2 | 59.6 | 58.8 | -1.4% |
| office|stlouis | htg_99.6|total_w_m2 | 40.6 | 40.7 | +0.2% |
| office|tampa | clg_db_0.4|total_w_m2 | 56.5 | 56.1 | -0.8% |
| office|tampa | clg_dp_0.4|total_w_m2 | 58.3 | 57.9 | -0.7% |
| office|tampa | htg_99.6|total_w_m2 | 21.1 | 21.1 | -0.0% |
| office|tucson | clg_db_0.4|total_w_m2 | 46.1 | 45.9 | -0.5% |
| office|tucson | clg_dp_0.4|total_w_m2 | 41.6 | 41.7 | +0.2% |
| office|tucson | htg_99.6|total_w_m2 | 24.3 | 24.2 | -0.2% |
| office|washington | clg_db_0.4|total_w_m2 | 57.6 | 56.8 | -1.4% |
| office|washington | clg_dp_0.4|total_w_m2 | 57.6 | 57.1 | -0.9% |
| office|washington | htg_99.6|total_w_m2 | 33.4 | 33.3 | -0.3% |

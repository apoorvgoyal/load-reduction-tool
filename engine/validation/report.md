# Surrogate validation against EnergyPlus

Generated 2026-10-16T18:30:52+00:00 by `engine/validate.py`. Each model is tested on EnergyPlus runs it was not trained on (independent Latin-hypercube sample, seed 9001, plus the building type default).

Pass rule: worst 95th-percentile absolute error across all design-day block totals <= 5.0%.

| Model | Test runs | Worst P95 (block totals) | Worst output | Cooling 0.4%% DB P95 | Heating 99.6%% P95 | Result |
|---|---|---|---|---|---|---|
| healthcare|albuquerque | 51 | 24.0% | clg_dp_1|total_w_m2 | 4.2% | 0.4% | **FAIL** |
| healthcare|atlanta | 51 | 3.6% | clg_dp_0.4|total_w_m2 | 1.2% | 0.6% | PASS |
| healthcare|boston | 51 | 2.8% | clg_dp_2|total_w_m2 | 2.0% | 0.4% | PASS |
| healthcare|buffalo | 51 | 9.7% | clg_dp_2|total_w_m2 | 1.3% | 0.3% | **FAIL** |
| healthcare|chicago | 51 | 6.1% | clg_dp_2|total_w_m2 | 1.8% | 0.5% | **FAIL** |
| healthcare|dallas | 51 | 4.4% | clg_dp_1|total_w_m2 | 1.3% | 0.4% | PASS |
| healthcare|denver | 51 | 85.5% | clg_dp_1|total_w_m2 | 3.7% | 0.6% | **FAIL** |
| healthcare|elpaso | 51 | 11.4% | clg_dp_0.4|total_w_m2 | 2.3% | 0.4% | **FAIL** |
| healthcare|fairbanks | 51 | 84.6% | clg_dp_2|total_w_m2 | 4.0% | 0.2% | **FAIL** |
| healthcare|greatfalls | 51 | 37.0% | clg_dp_2|total_w_m2 | 5.3% | 0.4% | **FAIL** |
| healthcare|honolulu | 51 | 3.2% | clg_dp_2|total_w_m2 | 2.6% | 1.1% | PASS |
| healthcare|houston | 51 | 2.6% | clg_dp_2|total_w_m2 | 1.2% | 0.3% | PASS |
| healthcare|intlfalls | 51 | 17.3% | clg_dp_2|total_w_m2 | 2.1% | 0.4% | **FAIL** |
| healthcare|kansascity | 51 | 5.9% | clg_dp_2|total_w_m2 | 1.3% | 0.6% | **FAIL** |
| healthcare|losangeles | 51 | 17.9% | clg_dp_2|total_w_m2 | 3.5% | 0.7% | **FAIL** |
| healthcare|miami | 51 | 2.7% | clg_dp_2|total_w_m2 | 1.8% | 0.7% | PASS |
| healthcare|newyork | 51 | 5.3% | clg_dp_2|total_w_m2 | 1.9% | 0.3% | **FAIL** |
| healthcare|phoenix | 51 | 2.7% | clg_dp_0.4|total_w_m2 | 1.4% | 0.6% | PASS |
| healthcare|portangeles | 51 | 141.9% | clg_dp_2|total_w_m2 | 2.7% | 0.3% | **FAIL** |
| healthcare|rochestermn | 51 | 5.3% | clg_dp_2|total_w_m2 | 1.7% | 0.4% | **FAIL** |
| healthcare|sandiego | 51 | 5.0% | clg_dp_2|total_w_m2 | 2.5% | 0.5% | PASS |
| healthcare|sanfrancisco | 51 | 89.7% | clg_dp_2|total_w_m2 | 3.7% | 0.5% | **FAIL** |
| healthcare|seattle | 51 | 33.4% | clg_dp_2|total_w_m2 | 2.6% | 0.5% | **FAIL** |
| healthcare|stlouis | 51 | 1.6% | clg_db_2|total_w_m2 | 1.4% | 0.3% | PASS |
| healthcare|tampa | 51 | 3.6% | clg_dp_2|total_w_m2 | 1.5% | 0.6% | PASS |
| healthcare|tucson | 51 | 6.2% | clg_dp_0.4|total_w_m2 | 1.9% | 0.7% | **FAIL** |
| healthcare|washington | 51 | 3.6% | clg_dp_2|total_w_m2 | 1.8% | 0.3% | PASS |

## Type defaults (prediction vs EnergyPlus)

| Model | Output | EnergyPlus W/m² | Surrogate W/m² | Error |
|---|---|---|---|---|
| healthcare|albuquerque | clg_db_0.4|total_w_m2 | 73.8 | 73.8 | -0.0% |
| healthcare|albuquerque | clg_dp_0.4|total_w_m2 | 69.1 | 71.2 | +3.1% |
| healthcare|albuquerque | htg_99.6|total_w_m2 | 82.6 | 82.6 | -0.0% |
| healthcare|atlanta | clg_db_0.4|total_w_m2 | 120.9 | 119.9 | -0.8% |
| healthcare|atlanta | clg_dp_0.4|total_w_m2 | 127.2 | 126.6 | -0.4% |
| healthcare|atlanta | htg_99.6|total_w_m2 | 91.5 | 91.2 | -0.3% |
| healthcare|boston | clg_db_0.4|total_w_m2 | 114.9 | 114.1 | -0.7% |
| healthcare|boston | clg_dp_0.4|total_w_m2 | 125.0 | 124.0 | -0.8% |
| healthcare|boston | htg_99.6|total_w_m2 | 115.1 | 115.0 | -0.1% |
| healthcare|buffalo | clg_db_0.4|total_w_m2 | 104.2 | 103.0 | -1.2% |
| healthcare|buffalo | clg_dp_0.4|total_w_m2 | 119.6 | 118.0 | -1.3% |
| healthcare|buffalo | htg_99.6|total_w_m2 | 121.0 | 120.9 | -0.1% |
| healthcare|chicago | clg_db_0.4|total_w_m2 | 125.0 | 123.2 | -1.4% |
| healthcare|chicago | clg_dp_0.4|total_w_m2 | 139.2 | 137.3 | -1.3% |
| healthcare|chicago | htg_99.6|total_w_m2 | 132.9 | 132.8 | -0.1% |
| healthcare|dallas | clg_db_0.4|total_w_m2 | 124.0 | 124.1 | +0.1% |
| healthcare|dallas | clg_dp_0.4|total_w_m2 | 137.7 | 137.3 | -0.3% |
| healthcare|dallas | htg_99.6|total_w_m2 | 94.7 | 94.7 | +0.0% |
| healthcare|denver | clg_db_0.4|total_w_m2 | 72.4 | 70.3 | -3.0% |
| healthcare|denver | clg_dp_0.4|total_w_m2 | 68.2 | 67.2 | -1.5% |
| healthcare|denver | htg_99.6|total_w_m2 | 106.4 | 106.2 | -0.2% |
| healthcare|elpaso | clg_db_0.4|total_w_m2 | 81.6 | 81.5 | -0.1% |
| healthcare|elpaso | clg_dp_0.4|total_w_m2 | 89.2 | 85.9 | -3.7% |
| healthcare|elpaso | htg_99.6|total_w_m2 | 79.7 | 79.6 | -0.1% |
| healthcare|fairbanks | clg_db_0.4|total_w_m2 | 59.9 | 58.9 | -1.8% |
| healthcare|fairbanks | clg_dp_0.4|total_w_m2 | 51.9 | 53.7 | +3.6% |
| healthcare|fairbanks | htg_99.6|total_w_m2 | 198.0 | 198.1 | +0.0% |
| healthcare|greatfalls | clg_db_0.4|total_w_m2 | 71.3 | 69.6 | -2.4% |
| healthcare|greatfalls | clg_dp_0.4|total_w_m2 | 56.7 | 55.4 | -2.4% |
| healthcare|greatfalls | htg_99.6|total_w_m2 | 140.2 | 140.1 | -0.1% |
| healthcare|honolulu | clg_db_0.4|total_w_m2 | 115.6 | 115.8 | +0.2% |
| healthcare|honolulu | clg_dp_0.4|total_w_m2 | 129.3 | 129.6 | +0.2% |
| healthcare|honolulu | htg_99.6|total_w_m2 | 20.4 | 20.3 | -0.5% |
| healthcare|houston | clg_db_0.4|total_w_m2 | 134.5 | 133.9 | -0.5% |
| healthcare|houston | clg_dp_0.4|total_w_m2 | 146.6 | 145.6 | -0.7% |
| healthcare|houston | htg_99.6|total_w_m2 | 79.4 | 79.2 | -0.2% |
| healthcare|intlfalls | clg_db_0.4|total_w_m2 | 100.0 | 98.2 | -1.8% |
| healthcare|intlfalls | clg_dp_0.4|total_w_m2 | 111.6 | 108.2 | -3.0% |
| healthcare|intlfalls | htg_99.6|total_w_m2 | 166.9 | 167.1 | +0.1% |
| healthcare|kansascity | clg_db_0.4|total_w_m2 | 136.3 | 135.5 | -0.6% |
| healthcare|kansascity | clg_dp_0.4|total_w_m2 | 150.9 | 150.1 | -0.5% |
| healthcare|kansascity | htg_99.6|total_w_m2 | 126.4 | 126.2 | -0.2% |
| healthcare|losangeles | clg_db_0.4|total_w_m2 | 63.2 | 62.5 | -1.1% |
| healthcare|losangeles | clg_dp_0.4|total_w_m2 | 86.7 | 85.5 | -1.4% |
| healthcare|losangeles | htg_99.6|total_w_m2 | 50.5 | 50.3 | -0.4% |
| healthcare|miami | clg_db_0.4|total_w_m2 | 139.0 | 138.0 | -0.8% |
| healthcare|miami | clg_dp_0.4|total_w_m2 | 150.5 | 149.1 | -0.9% |
| healthcare|miami | htg_99.6|total_w_m2 | 45.5 | 45.4 | -0.3% |
| healthcare|newyork | clg_db_0.4|total_w_m2 | 117.1 | 115.4 | -1.4% |
| healthcare|newyork | clg_dp_0.4|total_w_m2 | 131.9 | 130.0 | -1.4% |
| healthcare|newyork | htg_99.6|total_w_m2 | 107.3 | 107.3 | -0.0% |
| healthcare|phoenix | clg_db_0.4|total_w_m2 | 104.6 | 104.1 | -0.4% |
| healthcare|phoenix | clg_dp_0.4|total_w_m2 | 118.6 | 118.1 | -0.5% |
| healthcare|phoenix | htg_99.6|total_w_m2 | 60.4 | 60.2 | -0.2% |
| healthcare|portangeles | clg_db_0.4|total_w_m2 | 60.2 | 59.5 | -1.2% |
| healthcare|portangeles | clg_dp_0.4|total_w_m2 | 51.1 | 50.8 | -0.5% |
| healthcare|portangeles | htg_99.6|total_w_m2 | 84.1 | 84.0 | -0.1% |
| healthcare|rochestermn | clg_db_0.4|total_w_m2 | 118.6 | 116.8 | -1.5% |
| healthcare|rochestermn | clg_dp_0.4|total_w_m2 | 133.5 | 131.2 | -1.7% |
| healthcare|rochestermn | htg_99.6|total_w_m2 | 147.6 | 147.6 | +0.0% |
| healthcare|sandiego | clg_db_0.4|total_w_m2 | 80.9 | 80.5 | -0.6% |
| healthcare|sandiego | clg_dp_0.4|total_w_m2 | 104.0 | 103.0 | -1.0% |
| healthcare|sandiego | htg_99.6|total_w_m2 | 50.1 | 50.0 | -0.2% |
| healthcare|sanfrancisco | clg_db_0.4|total_w_m2 | 56.6 | 56.2 | -0.6% |
| healthcare|sanfrancisco | clg_dp_0.4|total_w_m2 | 53.3 | 48.7 | -8.7% |
| healthcare|sanfrancisco | htg_99.6|total_w_m2 | 60.9 | 60.8 | -0.1% |
| healthcare|seattle | clg_db_0.4|total_w_m2 | 72.5 | 71.2 | -1.7% |
| healthcare|seattle | clg_dp_0.4|total_w_m2 | 62.0 | 60.4 | -2.7% |
| healthcare|seattle | htg_99.6|total_w_m2 | 84.8 | 84.8 | -0.0% |
| healthcare|stlouis | clg_db_0.4|total_w_m2 | 139.4 | 137.9 | -1.1% |
| healthcare|stlouis | clg_dp_0.4|total_w_m2 | 148.5 | 146.8 | -1.1% |
| healthcare|stlouis | htg_99.6|total_w_m2 | 120.8 | 120.7 | -0.1% |
| healthcare|tampa | clg_db_0.4|total_w_m2 | 138.5 | 138.3 | -0.2% |
| healthcare|tampa | clg_dp_0.4|total_w_m2 | 153.6 | 151.7 | -1.2% |
| healthcare|tampa | htg_99.6|total_w_m2 | 62.2 | 62.1 | -0.2% |
| healthcare|tucson | clg_db_0.4|total_w_m2 | 93.1 | 93.1 | +0.1% |
| healthcare|tucson | clg_dp_0.4|total_w_m2 | 99.6 | 101.1 | +1.5% |
| healthcare|tucson | htg_99.6|total_w_m2 | 69.2 | 69.1 | -0.2% |
| healthcare|washington | clg_db_0.4|total_w_m2 | 133.4 | 132.1 | -1.0% |
| healthcare|washington | clg_dp_0.4|total_w_m2 | 141.8 | 139.6 | -1.6% |
| healthcare|washington | htg_99.6|total_w_m2 | 100.6 | 100.6 | -0.0% |

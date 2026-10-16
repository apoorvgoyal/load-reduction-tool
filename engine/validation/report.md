# Surrogate validation against EnergyPlus

Generated 2026-10-16T19:53:52+00:00 by `engine/validate.py`. Each model is tested on EnergyPlus runs it was not trained on (independent Latin-hypercube sample, seed 9001, plus the building type default).

Pass rule: worst 95th-percentile absolute error across all design-day block totals <= 5.0%.

| Model | Test runs | Worst P95 (block totals) | Worst output | Cooling 0.4%% DB P95 | Heating 99.6%% P95 | Result |
|---|---|---|---|---|---|---|
| school|albuquerque | 51 | 18.5% | clg_dp_1|total_w_m2 | 6.2% | 0.4% | **FAIL** |
| school|atlanta | 51 | 1.7% | clg_dp_2|total_w_m2 | 1.3% | 0.4% | PASS |
| school|boston | 51 | 2.6% | clg_dp_1|total_w_m2 | 1.9% | 0.3% | PASS |
| school|buffalo | 51 | 3.4% | clg_dp_1|total_w_m2 | 1.9% | 0.3% | PASS |
| school|chicago | 51 | 2.7% | clg_dp_2|total_w_m2 | 1.8% | 0.3% | PASS |
| school|dallas | 51 | 2.3% | clg_dp_2|total_w_m2 | 1.8% | 0.3% | PASS |
| school|denver | 51 | 39.6% | clg_dp_2|total_w_m2 | 7.6% | 0.5% | **FAIL** |
| school|elpaso | 51 | 3.9% | clg_dp_0.4|total_w_m2 | 3.7% | 0.5% | PASS |
| school|fairbanks | 51 | 72.7% | clg_dp_0.4|total_w_m2 | 3.3% | 0.4% | **FAIL** |
| school|greatfalls | 51 | 22.5% | clg_dp_1|total_w_m2 | 7.1% | 0.3% | **FAIL** |
| school|honolulu | 51 | 2.7% | clg_dp_2|total_w_m2 | 2.6% | 2.1% | PASS |
| school|houston | 51 | 2.3% | clg_dp_2|total_w_m2 | 1.6% | 0.4% | PASS |
| school|intlfalls | 51 | 3.7% | clg_dp_2|total_w_m2 | 1.8% | 0.4% | PASS |
| school|kansascity | 51 | 3.3% | clg_dp_2|total_w_m2 | 1.9% | 0.3% | PASS |
| school|losangeles | 51 | 11.5% | clg_dp_2|total_w_m2 | 5.3% | 0.3% | **FAIL** |
| school|miami | 51 | 1.4% | clg_dp_1|total_w_m2 | 1.0% | 0.6% | PASS |
| school|newyork | 51 | 3.0% | clg_db_2|total_w_m2 | 2.4% | 0.3% | PASS |
| school|phoenix | 51 | 3.0% | clg_dp_1|total_w_m2 | 2.0% | 0.8% | PASS |
| school|portangeles | 51 | 100.0% | clg_dp_1|total_w_m2 | 4.9% | 0.4% | **FAIL** |
| school|rochestermn | 51 | 3.7% | clg_dp_2|total_w_m2 | 1.4% | 0.4% | PASS |
| school|sandiego | 51 | 2.3% | clg_dp_2|total_w_m2 | 1.8% | 0.5% | PASS |
| school|sanfrancisco | 51 | 33.5% | clg_dp_0.4|total_w_m2 | 6.8% | 0.9% | **FAIL** |
| school|seattle | 51 | 24.2% | clg_dp_2|total_w_m2 | 3.4% | 0.4% | **FAIL** |
| school|stlouis | 51 | 2.1% | clg_dp_2|total_w_m2 | 1.5% | 0.4% | PASS |
| school|tampa | 51 | 2.0% | clg_dp_2|total_w_m2 | 1.5% | 0.4% | PASS |
| school|tucson | 51 | 3.9% | clg_db_1|total_w_m2 | 3.3% | 0.4% | PASS |
| school|washington | 51 | 2.9% | clg_dp_2|total_w_m2 | 1.4% | 0.7% | PASS |

## Type defaults (prediction vs EnergyPlus)

| Model | Output | EnergyPlus W/m² | Surrogate W/m² | Error |
|---|---|---|---|---|
| school|albuquerque | clg_db_0.4|total_w_m2 | 80.3 | 79.3 | -1.2% |
| school|albuquerque | clg_dp_0.4|total_w_m2 | 80.7 | 84.6 | +4.9% |
| school|albuquerque | htg_99.6|total_w_m2 | 84.1 | 84.0 | -0.1% |
| school|atlanta | clg_db_0.4|total_w_m2 | 134.9 | 133.2 | -1.2% |
| school|atlanta | clg_dp_0.4|total_w_m2 | 140.7 | 138.8 | -1.4% |
| school|atlanta | htg_99.6|total_w_m2 | 93.0 | 92.9 | -0.1% |
| school|boston | clg_db_0.4|total_w_m2 | 128.1 | 126.0 | -1.6% |
| school|boston | clg_dp_0.4|total_w_m2 | 138.6 | 136.0 | -1.9% |
| school|boston | htg_99.6|total_w_m2 | 118.1 | 117.9 | -0.2% |
| school|buffalo | clg_db_0.4|total_w_m2 | 117.1 | 115.1 | -1.7% |
| school|buffalo | clg_dp_0.4|total_w_m2 | 133.0 | 130.6 | -1.8% |
| school|buffalo | htg_99.6|total_w_m2 | 124.4 | 124.4 | -0.0% |
| school|chicago | clg_db_0.4|total_w_m2 | 139.2 | 137.1 | -1.5% |
| school|chicago | clg_dp_0.4|total_w_m2 | 154.1 | 151.2 | -1.9% |
| school|chicago | htg_99.6|total_w_m2 | 136.9 | 136.7 | -0.2% |
| school|dallas | clg_db_0.4|total_w_m2 | 138.1 | 136.8 | -0.9% |
| school|dallas | clg_dp_0.4|total_w_m2 | 151.6 | 150.6 | -0.7% |
| school|dallas | htg_99.6|total_w_m2 | 96.2 | 96.2 | -0.0% |
| school|denver | clg_db_0.4|total_w_m2 | 78.9 | 79.5 | +0.7% |
| school|denver | clg_dp_0.4|total_w_m2 | 80.1 | 81.2 | +1.4% |
| school|denver | htg_99.6|total_w_m2 | 109.3 | 109.2 | -0.1% |
| school|elpaso | clg_db_0.4|total_w_m2 | 90.2 | 91.0 | +0.9% |
| school|elpaso | clg_dp_0.4|total_w_m2 | 100.7 | 100.9 | +0.2% |
| school|elpaso | htg_99.6|total_w_m2 | 80.9 | 80.8 | -0.1% |
| school|fairbanks | clg_db_0.4|total_w_m2 | 66.5 | 66.0 | -0.7% |
| school|fairbanks | clg_dp_0.4|total_w_m2 | 61.5 | 60.0 | -2.5% |
| school|fairbanks | htg_99.6|total_w_m2 | 206.1 | 206.2 | +0.1% |
| school|greatfalls | clg_db_0.4|total_w_m2 | 77.8 | 76.7 | -1.4% |
| school|greatfalls | clg_dp_0.4|total_w_m2 | 67.3 | 64.5 | -4.1% |
| school|greatfalls | htg_99.6|total_w_m2 | 145.0 | 145.0 | -0.0% |
| school|honolulu | clg_db_0.4|total_w_m2 | 128.5 | 127.0 | -1.2% |
| school|honolulu | clg_dp_0.4|total_w_m2 | 142.5 | 140.7 | -1.3% |
| school|honolulu | htg_99.6|total_w_m2 | 18.0 | 17.9 | -0.6% |
| school|houston | clg_db_0.4|total_w_m2 | 149.0 | 148.5 | -0.3% |
| school|houston | clg_dp_0.4|total_w_m2 | 161.0 | 160.2 | -0.5% |
| school|houston | htg_99.6|total_w_m2 | 80.1 | 80.0 | -0.1% |
| school|intlfalls | clg_db_0.4|total_w_m2 | 112.9 | 110.9 | -1.8% |
| school|intlfalls | clg_dp_0.4|total_w_m2 | 124.7 | 122.3 | -1.9% |
| school|intlfalls | htg_99.6|total_w_m2 | 173.1 | 173.0 | -0.0% |
| school|kansascity | clg_db_0.4|total_w_m2 | 151.4 | 150.0 | -0.9% |
| school|kansascity | clg_dp_0.4|total_w_m2 | 166.7 | 165.3 | -0.8% |
| school|kansascity | htg_99.6|total_w_m2 | 129.9 | 130.0 | +0.0% |
| school|losangeles | clg_db_0.4|total_w_m2 | 72.8 | 72.7 | -0.2% |
| school|losangeles | clg_dp_0.4|total_w_m2 | 96.6 | 95.8 | -0.9% |
| school|losangeles | htg_99.6|total_w_m2 | 49.7 | 49.6 | -0.2% |
| school|miami | clg_db_0.4|total_w_m2 | 153.6 | 152.1 | -1.0% |
| school|miami | clg_dp_0.4|total_w_m2 | 165.4 | 163.9 | -0.9% |
| school|miami | htg_99.6|total_w_m2 | 44.4 | 44.3 | -0.2% |
| school|newyork | clg_db_0.4|total_w_m2 | 130.5 | 128.7 | -1.3% |
| school|newyork | clg_dp_0.4|total_w_m2 | 145.9 | 143.8 | -1.5% |
| school|newyork | htg_99.6|total_w_m2 | 109.7 | 109.6 | -0.1% |
| school|phoenix | clg_db_0.4|total_w_m2 | 115.4 | 114.0 | -1.2% |
| school|phoenix | clg_dp_0.4|total_w_m2 | 131.4 | 129.1 | -1.7% |
| school|phoenix | htg_99.6|total_w_m2 | 60.1 | 60.0 | -0.2% |
| school|portangeles | clg_db_0.4|total_w_m2 | 69.6 | 68.9 | -1.0% |
| school|portangeles | clg_dp_0.4|total_w_m2 | 59.3 | 54.0 | -8.8% |
| school|portangeles | htg_99.6|total_w_m2 | 85.4 | 85.3 | -0.2% |
| school|rochestermn | clg_db_0.4|total_w_m2 | 132.7 | 131.0 | -1.3% |
| school|rochestermn | clg_dp_0.4|total_w_m2 | 148.3 | 146.3 | -1.3% |
| school|rochestermn | htg_99.6|total_w_m2 | 152.6 | 152.7 | +0.0% |
| school|sandiego | clg_db_0.4|total_w_m2 | 91.6 | 90.4 | -1.3% |
| school|sandiego | clg_dp_0.4|total_w_m2 | 115.7 | 114.4 | -1.2% |
| school|sandiego | htg_99.6|total_w_m2 | 49.3 | 49.2 | -0.2% |
| school|sanfrancisco | clg_db_0.4|total_w_m2 | 65.4 | 65.3 | -0.1% |
| school|sanfrancisco | clg_dp_0.4|total_w_m2 | 60.4 | 65.9 | +9.1% |
| school|sanfrancisco | htg_99.6|total_w_m2 | 60.6 | 60.7 | +0.1% |
| school|seattle | clg_db_0.4|total_w_m2 | 82.9 | 81.1 | -2.2% |
| school|seattle | clg_dp_0.4|total_w_m2 | 70.7 | 72.1 | +2.0% |
| school|seattle | htg_99.6|total_w_m2 | 86.1 | 86.0 | -0.1% |
| school|stlouis | clg_db_0.4|total_w_m2 | 154.6 | 153.4 | -0.7% |
| school|stlouis | clg_dp_0.4|total_w_m2 | 163.9 | 162.6 | -0.8% |
| school|stlouis | htg_99.6|total_w_m2 | 124.0 | 124.0 | +0.0% |
| school|tampa | clg_db_0.4|total_w_m2 | 153.1 | 152.3 | -0.5% |
| school|tampa | clg_dp_0.4|total_w_m2 | 168.8 | 167.8 | -0.6% |
| school|tampa | htg_99.6|total_w_m2 | 61.9 | 61.9 | -0.1% |
| school|tucson | clg_db_0.4|total_w_m2 | 100.3 | 98.3 | -2.0% |
| school|tucson | clg_dp_0.4|total_w_m2 | 111.2 | 109.2 | -1.8% |
| school|tucson | htg_99.6|total_w_m2 | 69.6 | 69.5 | -0.1% |
| school|washington | clg_db_0.4|total_w_m2 | 147.9 | 146.8 | -0.7% |
| school|washington | clg_dp_0.4|total_w_m2 | 156.5 | 155.7 | -0.5% |
| school|washington | htg_99.6|total_w_m2 | 102.7 | 102.5 | -0.2% |

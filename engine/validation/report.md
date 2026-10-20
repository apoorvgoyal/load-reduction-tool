# Surrogate validation against EnergyPlus

Generated 2026-10-20T17:48:08+00:00 by `engine/validate.py`. Each model is tested on EnergyPlus runs it was not trained on (independent Latin-hypercube sample, seed 9001, plus the building type default).

Pass rule: worst 95th-percentile absolute error on the peaks the page reports <= 5.0%. Those are the governing cooling peak for each percentile (the larger of the dry-bulb and dew-point days, as EnergyPlus and the model each see it) and the heating peak for each percentile. "Any single day" judges every design day on its own value, including mild days that never govern and can sit near zero; it is shown for information. Peaks are one-hour averages. A peak below 10% of the case's design load (larger of 0.4% cooling and 99.6% heating) is judged as a share of that 10%, not of itself.

| Model | Test runs | Worst P95, reported peaks | Which peak | Cooling 0.4% | Heating 99.6% | Any single day (info) | Result |
|---|---|---|---|---|---|---|---|
| school|albuquerque | 51 | 9.7% | cooling 0.4% | 9.7% | 0.3% | 16.4% | **FAIL** |
| school|atlanta | 51 | 1.6% | cooling 1% | 1.6% | 0.4% | 1.7% | PASS |
| school|boston | 51 | 2.2% | cooling 2% | 2.0% | 0.3% | 2.4% | PASS |
| school|buffalo | 51 | 2.9% | cooling 2% | 2.4% | 0.4% | 2.9% | PASS |
| school|chicago | 51 | 2.7% | cooling 2% | 1.9% | 0.3% | 2.6% | PASS |
| school|dallas | 51 | 2.0% | cooling 2% | 1.7% | 0.3% | 2.3% | PASS |
| school|denver | 51 | 8.6% | cooling 0.4% | 8.6% | 0.5% | 37.6% | **FAIL** |
| school|elpaso | 51 | 2.9% | cooling 2% | 2.7% | 0.5% | 3.3% | PASS |
| school|fairbanks | 51 | 4.5% | cooling 0.4% | 4.5% | 0.4% | 70.0% | PASS |
| school|greatfalls | 51 | 7.2% | cooling 0.4% | 7.2% | 0.3% | 24.0% | **FAIL** |
| school|honolulu | 51 | 2.7% | cooling 2% | 2.5% | 1.1% | 2.7% | PASS |
| school|houston | 51 | 1.6% | cooling 1% | 1.6% | 0.4% | 2.3% | PASS |
| school|intlfalls | 51 | 3.5% | cooling 2% | 1.8% | 0.4% | 4.1% | PASS |
| school|kansascity | 51 | 2.7% | cooling 2% | 2.2% | 0.4% | 2.7% | PASS |
| school|losangeles | 51 | 10.4% | cooling 2% | 2.4% | 0.3% | 11.3% | **FAIL** |
| school|miami | 51 | 1.3% | cooling 2% | 1.3% | 0.5% | 1.4% | PASS |
| school|newyork | 51 | 3.2% | cooling 2% | 2.6% | 0.3% | 3.2% | PASS |
| school|phoenix | 51 | 2.0% | cooling 2% | 2.0% | 0.4% | 2.5% | PASS |
| school|portangeles | 51 | 5.2% | cooling 2% | 4.7% | 0.4% | 100.0% | **FAIL** |
| school|rochestermn | 51 | 2.0% | cooling 2% | 1.6% | 0.4% | 2.2% | PASS |
| school|sandiego | 51 | 2.4% | cooling 2% | 2.0% | 0.6% | 2.6% | PASS |
| school|sanfrancisco | 51 | 10.2% | cooling 0.4% | 10.2% | 0.5% | 39.4% | **FAIL** |
| school|seattle | 51 | 4.9% | cooling 1% | 4.1% | 0.4% | 28.8% | PASS |
| school|stlouis | 51 | 1.8% | cooling 2% | 1.8% | 0.4% | 2.1% | PASS |
| school|tampa | 51 | 2.0% | cooling 2% | 1.9% | 0.3% | 2.0% | PASS |
| school|tucson | 51 | 3.4% | cooling 0.4% | 3.4% | 0.4% | 4.6% | PASS |
| school|washington | 51 | 2.7% | cooling 2% | 2.5% | 0.4% | 2.7% | PASS |

## Type defaults (prediction vs EnergyPlus)

| Model | Output | EnergyPlus W/m² | Surrogate W/m² | Error |
|---|---|---|---|---|
| school|albuquerque | clg_db_0.4|total_w_m2 | 80.0 | 79.3 | -0.9% |
| school|albuquerque | clg_dp_0.4|total_w_m2 | 80.4 | 84.7 | +5.3% |
| school|albuquerque | htg_99.6|total_w_m2 | 84.1 | 84.0 | -0.1% |
| school|atlanta | clg_db_0.4|total_w_m2 | 134.6 | 133.1 | -1.1% |
| school|atlanta | clg_dp_0.4|total_w_m2 | 140.4 | 138.7 | -1.3% |
| school|atlanta | htg_99.6|total_w_m2 | 93.0 | 92.9 | -0.1% |
| school|boston | clg_db_0.4|total_w_m2 | 127.9 | 125.8 | -1.6% |
| school|boston | clg_dp_0.4|total_w_m2 | 138.4 | 135.8 | -1.8% |
| school|boston | htg_99.6|total_w_m2 | 118.1 | 117.9 | -0.2% |
| school|buffalo | clg_db_0.4|total_w_m2 | 116.8 | 114.9 | -1.7% |
| school|buffalo | clg_dp_0.4|total_w_m2 | 132.8 | 130.5 | -1.7% |
| school|buffalo | htg_99.6|total_w_m2 | 124.4 | 124.4 | -0.0% |
| school|chicago | clg_db_0.4|total_w_m2 | 139.0 | 136.8 | -1.5% |
| school|chicago | clg_dp_0.4|total_w_m2 | 153.8 | 151.0 | -1.8% |
| school|chicago | htg_99.6|total_w_m2 | 136.9 | 136.6 | -0.2% |
| school|dallas | clg_db_0.4|total_w_m2 | 137.8 | 136.5 | -0.9% |
| school|dallas | clg_dp_0.4|total_w_m2 | 151.3 | 150.4 | -0.6% |
| school|dallas | htg_99.6|total_w_m2 | 96.2 | 96.2 | -0.0% |
| school|denver | clg_db_0.4|total_w_m2 | 78.6 | 79.0 | +0.5% |
| school|denver | clg_dp_0.4|total_w_m2 | 79.8 | 81.3 | +1.9% |
| school|denver | htg_99.6|total_w_m2 | 109.3 | 109.2 | -0.1% |
| school|elpaso | clg_db_0.4|total_w_m2 | 90.0 | 90.5 | +0.6% |
| school|elpaso | clg_dp_0.4|total_w_m2 | 100.4 | 101.3 | +1.0% |
| school|elpaso | htg_99.6|total_w_m2 | 80.9 | 80.8 | -0.1% |
| school|fairbanks | clg_db_0.4|total_w_m2 | 66.3 | 66.0 | -0.4% |
| school|fairbanks | clg_dp_0.4|total_w_m2 | 61.2 | 59.5 | -2.8% |
| school|fairbanks | htg_99.6|total_w_m2 | 206.0 | 206.2 | +0.1% |
| school|greatfalls | clg_db_0.4|total_w_m2 | 77.5 | 76.4 | -1.4% |
| school|greatfalls | clg_dp_0.4|total_w_m2 | 66.9 | 64.1 | -4.3% |
| school|greatfalls | htg_99.6|total_w_m2 | 145.0 | 145.0 | -0.0% |
| school|honolulu | clg_db_0.4|total_w_m2 | 128.3 | 126.9 | -1.1% |
| school|honolulu | clg_dp_0.4|total_w_m2 | 142.4 | 140.6 | -1.3% |
| school|honolulu | htg_99.6|total_w_m2 | 17.9 | 17.8 | -0.6% |
| school|houston | clg_db_0.4|total_w_m2 | 148.7 | 148.2 | -0.3% |
| school|houston | clg_dp_0.4|total_w_m2 | 160.7 | 159.9 | -0.5% |
| school|houston | htg_99.6|total_w_m2 | 80.0 | 80.0 | -0.1% |
| school|intlfalls | clg_db_0.4|total_w_m2 | 112.6 | 110.7 | -1.7% |
| school|intlfalls | clg_dp_0.4|total_w_m2 | 124.4 | 122.1 | -1.8% |
| school|intlfalls | htg_99.6|total_w_m2 | 173.1 | 173.0 | -0.0% |
| school|kansascity | clg_db_0.4|total_w_m2 | 151.1 | 149.9 | -0.9% |
| school|kansascity | clg_dp_0.4|total_w_m2 | 166.4 | 165.2 | -0.7% |
| school|kansascity | htg_99.6|total_w_m2 | 129.9 | 129.9 | -0.0% |
| school|losangeles | clg_db_0.4|total_w_m2 | 72.7 | 72.5 | -0.3% |
| school|losangeles | clg_dp_0.4|total_w_m2 | 96.5 | 95.5 | -1.0% |
| school|losangeles | htg_99.6|total_w_m2 | 49.7 | 49.6 | -0.3% |
| school|miami | clg_db_0.4|total_w_m2 | 153.4 | 152.0 | -0.9% |
| school|miami | clg_dp_0.4|total_w_m2 | 165.3 | 163.8 | -0.9% |
| school|miami | htg_99.6|total_w_m2 | 44.4 | 44.3 | -0.2% |
| school|newyork | clg_db_0.4|total_w_m2 | 130.3 | 128.6 | -1.3% |
| school|newyork | clg_dp_0.4|total_w_m2 | 145.7 | 143.6 | -1.4% |
| school|newyork | htg_99.6|total_w_m2 | 109.7 | 109.6 | -0.1% |
| school|phoenix | clg_db_0.4|total_w_m2 | 115.2 | 113.8 | -1.2% |
| school|phoenix | clg_dp_0.4|total_w_m2 | 131.1 | 128.8 | -1.7% |
| school|phoenix | htg_99.6|total_w_m2 | 60.1 | 60.0 | -0.1% |
| school|portangeles | clg_db_0.4|total_w_m2 | 69.4 | 68.8 | -0.9% |
| school|portangeles | clg_dp_0.4|total_w_m2 | 59.0 | 53.8 | -8.9% |
| school|portangeles | htg_99.6|total_w_m2 | 85.4 | 85.3 | -0.2% |
| school|rochestermn | clg_db_0.4|total_w_m2 | 132.5 | 130.9 | -1.2% |
| school|rochestermn | clg_dp_0.4|total_w_m2 | 148.0 | 146.2 | -1.2% |
| school|rochestermn | htg_99.6|total_w_m2 | 152.6 | 152.7 | +0.0% |
| school|sandiego | clg_db_0.4|total_w_m2 | 91.5 | 90.3 | -1.3% |
| school|sandiego | clg_dp_0.4|total_w_m2 | 115.6 | 114.2 | -1.2% |
| school|sandiego | htg_99.6|total_w_m2 | 49.3 | 49.2 | -0.2% |
| school|sanfrancisco | clg_db_0.4|total_w_m2 | 65.2 | 65.2 | -0.0% |
| school|sanfrancisco | clg_dp_0.4|total_w_m2 | 60.1 | 65.8 | +9.4% |
| school|sanfrancisco | htg_99.6|total_w_m2 | 60.6 | 60.5 | -0.2% |
| school|seattle | clg_db_0.4|total_w_m2 | 82.6 | 80.8 | -2.2% |
| school|seattle | clg_dp_0.4|total_w_m2 | 70.4 | 71.5 | +1.5% |
| school|seattle | htg_99.6|total_w_m2 | 86.0 | 86.0 | -0.1% |
| school|stlouis | clg_db_0.4|total_w_m2 | 154.3 | 153.3 | -0.6% |
| school|stlouis | clg_dp_0.4|total_w_m2 | 163.7 | 162.5 | -0.8% |
| school|stlouis | htg_99.6|total_w_m2 | 124.0 | 124.0 | +0.0% |
| school|tampa | clg_db_0.4|total_w_m2 | 152.9 | 152.2 | -0.5% |
| school|tampa | clg_dp_0.4|total_w_m2 | 168.6 | 167.6 | -0.6% |
| school|tampa | htg_99.6|total_w_m2 | 61.9 | 61.9 | -0.1% |
| school|tucson | clg_db_0.4|total_w_m2 | 100.0 | 98.2 | -1.8% |
| school|tucson | clg_dp_0.4|total_w_m2 | 110.8 | 108.6 | -2.0% |
| school|tucson | htg_99.6|total_w_m2 | 69.6 | 69.5 | -0.1% |
| school|washington | clg_db_0.4|total_w_m2 | 147.7 | 146.6 | -0.7% |
| school|washington | clg_dp_0.4|total_w_m2 | 156.3 | 155.5 | -0.5% |
| school|washington | htg_99.6|total_w_m2 | 102.7 | 102.7 | +0.0% |

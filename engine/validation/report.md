# Surrogate validation against EnergyPlus

Generated 2026-10-20T18:43:34+00:00 by `engine/validate.py`. Each model is tested on EnergyPlus runs it was not trained on (independent Latin-hypercube sample, seed 9001, plus the building type default).

Pass rule: worst 95th-percentile absolute error on the peaks the page reports <= 5.0%. Those are the governing cooling peak for each percentile (the larger of the dry-bulb and dew-point days, as EnergyPlus and the model each see it) and the heating peak for each percentile. "Any single day" judges every design day on its own value, including mild days that never govern and can sit near zero; it is shown for information. Peaks are one-hour averages. A peak below 10% of the case's design load (larger of 0.4% cooling and 99.6% heating) is judged as a share of that 10%, not of itself.

| Model | Test runs | Worst P95, reported peaks | Which peak | Cooling 0.4% | Heating 99.6% | Any single day (info) | Result |
|---|---|---|---|---|---|---|---|
| healthcare|albuquerque | 51 | 8.7% | cooling 0.4% | 8.7% | 0.4% | 20.8% | **FAIL** |
| healthcare|atlanta | 51 | 1.4% | cooling 1% | 1.3% | 0.6% | 2.2% | PASS |
| healthcare|boston | 51 | 2.5% | cooling 2% | 2.1% | 0.4% | 2.5% | PASS |
| healthcare|buffalo | 51 | 3.0% | cooling 2% | 1.8% | 0.3% | 3.0% | PASS |
| healthcare|chicago | 51 | 2.8% | cooling 2% | 1.6% | 0.5% | 2.8% | PASS |
| healthcare|dallas | 51 | 2.1% | cooling 2% | 1.8% | 0.4% | 3.0% | PASS |
| healthcare|denver | 51 | 8.8% | cooling 1% | 8.7% | 0.6% | 82.4% | **FAIL** |
| healthcare|elpaso | 51 | 6.4% | cooling 1% | 6.3% | 0.4% | 9.7% | **FAIL** |
| healthcare|fairbanks | 51 | 6.2% | cooling 1% | 5.2% | 0.2% | 84.0% | **FAIL** |
| healthcare|greatfalls | 51 | 4.9% | cooling 0.4% | 4.9% | 0.4% | 37.4% | PASS |
| healthcare|honolulu | 51 | 2.4% | cooling 0.4% | 2.4% | 0.9% | 2.6% | PASS |
| healthcare|houston | 51 | 1.3% | cooling 2% | 1.3% | 0.3% | 1.4% | PASS |
| healthcare|intlfalls | 51 | 9.0% | cooling 1% | 2.7% | 0.4% | 18.4% | **FAIL** |
| healthcare|kansascity | 51 | 1.8% | cooling 0.4% | 1.8% | 0.6% | 3.7% | PASS |
| healthcare|losangeles | 51 | 12.6% | cooling 2% | 3.1% | 0.7% | 16.4% | **FAIL** |
| healthcare|miami | 51 | 2.3% | cooling 2% | 2.1% | 0.7% | 2.7% | PASS |
| healthcare|newyork | 51 | 2.1% | cooling 2% | 2.0% | 0.3% | 2.3% | PASS |
| healthcare|phoenix | 51 | 1.5% | cooling 1% | 1.4% | 0.6% | 1.7% | PASS |
| healthcare|portangeles | 51 | 6.1% | cooling 2% | 2.8% | 0.3% | 123.7% | **FAIL** |
| healthcare|rochestermn | 51 | 3.4% | cooling 2% | 2.2% | 0.4% | 3.8% | PASS |
| healthcare|sandiego | 51 | 3.0% | cooling 2% | 2.5% | 0.5% | 3.0% | PASS |
| healthcare|sanfrancisco | 51 | 16.0% | cooling 0.4% | 16.0% | 0.5% | 90.0% | **FAIL** |
| healthcare|seattle | 51 | 5.1% | cooling 0.4% | 5.1% | 0.5% | 32.1% | **FAIL** |
| healthcare|stlouis | 51 | 1.4% | cooling 2% | 1.4% | 0.3% | 1.5% | PASS |
| healthcare|tampa | 51 | 1.9% | cooling 0.4% | 1.9% | 0.6% | 1.9% | PASS |
| healthcare|tucson | 51 | 2.6% | cooling 1% | 2.6% | 0.7% | 3.4% | PASS |
| healthcare|washington | 51 | 1.9% | cooling 1% | 1.6% | 0.3% | 2.3% | PASS |

## Type defaults (prediction vs EnergyPlus)

| Model | Output | EnergyPlus W/m² | Surrogate W/m² | Error |
|---|---|---|---|---|
| healthcare|albuquerque | clg_db_0.4|total_w_m2 | 73.6 | 73.8 | +0.2% |
| healthcare|albuquerque | clg_dp_0.4|total_w_m2 | 68.9 | 72.4 | +5.2% |
| healthcare|albuquerque | htg_99.6|total_w_m2 | 82.6 | 82.6 | -0.0% |
| healthcare|atlanta | clg_db_0.4|total_w_m2 | 120.7 | 119.7 | -0.8% |
| healthcare|atlanta | clg_dp_0.4|total_w_m2 | 127.0 | 126.3 | -0.5% |
| healthcare|atlanta | htg_99.6|total_w_m2 | 91.5 | 91.2 | -0.3% |
| healthcare|boston | clg_db_0.4|total_w_m2 | 114.7 | 113.9 | -0.7% |
| healthcare|boston | clg_dp_0.4|total_w_m2 | 124.8 | 123.9 | -0.7% |
| healthcare|boston | htg_99.6|total_w_m2 | 115.1 | 115.0 | -0.1% |
| healthcare|buffalo | clg_db_0.4|total_w_m2 | 104.0 | 102.8 | -1.2% |
| healthcare|buffalo | clg_dp_0.4|total_w_m2 | 119.4 | 118.1 | -1.2% |
| healthcare|buffalo | htg_99.6|total_w_m2 | 121.0 | 120.9 | -0.1% |
| healthcare|chicago | clg_db_0.4|total_w_m2 | 124.8 | 123.0 | -1.4% |
| healthcare|chicago | clg_dp_0.4|total_w_m2 | 139.0 | 137.1 | -1.4% |
| healthcare|chicago | htg_99.6|total_w_m2 | 132.9 | 132.8 | -0.1% |
| healthcare|dallas | clg_db_0.4|total_w_m2 | 123.8 | 123.8 | +0.0% |
| healthcare|dallas | clg_dp_0.4|total_w_m2 | 137.5 | 137.2 | -0.2% |
| healthcare|dallas | htg_99.6|total_w_m2 | 94.7 | 94.7 | +0.0% |
| healthcare|denver | clg_db_0.4|total_w_m2 | 72.2 | 70.4 | -2.5% |
| healthcare|denver | clg_dp_0.4|total_w_m2 | 68.0 | 67.7 | -0.4% |
| healthcare|denver | htg_99.6|total_w_m2 | 106.4 | 106.2 | -0.2% |
| healthcare|elpaso | clg_db_0.4|total_w_m2 | 81.4 | 81.2 | -0.2% |
| healthcare|elpaso | clg_dp_0.4|total_w_m2 | 88.9 | 87.4 | -1.7% |
| healthcare|elpaso | htg_99.6|total_w_m2 | 79.7 | 79.6 | -0.1% |
| healthcare|fairbanks | clg_db_0.4|total_w_m2 | 59.7 | 58.9 | -1.3% |
| healthcare|fairbanks | clg_dp_0.4|total_w_m2 | 51.7 | 52.7 | +2.0% |
| healthcare|fairbanks | htg_99.6|total_w_m2 | 198.0 | 198.1 | +0.0% |
| healthcare|greatfalls | clg_db_0.4|total_w_m2 | 71.1 | 69.4 | -2.3% |
| healthcare|greatfalls | clg_dp_0.4|total_w_m2 | 56.5 | 56.1 | -0.7% |
| healthcare|greatfalls | htg_99.6|total_w_m2 | 140.2 | 140.1 | -0.1% |
| healthcare|honolulu | clg_db_0.4|total_w_m2 | 115.4 | 115.7 | +0.2% |
| healthcare|honolulu | clg_dp_0.4|total_w_m2 | 129.2 | 129.5 | +0.2% |
| healthcare|honolulu | htg_99.6|total_w_m2 | 20.4 | 20.3 | -0.5% |
| healthcare|houston | clg_db_0.4|total_w_m2 | 134.3 | 133.6 | -0.5% |
| healthcare|houston | clg_dp_0.4|total_w_m2 | 146.4 | 145.6 | -0.5% |
| healthcare|houston | htg_99.6|total_w_m2 | 79.4 | 79.2 | -0.2% |
| healthcare|intlfalls | clg_db_0.4|total_w_m2 | 99.8 | 98.1 | -1.8% |
| healthcare|intlfalls | clg_dp_0.4|total_w_m2 | 111.4 | 109.4 | -1.8% |
| healthcare|intlfalls | htg_99.6|total_w_m2 | 166.9 | 167.1 | +0.1% |
| healthcare|kansascity | clg_db_0.4|total_w_m2 | 136.1 | 135.3 | -0.6% |
| healthcare|kansascity | clg_dp_0.4|total_w_m2 | 150.7 | 149.8 | -0.5% |
| healthcare|kansascity | htg_99.6|total_w_m2 | 126.4 | 126.2 | -0.2% |
| healthcare|losangeles | clg_db_0.4|total_w_m2 | 63.1 | 62.3 | -1.2% |
| healthcare|losangeles | clg_dp_0.4|total_w_m2 | 86.6 | 85.6 | -1.1% |
| healthcare|losangeles | htg_99.6|total_w_m2 | 50.5 | 50.3 | -0.4% |
| healthcare|miami | clg_db_0.4|total_w_m2 | 138.9 | 137.9 | -0.7% |
| healthcare|miami | clg_dp_0.4|total_w_m2 | 150.3 | 149.0 | -0.9% |
| healthcare|miami | htg_99.6|total_w_m2 | 45.5 | 45.4 | -0.3% |
| healthcare|newyork | clg_db_0.4|total_w_m2 | 117.0 | 115.3 | -1.5% |
| healthcare|newyork | clg_dp_0.4|total_w_m2 | 131.8 | 129.9 | -1.4% |
| healthcare|newyork | htg_99.6|total_w_m2 | 107.3 | 107.3 | -0.0% |
| healthcare|phoenix | clg_db_0.4|total_w_m2 | 104.4 | 103.9 | -0.4% |
| healthcare|phoenix | clg_dp_0.4|total_w_m2 | 118.4 | 117.6 | -0.7% |
| healthcare|phoenix | htg_99.6|total_w_m2 | 60.4 | 60.2 | -0.2% |
| healthcare|portangeles | clg_db_0.4|total_w_m2 | 60.0 | 59.3 | -1.2% |
| healthcare|portangeles | clg_dp_0.4|total_w_m2 | 50.9 | 50.5 | -0.6% |
| healthcare|portangeles | htg_99.6|total_w_m2 | 84.1 | 84.0 | -0.1% |
| healthcare|rochestermn | clg_db_0.4|total_w_m2 | 118.4 | 116.7 | -1.5% |
| healthcare|rochestermn | clg_dp_0.4|total_w_m2 | 133.3 | 131.7 | -1.2% |
| healthcare|rochestermn | htg_99.6|total_w_m2 | 147.6 | 147.6 | +0.0% |
| healthcare|sandiego | clg_db_0.4|total_w_m2 | 80.8 | 80.4 | -0.6% |
| healthcare|sandiego | clg_dp_0.4|total_w_m2 | 104.0 | 103.4 | -0.6% |
| healthcare|sandiego | htg_99.6|total_w_m2 | 50.1 | 50.0 | -0.2% |
| healthcare|sanfrancisco | clg_db_0.4|total_w_m2 | 56.4 | 56.0 | -0.6% |
| healthcare|sanfrancisco | clg_dp_0.4|total_w_m2 | 53.2 | 49.0 | -7.8% |
| healthcare|sanfrancisco | htg_99.6|total_w_m2 | 60.9 | 60.8 | -0.1% |
| healthcare|seattle | clg_db_0.4|total_w_m2 | 72.3 | 71.1 | -1.7% |
| healthcare|seattle | clg_dp_0.4|total_w_m2 | 61.8 | 60.4 | -2.3% |
| healthcare|seattle | htg_99.6|total_w_m2 | 84.8 | 84.8 | -0.0% |
| healthcare|stlouis | clg_db_0.4|total_w_m2 | 139.2 | 137.7 | -1.1% |
| healthcare|stlouis | clg_dp_0.4|total_w_m2 | 148.3 | 146.6 | -1.1% |
| healthcare|stlouis | htg_99.6|total_w_m2 | 120.8 | 120.7 | -0.1% |
| healthcare|tampa | clg_db_0.4|total_w_m2 | 138.3 | 138.1 | -0.2% |
| healthcare|tampa | clg_dp_0.4|total_w_m2 | 153.4 | 152.9 | -0.3% |
| healthcare|tampa | htg_99.6|total_w_m2 | 62.2 | 62.1 | -0.2% |
| healthcare|tucson | clg_db_0.4|total_w_m2 | 92.9 | 93.0 | +0.1% |
| healthcare|tucson | clg_dp_0.4|total_w_m2 | 99.3 | 98.5 | -0.9% |
| healthcare|tucson | htg_99.6|total_w_m2 | 69.2 | 69.1 | -0.2% |
| healthcare|washington | clg_db_0.4|total_w_m2 | 133.2 | 131.9 | -1.0% |
| healthcare|washington | clg_dp_0.4|total_w_m2 | 141.7 | 139.8 | -1.3% |
| healthcare|washington | htg_99.6|total_w_m2 | 100.6 | 100.6 | -0.0% |

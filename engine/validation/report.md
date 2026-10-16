# Surrogate validation against EnergyPlus

Generated 2026-10-16T18:49:36+00:00 by `engine/validate.py`. Each model is tested on EnergyPlus runs it was not trained on (independent Latin-hypercube sample, seed 9001, plus the building type default).

Pass rule: worst 95th-percentile absolute error across all design-day block totals <= 5.0%.

| Model | Test runs | Worst P95 (block totals) | Worst output | Cooling 0.4%% DB P95 | Heating 99.6%% P95 | Result |
|---|---|---|---|---|---|---|
| lab|albuquerque | 51 | 35.1% | clg_dp_0.4|total_w_m2 | 6.9% | 0.2% | **FAIL** |
| lab|atlanta | 51 | 4.2% | clg_dp_2|total_w_m2 | 0.8% | 0.2% | PASS |
| lab|boston | 51 | 6.2% | clg_dp_2|total_w_m2 | 1.2% | 0.2% | **FAIL** |
| lab|buffalo | 51 | 7.6% | clg_dp_2|total_w_m2 | 1.3% | 0.2% | **FAIL** |
| lab|chicago | 51 | 7.7% | clg_dp_2|total_w_m2 | 1.2% | 0.2% | **FAIL** |
| lab|dallas | 51 | 2.9% | clg_dp_2|total_w_m2 | 0.6% | 0.2% | PASS |
| lab|denver | 51 | 40.5% | clg_dp_1|total_w_m2 | 4.8% | 0.1% | **FAIL** |
| lab|elpaso | 51 | 18.0% | clg_dp_0.4|total_w_m2 | 1.1% | 0.2% | **FAIL** |
| lab|fairbanks | 51 | 97.1% | clg_dp_2|total_w_m2 | 2.7% | 0.1% | **FAIL** |
| lab|greatfalls | 51 | 96.4% | clg_dp_0.4|total_w_m2 | 4.2% | 0.2% | **FAIL** |
| lab|honolulu | 51 | 3.0% | clg_dp_2|total_w_m2 | 1.5% | 0.7% | PASS |
| lab|houston | 51 | 4.4% | clg_dp_2|total_w_m2 | 1.2% | 0.3% | PASS |
| lab|intlfalls | 51 | 13.9% | clg_dp_2|total_w_m2 | 0.9% | 0.2% | **FAIL** |
| lab|kansascity | 51 | 3.4% | clg_dp_2|total_w_m2 | 1.0% | 0.1% | PASS |
| lab|losangeles | 51 | 10.2% | clg_dp_2|total_w_m2 | 1.9% | 0.3% | **FAIL** |
| lab|miami | 51 | 2.9% | clg_dp_2|total_w_m2 | 1.8% | 0.2% | PASS |
| lab|newyork | 51 | 8.7% | clg_dp_2|total_w_m2 | 1.8% | 0.2% | **FAIL** |
| lab|phoenix | 51 | 6.0% | clg_dp_1|total_w_m2 | 0.8% | 0.2% | **FAIL** |
| lab|portangeles | 51 | 100.0% | clg_dp_1|total_w_m2 | 1.3% | 0.2% | **FAIL** |
| lab|rochestermn | 51 | 11.5% | clg_dp_2|total_w_m2 | 2.6% | 0.3% | **FAIL** |
| lab|sandiego | 51 | 14.8% | clg_dp_2|total_w_m2 | 0.8% | 0.3% | **FAIL** |
| lab|sanfrancisco | 51 | 117.0% | clg_dp_2|total_w_m2 | 2.2% | 0.2% | **FAIL** |
| lab|seattle | 51 | 65.8% | clg_dp_0.4|total_w_m2 | 1.1% | 0.2% | **FAIL** |
| lab|stlouis | 51 | 1.7% | clg_dp_2|total_w_m2 | 1.5% | 0.2% | PASS |
| lab|tampa | 51 | 2.4% | clg_db_2|total_w_m2 | 1.8% | 0.3% | PASS |
| lab|tucson | 51 | 9.8% | clg_dp_1|total_w_m2 | 0.6% | 0.3% | **FAIL** |
| lab|washington | 51 | 4.2% | clg_dp_1|total_w_m2 | 0.7% | 0.2% | PASS |

## Type defaults (prediction vs EnergyPlus)

| Model | Output | EnergyPlus W/m² | Surrogate W/m² | Error |
|---|---|---|---|---|
| lab|albuquerque | clg_db_0.4|total_w_m2 | 171.1 | 171.4 | +0.2% |
| lab|albuquerque | clg_dp_0.4|total_w_m2 | 170.6 | 164.9 | -3.3% |
| lab|albuquerque | htg_99.6|total_w_m2 | 206.9 | 206.7 | -0.1% |
| lab|atlanta | clg_db_0.4|total_w_m2 | 312.7 | 311.4 | -0.4% |
| lab|atlanta | clg_dp_0.4|total_w_m2 | 338.8 | 336.2 | -0.8% |
| lab|atlanta | htg_99.6|total_w_m2 | 229.0 | 228.9 | -0.0% |
| lab|boston | clg_db_0.4|total_w_m2 | 291.0 | 289.5 | -0.5% |
| lab|boston | clg_dp_0.4|total_w_m2 | 324.9 | 322.2 | -0.8% |
| lab|boston | htg_99.6|total_w_m2 | 296.3 | 296.2 | -0.0% |
| lab|buffalo | clg_db_0.4|total_w_m2 | 261.5 | 259.2 | -0.9% |
| lab|buffalo | clg_dp_0.4|total_w_m2 | 309.7 | 299.4 | -3.3% |
| lab|buffalo | htg_99.6|total_w_m2 | 311.8 | 311.6 | -0.1% |
| lab|chicago | clg_db_0.4|total_w_m2 | 319.8 | 318.5 | -0.4% |
| lab|chicago | clg_dp_0.4|total_w_m2 | 364.6 | 364.3 | -0.1% |
| lab|chicago | htg_99.6|total_w_m2 | 343.1 | 342.9 | -0.1% |
| lab|dallas | clg_db_0.4|total_w_m2 | 316.0 | 314.9 | -0.4% |
| lab|dallas | clg_dp_0.4|total_w_m2 | 366.5 | 363.9 | -0.7% |
| lab|dallas | htg_99.6|total_w_m2 | 235.4 | 235.4 | -0.0% |
| lab|denver | clg_db_0.4|total_w_m2 | 167.3 | 164.8 | -1.5% |
| lab|denver | clg_dp_0.4|total_w_m2 | 166.6 | 178.3 | +7.1% |
| lab|denver | htg_99.6|total_w_m2 | 271.5 | 271.5 | +0.0% |
| lab|elpaso | clg_db_0.4|total_w_m2 | 196.4 | 195.8 | -0.3% |
| lab|elpaso | clg_dp_0.4|total_w_m2 | 232.7 | 228.5 | -1.8% |
| lab|elpaso | htg_99.6|total_w_m2 | 198.4 | 198.2 | -0.1% |
| lab|fairbanks | clg_db_0.4|total_w_m2 | 128.3 | 127.7 | -0.5% |
| lab|fairbanks | clg_dp_0.4|total_w_m2 | 110.9 | 110.6 | -0.3% |
| lab|fairbanks | htg_99.6|total_w_m2 | 524.6 | 524.9 | +0.0% |
| lab|greatfalls | clg_db_0.4|total_w_m2 | 164.4 | 163.1 | -0.8% |
| lab|greatfalls | clg_dp_0.4|total_w_m2 | 132.6 | 123.7 | -6.8% |
| lab|greatfalls | htg_99.6|total_w_m2 | 363.8 | 363.8 | +0.0% |
| lab|honolulu | clg_db_0.4|total_w_m2 | 300.1 | 298.3 | -0.6% |
| lab|honolulu | clg_dp_0.4|total_w_m2 | 346.6 | 344.7 | -0.5% |
| lab|honolulu | htg_99.6|total_w_m2 | 43.2 | 43.1 | -0.2% |
| lab|houston | clg_db_0.4|total_w_m2 | 350.6 | 350.1 | -0.2% |
| lab|houston | clg_dp_0.4|total_w_m2 | 394.9 | 393.9 | -0.3% |
| lab|houston | htg_99.6|total_w_m2 | 196.6 | 196.6 | -0.0% |
| lab|intlfalls | clg_db_0.4|total_w_m2 | 245.9 | 244.2 | -0.7% |
| lab|intlfalls | clg_dp_0.4|total_w_m2 | 282.3 | 274.2 | -2.9% |
| lab|intlfalls | htg_99.6|total_w_m2 | 437.9 | 437.8 | -0.0% |
| lab|kansascity | clg_db_0.4|total_w_m2 | 351.0 | 350.7 | -0.1% |
| lab|kansascity | clg_dp_0.4|total_w_m2 | 398.5 | 397.3 | -0.3% |
| lab|kansascity | htg_99.6|total_w_m2 | 322.9 | 323.0 | +0.0% |
| lab|losangeles | clg_db_0.4|total_w_m2 | 149.1 | 149.4 | +0.2% |
| lab|losangeles | clg_dp_0.4|total_w_m2 | 223.3 | 221.4 | -0.8% |
| lab|losangeles | htg_99.6|total_w_m2 | 122.8 | 122.8 | -0.1% |
| lab|miami | clg_db_0.4|total_w_m2 | 366.4 | 364.0 | -0.6% |
| lab|miami | clg_dp_0.4|total_w_m2 | 405.6 | 402.5 | -0.8% |
| lab|miami | htg_99.6|total_w_m2 | 108.4 | 108.3 | -0.1% |
| lab|newyork | clg_db_0.4|total_w_m2 | 297.4 | 296.3 | -0.4% |
| lab|newyork | clg_dp_0.4|total_w_m2 | 345.3 | 339.8 | -1.6% |
| lab|newyork | htg_99.6|total_w_m2 | 273.2 | 273.2 | -0.0% |
| lab|phoenix | clg_db_0.4|total_w_m2 | 255.5 | 255.3 | -0.1% |
| lab|phoenix | clg_dp_0.4|total_w_m2 | 311.5 | 303.2 | -2.7% |
| lab|phoenix | htg_99.6|total_w_m2 | 146.4 | 146.3 | -0.1% |
| lab|portangeles | clg_db_0.4|total_w_m2 | 132.4 | 131.2 | -0.9% |
| lab|portangeles | clg_dp_0.4|total_w_m2 | 114.0 | 109.2 | -4.3% |
| lab|portangeles | htg_99.6|total_w_m2 | 214.9 | 214.8 | -0.0% |
| lab|rochestermn | clg_db_0.4|total_w_m2 | 303.6 | 303.6 | -0.0% |
| lab|rochestermn | clg_dp_0.4|total_w_m2 | 349.5 | 346.1 | -1.0% |
| lab|rochestermn | htg_99.6|total_w_m2 | 384.4 | 384.3 | -0.0% |
| lab|sandiego | clg_db_0.4|total_w_m2 | 200.6 | 200.1 | -0.3% |
| lab|sandiego | clg_dp_0.4|total_w_m2 | 272.3 | 263.1 | -3.4% |
| lab|sandiego | htg_99.6|total_w_m2 | 121.6 | 121.5 | -0.1% |
| lab|sanfrancisco | clg_db_0.4|total_w_m2 | 130.7 | 130.2 | -0.4% |
| lab|sanfrancisco | clg_dp_0.4|total_w_m2 | 131.6 | 123.9 | -5.9% |
| lab|sanfrancisco | htg_99.6|total_w_m2 | 149.9 | 149.8 | -0.1% |
| lab|seattle | clg_db_0.4|total_w_m2 | 166.2 | 166.1 | -0.1% |
| lab|seattle | clg_dp_0.4|total_w_m2 | 144.7 | 136.6 | -5.6% |
| lab|seattle | htg_99.6|total_w_m2 | 214.5 | 214.4 | -0.0% |
| lab|stlouis | clg_db_0.4|total_w_m2 | 359.3 | 357.1 | -0.6% |
| lab|stlouis | clg_dp_0.4|total_w_m2 | 390.8 | 389.8 | -0.3% |
| lab|stlouis | htg_99.6|total_w_m2 | 308.3 | 308.3 | +0.0% |
| lab|tampa | clg_db_0.4|total_w_m2 | 363.5 | 360.0 | -1.0% |
| lab|tampa | clg_dp_0.4|total_w_m2 | 412.5 | 408.3 | -1.0% |
| lab|tampa | htg_99.6|total_w_m2 | 152.2 | 152.1 | -0.1% |
| lab|tucson | clg_db_0.4|total_w_m2 | 226.5 | 226.0 | -0.2% |
| lab|tucson | clg_dp_0.4|total_w_m2 | 262.6 | 256.7 | -2.3% |
| lab|tucson | htg_99.6|total_w_m2 | 169.7 | 169.7 | -0.0% |
| lab|washington | clg_db_0.4|total_w_m2 | 342.8 | 340.8 | -0.6% |
| lab|washington | clg_dp_0.4|total_w_m2 | 372.9 | 370.1 | -0.8% |
| lab|washington | htg_99.6|total_w_m2 | 256.0 | 255.9 | -0.0% |

# Surrogate validation against EnergyPlus

Generated 2026-10-20T19:38:54+00:00 by `engine/validate.py`. Each model is tested on EnergyPlus runs it was not trained on (independent Latin-hypercube sample, seed 9001, plus the building type default).

Pass rule: worst 95th-percentile absolute error on the peaks the page reports <= 5.0%. Those are the governing cooling peak for each percentile (the larger of the dry-bulb and dew-point days, as EnergyPlus and the model each see it) and the heating peak for each percentile. "Any single day" judges every design day on its own value, including mild days that never govern and can sit near zero; it is shown for information. Peaks are one-hour averages. A peak below 10% of the case's design load (larger of 0.4% cooling and 99.6% heating) is judged as a share of that 10%, not of itself.

| Model | Test runs | Worst P95, reported peaks | Which peak | Cooling 0.4% | Heating 99.6% | Any single day (info) | Result |
|---|---|---|---|---|---|---|---|
| stadium|albuquerque | 51 | 12.9% | cooling 2% | 11.7% | 0.4% | 40.7% | **FAIL** |
| stadium|atlanta | 51 | 2.9% | cooling 2% | 2.6% | 0.1% | 3.2% | PASS |
| stadium|boston | 51 | 3.1% | cooling 2% | 2.5% | 0.4% | 3.1% | PASS |
| stadium|buffalo | 51 | 4.1% | cooling 2% | 2.9% | 0.2% | 4.1% | PASS |
| stadium|chicago | 51 | 3.2% | cooling 2% | 2.7% | 0.2% | 3.3% | PASS |
| stadium|dallas | 51 | 3.1% | cooling 2% | 2.8% | 0.2% | 3.1% | PASS |
| stadium|denver | 51 | 11.8% | cooling 0.4% | 11.8% | 0.2% | 29.8% | **FAIL** |
| stadium|elpaso | 51 | 8.0% | cooling 1% | 7.0% | 0.4% | 9.5% | **FAIL** |
| stadium|fairbanks | 51 | 8.7% | cooling 2% | 5.5% | 0.2% | 97.3% | **FAIL** |
| stadium|greatfalls | 51 | 5.0% | cooling 0.4% | 5.0% | 0.2% | 43.1% | **FAIL** |
| stadium|honolulu | 51 | 8.7% | heating 99% | 2.8% | 6.5% | 195.2% | **FAIL** |
| stadium|houston | 51 | 2.2% | cooling 2% | 2.2% | 0.2% | 2.6% | PASS |
| stadium|intlfalls | 51 | 10.7% | cooling 2% | 3.5% | 0.2% | 12.0% | **FAIL** |
| stadium|kansascity | 51 | 3.0% | cooling 2% | 2.5% | 0.2% | 3.1% | PASS |
| stadium|losangeles | 51 | 23.6% | cooling 2% | 9.3% | 0.8% | 26.6% | **FAIL** |
| stadium|miami | 51 | 2.8% | cooling 2% | 2.6% | 0.7% | 2.8% | PASS |
| stadium|newyork | 51 | 3.4% | cooling 2% | 3.3% | 0.2% | 3.9% | PASS |
| stadium|phoenix | 51 | 3.9% | cooling 1% | 3.9% | 0.4% | 8.0% | PASS |
| stadium|portangeles | 51 | 13.7% | cooling 2% | 6.0% | 0.2% | 209.7% | **FAIL** |
| stadium|rochestermn | 51 | 4.7% | cooling 2% | 4.2% | 0.2% | 4.7% | PASS |
| stadium|sandiego | 51 | 12.6% | cooling 2% | 3.2% | 0.8% | 16.8% | **FAIL** |
| stadium|sanfrancisco | 51 | 14.3% | cooling 2% | 6.9% | 0.3% | 77.1% | **FAIL** |
| stadium|seattle | 51 | 7.2% | cooling 0.4% | 7.2% | 0.2% | 63.8% | **FAIL** |
| stadium|stlouis | 51 | 2.5% | cooling 2% | 2.2% | 0.2% | 2.4% | PASS |
| stadium|tampa | 51 | 2.1% | cooling 2% | 2.0% | 0.5% | 2.1% | PASS |
| stadium|tucson | 51 | 5.0% | cooling 1% | 4.5% | 0.2% | 12.9% | PASS |
| stadium|washington | 51 | 3.2% | cooling 2% | 2.7% | 0.4% | 3.3% | PASS |

## Type defaults (prediction vs EnergyPlus)

| Model | Output | EnergyPlus W/m² | Surrogate W/m² | Error |
|---|---|---|---|---|
| stadium|albuquerque | clg_db_0.4|total_w_m2 | 177.0 | 180.0 | +1.7% |
| stadium|albuquerque | clg_dp_0.4|total_w_m2 | 188.8 | 183.7 | -2.7% |
| stadium|albuquerque | htg_99.6|total_w_m2 | 181.0 | 181.0 | -0.0% |
| stadium|atlanta | clg_db_0.4|total_w_m2 | 321.3 | 321.5 | +0.1% |
| stadium|atlanta | clg_dp_0.4|total_w_m2 | 343.2 | 343.1 | -0.0% |
| stadium|atlanta | htg_99.6|total_w_m2 | 198.9 | 198.8 | -0.1% |
| stadium|boston | clg_db_0.4|total_w_m2 | 297.9 | 301.0 | +1.0% |
| stadium|boston | clg_dp_0.4|total_w_m2 | 329.2 | 332.5 | +1.0% |
| stadium|boston | htg_99.6|total_w_m2 | 264.0 | 264.1 | +0.0% |
| stadium|buffalo | clg_db_0.4|total_w_m2 | 270.9 | 272.6 | +0.6% |
| stadium|buffalo | clg_dp_0.4|total_w_m2 | 316.4 | 318.1 | +0.5% |
| stadium|buffalo | htg_99.6|total_w_m2 | 279.8 | 279.6 | -0.1% |
| stadium|chicago | clg_db_0.4|total_w_m2 | 327.6 | 331.2 | +1.1% |
| stadium|chicago | clg_dp_0.4|total_w_m2 | 369.9 | 372.9 | +0.8% |
| stadium|chicago | htg_99.6|total_w_m2 | 310.3 | 310.2 | -0.0% |
| stadium|dallas | clg_db_0.4|total_w_m2 | 323.5 | 326.3 | +0.9% |
| stadium|dallas | clg_dp_0.4|total_w_m2 | 368.1 | 372.5 | +1.2% |
| stadium|dallas | htg_99.6|total_w_m2 | 204.7 | 204.6 | -0.1% |
| stadium|denver | clg_db_0.4|total_w_m2 | 174.6 | 176.3 | +1.0% |
| stadium|denver | clg_dp_0.4|total_w_m2 | 185.8 | 180.5 | -2.8% |
| stadium|denver | htg_99.6|total_w_m2 | 244.2 | 244.2 | -0.0% |
| stadium|elpaso | clg_db_0.4|total_w_m2 | 205.6 | 208.2 | +1.2% |
| stadium|elpaso | clg_dp_0.4|total_w_m2 | 242.6 | 251.9 | +3.8% |
| stadium|elpaso | htg_99.6|total_w_m2 | 171.5 | 171.4 | -0.0% |
| stadium|fairbanks | clg_db_0.4|total_w_m2 | 135.6 | 137.3 | +1.3% |
| stadium|fairbanks | clg_dp_0.4|total_w_m2 | 121.8 | 119.2 | -2.1% |
| stadium|fairbanks | htg_99.6|total_w_m2 | 487.4 | 487.4 | -0.0% |
| stadium|greatfalls | clg_db_0.4|total_w_m2 | 170.7 | 171.7 | +0.6% |
| stadium|greatfalls | clg_dp_0.4|total_w_m2 | 147.2 | 156.3 | +6.2% |
| stadium|greatfalls | htg_99.6|total_w_m2 | 333.1 | 333.0 | -0.0% |
| stadium|honolulu | clg_db_0.4|total_w_m2 | 305.5 | 309.2 | +1.2% |
| stadium|honolulu | clg_dp_0.4|total_w_m2 | 348.2 | 352.7 | +1.3% |
| stadium|honolulu | htg_99.6|total_w_m2 | 16.3 | 15.7 | -3.7% |
| stadium|houston | clg_db_0.4|total_w_m2 | 355.1 | 358.5 | +1.0% |
| stadium|houston | clg_dp_0.4|total_w_m2 | 394.4 | 398.0 | +0.9% |
| stadium|houston | htg_99.6|total_w_m2 | 166.5 | 166.4 | -0.0% |
| stadium|intlfalls | clg_db_0.4|total_w_m2 | 257.4 | 258.3 | +0.3% |
| stadium|intlfalls | clg_dp_0.4|total_w_m2 | 291.5 | 290.1 | -0.5% |
| stadium|intlfalls | htg_99.6|total_w_m2 | 403.3 | 403.3 | +0.0% |
| stadium|kansascity | clg_db_0.4|total_w_m2 | 359.8 | 363.5 | +1.0% |
| stadium|kansascity | clg_dp_0.4|total_w_m2 | 404.3 | 408.2 | +1.0% |
| stadium|kansascity | htg_99.6|total_w_m2 | 290.7 | 290.8 | +0.0% |
| stadium|losangeles | clg_db_0.4|total_w_m2 | 158.1 | 160.4 | +1.5% |
| stadium|losangeles | clg_dp_0.4|total_w_m2 | 226.9 | 228.7 | +0.8% |
| stadium|losangeles | htg_99.6|total_w_m2 | 94.5 | 94.2 | -0.3% |
| stadium|miami | clg_db_0.4|total_w_m2 | 371.4 | 375.8 | +1.2% |
| stadium|miami | clg_dp_0.4|total_w_m2 | 407.7 | 412.7 | +1.2% |
| stadium|miami | htg_99.6|total_w_m2 | 80.0 | 79.9 | -0.2% |
| stadium|newyork | clg_db_0.4|total_w_m2 | 304.4 | 308.9 | +1.5% |
| stadium|newyork | clg_dp_0.4|total_w_m2 | 349.3 | 353.2 | +1.1% |
| stadium|newyork | htg_99.6|total_w_m2 | 241.3 | 241.2 | -0.1% |
| stadium|phoenix | clg_db_0.4|total_w_m2 | 262.7 | 267.7 | +1.9% |
| stadium|phoenix | clg_dp_0.4|total_w_m2 | 315.7 | 319.8 | +1.3% |
| stadium|phoenix | htg_99.6|total_w_m2 | 118.2 | 118.2 | -0.1% |
| stadium|portangeles | clg_db_0.4|total_w_m2 | 143.0 | 143.8 | +0.6% |
| stadium|portangeles | clg_dp_0.4|total_w_m2 | 120.2 | 114.2 | -5.0% |
| stadium|portangeles | htg_99.6|total_w_m2 | 184.8 | 184.8 | -0.0% |
| stadium|rochestermn | clg_db_0.4|total_w_m2 | 313.7 | 314.4 | +0.2% |
| stadium|rochestermn | clg_dp_0.4|total_w_m2 | 357.4 | 358.4 | +0.3% |
| stadium|rochestermn | htg_99.6|total_w_m2 | 351.2 | 351.1 | -0.0% |
| stadium|sandiego | clg_db_0.4|total_w_m2 | 209.0 | 215.1 | +2.9% |
| stadium|sandiego | clg_dp_0.4|total_w_m2 | 277.0 | 282.3 | +1.9% |
| stadium|sandiego | htg_99.6|total_w_m2 | 93.2 | 93.0 | -0.3% |
| stadium|sanfrancisco | clg_db_0.4|total_w_m2 | 137.8 | 136.8 | -0.7% |
| stadium|sanfrancisco | clg_dp_0.4|total_w_m2 | 131.3 | 140.1 | +6.7% |
| stadium|sanfrancisco | htg_99.6|total_w_m2 | 120.9 | 120.8 | -0.1% |
| stadium|seattle | clg_db_0.4|total_w_m2 | 176.3 | 175.7 | -0.4% |
| stadium|seattle | clg_dp_0.4|total_w_m2 | 149.8 | 154.7 | +3.3% |
| stadium|seattle | htg_99.6|total_w_m2 | 184.4 | 184.4 | -0.0% |
| stadium|stlouis | clg_db_0.4|total_w_m2 | 366.8 | 365.7 | -0.3% |
| stadium|stlouis | clg_dp_0.4|total_w_m2 | 395.7 | 393.5 | -0.6% |
| stadium|stlouis | htg_99.6|total_w_m2 | 276.1 | 276.2 | +0.0% |
| stadium|tampa | clg_db_0.4|total_w_m2 | 367.5 | 371.4 | +1.1% |
| stadium|tampa | clg_dp_0.4|total_w_m2 | 413.4 | 417.2 | +0.9% |
| stadium|tampa | htg_99.6|total_w_m2 | 123.0 | 122.8 | -0.1% |
| stadium|tucson | clg_db_0.4|total_w_m2 | 228.1 | 237.8 | +4.3% |
| stadium|tucson | clg_dp_0.4|total_w_m2 | 267.4 | 272.1 | +1.8% |
| stadium|tucson | htg_99.6|total_w_m2 | 142.2 | 142.2 | -0.0% |
| stadium|washington | clg_db_0.4|total_w_m2 | 348.8 | 350.1 | +0.4% |
| stadium|washington | clg_dp_0.4|total_w_m2 | 376.2 | 378.0 | +0.5% |
| stadium|washington | htg_99.6|total_w_m2 | 224.5 | 224.5 | -0.0% |

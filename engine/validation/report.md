# Surrogate validation against EnergyPlus

Generated 2026-10-23T17:21:23+00:00 by `engine/validate.py`. Each model is tested on EnergyPlus runs it was not trained on (independent Latin-hypercube sample, seed 9001, plus the building type default).

Pass rule: worst 95th-percentile absolute error on the peaks the page reports <= 5.0%. Those are the governing cooling peak for each percentile (the larger of the dry-bulb and dew-point days, as EnergyPlus and the model each see it) and the heating peak for each percentile. "Any single day" judges every design day on its own value, including mild days that never govern and can sit near zero; it is shown for information. Peaks are one-hour averages. A peak below 10% of the case's design load (larger of 0.4% cooling and 99.6% heating) is judged as a share of that 10%, not of itself.

| Model | Test runs | Worst P95, reported peaks | Which peak | Cooling 0.4% | Heating 99.6% | Any single day (info) | Result |
|---|---|---|---|---|---|---|---|
| healthcare|albuquerque | 51 | 5.9% | cooling 1% | 5.5% | 0.3% | 18.7% | **FAIL** |
| healthcare|atlanta | 51 | 1.4% | cooling 1% | 1.3% | 0.6% | 2.2% | PASS |
| healthcare|boston | 51 | 2.5% | cooling 2% | 2.1% | 0.4% | 2.5% | PASS |
| healthcare|buffalo | 51 | 3.0% | cooling 2% | 1.8% | 0.3% | 3.0% | PASS |
| healthcare|chicago | 51 | 2.8% | cooling 2% | 1.6% | 0.5% | 2.8% | PASS |
| healthcare|dallas | 51 | 2.1% | cooling 2% | 1.8% | 0.4% | 3.0% | PASS |
| healthcare|denver | 51 | 8.8% | cooling 1% | 8.7% | 0.6% | 82.4% | **FAIL** |
| healthcare|elpaso | 51 | 4.4% | cooling 0.4% | 4.4% | 0.3% | 5.2% | PASS |
| healthcare|fairbanks | 51 | 4.5% | cooling 1% | 3.9% | 0.2% | 103.3% | PASS |
| healthcare|greatfalls | 51 | 4.9% | cooling 0.4% | 4.9% | 0.4% | 37.4% | PASS |
| healthcare|honolulu | 51 | 2.4% | cooling 0.4% | 2.4% | 0.9% | 2.6% | PASS |
| healthcare|houston | 51 | 1.3% | cooling 2% | 1.3% | 0.3% | 1.4% | PASS |
| healthcare|intlfalls | 51 | 4.6% | cooling 1% | 2.2% | 0.2% | 9.2% | PASS |
| healthcare|kansascity | 51 | 1.8% | cooling 0.4% | 1.8% | 0.6% | 3.7% | PASS |
| healthcare|losangeles | 51 | 8.0% | cooling 2% | 2.8% | 0.4% | 13.5% | **FAIL** |
| healthcare|miami | 51 | 2.3% | cooling 2% | 2.1% | 0.7% | 2.7% | PASS |
| healthcare|newyork | 51 | 2.1% | cooling 2% | 2.0% | 0.3% | 2.3% | PASS |
| healthcare|phoenix | 51 | 1.5% | cooling 1% | 1.4% | 0.6% | 1.7% | PASS |
| healthcare|portangeles | 51 | 6.5% | cooling 2% | 3.0% | 0.3% | 128.9% | **FAIL** |
| healthcare|rochestermn | 51 | 3.4% | cooling 2% | 2.2% | 0.4% | 3.8% | PASS |
| healthcare|sandiego | 51 | 3.0% | cooling 2% | 2.5% | 0.5% | 3.0% | PASS |
| healthcare|sanfrancisco | 51 | 16.0% | cooling 0.4% | 16.0% | 0.5% | 90.0% | **FAIL** |
| healthcare|seattle | 51 | 4.1% | cooling 0.4% | 4.1% | 0.3% | 31.4% | PASS |
| healthcare|stlouis | 51 | 1.4% | cooling 2% | 1.4% | 0.3% | 1.5% | PASS |
| healthcare|tampa | 51 | 1.9% | cooling 0.4% | 1.9% | 0.6% | 1.9% | PASS |
| healthcare|tucson | 51 | 2.6% | cooling 1% | 2.6% | 0.7% | 3.4% | PASS |
| healthcare|washington | 51 | 1.9% | cooling 1% | 1.6% | 0.3% | 2.3% | PASS |
| higher_ed|albuquerque | 51 | 5.0% | cooling 0.4% | 5.0% | 0.8% | 9.8% | PASS |
| higher_ed|atlanta | 51 | 2.0% | cooling 2% | 1.8% | 0.6% | 2.4% | PASS |
| higher_ed|boston | 51 | 2.4% | cooling 0.4% | 2.4% | 0.6% | 2.9% | PASS |
| higher_ed|buffalo | 51 | 3.7% | cooling 2% | 3.2% | 0.6% | 3.7% | PASS |
| higher_ed|chicago | 51 | 1.9% | cooling 2% | 1.8% | 0.5% | 2.0% | PASS |
| higher_ed|dallas | 51 | 1.8% | cooling 1% | 1.8% | 0.7% | 2.1% | PASS |
| higher_ed|denver | 51 | 3.8% | cooling 1% | 2.6% | 0.7% | 21.1% | PASS |
| higher_ed|elpaso | 51 | 2.3% | cooling 2% | 2.3% | 0.7% | 3.2% | PASS |
| higher_ed|fairbanks | 51 | 3.4% | cooling 2% | 3.2% | 0.4% | 10.2% | PASS |
| higher_ed|greatfalls | 51 | 3.6% | cooling 1% | 3.5% | 0.8% | 9.5% | PASS |
| higher_ed|honolulu | 51 | 2.9% | cooling 2% | 2.8% | 2.1% | 3.9% | PASS |
| higher_ed|houston | 51 | 2.2% | cooling 2% | 2.0% | 0.6% | 2.8% | PASS |
| higher_ed|intlfalls | 51 | 2.6% | cooling 1% | 2.2% | 0.4% | 3.4% | PASS |
| higher_ed|kansascity | 51 | 2.2% | cooling 2% | 1.8% | 0.6% | 2.4% | PASS |
| higher_ed|losangeles | 51 | 3.4% | cooling 2% | 2.6% | 0.8% | 3.8% | PASS |
| higher_ed|miami | 51 | 1.7% | cooling 2% | 1.7% | 0.9% | 1.9% | PASS |
| higher_ed|newyork | 51 | 2.3% | cooling 0.4% | 2.3% | 0.5% | 2.4% | PASS |
| higher_ed|phoenix | 51 | 2.0% | cooling 0.4% | 2.0% | 0.8% | 2.4% | PASS |
| higher_ed|portangeles | 51 | 3.9% | cooling 2% | 3.2% | 0.6% | 15.7% | PASS |
| higher_ed|rochestermn | 51 | 3.2% | cooling 1% | 2.9% | 0.6% | 3.5% | PASS |
| higher_ed|sandiego | 51 | 2.1% | cooling 0.4% | 2.1% | 0.7% | 2.1% | PASS |
| higher_ed|sanfrancisco | 51 | 4.8% | cooling 2% | 3.6% | 0.6% | 15.2% | PASS |
| higher_ed|seattle | 51 | 3.5% | cooling 2% | 2.6% | 0.6% | 8.8% | PASS |
| higher_ed|stlouis | 51 | 2.4% | cooling 2% | 2.1% | 0.5% | 2.8% | PASS |
| higher_ed|tampa | 51 | 2.3% | cooling 2% | 2.1% | 0.6% | 2.2% | PASS |
| higher_ed|tucson | 51 | 2.8% | cooling 0.4% | 2.8% | 0.7% | 3.1% | PASS |
| higher_ed|washington | 51 | 1.9% | cooling 2% | 1.6% | 0.5% | 2.0% | PASS |
| hotel|albuquerque | 51 | 4.5% | cooling 1% | 4.3% | 0.7% | 8.6% | PASS |
| hotel|atlanta | 51 | 2.1% | cooling 0.4% | 2.1% | 0.6% | 2.6% | PASS |
| hotel|boston | 51 | 3.4% | cooling 2% | 2.9% | 0.7% | 3.6% | PASS |
| hotel|buffalo | 51 | 2.7% | cooling 2% | 2.2% | 0.8% | 3.2% | PASS |
| hotel|chicago | 51 | 2.4% | cooling 2% | 2.0% | 0.8% | 2.5% | PASS |
| hotel|dallas | 51 | 2.8% | cooling 2% | 2.7% | 0.7% | 3.1% | PASS |
| hotel|denver | 51 | 4.3% | cooling 2% | 3.8% | 0.6% | 12.8% | PASS |
| hotel|elpaso | 51 | 2.9% | cooling 2% | 2.8% | 0.5% | 5.7% | PASS |
| hotel|fairbanks | 51 | 2.9% | cooling 0.4% | 2.9% | 0.6% | 29.7% | PASS |
| hotel|greatfalls | 51 | 4.4% | cooling 0.4% | 4.4% | 0.4% | 9.9% | PASS |
| hotel|honolulu | 51 | 4.3% | cooling 1% | 4.2% | 1.3% | 4.5% | PASS |
| hotel|houston | 51 | 2.8% | cooling 1% | 2.8% | 0.7% | 2.7% | PASS |
| hotel|intlfalls | 51 | 4.4% | cooling 2% | 3.7% | 0.7% | 5.5% | PASS |
| hotel|kansascity | 51 | 2.6% | cooling 2% | 2.3% | 0.5% | 2.7% | PASS |
| hotel|losangeles | 51 | 3.9% | cooling 1% | 3.5% | 0.8% | 4.2% | PASS |
| hotel|miami | 51 | 2.5% | cooling 2% | 2.4% | 0.9% | 2.5% | PASS |
| hotel|newyork | 51 | 2.3% | cooling 2% | 2.2% | 0.7% | 2.9% | PASS |
| hotel|phoenix | 51 | 2.0% | cooling 0.4% | 2.0% | 0.8% | 2.8% | PASS |
| hotel|portangeles | 51 | 6.3% | cooling 2% | 2.9% | 0.4% | 11.1% | **FAIL** |
| hotel|rochestermn | 51 | 4.2% | cooling 2% | 3.9% | 0.7% | 4.8% | PASS |
| hotel|sandiego | 51 | 2.7% | cooling 0.4% | 2.7% | 1.2% | 3.2% | PASS |
| hotel|sanfrancisco | 51 | 4.5% | cooling 2% | 4.2% | 0.5% | 13.2% | PASS |
| hotel|seattle | 51 | 4.1% | cooling 1% | 3.1% | 0.8% | 13.3% | PASS |
| hotel|stlouis | 51 | 2.1% | cooling 2% | 2.0% | 0.5% | 2.3% | PASS |
| hotel|tampa | 51 | 2.1% | cooling 2% | 2.0% | 0.6% | 2.1% | PASS |
| hotel|tucson | 51 | 3.6% | cooling 2% | 3.3% | 0.6% | 4.2% | PASS |
| hotel|washington | 51 | 3.9% | cooling 2% | 3.2% | 0.9% | 4.5% | PASS |
| lab|albuquerque | 51 | 16.0% | cooling 1% | 15.9% | 0.2% | 32.2% | **FAIL** |
| lab|atlanta | 51 | 1.7% | cooling 0.4% | 1.7% | 0.2% | 2.8% | PASS |
| lab|boston | 51 | 2.8% | cooling 0.4% | 2.8% | 0.2% | 2.8% | PASS |
| lab|buffalo | 51 | 1.2% | cooling 1% | 1.2% | 0.2% | 1.5% | PASS |
| lab|chicago | 51 | 0.9% | cooling 2% | 0.7% | 0.2% | 1.3% | PASS |
| lab|dallas | 51 | 0.8% | cooling 0.4% | 0.8% | 0.2% | 0.9% | PASS |
| lab|denver | 51 | 13.7% | cooling 0.4% | 13.7% | 0.1% | 38.6% | **FAIL** |
| lab|elpaso | 51 | 4.2% | cooling 0.4% | 4.2% | 0.2% | 6.1% | PASS |
| lab|fairbanks | 51 | 10.4% | cooling 2% | 8.8% | 0.1% | 98.6% | **FAIL** |
| lab|greatfalls | 51 | 10.0% | cooling 0.4% | 10.0% | 0.2% | 39.7% | **FAIL** |
| lab|honolulu | 51 | 3.5% | cooling 2% | 2.6% | 0.4% | 3.5% | PASS |
| lab|houston | 51 | 1.2% | cooling 2% | 1.0% | 0.3% | 1.5% | PASS |
| lab|intlfalls | 51 | 6.8% | cooling 2% | 0.9% | 0.2% | 10.0% | **FAIL** |
| lab|kansascity | 51 | 1.8% | cooling 2% | 1.2% | 0.1% | 1.7% | PASS |
| lab|losangeles | 51 | 11.7% | cooling 2% | 3.3% | 0.3% | 12.8% | **FAIL** |
| lab|miami | 51 | 2.6% | cooling 2% | 0.9% | 0.2% | 2.6% | PASS |
| lab|newyork | 51 | 2.7% | cooling 2% | 2.0% | 0.2% | 2.7% | PASS |
| lab|phoenix | 51 | 2.3% | cooling 1% | 1.1% | 0.2% | 2.7% | PASS |
| lab|portangeles | 51 | 12.0% | cooling 0.4% | 12.0% | 0.3% | 62.6% | **FAIL** |
| lab|rochestermn | 51 | 1.6% | cooling 2% | 1.0% | 0.2% | 1.5% | PASS |
| lab|sandiego | 51 | 5.6% | cooling 0.4% | 5.6% | 0.3% | 5.6% | **FAIL** |
| lab|sanfrancisco | 51 | 20.2% | cooling 0.4% | 20.2% | 0.2% | 187.1% | **FAIL** |
| lab|seattle | 51 | 10.4% | cooling 0.4% | 10.4% | 0.2% | 43.1% | **FAIL** |
| lab|stlouis | 51 | 2.4% | cooling 2% | 1.7% | 0.2% | 2.4% | PASS |
| lab|tampa | 51 | 1.9% | cooling 0.4% | 1.9% | 0.3% | 2.0% | PASS |
| lab|tucson | 51 | 1.5% | cooling 0.4% | 1.5% | 0.3% | 1.8% | PASS |
| lab|washington | 51 | 1.2% | cooling 2% | 1.1% | 0.2% | 1.3% | PASS |
| office|albuquerque | 51 | 4.8% | cooling 2% | 4.1% | 0.8% | 9.3% | PASS |
| office|atlanta | 51 | 2.0% | cooling 0.4% | 2.0% | 0.6% | 3.1% | PASS |
| office|boston | 51 | 2.9% | cooling 1% | 2.7% | 0.7% | 3.5% | PASS |
| office|buffalo | 51 | 3.5% | cooling 2% | 2.9% | 0.6% | 4.2% | PASS |
| office|chicago | 51 | 3.1% | cooling 2% | 2.6% | 0.9% | 3.3% | PASS |
| office|dallas | 51 | 2.5% | cooling 2% | 2.5% | 0.6% | 2.9% | PASS |
| office|denver | 51 | 4.9% | cooling 2% | 4.5% | 0.7% | 11.9% | PASS |
| office|elpaso | 51 | 2.6% | cooling 2% | 2.4% | 0.9% | 6.2% | PASS |
| office|fairbanks | 51 | 4.8% | cooling 2% | 3.8% | 1.0% | 11.3% | PASS |
| office|greatfalls | 51 | 3.8% | cooling 2% | 3.3% | 0.7% | 10.2% | PASS |
| office|honolulu | 51 | 3.8% | heating 99.6% | 2.5% | 3.8% | 4.5% | PASS |
| office|houston | 51 | 2.3% | cooling 0.4% | 2.3% | 0.8% | 2.8% | PASS |
| office|intlfalls | 51 | 4.3% | cooling 1% | 4.2% | 0.7% | 7.0% | PASS |
| office|kansascity | 51 | 2.8% | cooling 1% | 2.5% | 0.6% | 3.3% | PASS |
| office|losangeles | 51 | 4.3% | cooling 0.4% | 4.3% | 1.5% | 4.5% | PASS |
| office|miami | 51 | 2.5% | heating 99% | 2.1% | 1.5% | 2.6% | PASS |
| office|newyork | 51 | 4.7% | cooling 2% | 4.1% | 0.7% | 4.7% | PASS |
| office|phoenix | 51 | 2.3% | cooling 0.4% | 2.3% | 0.7% | 2.3% | PASS |
| office|portangeles | 51 | 3.7% | cooling 2% | 2.4% | 0.8% | 7.0% | PASS |
| office|rochestermn | 51 | 3.0% | cooling 2% | 2.3% | 0.7% | 3.2% | PASS |
| office|sandiego | 51 | 3.7% | cooling 1% | 3.6% | 1.5% | 3.9% | PASS |
| office|sanfrancisco | 51 | 4.6% | cooling 2% | 3.4% | 0.9% | 14.4% | PASS |
| office|seattle | 51 | 4.5% | cooling 2% | 3.4% | 0.8% | 11.3% | PASS |
| office|stlouis | 51 | 2.3% | cooling 2% | 2.1% | 0.7% | 3.1% | PASS |
| office|tampa | 51 | 2.9% | cooling 1% | 2.8% | 0.8% | 3.4% | PASS |
| office|tucson | 51 | 3.2% | cooling 0.4% | 3.2% | 0.9% | 5.4% | PASS |
| office|washington | 51 | 2.1% | cooling 2% | 1.9% | 0.6% | 2.5% | PASS |
| retail|albuquerque | 51 | 4.1% | cooling 2% | 4.0% | 0.4% | 12.6% | PASS |
| retail|atlanta | 51 | 2.3% | cooling 2% | 2.1% | 0.5% | 2.7% | PASS |
| retail|boston | 51 | 3.0% | cooling 2% | 2.3% | 0.7% | 3.0% | PASS |
| retail|buffalo | 51 | 3.6% | cooling 2% | 2.8% | 0.5% | 3.7% | PASS |
| retail|chicago | 51 | 2.7% | cooling 2% | 2.3% | 0.6% | 2.9% | PASS |
| retail|dallas | 51 | 1.9% | cooling 0.4% | 1.9% | 0.4% | 2.4% | PASS |
| retail|denver | 51 | 5.3% | cooling 0.4% | 5.3% | 0.5% | 13.1% | **FAIL** |
| retail|elpaso | 51 | 4.3% | cooling 1% | 4.1% | 0.7% | 5.4% | PASS |
| retail|fairbanks | 51 | 3.5% | cooling 0.4% | 3.5% | 0.3% | 19.9% | PASS |
| retail|greatfalls | 51 | 3.9% | cooling 1% | 3.7% | 0.4% | 23.1% | PASS |
| retail|honolulu | 51 | 3.6% | cooling 1% | 3.5% | 1.8% | 17.3% | PASS |
| retail|houston | 51 | 2.4% | cooling 0.4% | 2.4% | 0.5% | 2.5% | PASS |
| retail|intlfalls | 51 | 4.4% | cooling 2% | 3.3% | 0.4% | 7.0% | PASS |
| retail|kansascity | 51 | 2.5% | cooling 2% | 2.1% | 0.7% | 2.8% | PASS |
| retail|losangeles | 51 | 3.6% | cooling 0.4% | 3.6% | 0.5% | 4.0% | PASS |
| retail|miami | 51 | 2.4% | cooling 2% | 2.3% | 1.1% | 2.6% | PASS |
| retail|newyork | 51 | 3.7% | cooling 2% | 3.3% | 0.4% | 3.7% | PASS |
| retail|phoenix | 51 | 1.6% | cooling 2% | 1.4% | 0.6% | 2.3% | PASS |
| retail|portangeles | 51 | 6.2% | cooling 2% | 4.1% | 0.4% | 45.7% | **FAIL** |
| retail|rochestermn | 51 | 4.7% | cooling 2% | 4.0% | 0.7% | 5.1% | PASS |
| retail|sandiego | 51 | 3.7% | cooling 2% | 2.6% | 1.1% | 3.8% | PASS |
| retail|sanfrancisco | 51 | 6.2% | cooling 2% | 3.2% | 0.5% | 47.5% | **FAIL** |
| retail|seattle | 51 | 3.5% | cooling 2% | 2.8% | 0.4% | 32.4% | PASS |
| retail|stlouis | 51 | 3.0% | cooling 2% | 2.5% | 0.4% | 3.7% | PASS |
| retail|tampa | 51 | 1.7% | cooling 2% | 1.6% | 0.6% | 1.7% | PASS |
| retail|tucson | 51 | 3.4% | cooling 0.4% | 3.4% | 1.0% | 4.7% | PASS |
| retail|washington | 51 | 2.3% | cooling 2% | 2.0% | 0.5% | 2.3% | PASS |
| school|albuquerque | 51 | 9.7% | cooling 0.4% | 9.7% | 0.3% | 16.4% | **FAIL** |
| school|atlanta | 51 | 1.6% | cooling 1% | 1.6% | 0.4% | 1.7% | PASS |
| school|boston | 51 | 2.2% | cooling 2% | 2.0% | 0.3% | 2.4% | PASS |
| school|buffalo | 51 | 2.9% | cooling 2% | 2.4% | 0.4% | 2.9% | PASS |
| school|chicago | 51 | 2.7% | cooling 2% | 1.9% | 0.3% | 2.6% | PASS |
| school|dallas | 51 | 2.0% | cooling 2% | 1.7% | 0.3% | 2.3% | PASS |
| school|denver | 51 | 7.8% | cooling 0.4% | 7.8% | 0.3% | 38.6% | **FAIL** |
| school|elpaso | 51 | 2.9% | cooling 2% | 2.7% | 0.5% | 3.3% | PASS |
| school|fairbanks | 51 | 4.5% | cooling 0.4% | 4.5% | 0.4% | 70.0% | PASS |
| school|greatfalls | 51 | 5.6% | cooling 0.4% | 5.6% | 0.3% | 31.1% | **FAIL** |
| school|honolulu | 51 | 2.7% | cooling 2% | 2.5% | 1.1% | 2.7% | PASS |
| school|houston | 51 | 1.6% | cooling 1% | 1.6% | 0.4% | 2.3% | PASS |
| school|intlfalls | 51 | 3.5% | cooling 2% | 1.8% | 0.4% | 4.1% | PASS |
| school|kansascity | 51 | 2.7% | cooling 2% | 2.2% | 0.4% | 2.7% | PASS |
| school|losangeles | 51 | 10.4% | cooling 2% | 2.4% | 0.3% | 11.3% | **FAIL** |
| school|miami | 51 | 1.3% | cooling 2% | 1.3% | 0.5% | 1.4% | PASS |
| school|newyork | 51 | 3.2% | cooling 2% | 2.6% | 0.3% | 3.2% | PASS |
| school|phoenix | 51 | 2.0% | cooling 2% | 2.0% | 0.4% | 2.5% | PASS |
| school|portangeles | 51 | 4.7% | cooling 2% | 3.9% | 0.3% | 100.0% | PASS |
| school|rochestermn | 51 | 2.0% | cooling 2% | 1.6% | 0.4% | 2.2% | PASS |
| school|sandiego | 51 | 2.4% | cooling 2% | 2.0% | 0.6% | 2.6% | PASS |
| school|sanfrancisco | 51 | 10.2% | cooling 0.4% | 10.2% | 0.5% | 39.4% | **FAIL** |
| school|seattle | 51 | 4.9% | cooling 1% | 4.1% | 0.4% | 28.8% | PASS |
| school|stlouis | 51 | 1.8% | cooling 2% | 1.8% | 0.4% | 2.1% | PASS |
| school|tampa | 51 | 2.0% | cooling 2% | 1.9% | 0.3% | 2.0% | PASS |
| school|tucson | 51 | 3.4% | cooling 0.4% | 3.4% | 0.4% | 4.6% | PASS |
| school|washington | 51 | 2.7% | cooling 2% | 2.5% | 0.4% | 2.7% | PASS |
| sports|albuquerque | 51 | 6.3% | cooling 2% | 5.2% | 0.4% | 60.0% | **FAIL** |
| sports|atlanta | 51 | 2.7% | cooling 2% | 2.7% | 0.5% | 4.9% | PASS |
| sports|boston | 51 | 4.4% | cooling 2% | 3.4% | 0.4% | 6.9% | PASS |
| sports|buffalo | 51 | 5.6% | cooling 2% | 2.9% | 0.3% | 6.7% | **FAIL** |
| sports|chicago | 51 | 3.1% | cooling 2% | 3.0% | 0.4% | 3.4% | PASS |
| sports|dallas | 51 | 2.1% | cooling 0.4% | 2.1% | 0.4% | 2.2% | PASS |
| sports|denver | 51 | 5.9% | cooling 1% | 4.6% | 0.3% | 112.9% | **FAIL** |
| sports|elpaso | 51 | 12.2% | cooling 0.4% | 12.2% | 0.5% | 32.5% | **FAIL** |
| sports|fairbanks | 51 | 6.6% | cooling 0.4% | 6.6% | 0.2% | 113.2% | **FAIL** |
| sports|greatfalls | 51 | 6.1% | cooling 2% | 3.8% | 0.4% | 142.2% | **FAIL** |
| sports|honolulu | 51 | 6.1% | heating 99.6% | 1.7% | 6.1% | 44.2% | **FAIL** |
| sports|houston | 51 | 1.8% | cooling 1% | 1.8% | 0.5% | 2.1% | PASS |
| sports|intlfalls | 51 | 8.5% | cooling 1% | 4.0% | 0.2% | 28.3% | **FAIL** |
| sports|kansascity | 51 | 2.3% | cooling 2% | 2.2% | 0.5% | 3.0% | PASS |
| sports|losangeles | 51 | 22.3% | cooling 1% | 19.4% | 0.6% | 63.7% | **FAIL** |
| sports|miami | 51 | 2.7% | cooling 2% | 2.7% | 0.6% | 3.0% | PASS |
| sports|newyork | 51 | 3.1% | cooling 1% | 2.7% | 0.4% | 3.5% | PASS |
| sports|phoenix | 51 | 1.8% | cooling 1% | 1.6% | 0.4% | 2.4% | PASS |
| sports|portangeles | 51 | 50.3% | cooling 2% | 4.7% | 0.3% | 78.8% | **FAIL** |
| sports|rochestermn | 51 | 4.2% | cooling 2% | 2.1% | 0.4% | 6.7% | PASS |
| sports|sandiego | 51 | 13.2% | cooling 2% | 3.0% | 0.6% | 16.3% | **FAIL** |
| sports|sanfrancisco | 51 | 15.1% | cooling 2% | 4.2% | 0.4% | 141.4% | **FAIL** |
| sports|seattle | 51 | 7.4% | cooling 2% | 4.2% | 0.4% | 78.8% | **FAIL** |
| sports|stlouis | 51 | 2.2% | cooling 1% | 2.2% | 0.3% | 3.9% | PASS |
| sports|tampa | 51 | 1.9% | cooling 2% | 1.8% | 0.6% | 1.9% | PASS |
| sports|tucson | 51 | 7.2% | cooling 0.4% | 7.2% | 0.5% | 19.9% | **FAIL** |
| sports|washington | 51 | 2.7% | cooling 1% | 2.4% | 0.4% | 2.7% | PASS |
| stadium|albuquerque | 51 | 10.7% | cooling 2% | 9.5% | 0.2% | 46.1% | **FAIL** |
| stadium|atlanta | 51 | 2.9% | cooling 2% | 2.6% | 0.1% | 3.2% | PASS |
| stadium|boston | 51 | 3.1% | cooling 2% | 2.5% | 0.4% | 3.1% | PASS |
| stadium|buffalo | 51 | 4.1% | cooling 2% | 2.9% | 0.2% | 4.1% | PASS |
| stadium|chicago | 51 | 3.2% | cooling 2% | 2.7% | 0.2% | 3.3% | PASS |
| stadium|dallas | 51 | 3.1% | cooling 2% | 2.8% | 0.2% | 3.1% | PASS |
| stadium|denver | 51 | 11.8% | cooling 0.4% | 11.8% | 0.2% | 29.8% | **FAIL** |
| stadium|elpaso | 51 | 7.4% | cooling 0.4% | 7.4% | 0.2% | 10.4% | **FAIL** |
| stadium|fairbanks | 51 | 5.7% | cooling 2% | 3.3% | 0.1% | 112.3% | **FAIL** |
| stadium|greatfalls | 51 | 3.9% | cooling 2% | 3.7% | 0.2% | 28.5% | PASS |
| stadium|honolulu | 51 | 8.7% | heating 99% | 2.8% | 6.5% | 195.2% | **FAIL** |
| stadium|houston | 51 | 2.2% | cooling 2% | 2.2% | 0.2% | 2.6% | PASS |
| stadium|intlfalls | 51 | 8.9% | cooling 2% | 3.0% | 0.2% | 9.9% | **FAIL** |
| stadium|kansascity | 51 | 3.0% | cooling 2% | 2.5% | 0.2% | 3.1% | PASS |
| stadium|losangeles | 51 | 23.6% | cooling 2% | 9.3% | 0.8% | 26.6% | **FAIL** |
| stadium|miami | 51 | 2.8% | cooling 2% | 2.6% | 0.7% | 2.8% | PASS |
| stadium|newyork | 51 | 3.4% | cooling 2% | 3.3% | 0.2% | 3.9% | PASS |
| stadium|phoenix | 51 | 3.9% | cooling 1% | 3.9% | 0.4% | 8.0% | PASS |
| stadium|portangeles | 51 | 17.1% | cooling 2% | 4.0% | 0.2% | 157.0% | **FAIL** |
| stadium|rochestermn | 51 | 4.7% | cooling 2% | 4.2% | 0.2% | 4.7% | PASS |
| stadium|sandiego | 51 | 12.6% | cooling 2% | 3.2% | 0.8% | 16.8% | **FAIL** |
| stadium|sanfrancisco | 51 | 14.3% | cooling 2% | 6.9% | 0.3% | 77.1% | **FAIL** |
| stadium|seattle | 51 | 5.8% | cooling 2% | 5.1% | 0.1% | 51.0% | **FAIL** |
| stadium|stlouis | 51 | 2.5% | cooling 2% | 2.2% | 0.2% | 2.4% | PASS |
| stadium|tampa | 51 | 2.1% | cooling 2% | 2.0% | 0.5% | 2.1% | PASS |
| stadium|tucson | 51 | 5.0% | cooling 1% | 4.5% | 0.2% | 12.9% | PASS |
| stadium|washington | 51 | 3.2% | cooling 2% | 2.7% | 0.4% | 3.3% | PASS |

## Type defaults (prediction vs EnergyPlus)

| Model | Output | EnergyPlus W/m² | Surrogate W/m² | Error |
|---|---|---|---|---|
| healthcare|albuquerque | clg_db_0.4|total_w_m2 | 73.6 | 73.1 | -0.7% |
| healthcare|albuquerque | clg_dp_0.4|total_w_m2 | 68.9 | 72.0 | +4.6% |
| healthcare|albuquerque | htg_99.6|total_w_m2 | 82.6 | 82.5 | -0.1% |
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
| healthcare|elpaso | clg_db_0.4|total_w_m2 | 81.4 | 81.0 | -0.5% |
| healthcare|elpaso | clg_dp_0.4|total_w_m2 | 88.9 | 89.0 | +0.1% |
| healthcare|elpaso | htg_99.6|total_w_m2 | 79.7 | 79.6 | -0.1% |
| healthcare|fairbanks | clg_db_0.4|total_w_m2 | 59.7 | 59.1 | -1.0% |
| healthcare|fairbanks | clg_dp_0.4|total_w_m2 | 51.7 | 50.8 | -1.7% |
| healthcare|fairbanks | htg_99.6|total_w_m2 | 198.0 | 198.3 | +0.1% |
| healthcare|greatfalls | clg_db_0.4|total_w_m2 | 71.1 | 69.4 | -2.3% |
| healthcare|greatfalls | clg_dp_0.4|total_w_m2 | 56.5 | 56.1 | -0.7% |
| healthcare|greatfalls | htg_99.6|total_w_m2 | 140.2 | 140.1 | -0.1% |
| healthcare|honolulu | clg_db_0.4|total_w_m2 | 115.4 | 115.7 | +0.2% |
| healthcare|honolulu | clg_dp_0.4|total_w_m2 | 129.2 | 129.5 | +0.2% |
| healthcare|honolulu | htg_99.6|total_w_m2 | 20.4 | 20.3 | -0.5% |
| healthcare|houston | clg_db_0.4|total_w_m2 | 134.3 | 133.6 | -0.5% |
| healthcare|houston | clg_dp_0.4|total_w_m2 | 146.4 | 145.6 | -0.5% |
| healthcare|houston | htg_99.6|total_w_m2 | 79.4 | 79.2 | -0.2% |
| healthcare|intlfalls | clg_db_0.4|total_w_m2 | 99.8 | 98.0 | -1.8% |
| healthcare|intlfalls | clg_dp_0.4|total_w_m2 | 111.4 | 109.5 | -1.7% |
| healthcare|intlfalls | htg_99.6|total_w_m2 | 166.9 | 166.9 | +0.0% |
| healthcare|kansascity | clg_db_0.4|total_w_m2 | 136.1 | 135.3 | -0.6% |
| healthcare|kansascity | clg_dp_0.4|total_w_m2 | 150.7 | 149.8 | -0.5% |
| healthcare|kansascity | htg_99.6|total_w_m2 | 126.4 | 126.2 | -0.2% |
| healthcare|losangeles | clg_db_0.4|total_w_m2 | 63.1 | 62.6 | -0.8% |
| healthcare|losangeles | clg_dp_0.4|total_w_m2 | 86.6 | 86.9 | +0.4% |
| healthcare|losangeles | htg_99.6|total_w_m2 | 50.5 | 50.4 | -0.2% |
| healthcare|miami | clg_db_0.4|total_w_m2 | 138.9 | 137.9 | -0.7% |
| healthcare|miami | clg_dp_0.4|total_w_m2 | 150.3 | 149.0 | -0.9% |
| healthcare|miami | htg_99.6|total_w_m2 | 45.5 | 45.4 | -0.3% |
| healthcare|newyork | clg_db_0.4|total_w_m2 | 117.0 | 115.3 | -1.5% |
| healthcare|newyork | clg_dp_0.4|total_w_m2 | 131.8 | 129.9 | -1.4% |
| healthcare|newyork | htg_99.6|total_w_m2 | 107.3 | 107.3 | -0.0% |
| healthcare|phoenix | clg_db_0.4|total_w_m2 | 104.4 | 103.9 | -0.4% |
| healthcare|phoenix | clg_dp_0.4|total_w_m2 | 118.4 | 117.6 | -0.7% |
| healthcare|phoenix | htg_99.6|total_w_m2 | 60.4 | 60.2 | -0.2% |
| healthcare|portangeles | clg_db_0.4|total_w_m2 | 60.0 | 59.4 | -1.1% |
| healthcare|portangeles | clg_dp_0.4|total_w_m2 | 50.9 | 48.2 | -5.2% |
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
| healthcare|seattle | clg_db_0.4|total_w_m2 | 72.3 | 71.5 | -1.1% |
| healthcare|seattle | clg_dp_0.4|total_w_m2 | 61.8 | 61.6 | -0.4% |
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
| higher_ed|albuquerque | clg_db_0.4|total_w_m2 | 56.1 | 56.3 | +0.3% |
| higher_ed|albuquerque | clg_dp_0.4|total_w_m2 | 53.8 | 54.1 | +0.7% |
| higher_ed|albuquerque | htg_99.6|total_w_m2 | 40.6 | 40.5 | -0.3% |
| higher_ed|atlanta | clg_db_0.4|total_w_m2 | 78.0 | 77.3 | -0.9% |
| higher_ed|atlanta | clg_dp_0.4|total_w_m2 | 78.1 | 77.5 | -0.8% |
| higher_ed|atlanta | htg_99.6|total_w_m2 | 44.8 | 44.7 | -0.4% |
| higher_ed|boston | clg_db_0.4|total_w_m2 | 76.9 | 75.7 | -1.6% |
| higher_ed|boston | clg_dp_0.4|total_w_m2 | 79.9 | 78.7 | -1.4% |
| higher_ed|boston | htg_99.6|total_w_m2 | 54.9 | 54.9 | -0.1% |
| higher_ed|buffalo | clg_db_0.4|total_w_m2 | 72.0 | 70.5 | -2.2% |
| higher_ed|buffalo | clg_dp_0.4|total_w_m2 | 77.3 | 75.6 | -2.2% |
| higher_ed|buffalo | htg_99.6|total_w_m2 | 58.1 | 58.2 | +0.2% |
| higher_ed|chicago | clg_db_0.4|total_w_m2 | 81.3 | 79.8 | -1.9% |
| higher_ed|chicago | clg_dp_0.4|total_w_m2 | 86.2 | 84.7 | -1.7% |
| higher_ed|chicago | htg_99.6|total_w_m2 | 63.9 | 63.7 | -0.2% |
| higher_ed|dallas | clg_db_0.4|total_w_m2 | 81.0 | 80.4 | -0.6% |
| higher_ed|dallas | clg_dp_0.4|total_w_m2 | 83.2 | 82.4 | -1.0% |
| higher_ed|dallas | htg_99.6|total_w_m2 | 46.9 | 46.8 | -0.2% |
| higher_ed|denver | clg_db_0.4|total_w_m2 | 55.9 | 55.4 | -0.9% |
| higher_ed|denver | clg_dp_0.4|total_w_m2 | 54.0 | 53.7 | -0.5% |
| higher_ed|denver | htg_99.6|total_w_m2 | 51.9 | 51.8 | -0.2% |
| higher_ed|elpaso | clg_db_0.4|total_w_m2 | 60.9 | 61.0 | +0.2% |
| higher_ed|elpaso | clg_dp_0.4|total_w_m2 | 60.4 | 60.9 | +0.8% |
| higher_ed|elpaso | htg_99.6|total_w_m2 | 39.3 | 39.2 | -0.1% |
| higher_ed|fairbanks | clg_db_0.4|total_w_m2 | 53.8 | 53.7 | -0.2% |
| higher_ed|fairbanks | clg_dp_0.4|total_w_m2 | 50.7 | 49.8 | -1.6% |
| higher_ed|fairbanks | htg_99.6|total_w_m2 | 93.2 | 93.4 | +0.2% |
| higher_ed|greatfalls | clg_db_0.4|total_w_m2 | 55.9 | 54.1 | -3.1% |
| higher_ed|greatfalls | clg_dp_0.4|total_w_m2 | 49.6 | 48.4 | -2.4% |
| higher_ed|greatfalls | htg_99.6|total_w_m2 | 67.5 | 67.6 | +0.1% |
| higher_ed|honolulu | clg_db_0.4|total_w_m2 | 75.1 | 74.8 | -0.4% |
| higher_ed|honolulu | clg_dp_0.4|total_w_m2 | 78.9 | 78.6 | -0.4% |
| higher_ed|honolulu | htg_99.6|total_w_m2 | 9.0 | 8.8 | -1.9% |
| higher_ed|houston | clg_db_0.4|total_w_m2 | 84.2 | 84.0 | -0.3% |
| higher_ed|houston | clg_dp_0.4|total_w_m2 | 86.4 | 86.2 | -0.3% |
| higher_ed|houston | htg_99.6|total_w_m2 | 38.8 | 38.6 | -0.4% |
| higher_ed|intlfalls | clg_db_0.4|total_w_m2 | 71.3 | 69.8 | -2.0% |
| higher_ed|intlfalls | clg_dp_0.4|total_w_m2 | 75.0 | 73.3 | -2.2% |
| higher_ed|intlfalls | htg_99.6|total_w_m2 | 79.3 | 79.4 | +0.2% |
| higher_ed|kansascity | clg_db_0.4|total_w_m2 | 86.5 | 85.6 | -1.0% |
| higher_ed|kansascity | clg_dp_0.4|total_w_m2 | 91.1 | 90.4 | -0.8% |
| higher_ed|kansascity | htg_99.6|total_w_m2 | 61.6 | 61.6 | +0.0% |
| higher_ed|losangeles | clg_db_0.4|total_w_m2 | 52.7 | 52.9 | +0.5% |
| higher_ed|losangeles | clg_dp_0.4|total_w_m2 | 60.2 | 59.9 | -0.5% |
| higher_ed|losangeles | htg_99.6|total_w_m2 | 23.8 | 23.7 | -0.5% |
| higher_ed|miami | clg_db_0.4|total_w_m2 | 85.6 | 85.5 | -0.0% |
| higher_ed|miami | clg_dp_0.4|total_w_m2 | 88.8 | 88.7 | -0.1% |
| higher_ed|miami | htg_99.6|total_w_m2 | 21.7 | 21.6 | -0.4% |
| higher_ed|newyork | clg_db_0.4|total_w_m2 | 77.9 | 76.6 | -1.7% |
| higher_ed|newyork | clg_dp_0.4|total_w_m2 | 82.7 | 81.2 | -1.8% |
| higher_ed|newyork | htg_99.6|total_w_m2 | 51.8 | 51.9 | +0.1% |
| higher_ed|phoenix | clg_db_0.4|total_w_m2 | 73.6 | 73.0 | -0.9% |
| higher_ed|phoenix | clg_dp_0.4|total_w_m2 | 74.8 | 74.1 | -1.0% |
| higher_ed|phoenix | htg_99.6|total_w_m2 | 29.5 | 29.5 | -0.2% |
| higher_ed|portangeles | clg_db_0.4|total_w_m2 | 53.6 | 52.9 | -1.3% |
| higher_ed|portangeles | clg_dp_0.4|total_w_m2 | 47.6 | 47.0 | -1.4% |
| higher_ed|portangeles | htg_99.6|total_w_m2 | 39.6 | 39.6 | -0.1% |
| higher_ed|rochestermn | clg_db_0.4|total_w_m2 | 78.0 | 77.7 | -0.4% |
| higher_ed|rochestermn | clg_dp_0.4|total_w_m2 | 83.4 | 83.1 | -0.4% |
| higher_ed|rochestermn | htg_99.6|total_w_m2 | 70.6 | 70.6 | -0.0% |
| higher_ed|sandiego | clg_db_0.4|total_w_m2 | 60.2 | 59.5 | -1.2% |
| higher_ed|sandiego | clg_dp_0.4|total_w_m2 | 68.5 | 67.8 | -1.0% |
| higher_ed|sandiego | htg_99.6|total_w_m2 | 23.7 | 23.6 | -0.4% |
| higher_ed|sanfrancisco | clg_db_0.4|total_w_m2 | 49.3 | 48.2 | -2.2% |
| higher_ed|sanfrancisco | clg_dp_0.4|total_w_m2 | 44.6 | 43.6 | -2.3% |
| higher_ed|sanfrancisco | htg_99.6|total_w_m2 | 29.0 | 28.9 | -0.4% |
| higher_ed|seattle | clg_db_0.4|total_w_m2 | 59.4 | 58.9 | -0.9% |
| higher_ed|seattle | clg_dp_0.4|total_w_m2 | 52.1 | 51.4 | -1.4% |
| higher_ed|seattle | htg_99.6|total_w_m2 | 40.6 | 40.5 | -0.2% |
| higher_ed|stlouis | clg_db_0.4|total_w_m2 | 88.0 | 86.8 | -1.3% |
| higher_ed|stlouis | clg_dp_0.4|total_w_m2 | 90.4 | 89.2 | -1.3% |
| higher_ed|stlouis | htg_99.6|total_w_m2 | 58.7 | 58.9 | +0.2% |
| higher_ed|tampa | clg_db_0.4|total_w_m2 | 85.6 | 85.3 | -0.4% |
| higher_ed|tampa | clg_dp_0.4|total_w_m2 | 90.5 | 90.2 | -0.3% |
| higher_ed|tampa | htg_99.6|total_w_m2 | 30.0 | 29.9 | -0.2% |
| higher_ed|tucson | clg_db_0.4|total_w_m2 | 64.6 | 63.5 | -1.7% |
| higher_ed|tucson | clg_dp_0.4|total_w_m2 | 64.8 | 63.7 | -1.8% |
| higher_ed|tucson | htg_99.6|total_w_m2 | 34.1 | 34.0 | -0.3% |
| higher_ed|washington | clg_db_0.4|total_w_m2 | 85.3 | 84.5 | -0.9% |
| higher_ed|washington | clg_dp_0.4|total_w_m2 | 87.2 | 86.6 | -0.7% |
| higher_ed|washington | htg_99.6|total_w_m2 | 48.4 | 48.3 | -0.3% |
| hotel|albuquerque | clg_db_0.4|total_w_m2 | 44.2 | 44.5 | +0.8% |
| hotel|albuquerque | clg_dp_0.4|total_w_m2 | 41.2 | 41.2 | +0.2% |
| hotel|albuquerque | htg_99.6|total_w_m2 | 32.2 | 32.0 | -0.5% |
| hotel|atlanta | clg_db_0.4|total_w_m2 | 58.6 | 57.8 | -1.3% |
| hotel|atlanta | clg_dp_0.4|total_w_m2 | 57.9 | 57.2 | -1.2% |
| hotel|atlanta | htg_99.6|total_w_m2 | 35.5 | 35.4 | -0.2% |
| hotel|boston | clg_db_0.4|total_w_m2 | 58.5 | 58.0 | -1.0% |
| hotel|boston | clg_dp_0.4|total_w_m2 | 60.0 | 59.5 | -0.9% |
| hotel|boston | htg_99.6|total_w_m2 | 42.6 | 42.7 | +0.1% |
| hotel|buffalo | clg_db_0.4|total_w_m2 | 54.9 | 53.9 | -1.8% |
| hotel|buffalo | clg_dp_0.4|total_w_m2 | 58.3 | 57.4 | -1.6% |
| hotel|buffalo | htg_99.6|total_w_m2 | 45.1 | 45.1 | -0.1% |
| hotel|chicago | clg_db_0.4|total_w_m2 | 61.6 | 60.7 | -1.6% |
| hotel|chicago | clg_dp_0.4|total_w_m2 | 64.7 | 63.8 | -1.4% |
| hotel|chicago | htg_99.6|total_w_m2 | 49.7 | 49.6 | -0.1% |
| hotel|dallas | clg_db_0.4|total_w_m2 | 61.5 | 60.9 | -0.9% |
| hotel|dallas | clg_dp_0.4|total_w_m2 | 61.9 | 61.4 | -0.7% |
| hotel|dallas | htg_99.6|total_w_m2 | 37.3 | 37.3 | +0.0% |
| hotel|denver | clg_db_0.4|total_w_m2 | 43.9 | 43.4 | -1.2% |
| hotel|denver | clg_dp_0.4|total_w_m2 | 41.6 | 40.8 | -2.0% |
| hotel|denver | htg_99.6|total_w_m2 | 40.7 | 40.7 | -0.0% |
| hotel|elpaso | clg_db_0.4|total_w_m2 | 47.0 | 46.2 | -1.7% |
| hotel|elpaso | clg_dp_0.4|total_w_m2 | 45.2 | 44.5 | -1.5% |
| hotel|elpaso | htg_99.6|total_w_m2 | 31.2 | 31.1 | -0.3% |
| hotel|fairbanks | clg_db_0.4|total_w_m2 | 43.2 | 42.5 | -1.6% |
| hotel|fairbanks | clg_dp_0.4|total_w_m2 | 40.6 | 39.8 | -2.0% |
| hotel|fairbanks | htg_99.6|total_w_m2 | 71.3 | 71.4 | +0.2% |
| hotel|greatfalls | clg_db_0.4|total_w_m2 | 44.0 | 43.3 | -1.5% |
| hotel|greatfalls | clg_dp_0.4|total_w_m2 | 38.7 | 37.1 | -4.2% |
| hotel|greatfalls | htg_99.6|total_w_m2 | 52.5 | 52.4 | -0.0% |
| hotel|honolulu | clg_db_0.4|total_w_m2 | 56.2 | 55.8 | -0.7% |
| hotel|honolulu | clg_dp_0.4|total_w_m2 | 58.2 | 57.9 | -0.5% |
| hotel|honolulu | htg_99.6|total_w_m2 | 7.3 | 7.2 | -1.2% |
| hotel|houston | clg_db_0.4|total_w_m2 | 63.2 | 62.9 | -0.5% |
| hotel|houston | clg_dp_0.4|total_w_m2 | 63.8 | 63.6 | -0.4% |
| hotel|houston | htg_99.6|total_w_m2 | 30.7 | 30.7 | -0.1% |
| hotel|intlfalls | clg_db_0.4|total_w_m2 | 54.9 | 53.7 | -2.1% |
| hotel|intlfalls | clg_dp_0.4|total_w_m2 | 57.4 | 56.6 | -1.4% |
| hotel|intlfalls | htg_99.6|total_w_m2 | 61.0 | 61.2 | +0.2% |
| hotel|kansascity | clg_db_0.4|total_w_m2 | 65.4 | 65.1 | -0.5% |
| hotel|kansascity | clg_dp_0.4|total_w_m2 | 68.1 | 67.7 | -0.5% |
| hotel|kansascity | htg_99.6|total_w_m2 | 48.3 | 48.1 | -0.4% |
| hotel|losangeles | clg_db_0.4|total_w_m2 | 40.3 | 39.4 | -2.2% |
| hotel|losangeles | clg_dp_0.4|total_w_m2 | 45.3 | 44.3 | -2.1% |
| hotel|losangeles | htg_99.6|total_w_m2 | 18.8 | 18.7 | -0.6% |
| hotel|miami | clg_db_0.4|total_w_m2 | 63.8 | 63.9 | +0.1% |
| hotel|miami | clg_dp_0.4|total_w_m2 | 65.3 | 65.4 | +0.1% |
| hotel|miami | htg_99.6|total_w_m2 | 17.3 | 17.2 | -0.5% |
| hotel|newyork | clg_db_0.4|total_w_m2 | 59.2 | 58.5 | -1.3% |
| hotel|newyork | clg_dp_0.4|total_w_m2 | 62.0 | 61.5 | -0.8% |
| hotel|newyork | htg_99.6|total_w_m2 | 40.6 | 40.6 | -0.0% |
| hotel|phoenix | clg_db_0.4|total_w_m2 | 57.2 | 56.1 | -1.9% |
| hotel|phoenix | clg_dp_0.4|total_w_m2 | 56.0 | 54.9 | -2.0% |
| hotel|phoenix | htg_99.6|total_w_m2 | 23.6 | 23.5 | -0.3% |
| hotel|portangeles | clg_db_0.4|total_w_m2 | 42.5 | 42.0 | -1.2% |
| hotel|portangeles | clg_dp_0.4|total_w_m2 | 37.9 | 37.4 | -1.4% |
| hotel|portangeles | htg_99.6|total_w_m2 | 30.7 | 30.6 | -0.2% |
| hotel|rochestermn | clg_db_0.4|total_w_m2 | 59.0 | 58.3 | -1.1% |
| hotel|rochestermn | clg_dp_0.4|total_w_m2 | 62.5 | 62.1 | -0.7% |
| hotel|rochestermn | htg_99.6|total_w_m2 | 54.6 | 54.7 | +0.1% |
| hotel|sandiego | clg_db_0.4|total_w_m2 | 45.6 | 44.7 | -1.9% |
| hotel|sandiego | clg_dp_0.4|total_w_m2 | 51.0 | 50.0 | -2.0% |
| hotel|sandiego | htg_99.6|total_w_m2 | 18.7 | 18.5 | -0.8% |
| hotel|sanfrancisco | clg_db_0.4|total_w_m2 | 38.0 | 37.2 | -2.2% |
| hotel|sanfrancisco | clg_dp_0.4|total_w_m2 | 33.9 | 33.0 | -2.6% |
| hotel|sanfrancisco | htg_99.6|total_w_m2 | 22.9 | 22.8 | -0.4% |
| hotel|seattle | clg_db_0.4|total_w_m2 | 46.7 | 45.8 | -1.9% |
| hotel|seattle | clg_dp_0.4|total_w_m2 | 41.0 | 39.4 | -3.9% |
| hotel|seattle | htg_99.6|total_w_m2 | 31.7 | 31.7 | -0.1% |
| hotel|stlouis | clg_db_0.4|total_w_m2 | 66.7 | 65.8 | -1.4% |
| hotel|stlouis | clg_dp_0.4|total_w_m2 | 67.6 | 66.8 | -1.2% |
| hotel|stlouis | htg_99.6|total_w_m2 | 46.0 | 45.9 | -0.3% |
| hotel|tampa | clg_db_0.4|total_w_m2 | 64.0 | 63.4 | -1.0% |
| hotel|tampa | clg_dp_0.4|total_w_m2 | 66.8 | 66.1 | -1.1% |
| hotel|tampa | htg_99.6|total_w_m2 | 23.8 | 23.7 | -0.3% |
| hotel|tucson | clg_db_0.4|total_w_m2 | 50.1 | 50.0 | -0.3% |
| hotel|tucson | clg_dp_0.4|total_w_m2 | 48.4 | 48.6 | +0.3% |
| hotel|tucson | htg_99.6|total_w_m2 | 27.2 | 27.2 | -0.1% |
| hotel|washington | clg_db_0.4|total_w_m2 | 64.7 | 64.1 | -0.9% |
| hotel|washington | clg_dp_0.4|total_w_m2 | 65.3 | 64.8 | -0.8% |
| hotel|washington | htg_99.6|total_w_m2 | 37.9 | 37.8 | -0.2% |
| lab|albuquerque | clg_db_0.4|total_w_m2 | 170.8 | 170.0 | -0.5% |
| lab|albuquerque | clg_dp_0.4|total_w_m2 | 169.4 | 170.5 | +0.6% |
| lab|albuquerque | htg_99.6|total_w_m2 | 206.9 | 206.7 | -0.1% |
| lab|atlanta | clg_db_0.4|total_w_m2 | 312.5 | 311.1 | -0.4% |
| lab|atlanta | clg_dp_0.4|total_w_m2 | 337.5 | 335.6 | -0.6% |
| lab|atlanta | htg_99.6|total_w_m2 | 229.0 | 228.9 | -0.0% |
| lab|boston | clg_db_0.4|total_w_m2 | 290.9 | 289.6 | -0.4% |
| lab|boston | clg_dp_0.4|total_w_m2 | 323.8 | 321.3 | -0.8% |
| lab|boston | htg_99.6|total_w_m2 | 296.3 | 296.2 | -0.0% |
| lab|buffalo | clg_db_0.4|total_w_m2 | 261.1 | 258.9 | -0.8% |
| lab|buffalo | clg_dp_0.4|total_w_m2 | 308.3 | 305.8 | -0.8% |
| lab|buffalo | htg_99.6|total_w_m2 | 311.8 | 311.6 | -0.1% |
| lab|chicago | clg_db_0.4|total_w_m2 | 319.6 | 318.5 | -0.3% |
| lab|chicago | clg_dp_0.4|total_w_m2 | 363.4 | 361.4 | -0.6% |
| lab|chicago | htg_99.6|total_w_m2 | 343.1 | 342.9 | -0.1% |
| lab|dallas | clg_db_0.4|total_w_m2 | 315.8 | 314.6 | -0.4% |
| lab|dallas | clg_dp_0.4|total_w_m2 | 365.3 | 364.0 | -0.4% |
| lab|dallas | htg_99.6|total_w_m2 | 235.4 | 235.4 | -0.0% |
| lab|denver | clg_db_0.4|total_w_m2 | 166.3 | 164.6 | -1.1% |
| lab|denver | clg_dp_0.4|total_w_m2 | 165.4 | 169.7 | +2.6% |
| lab|denver | htg_99.6|total_w_m2 | 271.5 | 271.5 | +0.0% |
| lab|elpaso | clg_db_0.4|total_w_m2 | 196.2 | 195.4 | -0.4% |
| lab|elpaso | clg_dp_0.4|total_w_m2 | 231.5 | 232.2 | +0.3% |
| lab|elpaso | htg_99.6|total_w_m2 | 198.4 | 198.2 | -0.1% |
| lab|fairbanks | clg_db_0.4|total_w_m2 | 126.9 | 126.9 | -0.1% |
| lab|fairbanks | clg_dp_0.4|total_w_m2 | 109.5 | 111.0 | +1.4% |
| lab|fairbanks | htg_99.6|total_w_m2 | 524.6 | 524.8 | +0.0% |
| lab|greatfalls | clg_db_0.4|total_w_m2 | 163.2 | 161.3 | -1.1% |
| lab|greatfalls | clg_dp_0.4|total_w_m2 | 131.5 | 126.0 | -4.1% |
| lab|greatfalls | htg_99.6|total_w_m2 | 363.8 | 363.8 | +0.0% |
| lab|honolulu | clg_db_0.4|total_w_m2 | 299.8 | 299.3 | -0.2% |
| lab|honolulu | clg_dp_0.4|total_w_m2 | 345.5 | 343.1 | -0.7% |
| lab|honolulu | htg_99.6|total_w_m2 | 43.2 | 43.0 | -0.3% |
| lab|houston | clg_db_0.4|total_w_m2 | 350.4 | 350.2 | -0.0% |
| lab|houston | clg_dp_0.4|total_w_m2 | 393.7 | 393.9 | +0.0% |
| lab|houston | htg_99.6|total_w_m2 | 196.6 | 196.6 | -0.0% |
| lab|intlfalls | clg_db_0.4|total_w_m2 | 244.7 | 242.7 | -0.8% |
| lab|intlfalls | clg_dp_0.4|total_w_m2 | 281.0 | 279.6 | -0.5% |
| lab|intlfalls | htg_99.6|total_w_m2 | 437.9 | 437.8 | -0.0% |
| lab|kansascity | clg_db_0.4|total_w_m2 | 350.8 | 349.9 | -0.2% |
| lab|kansascity | clg_dp_0.4|total_w_m2 | 397.4 | 394.9 | -0.6% |
| lab|kansascity | htg_99.6|total_w_m2 | 322.9 | 323.0 | +0.0% |
| lab|losangeles | clg_db_0.4|total_w_m2 | 149.0 | 149.3 | +0.2% |
| lab|losangeles | clg_dp_0.4|total_w_m2 | 222.2 | 221.5 | -0.3% |
| lab|losangeles | htg_99.6|total_w_m2 | 122.8 | 122.7 | -0.1% |
| lab|miami | clg_db_0.4|total_w_m2 | 366.1 | 365.0 | -0.3% |
| lab|miami | clg_dp_0.4|total_w_m2 | 405.3 | 402.7 | -0.7% |
| lab|miami | htg_99.6|total_w_m2 | 108.4 | 108.3 | -0.1% |
| lab|newyork | clg_db_0.4|total_w_m2 | 297.3 | 295.8 | -0.5% |
| lab|newyork | clg_dp_0.4|total_w_m2 | 344.2 | 340.8 | -1.0% |
| lab|newyork | htg_99.6|total_w_m2 | 273.2 | 273.2 | -0.0% |
| lab|phoenix | clg_db_0.4|total_w_m2 | 255.2 | 255.0 | -0.1% |
| lab|phoenix | clg_dp_0.4|total_w_m2 | 310.3 | 309.3 | -0.3% |
| lab|phoenix | htg_99.6|total_w_m2 | 146.4 | 146.3 | -0.1% |
| lab|portangeles | clg_db_0.4|total_w_m2 | 131.2 | 129.8 | -1.1% |
| lab|portangeles | clg_dp_0.4|total_w_m2 | 112.9 | 112.1 | -0.7% |
| lab|portangeles | htg_99.6|total_w_m2 | 214.8 | 214.8 | -0.0% |
| lab|rochestermn | clg_db_0.4|total_w_m2 | 302.9 | 301.1 | -0.6% |
| lab|rochestermn | clg_dp_0.4|total_w_m2 | 348.2 | 347.1 | -0.3% |
| lab|rochestermn | htg_99.6|total_w_m2 | 384.4 | 384.3 | -0.0% |
| lab|sandiego | clg_db_0.4|total_w_m2 | 200.5 | 200.0 | -0.3% |
| lab|sandiego | clg_dp_0.4|total_w_m2 | 271.3 | 270.4 | -0.3% |
| lab|sandiego | htg_99.6|total_w_m2 | 121.6 | 121.5 | -0.1% |
| lab|sanfrancisco | clg_db_0.4|total_w_m2 | 129.7 | 129.2 | -0.4% |
| lab|sanfrancisco | clg_dp_0.4|total_w_m2 | 130.6 | 125.5 | -3.9% |
| lab|sanfrancisco | htg_99.6|total_w_m2 | 149.9 | 149.8 | -0.1% |
| lab|seattle | clg_db_0.4|total_w_m2 | 165.1 | 165.0 | -0.1% |
| lab|seattle | clg_dp_0.4|total_w_m2 | 143.6 | 140.0 | -2.5% |
| lab|seattle | htg_99.6|total_w_m2 | 214.5 | 214.4 | -0.0% |
| lab|stlouis | clg_db_0.4|total_w_m2 | 359.1 | 358.0 | -0.3% |
| lab|stlouis | clg_dp_0.4|total_w_m2 | 389.9 | 387.8 | -0.5% |
| lab|stlouis | htg_99.6|total_w_m2 | 308.3 | 308.3 | +0.0% |
| lab|tampa | clg_db_0.4|total_w_m2 | 363.2 | 362.2 | -0.3% |
| lab|tampa | clg_dp_0.4|total_w_m2 | 412.1 | 410.1 | -0.5% |
| lab|tampa | htg_99.6|total_w_m2 | 152.2 | 152.1 | -0.1% |
| lab|tucson | clg_db_0.4|total_w_m2 | 226.2 | 225.7 | -0.3% |
| lab|tucson | clg_dp_0.4|total_w_m2 | 261.5 | 260.5 | -0.4% |
| lab|tucson | htg_99.6|total_w_m2 | 169.7 | 169.7 | -0.0% |
| lab|washington | clg_db_0.4|total_w_m2 | 342.6 | 341.6 | -0.3% |
| lab|washington | clg_dp_0.4|total_w_m2 | 371.8 | 370.3 | -0.4% |
| lab|washington | htg_99.6|total_w_m2 | 256.0 | 255.9 | -0.0% |
| office|albuquerque | clg_db_0.4|total_w_m2 | 41.2 | 41.5 | +0.8% |
| office|albuquerque | clg_dp_0.4|total_w_m2 | 35.9 | 36.2 | +0.9% |
| office|albuquerque | htg_99.6|total_w_m2 | 28.6 | 28.5 | -0.2% |
| office|atlanta | clg_db_0.4|total_w_m2 | 51.9 | 51.5 | -0.7% |
| office|atlanta | clg_dp_0.4|total_w_m2 | 50.2 | 49.8 | -0.8% |
| office|atlanta | htg_99.6|total_w_m2 | 31.5 | 31.5 | +0.0% |
| office|boston | clg_db_0.4|total_w_m2 | 52.3 | 51.8 | -1.0% |
| office|boston | clg_dp_0.4|total_w_m2 | 53.1 | 52.9 | -0.5% |
| office|boston | htg_99.6|total_w_m2 | 37.4 | 37.4 | -0.1% |
| office|buffalo | clg_db_0.4|total_w_m2 | 49.1 | 48.1 | -2.1% |
| office|buffalo | clg_dp_0.4|total_w_m2 | 51.4 | 50.4 | -1.9% |
| office|buffalo | htg_99.6|total_w_m2 | 39.6 | 39.5 | -0.3% |
| office|chicago | clg_db_0.4|total_w_m2 | 54.9 | 53.8 | -1.9% |
| office|chicago | clg_dp_0.4|total_w_m2 | 56.9 | 55.9 | -1.8% |
| office|chicago | htg_99.6|total_w_m2 | 43.6 | 43.5 | -0.3% |
| office|dallas | clg_db_0.4|total_w_m2 | 54.8 | 54.1 | -1.2% |
| office|dallas | clg_dp_0.4|total_w_m2 | 53.7 | 52.9 | -1.5% |
| office|dallas | htg_99.6|total_w_m2 | 33.2 | 33.1 | -0.3% |
| office|denver | clg_db_0.4|total_w_m2 | 40.7 | 40.5 | -0.6% |
| office|denver | clg_dp_0.4|total_w_m2 | 36.4 | 37.1 | +2.1% |
| office|denver | htg_99.6|total_w_m2 | 36.0 | 35.9 | -0.4% |
| office|elpaso | clg_db_0.4|total_w_m2 | 42.6 | 42.1 | -1.2% |
| office|elpaso | clg_dp_0.4|total_w_m2 | 38.7 | 38.4 | -0.8% |
| office|elpaso | htg_99.6|total_w_m2 | 27.7 | 27.5 | -0.8% |
| office|fairbanks | clg_db_0.4|total_w_m2 | 40.2 | 40.3 | +0.1% |
| office|fairbanks | clg_dp_0.4|total_w_m2 | 37.2 | 36.7 | -1.3% |
| office|fairbanks | htg_99.6|total_w_m2 | 61.9 | 62.3 | +0.6% |
| office|greatfalls | clg_db_0.4|total_w_m2 | 40.6 | 39.3 | -3.2% |
| office|greatfalls | clg_dp_0.4|total_w_m2 | 34.2 | 32.2 | -6.0% |
| office|greatfalls | htg_99.6|total_w_m2 | 46.0 | 46.1 | +0.0% |
| office|honolulu | clg_db_0.4|total_w_m2 | 49.9 | 49.6 | -0.5% |
| office|honolulu | clg_dp_0.4|total_w_m2 | 50.7 | 50.1 | -1.2% |
| office|honolulu | htg_99.6|total_w_m2 | 6.5 | 6.4 | -2.3% |
| office|houston | clg_db_0.4|total_w_m2 | 55.9 | 56.0 | +0.2% |
| office|houston | clg_dp_0.4|total_w_m2 | 55.2 | 55.3 | +0.1% |
| office|houston | htg_99.6|total_w_m2 | 27.3 | 27.3 | -0.1% |
| office|intlfalls | clg_db_0.4|total_w_m2 | 49.4 | 48.6 | -1.7% |
| office|intlfalls | clg_dp_0.4|total_w_m2 | 50.8 | 50.0 | -1.6% |
| office|intlfalls | htg_99.6|total_w_m2 | 53.3 | 53.0 | -0.4% |
| office|kansascity | clg_db_0.4|total_w_m2 | 58.1 | 58.1 | +0.1% |
| office|kansascity | clg_dp_0.4|total_w_m2 | 59.8 | 59.8 | -0.0% |
| office|kansascity | htg_99.6|total_w_m2 | 42.6 | 42.7 | +0.2% |
| office|losangeles | clg_db_0.4|total_w_m2 | 36.6 | 36.5 | -0.5% |
| office|losangeles | clg_dp_0.4|total_w_m2 | 39.5 | 39.5 | -0.1% |
| office|losangeles | htg_99.6|total_w_m2 | 16.6 | 16.5 | -1.0% |
| office|miami | clg_db_0.4|total_w_m2 | 56.3 | 56.0 | -0.5% |
| office|miami | clg_dp_0.4|total_w_m2 | 57.0 | 56.8 | -0.3% |
| office|miami | htg_99.6|total_w_m2 | 15.4 | 15.3 | -0.6% |
| office|newyork | clg_db_0.4|total_w_m2 | 52.9 | 52.6 | -0.7% |
| office|newyork | clg_dp_0.4|total_w_m2 | 54.7 | 54.4 | -0.7% |
| office|newyork | htg_99.6|total_w_m2 | 35.8 | 35.8 | +0.1% |
| office|phoenix | clg_db_0.4|total_w_m2 | 51.8 | 51.7 | -0.1% |
| office|phoenix | clg_dp_0.4|total_w_m2 | 48.7 | 48.3 | -0.8% |
| office|phoenix | htg_99.6|total_w_m2 | 21.1 | 21.0 | -0.3% |
| office|portangeles | clg_db_0.4|total_w_m2 | 38.8 | 38.1 | -1.8% |
| office|portangeles | clg_dp_0.4|total_w_m2 | 33.8 | 32.7 | -3.2% |
| office|portangeles | htg_99.6|total_w_m2 | 26.9 | 26.8 | -0.2% |
| office|rochestermn | clg_db_0.4|total_w_m2 | 52.5 | 52.3 | -0.2% |
| office|rochestermn | clg_dp_0.4|total_w_m2 | 54.9 | 54.7 | -0.5% |
| office|rochestermn | htg_99.6|total_w_m2 | 47.8 | 47.8 | -0.0% |
| office|sandiego | clg_db_0.4|total_w_m2 | 41.0 | 41.5 | +1.3% |
| office|sandiego | clg_dp_0.4|total_w_m2 | 44.8 | 45.8 | +2.3% |
| office|sandiego | htg_99.6|total_w_m2 | 16.6 | 16.4 | -0.9% |
| office|sanfrancisco | clg_db_0.4|total_w_m2 | 34.4 | 34.3 | -0.3% |
| office|sanfrancisco | clg_dp_0.4|total_w_m2 | 29.5 | 29.2 | -1.2% |
| office|sanfrancisco | htg_99.6|total_w_m2 | 20.3 | 20.2 | -0.4% |
| office|seattle | clg_db_0.4|total_w_m2 | 42.5 | 42.0 | -1.4% |
| office|seattle | clg_dp_0.4|total_w_m2 | 36.4 | 36.2 | -0.4% |
| office|seattle | htg_99.6|total_w_m2 | 28.0 | 28.0 | +0.0% |
| office|stlouis | clg_db_0.4|total_w_m2 | 59.2 | 58.5 | -1.2% |
| office|stlouis | clg_dp_0.4|total_w_m2 | 59.5 | 58.9 | -1.0% |
| office|stlouis | htg_99.6|total_w_m2 | 40.6 | 40.6 | +0.0% |
| office|tampa | clg_db_0.4|total_w_m2 | 56.5 | 56.0 | -0.9% |
| office|tampa | clg_dp_0.4|total_w_m2 | 58.2 | 57.8 | -0.8% |
| office|tampa | htg_99.6|total_w_m2 | 21.1 | 21.1 | -0.1% |
| office|tucson | clg_db_0.4|total_w_m2 | 46.0 | 45.8 | -0.4% |
| office|tucson | clg_dp_0.4|total_w_m2 | 41.5 | 41.6 | +0.2% |
| office|tucson | htg_99.6|total_w_m2 | 24.3 | 24.2 | -0.2% |
| office|washington | clg_db_0.4|total_w_m2 | 57.5 | 56.7 | -1.4% |
| office|washington | clg_dp_0.4|total_w_m2 | 57.5 | 56.9 | -1.1% |
| office|washington | htg_99.6|total_w_m2 | 33.4 | 33.3 | -0.2% |
| retail|albuquerque | clg_db_0.4|total_w_m2 | 50.8 | 50.0 | -1.5% |
| retail|albuquerque | clg_dp_0.4|total_w_m2 | 46.7 | 46.0 | -1.5% |
| retail|albuquerque | htg_99.6|total_w_m2 | 48.3 | 48.2 | -0.2% |
| retail|atlanta | clg_db_0.4|total_w_m2 | 78.4 | 77.7 | -0.9% |
| retail|atlanta | clg_dp_0.4|total_w_m2 | 79.3 | 78.6 | -0.9% |
| retail|atlanta | htg_99.6|total_w_m2 | 53.2 | 53.1 | -0.2% |
| retail|boston | clg_db_0.4|total_w_m2 | 76.1 | 74.3 | -2.3% |
| retail|boston | clg_dp_0.4|total_w_m2 | 80.5 | 78.6 | -2.3% |
| retail|boston | htg_99.6|total_w_m2 | 66.6 | 66.6 | -0.0% |
| retail|buffalo | clg_db_0.4|total_w_m2 | 69.8 | 69.1 | -1.1% |
| retail|buffalo | clg_dp_0.4|total_w_m2 | 77.3 | 76.2 | -1.4% |
| retail|buffalo | htg_99.6|total_w_m2 | 70.5 | 70.4 | -0.1% |
| retail|chicago | clg_db_0.4|total_w_m2 | 81.9 | 80.5 | -1.7% |
| retail|chicago | clg_dp_0.4|total_w_m2 | 88.8 | 87.2 | -1.8% |
| retail|chicago | htg_99.6|total_w_m2 | 77.8 | 77.8 | +0.0% |
| retail|dallas | clg_db_0.4|total_w_m2 | 81.4 | 80.4 | -1.3% |
| retail|dallas | clg_dp_0.4|total_w_m2 | 85.7 | 84.4 | -1.5% |
| retail|dallas | htg_99.6|total_w_m2 | 55.5 | 55.5 | +0.1% |
| retail|denver | clg_db_0.4|total_w_m2 | 49.9 | 49.5 | -0.8% |
| retail|denver | clg_dp_0.4|total_w_m2 | 46.8 | 45.9 | -1.9% |
| retail|denver | htg_99.6|total_w_m2 | 62.7 | 62.6 | -0.1% |
| retail|elpaso | clg_db_0.4|total_w_m2 | 55.4 | 54.7 | -1.4% |
| retail|elpaso | clg_dp_0.4|total_w_m2 | 56.1 | 55.3 | -1.5% |
| retail|elpaso | htg_99.6|total_w_m2 | 46.5 | 46.3 | -0.3% |
| retail|fairbanks | clg_db_0.4|total_w_m2 | 44.5 | 44.6 | +0.2% |
| retail|fairbanks | clg_dp_0.4|total_w_m2 | 40.9 | 39.8 | -2.6% |
| retail|fairbanks | htg_99.6|total_w_m2 | 115.8 | 116.0 | +0.1% |
| retail|greatfalls | clg_db_0.4|total_w_m2 | 49.2 | 48.0 | -2.4% |
| retail|greatfalls | clg_dp_0.4|total_w_m2 | 40.6 | 37.8 | -6.9% |
| retail|greatfalls | htg_99.6|total_w_m2 | 82.6 | 82.6 | -0.0% |
| retail|honolulu | clg_db_0.4|total_w_m2 | 74.7 | 74.4 | -0.5% |
| retail|honolulu | clg_dp_0.4|total_w_m2 | 80.4 | 79.8 | -0.8% |
| retail|honolulu | htg_99.6|total_w_m2 | 8.8 | 8.7 | -1.7% |
| retail|houston | clg_db_0.4|total_w_m2 | 86.3 | 85.6 | -0.9% |
| retail|houston | clg_dp_0.4|total_w_m2 | 90.2 | 89.5 | -0.7% |
| retail|houston | htg_99.6|total_w_m2 | 45.6 | 45.6 | -0.0% |
| retail|intlfalls | clg_db_0.4|total_w_m2 | 68.3 | 66.5 | -2.7% |
| retail|intlfalls | clg_dp_0.4|total_w_m2 | 73.6 | 71.2 | -3.4% |
| retail|intlfalls | htg_99.6|total_w_m2 | 97.8 | 97.8 | -0.0% |
| retail|kansascity | clg_db_0.4|total_w_m2 | 88.6 | 87.1 | -1.7% |
| retail|kansascity | clg_dp_0.4|total_w_m2 | 95.4 | 94.1 | -1.4% |
| retail|kansascity | htg_99.6|total_w_m2 | 74.4 | 74.4 | -0.0% |
| retail|losangeles | clg_db_0.4|total_w_m2 | 45.2 | 44.8 | -0.9% |
| retail|losangeles | clg_dp_0.4|total_w_m2 | 55.8 | 55.0 | -1.5% |
| retail|losangeles | htg_99.6|total_w_m2 | 27.4 | 27.4 | -0.1% |
| retail|miami | clg_db_0.4|total_w_m2 | 88.3 | 88.3 | -0.0% |
| retail|miami | clg_dp_0.4|total_w_m2 | 93.1 | 93.0 | -0.1% |
| retail|miami | htg_99.6|total_w_m2 | 24.5 | 24.4 | -0.2% |
| retail|newyork | clg_db_0.4|total_w_m2 | 77.4 | 76.4 | -1.3% |
| retail|newyork | clg_dp_0.4|total_w_m2 | 84.3 | 83.0 | -1.5% |
| retail|newyork | htg_99.6|total_w_m2 | 62.4 | 62.3 | -0.1% |
| retail|phoenix | clg_db_0.4|total_w_m2 | 70.9 | 70.5 | -0.5% |
| retail|phoenix | clg_dp_0.4|total_w_m2 | 74.8 | 74.4 | -0.5% |
| retail|phoenix | htg_99.6|total_w_m2 | 34.1 | 34.1 | -0.1% |
| retail|portangeles | clg_db_0.4|total_w_m2 | 45.2 | 44.4 | -1.7% |
| retail|portangeles | clg_dp_0.4|total_w_m2 | 37.6 | 37.2 | -0.9% |
| retail|portangeles | htg_99.6|total_w_m2 | 47.6 | 47.5 | -0.2% |
| retail|rochestermn | clg_db_0.4|total_w_m2 | 77.9 | 76.9 | -1.2% |
| retail|rochestermn | clg_dp_0.4|total_w_m2 | 85.3 | 84.5 | -0.9% |
| retail|rochestermn | htg_99.6|total_w_m2 | 86.5 | 86.3 | -0.2% |
| retail|sandiego | clg_db_0.4|total_w_m2 | 55.1 | 54.5 | -1.1% |
| retail|sandiego | clg_dp_0.4|total_w_m2 | 66.5 | 65.8 | -1.1% |
| retail|sandiego | htg_99.6|total_w_m2 | 27.2 | 27.0 | -0.6% |
| retail|sanfrancisco | clg_db_0.4|total_w_m2 | 40.9 | 40.5 | -1.2% |
| retail|sanfrancisco | clg_dp_0.4|total_w_m2 | 35.1 | 35.2 | +0.1% |
| retail|sanfrancisco | htg_99.6|total_w_m2 | 33.8 | 33.7 | -0.2% |
| retail|seattle | clg_db_0.4|total_w_m2 | 52.7 | 51.7 | -1.8% |
| retail|seattle | clg_dp_0.4|total_w_m2 | 43.6 | 43.3 | -0.6% |
| retail|seattle | htg_99.6|total_w_m2 | 48.4 | 48.4 | -0.0% |
| retail|stlouis | clg_db_0.4|total_w_m2 | 90.5 | 88.9 | -1.8% |
| retail|stlouis | clg_dp_0.4|total_w_m2 | 94.2 | 92.4 | -1.9% |
| retail|stlouis | htg_99.6|total_w_m2 | 70.9 | 70.8 | -0.1% |
| retail|tampa | clg_db_0.4|total_w_m2 | 88.2 | 87.4 | -1.0% |
| retail|tampa | clg_dp_0.4|total_w_m2 | 95.2 | 94.0 | -1.3% |
| retail|tampa | htg_99.6|total_w_m2 | 34.8 | 34.7 | -0.4% |
| retail|tucson | clg_db_0.4|total_w_m2 | 61.5 | 60.3 | -2.0% |
| retail|tucson | clg_dp_0.4|total_w_m2 | 62.0 | 60.8 | -1.9% |
| retail|tucson | htg_99.6|total_w_m2 | 39.8 | 39.7 | -0.2% |
| retail|washington | clg_db_0.4|total_w_m2 | 86.9 | 85.9 | -1.1% |
| retail|washington | clg_dp_0.4|total_w_m2 | 90.1 | 89.3 | -0.9% |
| retail|washington | htg_99.6|total_w_m2 | 58.2 | 58.1 | -0.2% |
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
| school|denver | clg_db_0.4|total_w_m2 | 78.6 | 79.6 | +1.2% |
| school|denver | clg_dp_0.4|total_w_m2 | 79.8 | 81.6 | +2.3% |
| school|denver | htg_99.6|total_w_m2 | 109.3 | 109.3 | -0.1% |
| school|elpaso | clg_db_0.4|total_w_m2 | 90.0 | 90.5 | +0.6% |
| school|elpaso | clg_dp_0.4|total_w_m2 | 100.4 | 101.3 | +1.0% |
| school|elpaso | htg_99.6|total_w_m2 | 80.9 | 80.8 | -0.1% |
| school|fairbanks | clg_db_0.4|total_w_m2 | 66.3 | 66.0 | -0.4% |
| school|fairbanks | clg_dp_0.4|total_w_m2 | 61.2 | 59.5 | -2.8% |
| school|fairbanks | htg_99.6|total_w_m2 | 206.0 | 206.2 | +0.1% |
| school|greatfalls | clg_db_0.4|total_w_m2 | 77.5 | 77.2 | -0.4% |
| school|greatfalls | clg_dp_0.4|total_w_m2 | 66.9 | 66.5 | -0.6% |
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
| school|portangeles | clg_dp_0.4|total_w_m2 | 59.0 | 57.5 | -2.6% |
| school|portangeles | htg_99.6|total_w_m2 | 85.4 | 85.3 | -0.1% |
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
| sports|albuquerque | clg_db_0.4|total_w_m2 | 51.0 | 49.7 | -2.5% |
| sports|albuquerque | clg_dp_0.4|total_w_m2 | 42.2 | 38.8 | -8.0% |
| sports|albuquerque | htg_99.6|total_w_m2 | 57.3 | 57.3 | -0.1% |
| sports|atlanta | clg_db_0.4|total_w_m2 | 85.2 | 84.5 | -0.9% |
| sports|atlanta | clg_dp_0.4|total_w_m2 | 87.4 | 86.6 | -0.9% |
| sports|atlanta | htg_99.6|total_w_m2 | 62.9 | 62.8 | -0.1% |
| sports|boston | clg_db_0.4|total_w_m2 | 81.5 | 80.4 | -1.3% |
| sports|boston | clg_dp_0.4|total_w_m2 | 88.0 | 86.6 | -1.6% |
| sports|boston | htg_99.6|total_w_m2 | 81.1 | 81.0 | -0.1% |
| sports|buffalo | clg_db_0.4|total_w_m2 | 73.1 | 72.2 | -1.2% |
| sports|buffalo | clg_dp_0.4|total_w_m2 | 83.6 | 82.2 | -1.7% |
| sports|buffalo | htg_99.6|total_w_m2 | 86.1 | 86.0 | -0.1% |
| sports|chicago | clg_db_0.4|total_w_m2 | 89.2 | 87.8 | -1.6% |
| sports|chicago | clg_dp_0.4|total_w_m2 | 99.0 | 97.0 | -2.0% |
| sports|chicago | htg_99.6|total_w_m2 | 95.5 | 95.5 | -0.0% |
| sports|dallas | clg_db_0.4|total_w_m2 | 88.4 | 88.1 | -0.3% |
| sports|dallas | clg_dp_0.4|total_w_m2 | 95.7 | 95.7 | -0.0% |
| sports|dallas | htg_99.6|total_w_m2 | 65.3 | 65.4 | +0.1% |
| sports|denver | clg_db_0.4|total_w_m2 | 49.9 | 48.5 | -3.0% |
| sports|denver | clg_dp_0.4|total_w_m2 | 42.0 | 34.6 | -17.6% |
| sports|denver | htg_99.6|total_w_m2 | 76.3 | 76.2 | -0.1% |
| sports|elpaso | clg_db_0.4|total_w_m2 | 56.3 | 55.7 | -1.1% |
| sports|elpaso | clg_dp_0.4|total_w_m2 | 56.6 | 60.7 | +7.2% |
| sports|elpaso | htg_99.6|total_w_m2 | 54.5 | 54.4 | -0.3% |
| sports|fairbanks | clg_db_0.4|total_w_m2 | 40.4 | 40.2 | -0.4% |
| sports|fairbanks | clg_dp_0.4|total_w_m2 | 32.7 | 27.3 | -16.6% |
| sports|fairbanks | htg_99.6|total_w_m2 | 146.5 | 146.8 | +0.2% |
| sports|greatfalls | clg_db_0.4|total_w_m2 | 48.8 | 47.3 | -3.1% |
| sports|greatfalls | clg_dp_0.4|total_w_m2 | 32.9 | 27.8 | -15.3% |
| sports|greatfalls | htg_99.6|total_w_m2 | 102.4 | 102.4 | +0.0% |
| sports|honolulu | clg_db_0.4|total_w_m2 | 80.5 | 80.4 | -0.2% |
| sports|honolulu | clg_dp_0.4|total_w_m2 | 88.9 | 88.7 | -0.2% |
| sports|honolulu | htg_99.6|total_w_m2 | 5.7 | 5.4 | -4.5% |
| sports|houston | clg_db_0.4|total_w_m2 | 95.7 | 95.1 | -0.7% |
| sports|houston | clg_dp_0.4|total_w_m2 | 102.0 | 101.4 | -0.6% |
| sports|houston | htg_99.6|total_w_m2 | 52.8 | 52.7 | -0.3% |
| sports|intlfalls | clg_db_0.4|total_w_m2 | 70.5 | 69.1 | -2.0% |
| sports|intlfalls | clg_dp_0.4|total_w_m2 | 78.1 | 77.8 | -0.5% |
| sports|intlfalls | htg_99.6|total_w_m2 | 122.4 | 122.3 | -0.0% |
| sports|kansascity | clg_db_0.4|total_w_m2 | 98.0 | 97.2 | -0.8% |
| sports|kansascity | clg_dp_0.4|total_w_m2 | 107.9 | 106.8 | -1.0% |
| sports|kansascity | htg_99.6|total_w_m2 | 90.7 | 90.5 | -0.2% |
| sports|losangeles | clg_db_0.4|total_w_m2 | 40.9 | 41.2 | +0.7% |
| sports|losangeles | clg_dp_0.4|total_w_m2 | 56.3 | 58.3 | +3.5% |
| sports|losangeles | htg_99.6|total_w_m2 | 29.8 | 29.7 | -0.4% |
| sports|miami | clg_db_0.4|total_w_m2 | 98.6 | 98.4 | -0.2% |
| sports|miami | clg_dp_0.4|total_w_m2 | 105.7 | 105.3 | -0.4% |
| sports|miami | htg_99.6|total_w_m2 | 25.7 | 25.6 | -0.3% |
| sports|newyork | clg_db_0.4|total_w_m2 | 83.1 | 82.4 | -0.9% |
| sports|newyork | clg_dp_0.4|total_w_m2 | 93.1 | 92.6 | -0.5% |
| sports|newyork | htg_99.6|total_w_m2 | 75.0 | 75.0 | -0.1% |
| sports|phoenix | clg_db_0.4|total_w_m2 | 74.4 | 73.9 | -0.6% |
| sports|phoenix | clg_dp_0.4|total_w_m2 | 80.9 | 80.3 | -0.7% |
| sports|phoenix | htg_99.6|total_w_m2 | 38.1 | 38.0 | -0.2% |
| sports|portangeles | clg_db_0.4|total_w_m2 | 39.4 | 38.6 | -1.9% |
| sports|portangeles | clg_dp_0.4|total_w_m2 | 28.8 | 21.0 | -27.1% |
| sports|portangeles | htg_99.6|total_w_m2 | 56.7 | 56.5 | -0.2% |
| sports|rochestermn | clg_db_0.4|total_w_m2 | 84.1 | 83.1 | -1.2% |
| sports|rochestermn | clg_dp_0.4|total_w_m2 | 94.5 | 93.3 | -1.3% |
| sports|rochestermn | htg_99.6|total_w_m2 | 107.3 | 107.3 | -0.0% |
| sports|sandiego | clg_db_0.4|total_w_m2 | 54.3 | 54.3 | +0.0% |
| sports|sandiego | clg_dp_0.4|total_w_m2 | 70.2 | 69.9 | -0.4% |
| sports|sandiego | htg_99.6|total_w_m2 | 29.5 | 29.4 | -0.3% |
| sports|sanfrancisco | clg_db_0.4|total_w_m2 | 35.3 | 35.3 | +0.1% |
| sports|sanfrancisco | clg_dp_0.4|total_w_m2 | 27.8 | 23.1 | -16.9% |
| sports|sanfrancisco | htg_99.6|total_w_m2 | 38.1 | 38.0 | -0.3% |
| sports|seattle | clg_db_0.4|total_w_m2 | 49.1 | 48.1 | -2.0% |
| sports|seattle | clg_dp_0.4|total_w_m2 | 37.9 | 33.8 | -10.7% |
| sports|seattle | htg_99.6|total_w_m2 | 57.2 | 57.2 | -0.1% |
| sports|stlouis | clg_db_0.4|total_w_m2 | 100.5 | 100.0 | -0.4% |
| sports|stlouis | clg_dp_0.4|total_w_m2 | 106.2 | 105.6 | -0.6% |
| sports|stlouis | htg_99.6|total_w_m2 | 86.0 | 86.0 | -0.1% |
| sports|tampa | clg_db_0.4|total_w_m2 | 98.4 | 97.8 | -0.6% |
| sports|tampa | clg_dp_0.4|total_w_m2 | 108.4 | 107.5 | -0.8% |
| sports|tampa | htg_99.6|total_w_m2 | 39.1 | 39.0 | -0.2% |
| sports|tucson | clg_db_0.4|total_w_m2 | 65.2 | 64.6 | -0.9% |
| sports|tucson | clg_dp_0.4|total_w_m2 | 64.5 | 65.4 | +1.4% |
| sports|tucson | htg_99.6|total_w_m2 | 45.6 | 45.5 | -0.3% |
| sports|washington | clg_db_0.4|total_w_m2 | 95.7 | 94.0 | -1.8% |
| sports|washington | clg_dp_0.4|total_w_m2 | 100.8 | 98.7 | -2.0% |
| sports|washington | htg_99.6|total_w_m2 | 69.7 | 69.6 | -0.2% |
| stadium|albuquerque | clg_db_0.4|total_w_m2 | 177.0 | 181.7 | +2.6% |
| stadium|albuquerque | clg_dp_0.4|total_w_m2 | 188.8 | 194.1 | +2.8% |
| stadium|albuquerque | htg_99.6|total_w_m2 | 181.0 | 180.9 | -0.0% |
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
| stadium|elpaso | clg_db_0.4|total_w_m2 | 205.6 | 208.3 | +1.3% |
| stadium|elpaso | clg_dp_0.4|total_w_m2 | 242.6 | 246.7 | +1.7% |
| stadium|elpaso | htg_99.6|total_w_m2 | 171.5 | 171.4 | -0.1% |
| stadium|fairbanks | clg_db_0.4|total_w_m2 | 135.6 | 136.2 | +0.4% |
| stadium|fairbanks | clg_dp_0.4|total_w_m2 | 121.8 | 122.3 | +0.4% |
| stadium|fairbanks | htg_99.6|total_w_m2 | 487.4 | 487.6 | +0.0% |
| stadium|greatfalls | clg_db_0.4|total_w_m2 | 170.7 | 173.6 | +1.7% |
| stadium|greatfalls | clg_dp_0.4|total_w_m2 | 147.2 | 153.7 | +4.4% |
| stadium|greatfalls | htg_99.6|total_w_m2 | 333.1 | 333.0 | -0.0% |
| stadium|honolulu | clg_db_0.4|total_w_m2 | 305.5 | 309.2 | +1.2% |
| stadium|honolulu | clg_dp_0.4|total_w_m2 | 348.2 | 352.7 | +1.3% |
| stadium|honolulu | htg_99.6|total_w_m2 | 16.3 | 15.7 | -3.7% |
| stadium|houston | clg_db_0.4|total_w_m2 | 355.1 | 358.5 | +1.0% |
| stadium|houston | clg_dp_0.4|total_w_m2 | 394.4 | 398.0 | +0.9% |
| stadium|houston | htg_99.6|total_w_m2 | 166.5 | 166.4 | -0.0% |
| stadium|intlfalls | clg_db_0.4|total_w_m2 | 257.4 | 259.5 | +0.8% |
| stadium|intlfalls | clg_dp_0.4|total_w_m2 | 291.5 | 293.0 | +0.5% |
| stadium|intlfalls | htg_99.6|total_w_m2 | 403.3 | 403.3 | -0.0% |
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
| stadium|portangeles | clg_db_0.4|total_w_m2 | 143.0 | 147.5 | +3.1% |
| stadium|portangeles | clg_dp_0.4|total_w_m2 | 120.2 | 117.4 | -2.3% |
| stadium|portangeles | htg_99.6|total_w_m2 | 184.8 | 184.7 | -0.0% |
| stadium|rochestermn | clg_db_0.4|total_w_m2 | 313.7 | 314.4 | +0.2% |
| stadium|rochestermn | clg_dp_0.4|total_w_m2 | 357.4 | 358.4 | +0.3% |
| stadium|rochestermn | htg_99.6|total_w_m2 | 351.2 | 351.1 | -0.0% |
| stadium|sandiego | clg_db_0.4|total_w_m2 | 209.0 | 215.1 | +2.9% |
| stadium|sandiego | clg_dp_0.4|total_w_m2 | 277.0 | 282.3 | +1.9% |
| stadium|sandiego | htg_99.6|total_w_m2 | 93.2 | 93.0 | -0.3% |
| stadium|sanfrancisco | clg_db_0.4|total_w_m2 | 137.8 | 136.8 | -0.7% |
| stadium|sanfrancisco | clg_dp_0.4|total_w_m2 | 131.3 | 140.1 | +6.7% |
| stadium|sanfrancisco | htg_99.6|total_w_m2 | 120.9 | 120.8 | -0.1% |
| stadium|seattle | clg_db_0.4|total_w_m2 | 176.3 | 180.1 | +2.1% |
| stadium|seattle | clg_dp_0.4|total_w_m2 | 149.8 | 154.6 | +3.2% |
| stadium|seattle | htg_99.6|total_w_m2 | 184.4 | 184.3 | -0.0% |
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

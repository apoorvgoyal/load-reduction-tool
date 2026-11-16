# Surrogate validation against EnergyPlus

Generated 2026-11-16T17:17:31+00:00 by `engine/validate.py`. Each model is tested on EnergyPlus runs it was not trained on (independent Latin-hypercube sample, seed 9001, plus the building type default).

Pass rule: worst 95th-percentile absolute error on the peaks the page reports <= 5.0%. Those are the governing cooling peak for each percentile (the larger of the dry-bulb and dew-point days, as EnergyPlus and the model each see it) and the heating peak for each percentile. "Any single day" judges every design day on its own value, including mild days that never govern and can sit near zero; it is shown for information. Peaks are one-hour averages. A peak below 10% of the case's design load (larger of 0.4% cooling and 99.6% heating) is judged as a share of that 10%, not of itself.

| Model | Test runs | Worst P95, reported peaks | Which peak | Cooling 0.4% | Heating 99.6% | Any single day (info) | Result |
|---|---|---|---|---|---|---|---|
| healthcare|albuquerque | 101 | 2.2% | cooling 2% | 2.1% | 1.3% | 8.0% | PASS |
| healthcare|atlanta | 101 | 1.8% | cooling 2% | 1.7% | 0.4% | 1.9% | PASS |
| healthcare|boston | 101 | 1.7% | cooling 2% | 1.3% | 0.4% | 1.9% | PASS |
| healthcare|buffalo | 101 | 2.7% | cooling 2% | 1.8% | 0.3% | 3.7% | PASS |
| healthcare|chicago | 101 | 2.5% | cooling 2% | 2.0% | 0.4% | 3.0% | PASS |
| healthcare|dallas | 101 | 1.9% | cooling 1% | 1.8% | 0.3% | 2.5% | PASS |
| healthcare|denver | 101 | 2.8% | cooling 0.4% | 2.8% | 1.1% | 57.7% | PASS |
| healthcare|elpaso | 101 | 2.1% | cooling 2% | 1.7% | 1.4% | 2.5% | PASS |
| healthcare|fairbanks | 101 | 2.4% | cooling 2% | 2.1% | 0.9% | 28.4% | PASS |
| healthcare|greatfalls | 101 | 2.5% | cooling 2% | 2.5% | 1.5% | 15.1% | PASS |
| healthcare|honolulu | 101 | 2.1% | cooling 2% | 1.9% | 0.8% | 2.3% | PASS |
| healthcare|houston | 101 | 1.5% | cooling 2% | 1.4% | 0.3% | 2.6% | PASS |
| healthcare|intlfalls | 101 | 2.0% | cooling 2% | 1.5% | 0.8% | 2.3% | PASS |
| healthcare|kansascity | 101 | 2.3% | cooling 2% | 1.8% | 0.4% | 2.7% | PASS |
| healthcare|losangeles | 101 | 3.4% | cooling 2% | 2.6% | 0.8% | 3.4% | PASS |
| healthcare|miami | 101 | 2.1% | cooling 2% | 2.0% | 0.6% | 2.3% | PASS |
| healthcare|newyork | 101 | 1.8% | cooling 2% | 1.7% | 0.3% | 1.9% | PASS |
| healthcare|phoenix | 101 | 1.9% | cooling 1% | 1.8% | 0.5% | 2.2% | PASS |
| healthcare|portangeles | 101 | 4.1% | cooling 2% | 2.0% | 1.0% | 21.6% | **FAIL** |
| healthcare|rochestermn | 101 | 3.4% | cooling 2% | 2.0% | 0.4% | 3.4% | PASS |
| healthcare|sandiego | 101 | 4.1% | cooling 2% | 2.8% | 0.4% | 4.1% | PASS |
| healthcare|sanfrancisco | 101 | 4.5% | cooling 2% | 3.4% | 1.3% | 34.8% | PASS |
| healthcare|seattle | 101 | 2.1% | cooling 1% | 1.6% | 1.4% | 9.4% | PASS |
| healthcare|stlouis | 101 | 1.5% | cooling 2% | 1.2% | 0.3% | 1.5% | PASS |
| healthcare|tampa | 101 | 2.0% | cooling 2% | 2.0% | 0.5% | 2.1% | PASS |
| healthcare|tucson | 101 | 3.0% | cooling 1% | 2.4% | 0.5% | 3.8% | PASS |
| healthcare|washington | 101 | 1.9% | cooling 2% | 1.8% | 0.3% | 2.0% | PASS |
| higher_ed|albuquerque | 101 | 2.3% | cooling 1% | 2.1% | 1.3% | 6.4% | PASS |
| higher_ed|atlanta | 101 | 1.9% | cooling 2% | 1.7% | 0.5% | 2.8% | PASS |
| higher_ed|boston | 101 | 2.3% | cooling 2% | 1.8% | 0.6% | 2.3% | PASS |
| higher_ed|buffalo | 101 | 4.4% | cooling 2% | 3.6% | 0.6% | 4.4% | PASS |
| higher_ed|chicago | 101 | 2.6% | cooling 1% | 2.5% | 0.5% | 2.7% | PASS |
| higher_ed|dallas | 101 | 1.1% | cooling 1% | 1.0% | 0.4% | 1.4% | PASS |
| higher_ed|denver | 101 | 3.8% | cooling 0.4% | 3.8% | 0.6% | 8.0% | PASS |
| higher_ed|elpaso | 101 | 2.7% | cooling 0.4% | 2.7% | 0.7% | 3.5% | PASS |
| higher_ed|fairbanks | 101 | 4.2% | cooling 0.4% | 4.2% | 0.5% | 8.3% | PASS |
| higher_ed|greatfalls | 101 | 2.5% | cooling 0.4% | 2.5% | 1.0% | 4.7% | PASS |
| higher_ed|honolulu | 101 | 2.3% | cooling 2% | 2.1% | 1.4% | 2.9% | PASS |
| higher_ed|houston | 101 | 2.3% | cooling 0.4% | 2.3% | 0.7% | 2.7% | PASS |
| higher_ed|intlfalls | 101 | 3.2% | cooling 1% | 2.9% | 0.4% | 3.5% | PASS |
| higher_ed|kansascity | 101 | 1.5% | cooling 2% | 1.4% | 0.4% | 1.9% | PASS |
| higher_ed|losangeles | 101 | 3.3% | cooling 2% | 2.8% | 1.3% | 3.3% | PASS |
| higher_ed|miami | 101 | 2.2% | cooling 1% | 2.2% | 0.8% | 2.3% | PASS |
| higher_ed|newyork | 101 | 2.3% | cooling 2% | 1.9% | 0.6% | 2.5% | PASS |
| higher_ed|phoenix | 101 | 2.7% | cooling 2% | 2.5% | 0.8% | 2.9% | PASS |
| higher_ed|portangeles | 101 | 4.5% | cooling 2% | 3.1% | 1.2% | 5.2% | PASS |
| higher_ed|rochestermn | 101 | 2.9% | cooling 2% | 2.6% | 0.7% | 3.0% | PASS |
| higher_ed|sandiego | 101 | 2.4% | cooling 2% | 2.1% | 0.6% | 2.4% | PASS |
| higher_ed|sanfrancisco | 101 | 3.3% | cooling 2% | 3.2% | 1.0% | 5.0% | PASS |
| higher_ed|seattle | 101 | 3.5% | cooling 2% | 2.6% | 0.7% | 7.2% | PASS |
| higher_ed|stlouis | 101 | 2.3% | cooling 2% | 2.2% | 0.5% | 3.0% | PASS |
| higher_ed|tampa | 101 | 1.8% | cooling 0.4% | 1.8% | 0.5% | 2.1% | PASS |
| higher_ed|tucson | 101 | 3.0% | cooling 1% | 3.0% | 0.6% | 3.3% | PASS |
| higher_ed|washington | 101 | 1.9% | cooling 2% | 1.6% | 0.4% | 1.9% | PASS |
| hotel|albuquerque | 101 | 2.6% | cooling 2% | 2.3% | 1.0% | 6.1% | PASS |
| hotel|atlanta | 101 | 2.5% | cooling 0.4% | 2.5% | 0.7% | 3.2% | PASS |
| hotel|boston | 101 | 3.7% | cooling 2% | 3.2% | 0.6% | 4.4% | PASS |
| hotel|buffalo | 101 | 2.2% | cooling 2% | 2.1% | 1.2% | 2.2% | PASS |
| hotel|chicago | 101 | 3.4% | cooling 2% | 2.8% | 0.5% | 3.4% | PASS |
| hotel|dallas | 101 | 2.4% | cooling 2% | 2.3% | 0.7% | 2.4% | PASS |
| hotel|denver | 101 | 3.7% | cooling 2% | 3.5% | 0.6% | 13.1% | PASS |
| hotel|elpaso | 101 | 3.2% | cooling 0.4% | 3.2% | 0.6% | 4.7% | PASS |
| hotel|fairbanks | 101 | 3.4% | cooling 2% | 2.6% | 1.0% | 7.3% | PASS |
| hotel|greatfalls | 101 | 3.3% | cooling 2% | 2.6% | 1.0% | 5.2% | PASS |
| hotel|honolulu | 101 | 4.1% | cooling 2% | 3.8% | 1.3% | 4.5% | PASS |
| hotel|houston | 101 | 2.5% | cooling 1% | 2.4% | 0.7% | 3.0% | PASS |
| hotel|intlfalls | 101 | 2.9% | cooling 2% | 2.1% | 1.0% | 3.1% | PASS |
| hotel|kansascity | 101 | 2.6% | cooling 2% | 2.4% | 0.4% | 3.0% | PASS |
| hotel|losangeles | 101 | 2.7% | cooling 0.4% | 2.7% | 1.8% | 2.7% | PASS |
| hotel|miami | 101 | 2.7% | cooling 0.4% | 2.7% | 0.6% | 2.7% | PASS |
| hotel|newyork | 101 | 3.1% | cooling 2% | 2.8% | 0.5% | 3.2% | PASS |
| hotel|phoenix | 101 | 2.3% | cooling 1% | 2.3% | 0.7% | 3.0% | PASS |
| hotel|portangeles | 101 | 6.6% | cooling 2% | 4.1% | 0.9% | 10.1% | **FAIL** |
| hotel|rochestermn | 101 | 4.0% | cooling 2% | 3.6% | 0.5% | 4.8% | PASS |
| hotel|sandiego | 101 | 3.2% | cooling 2% | 2.5% | 1.2% | 3.2% | PASS |
| hotel|sanfrancisco | 101 | 3.7% | cooling 2% | 2.8% | 1.1% | 10.1% | PASS |
| hotel|seattle | 101 | 4.8% | cooling 2% | 3.2% | 1.6% | 10.3% | **FAIL** |
| hotel|stlouis | 101 | 2.8% | cooling 0.4% | 2.8% | 0.6% | 3.1% | PASS |
| hotel|tampa | 101 | 2.2% | cooling 2% | 2.2% | 0.8% | 2.2% | PASS |
| hotel|tucson | 101 | 3.1% | cooling 0.4% | 3.1% | 0.8% | 3.4% | PASS |
| hotel|washington | 101 | 3.6% | cooling 2% | 3.4% | 0.8% | 4.1% | PASS |
| lab|albuquerque | 101 | 14.2% | cooling 0.4% | 14.2% | 2.2% | 40.3% | **FAIL** |
| lab|atlanta | 101 | 1.2% | cooling 2% | 1.0% | 0.2% | 1.2% | PASS |
| lab|boston | 101 | 2.3% | cooling 0.4% | 2.3% | 0.2% | 2.6% | PASS |
| lab|buffalo | 101 | 1.5% | cooling 1% | 1.4% | 0.2% | 1.6% | PASS |
| lab|chicago | 101 | 1.4% | cooling 2% | 1.1% | 0.2% | 1.5% | PASS |
| lab|dallas | 101 | 1.0% | cooling 2% | 0.9% | 0.2% | 1.2% | PASS |
| lab|denver | 101 | 2.3% | cooling 2% | 1.5% | 0.9% | 41.9% | PASS |
| lab|elpaso | 101 | 3.3% | cooling 0.4% | 3.3% | 0.3% | 7.5% | PASS |
| lab|fairbanks | 101 | 2.2% | cooling 1% | 1.6% | 1.0% | 19.9% | PASS |
| lab|greatfalls | 101 | 2.3% | cooling 1% | 2.2% | 1.4% | 13.3% | PASS |
| lab|honolulu | 101 | 2.5% | cooling 2% | 2.0% | 0.3% | 2.5% | PASS |
| lab|houston | 101 | 0.9% | cooling 2% | 0.9% | 0.2% | 0.9% | PASS |
| lab|intlfalls | 101 | 1.1% | cooling 2% | 0.8% | 0.7% | 1.2% | PASS |
| lab|kansascity | 101 | 1.5% | cooling 2% | 1.2% | 0.2% | 2.0% | PASS |
| lab|losangeles | 101 | 2.1% | cooling 2% | 1.8% | 1.4% | 2.1% | PASS |
| lab|miami | 101 | 2.5% | cooling 2% | 1.2% | 0.2% | 2.5% | PASS |
| lab|newyork | 101 | 2.3% | cooling 2% | 2.2% | 0.1% | 2.3% | PASS |
| lab|phoenix | 101 | 1.5% | cooling 1% | 0.8% | 0.2% | 1.6% | PASS |
| lab|portangeles | 101 | 5.5% | cooling 2% | 1.8% | 1.2% | 40.3% | **FAIL** |
| lab|rochestermn | 101 | 1.4% | cooling 2% | 1.2% | 0.2% | 1.6% | PASS |
| lab|sandiego | 101 | 2.5% | cooling 0.4% | 2.5% | 1.2% | 2.7% | PASS |
| lab|sanfrancisco | 101 | 2.3% | cooling 2% | 1.7% | 1.2% | 37.9% | PASS |
| lab|seattle | 101 | 2.0% | cooling 2% | 1.4% | 1.2% | 13.7% | PASS |
| lab|stlouis | 101 | 2.8% | cooling 2% | 2.2% | 0.1% | 2.8% | PASS |
| lab|tampa | 101 | 1.8% | cooling 0.4% | 1.8% | 0.3% | 1.8% | PASS |
| lab|tucson | 101 | 1.4% | cooling 0.4% | 1.4% | 0.3% | 1.8% | PASS |
| lab|washington | 101 | 1.0% | cooling 1% | 0.7% | 0.2% | 1.0% | PASS |
| office|albuquerque | 101 | 3.3% | cooling 1% | 3.3% | 1.3% | 5.3% | PASS |
| office|atlanta | 101 | 2.4% | cooling 2% | 2.2% | 0.7% | 3.9% | PASS |
| office|boston | 101 | 3.2% | cooling 2% | 2.8% | 1.0% | 3.5% | PASS |
| office|buffalo | 101 | 3.3% | cooling 1% | 3.1% | 0.6% | 4.5% | PASS |
| office|chicago | 101 | 3.8% | cooling 2% | 3.1% | 0.6% | 3.8% | PASS |
| office|dallas | 101 | 2.8% | cooling 2% | 2.7% | 0.4% | 3.4% | PASS |
| office|denver | 101 | 5.1% | cooling 2% | 5.0% | 1.5% | 8.8% | **FAIL** |
| office|elpaso | 101 | 2.4% | cooling 2% | 2.2% | 0.9% | 5.2% | PASS |
| office|fairbanks | 101 | 3.4% | cooling 2% | 2.6% | 0.9% | 8.0% | PASS |
| office|greatfalls | 101 | 2.8% | cooling 2% | 2.6% | 0.9% | 5.9% | PASS |
| office|honolulu | 101 | 3.3% | cooling 2% | 3.0% | 3.2% | 4.6% | PASS |
| office|houston | 101 | 2.6% | cooling 2% | 2.4% | 0.7% | 3.1% | PASS |
| office|intlfalls | 101 | 4.2% | cooling 2% | 2.9% | 1.2% | 4.9% | PASS |
| office|kansascity | 101 | 3.4% | cooling 2% | 3.0% | 0.5% | 3.7% | PASS |
| office|losangeles | 101 | 4.6% | cooling 0.4% | 4.6% | 1.2% | 6.1% | PASS |
| office|miami | 101 | 2.1% | cooling 0.4% | 2.1% | 1.0% | 2.2% | PASS |
| office|newyork | 101 | 3.9% | cooling 2% | 2.7% | 0.9% | 4.1% | PASS |
| office|phoenix | 101 | 2.3% | cooling 2% | 2.3% | 0.9% | 3.1% | PASS |
| office|portangeles | 101 | 3.9% | cooling 2% | 2.6% | 1.1% | 5.9% | PASS |
| office|rochestermn | 101 | 2.0% | cooling 2% | 1.7% | 0.9% | 2.5% | PASS |
| office|sandiego | 101 | 2.9% | cooling 2% | 2.6% | 1.8% | 3.8% | PASS |
| office|sanfrancisco | 101 | 3.3% | cooling 2% | 2.3% | 1.0% | 6.3% | PASS |
| office|seattle | 101 | 3.1% | cooling 2% | 2.1% | 1.1% | 5.1% | PASS |
| office|stlouis | 101 | 3.0% | cooling 0.4% | 3.0% | 0.5% | 3.8% | PASS |
| office|tampa | 101 | 2.7% | cooling 0.4% | 2.7% | 1.0% | 3.2% | PASS |
| office|tucson | 101 | 2.7% | cooling 2% | 2.5% | 0.7% | 4.5% | PASS |
| office|washington | 101 | 2.3% | cooling 2% | 2.0% | 0.8% | 2.7% | PASS |
| retail|albuquerque | 101 | 3.1% | cooling 2% | 3.1% | 1.1% | 11.8% | PASS |
| retail|atlanta | 101 | 2.5% | cooling 0.4% | 2.5% | 0.4% | 3.1% | PASS |
| retail|boston | 101 | 3.1% | cooling 2% | 2.6% | 0.4% | 3.1% | PASS |
| retail|buffalo | 101 | 3.6% | cooling 2% | 2.9% | 0.5% | 3.6% | PASS |
| retail|chicago | 101 | 3.2% | cooling 2% | 2.5% | 0.4% | 3.4% | PASS |
| retail|dallas | 101 | 2.1% | cooling 2% | 2.1% | 0.4% | 2.8% | PASS |
| retail|denver | 101 | 3.0% | cooling 0.4% | 3.0% | 1.3% | 10.6% | PASS |
| retail|elpaso | 101 | 4.5% | cooling 0.4% | 4.5% | 0.5% | 6.0% | PASS |
| retail|fairbanks | 101 | 2.8% | cooling 2% | 2.3% | 0.7% | 8.0% | PASS |
| retail|greatfalls | 101 | 3.2% | cooling 2% | 3.0% | 0.9% | 16.4% | PASS |
| retail|honolulu | 101 | 3.6% | cooling 2% | 3.4% | 1.7% | 15.5% | PASS |
| retail|houston | 101 | 1.9% | cooling 0.4% | 1.9% | 0.5% | 2.3% | PASS |
| retail|intlfalls | 101 | 3.7% | cooling 2% | 2.6% | 1.1% | 5.3% | PASS |
| retail|kansascity | 101 | 2.2% | cooling 2% | 2.0% | 0.6% | 2.6% | PASS |
| retail|losangeles | 101 | 3.6% | cooling 2% | 2.7% | 1.6% | 3.5% | PASS |
| retail|miami | 101 | 2.7% | cooling 2% | 2.7% | 0.9% | 3.0% | PASS |
| retail|newyork | 101 | 2.5% | cooling 2% | 2.1% | 0.4% | 2.5% | PASS |
| retail|phoenix | 101 | 2.4% | cooling 2% | 2.3% | 0.6% | 3.0% | PASS |
| retail|portangeles | 101 | 6.5% | cooling 2% | 3.4% | 1.4% | 10.5% | **FAIL** |
| retail|rochestermn | 101 | 3.1% | cooling 2% | 2.7% | 1.0% | 3.6% | PASS |
| retail|sandiego | 101 | 3.2% | cooling 2% | 2.6% | 0.6% | 3.3% | PASS |
| retail|sanfrancisco | 101 | 9.2% | cooling 2% | 3.8% | 1.2% | 13.2% | **FAIL** |
| retail|seattle | 101 | 3.4% | cooling 1% | 3.2% | 1.3% | 10.6% | PASS |
| retail|stlouis | 101 | 2.2% | cooling 0.4% | 2.2% | 0.4% | 2.6% | PASS |
| retail|tampa | 101 | 1.6% | cooling 2% | 1.6% | 0.5% | 1.8% | PASS |
| retail|tucson | 101 | 2.6% | cooling 0.4% | 2.6% | 0.6% | 4.4% | PASS |
| retail|washington | 101 | 2.0% | cooling 2% | 1.8% | 0.5% | 2.1% | PASS |
| school|albuquerque | 101 | 4.6% | cooling 1% | 3.2% | 1.1% | 12.8% | PASS |
| school|atlanta | 101 | 1.4% | cooling 1% | 1.4% | 0.5% | 2.0% | PASS |
| school|boston | 101 | 2.0% | cooling 0.4% | 2.0% | 0.4% | 2.3% | PASS |
| school|buffalo | 101 | 3.1% | cooling 2% | 2.5% | 0.3% | 3.2% | PASS |
| school|chicago | 101 | 2.4% | cooling 2% | 1.7% | 0.5% | 2.4% | PASS |
| school|dallas | 101 | 1.9% | cooling 0.4% | 1.9% | 0.3% | 2.4% | PASS |
| school|denver | 101 | 3.1% | cooling 2% | 2.4% | 1.2% | 14.6% | PASS |
| school|elpaso | 101 | 2.9% | cooling 0.4% | 2.9% | 0.5% | 3.3% | PASS |
| school|fairbanks | 101 | 3.3% | cooling 2% | 2.1% | 1.5% | 28.4% | PASS |
| school|greatfalls | 101 | 3.0% | cooling 1% | 2.4% | 1.1% | 8.6% | PASS |
| school|honolulu | 101 | 2.0% | cooling 0.4% | 2.0% | 1.2% | 3.4% | PASS |
| school|houston | 101 | 1.7% | cooling 1% | 1.7% | 0.4% | 1.9% | PASS |
| school|intlfalls | 101 | 3.1% | cooling 2% | 1.7% | 0.8% | 3.2% | PASS |
| school|kansascity | 101 | 2.4% | cooling 2% | 2.1% | 0.4% | 2.5% | PASS |
| school|losangeles | 101 | 4.8% | cooling 2% | 2.8% | 1.4% | 4.8% | PASS |
| school|miami | 101 | 2.1% | cooling 2% | 2.1% | 0.3% | 2.7% | PASS |
| school|newyork | 101 | 2.5% | cooling 1% | 2.4% | 0.3% | 2.6% | PASS |
| school|phoenix | 101 | 2.5% | cooling 2% | 2.2% | 0.4% | 3.2% | PASS |
| school|portangeles | 101 | 6.3% | cooling 2% | 3.0% | 1.3% | 21.3% | **FAIL** |
| school|rochestermn | 101 | 3.4% | cooling 2% | 2.2% | 0.3% | 3.4% | PASS |
| school|sandiego | 101 | 2.9% | cooling 2% | 2.7% | 0.5% | 2.9% | PASS |
| school|sanfrancisco | 101 | 4.3% | cooling 2% | 3.9% | 1.6% | 16.7% | PASS |
| school|seattle | 101 | 4.4% | cooling 2% | 4.3% | 0.4% | 20.2% | PASS |
| school|stlouis | 101 | 2.5% | cooling 2% | 2.3% | 0.3% | 2.7% | PASS |
| school|tampa | 101 | 1.7% | cooling 2% | 1.6% | 0.4% | 1.8% | PASS |
| school|tucson | 101 | 3.2% | cooling 0.4% | 3.2% | 0.4% | 4.9% | PASS |
| school|washington | 101 | 3.0% | cooling 2% | 2.9% | 0.3% | 3.0% | PASS |
| sports|albuquerque | 101 | 3.8% | cooling 2% | 3.3% | 1.3% | 33.7% | PASS |
| sports|atlanta | 101 | 2.9% | cooling 1% | 2.4% | 0.4% | 6.4% | PASS |
| sports|boston | 101 | 2.9% | cooling 2% | 2.0% | 0.9% | 3.5% | PASS |
| sports|buffalo | 101 | 3.4% | cooling 2% | 3.1% | 1.0% | 4.5% | PASS |
| sports|chicago | 101 | 3.1% | cooling 2% | 2.8% | 0.4% | 3.5% | PASS |
| sports|dallas | 101 | 2.7% | cooling 2% | 2.2% | 0.3% | 3.0% | PASS |
| sports|denver | 101 | 4.7% | cooling 2% | 3.8% | 1.0% | 54.4% | **FAIL** |
| sports|elpaso | 101 | 4.2% | cooling 1% | 3.9% | 1.3% | 12.5% | **FAIL** |
| sports|fairbanks | 101 | 5.3% | cooling 2% | 3.4% | 1.4% | 36.8% | **FAIL** |
| sports|greatfalls | 101 | 3.0% | cooling 2% | 2.4% | 1.0% | 35.4% | PASS |
| sports|honolulu | 101 | 2.1% | cooling 1% | 1.9% | 1.8% | 14.8% | PASS |
| sports|houston | 101 | 2.2% | cooling 2% | 2.1% | 0.4% | 2.3% | PASS |
| sports|intlfalls | 101 | 4.5% | cooling 1% | 3.1% | 0.9% | 13.4% | **FAIL** |
| sports|kansascity | 101 | 2.2% | cooling 2% | 1.8% | 0.3% | 3.3% | PASS |
| sports|losangeles | 101 | 12.4% | cooling 1% | 7.6% | 1.6% | 35.4% | **FAIL** |
| sports|miami | 101 | 2.0% | cooling 2% | 2.0% | 0.8% | 2.5% | PASS |
| sports|newyork | 101 | 2.3% | cooling 2% | 1.6% | 0.8% | 3.1% | PASS |
| sports|phoenix | 101 | 2.3% | cooling 1% | 2.3% | 0.5% | 3.0% | PASS |
| sports|portangeles | 101 | 16.9% | cooling 2% | 4.0% | 1.2% | 33.1% | **FAIL** |
| sports|rochestermn | 101 | 2.9% | cooling 2% | 2.5% | 1.1% | 4.8% | PASS |
| sports|sandiego | 101 | 4.5% | cooling 1% | 3.2% | 1.4% | 9.7% | **FAIL** |
| sports|sanfrancisco | 101 | 7.9% | cooling 2% | 4.9% | 1.7% | 26.3% | **FAIL** |
| sports|seattle | 101 | 5.8% | cooling 2% | 2.9% | 1.3% | 38.4% | **FAIL** |
| sports|stlouis | 101 | 2.7% | cooling 2% | 2.1% | 0.3% | 3.9% | PASS |
| sports|tampa | 101 | 2.4% | cooling 1% | 2.2% | 0.6% | 2.2% | PASS |
| sports|tucson | 101 | 3.3% | cooling 2% | 3.0% | 1.5% | 11.2% | PASS |
| sports|washington | 101 | 3.8% | cooling 2% | 2.8% | 0.3% | 3.8% | PASS |
| stadium|albuquerque | 101 | 3.4% | cooling 2% | 2.6% | 1.7% | 18.6% | PASS |
| stadium|atlanta | 101 | 2.7% | cooling 2% | 2.5% | 0.2% | 3.0% | PASS |
| stadium|boston | 101 | 2.5% | cooling 2% | 2.0% | 0.2% | 2.6% | PASS |
| stadium|buffalo | 101 | 3.9% | cooling 2% | 3.1% | 0.2% | 4.3% | PASS |
| stadium|chicago | 101 | 3.3% | cooling 2% | 2.7% | 0.2% | 3.3% | PASS |
| stadium|dallas | 101 | 2.7% | cooling 1% | 2.6% | 0.2% | 3.2% | PASS |
| stadium|denver | 101 | 3.8% | cooling 0.4% | 3.8% | 1.3% | 18.3% | PASS |
| stadium|elpaso | 101 | 4.9% | cooling 0.4% | 4.9% | 1.6% | 6.2% | **FAIL** |
| stadium|fairbanks | 101 | 3.6% | cooling 2% | 2.0% | 1.8% | 23.7% | PASS |
| stadium|greatfalls | 101 | 3.5% | cooling 0.4% | 3.5% | 2.1% | 27.7% | PASS |
| stadium|honolulu | 101 | 1.9% | heating 99% | 1.6% | 1.7% | 25.0% | PASS |
| stadium|houston | 101 | 1.4% | cooling 2% | 1.4% | 0.2% | 1.6% | PASS |
| stadium|intlfalls | 101 | 2.5% | cooling 2% | 1.3% | 0.8% | 4.3% | PASS |
| stadium|kansascity | 101 | 3.3% | cooling 2% | 2.9% | 0.2% | 3.3% | PASS |
| stadium|losangeles | 101 | 6.4% | cooling 2% | 4.1% | 3.8% | 9.7% | **FAIL** |
| stadium|miami | 101 | 2.7% | cooling 2% | 2.6% | 0.4% | 2.5% | PASS |
| stadium|newyork | 101 | 2.8% | cooling 2% | 2.6% | 0.2% | 3.0% | PASS |
| stadium|phoenix | 101 | 4.6% | cooling 1% | 4.1% | 0.2% | 8.3% | PASS |
| stadium|portangeles | 101 | 7.5% | cooling 2% | 2.5% | 1.6% | 27.0% | **FAIL** |
| stadium|rochestermn | 101 | 4.1% | cooling 2% | 3.3% | 0.2% | 5.0% | PASS |
| stadium|sandiego | 101 | 4.2% | cooling 2% | 1.5% | 1.9% | 4.2% | **FAIL** |
| stadium|sanfrancisco | 101 | 3.8% | cooling 2% | 2.9% | 1.9% | 22.3% | PASS |
| stadium|seattle | 101 | 2.5% | cooling 2% | 2.3% | 1.2% | 26.6% | PASS |
| stadium|stlouis | 101 | 2.1% | cooling 2% | 1.9% | 0.1% | 2.0% | PASS |
| stadium|tampa | 101 | 2.5% | cooling 2% | 2.3% | 0.5% | 2.5% | PASS |
| stadium|tucson | 101 | 3.1% | cooling 1% | 2.5% | 1.0% | 4.7% | PASS |
| stadium|washington | 101 | 2.6% | cooling 2% | 2.5% | 0.3% | 3.1% | PASS |

## Type defaults (prediction vs EnergyPlus)

| Model | Output | EnergyPlus W/m² | Surrogate W/m² | Error |
|---|---|---|---|---|
| healthcare|albuquerque | clg_db_0.4|total_w_m2 | 73.6 | 73.1 | -0.7% |
| healthcare|albuquerque | clg_dp_0.4|total_w_m2 | 68.9 | 68.4 | -0.7% |
| healthcare|albuquerque | htg_99.6|total_w_m2 | 82.6 | 82.3 | -0.4% |
| healthcare|atlanta | clg_db_0.4|total_w_m2 | 120.7 | 119.4 | -1.1% |
| healthcare|atlanta | clg_dp_0.4|total_w_m2 | 127.0 | 125.7 | -1.0% |
| healthcare|atlanta | htg_99.6|total_w_m2 | 91.5 | 91.3 | -0.2% |
| healthcare|boston | clg_db_0.4|total_w_m2 | 114.7 | 114.0 | -0.7% |
| healthcare|boston | clg_dp_0.4|total_w_m2 | 124.8 | 124.1 | -0.6% |
| healthcare|boston | htg_99.6|total_w_m2 | 115.1 | 115.0 | -0.1% |
| healthcare|buffalo | clg_db_0.4|total_w_m2 | 104.0 | 102.6 | -1.4% |
| healthcare|buffalo | clg_dp_0.4|total_w_m2 | 119.4 | 117.9 | -1.3% |
| healthcare|buffalo | htg_99.6|total_w_m2 | 121.0 | 120.9 | -0.1% |
| healthcare|chicago | clg_db_0.4|total_w_m2 | 124.8 | 123.6 | -1.0% |
| healthcare|chicago | clg_dp_0.4|total_w_m2 | 139.0 | 137.8 | -0.9% |
| healthcare|chicago | htg_99.6|total_w_m2 | 132.9 | 132.7 | -0.1% |
| healthcare|dallas | clg_db_0.4|total_w_m2 | 123.8 | 123.1 | -0.6% |
| healthcare|dallas | clg_dp_0.4|total_w_m2 | 137.5 | 136.7 | -0.6% |
| healthcare|dallas | htg_99.6|total_w_m2 | 94.7 | 94.7 | -0.0% |
| healthcare|denver | clg_db_0.4|total_w_m2 | 72.2 | 70.7 | -2.1% |
| healthcare|denver | clg_dp_0.4|total_w_m2 | 68.0 | 66.1 | -2.7% |
| healthcare|denver | htg_99.6|total_w_m2 | 106.4 | 106.2 | -0.1% |
| healthcare|elpaso | clg_db_0.4|total_w_m2 | 81.4 | 81.0 | -0.4% |
| healthcare|elpaso | clg_dp_0.4|total_w_m2 | 88.9 | 88.5 | -0.5% |
| healthcare|elpaso | htg_99.6|total_w_m2 | 79.7 | 79.3 | -0.6% |
| healthcare|fairbanks | clg_db_0.4|total_w_m2 | 59.7 | 60.2 | +0.8% |
| healthcare|fairbanks | clg_dp_0.4|total_w_m2 | 51.7 | 52.1 | +0.8% |
| healthcare|fairbanks | htg_99.6|total_w_m2 | 198.0 | 198.1 | +0.0% |
| healthcare|greatfalls | clg_db_0.4|total_w_m2 | 71.1 | 70.4 | -1.0% |
| healthcare|greatfalls | clg_dp_0.4|total_w_m2 | 56.5 | 55.4 | -1.9% |
| healthcare|greatfalls | htg_99.6|total_w_m2 | 140.2 | 140.5 | +0.2% |
| healthcare|honolulu | clg_db_0.4|total_w_m2 | 115.4 | 115.1 | -0.3% |
| healthcare|honolulu | clg_dp_0.4|total_w_m2 | 129.2 | 128.7 | -0.4% |
| healthcare|honolulu | htg_99.6|total_w_m2 | 20.4 | 20.3 | -0.7% |
| healthcare|houston | clg_db_0.4|total_w_m2 | 134.3 | 133.4 | -0.7% |
| healthcare|houston | clg_dp_0.4|total_w_m2 | 146.4 | 145.2 | -0.8% |
| healthcare|houston | htg_99.6|total_w_m2 | 79.4 | 79.2 | -0.1% |
| healthcare|intlfalls | clg_db_0.4|total_w_m2 | 99.8 | 98.9 | -1.0% |
| healthcare|intlfalls | clg_dp_0.4|total_w_m2 | 111.4 | 110.2 | -1.0% |
| healthcare|intlfalls | htg_99.6|total_w_m2 | 166.9 | 167.1 | +0.1% |
| healthcare|kansascity | clg_db_0.4|total_w_m2 | 136.1 | 135.0 | -0.8% |
| healthcare|kansascity | clg_dp_0.4|total_w_m2 | 150.7 | 149.9 | -0.5% |
| healthcare|kansascity | htg_99.6|total_w_m2 | 126.4 | 126.3 | -0.1% |
| healthcare|losangeles | clg_db_0.4|total_w_m2 | 63.1 | 62.8 | -0.5% |
| healthcare|losangeles | clg_dp_0.4|total_w_m2 | 86.6 | 86.1 | -0.5% |
| healthcare|losangeles | htg_99.6|total_w_m2 | 50.5 | 50.4 | -0.1% |
| healthcare|miami | clg_db_0.4|total_w_m2 | 138.9 | 138.1 | -0.6% |
| healthcare|miami | clg_dp_0.4|total_w_m2 | 150.3 | 149.3 | -0.7% |
| healthcare|miami | htg_99.6|total_w_m2 | 45.5 | 45.5 | -0.1% |
| healthcare|newyork | clg_db_0.4|total_w_m2 | 117.0 | 115.4 | -1.3% |
| healthcare|newyork | clg_dp_0.4|total_w_m2 | 131.8 | 130.2 | -1.2% |
| healthcare|newyork | htg_99.6|total_w_m2 | 107.3 | 107.2 | -0.1% |
| healthcare|phoenix | clg_db_0.4|total_w_m2 | 104.4 | 103.8 | -0.5% |
| healthcare|phoenix | clg_dp_0.4|total_w_m2 | 118.4 | 117.7 | -0.6% |
| healthcare|phoenix | htg_99.6|total_w_m2 | 60.4 | 60.3 | -0.2% |
| healthcare|portangeles | clg_db_0.4|total_w_m2 | 60.0 | 59.9 | -0.3% |
| healthcare|portangeles | clg_dp_0.4|total_w_m2 | 50.9 | 51.1 | +0.5% |
| healthcare|portangeles | htg_99.6|total_w_m2 | 84.1 | 84.2 | +0.1% |
| healthcare|rochestermn | clg_db_0.4|total_w_m2 | 118.4 | 116.8 | -1.4% |
| healthcare|rochestermn | clg_dp_0.4|total_w_m2 | 133.3 | 132.0 | -1.0% |
| healthcare|rochestermn | htg_99.6|total_w_m2 | 147.6 | 147.5 | -0.1% |
| healthcare|sandiego | clg_db_0.4|total_w_m2 | 80.8 | 80.1 | -1.0% |
| healthcare|sandiego | clg_dp_0.4|total_w_m2 | 104.0 | 102.8 | -1.2% |
| healthcare|sandiego | htg_99.6|total_w_m2 | 50.1 | 49.9 | -0.2% |
| healthcare|sanfrancisco | clg_db_0.4|total_w_m2 | 56.4 | 55.6 | -1.4% |
| healthcare|sanfrancisco | clg_dp_0.4|total_w_m2 | 53.2 | 52.2 | -1.9% |
| healthcare|sanfrancisco | htg_99.6|total_w_m2 | 60.9 | 60.5 | -0.5% |
| healthcare|seattle | clg_db_0.4|total_w_m2 | 72.3 | 71.8 | -0.7% |
| healthcare|seattle | clg_dp_0.4|total_w_m2 | 61.8 | 61.6 | -0.5% |
| healthcare|seattle | htg_99.6|total_w_m2 | 84.8 | 85.2 | +0.4% |
| healthcare|stlouis | clg_db_0.4|total_w_m2 | 139.2 | 137.7 | -1.1% |
| healthcare|stlouis | clg_dp_0.4|total_w_m2 | 148.3 | 146.7 | -1.0% |
| healthcare|stlouis | htg_99.6|total_w_m2 | 120.8 | 120.7 | -0.1% |
| healthcare|tampa | clg_db_0.4|total_w_m2 | 138.3 | 137.5 | -0.6% |
| healthcare|tampa | clg_dp_0.4|total_w_m2 | 153.4 | 152.4 | -0.6% |
| healthcare|tampa | htg_99.6|total_w_m2 | 62.2 | 62.1 | -0.1% |
| healthcare|tucson | clg_db_0.4|total_w_m2 | 92.9 | 92.4 | -0.4% |
| healthcare|tucson | clg_dp_0.4|total_w_m2 | 99.3 | 98.6 | -0.8% |
| healthcare|tucson | htg_99.6|total_w_m2 | 69.2 | 69.1 | -0.1% |
| healthcare|washington | clg_db_0.4|total_w_m2 | 133.2 | 131.7 | -1.2% |
| healthcare|washington | clg_dp_0.4|total_w_m2 | 141.7 | 140.1 | -1.1% |
| healthcare|washington | htg_99.6|total_w_m2 | 100.6 | 100.7 | +0.0% |
| higher_ed|albuquerque | clg_db_0.4|total_w_m2 | 56.1 | 56.4 | +0.6% |
| higher_ed|albuquerque | clg_dp_0.4|total_w_m2 | 53.8 | 54.1 | +0.6% |
| higher_ed|albuquerque | htg_99.6|total_w_m2 | 40.6 | 40.4 | -0.5% |
| higher_ed|atlanta | clg_db_0.4|total_w_m2 | 78.0 | 77.1 | -1.2% |
| higher_ed|atlanta | clg_dp_0.4|total_w_m2 | 78.1 | 77.2 | -1.2% |
| higher_ed|atlanta | htg_99.6|total_w_m2 | 44.8 | 44.7 | -0.2% |
| higher_ed|boston | clg_db_0.4|total_w_m2 | 76.9 | 75.7 | -1.6% |
| higher_ed|boston | clg_dp_0.4|total_w_m2 | 79.9 | 78.8 | -1.4% |
| higher_ed|boston | htg_99.6|total_w_m2 | 54.9 | 54.9 | -0.0% |
| higher_ed|buffalo | clg_db_0.4|total_w_m2 | 72.0 | 70.6 | -2.0% |
| higher_ed|buffalo | clg_dp_0.4|total_w_m2 | 77.3 | 75.9 | -1.8% |
| higher_ed|buffalo | htg_99.6|total_w_m2 | 58.1 | 58.1 | +0.0% |
| higher_ed|chicago | clg_db_0.4|total_w_m2 | 81.3 | 79.9 | -1.7% |
| higher_ed|chicago | clg_dp_0.4|total_w_m2 | 86.2 | 84.9 | -1.5% |
| higher_ed|chicago | htg_99.6|total_w_m2 | 63.9 | 63.8 | -0.2% |
| higher_ed|dallas | clg_db_0.4|total_w_m2 | 81.0 | 80.1 | -1.0% |
| higher_ed|dallas | clg_dp_0.4|total_w_m2 | 83.2 | 82.5 | -0.9% |
| higher_ed|dallas | htg_99.6|total_w_m2 | 46.9 | 46.9 | +0.0% |
| higher_ed|denver | clg_db_0.4|total_w_m2 | 55.9 | 55.2 | -1.3% |
| higher_ed|denver | clg_dp_0.4|total_w_m2 | 54.0 | 53.4 | -1.1% |
| higher_ed|denver | htg_99.6|total_w_m2 | 51.9 | 51.8 | -0.3% |
| higher_ed|elpaso | clg_db_0.4|total_w_m2 | 60.9 | 60.1 | -1.4% |
| higher_ed|elpaso | clg_dp_0.4|total_w_m2 | 60.4 | 60.0 | -0.6% |
| higher_ed|elpaso | htg_99.6|total_w_m2 | 39.3 | 39.2 | -0.1% |
| higher_ed|fairbanks | clg_db_0.4|total_w_m2 | 53.8 | 53.1 | -1.2% |
| higher_ed|fairbanks | clg_dp_0.4|total_w_m2 | 50.7 | 49.6 | -2.2% |
| higher_ed|fairbanks | htg_99.6|total_w_m2 | 93.2 | 93.4 | +0.1% |
| higher_ed|greatfalls | clg_db_0.4|total_w_m2 | 55.9 | 55.2 | -1.2% |
| higher_ed|greatfalls | clg_dp_0.4|total_w_m2 | 49.6 | 49.0 | -1.2% |
| higher_ed|greatfalls | htg_99.6|total_w_m2 | 67.5 | 67.4 | -0.2% |
| higher_ed|honolulu | clg_db_0.4|total_w_m2 | 75.1 | 74.6 | -0.7% |
| higher_ed|honolulu | clg_dp_0.4|total_w_m2 | 78.9 | 78.3 | -0.8% |
| higher_ed|honolulu | htg_99.6|total_w_m2 | 9.0 | 8.9 | -1.4% |
| higher_ed|houston | clg_db_0.4|total_w_m2 | 84.2 | 83.7 | -0.6% |
| higher_ed|houston | clg_dp_0.4|total_w_m2 | 86.4 | 86.0 | -0.5% |
| higher_ed|houston | htg_99.6|total_w_m2 | 38.8 | 38.7 | -0.3% |
| higher_ed|intlfalls | clg_db_0.4|total_w_m2 | 71.3 | 69.5 | -2.5% |
| higher_ed|intlfalls | clg_dp_0.4|total_w_m2 | 75.0 | 73.0 | -2.7% |
| higher_ed|intlfalls | htg_99.6|total_w_m2 | 79.3 | 79.3 | +0.1% |
| higher_ed|kansascity | clg_db_0.4|total_w_m2 | 86.5 | 85.2 | -1.5% |
| higher_ed|kansascity | clg_dp_0.4|total_w_m2 | 91.1 | 89.9 | -1.3% |
| higher_ed|kansascity | htg_99.6|total_w_m2 | 61.6 | 61.6 | -0.0% |
| higher_ed|losangeles | clg_db_0.4|total_w_m2 | 52.7 | 52.6 | -0.1% |
| higher_ed|losangeles | clg_dp_0.4|total_w_m2 | 60.2 | 60.4 | +0.3% |
| higher_ed|losangeles | htg_99.6|total_w_m2 | 23.8 | 23.7 | -0.7% |
| higher_ed|miami | clg_db_0.4|total_w_m2 | 85.6 | 85.3 | -0.4% |
| higher_ed|miami | clg_dp_0.4|total_w_m2 | 88.8 | 88.5 | -0.3% |
| higher_ed|miami | htg_99.6|total_w_m2 | 21.7 | 21.6 | -0.5% |
| higher_ed|newyork | clg_db_0.4|total_w_m2 | 77.9 | 76.6 | -1.6% |
| higher_ed|newyork | clg_dp_0.4|total_w_m2 | 82.7 | 81.6 | -1.3% |
| higher_ed|newyork | htg_99.6|total_w_m2 | 51.8 | 51.8 | -0.1% |
| higher_ed|phoenix | clg_db_0.4|total_w_m2 | 73.6 | 72.9 | -1.0% |
| higher_ed|phoenix | clg_dp_0.4|total_w_m2 | 74.8 | 74.1 | -1.0% |
| higher_ed|phoenix | htg_99.6|total_w_m2 | 29.5 | 29.5 | -0.3% |
| higher_ed|portangeles | clg_db_0.4|total_w_m2 | 53.6 | 53.2 | -0.7% |
| higher_ed|portangeles | clg_dp_0.4|total_w_m2 | 47.6 | 47.1 | -1.1% |
| higher_ed|portangeles | htg_99.6|total_w_m2 | 39.6 | 39.4 | -0.5% |
| higher_ed|rochestermn | clg_db_0.4|total_w_m2 | 78.0 | 77.4 | -0.8% |
| higher_ed|rochestermn | clg_dp_0.4|total_w_m2 | 83.4 | 82.7 | -0.8% |
| higher_ed|rochestermn | htg_99.6|total_w_m2 | 70.6 | 70.5 | -0.2% |
| higher_ed|sandiego | clg_db_0.4|total_w_m2 | 60.2 | 59.4 | -1.4% |
| higher_ed|sandiego | clg_dp_0.4|total_w_m2 | 68.5 | 67.7 | -1.2% |
| higher_ed|sandiego | htg_99.6|total_w_m2 | 23.7 | 23.5 | -0.6% |
| higher_ed|sanfrancisco | clg_db_0.4|total_w_m2 | 49.3 | 48.8 | -1.0% |
| higher_ed|sanfrancisco | clg_dp_0.4|total_w_m2 | 44.6 | 44.4 | -0.4% |
| higher_ed|sanfrancisco | htg_99.6|total_w_m2 | 29.0 | 28.9 | -0.4% |
| higher_ed|seattle | clg_db_0.4|total_w_m2 | 59.4 | 58.5 | -1.7% |
| higher_ed|seattle | clg_dp_0.4|total_w_m2 | 52.1 | 50.7 | -2.6% |
| higher_ed|seattle | htg_99.6|total_w_m2 | 40.6 | 40.5 | -0.1% |
| higher_ed|stlouis | clg_db_0.4|total_w_m2 | 88.0 | 87.2 | -1.0% |
| higher_ed|stlouis | clg_dp_0.4|total_w_m2 | 90.4 | 89.5 | -0.9% |
| higher_ed|stlouis | htg_99.6|total_w_m2 | 58.7 | 58.7 | -0.0% |
| higher_ed|tampa | clg_db_0.4|total_w_m2 | 85.6 | 85.0 | -0.7% |
| higher_ed|tampa | clg_dp_0.4|total_w_m2 | 90.5 | 90.0 | -0.6% |
| higher_ed|tampa | htg_99.6|total_w_m2 | 30.0 | 29.9 | -0.3% |
| higher_ed|tucson | clg_db_0.4|total_w_m2 | 64.6 | 63.8 | -1.2% |
| higher_ed|tucson | clg_dp_0.4|total_w_m2 | 64.8 | 63.7 | -1.8% |
| higher_ed|tucson | htg_99.6|total_w_m2 | 34.1 | 34.0 | -0.2% |
| higher_ed|washington | clg_db_0.4|total_w_m2 | 85.3 | 84.6 | -0.8% |
| higher_ed|washington | clg_dp_0.4|total_w_m2 | 87.2 | 86.6 | -0.7% |
| higher_ed|washington | htg_99.6|total_w_m2 | 48.4 | 48.3 | -0.2% |
| hotel|albuquerque | clg_db_0.4|total_w_m2 | 44.2 | 44.2 | +0.1% |
| hotel|albuquerque | clg_dp_0.4|total_w_m2 | 41.2 | 40.9 | -0.6% |
| hotel|albuquerque | htg_99.6|total_w_m2 | 32.2 | 32.0 | -0.7% |
| hotel|atlanta | clg_db_0.4|total_w_m2 | 58.6 | 57.8 | -1.3% |
| hotel|atlanta | clg_dp_0.4|total_w_m2 | 57.9 | 57.3 | -1.1% |
| hotel|atlanta | htg_99.6|total_w_m2 | 35.5 | 35.3 | -0.4% |
| hotel|boston | clg_db_0.4|total_w_m2 | 58.5 | 57.6 | -1.5% |
| hotel|boston | clg_dp_0.4|total_w_m2 | 60.0 | 59.1 | -1.6% |
| hotel|boston | htg_99.6|total_w_m2 | 42.6 | 42.7 | +0.1% |
| hotel|buffalo | clg_db_0.4|total_w_m2 | 54.9 | 54.3 | -1.0% |
| hotel|buffalo | clg_dp_0.4|total_w_m2 | 58.3 | 57.9 | -0.7% |
| hotel|buffalo | htg_99.6|total_w_m2 | 45.1 | 45.0 | -0.4% |
| hotel|chicago | clg_db_0.4|total_w_m2 | 61.6 | 60.4 | -2.0% |
| hotel|chicago | clg_dp_0.4|total_w_m2 | 64.7 | 63.5 | -1.8% |
| hotel|chicago | htg_99.6|total_w_m2 | 49.7 | 49.6 | -0.2% |
| hotel|dallas | clg_db_0.4|total_w_m2 | 61.5 | 60.5 | -1.6% |
| hotel|dallas | clg_dp_0.4|total_w_m2 | 61.9 | 61.0 | -1.5% |
| hotel|dallas | htg_99.6|total_w_m2 | 37.3 | 37.3 | -0.1% |
| hotel|denver | clg_db_0.4|total_w_m2 | 43.9 | 42.7 | -2.8% |
| hotel|denver | clg_dp_0.4|total_w_m2 | 41.6 | 40.4 | -3.0% |
| hotel|denver | htg_99.6|total_w_m2 | 40.7 | 40.7 | +0.0% |
| hotel|elpaso | clg_db_0.4|total_w_m2 | 47.0 | 46.6 | -0.8% |
| hotel|elpaso | clg_dp_0.4|total_w_m2 | 45.2 | 44.6 | -1.4% |
| hotel|elpaso | htg_99.6|total_w_m2 | 31.2 | 31.1 | -0.3% |
| hotel|fairbanks | clg_db_0.4|total_w_m2 | 43.2 | 43.2 | -0.0% |
| hotel|fairbanks | clg_dp_0.4|total_w_m2 | 40.6 | 40.4 | -0.7% |
| hotel|fairbanks | htg_99.6|total_w_m2 | 71.3 | 71.3 | +0.0% |
| hotel|greatfalls | clg_db_0.4|total_w_m2 | 44.0 | 43.3 | -1.6% |
| hotel|greatfalls | clg_dp_0.4|total_w_m2 | 38.7 | 37.6 | -2.9% |
| hotel|greatfalls | htg_99.6|total_w_m2 | 52.5 | 52.0 | -0.9% |
| hotel|honolulu | clg_db_0.4|total_w_m2 | 56.2 | 55.9 | -0.6% |
| hotel|honolulu | clg_dp_0.4|total_w_m2 | 58.2 | 57.8 | -0.7% |
| hotel|honolulu | htg_99.6|total_w_m2 | 7.3 | 7.1 | -1.6% |
| hotel|houston | clg_db_0.4|total_w_m2 | 63.2 | 62.9 | -0.5% |
| hotel|houston | clg_dp_0.4|total_w_m2 | 63.8 | 63.4 | -0.6% |
| hotel|houston | htg_99.6|total_w_m2 | 30.7 | 30.6 | -0.3% |
| hotel|intlfalls | clg_db_0.4|total_w_m2 | 54.9 | 54.8 | -0.2% |
| hotel|intlfalls | clg_dp_0.4|total_w_m2 | 57.4 | 57.4 | +0.0% |
| hotel|intlfalls | htg_99.6|total_w_m2 | 61.0 | 60.8 | -0.4% |
| hotel|kansascity | clg_db_0.4|total_w_m2 | 65.4 | 64.6 | -1.2% |
| hotel|kansascity | clg_dp_0.4|total_w_m2 | 68.1 | 67.4 | -0.9% |
| hotel|kansascity | htg_99.6|total_w_m2 | 48.3 | 48.2 | -0.2% |
| hotel|losangeles | clg_db_0.4|total_w_m2 | 40.3 | 39.6 | -1.9% |
| hotel|losangeles | clg_dp_0.4|total_w_m2 | 45.3 | 44.7 | -1.4% |
| hotel|losangeles | htg_99.6|total_w_m2 | 18.8 | 18.7 | -0.6% |
| hotel|miami | clg_db_0.4|total_w_m2 | 63.8 | 63.6 | -0.4% |
| hotel|miami | clg_dp_0.4|total_w_m2 | 65.3 | 64.9 | -0.5% |
| hotel|miami | htg_99.6|total_w_m2 | 17.3 | 17.2 | -0.5% |
| hotel|newyork | clg_db_0.4|total_w_m2 | 59.2 | 58.2 | -1.7% |
| hotel|newyork | clg_dp_0.4|total_w_m2 | 62.0 | 61.3 | -1.2% |
| hotel|newyork | htg_99.6|total_w_m2 | 40.6 | 40.5 | -0.1% |
| hotel|phoenix | clg_db_0.4|total_w_m2 | 57.2 | 56.4 | -1.4% |
| hotel|phoenix | clg_dp_0.4|total_w_m2 | 56.0 | 55.4 | -1.2% |
| hotel|phoenix | htg_99.6|total_w_m2 | 23.6 | 23.5 | -0.5% |
| hotel|portangeles | clg_db_0.4|total_w_m2 | 42.5 | 42.3 | -0.5% |
| hotel|portangeles | clg_dp_0.4|total_w_m2 | 37.9 | 37.5 | -1.1% |
| hotel|portangeles | htg_99.6|total_w_m2 | 30.7 | 30.6 | -0.4% |
| hotel|rochestermn | clg_db_0.4|total_w_m2 | 59.0 | 58.3 | -1.2% |
| hotel|rochestermn | clg_dp_0.4|total_w_m2 | 62.5 | 62.2 | -0.6% |
| hotel|rochestermn | htg_99.6|total_w_m2 | 54.6 | 54.6 | +0.0% |
| hotel|sandiego | clg_db_0.4|total_w_m2 | 45.6 | 45.4 | -0.3% |
| hotel|sandiego | clg_dp_0.4|total_w_m2 | 51.0 | 51.0 | +0.0% |
| hotel|sandiego | htg_99.6|total_w_m2 | 18.7 | 18.5 | -0.8% |
| hotel|sanfrancisco | clg_db_0.4|total_w_m2 | 38.0 | 37.5 | -1.2% |
| hotel|sanfrancisco | clg_dp_0.4|total_w_m2 | 33.9 | 33.4 | -1.4% |
| hotel|sanfrancisco | htg_99.6|total_w_m2 | 22.9 | 22.7 | -0.7% |
| hotel|seattle | clg_db_0.4|total_w_m2 | 46.7 | 46.2 | -1.1% |
| hotel|seattle | clg_dp_0.4|total_w_m2 | 41.0 | 40.5 | -1.2% |
| hotel|seattle | htg_99.6|total_w_m2 | 31.7 | 31.8 | +0.2% |
| hotel|stlouis | clg_db_0.4|total_w_m2 | 66.7 | 65.9 | -1.2% |
| hotel|stlouis | clg_dp_0.4|total_w_m2 | 67.6 | 66.9 | -1.1% |
| hotel|stlouis | htg_99.6|total_w_m2 | 46.0 | 45.9 | -0.2% |
| hotel|tampa | clg_db_0.4|total_w_m2 | 64.0 | 63.1 | -1.4% |
| hotel|tampa | clg_dp_0.4|total_w_m2 | 66.8 | 65.9 | -1.3% |
| hotel|tampa | htg_99.6|total_w_m2 | 23.8 | 23.7 | -0.4% |
| hotel|tucson | clg_db_0.4|total_w_m2 | 50.1 | 50.0 | -0.3% |
| hotel|tucson | clg_dp_0.4|total_w_m2 | 48.4 | 48.2 | -0.5% |
| hotel|tucson | htg_99.6|total_w_m2 | 27.2 | 27.2 | -0.0% |
| hotel|washington | clg_db_0.4|total_w_m2 | 64.7 | 63.9 | -1.2% |
| hotel|washington | clg_dp_0.4|total_w_m2 | 65.3 | 64.6 | -1.0% |
| hotel|washington | htg_99.6|total_w_m2 | 37.9 | 37.8 | -0.2% |
| lab|albuquerque | clg_db_0.4|total_w_m2 | 170.8 | 169.8 | -0.6% |
| lab|albuquerque | clg_dp_0.4|total_w_m2 | 169.4 | 168.1 | -0.8% |
| lab|albuquerque | htg_99.6|total_w_m2 | 206.9 | 207.6 | +0.3% |
| lab|atlanta | clg_db_0.4|total_w_m2 | 312.5 | 311.3 | -0.4% |
| lab|atlanta | clg_dp_0.4|total_w_m2 | 337.5 | 336.1 | -0.4% |
| lab|atlanta | htg_99.6|total_w_m2 | 229.0 | 229.0 | -0.0% |
| lab|boston | clg_db_0.4|total_w_m2 | 290.9 | 289.3 | -0.5% |
| lab|boston | clg_dp_0.4|total_w_m2 | 323.8 | 321.2 | -0.8% |
| lab|boston | htg_99.6|total_w_m2 | 296.3 | 296.3 | -0.0% |
| lab|buffalo | clg_db_0.4|total_w_m2 | 261.1 | 259.9 | -0.5% |
| lab|buffalo | clg_dp_0.4|total_w_m2 | 308.3 | 306.8 | -0.5% |
| lab|buffalo | htg_99.6|total_w_m2 | 311.8 | 311.7 | -0.0% |
| lab|chicago | clg_db_0.4|total_w_m2 | 319.6 | 318.4 | -0.4% |
| lab|chicago | clg_dp_0.4|total_w_m2 | 363.4 | 361.3 | -0.6% |
| lab|chicago | htg_99.6|total_w_m2 | 343.1 | 342.9 | -0.0% |
| lab|dallas | clg_db_0.4|total_w_m2 | 315.8 | 314.3 | -0.5% |
| lab|dallas | clg_dp_0.4|total_w_m2 | 365.3 | 363.3 | -0.5% |
| lab|dallas | htg_99.6|total_w_m2 | 235.4 | 235.4 | +0.0% |
| lab|denver | clg_db_0.4|total_w_m2 | 166.3 | 165.1 | -0.7% |
| lab|denver | clg_dp_0.4|total_w_m2 | 165.4 | 164.6 | -0.5% |
| lab|denver | htg_99.6|total_w_m2 | 271.5 | 272.1 | +0.2% |
| lab|elpaso | clg_db_0.4|total_w_m2 | 196.2 | 195.5 | -0.3% |
| lab|elpaso | clg_dp_0.4|total_w_m2 | 231.5 | 227.5 | -1.8% |
| lab|elpaso | htg_99.6|total_w_m2 | 198.4 | 198.3 | -0.1% |
| lab|fairbanks | clg_db_0.4|total_w_m2 | 126.9 | 126.8 | -0.1% |
| lab|fairbanks | clg_dp_0.4|total_w_m2 | 109.5 | 109.4 | -0.1% |
| lab|fairbanks | htg_99.6|total_w_m2 | 524.6 | 525.2 | +0.1% |
| lab|greatfalls | clg_db_0.4|total_w_m2 | 163.2 | 162.1 | -0.7% |
| lab|greatfalls | clg_dp_0.4|total_w_m2 | 131.5 | 130.6 | -0.7% |
| lab|greatfalls | htg_99.6|total_w_m2 | 363.8 | 363.0 | -0.2% |
| lab|honolulu | clg_db_0.4|total_w_m2 | 299.8 | 298.7 | -0.4% |
| lab|honolulu | clg_dp_0.4|total_w_m2 | 345.5 | 342.6 | -0.8% |
| lab|honolulu | htg_99.6|total_w_m2 | 43.2 | 43.0 | -0.3% |
| lab|houston | clg_db_0.4|total_w_m2 | 350.4 | 349.9 | -0.1% |
| lab|houston | clg_dp_0.4|total_w_m2 | 393.7 | 393.2 | -0.1% |
| lab|houston | htg_99.6|total_w_m2 | 196.6 | 196.6 | -0.0% |
| lab|intlfalls | clg_db_0.4|total_w_m2 | 244.7 | 242.7 | -0.8% |
| lab|intlfalls | clg_dp_0.4|total_w_m2 | 281.0 | 279.2 | -0.6% |
| lab|intlfalls | htg_99.6|total_w_m2 | 437.9 | 437.8 | -0.0% |
| lab|kansascity | clg_db_0.4|total_w_m2 | 350.8 | 349.2 | -0.4% |
| lab|kansascity | clg_dp_0.4|total_w_m2 | 397.4 | 394.8 | -0.6% |
| lab|kansascity | htg_99.6|total_w_m2 | 322.9 | 322.9 | -0.0% |
| lab|losangeles | clg_db_0.4|total_w_m2 | 149.0 | 148.4 | -0.4% |
| lab|losangeles | clg_dp_0.4|total_w_m2 | 222.2 | 221.5 | -0.3% |
| lab|losangeles | htg_99.6|total_w_m2 | 122.8 | 122.9 | +0.1% |
| lab|miami | clg_db_0.4|total_w_m2 | 366.1 | 365.1 | -0.3% |
| lab|miami | clg_dp_0.4|total_w_m2 | 405.3 | 402.5 | -0.7% |
| lab|miami | htg_99.6|total_w_m2 | 108.4 | 108.3 | -0.1% |
| lab|newyork | clg_db_0.4|total_w_m2 | 297.3 | 295.7 | -0.5% |
| lab|newyork | clg_dp_0.4|total_w_m2 | 344.2 | 341.0 | -0.9% |
| lab|newyork | htg_99.6|total_w_m2 | 273.2 | 273.2 | +0.0% |
| lab|phoenix | clg_db_0.4|total_w_m2 | 255.2 | 254.6 | -0.2% |
| lab|phoenix | clg_dp_0.4|total_w_m2 | 310.3 | 308.7 | -0.5% |
| lab|phoenix | htg_99.6|total_w_m2 | 146.4 | 146.3 | -0.1% |
| lab|portangeles | clg_db_0.4|total_w_m2 | 131.2 | 130.4 | -0.6% |
| lab|portangeles | clg_dp_0.4|total_w_m2 | 112.9 | 112.5 | -0.3% |
| lab|portangeles | htg_99.6|total_w_m2 | 214.8 | 215.2 | +0.2% |
| lab|rochestermn | clg_db_0.4|total_w_m2 | 302.9 | 300.1 | -0.9% |
| lab|rochestermn | clg_dp_0.4|total_w_m2 | 348.2 | 346.4 | -0.5% |
| lab|rochestermn | htg_99.6|total_w_m2 | 384.4 | 384.2 | -0.0% |
| lab|sandiego | clg_db_0.4|total_w_m2 | 200.5 | 200.0 | -0.3% |
| lab|sandiego | clg_dp_0.4|total_w_m2 | 271.3 | 270.6 | -0.3% |
| lab|sandiego | htg_99.6|total_w_m2 | 121.6 | 121.1 | -0.4% |
| lab|sanfrancisco | clg_db_0.4|total_w_m2 | 129.7 | 128.8 | -0.7% |
| lab|sanfrancisco | clg_dp_0.4|total_w_m2 | 130.6 | 130.1 | -0.4% |
| lab|sanfrancisco | htg_99.6|total_w_m2 | 149.9 | 149.7 | -0.1% |
| lab|seattle | clg_db_0.4|total_w_m2 | 165.1 | 164.2 | -0.6% |
| lab|seattle | clg_dp_0.4|total_w_m2 | 143.6 | 142.9 | -0.5% |
| lab|seattle | htg_99.6|total_w_m2 | 214.5 | 214.6 | +0.1% |
| lab|stlouis | clg_db_0.4|total_w_m2 | 359.1 | 357.8 | -0.4% |
| lab|stlouis | clg_dp_0.4|total_w_m2 | 389.9 | 386.6 | -0.9% |
| lab|stlouis | htg_99.6|total_w_m2 | 308.3 | 308.2 | -0.0% |
| lab|tampa | clg_db_0.4|total_w_m2 | 363.2 | 361.9 | -0.4% |
| lab|tampa | clg_dp_0.4|total_w_m2 | 412.1 | 409.4 | -0.7% |
| lab|tampa | htg_99.6|total_w_m2 | 152.2 | 152.1 | -0.1% |
| lab|tucson | clg_db_0.4|total_w_m2 | 226.2 | 225.3 | -0.4% |
| lab|tucson | clg_dp_0.4|total_w_m2 | 261.5 | 260.6 | -0.3% |
| lab|tucson | htg_99.6|total_w_m2 | 169.7 | 169.6 | -0.0% |
| lab|washington | clg_db_0.4|total_w_m2 | 342.6 | 341.6 | -0.3% |
| lab|washington | clg_dp_0.4|total_w_m2 | 371.8 | 370.2 | -0.4% |
| lab|washington | htg_99.6|total_w_m2 | 256.0 | 255.9 | -0.0% |
| office|albuquerque | clg_db_0.4|total_w_m2 | 41.2 | 41.1 | -0.2% |
| office|albuquerque | clg_dp_0.4|total_w_m2 | 35.9 | 35.8 | -0.3% |
| office|albuquerque | htg_99.6|total_w_m2 | 28.6 | 28.4 | -0.7% |
| office|atlanta | clg_db_0.4|total_w_m2 | 51.9 | 51.3 | -1.1% |
| office|atlanta | clg_dp_0.4|total_w_m2 | 50.2 | 49.6 | -1.2% |
| office|atlanta | htg_99.6|total_w_m2 | 31.5 | 31.5 | +0.0% |
| office|boston | clg_db_0.4|total_w_m2 | 52.3 | 52.0 | -0.5% |
| office|boston | clg_dp_0.4|total_w_m2 | 53.1 | 52.8 | -0.6% |
| office|boston | htg_99.6|total_w_m2 | 37.4 | 37.2 | -0.6% |
| office|buffalo | clg_db_0.4|total_w_m2 | 49.1 | 48.5 | -1.3% |
| office|buffalo | clg_dp_0.4|total_w_m2 | 51.4 | 50.9 | -1.0% |
| office|buffalo | htg_99.6|total_w_m2 | 39.6 | 39.5 | -0.3% |
| office|chicago | clg_db_0.4|total_w_m2 | 54.9 | 54.0 | -1.5% |
| office|chicago | clg_dp_0.4|total_w_m2 | 56.9 | 56.3 | -1.1% |
| office|chicago | htg_99.6|total_w_m2 | 43.6 | 43.5 | -0.3% |
| office|dallas | clg_db_0.4|total_w_m2 | 54.8 | 54.0 | -1.5% |
| office|dallas | clg_dp_0.4|total_w_m2 | 53.7 | 52.9 | -1.5% |
| office|dallas | htg_99.6|total_w_m2 | 33.2 | 33.2 | -0.2% |
| office|denver | clg_db_0.4|total_w_m2 | 40.7 | 40.4 | -0.8% |
| office|denver | clg_dp_0.4|total_w_m2 | 36.4 | 35.8 | -1.7% |
| office|denver | htg_99.6|total_w_m2 | 36.0 | 35.8 | -0.4% |
| office|elpaso | clg_db_0.4|total_w_m2 | 42.6 | 42.0 | -1.5% |
| office|elpaso | clg_dp_0.4|total_w_m2 | 38.7 | 38.3 | -1.1% |
| office|elpaso | htg_99.6|total_w_m2 | 27.7 | 27.6 | -0.4% |
| office|fairbanks | clg_db_0.4|total_w_m2 | 40.2 | 40.4 | +0.5% |
| office|fairbanks | clg_dp_0.4|total_w_m2 | 37.2 | 37.1 | -0.3% |
| office|fairbanks | htg_99.6|total_w_m2 | 61.9 | 62.0 | +0.2% |
| office|greatfalls | clg_db_0.4|total_w_m2 | 40.6 | 39.5 | -2.6% |
| office|greatfalls | clg_dp_0.4|total_w_m2 | 34.2 | 33.1 | -3.4% |
| office|greatfalls | htg_99.6|total_w_m2 | 46.0 | 45.9 | -0.3% |
| office|honolulu | clg_db_0.4|total_w_m2 | 49.9 | 49.6 | -0.6% |
| office|honolulu | clg_dp_0.4|total_w_m2 | 50.7 | 50.3 | -0.9% |
| office|honolulu | htg_99.6|total_w_m2 | 6.5 | 6.4 | -2.0% |
| office|houston | clg_db_0.4|total_w_m2 | 55.9 | 55.6 | -0.6% |
| office|houston | clg_dp_0.4|total_w_m2 | 55.2 | 54.7 | -0.9% |
| office|houston | htg_99.6|total_w_m2 | 27.3 | 27.2 | -0.3% |
| office|intlfalls | clg_db_0.4|total_w_m2 | 49.4 | 48.3 | -2.2% |
| office|intlfalls | clg_dp_0.4|total_w_m2 | 50.8 | 49.6 | -2.3% |
| office|intlfalls | htg_99.6|total_w_m2 | 53.3 | 53.2 | -0.1% |
| office|kansascity | clg_db_0.4|total_w_m2 | 58.1 | 57.7 | -0.6% |
| office|kansascity | clg_dp_0.4|total_w_m2 | 59.8 | 59.4 | -0.6% |
| office|kansascity | htg_99.6|total_w_m2 | 42.6 | 42.7 | +0.1% |
| office|losangeles | clg_db_0.4|total_w_m2 | 36.6 | 36.1 | -1.6% |
| office|losangeles | clg_dp_0.4|total_w_m2 | 39.5 | 39.0 | -1.4% |
| office|losangeles | htg_99.6|total_w_m2 | 16.6 | 16.5 | -1.0% |
| office|miami | clg_db_0.4|total_w_m2 | 56.3 | 56.1 | -0.4% |
| office|miami | clg_dp_0.4|total_w_m2 | 57.0 | 56.8 | -0.4% |
| office|miami | htg_99.6|total_w_m2 | 15.4 | 15.3 | -0.6% |
| office|newyork | clg_db_0.4|total_w_m2 | 52.9 | 52.4 | -1.0% |
| office|newyork | clg_dp_0.4|total_w_m2 | 54.7 | 54.2 | -1.0% |
| office|newyork | htg_99.6|total_w_m2 | 35.8 | 35.7 | -0.2% |
| office|phoenix | clg_db_0.4|total_w_m2 | 51.8 | 51.1 | -1.3% |
| office|phoenix | clg_dp_0.4|total_w_m2 | 48.7 | 47.8 | -1.7% |
| office|phoenix | htg_99.6|total_w_m2 | 21.1 | 20.9 | -0.7% |
| office|portangeles | clg_db_0.4|total_w_m2 | 38.8 | 38.4 | -1.0% |
| office|portangeles | clg_dp_0.4|total_w_m2 | 33.8 | 33.7 | -0.5% |
| office|portangeles | htg_99.6|total_w_m2 | 26.9 | 26.7 | -0.9% |
| office|rochestermn | clg_db_0.4|total_w_m2 | 52.5 | 52.3 | -0.3% |
| office|rochestermn | clg_dp_0.4|total_w_m2 | 54.9 | 54.9 | -0.1% |
| office|rochestermn | htg_99.6|total_w_m2 | 47.8 | 47.6 | -0.5% |
| office|sandiego | clg_db_0.4|total_w_m2 | 41.0 | 40.8 | -0.6% |
| office|sandiego | clg_dp_0.4|total_w_m2 | 44.8 | 44.8 | +0.1% |
| office|sandiego | htg_99.6|total_w_m2 | 16.6 | 16.4 | -1.0% |
| office|sanfrancisco | clg_db_0.4|total_w_m2 | 34.4 | 34.0 | -1.1% |
| office|sanfrancisco | clg_dp_0.4|total_w_m2 | 29.5 | 29.5 | -0.0% |
| office|sanfrancisco | htg_99.6|total_w_m2 | 20.3 | 20.1 | -0.8% |
| office|seattle | clg_db_0.4|total_w_m2 | 42.5 | 42.3 | -0.6% |
| office|seattle | clg_dp_0.4|total_w_m2 | 36.4 | 36.3 | -0.3% |
| office|seattle | htg_99.6|total_w_m2 | 28.0 | 27.7 | -0.8% |
| office|stlouis | clg_db_0.4|total_w_m2 | 59.2 | 58.6 | -1.0% |
| office|stlouis | clg_dp_0.4|total_w_m2 | 59.5 | 59.0 | -0.9% |
| office|stlouis | htg_99.6|total_w_m2 | 40.6 | 40.6 | -0.1% |
| office|tampa | clg_db_0.4|total_w_m2 | 56.5 | 56.0 | -0.8% |
| office|tampa | clg_dp_0.4|total_w_m2 | 58.2 | 57.8 | -0.8% |
| office|tampa | htg_99.6|total_w_m2 | 21.1 | 21.0 | -0.4% |
| office|tucson | clg_db_0.4|total_w_m2 | 46.0 | 45.7 | -0.7% |
| office|tucson | clg_dp_0.4|total_w_m2 | 41.5 | 41.2 | -0.8% |
| office|tucson | htg_99.6|total_w_m2 | 24.3 | 24.2 | -0.4% |
| office|washington | clg_db_0.4|total_w_m2 | 57.5 | 56.5 | -1.8% |
| office|washington | clg_dp_0.4|total_w_m2 | 57.5 | 56.6 | -1.6% |
| office|washington | htg_99.6|total_w_m2 | 33.4 | 33.3 | -0.3% |
| retail|albuquerque | clg_db_0.4|total_w_m2 | 50.8 | 50.5 | -0.5% |
| retail|albuquerque | clg_dp_0.4|total_w_m2 | 46.7 | 46.9 | +0.5% |
| retail|albuquerque | htg_99.6|total_w_m2 | 48.3 | 48.2 | -0.2% |
| retail|atlanta | clg_db_0.4|total_w_m2 | 78.4 | 77.2 | -1.5% |
| retail|atlanta | clg_dp_0.4|total_w_m2 | 79.3 | 77.9 | -1.8% |
| retail|atlanta | htg_99.6|total_w_m2 | 53.2 | 53.2 | -0.1% |
| retail|boston | clg_db_0.4|total_w_m2 | 76.1 | 74.5 | -2.1% |
| retail|boston | clg_dp_0.4|total_w_m2 | 80.5 | 78.9 | -2.0% |
| retail|boston | htg_99.6|total_w_m2 | 66.6 | 66.7 | +0.0% |
| retail|buffalo | clg_db_0.4|total_w_m2 | 69.8 | 68.1 | -2.5% |
| retail|buffalo | clg_dp_0.4|total_w_m2 | 77.3 | 75.4 | -2.4% |
| retail|buffalo | htg_99.6|total_w_m2 | 70.5 | 70.4 | -0.1% |
| retail|chicago | clg_db_0.4|total_w_m2 | 81.9 | 80.3 | -1.9% |
| retail|chicago | clg_dp_0.4|total_w_m2 | 88.8 | 87.2 | -1.9% |
| retail|chicago | htg_99.6|total_w_m2 | 77.8 | 77.7 | -0.1% |
| retail|dallas | clg_db_0.4|total_w_m2 | 81.4 | 80.2 | -1.5% |
| retail|dallas | clg_dp_0.4|total_w_m2 | 85.7 | 84.3 | -1.6% |
| retail|dallas | htg_99.6|total_w_m2 | 55.5 | 55.4 | -0.1% |
| retail|denver | clg_db_0.4|total_w_m2 | 49.9 | 50.0 | +0.2% |
| retail|denver | clg_dp_0.4|total_w_m2 | 46.8 | 47.6 | +1.6% |
| retail|denver | htg_99.6|total_w_m2 | 62.7 | 62.5 | -0.4% |
| retail|elpaso | clg_db_0.4|total_w_m2 | 55.4 | 54.2 | -2.2% |
| retail|elpaso | clg_dp_0.4|total_w_m2 | 56.1 | 54.6 | -2.7% |
| retail|elpaso | htg_99.6|total_w_m2 | 46.5 | 46.3 | -0.3% |
| retail|fairbanks | clg_db_0.4|total_w_m2 | 44.5 | 44.8 | +0.6% |
| retail|fairbanks | clg_dp_0.4|total_w_m2 | 40.9 | 40.0 | -2.0% |
| retail|fairbanks | htg_99.6|total_w_m2 | 115.8 | 116.0 | +0.1% |
| retail|greatfalls | clg_db_0.4|total_w_m2 | 49.2 | 48.3 | -1.8% |
| retail|greatfalls | clg_dp_0.4|total_w_m2 | 40.6 | 39.3 | -3.2% |
| retail|greatfalls | htg_99.6|total_w_m2 | 82.6 | 82.4 | -0.3% |
| retail|honolulu | clg_db_0.4|total_w_m2 | 74.7 | 74.1 | -0.8% |
| retail|honolulu | clg_dp_0.4|total_w_m2 | 80.4 | 79.6 | -1.0% |
| retail|honolulu | htg_99.6|total_w_m2 | 8.8 | 8.7 | -1.5% |
| retail|houston | clg_db_0.4|total_w_m2 | 86.3 | 85.6 | -0.8% |
| retail|houston | clg_dp_0.4|total_w_m2 | 90.2 | 89.6 | -0.6% |
| retail|houston | htg_99.6|total_w_m2 | 45.6 | 45.6 | -0.1% |
| retail|intlfalls | clg_db_0.4|total_w_m2 | 68.3 | 67.5 | -1.2% |
| retail|intlfalls | clg_dp_0.4|total_w_m2 | 73.6 | 72.5 | -1.6% |
| retail|intlfalls | htg_99.6|total_w_m2 | 97.8 | 98.0 | +0.2% |
| retail|kansascity | clg_db_0.4|total_w_m2 | 88.6 | 86.7 | -2.1% |
| retail|kansascity | clg_dp_0.4|total_w_m2 | 95.4 | 93.6 | -1.9% |
| retail|kansascity | htg_99.6|total_w_m2 | 74.4 | 74.3 | -0.2% |
| retail|losangeles | clg_db_0.4|total_w_m2 | 45.2 | 44.4 | -1.8% |
| retail|losangeles | clg_dp_0.4|total_w_m2 | 55.8 | 55.2 | -1.1% |
| retail|losangeles | htg_99.6|total_w_m2 | 27.4 | 27.2 | -0.6% |
| retail|miami | clg_db_0.4|total_w_m2 | 88.3 | 88.0 | -0.3% |
| retail|miami | clg_dp_0.4|total_w_m2 | 93.1 | 92.9 | -0.2% |
| retail|miami | htg_99.6|total_w_m2 | 24.5 | 24.4 | -0.3% |
| retail|newyork | clg_db_0.4|total_w_m2 | 77.4 | 75.8 | -2.1% |
| retail|newyork | clg_dp_0.4|total_w_m2 | 84.3 | 82.6 | -2.0% |
| retail|newyork | htg_99.6|total_w_m2 | 62.4 | 62.3 | -0.1% |
| retail|phoenix | clg_db_0.4|total_w_m2 | 70.9 | 70.1 | -1.1% |
| retail|phoenix | clg_dp_0.4|total_w_m2 | 74.8 | 73.6 | -1.6% |
| retail|phoenix | htg_99.6|total_w_m2 | 34.1 | 34.0 | -0.2% |
| retail|portangeles | clg_db_0.4|total_w_m2 | 45.2 | 45.0 | -0.5% |
| retail|portangeles | clg_dp_0.4|total_w_m2 | 37.6 | 37.7 | +0.3% |
| retail|portangeles | htg_99.6|total_w_m2 | 47.6 | 47.3 | -0.7% |
| retail|rochestermn | clg_db_0.4|total_w_m2 | 77.9 | 76.7 | -1.4% |
| retail|rochestermn | clg_dp_0.4|total_w_m2 | 85.3 | 84.0 | -1.5% |
| retail|rochestermn | htg_99.6|total_w_m2 | 86.5 | 86.3 | -0.3% |
| retail|sandiego | clg_db_0.4|total_w_m2 | 55.1 | 53.8 | -2.4% |
| retail|sandiego | clg_dp_0.4|total_w_m2 | 66.5 | 65.0 | -2.3% |
| retail|sandiego | htg_99.6|total_w_m2 | 27.2 | 27.0 | -0.6% |
| retail|sanfrancisco | clg_db_0.4|total_w_m2 | 40.9 | 40.5 | -1.1% |
| retail|sanfrancisco | clg_dp_0.4|total_w_m2 | 35.1 | 35.3 | +0.4% |
| retail|sanfrancisco | htg_99.6|total_w_m2 | 33.8 | 33.6 | -0.6% |
| retail|seattle | clg_db_0.4|total_w_m2 | 52.7 | 51.9 | -1.4% |
| retail|seattle | clg_dp_0.4|total_w_m2 | 43.6 | 42.8 | -1.8% |
| retail|seattle | htg_99.6|total_w_m2 | 48.4 | 48.3 | -0.3% |
| retail|stlouis | clg_db_0.4|total_w_m2 | 90.5 | 89.1 | -1.6% |
| retail|stlouis | clg_dp_0.4|total_w_m2 | 94.2 | 92.7 | -1.6% |
| retail|stlouis | htg_99.6|total_w_m2 | 70.9 | 70.8 | -0.1% |
| retail|tampa | clg_db_0.4|total_w_m2 | 88.2 | 87.0 | -1.4% |
| retail|tampa | clg_dp_0.4|total_w_m2 | 95.2 | 93.8 | -1.5% |
| retail|tampa | htg_99.6|total_w_m2 | 34.8 | 34.7 | -0.4% |
| retail|tucson | clg_db_0.4|total_w_m2 | 61.5 | 60.6 | -1.3% |
| retail|tucson | clg_dp_0.4|total_w_m2 | 62.0 | 60.8 | -1.9% |
| retail|tucson | htg_99.6|total_w_m2 | 39.8 | 39.7 | -0.3% |
| retail|washington | clg_db_0.4|total_w_m2 | 86.9 | 86.0 | -1.1% |
| retail|washington | clg_dp_0.4|total_w_m2 | 90.1 | 89.2 | -1.0% |
| retail|washington | htg_99.6|total_w_m2 | 58.2 | 58.1 | -0.2% |
| school|albuquerque | clg_db_0.4|total_w_m2 | 80.0 | 78.4 | -2.0% |
| school|albuquerque | clg_dp_0.4|total_w_m2 | 80.4 | 79.0 | -1.7% |
| school|albuquerque | htg_99.6|total_w_m2 | 84.1 | 83.7 | -0.5% |
| school|atlanta | clg_db_0.4|total_w_m2 | 134.6 | 133.2 | -1.1% |
| school|atlanta | clg_dp_0.4|total_w_m2 | 140.4 | 138.9 | -1.1% |
| school|atlanta | htg_99.6|total_w_m2 | 93.0 | 92.9 | -0.1% |
| school|boston | clg_db_0.4|total_w_m2 | 127.9 | 126.1 | -1.4% |
| school|boston | clg_dp_0.4|total_w_m2 | 138.4 | 136.3 | -1.5% |
| school|boston | htg_99.6|total_w_m2 | 118.1 | 118.0 | -0.1% |
| school|buffalo | clg_db_0.4|total_w_m2 | 116.8 | 114.8 | -1.7% |
| school|buffalo | clg_dp_0.4|total_w_m2 | 132.8 | 130.3 | -1.9% |
| school|buffalo | htg_99.6|total_w_m2 | 124.4 | 124.3 | -0.1% |
| school|chicago | clg_db_0.4|total_w_m2 | 139.0 | 137.1 | -1.4% |
| school|chicago | clg_dp_0.4|total_w_m2 | 153.8 | 151.8 | -1.3% |
| school|chicago | htg_99.6|total_w_m2 | 136.9 | 136.7 | -0.2% |
| school|dallas | clg_db_0.4|total_w_m2 | 137.8 | 136.2 | -1.2% |
| school|dallas | clg_dp_0.4|total_w_m2 | 151.3 | 149.6 | -1.2% |
| school|dallas | htg_99.6|total_w_m2 | 96.2 | 96.1 | -0.1% |
| school|denver | clg_db_0.4|total_w_m2 | 78.6 | 77.1 | -1.9% |
| school|denver | clg_dp_0.4|total_w_m2 | 79.8 | 78.6 | -1.4% |
| school|denver | htg_99.6|total_w_m2 | 109.3 | 108.6 | -0.7% |
| school|elpaso | clg_db_0.4|total_w_m2 | 90.0 | 90.4 | +0.4% |
| school|elpaso | clg_dp_0.4|total_w_m2 | 100.4 | 100.2 | -0.1% |
| school|elpaso | htg_99.6|total_w_m2 | 80.9 | 80.8 | -0.1% |
| school|fairbanks | clg_db_0.4|total_w_m2 | 66.3 | 65.2 | -1.6% |
| school|fairbanks | clg_dp_0.4|total_w_m2 | 61.2 | 59.5 | -2.8% |
| school|fairbanks | htg_99.6|total_w_m2 | 206.0 | 206.3 | +0.1% |
| school|greatfalls | clg_db_0.4|total_w_m2 | 77.5 | 76.2 | -1.7% |
| school|greatfalls | clg_dp_0.4|total_w_m2 | 66.9 | 65.8 | -1.6% |
| school|greatfalls | htg_99.6|total_w_m2 | 145.0 | 144.9 | -0.1% |
| school|honolulu | clg_db_0.4|total_w_m2 | 128.3 | 126.6 | -1.4% |
| school|honolulu | clg_dp_0.4|total_w_m2 | 142.4 | 140.1 | -1.6% |
| school|honolulu | htg_99.6|total_w_m2 | 17.9 | 17.8 | -0.6% |
| school|houston | clg_db_0.4|total_w_m2 | 148.7 | 147.6 | -0.8% |
| school|houston | clg_dp_0.4|total_w_m2 | 160.7 | 159.0 | -1.0% |
| school|houston | htg_99.6|total_w_m2 | 80.0 | 80.0 | -0.1% |
| school|intlfalls | clg_db_0.4|total_w_m2 | 112.6 | 111.3 | -1.1% |
| school|intlfalls | clg_dp_0.4|total_w_m2 | 124.4 | 122.9 | -1.3% |
| school|intlfalls | htg_99.6|total_w_m2 | 173.1 | 172.6 | -0.2% |
| school|kansascity | clg_db_0.4|total_w_m2 | 151.1 | 148.8 | -1.6% |
| school|kansascity | clg_dp_0.4|total_w_m2 | 166.4 | 163.9 | -1.5% |
| school|kansascity | htg_99.6|total_w_m2 | 129.9 | 129.8 | -0.1% |
| school|losangeles | clg_db_0.4|total_w_m2 | 72.7 | 71.8 | -1.1% |
| school|losangeles | clg_dp_0.4|total_w_m2 | 96.5 | 95.5 | -1.0% |
| school|losangeles | htg_99.6|total_w_m2 | 49.7 | 49.6 | -0.1% |
| school|miami | clg_db_0.4|total_w_m2 | 153.4 | 151.8 | -1.1% |
| school|miami | clg_dp_0.4|total_w_m2 | 165.3 | 163.4 | -1.1% |
| school|miami | htg_99.6|total_w_m2 | 44.4 | 44.3 | -0.1% |
| school|newyork | clg_db_0.4|total_w_m2 | 130.3 | 129.1 | -0.9% |
| school|newyork | clg_dp_0.4|total_w_m2 | 145.7 | 144.3 | -1.0% |
| school|newyork | htg_99.6|total_w_m2 | 109.7 | 109.7 | -0.0% |
| school|phoenix | clg_db_0.4|total_w_m2 | 115.2 | 113.9 | -1.0% |
| school|phoenix | clg_dp_0.4|total_w_m2 | 131.1 | 128.6 | -1.9% |
| school|phoenix | htg_99.6|total_w_m2 | 60.1 | 60.0 | -0.1% |
| school|portangeles | clg_db_0.4|total_w_m2 | 69.4 | 68.5 | -1.2% |
| school|portangeles | clg_dp_0.4|total_w_m2 | 59.0 | 58.4 | -1.1% |
| school|portangeles | htg_99.6|total_w_m2 | 85.4 | 85.4 | +0.0% |
| school|rochestermn | clg_db_0.4|total_w_m2 | 132.5 | 130.8 | -1.3% |
| school|rochestermn | clg_dp_0.4|total_w_m2 | 148.0 | 146.0 | -1.4% |
| school|rochestermn | htg_99.6|total_w_m2 | 152.6 | 152.6 | -0.0% |
| school|sandiego | clg_db_0.4|total_w_m2 | 91.5 | 90.8 | -0.8% |
| school|sandiego | clg_dp_0.4|total_w_m2 | 115.6 | 115.0 | -0.5% |
| school|sandiego | htg_99.6|total_w_m2 | 49.3 | 49.2 | -0.2% |
| school|sanfrancisco | clg_db_0.4|total_w_m2 | 65.2 | 64.1 | -1.7% |
| school|sanfrancisco | clg_dp_0.4|total_w_m2 | 60.1 | 59.9 | -0.4% |
| school|sanfrancisco | htg_99.6|total_w_m2 | 60.6 | 60.8 | +0.2% |
| school|seattle | clg_db_0.4|total_w_m2 | 82.6 | 81.1 | -1.8% |
| school|seattle | clg_dp_0.4|total_w_m2 | 70.4 | 73.0 | +3.6% |
| school|seattle | htg_99.6|total_w_m2 | 86.0 | 86.0 | -0.1% |
| school|stlouis | clg_db_0.4|total_w_m2 | 154.3 | 152.8 | -1.0% |
| school|stlouis | clg_dp_0.4|total_w_m2 | 163.7 | 161.9 | -1.1% |
| school|stlouis | htg_99.6|total_w_m2 | 124.0 | 124.0 | -0.0% |
| school|tampa | clg_db_0.4|total_w_m2 | 152.9 | 151.4 | -1.0% |
| school|tampa | clg_dp_0.4|total_w_m2 | 168.6 | 166.9 | -1.0% |
| school|tampa | htg_99.6|total_w_m2 | 61.9 | 61.8 | -0.2% |
| school|tucson | clg_db_0.4|total_w_m2 | 100.0 | 97.7 | -2.3% |
| school|tucson | clg_dp_0.4|total_w_m2 | 110.8 | 109.1 | -1.6% |
| school|tucson | htg_99.6|total_w_m2 | 69.6 | 69.5 | -0.2% |
| school|washington | clg_db_0.4|total_w_m2 | 147.7 | 146.1 | -1.0% |
| school|washington | clg_dp_0.4|total_w_m2 | 156.3 | 154.7 | -1.0% |
| school|washington | htg_99.6|total_w_m2 | 102.7 | 102.7 | -0.0% |
| sports|albuquerque | clg_db_0.4|total_w_m2 | 51.0 | 50.6 | -0.8% |
| sports|albuquerque | clg_dp_0.4|total_w_m2 | 42.2 | 42.4 | +0.5% |
| sports|albuquerque | htg_99.6|total_w_m2 | 57.3 | 57.2 | -0.2% |
| sports|atlanta | clg_db_0.4|total_w_m2 | 85.2 | 84.3 | -1.1% |
| sports|atlanta | clg_dp_0.4|total_w_m2 | 87.4 | 86.5 | -1.0% |
| sports|atlanta | htg_99.6|total_w_m2 | 62.9 | 62.8 | -0.1% |
| sports|boston | clg_db_0.4|total_w_m2 | 81.5 | 81.1 | -0.4% |
| sports|boston | clg_dp_0.4|total_w_m2 | 88.0 | 87.4 | -0.7% |
| sports|boston | htg_99.6|total_w_m2 | 81.1 | 80.8 | -0.3% |
| sports|buffalo | clg_db_0.4|total_w_m2 | 73.1 | 72.9 | -0.3% |
| sports|buffalo | clg_dp_0.4|total_w_m2 | 83.6 | 83.1 | -0.6% |
| sports|buffalo | htg_99.6|total_w_m2 | 86.1 | 86.3 | +0.2% |
| sports|chicago | clg_db_0.4|total_w_m2 | 89.2 | 87.8 | -1.6% |
| sports|chicago | clg_dp_0.4|total_w_m2 | 99.0 | 97.2 | -1.9% |
| sports|chicago | htg_99.6|total_w_m2 | 95.5 | 95.5 | -0.0% |
| sports|dallas | clg_db_0.4|total_w_m2 | 88.4 | 87.6 | -1.0% |
| sports|dallas | clg_dp_0.4|total_w_m2 | 95.7 | 94.8 | -1.0% |
| sports|dallas | htg_99.6|total_w_m2 | 65.3 | 65.4 | +0.1% |
| sports|denver | clg_db_0.4|total_w_m2 | 49.9 | 49.3 | -1.4% |
| sports|denver | clg_dp_0.4|total_w_m2 | 42.0 | 41.5 | -1.3% |
| sports|denver | htg_99.6|total_w_m2 | 76.3 | 76.2 | -0.1% |
| sports|elpaso | clg_db_0.4|total_w_m2 | 56.3 | 55.7 | -1.0% |
| sports|elpaso | clg_dp_0.4|total_w_m2 | 56.6 | 57.1 | +0.8% |
| sports|elpaso | htg_99.6|total_w_m2 | 54.5 | 54.5 | -0.1% |
| sports|fairbanks | clg_db_0.4|total_w_m2 | 40.4 | 40.2 | -0.5% |
| sports|fairbanks | clg_dp_0.4|total_w_m2 | 32.7 | 31.5 | -3.6% |
| sports|fairbanks | htg_99.6|total_w_m2 | 146.5 | 146.1 | -0.2% |
| sports|greatfalls | clg_db_0.4|total_w_m2 | 48.8 | 48.1 | -1.3% |
| sports|greatfalls | clg_dp_0.4|total_w_m2 | 32.9 | 32.3 | -1.9% |
| sports|greatfalls | htg_99.6|total_w_m2 | 102.4 | 102.2 | -0.2% |
| sports|honolulu | clg_db_0.4|total_w_m2 | 80.5 | 81.0 | +0.7% |
| sports|honolulu | clg_dp_0.4|total_w_m2 | 88.9 | 89.4 | +0.6% |
| sports|honolulu | htg_99.6|total_w_m2 | 5.7 | 5.6 | -2.2% |
| sports|houston | clg_db_0.4|total_w_m2 | 95.7 | 95.0 | -0.8% |
| sports|houston | clg_dp_0.4|total_w_m2 | 102.0 | 101.3 | -0.7% |
| sports|houston | htg_99.6|total_w_m2 | 52.8 | 52.8 | -0.2% |
| sports|intlfalls | clg_db_0.4|total_w_m2 | 70.5 | 69.7 | -1.1% |
| sports|intlfalls | clg_dp_0.4|total_w_m2 | 78.1 | 77.0 | -1.5% |
| sports|intlfalls | htg_99.6|total_w_m2 | 122.4 | 122.2 | -0.1% |
| sports|kansascity | clg_db_0.4|total_w_m2 | 98.0 | 96.5 | -1.5% |
| sports|kansascity | clg_dp_0.4|total_w_m2 | 107.9 | 105.9 | -1.8% |
| sports|kansascity | htg_99.6|total_w_m2 | 90.7 | 90.6 | -0.1% |
| sports|losangeles | clg_db_0.4|total_w_m2 | 40.9 | 40.4 | -1.3% |
| sports|losangeles | clg_dp_0.4|total_w_m2 | 56.3 | 56.0 | -0.5% |
| sports|losangeles | htg_99.6|total_w_m2 | 29.8 | 29.7 | -0.4% |
| sports|miami | clg_db_0.4|total_w_m2 | 98.6 | 98.5 | -0.1% |
| sports|miami | clg_dp_0.4|total_w_m2 | 105.7 | 105.3 | -0.4% |
| sports|miami | htg_99.6|total_w_m2 | 25.7 | 25.6 | -0.3% |
| sports|newyork | clg_db_0.4|total_w_m2 | 83.1 | 82.5 | -0.7% |
| sports|newyork | clg_dp_0.4|total_w_m2 | 93.1 | 92.6 | -0.5% |
| sports|newyork | htg_99.6|total_w_m2 | 75.0 | 75.1 | +0.1% |
| sports|phoenix | clg_db_0.4|total_w_m2 | 74.4 | 73.4 | -1.3% |
| sports|phoenix | clg_dp_0.4|total_w_m2 | 80.9 | 79.6 | -1.7% |
| sports|phoenix | htg_99.6|total_w_m2 | 38.1 | 38.0 | -0.3% |
| sports|portangeles | clg_db_0.4|total_w_m2 | 39.4 | 39.4 | +0.0% |
| sports|portangeles | clg_dp_0.4|total_w_m2 | 28.8 | 28.6 | -0.9% |
| sports|portangeles | htg_99.6|total_w_m2 | 56.7 | 56.7 | +0.1% |
| sports|rochestermn | clg_db_0.4|total_w_m2 | 84.1 | 84.4 | +0.3% |
| sports|rochestermn | clg_dp_0.4|total_w_m2 | 94.5 | 94.7 | +0.2% |
| sports|rochestermn | htg_99.6|total_w_m2 | 107.3 | 107.1 | -0.2% |
| sports|sandiego | clg_db_0.4|total_w_m2 | 54.3 | 53.8 | -0.8% |
| sports|sandiego | clg_dp_0.4|total_w_m2 | 70.2 | 69.9 | -0.5% |
| sports|sandiego | htg_99.6|total_w_m2 | 29.5 | 29.3 | -0.7% |
| sports|sanfrancisco | clg_db_0.4|total_w_m2 | 35.3 | 35.1 | -0.3% |
| sports|sanfrancisco | clg_dp_0.4|total_w_m2 | 27.8 | 28.0 | +0.7% |
| sports|sanfrancisco | htg_99.6|total_w_m2 | 38.1 | 38.0 | -0.2% |
| sports|seattle | clg_db_0.4|total_w_m2 | 49.1 | 49.0 | -0.2% |
| sports|seattle | clg_dp_0.4|total_w_m2 | 37.9 | 37.1 | -2.0% |
| sports|seattle | htg_99.6|total_w_m2 | 57.2 | 56.9 | -0.6% |
| sports|stlouis | clg_db_0.4|total_w_m2 | 100.5 | 99.1 | -1.3% |
| sports|stlouis | clg_dp_0.4|total_w_m2 | 106.2 | 104.5 | -1.5% |
| sports|stlouis | htg_99.6|total_w_m2 | 86.0 | 86.0 | -0.0% |
| sports|tampa | clg_db_0.4|total_w_m2 | 98.4 | 97.6 | -0.9% |
| sports|tampa | clg_dp_0.4|total_w_m2 | 108.4 | 107.3 | -1.1% |
| sports|tampa | htg_99.6|total_w_m2 | 39.1 | 39.0 | -0.2% |
| sports|tucson | clg_db_0.4|total_w_m2 | 65.2 | 64.8 | -0.7% |
| sports|tucson | clg_dp_0.4|total_w_m2 | 64.5 | 64.7 | +0.3% |
| sports|tucson | htg_99.6|total_w_m2 | 45.6 | 45.3 | -0.7% |
| sports|washington | clg_db_0.4|total_w_m2 | 95.7 | 94.1 | -1.7% |
| sports|washington | clg_dp_0.4|total_w_m2 | 100.8 | 98.9 | -1.9% |
| sports|washington | htg_99.6|total_w_m2 | 69.7 | 69.7 | -0.0% |
| stadium|albuquerque | clg_db_0.4|total_w_m2 | 177.0 | 175.4 | -0.9% |
| stadium|albuquerque | clg_dp_0.4|total_w_m2 | 188.8 | 185.2 | -1.9% |
| stadium|albuquerque | htg_99.6|total_w_m2 | 181.0 | 180.9 | -0.0% |
| stadium|atlanta | clg_db_0.4|total_w_m2 | 321.3 | 322.6 | +0.4% |
| stadium|atlanta | clg_dp_0.4|total_w_m2 | 343.2 | 345.3 | +0.6% |
| stadium|atlanta | htg_99.6|total_w_m2 | 198.9 | 198.8 | -0.0% |
| stadium|boston | clg_db_0.4|total_w_m2 | 297.9 | 301.1 | +1.1% |
| stadium|boston | clg_dp_0.4|total_w_m2 | 329.2 | 332.7 | +1.1% |
| stadium|boston | htg_99.6|total_w_m2 | 264.0 | 264.1 | +0.0% |
| stadium|buffalo | clg_db_0.4|total_w_m2 | 270.9 | 271.4 | +0.2% |
| stadium|buffalo | clg_dp_0.4|total_w_m2 | 316.4 | 316.8 | +0.1% |
| stadium|buffalo | htg_99.6|total_w_m2 | 279.8 | 279.7 | -0.0% |
| stadium|chicago | clg_db_0.4|total_w_m2 | 327.6 | 329.3 | +0.5% |
| stadium|chicago | clg_dp_0.4|total_w_m2 | 369.9 | 371.7 | +0.5% |
| stadium|chicago | htg_99.6|total_w_m2 | 310.3 | 310.1 | -0.0% |
| stadium|dallas | clg_db_0.4|total_w_m2 | 323.5 | 324.5 | +0.3% |
| stadium|dallas | clg_dp_0.4|total_w_m2 | 368.1 | 370.1 | +0.5% |
| stadium|dallas | htg_99.6|total_w_m2 | 204.7 | 204.6 | -0.0% |
| stadium|denver | clg_db_0.4|total_w_m2 | 174.6 | 174.0 | -0.3% |
| stadium|denver | clg_dp_0.4|total_w_m2 | 185.8 | 182.7 | -1.6% |
| stadium|denver | htg_99.6|total_w_m2 | 244.2 | 244.1 | -0.1% |
| stadium|elpaso | clg_db_0.4|total_w_m2 | 205.6 | 204.2 | -0.7% |
| stadium|elpaso | clg_dp_0.4|total_w_m2 | 242.6 | 241.1 | -0.6% |
| stadium|elpaso | htg_99.6|total_w_m2 | 171.5 | 171.3 | -0.1% |
| stadium|fairbanks | clg_db_0.4|total_w_m2 | 135.6 | 133.4 | -1.6% |
| stadium|fairbanks | clg_dp_0.4|total_w_m2 | 121.8 | 119.9 | -1.5% |
| stadium|fairbanks | htg_99.6|total_w_m2 | 487.4 | 488.8 | +0.3% |
| stadium|greatfalls | clg_db_0.4|total_w_m2 | 170.7 | 169.7 | -0.6% |
| stadium|greatfalls | clg_dp_0.4|total_w_m2 | 147.2 | 144.8 | -1.6% |
| stadium|greatfalls | htg_99.6|total_w_m2 | 333.1 | 333.6 | +0.2% |
| stadium|honolulu | clg_db_0.4|total_w_m2 | 305.5 | 304.7 | -0.2% |
| stadium|honolulu | clg_dp_0.4|total_w_m2 | 348.2 | 349.0 | +0.2% |
| stadium|honolulu | htg_99.6|total_w_m2 | 16.3 | 16.0 | -1.7% |
| stadium|houston | clg_db_0.4|total_w_m2 | 355.1 | 358.0 | +0.8% |
| stadium|houston | clg_dp_0.4|total_w_m2 | 394.4 | 397.9 | +0.9% |
| stadium|houston | htg_99.6|total_w_m2 | 166.5 | 166.4 | -0.1% |
| stadium|intlfalls | clg_db_0.4|total_w_m2 | 257.4 | 255.0 | -0.9% |
| stadium|intlfalls | clg_dp_0.4|total_w_m2 | 291.5 | 288.8 | -0.9% |
| stadium|intlfalls | htg_99.6|total_w_m2 | 403.3 | 403.7 | +0.1% |
| stadium|kansascity | clg_db_0.4|total_w_m2 | 359.8 | 362.8 | +0.8% |
| stadium|kansascity | clg_dp_0.4|total_w_m2 | 404.3 | 407.2 | +0.7% |
| stadium|kansascity | htg_99.6|total_w_m2 | 290.7 | 290.7 | -0.0% |
| stadium|losangeles | clg_db_0.4|total_w_m2 | 158.1 | 156.5 | -1.0% |
| stadium|losangeles | clg_dp_0.4|total_w_m2 | 226.9 | 229.0 | +0.9% |
| stadium|losangeles | htg_99.6|total_w_m2 | 94.5 | 94.2 | -0.2% |
| stadium|miami | clg_db_0.4|total_w_m2 | 371.4 | 372.8 | +0.4% |
| stadium|miami | clg_dp_0.4|total_w_m2 | 407.7 | 409.8 | +0.5% |
| stadium|miami | htg_99.6|total_w_m2 | 80.0 | 79.9 | -0.2% |
| stadium|newyork | clg_db_0.4|total_w_m2 | 304.4 | 306.9 | +0.8% |
| stadium|newyork | clg_dp_0.4|total_w_m2 | 349.3 | 351.4 | +0.6% |
| stadium|newyork | htg_99.6|total_w_m2 | 241.3 | 241.3 | -0.0% |
| stadium|phoenix | clg_db_0.4|total_w_m2 | 262.7 | 263.7 | +0.4% |
| stadium|phoenix | clg_dp_0.4|total_w_m2 | 315.7 | 320.6 | +1.6% |
| stadium|phoenix | htg_99.6|total_w_m2 | 118.2 | 118.1 | -0.1% |
| stadium|portangeles | clg_db_0.4|total_w_m2 | 143.0 | 141.7 | -0.9% |
| stadium|portangeles | clg_dp_0.4|total_w_m2 | 120.2 | 118.8 | -1.2% |
| stadium|portangeles | htg_99.6|total_w_m2 | 184.8 | 184.5 | -0.2% |
| stadium|rochestermn | clg_db_0.4|total_w_m2 | 313.7 | 313.4 | -0.1% |
| stadium|rochestermn | clg_dp_0.4|total_w_m2 | 357.4 | 357.2 | -0.1% |
| stadium|rochestermn | htg_99.6|total_w_m2 | 351.2 | 351.1 | -0.0% |
| stadium|sandiego | clg_db_0.4|total_w_m2 | 209.0 | 207.3 | -0.8% |
| stadium|sandiego | clg_dp_0.4|total_w_m2 | 277.0 | 276.2 | -0.3% |
| stadium|sandiego | htg_99.6|total_w_m2 | 93.2 | 92.6 | -0.7% |
| stadium|sanfrancisco | clg_db_0.4|total_w_m2 | 137.8 | 136.7 | -0.8% |
| stadium|sanfrancisco | clg_dp_0.4|total_w_m2 | 131.3 | 131.9 | +0.5% |
| stadium|sanfrancisco | htg_99.6|total_w_m2 | 120.9 | 120.9 | +0.1% |
| stadium|seattle | clg_db_0.4|total_w_m2 | 176.3 | 174.3 | -1.2% |
| stadium|seattle | clg_dp_0.4|total_w_m2 | 149.8 | 147.1 | -1.8% |
| stadium|seattle | htg_99.6|total_w_m2 | 184.4 | 184.2 | -0.1% |
| stadium|stlouis | clg_db_0.4|total_w_m2 | 366.8 | 367.9 | +0.3% |
| stadium|stlouis | clg_dp_0.4|total_w_m2 | 395.7 | 396.4 | +0.2% |
| stadium|stlouis | htg_99.6|total_w_m2 | 276.1 | 276.1 | -0.0% |
| stadium|tampa | clg_db_0.4|total_w_m2 | 367.5 | 372.3 | +1.3% |
| stadium|tampa | clg_dp_0.4|total_w_m2 | 413.4 | 418.3 | +1.2% |
| stadium|tampa | htg_99.6|total_w_m2 | 123.0 | 122.9 | -0.1% |
| stadium|tucson | clg_db_0.4|total_w_m2 | 228.1 | 225.1 | -1.3% |
| stadium|tucson | clg_dp_0.4|total_w_m2 | 267.4 | 265.8 | -0.6% |
| stadium|tucson | htg_99.6|total_w_m2 | 142.2 | 142.5 | +0.2% |
| stadium|washington | clg_db_0.4|total_w_m2 | 348.8 | 349.5 | +0.2% |
| stadium|washington | clg_dp_0.4|total_w_m2 | 376.2 | 377.4 | +0.3% |
| stadium|washington | htg_99.6|total_w_m2 | 224.5 | 224.5 | -0.0% |

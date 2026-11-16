# Report figures

Method diagrams for reports, drawn as SVG by small Python scripts and exported with Playwright.

| Figure | Script | Data |
|---|---|---|
| `method_workflow` – how the surrogates are built | `make_fig.py` | none (schematic) |
| `method_validation` – how each surrogate is tested | `make_val.py` | `valdata.json`: test runs of office/Chicago and sports/San Francisco, scored with the published models |
| `method_combined` – build and test in one | `make_combined.py` | reuses both |

```bash
cd docs/figures
python3 make_fig.py method_workflow.svg
python3 make_val.py method_validation.svg
python3 make_combined.py method_combined.svg
node render.js method_combined.svg method_combined.png 3 method_combined.pdf   # PNG at 3x, plus a PDF
```

`valdata.json` must be regenerated after each refit (see the docstring of `extract_valdata.py`), since the figures quote the models' test errors.

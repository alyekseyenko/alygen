# Evals — Market Intel

Add anonymised cases here (`cases.jsonl`) with:
- `name`, `city`, `sector`, `website`
- `expected_contains` (required phrases)
- `must_not_contain` (e.g. invented names like "Grupo X Regional")

Run (when wired): `pytest backend_python/evals/test_market_intel.py`

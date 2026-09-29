# Evals — Market Intel

Coloque aqui casos anonimizados (`cases.jsonl`) com:
- `name`, `city`, `sector`, `website`
- `expected_contains` (frases obrigatórias)
- `must_not_contain` (ex.: nomes inventados tipo "Grupo X Regional")

Correr (futuro): `pytest backend_python/evals/test_market_intel.py`

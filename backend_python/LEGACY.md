# Legacy Python modules (do not use)

Runtime market intel: **`services/agent_graph.py`** via FastAPI `POST /agent/market-intel`.

The following are **not** wired to `main.py` and are kept only for reference until removed:

- `routes/agent_routes.py` (Flask blueprint)
- `test_agent.py` (old `agent_rag` demo)

Delete copies of old orchestrators if they reappear in the tree; use `agent_orchestration.py` as the thin delegate only.

"""Deprecated — use FastAPI POST /agent/market-intel in main.py."""

def run_market_intel_workflow(*_args, **_kwargs):
    raise RuntimeError(
        "Flask agent_routes is deprecated. Use FastAPI /agent/market-intel (agent_graph.py)."
    )

"""In-graph telemetry rows returned to Node for ai_generations persistence."""
import time
from typing import Any, Dict, List, Optional

COST_IN = 0.00005 / 1000
COST_OUT = 0.00008 / 1000


def usage_from_metadata(resp: Any) -> Dict[str, int]:
    if resp is None:
        return {"tokens_in": 0, "tokens_out": 0}
    meta = getattr(resp, "response_metadata", None) or {}
    usage = meta.get("token_usage") or meta.get("usage") or {}
    return {
        "tokens_in": int(usage.get("prompt_tokens") or usage.get("input_tokens") or 0),
        "tokens_out": int(usage.get("completion_tokens") or usage.get("output_tokens") or 0),
    }


def append_telemetry(
    state: Dict[str, Any],
    agent_name: str,
    started: float,
    model: str,
    output_text: str = "",
    prompt_version: str = "1.0.0",
    degraded: bool = False,
    resp: Any = None,
    tokens_in: Optional[int] = None,
    tokens_out: Optional[int] = None,
) -> None:
    latency_ms = int((time.time() - started) * 1000)
    if tokens_in is None or tokens_out is None:
        u = usage_from_metadata(resp)
        tokens_in = u["tokens_in"]
        tokens_out = u["tokens_out"]
    cost_eur = round(tokens_in * COST_IN + tokens_out * COST_OUT, 6)
    row = {
        "agent_name": agent_name,
        "prompt_version": prompt_version,
        "model": model,
        "latency_ms": latency_ms,
        "tokens_in": tokens_in,
        "tokens_out": tokens_out,
        "cost_eur": cost_eur,
        "degraded": degraded,
        "output_text": (output_text or "")[:4000],
    }
    state.setdefault("telemetry", [])
    state["telemetry"].append(row)

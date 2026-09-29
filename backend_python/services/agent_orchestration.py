#!/usr/bin/env python3
"""Market intel entrypoint — delegates to LangGraph agent_graph."""
from typing import Any, Dict, List, Optional

from services.agent_graph import run_graceful_fallback, run_market_intel_graph


async def run_multitask_intel(
    name: str,
    city: str,
    sector: str,
    website: Optional[str] = None,
    internal_competitors: Optional[List[Dict[str, Any]]] = None,
    rag_context: Optional[str] = None,
    audit_context: Optional[Dict[str, Any]] = None,
    semantic_context: Optional[str] = None,
    competitor_snapshots: Optional[List[Dict[str, Any]]] = None,
    trace_id: Optional[str] = None,
) -> Dict[str, Any]:
    return await run_market_intel_graph(
        name=name,
        city=city,
        sector=sector,
        website=website,
        internal_competitors=internal_competitors,
        rag_context=rag_context,
        audit_context=audit_context,
        semantic_context=semantic_context,
        competitor_snapshots=competitor_snapshots,
        trace_id=trace_id,
    )


__all__ = ["run_multitask_intel", "run_graceful_fallback"]

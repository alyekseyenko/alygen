"""Monta pacotes de contexto para agentes (RAG + CRM)."""
from __future__ import annotations

import json
from typing import Any, Dict, List, Optional


async def build_lead_context_pack(
    sector: str,
    city: str,
    website: Optional[str] = None,
    internal_competitors: Optional[List[Dict[str, Any]]] = None,
    max_chars: int = 12000,
) -> Dict[str, Any]:
    """Context pack mínimo — extensível com document_chunks híbrido."""
    parts = [
        f"Setor: {sector}",
        f"Cidade: {city}",
        f"Website alvo: {website or 'N/A'}",
    ]
    if internal_competitors:
        parts.append("Concorrentes internos (CRM):")
        for c in internal_competitors[:5]:
            parts.append(f"- {c.get('name')} ({c.get('url')}) Q-Score={c.get('qscore')}")

    text = "\n".join(parts)
    if len(text) > max_chars:
        text = text[: max_chars - 3] + "..."

    return {
        "text": text,
        "citations": [],
        "sources": ["crm_lead_analyses", "internal_competitors"],
        "meta": {"sector": sector, "city": city, "website": website},
    }

"""Fallback local Ollama (alinhado com Node OLLAMA_URL / OLLAMA_MODEL)."""
import os
import time
from typing import Any, Dict, List, Tuple

import httpx
from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, SystemMessage


def ollama_enabled() -> bool:
    flag = (os.environ.get("OLLAMA_DISABLE") or "").strip().lower()
    if flag in ("1", "true", "yes"):
        return False
    return bool((os.environ.get("OLLAMA_URL") or "http://localhost:11434").strip())


def _chat_url() -> str:
    base = (os.environ.get("OLLAMA_URL") or "http://localhost:11434").rstrip("/")
    if base.endswith("/api/chat"):
        return base
    return f"{base}/api/chat"


def _to_ollama_messages(messages: List[BaseMessage]) -> List[Dict[str, str]]:
    out: List[Dict[str, str]] = []
    for msg in messages:
        if isinstance(msg, SystemMessage):
            out.append({"role": "system", "content": msg.content or ""})
        elif isinstance(msg, HumanMessage):
            out.append({"role": "user", "content": msg.content or ""})
        elif isinstance(msg, AIMessage):
            out.append({"role": "assistant", "content": msg.content or ""})
        else:
            out.append({"role": "user", "content": str(getattr(msg, "content", msg))})
    return out


async def ollama_chat(
    messages: List[BaseMessage],
    *,
    purpose: str = "copy",
    timeout_s: float = 90.0,
) -> Tuple[str, Dict[str, Any]]:
    model = os.environ.get("OLLAMA_MODEL", "llama3.1:latest")
    temperature = 0.3 if purpose == "reasoning" else 0.6
    payload = {
        "model": model,
        "messages": _to_ollama_messages(messages),
        "stream": False,
        "options": {"temperature": temperature},
    }
    started = time.time()
    async with httpx.AsyncClient(timeout=timeout_s) as client:
        resp = await client.post(_chat_url(), json=payload)
        resp.raise_for_status()
        data = resp.json()
    text = (data.get("message") or {}).get("content") or ""
    latency_ms = int((time.time() - started) * 1000)
    usage = {
        "model": f"ollama:{model}",
        "tokens_in": 0,
        "tokens_out": 0,
        "cost_eur": 0.0,
        "latency_ms": latency_ms,
        "degraded": True,
        "provider": "ollama",
    }
    return text, usage

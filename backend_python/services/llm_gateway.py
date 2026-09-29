"""
Unified LLM gateway: Groq (pool + rotação) → Ollama local → erro.
"""
import logging
import time
from typing import Any, Dict, List, Optional

from langchain_core.messages import BaseMessage
from langchain_groq import ChatGroq

from services.groq_keys import (
    current_groq_key,
    groq_key_retryable,
    has_groq_keys,
    mark_groq_key_failed,
    parse_groq_keys,
    rotate_groq_key,
)
from services.ollama_client import ollama_chat, ollama_enabled

log = logging.getLogger(__name__)

MODEL_REASONING = "llama-3.3-70b-versatile"
MODEL_COPY = "llama-3.1-8b-instant"
COST_PER_1K_IN = 0.00005
COST_PER_1K_OUT = 0.00008


class LlmGateway:
    def __init__(self, purpose: str = "reasoning"):
        if not has_groq_keys() and not ollama_enabled():
            raise RuntimeError("GROQ_API_KEY missing and Ollama disabled")
        self.purpose = purpose
        model = MODEL_REASONING if purpose == "reasoning" else MODEL_COPY
        self.model = model
        self.last_usage: Dict[str, Any] = {}
        self._active_key: Optional[str] = None
        self.llm: Optional[ChatGroq] = self._build_llm() if has_groq_keys() else None

    def _build_llm(self) -> ChatGroq:
        key = current_groq_key()
        if not key:
            raise RuntimeError("GROQ_API_KEY exhausted")
        self._active_key = key
        return ChatGroq(
            api_key=key,
            model=self.model,
            temperature=0.3 if self.purpose == "reasoning" else 0.7,
            timeout=45,
            max_retries=1,
        )

    async def _ainvoke_groq(self, messages: List[BaseMessage]) -> str:
        from services.langfuse_optional import langfuse_config

        if not self.llm:
            self.llm = self._build_llm()
        keys = parse_groq_keys()
        last_err: Optional[Exception] = None
        for attempt in range(max(1, len(keys))):
            started = time.time()
            try:
                resp = await self.llm.ainvoke(messages, config=langfuse_config())
            except Exception as e:
                last_err = e
                if groq_key_retryable(e) and attempt < len(keys) - 1:
                    mark_groq_key_failed(self._active_key)
                    rotate_groq_key()
                    self.llm = self._build_llm()
                    continue
                raise
            latency_ms = int((time.time() - started) * 1000)
            meta = getattr(resp, "response_metadata", {}) or {}
            usage = meta.get("token_usage") or meta.get("usage") or {}
            tokens_in = usage.get("prompt_tokens") or usage.get("input_tokens") or 0
            tokens_out = usage.get("completion_tokens") or usage.get("output_tokens") or 0
            cost = (tokens_in / 1000) * COST_PER_1K_IN + (tokens_out / 1000) * COST_PER_1K_OUT
            self.last_usage = {
                "model": self.model,
                "tokens_in": tokens_in,
                "tokens_out": tokens_out,
                "cost_eur": round(cost, 6),
                "latency_ms": latency_ms,
                "degraded": False,
                "provider": "groq",
            }
            return resp.content
        if last_err:
            raise last_err
        raise RuntimeError("LLM invoke failed")

    async def ainvoke(self, messages: List[BaseMessage]) -> str:
        if has_groq_keys():
            try:
                return await self._ainvoke_groq(messages)
            except Exception as e:
                if not ollama_enabled():
                    raise
                log.warning("Groq falhou (%s), fallback Ollama...", e)

        if ollama_enabled():
            text, usage = await ollama_chat(messages, purpose=self.purpose)
            if not text.strip():
                raise RuntimeError("Ollama returned empty response")
            self.last_usage = usage
            return text

        raise RuntimeError("No LLM provider available")


async def invoke_copy(messages: List[BaseMessage]) -> tuple[str, Dict[str, Any]]:
    gw = LlmGateway(purpose="copy")
    text = await gw.ainvoke(messages)
    return text, gw.last_usage

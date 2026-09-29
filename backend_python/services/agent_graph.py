"""
LangGraph market intel: Researcher -> Strategist -> Synthesizer -> Critic (max 1 rewrite).
"""
import asyncio
import json
import logging
import os
import re
import time
import uuid
from typing import Any, Dict, List, Optional, TypedDict

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_groq import ChatGroq
from langchain_community.tools import DuckDuckGoSearchRun
from langgraph.graph import END, StateGraph
from pydantic import BaseModel, Field

from services.prompt_loader import load_prompt
from context.context_builder import build_lead_context_pack
from services.agent_models import StrategyBrief, VerdictOutput
from services.agent_telemetry import append_telemetry

log = logging.getLogger("alygen-python")

BOOL_PLACEHOLDER = re.compile(r"\[(RIVAL|CLIENTE|EMPRESA|X|AÇÃO|ACTION)\s*[A-Z]?\]", re.I)
PT_BR_LEXICON = re.compile(
    r"\b(você|voce|celular|time|banheiro|ótimo|otimo|a gente)\b", re.I
)


class CompetitorEntry(BaseModel):
    name: str
    source_url: str = ""


class IntelState(TypedDict, total=False):
    name: str
    city: str
    sector: str
    website: Optional[str]
    internal_competitors: List[Dict[str, Any]]
    rag_context: Optional[str]
    audit_context: Optional[Dict[str, Any]]
    research_data: str
    strategy_insights: str
    intel: str
    competitors: List[str]
    degraded: bool
    model: str
    critic_ok: bool
    rewrite_count: int
    telemetry: List[Dict[str, Any]]
    trace_id: str
    prompt_versions: Dict[str, str]
    semantic_context: Optional[str]
    competitor_snapshots: List[Dict[str, Any]]
    critic_reason: Optional[str]


def _wrap_untrusted(text: str) -> str:
    return f"<untrusted>\n{text or ''}\n</untrusted>"


def run_graceful_fallback(name: str, city: str, sector: str) -> dict:
    intel_text = (
        f"Identificámos que empresas consolidadas do setor {sector} em {city} capturam tráfego local "
        f"com sites rápidos e presença em mapas digitais. Para {name} recuperar visibilidade, "
        f"deve priorizar performance mobile e dados estruturados Schema.org no curto prazo."
    )
    return {
        "success": True,
        "intel": intel_text,
        "competitors": [],
        "agents_involved": ["Researcher Heuristic Fallback"],
        "model": "static_heuristic_failsafe",
        "degraded": True,
        "telemetry": [],
        "trace_id": str(uuid.uuid4()),
    }


def _extract_competitor_names_from_search(text: str, exclude_name: str) -> List[str]:
    if not text:
        return []
    exclude = (exclude_name or "").strip().lower()
    names: List[str] = []
    for line in text.splitlines():
        line = line.strip()
        if len(line) < 4:
            continue
        candidate = re.sub(r"^[\d\.\-\*\s]+", "", line).split(" - ")[0].split("|")[0].strip()
        if len(candidate) < 3 or len(candidate) > 80:
            continue
        if exclude and exclude in candidate.lower():
            continue
        if candidate not in names:
            names.append(candidate)
        if len(names) >= 3:
            break
    return names


def _critic_pass(intel: str, max_sentences: int = 4) -> tuple[bool, str]:
    if not intel or len(intel.strip()) < 40:
        return False, "verdict_too_short"
    if BOOL_PLACEHOLDER.search(intel):
        return False, "placeholder_detected"
    if PT_BR_LEXICON.search(intel):
        return False, "pt_br_lexicon"
    sentences = [s for s in re.split(r"[.!?]+", intel) if s.strip()]
    if len(sentences) > max_sentences:
        return False, "too_many_sentences"
    return True, "ok"


def _build_llm() -> ChatGroq:
    from services.groq_keys import current_groq_key

    key = current_groq_key()
    if not key:
        raise RuntimeError("GROQ_API_KEY missing")
    return ChatGroq(
        api_key=key,
        model="llama-3.3-70b-versatile",
        temperature=0.3,
        timeout=45,
        max_retries=2,
    )


async def _node_researcher(state: IntelState) -> IntelState:
    started = time.time()
    name = state["name"]
    city = state["city"]
    sector = state["sector"]
    website = state.get("website") or ""
    internal = state.get("internal_competitors") or []
    internal_names = [
        c.get("name") for c in internal
        if c.get("name") and c.get("name").strip().lower() != name.strip().lower()
    ]
    search = DuckDuckGoSearchRun()
    search_query = (
        f"principais empresas concorrentes directos {sector} em {city} portugal "
        f"-site:{website} -\"{name}\""
    )
    try:
        ddg_data = await asyncio.wait_for(asyncio.to_thread(search.run, search_query), timeout=25)
    except Exception as search_err:
        log.warning("DuckDuckGo failed: %s", search_err)
        ddg_data = f"Na zona de {city}, existem múltiplos players no setor {sector}."
    maps_names: List[str] = []
    try:
        from services.prospector.providers import SerpApiMapsProvider

        provider = SerpApiMapsProvider()
        maps_rows = await provider.search(sector, city)
        for row in maps_rows[:5]:
            title = (row.get("name") or row.get("title") or "").strip()
            if title and title.lower() != name.strip().lower():
                maps_names.append(title)
    except Exception as maps_err:
        log.debug("Maps provider skipped: %s", maps_err)
    db_context = (
        f"Concorrentes CRM: {', '.join(internal_names[:3])}.\n" if internal_names else ""
    )
    pack = await build_lead_context_pack(sector, city, website, internal)
    rag_block = pack.get("text", "")
    semantic = state.get("semantic_context") or ""
    semantic_block = f"\nContexto sector (não citar como veredicto):\n{_wrap_untrusted(semantic)}\n" if semantic else ""
    state["research_data"] = f"{db_context}{semantic_block}{_wrap_untrusted(ddg_data)}\nRAG:\n{_wrap_untrusted(rag_block)}"
    if internal_names:
        state["competitors"] = internal_names[:3]
    elif maps_names:
        state["competitors"] = maps_names[:3]
    else:
        state["competitors"] = _extract_competitor_names_from_search(ddg_data, name)
    append_telemetry(
        state,
        "Researcher",
        started,
        "duckduckgo+crm",
        output_text=state.get("research_data", "")[:500],
        prompt_version="1.0.0",
    )
    return state


async def _node_strategist(state: IntelState, llm: ChatGroq) -> IntelState:
    started = time.time()
    model_name = getattr(llm, "model_name", None) or "llama-3.3-70b-versatile"
    audit = state.get("audit_context") or {}
    audit_lines = []
    if audit:
        for key in (
            "performanceMobile", "qscore", "qscore_grade", "hasSSL", "aeoScore",
            "trackingCount", "hasCTA", "seoScore", "securityScore", "googleRankingScore",
        ):
            if key in audit:
                audit_lines.append(f"- {key}: {audit[key]}")
    audit_block = "\n".join(audit_lines) if audit_lines else "Sem auditoria técnica disponível."
    snapshots = audit.get("competitor_snapshots") or state.get("competitor_snapshots") or []
    if snapshots:
        lines = ["Comparativo técnico (lead vs rivais):"]
        for s in snapshots[:3]:
            lines.append(
                f"- {s.get('name', 'Rival')}: SSL={s.get('hasSSL')} sec={s.get('securityScore')} "
                f"track={s.get('trackingCount')} qscore={s.get('qscore')}"
            )
        audit_block += "\n" + "\n".join(lines)
    strat_yaml = load_prompt("market_intel_strategist")
    strat_version = (strat_yaml or {}).get("version", "1.0.0")
    state.setdefault("prompt_versions", {})["strategist"] = strat_version
    system = strat_yaml.get("system", "") if strat_yaml else ""
    human = strat_yaml.get("human", "") if strat_yaml else ""
    if not system:
        system = "Estrategista B2B em Portugal. Cliente: {name}. Sem placeholders."
        human = "Pesquisa:\n{research}\n\nAuditoria:\n{audit}\n\nAlvo: {name}, {city}, {sector}"
    messages = [
        SystemMessage(content=system.replace("{name}", state["name"]).replace("{city}", state["city"]).replace("{sector}", state["sector"])),
        HumanMessage(
            content=human.replace("{rag_context}", "ver research_data/RAG")
            .replace("{research}", state.get("research_data", ""))
            .replace("{name}", state["name"])
            .replace("{website}", state.get("website") or "N/A")
            .replace("{city}", state["city"])
            .replace("{sector}", state["sector"])
            + f"\n\nAuditoria técnica:\n{audit_block}\n\n"
            + "Responda com gaps (lacunas), sales_hook e evidence (factos verificáveis). Sem placeholders."
        ),
    ]
    resp_raw = None
    try:
        structured = llm.with_structured_output(StrategyBrief)
        brief: StrategyBrief = await structured.ainvoke(messages)
        state["strategy_insights"] = json.dumps(brief.model_dump(), ensure_ascii=False)
        append_telemetry(
            state, "Strategist", started, model_name,
            output_text=state["strategy_insights"],
            prompt_version=strat_version,
        )
    except Exception as struct_err:
        log.warning("Structured strategist failed: %s", struct_err)
        resp_raw = await llm.ainvoke(messages)
        state["strategy_insights"] = resp_raw.content
        append_telemetry(
            state, "Strategist", started, model_name,
            output_text=state["strategy_insights"],
            prompt_version=strat_version,
            resp=resp_raw,
        )
    return state


async def _node_synthesizer(state: IntelState, llm: ChatGroq) -> IntelState:
    started = time.time()
    model_name = getattr(llm, "model_name", None) or "llama-3.3-70b-versatile"
    synth_yaml = load_prompt("market_intel_synthesizer")
    synth_version = (synth_yaml or {}).get("version", "1.0.0")
    state.setdefault("prompt_versions", {})["synthesizer"] = synth_version
    system = (synth_yaml or {}).get("system", "Synthesizer Alygen PT-PT. Máx. 4 frases.")
    human = (synth_yaml or {}).get("human", "Insights:\n{strategy}")
    critic_note = ""
    if state.get("critic_reason") and state.get("critic_reason") != "ok":
        critic_note = (
            f"\n\nO veredicto anterior foi rejeitado pelo Critic: {state['critic_reason']}. "
            "Corrija sem placeholders, PT-PT, máx. 4 frases."
        )
    messages = [
        SystemMessage(content=system.replace("{name}", state["name"])),
        HumanMessage(
            content=human.replace("{strategy}", _wrap_untrusted(state.get("strategy_insights", "")))
            + "\n\nFormato: verdict (PT-PT, máx. 4 frases) e competitors_mentioned."
            + critic_note
        ),
    ]
    resp_raw = None
    try:
        structured = llm.with_structured_output(VerdictOutput)
        verdict: VerdictOutput = await structured.ainvoke(messages)
        state["intel"] = verdict.verdict.strip()
        if verdict.competitors_mentioned:
            state["competitors"] = verdict.competitors_mentioned[:3]
        append_telemetry(
            state, "Synthesizer", started, model_name,
            output_text=state["intel"],
            prompt_version=synth_version,
        )
    except Exception as struct_err:
        log.warning("Structured synthesizer failed: %s", struct_err)
        resp_raw = await llm.ainvoke(messages)
        state["intel"] = (resp_raw.content or "").strip()
        append_telemetry(
            state, "Synthesizer", started, model_name,
            output_text=state["intel"],
            prompt_version=synth_version,
            resp=resp_raw,
        )
    return state


async def _node_critic(state: IntelState) -> IntelState:
    started = time.time()
    ok, reason = _critic_pass(state.get("intel", ""))
    state["critic_ok"] = ok
    state["critic_reason"] = reason if not ok else "ok"
    if not ok:
        log.info("Critic rejected: %s", reason)
    append_telemetry(
        state,
        "Critic",
        started,
        "deterministic",
        output_text=f"ok={ok}; reason={reason}",
        prompt_version="1.0.0",
        degraded=not ok,
    )
    return state


def _route_after_critic(state: IntelState) -> str:
    if state.get("critic_ok"):
        return "end"
    if (state.get("rewrite_count") or 0) >= 1:
        return "end"
    return "rewrite"


async def _node_rewrite_bump(state: IntelState) -> IntelState:
    state["rewrite_count"] = (state.get("rewrite_count") or 0) + 1
    return state


def _build_graph(llm: ChatGroq):
    graph = StateGraph(IntelState)

    async def researcher(s):
        return await _node_researcher(s)

    async def strategist(s):
        return await _node_strategist(s, llm)

    async def synthesizer(s):
        return await _node_synthesizer(s, llm)

    graph.add_node("researcher", researcher)
    graph.add_node("strategist", strategist)
    graph.add_node("synthesizer", synthesizer)
    graph.add_node("critic", _node_critic)
    graph.add_node("rewrite_bump", _node_rewrite_bump)

    graph.set_entry_point("researcher")
    graph.add_edge("researcher", "strategist")
    graph.add_edge("strategist", "synthesizer")
    graph.add_edge("synthesizer", "critic")
    graph.add_conditional_edges("critic", _route_after_critic, {"end": END, "rewrite": "rewrite_bump"})
    graph.add_edge("rewrite_bump", "synthesizer")
    return graph.compile()


async def run_market_intel_graph(
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
    from services.groq_keys import has_groq_keys

    if not has_groq_keys():
        return run_graceful_fallback(name, city, sector)

    try:
        llm = _build_llm()
        app = _build_graph(llm)
        graph_trace = trace_id or str(uuid.uuid4())
        initial: IntelState = {
            "name": name,
            "city": city,
            "sector": sector,
            "website": website,
            "internal_competitors": internal_competitors or [],
            "audit_context": audit_context,
            "rewrite_count": 0,
            "degraded": False,
            "model": "llama-3.3-70b-versatile",
            "telemetry": [],
            "trace_id": graph_trace,
            "prompt_versions": {},
            "semantic_context": semantic_context or "",
            "competitor_snapshots": competitor_snapshots or [],
            "critic_reason": None,
        }
        final = await app.ainvoke(initial)
        degraded = not final.get("critic_ok", True)
        return {
            "success": True,
            "intel": final.get("intel", ""),
            "competitors": final.get("competitors") or [],
            "agents_involved": ["Researcher", "Strategist", "Synthesizer", "Critic"],
            "model": final.get("model", "llama-3.3-70b-versatile"),
            "degraded": degraded,
            "trace_id": final.get("trace_id", graph_trace),
            "telemetry": final.get("telemetry") or [],
            "strategy_structured": final.get("strategy_insights"),
        }
    except Exception as e:
        log.error("Agent graph failed: %s", e)
        return run_graceful_fallback(name, city, sector)

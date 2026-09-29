"""Extrator + qualificador de auditoria (LLM estruturado, PT-PT)."""
import json
import logging
from typing import Any, Dict, List, Optional

from langchain_core.messages import HumanMessage, SystemMessage
from pydantic import BaseModel, Field

from services.llm_gateway import LlmGateway
from services.stealth_scraper import deep_scrape_website

log = logging.getLogger("alygen-python")

SYSTEM_PT = """És auditor sénior Alygen (PT-PT). Analisa dados técnicos reais.
NUNCA inventes métricas: se um valor for null ou "missing", diz "não medido".
Prioriza defeitos com impacto comercial. Sem placeholders tipo [EMPRESA]."""


class DefectItem(BaseModel):
    code: str = Field(description="slug curto ex: perf_mobile, no_ssl")
    title: str = Field(max_length=120)
    severity: str = Field(description="critical|high|medium|low")
    evidence: str = Field(max_length=400)


class AuditEnrichResult(BaseModel):
    business_type: str = Field(max_length=120)
    tone_pt: str = Field(max_length=80)
    top_defects: List[DefectItem] = Field(default_factory=list, max_length=5)
    commercial_gaps: List[str] = Field(default_factory=list, max_length=5)
    suggested_priority: str = Field(description="CRITICAL|HIGH|MEDIUM|LOW")
    email_hook: str = Field(max_length=500, description="1-2 frases para abrir email")
    qualification_summary: str = Field(max_length=800)


def _build_user_prompt(payload: Dict[str, Any]) -> str:
    metrics = payload.get("metrics") or {}
    dq = payload.get("data_quality") or {}
    snippet = (payload.get("html_snippet") or "")[:3500]
    return f"""Website: {payload.get('website')}
Empresa: {payload.get('name')}
Setor/Cidade: {payload.get('sector')} / {payload.get('city')}

data_quality: {json.dumps(dq, ensure_ascii=False)}
métricas: {json.dumps(metrics, ensure_ascii=False)}
Q-Score: {payload.get('qscore')} (confidence {payload.get('confidence')})

Excerto HTML:
<untrusted>
{snippet}
</untrusted>

Devolve defeitos verificáveis ligados aos dados acima."""


async def run_audit_enrich(
    payload: Dict[str, Any],
    recover_scrape: bool = False,
) -> Dict[str, Any]:
    recovery: Dict[str, Any] = {"attempted": False, "success": False, "emails": [], "phones": []}
    html_snippet = payload.get("html_snippet") or ""

    if recover_scrape and len(html_snippet.strip()) < 200:
        recovery["attempted"] = True
        url = payload.get("website") or ""
        if url:
            try:
                scraped = await deep_scrape_website(url, use_cache=True)
                if scraped.get("success"):
                    recovery["success"] = True
                    recovery["emails"] = scraped.get("emails") or []
                    recovery["phones"] = scraped.get("phones") or []
                    extra = scraped.get("text") or scraped.get("html") or ""
                    if extra:
                        html_snippet = (html_snippet + "\n" + str(extra))[:4000]
                        payload = {**payload, "html_snippet": html_snippet}
            except Exception as err:
                log.warning("audit_enrich recovery scrape failed: %s", err)

    try:
        gw = LlmGateway(purpose="reasoning")
        structured = gw.llm.with_structured_output(AuditEnrichResult)
        messages = [
            SystemMessage(content=SYSTEM_PT),
            HumanMessage(content=_build_user_prompt(payload)),
        ]
        result: AuditEnrichResult = await structured.ainvoke(messages)
        return {
            "success": True,
            "enrichment": result.model_dump(),
            "recovery": recovery,
            "usage": gw.last_usage,
        }
    except Exception as struct_err:
        log.warning("Structured audit_enrich failed: %s", struct_err)
        try:
            gw = LlmGateway(purpose="reasoning")
            text = await gw.ainvoke([
                SystemMessage(content=SYSTEM_PT + " Responda JSON válido."),
                HumanMessage(content=_build_user_prompt(payload)),
            ])
            parsed = json.loads(text[text.find("{") : text.rfind("}") + 1])
            return {
                "success": True,
                "enrichment": parsed,
                "recovery": recovery,
                "usage": gw.last_usage,
                "degraded": True,
            }
        except Exception as fallback_err:
            log.error("audit_enrich failed: %s", fallback_err)
            return {
                "success": False,
                "error": str(fallback_err),
                "recovery": recovery,
            }

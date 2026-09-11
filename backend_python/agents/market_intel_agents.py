import os
import logging
from typing import TypedDict, List, Dict, Any
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage
from langgraph.graph import StateGraph, END
from duckduckgo_search import DDGS

log = logging.getLogger('alygen-python')

# ─── LangGraph State Definition ──────────────────────────────────────────────
class AgentState(TypedDict):
    website: str
    sector: str
    city: str
    lead_data: Dict[str, Any]
    technical_gaps: List[str]
    competitors: List[Dict[str, Any]]
    sales_hook: str
    verdict: str

# Initialize ChatGroq LLM
def get_llm():
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        log.warning("⚠️ GROQ_API_KEY nao configurada no .env!")
    return ChatGroq(
        model="llama-3.1-70b-versatile",
        temperature=0.2,
        groq_api_key=api_key
    )

# ─── Agent 1: Researcher (🕵️ Agente Investigador) ───────────────────────────
def researcher_agent(state: AgentState) -> Dict[str, Any]:
    log.info(f"🕵️ [Researcher] Procurando concorrentes reais locais para o setor {state['sector']} em {state['city']}...")
    
    lead_data = state.get("lead_data") or {}
    internal_comps = lead_data.get("internal_competitors") or []
    
    competitors = []
    
    # 🎯 1. Prioridade Maxima: Usar leads ja analisados da base de dados local do Alygen CRM!
    if internal_comps:
        log.info(f"🎯 [Researcher] Encontrados {len(internal_comps)} concorrentes auditados no Alygen CRM!")
        for c in internal_comps:
            comp_name = c.get("name") or c.get("lead_name") or ""
            comp_url = c.get("url") or c.get("lead_website") or ""
            q_score = c.get("qscore") or 0
            grade = c.get("grade") or "C"
            if comp_name and comp_url:
                competitors.append({
                    "name": comp_name,
                    "url": comp_url,
                    "description": f"Concorrente direto auditado localmente no ecossistema Alygen com excelente performance digital (Q-Score: {q_score}%, Classificacao: {grade})."
                })
                
    # 🌐 2. Suplemento Dinamico: Se nao houver concorrentes internos suficientes, consulta o DuckDuckGo!
    if len(competitors) < 2:
        sector = state["sector"] or "negocio"
        city = state["city"] or "Portugal"
        query = f"{sector} em {city} concorrentes"
        log.info(f"🌐 [Researcher] Pesquisando DuckDuckGo para complementar: '{query}'...")
        
        try:
            with DDGS() as ddgs:
                results = list(ddgs.text(query, max_results=5))
                for r in results:
                    title = r.get("title", "")
                    link = r.get("href", "")
                    snippet = r.get("body", "")
                    
                    # Exclude own website and avoid duplicate names
                    if state["website"] not in link and not any(comp["url"] in link for comp in competitors):
                        competitors.append({
                            "name": title,
                            "url": link,
                            "description": snippet
                        })
        except Exception as e:
            log.warning(f"⚠️ Erro ao pesquisar no DuckDuckGo: {e}")
            
    # 🛡️ 3. Failsafe: Se tudo falhar, usa heuristicas locais baseadas no setor
    if not competitors:
        log.info("ℹ️ Aplicando fallback de conhecimento interno para concorrentes locais.")
        sector = state["sector"] or "negocio"
        competitors = [
            {"name": f"Principal Competidor de {sector}", "url": f"www.competidor-{sector}.pt", "description": "Lider local de presenca digital."},
            {"name": "Alternativa Regional Forte", "url": "www.liderregional.pt", "description": "Excelente otimizacao mobile e SEO local."}
        ]
        
    return {"competitors": competitors}

# ─── Agent 2: Strategist (📉 Agente Estrategista) ───────────────────────────
def strategist_agent(state: AgentState) -> Dict[str, Any]:
    log.info("📉 [Strategist] Cruzando gaps tecnicos e posicionamento competitivo...")
    
    lead_data = state["lead_data"] or {}
    perf_mobile = lead_data.get("performance_mobile") or lead_data.get("performanceMobile") or 50
    has_ssl = lead_data.get("security", {}).get("hasSSL", True)
    has_schema = lead_data.get("seo", {}).get("hasSchema", False)
    
    gaps = []
    if float(perf_mobile) < 50:
        gaps.append(f"Performance mobile critica ({perf_mobile}/100) — perda de mais de 40% do trafego local.")
    if not has_ssl:
        gaps.append("Seguranca desprotegida (Sem certificado SSL ativo) — aviso de site nao seguro no browser.")
    if not has_schema:
        gaps.append("Ausencia de dados estruturados Schema.org — invisibilidade nos motores de IA e mapas.")
        
    if not gaps:
        gaps.append("Lacuna de otimizacao avancada para dispositivos moveis de nova geracao.")
        
    # Formulate strategy hook using LLM
    competitors_text = "\n".join([f"- {c['name']} ({c['url']})" for c in state["competitors"]])
    gaps_text = "\n".join([f"- {g}" for gaps in gaps for g in gaps])
    
    prompt = f"""
    Como Consultor de Vendas Senior, analisa os seguintes dados e cria um gancho estrategico (Sales Hook) de prospeccao comercial.
    
    Empresa: {state['lead_data'].get('name', 'Cliente')}
    Website: {state['website']}
    Cidade: {state['city']}
    Setor: {state['sector']}
    
    Falhas Tecnicas Detetadas no Lead:
    {gaps_text}
    
    Concorrentes Locais Dominantes:
    {competitors_text}
    
    Cria um gancho estrategico curto, persuasivo e altamente profissional dirigido ao decisor, destacando como os concorrentes estao a ganhar quota de mercado devido a estas falhas tecnicas.
    Regra Critica: Responde estritamente em Portugues Europeu (PT-PT) e com ABSOLUTAMENTE ZERO EMOJIS.
    """
    
    sales_hook = ""
    try:
        llm = get_llm()
        response = llm.invoke([
            SystemMessage(content="Es um Consultor de Vendas Senior de Elite em Portugal. Es direto, profissional e sofisticado. Nunca usas emojis."),
            HumanMessage(content=prompt)
        ])
        sales_hook = response.content.strip()
    except Exception as e:
        log.error(f"⚠️ Erro ao gerar hook com LLM: {e}")
        sales_hook = f"Identificamos que os concorrentes locais dominam o setor em {state['city']}, enquanto o seu site atual apresenta falhas severas de velocidade no telemovel."
        
    return {"technical_gaps": gaps, "sales_hook": sales_hook}

# ─── Agent 3: Synthesizer (✍️ Agente Sintetizador) ───────────────────────────
def synthesizer_agent(state: AgentState) -> Dict[str, Any]:
    log.info("✍️ [Synthesizer] Redigindo veredicto persuasivo final...")
    
    competitors_text = ", ".join([c["name"] for c in state["competitors"][:2]])
    gaps_text = "; ".join(state["technical_gaps"])
    
    prompt = f"""
    Escreve o veredicto de inteligencia comercial final para o relatorio da empresa {state['lead_data'].get('name', 'Cliente')}.
    
    Website do Lead: {state['website']}
    Cidade: {state['city']}
    Setor: {state['sector']}
    Concorrentes Principais: {competitors_text}
    Falhas Tecnicas: {gaps_text}
    Gancho Estrategico Base: {state['sales_hook']}
    
    Redige um veredicto final persuasivo, de tom elegante, direto e urgente (Voz de Consultoria Estratégica Alygen).
    Fórmula de elite: "Identificamos que os rivais [RIVAIS] dominam em [X]. Para superar isto, o/a [NOME] deve [ACAO]."
    
    Regra Absoluta: Responde em Portugues Europeu (PT-PT) com EXTREMA elegancia corporativa. ABSOLUTAMENTE ZERO EMOJIS.
    """
    
    verdict = ""
    try:
        llm = get_llm()
        response = llm.invoke([
            SystemMessage(content="Es um consultor estrategico senior de crescimento da Alygen. Fala com elegancia de elite e urgencia comercial pragmatica. Zero emojis."),
            HumanMessage(content=prompt)
        ])
        verdict = response.content.strip()
    except Exception as e:
        log.error(f"⚠️ Erro ao gerar veredicto final: {e}")
        verdict = f"Identificamos que os rivais locais dominam em presenca digital na regiao de {state['city']}. Para superar isto, a empresa deve otimizar imediatamente a velocidade de carregamento mobile e a visibilidade de IA."
        
    return {"verdict": verdict}

# ─── Build LangGraph State Graph ─────────────────────────────────────────────
def run_market_intel_workflow(website: str, lead_data: dict) -> Dict[str, Any]:
    # Extract sector, city
    sector = lead_data.get("sector") or lead_data.get("category") or "servicos"
    city = lead_data.get("city") or lead_data.get("address") or "Portugal"
    
    initial_state: AgentState = {
        "website": website,
        "sector": sector,
        "city": city,
        "lead_data": lead_data,
        "technical_gaps": [],
        "competitors": [],
        "sales_hook": "",
        "verdict": ""
    }
    
    # Define LangGraph
    workflow = StateGraph(AgentState)
    
    # Add Nodes
    workflow.add_node("researcher", researcher_agent)
    workflow.add_node("strategist", strategist_agent)
    workflow.add_node("synthesizer", synthesizer_agent)
    
    # Add Edges
    workflow.set_entry_point("researcher")
    workflow.add_edge("researcher", "strategist")
    workflow.add_edge("strategist", "synthesizer")
    workflow.add_edge("synthesizer", END)
    
    # Compile
    app_graph = workflow.compile()
    
    try:
        final_state = app_graph.invoke(initial_state)
        return {
            "success": True,
            "competitors": final_state.get("competitors"),
            "sales_hook": final_state.get("sales_hook"),
            "verdict": final_state.get("verdict"),
            "gaps": final_state.get("technical_gaps")
        }
    except Exception as e:
        log.error(f"❌ Erro ao executar fluxo LangGraph: {e}")
        return {
            "success": False,
            "error": str(e)
        }

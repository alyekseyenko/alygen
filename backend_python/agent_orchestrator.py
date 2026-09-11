#!/usr/bin/env python3
"""
🧠 Alygen CRM — Multi-Agent AI Orchestrator (v2026)
Empowers the 'Custom Search' with lethal market intelligence using a 
Multi-Agent workflow: Researcher -> Strategist -> Synthesizer.
"""

import os
import logging
import asyncio
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

# Configuração de Logging
log = logging.getLogger('alygen-python')

class AgentResult(BaseModel):
    success: bool
    intel: Optional[str] = None
    competitors: List[str] = []
    reasoning_path: List[str] = []

async def run_multitask_intel(
    name: str,
    city: str,
    sector: str,
    website: Optional[str] = None
) -> Dict[str, Any]:
    """
    Orquestrador Multi-Agente Assíncrono.
    Executa 3 agentes em cadeia para análise profunda.
    """
    try:
        from langchain_groq import ChatGroq
        from langchain_community.tools import DuckDuckGoSearchRun
        from langchain_core.prompts import ChatPromptTemplate
        
        groq_key = os.environ.get('GROQ_API_KEY', '')
        if not groq_key:
            return {"success": False, "error": "GROQ_API_KEY missing"}

        llm = ChatGroq(
            api_key=groq_key,
            model="llama-3.3-70b-versatile", # Usamos o modelo maior para a orquestração
            temperature=0.3
        )
        
        search = DuckDuckGoSearchRun()

        # --- 🕵️ AGENTE 1: INVESTIGADOR (Research) ---
        log.info(f"🕵️ Agente Investigador: Pesquisando rivais para {name} em {city}...")
        
        # Refinamento de busca: excluir o próprio nome e site dos resultados de "concorrentes"
        search_query = f"principais empresas concorrentes diretos {sector} em {city} portugal -site:{website or ''} -\"{name}\""
        research_data = await asyncio.to_thread(search.run, search_query)
        
        # --- 📉 AGENTE 2: ESTRATEGISTA (Strategy) ---
        log.info("📉 Agente Estrategista: Analisando fraquezas e oportunidades...")
        strategy_prompt = ChatPromptTemplate.from_messages([
            ("system", """Você é um Estrategista de Vendas B2B Sénior em Portugal. 
            Sua missão é analisar dados de rivais e encontrar brechas para a empresa {name}.
            REGRAS CRÍTICAS:
            1. NUNCA use nomes genéricos como 'Test Company', 'Empresa Alvo' ou 'Cliente'.
            2. Refira-se à empresa sempre pelo nome real: {name}. Se o nome parecer um domínio (ex: site.com), use uma versão elegante.
            3. Identifique 2-3 rivais REAIS baseados na pesquisa. Se a pesquisa mencionar {name}, IGNORE-A como concorrente, ela é o nosso CLIENTE.
            4. Se não encontrar rivais específicos na pesquisa, fale de 'grandes players do setor {sector}' de forma credível."""),
            ("human", "Dados da Pesquisa:\n{research}\n\nEmpresa Alvo: {name}\nWebsite: {website}\nCidade: {city}")
        ])
        strategy_chain = strategy_prompt | llm
        strategy_resp = await strategy_chain.ainvoke({
            "research": research_data,
            "name": name,
            "website": website or "N/A",
            "city": city,
            "sector": sector
        })
        strategy_insights = strategy_resp.content

        # --- ✍️ AGENTE 3: SINTETIZADOR (Copywriter) ---
        log.info("✍️ Agente Sintetizador: Gerando veredicto final humanizado...")
        synth_prompt = ChatPromptTemplate.from_messages([
            ("system", """Você é o Synthesizer da Alygen. Transforme análises complexas em um parágrafo humano e persuasivo em Português Europeu.
            REGRAS:
            1. NUNCA mencione que é uma IA. Use tom de consultor sénior.
            2. Formate como: 'Identificámos que [RIVAL A] e [RIVAL B] dominam em [X]. Para superar isto, o/a {name} deve [AÇÃO].'
            3. Seja extremamente direto e focado em conversão.
            4. Se o nome {name} for o próprio Humberto Conde, trate-o com o respeito de um especialista do setor.
            5. Máximo de 4 frases."""),
            ("human", "Insights Estratégicos:\n{strategy}")
        ])
        synth_chain = synth_prompt | llm
        final_resp = await synth_chain.ainvoke({"strategy": strategy_insights, "name": name})
        
        final_text = final_resp.content.strip()

        return {
            "success": True,
            "intel": final_text,
            "agents_involved": ["Researcher", "Strategist", "Synthesizer"],
            "model": "llama-3.1-70b"
        }

    except Exception as e:
        log.error(f"❌ Error in Multi-Agent Orchestrator: {e}")
        return {"success": False, "error": str(e)}

# Teste rápido se executado diretamente
if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv("backend/.env")
    
    async def test():
        res = await run_multitask_intel("Clínica São Rafael", "Faro", "Saúde")
        if res.get('success'):
            print(f"RESULTADO MULTI-AGENTE:\n{res['intel']}")
        else:
            print(f"ERRO: {res.get('error')}")
        
    asyncio.run(test())

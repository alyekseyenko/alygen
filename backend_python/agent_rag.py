#!/usr/bin/env python3
"""
🧠 Alygen CRM — LangChain Market Intelligence Agent
Porta: 3002 (/agent/market-intel)

Este módulo usa LangChain + DuckDuckGo + Groq LLaMA-3 para criar um agente
autónomo que pesquisa concorrentes e gera insights estratégicos de mercado.
"""

import os
import logging
from typing import Optional

log = logging.getLogger('alygen-python')

def run_market_intel(
    name: str,
    city: str,
    sector: str,
    website: Optional[str] = None
) -> dict:
    """
    Executa o Agente de Inteligência de Mercado usando LangChain + Groq.
    
    Args:
        name: Nome do cliente/empresa
        city: Cidade do cliente
        sector: Setor de negócio
        website: Website do cliente (opcional, para contexto)
    
    Returns:
        dict com 'intel' (string de insights) e 'competitors' (lista)
    """
    try:
        from langchain_groq import ChatGroq
        from langchain.agents import create_agent
        from langchain_core.prompts import ChatPromptTemplate
        from langchain_community.tools import DuckDuckGoSearchRun

        groq_key = os.environ.get('GROQ_API_KEY', '')
        if not groq_key:
            return {
                'success': False,
                'error': 'GROQ_API_KEY não configurada',
                'intel': None
            }

        # ── 1. LLM: Groq Llama-3.1-8B-Instant (Ultra-rápido e resiliente) ─────
        llm = ChatGroq(
            api_key=groq_key,
            model="llama-3.3-70b-versatile",
            temperature=0.5,
            max_tokens=1000
        )

        # ── 2. Tools: DuckDuckGo Search (sem API Key necessária) ────────────────
        search_tool = DuckDuckGoSearchRun(
            name="web_search",
            description="Pesquisa no Google/DuckDuckGo. Use para encontrar concorrentes e tendências de mercado."
        )
        tools = [search_tool]

        # ── 3. Prompt: Analista Estratégico Sénior ──────────────────────────────
        system_prompt = """Você é um Analista Estratégico de Mercado Sénior da Alygen, especializado no mercado português.
O seu objetivo é realizar um "Deep Dive" digital nos concorrentes de uma empresa e entregar inteligência estratégica acionável.

Instruções Cruciais:
1. IDENTIDADE: Você age como um consultor humano sénior. NUNCA mencione que é um modelo de IA, agente, LangChain ou ferramenta automatizada.
2. PESQUISA: Identifique 2-3 concorrentes REAIS e DIRETOS na mesma cidade ou região do cliente.
3. ANÁLISE: Foque no que eles estão a fazer MELHOR digitalmente:
   - Experiência do Utilizador (UX) e Modernidade do site.
   - Estratégias de Conversão (CTAs, formulários, WhatsApp).
   - Presença em Google Ads ou Redes Sociais se detetável.
   - Comparativo de percepção de valor/preço se aplicável ao setor.
4. OUTCOME: Gere um parágrafo conciso, elegante e impactante em Português Europeu (PT-PT).
   - Comece diretamente com os factos encontrados.
   - Use um tom urgente mas altamente profissional.
   - A resposta DEVE ser um parágrafo único, pronto para ser lido pelo cliente final num relatório de elite.

Exemplo de Tom:
"Identificámos que em Lisboa, concorrentes como [Nome A] e [Nome B] estão a dominar o setor digital com layouts de alta fidelidade e CTAs de conversão imediata para WhatsApp. Para recuperar terreno, a [Nome do Cliente] precisa de atualizar a sua infraestrutura técnica nos próximos 6 meses, focando-se na autoridade orgânica e na redução do gap de preço percebido, que atualmente é cerca de 10% superior à média do mercado local."
"""

        # ── 4. Agente: StateGraph Agent (LangChain 1.x Standard) ────────────────
        try:
            log.info(f"🧠 LangChain 1.x Agent iniciado para: {name} ({city}, {sector})")
            
            # Criar o agente (que é um Grafo)
            agent_graph = create_agent(
                model=llm,
                tools=tools,
                system_prompt=system_prompt,
                debug=False
            )

            # Executar o grafo
            human_message = f"Analisa os concorrentes desta empresa: Nome: {name}, Cidade: {city}, Setor: {sector}, Website: {website or 'não especificado'}. Pesquisa os principais rivais e gera o insight estratégico."
            inputs = {"messages": [{"role": "user", "content": human_message}]}
            
            final_state = agent_graph.invoke(inputs)
            
            # Extrair a resposta final (última mensagem do modelo)
            messages = final_state.get("messages", [])
            intel_text = messages[-1].content.strip() if messages else ""
            agent_type = 'langchain-1.x-graph'

        except Exception as search_err:
            log.warning(f"⚠️ Erro no Agente (Graph), usando fallback: {search_err}")
            fallback_prompt = ChatPromptTemplate.from_messages([
                ("system", system_prompt),
                ("human", "Analisa os concorrentes: {name}, {city}, {sector}, {website}")
            ])
            fallback_chain = fallback_prompt | llm
            response = fallback_chain.invoke({
                "name": name, "city": city, "sector": sector, "website": website or "não especificado"
            })
            intel_text = response.content.strip()
            agent_type = 'langchain-resilient-fallback'

        if not intel_text:
            return {
                'success': False,
                'error': 'Agente não gerou resposta',
                'intel': None
            }

        log.info(f"✅ Intel gerado para {name}: {intel_text[:80]}...")
        
        return {
            'success': True,
            'intel': intel_text,
            'model': 'llama-3.3-70b-versatile',
            'agent': agent_type
        }


    except ImportError as ie:
        log.error(f"❌ LangChain não instalado: {ie}")
        return {
            'success': False,
            'error': f'LangChain não instalado. Execute: pip install langchain langchain-groq duckduckgo-search. Detalhe: {str(ie)}',
            'intel': None
        }
    except Exception as e:
        log.error(f"❌ Erro no Market Intel Agent: {e}")
        return {
            'success': False,
            'error': str(e),
            'intel': None
        }

from flask import Blueprint, request, jsonify
import logging
from agents.market_intel_agents import run_market_intel_workflow

log = logging.getLogger('alygen-python')
agent_bp = Blueprint('agent', __name__)

@agent_bp.route('/agent/market-intel', methods=['POST'])
def market_intel():
    """
    Executa o fluxo LangGraph de Inteligencia de Mercado (Investigador -> Estrategista -> Sintetizador).
    """
    try:
        data = request.json or {}
        
        # Flexibilidade absoluta para suportar chamadas estruturadas e flat
        website = data.get('website') or data.get('url') or ''
        lead_data = data.get('leadData') or {}
        
        if not lead_data:
            lead_data = {
                "name": data.get("name") or data.get("lead_name"),
                "city": data.get("city") or data.get("lead_city") or "Portugal",
                "sector": data.get("sector") or data.get("lead_type") or "serviços",
                "internal_competitors": data.get("internal_competitors") or []
            }
        else:
            if "internal_competitors" not in lead_data and "internal_competitors" in data:
                lead_data["internal_competitors"] = data.get("internal_competitors")

        # Fallback de validação de nome do lead
        name = lead_data.get("name") or lead_data.get("lead_name") or ""
        if not name:
            return jsonify({'success': False, 'error': 'O nome do lead ou empresa é obrigatório'}), 400
            
        result = run_market_intel_workflow(website, lead_data)
        return jsonify(result)
    except Exception as e:
        log.error(f"Erro no processamento multi-agente LangGraph: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

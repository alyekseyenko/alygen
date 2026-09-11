#!/usr/bin/env python3
"""
🐍 Alygen CRM — Technical & Conversion Scoring Service
Porta: 3005
Serviços: Q-Score calculation, Accessibility quick scan, Deep Conversion Audits
"""

import os
import sys
import math
import logging
import re
from flask import Flask, request, jsonify
from flask_cors import CORS
from bs4 import BeautifulSoup

# Adicionar directório raiz ao path para imports relativos funcionarem
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%H:%M:%S'
)
log = logging.getLogger('alygen-scoring-service')

app = Flask(__name__)
CORS(app)

# Carregar variáveis de ambiente (.env do backend)
try:
    from dotenv import load_dotenv
    _env_path = os.path.join(os.path.dirname(__file__), '..', '..', 'backend', '.env')
    load_dotenv(_env_path)
    log.info(f"✅ .env carregado: {os.path.abspath(_env_path)}")
except Exception as e:
    log.warning(f"⚠️ Nao foi possivel carregar .env: {e}")

from core.qscore import calculate_qscore as calculate_score_numpy

def analyze_deep_conversions(html: str, city: str, sector: str) -> dict:
    """
    Executa análises semânticas profundas de conversão baseadas em heurísticas avançadas.
    """
    if not html:
        return {
            'click_to_call': False,
            'testimonials_detected': False,
            'gdpr_compliant': False,
            'local_semantic_density': False,
            'details': {}
        }

    soup = BeautifulSoup(html, 'html.parser')
    html_lower = html.lower()
    text_lower = soup.get_text().lower()

    # 1. Click-to-Call / Contactabilidade
    has_tel = bool(soup.find('a', href=re.compile(r'^tel:')))
    has_mail = bool(soup.find('a', href=re.compile(r'^mailto:')))
    click_to_call = has_tel or has_mail

    # 2. Prova Social / Testemunhos
    testimonial_keywords = [
        'testemunho', 'testemunhos', 'comentários', 'comentário',
        'avaliações', 'depoimentos', 'reviews', 'clientes dizem', 'opiniões'
    ]
    testimonials_detected = any(k in text_lower for k in testimonial_keywords)

    # 3. RGPD / Cookies Compliance
    cookie_keywords = [
        'cookies', 'privacidade', 'rgpd', 'consentimento', 'politica',
        'cookiebot', 'cookie-consent', 'cookielaw'
    ]
    gdpr_compliant = any(k in html_lower for k in cookie_keywords)

    # 4. Densidade Semântica Local (Cidade nos cabeçalhos)
    local_semantic_density = False
    city_clean = (city or '').lower().strip()
    if city_clean and city_clean != 'portugal' and city_clean != 'negócios':
        headings = [h.get_text().lower() for h in soup.find_all(['h1', 'h2', 'h3'])]
        local_semantic_density = any(city_clean in h for h in headings)

    return {
        'click_to_call': click_to_call,
        'testimonials_detected': testimonials_detected,
        'gdpr_compliant': gdpr_compliant,
        'local_semantic_density': local_semantic_density,
        'details': {
            'has_tel_href': has_tel,
            'has_mailto_href': has_mail,
            'city_searched': city
        }
    }

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'ok',
        'service': 'alygen-scoring-service'
    })

@app.route('/score/single', methods=['POST'])
def score_single():
    try:
        body = request.get_json(silent=True) or {}
        analysis  = body.get('analysis', {})
        lead_data = body.get('leadData', {})
        all_leads = body.get('allLeads', [])

        # Correr cálculo base NumPy
        result = calculate_score_numpy(analysis, lead_data, all_leads)

        # Se houver HTML disponível, injetar novas auditorias profundas
        html_content = body.get('html') or analysis.get('html', '')
        city = lead_data.get('city') or lead_data.get('lead_city') or 'Portugal'
        sector = lead_data.get('type') or lead_data.get('lead_type') or 'Serviços'
        
        deep_insights = analyze_deep_conversions(html_content, city, sector)
        result['deep_conversions'] = deep_insights

        log.info(f"✅ Q-Score calculado para {lead_data.get('name', 'Empresa')}: {result['score']}/100")
        return jsonify({'success': True, 'qScore': result})
    except Exception as e:
        log.error(f'Erro no scoring: {e}')
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/score/bulk', methods=['POST'])
def score_bulk():
    try:
        body = request.get_json(silent=True) or {}
        leads = body if isinstance(body, list) else body.get('leads', [])
        all_leads = body.get('allLeads', []) if isinstance(body, dict) else []

        results = []
        for item in leads:
            analysis  = item.get('analysis', item)
            lead_data = item.get('leadData', {})
            results.append(calculate_score_numpy(analysis, lead_data, all_leads))

        return jsonify({'success': True, 'scores': results, 'count': len(results)})
    except Exception as e:
        log.error(f'Erro no bulk scoring: {e}')
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/accessibility/analyze', methods=['POST'])
def accessibility_analyze():
    try:
        body = request.get_json(silent=True) or {}
        html = body.get('html', '')
        
        if not html:
            return jsonify({'success': False, 'error': 'HTML é obrigatório'}), 400

        from core.accessibility import analyze_accessibility_fast
        result = analyze_accessibility_fast(html)
        return jsonify({'success': True, **result})
    except Exception as e:
        log.error(f'Erro na acessibilidade: {e}')
        return jsonify({'success': False, 'error': str(e)}), 500

if __name__ == '__main__':
    PORT = int(os.environ.get('SCORING_PORT', 3005))
    log.info(f'🐍 Alygen Scoring Service online na porta {PORT}')
    app.run(host='0.0.0.0', port=PORT, debug=False, threaded=True)

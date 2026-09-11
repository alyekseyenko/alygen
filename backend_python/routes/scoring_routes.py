from flask import Blueprint, request, jsonify
import logging
from core.qscore import calculate_qscore
from core.accessibility import analyze_accessibility_html

log = logging.getLogger('alygen-python')
scoring_bp = Blueprint('scoring', __name__)

@scoring_bp.route('/score', methods=['POST'])
def score_lead():
    """
    Calcula o Q-Score técnico para um lead.
    """
    try:
        data = request.json or {}
        analysis = data.get('analysis') or {}
        lead_data = data.get('leadData') or {}
        all_leads = data.get('allLeads') or []
        
        result = calculate_qscore(analysis, lead_data, all_leads)
        return jsonify(result)
    except Exception as e:
        log.error(f"Erro no calculo de Q-Score: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@scoring_bp.route('/accessibility/analyze', methods=['POST'])
def accessibility():
    """
    Audita a acessibilidade de um HTML.
    """
    try:
        data = request.json or {}
        html = data.get('html')
        url = data.get('url')
        if not html:
            return jsonify({'success': False, 'error': 'HTML em falta'}), 400
            
        result = analyze_accessibility_html(html)
        # Ensure we return a format matching what python-bridge expects
        return jsonify({
            'success': True,
            'score': result.get('score', 0.0),
            'errors': result.get('errors', 0),
            'warnings': result.get('warnings', 0),
            'issues': result.get('issues', []),
            'details': result.get('details', {})
        })
    except Exception as e:
        log.error(f"Erro na auditoria de acessibilidade: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

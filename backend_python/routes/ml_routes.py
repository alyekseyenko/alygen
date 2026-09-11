from flask import Blueprint, request, jsonify
import logging
import numpy as np
from core.ml_scoring import predict_closing_probability

log = logging.getLogger('alygen-python')
ml_bp = Blueprint('ml', __name__)

@ml_bp.route('/ml/predict', methods=['POST'])
def predict_closing():
    """
    Prediz a probabilidade de conversao / fecho de um lead.
    ---
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: array
          items:
            type: object
    """
    try:
        leads_list = request.json
        if not leads_list:
            return jsonify({'success': False, 'error': 'Lista de leads vazia'}), 400
            
        # Call the predictive modeling/adjustment function
        from microservices import predict_lead_quality
        result = predict_lead_quality(leads_list)
        return jsonify(result)
    except Exception as e:
        log.error(f"Erro na predicao ML: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

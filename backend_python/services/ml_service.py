#!/usr/bin/env python3
"""
🐍 Alygen CRM — Machine Learning Propensity Service
Porta: 3004
Serviços: ML Lead Closing Probability, Model Training
"""

import os
import sys
import logging
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS

# Adicionar directório raiz ao path para imports relativos funcionarem
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%H:%M:%S'
)
log = logging.getLogger('alygen-ml-service')

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

# Global variables
ML_MODEL = None
ML_SCALER = None
ML_FEATURES = None
ML_MODEL_PATH = os.path.join(os.path.dirname(__file__), '..', 'lead_model.pkl')

ML_FEATURE_NAMES = [
    'performance_mobile',
    'performance_desktop',
    'perf_gap',
    'seo_score',
    'seo_has_schema',
    'seo_has_sitemap',
    'security_score',
    'security_has_ssl',
    'accessibility_score',
    'tracking_total',
    'has_ga4',
    'has_facebook_pixel',
    'conversion_score',
    'content_score',
    'total_savings_kb',
]

def load_ml_model():
    global ML_MODEL, ML_SCALER, ML_FEATURES
    try:
        import joblib
        if os.path.exists(ML_MODEL_PATH):
            data = joblib.load(ML_MODEL_PATH)
            ML_MODEL = data['model']
            ML_SCALER = data['scaler']
            ML_FEATURES = data.get('features', ML_FEATURE_NAMES)
            log.info(f'✅ Modelo ML carregado com sucesso | {len(ML_FEATURES)} features')
            return True
        return False
    except Exception as e:
        log.warning(f'⚠️ Erro ao carregar modelo ML: {e}')
        return False

def generate_synthetic_dataset():
    rng = np.random.default_rng(seed=42)
    X, y = [], []
    for _ in range(600):
        X.append([
            rng.integers(30, 95), rng.integers(40, 98), rng.integers(5, 35),
            rng.integers(30, 95), rng.integers(0, 2), rng.integers(0, 2),
            rng.integers(35, 100), rng.integers(0, 2), rng.integers(40, 95),
            rng.integers(0, 6), rng.integers(0, 2), rng.integers(0, 2),
            rng.integers(30, 95), rng.integers(35, 90), rng.integers(50, 500)
        ])
        y.append(rng.choice([1, 0], p=[0.4, 0.6]))
    return np.array(X, dtype=np.float64), np.array(y, dtype=np.int32)

def train_synthetic_model():
    global ML_MODEL, ML_SCALER, ML_FEATURES
    try:
        import joblib
        from sklearn.ensemble import GradientBoostingClassifier
        from sklearn.preprocessing import StandardScaler
        from sklearn.model_selection import train_test_split

        X, y = generate_synthetic_dataset()
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)

        X_train, X_test, y_train, y_test = train_test_split(
            X_scaled, y, test_size=0.2, random_state=42, stratify=y
        )

        model = GradientBoostingClassifier(
            n_estimators=200, learning_rate=0.05, max_depth=4, random_state=42
        )
        model.fit(X_train, y_train)
        accuracy = model.score(X_test, y_test)

        joblib.dump({
            'model': model, 'scaler': scaler,
            'features': ML_FEATURE_NAMES, 'version': '3.0-modular-synthetic'
        }, ML_MODEL_PATH)

        ML_MODEL = model
        ML_SCALER = scaler
        ML_FEATURES = ML_FEATURE_NAMES
        log.info(f'✅ Novo modelo ML treinado e persistido com sucesso (Acurácia: {accuracy:.1%})')
        return accuracy
    except Exception as e:
        log.error(f'❌ Erro no treino ML sintético: {e}')
        return None

def extract_ml_features(analysis: dict) -> list:
    perf_m = float(analysis.get('performanceMobile') or analysis.get('performance_mobile') or 0)
    perf_d = float(analysis.get('performanceDesktop') or analysis.get('performance_desktop') or perf_m)
    seo = analysis.get('seo') or {}
    sec = analysis.get('security') or {}
    pixels = analysis.get('pixelDetails') or {}
    return [
        perf_m,
        perf_d,
        abs(perf_d - perf_m),
        float(seo.get('score') or 0),
        1 if seo.get('hasSchema') or seo.get('has_schema') else 0,
        1 if seo.get('hasSitemap') or seo.get('has_sitemap') else 0,
        float(sec.get('score') or 0),
        1 if sec.get('hasSSL') or sec.get('has_ssl', True) else 0,
        float((analysis.get('accessibility') or {}).get('score') or 50),
        float(pixels.get('totalTracking') or 0),
        1 if pixels.get('ga4Detected') else 0,
        1 if pixels.get('facebookPixelDetected') else 0,
        float((analysis.get('conversion') or {}).get('score') or 50),
        float((analysis.get('content') or {}).get('score') or 50),
        float((analysis.get('savings') or {}).get('totalSavingsKb') or 0),
    ]

# Tentar carregar o modelo imediatamente ao importar/iniciar
if not load_ml_model():
    log.info('🤖 Modelo não encontrado na inicialização. A treinar modelo sintético...')
    train_synthetic_model()

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'ok',
        'service': 'alygen-ml-service',
        'ml_ready': ML_MODEL is not None
    })

@app.route('/ml/train', methods=['POST'])
def ml_train():
    try:
        data = request.get_json(silent=True) or []
        if len(data) < 30:
            train_synthetic_model()
            return jsonify({
                'success': True, 'mode': 'synthetic_pt',
                'samples': 600, 'features': ML_FEATURE_NAMES
            })
        
        # Real training logic
        import pandas as pd
        from sklearn.ensemble import GradientBoostingClassifier
        from sklearn.preprocessing import StandardScaler
        import joblib

        df = pd.DataFrame(data)
        df['target'] = df['converted'].apply(lambda x: 1 if x else 0) if 'converted' in df.columns else 0
        X = np.array([extract_ml_features(row.to_dict()) for _, row in df.iterrows()])
        y = df['target'].values

        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)

        model = GradientBoostingClassifier(n_estimators=150, learning_rate=0.05, max_depth=4, random_state=42)
        model.fit(X_scaled, y)

        joblib.dump({
            'model': model, 'scaler': scaler,
            'features': ML_FEATURE_NAMES, 'version': f'3.0-modular-real-{len(data)}'
        }, ML_MODEL_PATH)

        global ML_MODEL, ML_SCALER, ML_FEATURES
        ML_MODEL = model
        ML_SCALER = scaler
        ML_FEATURES = ML_FEATURE_NAMES

        return jsonify({'success': True, 'mode': 'real_data', 'samples': len(data)})
    except Exception as e:
        log.error(f'Erro no treino ML real: {e}')
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/ml/predict', methods=['POST'])
def predict_closing():
    try:
        leads_list = request.json
        if not leads_list:
            return jsonify({'success': False, 'error': 'Lista de leads vazia'}), 400
        
        if ML_MODEL is None:
            return jsonify({'success': False, 'error': 'Modelo ML não está ativo'}), 500

        X = np.array([extract_ml_features(lead) for lead in leads_list])
        X_scaled = ML_SCALER.transform(X)
        raw_probs = ML_MODEL.predict_proba(X_scaled)
        
        probs = raw_probs[:, 1] if raw_probs.shape[1] == 2 else [1.0 if ML_MODEL.classes_[0] == 1 else 0.0] * len(X_scaled)

        results = []
        for i, p in enumerate(probs):
            lead_raw = leads_list[i]
            lead_data = lead_raw.get('leadData') or {}

            # 4-Pillar adjustments
            perf_m = lead_raw.get('performanceMobile') or lead_raw.get('performance_mobile') or 50
            has_ssl = lead_raw.get('security', {}).get('hasSSL', True) or lead_raw.get('security_has_ssl', 1)
            has_schema = lead_raw.get('seo', {}).get('hasSchema', False) or lead_raw.get('seo_has_schema', 0)
            
            pain_score = 0
            if float(perf_m) < 40: pain_score += 0.12
            if not has_ssl: pain_score += 0.08
            if not has_schema: pain_score += 0.05

            reviews_count = int(lead_data.get('reviews_count') or lead_raw.get('reviews_count') or 0)
            rating = float(lead_data.get('rating') or lead_raw.get('rating') or 0.0)
            vitality_score = 0.15 if (reviews_count >= 20 and rating >= 4.0) else (0.05 if reviews_count > 5 else 0.0)

            has_competitors = len(lead_raw.get('competitors') or lead_data.get('competitors') or []) > 0
            competitor_score = 0.10 if has_competitors else 0.0

            has_contact = bool(lead_data.get('email') or lead_data.get('phone') or lead_raw.get('extractedEmails'))
            contact_score = 0.08 if has_contact else 0.0

            adjusted_p = p + pain_score + vitality_score + competitor_score + contact_score
            adjusted_p = float(np.clip(adjusted_p, 0.05, 0.98))

            results.append({
                'conversion_probability': round(adjusted_p * 100, 1),
                'confidence': 'alta' if adjusted_p > 0.7 else ('media' if adjusted_p > 0.4 else 'baisa')
            })

        return jsonify({'success': True, 'predictions': results})
    except Exception as e:
        log.error(f'Erro na predicao: {e}')
        return jsonify({'success': False, 'error': str(e)}), 500

if __name__ == '__main__':
    PORT = int(os.environ.get('ML_PORT', 3004))
    log.info(f'🐍 Alygen ML Service online na porta {PORT}')
    app.run(host='0.0.0.0', port=PORT, debug=False, threaded=True)

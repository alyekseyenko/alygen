#!/usr/bin/env python3
"""
🐍 Alygen CRM — Python Microservices Gateway
Porta: 3002
Serviços: Scoring, Acessibilidade, ML Lead Scoring

Este microserviço é 100% opcional — o Node.js tem fallback automático
para os módulos JS originais se este servidor estiver offline.
"""

import os
import sys
import json
import math
import asyncio
import logging
import re
import time

# ─── Carregar variáveis de ambiente (.env do backend) ─────────────────────────
try:
    from dotenv import load_dotenv
    # O .env está na pasta ../backend/ relativa ao backend_python
    _env_path = os.path.join(os.path.dirname(__file__), '..', 'backend', '.env')
    load_dotenv(_env_path)
    print(f"[OK] .env carregado: {os.path.abspath(_env_path)}")
except Exception as _e:
    print(f"[AVISO] Nao foi possivel carregar .env: {_e}")
from flask import Flask, request, jsonify
from flask_cors import CORS
try:
    from flasgger import Swagger
    HAS_SWAGGER = True
except ImportError:
    HAS_SWAGGER = False
import numpy as np

# Playwright para SPA Scraping
try:
    from playwright.sync_api import sync_playwright
    PLAYWRIGHT_INSTALLED = True
except ImportError:
    PLAYWRIGHT_INSTALLED = False

# ─── Logging ─────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%H:%M:%S'
)
log = logging.getLogger('alygen-python')

app = Flask(__name__)
if HAS_SWAGGER:
    swagger = Swagger(app)
CORS(app)  # Permitir chamadas do Node.js

# ─── Constantes de Scoring ───────────────────────────────────────────────────
SECTOR_WEIGHTS = {
    'ecommerce': {
        'performance': 0.30, 'conversion': 0.25,
        'tracking': 0.20, 'seo': 0.15, 'security': 0.10
    },
    'b2b': {
        'seo': 0.30, 'security': 0.25,
        'tracking': 0.20, 'performance': 0.15, 'conversion': 0.10
    },
    'servicos': {
        'conversion': 0.30, 'seo': 0.25,
        'performance': 0.20, 'tracking': 0.15, 'security': 0.10
    },
    'restaurante': {
        'performance': 0.25, 'conversion': 0.30,
        'seo': 0.20, 'tracking': 0.15, 'security': 0.10
    },
    'saude': {
        'security': 0.30, 'conversion': 0.25,
        'seo': 0.20, 'performance': 0.15, 'tracking': 0.10
    },
    'default': {
        'performance': 0.25, 'seo': 0.20,
        'security': 0.15, 'conversion': 0.15,
        'tracking': 0.15, 'accessibility': 0.10
    }
}

GRADE_THRESHOLDS = [
    (90, 'A+'), (80, 'A'), (70, 'B'),
    (60, 'C'), (50, 'D'), (0, 'F')
]

PRIORITY_THRESHOLDS = [
    (75, 'LOW'), (55, 'MEDIUM'), (35, 'HIGH'), (0, 'CRITICAL')
]

# ─── Helpers ─────────────────────────────────────────────────────────────────
def to_grade(score: float) -> str:
    for threshold, grade in GRADE_THRESHOLDS:
        if score >= threshold:
            return grade
    return 'F'

def to_priority(score: float) -> str:
    for threshold, priority in PRIORITY_THRESHOLDS:
        if score >= threshold:
            return priority
    return 'CRITICAL'

def detect_sector(lead_data: dict, analysis: dict) -> str:
    type_str = (lead_data.get('type') or '').lower()
    website  = (lead_data.get('website') or '').lower()

    if any(k in type_str or k in website for k in ['loja', 'shop', 'store', 'ecommerce']):
        return 'ecommerce'

    if any(k in type_str for k in ['restaurante', 'café', 'cafe', 'bar', 'pastelaria', 'pizzaria']):
        return 'restaurante'

    if any(k in type_str for k in ['clínica', 'clinica', 'médico', 'medico', 'dentista', 'saúde', 'saude', 'farmácia']):
        return 'saude'

    if any(k in type_str for k in ['consultoria', 'agência', 'agencia', 'tecnologia', 'software', 'it ', 'b2b']):
        return 'b2b'

    if any(k in type_str for k in ['serviço', 'servico', 'reparação', 'instalação', 'manutenção']):
        return 'servicos'

    return 'default'

def calculate_score_numpy(analysis: dict, lead_data: dict = None, all_leads: list = None) -> dict:
    """
    Calcula Q-Score com NumPy e Benchmarking Competitivo (Senior Mode).
    """
    lead_data = lead_data or {}
    sector = detect_sector(lead_data, analysis)
    weights = SECTOR_WEIGHTS.get(sector, SECTOR_WEIGHTS['default'])

    # Normalizar métricas
    perf    = float(analysis.get('performanceMobile') or 0)
    seo     = float((analysis.get('seo') or {}).get('score') or 0)
    security= float((analysis.get('security') or {}).get('score') or 0)
    access  = float((analysis.get('accessibility') or {}).get('score') or 0)
    pixels  = float((analysis.get('pixelDetails') or {}).get('totalTracking') or 0)
    
    # Ranking bonus
    ranking_obj = analysis.get('googleRanking')
    if isinstance(ranking_obj, dict):
        ranking = ranking_obj.get('ranking', 'N/A')
    else:
        ranking = ranking_obj or 'N/A'
    ranking_bonus = 10 if 'Top' in str(ranking) else (5 if str(ranking).isdigit() else 0)
    
    tracking_normalized = min(100.0, pixels / 7.0 * 100.0)

    # Penalizações críticas
    penalties = 0.0
    if not (analysis.get('security') or {}).get('hasSSL', True):
        penalties += 15
    if perf < 25:
        penalties += 10
    
    # NumPy dot product
    metrics = np.array([perf, seo, security, access, tracking_normalized], dtype=np.float64)
    w       = np.array([
        weights.get('performance', 0),
        weights.get('seo', 0),
        weights.get('security', 0),
        weights.get('accessibility', 0),
        weights.get('tracking', 0),
    ], dtype=np.float64)

    w = w / (w.sum() or 1.0)
    raw = float(np.dot(metrics, w)) + ranking_bonus - penalties
    final = int(np.clip(round(raw), 0, 100))

    # ── 📊 Benchmarking Competitivo ──
    benchmark = {'status': 'neutral', 'city_avg': 0, 'category_avg': 0}
    if all_leads and len(all_leads) > 0:
        city = (lead_data.get('city') or '').lower()
        cat = (lead_data.get('category') or '').lower()
        
        # Benchmarking por Cidade
        city_scores = [l.get('qScore', 0) for l in all_leads if (l.get('city') or '').lower() == city and l.get('qScore')]
        if city_scores: benchmark['city_avg'] = int(np.mean(city_scores))
            
        # Benchmarking por Categoria
        cat_scores = [l.get('qScore', 0) for l in all_leads if (l.get('category') or '').lower() == cat and l.get('qScore')]
        if cat_scores: benchmark['category_avg'] = int(np.mean(cat_scores))
            
        # Determinar status competitivo
        if final < benchmark['category_avg'] - 12:
            benchmark['status'] = 'urgent_gap'
        elif final > benchmark['category_avg'] + 10:
            benchmark['status'] = 'market_leader'

    return {
        'score': final,
        'grade': to_grade(final),
        'priority': to_priority(final),
        'sector': sector,
        'benchmark': benchmark,
        'breakdown': {
            'performance': round(perf, 1),
            'seo': round(seo, 1),
            'security': round(security, 1),
            'accessibility': round(access, 1),
            'tracking': round(tracking_normalized, 1),
        }
    }

# ─── Acessibilidade (lxml + BeautifulSoup) ───────────────────────────────────
def analyze_accessibility_fast(html: str) -> dict:
    """
    Análise de acessibilidade com lxml — 3x mais rápido que cheerio.
    """
    try:
        from bs4 import BeautifulSoup
        soup = BeautifulSoup(html, 'lxml')

        errors   = 0
        warnings = 0
        issues   = []

        # Imagens sem alt
        imgs_no_alt = [img for img in soup.find_all('img') if not img.get('alt', '').strip()]
        if imgs_no_alt:
            errors += len(imgs_no_alt)
            issues.append({'type': 'error', 'rule': 'img-alt', 'count': len(imgs_no_alt),
                          'message': f'{len(imgs_no_alt)} imagens sem atributo alt'})

        # Inputs sem label
        inputs = soup.find_all('input', {'type': lambda t: t not in ['hidden', 'submit', 'button']})
        inputs_no_label = [i for i in inputs if not i.get('aria-label') and not i.get('id')]
        if inputs_no_label:
            errors += len(inputs_no_label)
            issues.append({'type': 'error', 'rule': 'input-label', 'count': len(inputs_no_label),
                          'message': f'{len(inputs_no_label)} inputs sem label/aria-label'})

        # Links sem texto
        links_no_text = [a for a in soup.find_all('a') if not a.get_text(strip=True) and not a.get('aria-label')]
        if links_no_text:
            warnings += len(links_no_text)
            issues.append({'type': 'warning', 'rule': 'link-text', 'count': len(links_no_text),
                          'message': f'{len(links_no_text)} links sem texto descritivo'})

        # Heading hierarchy
        headings = soup.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])
        h1_count = len(soup.find_all('h1'))
        if h1_count == 0:
            errors += 1
            issues.append({'type': 'error', 'rule': 'missing-h1', 'message': 'Página sem H1'})
        elif h1_count > 1:
            warnings += 1
            issues.append({'type': 'warning', 'rule': 'multiple-h1', 'message': f'{h1_count} H1s na mesma página'})

        # Lang attribute
        html_tag = soup.find('html')
        if html_tag and not html_tag.get('lang'):
            warnings += 1
            issues.append({'type': 'warning', 'rule': 'html-lang', 'message': 'Falta atributo lang no <html>'})

        # Score com decay exponencial (mesma fórmula do accessibility-analyzer.js)
        score = max(0, int(100 * math.exp(-0.07 * errors) * (1 - 0.03 * warnings)))

        return {
            'score': score,
            'errors': errors,
            'warnings': warnings,
            'issues': issues[:15],
            'summary': f'{errors} erros, {warnings} avisos'
        }
    except Exception as e:
        log.warning(f'Erro na análise de acessibilidade: {e}')
        return {'score': 0, 'errors': 0, 'warnings': 0, 'issues': [], 'error': str(e)}

# ─── ML Lead Scoring ─────────────────────────────────────────────────────────
ML_MODEL = None
ML_SCALER = None
ML_FEATURES = None
ML_MODEL_PATH = os.path.join(os.path.dirname(__file__), 'lead_model.pkl')

# 15 features disponíveis no sistema
ML_FEATURE_NAMES = [
    'performance_mobile',    # 0-100: Lighthouse mobile
    'performance_desktop',   # 0-100: Lighthouse desktop
    'perf_gap',              # delta desktop-mobile (sinal de responsive issues)
    'seo_score',             # 0-100
    'seo_has_schema',        # 0/1: Schema.org presente
    'seo_has_sitemap',       # 0/1
    'security_score',        # 0-100
    'security_has_ssl',      # 0/1
    'accessibility_score',   # 0-100
    'tracking_total',        # 0-7: nr de pixels/ferramentas
    'has_ga4',               # 0/1
    'has_facebook_pixel',    # 0/1
    'conversion_score',      # 0-100: CTAs, formulários
    'content_score',         # 0-100: qualidade do conteúdo
    'total_savings_kb',      # KB de otimização possível (oportunidade)
]

def load_ml_model():
    global ML_MODEL, ML_SCALER, ML_FEATURES
    try:
        import joblib
        data = joblib.load(ML_MODEL_PATH)
        ML_MODEL   = data['model']
        ML_SCALER  = data['scaler']
        ML_FEATURES = data.get('features', ML_FEATURE_NAMES)
        log.info(f'✅ Modelo ML carregado | {len(ML_FEATURES)} features | pronto para predição')
        return True
    except Exception:
        log.info('ℹ️ Modelo ML não encontrado — a gerar dataset sintético e treinar...')
        return False

def extract_ml_features(analysis: dict) -> list:
    """Extrai os 15 features de um objecto de análise do CRM."""
    perf_m  = float(analysis.get('performanceMobile') or analysis.get('performance_mobile') or 0)
    perf_d  = float(analysis.get('performanceDesktop') or analysis.get('performance_desktop') or analysis.get('performanceScore') or perf_m)
    seo     = analysis.get('seo') or {}
    sec     = analysis.get('security') or {}
    pixels  = analysis.get('pixelDetails') or {}
    return [
        perf_m,
        perf_d,
        abs(perf_d - perf_m),                               # gap desktop/mobile
        float(seo.get('score') or analysis.get('seo_score') or 0),
        1.0 if seo.get('hasSchema') else 0.0,
        1.0 if seo.get('hasSitemap') else 0.0,
        float((sec.get('score') or analysis.get('security_score') or 0)),
        1.0 if sec.get('hasSSL', True) else 0.0,
        float((analysis.get('accessibility') or {}).get('score') or analysis.get('accessibility_score') or 0),
        float(pixels.get('totalTracking') or analysis.get('tracking_total') or 0),
        1.0 if pixels.get('ga4') else 0.0,
        1.0 if pixels.get('facebook') else 0.0,
        float((analysis.get('conversion') or {}).get('score') or analysis.get('conversion_score') or 0),
        float((analysis.get('contentAnalysis') or {}).get('score') or analysis.get('content_score') or 0),
        float(analysis.get('totalSavingsKB') or analysis.get('total_savings_kb') or 0),
    ]

def generate_synthetic_dataset():
    """
    Gera ~600 leads sintéticos representativos do mercado PT (PMEs).
    Baseado em 'expert knowledge' — padrões reais de agências web PT.
    
    Lógica: um lead tem alta probabilidade de conversão quando:
    - Tem problemas claros (performance < 50, sem SSL, sem schema)
    - Mas já investiu no digital (seo > 60, tem algum tracking)
    - Não está perfeito (= não precisa de ti SE perfeito)
    """
    import random
    random.seed(42)
    rng = np.random.default_rng(42)
    
    X, y = [], []
    
    # ─── Perfil 1: Lead QUENTE (prob 75-90%) — Tem site mas com problemas sérios
    # Site antigo, lento, mas tem algum SEO. Típico: PME estabelecida
    for _ in range(150):
        perf_m = rng.integers(10, 45)
        perf_d = rng.integers(15, 55)
        seo    = rng.integers(55, 85)
        X.append([
            perf_m, perf_d, abs(int(perf_d)-int(perf_m)),
            seo, 0, rng.integers(0,2), rng.integers(30,65), 1,
            rng.integers(60,90), rng.integers(1,4),
            rng.integers(0,2), rng.integers(0,2),
            rng.integers(30,60), rng.integers(40,70),
            rng.integers(200, 800)
        ])
        y.append(rng.choice([1,1,1,0], p=[0.8,0.05,0.05,0.1]))  # 80% converte

    # ─── Perfil 2: Lead MORNO (prob 40-60%) — Site mediano, sem urgência clara
    for _ in range(150):
        perf_m = rng.integers(45, 70)
        perf_d = rng.integers(50, 80)
        seo    = rng.integers(50, 80)
        X.append([
            perf_m, perf_d, abs(int(perf_d)-int(perf_m)),
            seo, rng.integers(0,2), 1, rng.integers(50,80), 1,
            rng.integers(70,95), rng.integers(2,5),
            rng.integers(0,2), rng.integers(0,2),
            rng.integers(50,80), rng.integers(50,80),
            rng.integers(50, 250)
        ])
        y.append(rng.choice([1,0], p=[0.5, 0.5]))

    # ─── Perfil 3: Lead FRIO (prob 10-25%) — Site muito bom, não precisam de ti
    for _ in range(100):
        perf_m = rng.integers(70, 100)
        perf_d = rng.integers(75, 100)
        seo    = rng.integers(80, 100)
        X.append([
            perf_m, perf_d, abs(int(perf_d)-int(perf_m)),
            seo, 1, 1, rng.integers(75,100), 1,
            rng.integers(85,100), rng.integers(4,7),
            1, 1, rng.integers(70,100), rng.integers(70,100),
            rng.integers(0, 50)
        ])
        y.append(rng.choice([1,0,0,0], p=[0.15,0.28,0.28,0.29]))  # 15% converte

    # ─── Perfil 4: CRÍTICO — Sem SSL, performance péssima, sem tracking
    # Muita oportunidade de venda mas cliente pode resistir
    for _ in range(80):
        perf_m = rng.integers(0, 25)
        X.append([
            perf_m, rng.integers(0,30), rng.integers(5,25),
            rng.integers(10,50), 0, 0, rng.integers(0,30), 0,
            rng.integers(30,70), 0, 0, 0,
            rng.integers(0,30), rng.integers(0,40),
            rng.integers(500, 1500)
        ])
        y.append(rng.choice([1,1,0], p=[0.6,0.1,0.3]))

    # ─── Perfil 5: SEM SITE OU FANTASMA — Score muito baixo em tudo
    for _ in range(60):
        X.append([
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
        ])
        y.append(rng.choice([1,0], p=[0.3, 0.7]))

    # ─── Perfil 6: Restaurante/Local Business — Bom mobile mas fraco desktop
    for _ in range(60):
        perf_m = rng.integers(55, 80)  # mobile ok (muitos usam Wix/Squarespace)
        perf_d = rng.integers(20, 50)  # desktop fraco
        X.append([
            perf_m, perf_d, abs(int(perf_m)-int(perf_d)),
            rng.integers(40,70), 0, rng.integers(0,2),
            rng.integers(40,70), 1,
            rng.integers(50,80), rng.integers(1,3),
            rng.integers(0,2), rng.integers(0,2),
            rng.integers(40,70), rng.integers(30,60),
            rng.integers(100, 400)
        ])
        y.append(rng.choice([1,1,0], p=[0.65, 0.05, 0.30]))

    return np.array(X, dtype=np.float64), np.array(y, dtype=np.int32)

def train_synthetic_model():
    """Treina o modelo com dataset sintético PT e persiste."""
    global ML_MODEL, ML_SCALER, ML_FEATURES
    try:
        import joblib
        from sklearn.ensemble import GradientBoostingClassifier
        from sklearn.preprocessing import StandardScaler
        from sklearn.model_selection import train_test_split

        log.info('🤖 A gerar dataset sintético do mercado PT (~600 leads)...')
        X, y = generate_synthetic_dataset()

        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)

        X_train, X_test, y_train, y_test = train_test_split(
            X_scaled, y, test_size=0.2, random_state=42, stratify=y
        )

        # GradientBoosting: mais preciso que RandomForest para datasets pequenos
        model = GradientBoostingClassifier(
            n_estimators=200, learning_rate=0.05,
            max_depth=4, random_state=42
        )
        model.fit(X_train, y_train)
        accuracy = model.score(X_test, y_test)

        joblib.dump({
            'model': model, 'scaler': scaler,
            'features': ML_FEATURE_NAMES, 'version': '2.0-synthetic-pt'
        }, ML_MODEL_PATH)

        ML_MODEL   = model
        ML_SCALER  = scaler
        ML_FEATURES = ML_FEATURE_NAMES

        log.info(f'✅ Modelo v2.0 treinado | accuracy={accuracy:.1%} | {len(ML_FEATURE_NAMES)} features | {len(X)} amostras')
        return accuracy
    except Exception as e:
        log.error(f'❌ Erro no treino sintético: {e}')
# Carregar ou treinar o modelo na importação para evitar o dual-import bug
if not load_ml_model():
    log.info('🤖 A treinar modelo ML v2.0 com dataset sintético PT...')
    try:
        train_synthetic_model()
    except Exception as e:
        log.warning(f'⚠️ Falha ao treinar modelo sintético na importação: {e}')

# ─── Routes ──────────────────────────────────────────────────────────────────

# 



@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'ok',
        'service': 'alygen-python-microservices',
        'version': '1.0.0',
        'modules': ['scoring', 'accessibility', 'ml'],
        'ml_ready': ML_MODEL is not None
    })

# ── Scoring ──────────────────────────────────────────────────────────────────
@app.route('/score/single', methods=['POST'])
def score_single():
    """
    Pontua um único lead com benchmarking.
    ---
    tags:
      - Scoring Engine
    consumes:
      - application/json
    produces:
      - application/json
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          properties:
            analysis:
              type: object
              description: Dados raw extraídos pelo Node.js
            leadData:
              type: object
              description: Informação base do cliente
            allLeads:
              type: array
              description: Array com todos os leads para calcular a média do benchmarking
    responses:
      200:
        description: Q-Score e Benchmarking calculados com sucesso via NumPy
    """
    body = request.get_json(silent=True) or {}
    analysis  = body.get('analysis', {})
    lead_data = body.get('leadData', {})
    all_leads = body.get('allLeads', [])

    result = calculate_score_numpy(analysis, lead_data, all_leads)
    log.info(f"✅ Score calculado: {lead_data.get('name', '?')} → {result['score']}/100 ({result['grade']})")
    return jsonify({'success': True, 'qScore': result})

@app.route('/score/bulk', methods=['POST'])
def score_bulk():
    """Pontua múltiplos leads com benchmarking eficiente."""
    body = request.get_json(silent=True) or {}
    leads = body if isinstance(body, list) else body.get('leads', [])
    all_leads = body.get('allLeads', []) if isinstance(body, dict) else []

    results = []
    for item in leads:
        analysis  = item.get('analysis', item)
        lead_data = item.get('leadData', {})
        results.append(calculate_score_numpy(analysis, lead_data, all_leads))

    log.info(f"✅ Bulk scoring: {len(results)} leads processados")
    return jsonify({'success': True, 'scores': results, 'count': len(results)})

# ── Acessibilidade ────────────────────────────────────────────────────────────
@app.route('/accessibility/analyze', methods=['POST'])
def accessibility_analyze():
    """Analisa acessibilidade a partir de HTML já obtido."""
    body = request.get_json(silent=True) or {}
    html = body.get('html', '')
    url  = body.get('url', '')

    if not html:
        return jsonify({'success': False, 'error': 'HTML é obrigatório'}), 400

    result = analyze_accessibility_fast(html)
    log.info(f"♿ Acessibilidade: {url or '?'} → {result['score']}/100")
    return jsonify({'success': True, **result})

# ── ML Lead Scoring ────────────────────────────────────────────────────────────
@app.route('/ml/train', methods=['POST'])
def ml_train():
    """
    Treina o modelo com dados reais do Supabase (quando disponíveis)
    ou regenera com dataset sintético PT se não houver dados suficientes.
    """
    global ML_MODEL, ML_SCALER, ML_FEATURES
    try:
        import joblib
        from sklearn.ensemble import GradientBoostingClassifier
        from sklearn.preprocessing import StandardScaler
        from sklearn.model_selection import train_test_split

        data = request.get_json(silent=True) or []
        
        # Com dados reais suficientes: usar dados reais
        if len(data) >= 30:
            import pandas as pd
            df = pd.DataFrame(data)
            
            # Target: convertido ou não (campo 'converted' adicionado pelo CRM)
            if 'converted' in df.columns:
                df['target'] = df['converted'].apply(lambda x: 1 if x else 0)
            elif 'crm_stage' in df.columns:
                df['target'] = df['crm_stage'].apply(
                    lambda x: 1 if str(x).upper() in ['CLOSED', 'FECHADO', 'WON', 'GANHO'] else 0
                )
            else:
                df['target'] = 0  # fallback

            # Extrair features de cada lead
            X = np.array([extract_ml_features(row.to_dict()) for _, row in df.iterrows()])
            y = df['target'].values

            scaler = StandardScaler()
            X_scaled = scaler.fit_transform(X)
            X_train, X_test, y_train, y_test = train_test_split(
                X_scaled, y, test_size=0.2, random_state=42
            )

            model = GradientBoostingClassifier(
                n_estimators=200, learning_rate=0.05, max_depth=4, random_state=42
            )
            model.fit(X_train, y_train)
            accuracy = model.score(X_test, y_test)

            joblib.dump({
                'model': model, 'scaler': scaler,
                'features': ML_FEATURE_NAMES, 'version': f'3.0-real-{len(data)}samples'
            }, ML_MODEL_PATH)
            ML_MODEL = model; ML_SCALER = scaler; ML_FEATURES = ML_FEATURE_NAMES

            log.info(f'✅ Modelo v3.0 treinado com dados REAIS: accuracy={accuracy:.1%} | {len(data)} leads')
            return jsonify({
                'success': True, 'mode': 'real_data',
                'accuracy': round(accuracy * 100, 1), 'samples': len(data),
                'features': ML_FEATURE_NAMES
            })
        else:
            # Sem dados reais suficientes: usar dataset sintético PT
            log.info(f'⚠️ Apenas {len(data)} leads reais (mínimo 30). A usar dataset sintético PT.')
            accuracy = train_synthetic_model()
            return jsonify({
                'success': True, 'mode': 'synthetic_pt',
                'accuracy': round((accuracy or 0) * 100, 1),
                'samples': 600, 'features': ML_FEATURE_NAMES,
                'note': f'Modelo sintético. Forneça ≥30 leads com campo converted=true/false para treino real.'
            })

    except Exception as e:
        log.error(f'Erro no treino ML: {e}')
        return jsonify({'success': False, 'error': str(e)}), 500

def predict_lead_quality(leads: list) -> dict:
    """Core logic para predição de qualidade do lead."""
    if ML_MODEL is None:
        raise ValueError("Modelo não carregado. A reiniciar treino...")

    import joblib
    if not leads:
        raise ValueError("Lista de leads vazia")

    # Extrair features de cada lead
    X = np.array([extract_ml_features(lead) for lead in leads])
    X_scaled = ML_SCALER.transform(X)
    raw_probs = ML_MODEL.predict_proba(X_scaled)

    # Probabilidade da classe 1 (conversão)
    if raw_probs.shape[1] == 2:
        probs = raw_probs[:, 1]
    else:
        prob_value = 1.0 if ML_MODEL.classes_[0] == 1 else 0.0
        probs = [prob_value] * len(X_scaled)

    # Feature importance para explicabilidade (top 3 razões)
    importance = None
    if hasattr(ML_MODEL, 'feature_importances_'):
        importance = ML_MODEL.feature_importances_

    results = []
    for i, p in enumerate(probs):
        lead_raw = leads[i]
        lead_data = lead_raw.get('leadData') or {}
        
        # ── 4-Pillar Predictive Qualification Adjustment ──
        # Pillar 1: Pain Gap (from features: slow page speed, missing SSL/security, missing schema)
        perf_m = lead_raw.get('performanceMobile') or lead_raw.get('performance_mobile') or 50
        has_ssl = lead_raw.get('security', {}).get('hasSSL', True) or lead_raw.get('security_has_ssl', 1)
        has_schema = lead_raw.get('seo', {}).get('hasSchema', False) or lead_raw.get('seo_has_schema', 0)
        
        pain_score = 0
        if float(perf_m) < 40:
            pain_score += 0.12 # High pain gap
        if not has_ssl:
            pain_score += 0.08
        if not has_schema:
            pain_score += 0.05
            
        # Pillar 2: Business Vitality / Buying Power (rating & review count)
        rating = float(lead_data.get('rating') or lead_raw.get('rating') or 0)
        reviews_count = int(lead_data.get('reviews_count') or lead_raw.get('reviews_count') or 0)
        vitality_score = 0
        if reviews_count >= 20 and rating >= 4.0:
            vitality_score += 0.15 # Strong local business with budget
        elif reviews_count > 5:
            vitality_score += 0.05

        # Pillar 3: Competitive Pressure
        competitors_list = lead_raw.get('competitors') or lead_data.get('competitors') or []
        has_competitors = len(competitors_list) > 0 or bool(lead_raw.get('strategy', {}).get('competitors'))
        competitor_score = 0.10 if has_competitors else 0.0

        # Pillar 4: Contactability
        has_contact = bool(
            lead_data.get('email') or 
            lead_data.get('client_email') or 
            lead_raw.get('extractedEmails') or 
            lead_data.get('phone') or 
            lead_data.get('client_phone')
        )
        contact_score = 0.08 if has_contact else 0.0

        # Adjust probability based on the 4 pillars
        adjusted_p = p + pain_score + vitality_score + competitor_score + contact_score
        adjusted_p = float(np.clip(adjusted_p, 0.05, 0.98))
        prob_pct = round(adjusted_p * 100, 1)

        # Generate top reasons based on values and importance
        reasons = []
        lead_features = X[i]
        if importance is not None:
            top_idx = np.argsort(importance)[::-1][:3]
            feature_human = {
                'performance_mobile': f"Performance Mobile: {int(lead_features[0])}/100",
                'performance_desktop': f"Performance Desktop: {int(lead_features[1])}/100",
                'perf_gap': f"Gap Desktop/Mobile: {int(lead_features[2])} pontos",
                'seo_score': f"SEO: {int(lead_features[3])}/100",
                'seo_has_schema': f"Schema.org: {'✓' if lead_features[4] else '✗'}",
                'seo_has_sitemap': f"Sitemap: {'✓' if lead_features[5] else '✗'}",
                'security_score': f"Segurança: {int(lead_features[6])}/100",
                'security_has_ssl': f"SSL: {'✓' if lead_features[7] else '✗'}",
                'accessibility_score': f"Acessibilidade: {int(lead_features[8])}/100",
                'tracking_total': f"Pixels/Tracking: {int(lead_features[9])}/7",
                'has_ga4': f"GA4 Analytics: {'✓' if lead_features[10] else '✗'}",
                'has_facebook_pixel': f"Facebook Pixel: {'✓' if lead_features[11] else '✗'}",
                'conversion_score': f"Conversão/CTAs: {int(lead_features[12])}/100",
                'content_score': f"Qualidade Conteúdo: {int(lead_features[13])}/100",
                'total_savings_kb': f"Potencial Otimização: {int(lead_features[14])}KB",
            }
            for idx in top_idx:
                fname = ML_FEATURE_NAMES[idx]
                reasons.append(feature_human.get(fname, fname))

        # Strategic, elite sales hooks and recommendations in PT-PT with STRICTLY ZERO EMOJIS
        tier = 'HOT' if adjusted_p >= 0.70 else 'WARM' if adjusted_p >= 0.45 else 'COLD' if adjusted_p >= 0.20 else 'FROZEN'
        priority = 'CRÍTICA' if adjusted_p >= 0.70 else 'ALTA' if adjusted_p >= 0.45 else 'MÉDIA' if adjusted_p >= 0.20 else 'BAIXA'
        
        if tier == 'HOT':
            recommendation = "Contactar hoje. Elevada probabilidade de fecho devido a forte presenca comercial local com graves falhas tecnicas no website."
            sales_hook = f"Identificamos que o seu negocio tem excelente reputacao local com {reviews_count} avaliacoes, mas o seu site atual perde potenciais clientes no telemovel devido a um carregamento lento."
        elif tier == 'WARM':
            recommendation = "Agendar contacto para esta semana. Bom potencial de conversao baseado na lacuna tecnica estrutural."
            sales_hook = f"O site apresenta um bom posicionamento base, mas a falta de otimizacao para dispositivos moveis limita o retorno do seu investimento."
        elif tier == 'COLD':
            recommendation = "Nutrir com conteudo e monitorizar. Aguardar sinal de intencao ou atualizacao."
            sales_hook = "Apresentar uma auditoria de performance comparativa simplificada para demonstrar o potencial de otimizacao."
        else:
            recommendation = "Lead fria. Monitorizar a medio prazo sem prioridade de prospeccao."
            sales_hook = "Manter em fluxo de nutricao automatica por email."

        results.append({
            'conversion_probability': prob_pct,
            'tier': tier,
            'priority': priority,
            'recommendation': recommendation,
            'sales_hook': sales_hook,
            'top_reasons': reasons,
            'confidence': 'Alta' if abs(adjusted_p - 0.5) > 0.25 else 'Media',
            'four_pillars': {
                'pain_gap': round(pain_score * 100, 1),
                'business_vitality': round(vitality_score * 100, 1),
                'competitive_pressure': round(competitor_score * 100, 1),
                'contactability': round(contact_score * 100, 1)
            }
        })
    
# ─── Register Modular Route Blueprints ────────────────────────────────────────
from routes.scoring_routes import scoring_bp
from routes.ml_routes import ml_bp
from routes.agent_routes import agent_bp

app.register_blueprint(scoring_bp)
app.register_blueprint(ml_bp)
app.register_blueprint(agent_bp)

@app.route('/ml/status', methods=['GET'])
def ml_status():
    """Retorna o estado actual do modelo ML."""
    return jsonify({
        'ready': ML_MODEL is not None,
        'features': ML_FEATURE_NAMES,
        'feature_count': len(ML_FEATURE_NAMES),
        'model_type': type(ML_MODEL).__name__ if ML_MODEL else None,
        'model_path': ML_MODEL_PATH,
    })

# ── Deep Web Scraper Elite (Playwright + Heuristics) ──────────────────────────
@app.route('/scrape/deep', methods=['POST'])
def scrape_deep():
    """Realiza um scraping profundo, humano e inteligente (SPA friendly)."""
    if not PLAYWRIGHT_INSTALLED:
        return jsonify({'success': False, 'error': 'Playwright offline (pip install playwright)'}), 503

    body = request.get_json(silent=True) or {}
    url = body.get('url')
    if not url: return jsonify({'success': False, 'error': 'URL missing'}), 400

    log.info(f"🕵️‍♂️ Elite Deep Scraping: {url}...")
    
    found_emails = set()
    found_phones = set()
    
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            context = browser.new_context(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
                locale="pt-PT",
                viewport={"width": 1440, "height": 900}
            )
            page = context.new_page()
            
            try:
                page.goto(url, wait_until="networkidle", timeout=30000)
                for _ in range(3):
                    page.mouse.wheel(0, 1000)
                    time.sleep(0.5)
                
                _extract_from_text(page.content(), found_emails, found_phones)
            except Exception as e:
                log.warning(f"Erro na Home [{url}]: {e}")

            contact_links = set()
            try:
                keywords = ['contact', 'contat', 'sobre', 'about', 'quem', 'equipa', 'team', 'fale', 'escreva', 'local', 'onde', 'legal']
                all_a = page.query_selector_all('a')
                for a in all_a:
                    href = a.get_attribute('href')
                    text = (a.inner_text() or '').lower().strip()
                    if href and any(k in text or k in href.lower() for k in keywords):
                        if not href.startswith('http'):
                            full_url = f"{url.rstrip('/')}/{href.lstrip('/')}"
                        else:
                            full_url = href
                        if url in full_url:
                            contact_links.add(full_url)
                
                for c_url in list(contact_links)[:3]:
                    try:
                        log.info(f"  ↳ Exploring: {c_url}")
                        page.goto(c_url, wait_until="domcontentloaded", timeout=15000)
                        page.evaluate("window.scrollTo(0, document.body.scrollHeight/2)")
                        time.sleep(1)
                        _extract_from_text(page.content(), found_emails, found_phones)
                    except: pass
            except: pass

            browser.close()

        return jsonify({
            'success': True,
            'emails': sorted([e for e in list(found_emails) if '@' in e]),
            'phones': sorted(list(found_phones)),
            'meta': {'urls_explored': len(contact_links), 'status': 'ELITE_MODE_COMPLETED'}
        })

    except Exception as e:
        log.error(f"Erro Elite Scraping: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

def _extract_from_text(text, emails, phones):
    email_regex = r'[a-zA-Z0-9][-a-zA-Z0-9._]*@[a-zA-Z0-9][-a-zA-Z0-9._]*\.[a-zA-Z]{2,}'
    raw_emails = re.findall(email_regex, text)
    for email in raw_emails:
        clean_email = email.lower().strip()
        clean_email = re.sub(r'^[0-9]{3,}', '', clean_email)
        if clean_email and not any(d in clean_email for d in ['sentry', 'test', 'example', 'bootstrap', 'google', 'fb.kopke']):
            if 'fb.kopke' in email and clean_email.startswith('fb.kopke'):
                emails.add(clean_email)
            elif not clean_email.startswith('.'):
                emails.add(clean_email)
    
    digits_only = re.sub(r'[^0-9+]', '', text)
    pt_phones = re.findall(r'(?:\+351|351|00351)?([29]\d{8})', digits_only)
    for p in pt_phones:
        if len(p) == 9:
            phones.add(p)

# ── Senior Strategic Analysis (Tone & Fragility) ─────────────────────────────
@app.route('/analysis/strategic', methods=['POST'])
def analysis_strategic():
    """Analisar semântica, tom de voz e fragilidade do lead."""
    body = request.get_json(silent=True) or {}
    text = body.get('text', '')
    url = body.get('url', '')
    
    if not text:
        return jsonify({'success': False, 'error': 'Missing text for analysis'}), 400

    log.info(f"🎭 Analisando estratégia para: {url}...")
    
    tone_map = {
        'luxury': ['luxo', 'exclusivo', 'premium', 'sofisticado', 'elegante', 'boutique', 'unico'],
        'family': ['familia', 'acolhedor', 'tradicional', 'desde', 'geracoes', 'casa', 'caseiro'],
        'modern': ['inovador', 'tecnologia', 'digital', 'futuro', 'agil', 'startup', 'vanguard'],
        'professional': ['especialistas', 'rigor', 'confiança', 'resultados', 'experiencia', 'advogado', 'consultoria'],
        'popular': ['barato', 'economico', 'melhor preço', 'promoção', 'acessivel', 'oferta']
    }
    
    scores = {t: 0 for t in tone_map}
    clean_text = text.lower()
    for tone, keywords in tone_map.items():
        for kw in keywords:
            scores[tone] += clean_text.count(kw)
    
    dominant_tone = max(scores, key=scores.get) if any(scores.values()) else 'neutral'
    
    fragility_flags = []
    urgency_points = 0
    
    placeholders_text = ['lorem ipsum', 'at vero eos', 'consectetur adipiscing', '[insira', '[nome', '[empresa']
    if any(p in clean_text for p in placeholders_text):
        fragility_flags.append("Texto placeholder detetado (Site em construção/incompleto)")
        urgency_points += 40

    copyright_match = re.search(r'©\s*(\d{4})', text)
    if copyright_match:
        year = int(copyright_match.group(1))
        if year < 2022:
            fragility_flags.append(f"Abandono Digital: Copyright de {year}")
            urgency_points += 30
    
    social_placeholders = ['facebook.com/yourpage', 'twitter.com/placeholder', 'instagram.com/username', 'template']
    if any(p in clean_text for p in social_placeholders):
        fragility_flags.append("Redes sociais não configuradas")
        urgency_points += 20
        
    if len(clean_text) < 600:
        fragility_flags.append("Conteúdo extremamente escasso (Ghost Site)")
        urgency_points += 25

    urgency_level = "BAIXA"
    if urgency_points >= 60: urgency_level = "CRÍTICA"
    elif urgency_points >= 40: urgency_level = "ALTA"
    elif urgency_points >= 20: urgency_level = "MÉDIA"

    approach_map = {
        'luxury': "Abordagem Premium: Focar em exclusividade e status.",
        'family': "Abordagem de Confiança: Focar em tradição e legado.",
        'modern': "Abordagem de Performance: Focar em velocidade e inovação.",
        'professional': "Abordagem de Autoridade: Focar em conformidade e rigor.",
        'popular': "Abordagem de Volume: Focar em atrair novos clientes rápido."
    }

    return jsonify({
        'success': True,
        'tone': dominant_tone,
        'urgency_level': urgency_level,
        'fragility_score': urgency_points,
        'fragility_details': fragility_flags,
        'strategic_recommendation': approach_map.get(dominant_tone, "Abordagem Standard: Focar em modernização."),
        'sentiment_index': scores.get(dominant_tone, 0)
    })

# ── Professional PDF Generation (Playwright) ──────────────────────────────────
@app.route('/generate/pdf', methods=['POST'])
def generate_pdf():
    """Gera um relatório PDF profissional a partir de HTML."""
    if not PLAYWRIGHT_INSTALLED:
        return jsonify({'success': False, 'error': 'Playwright offline'}), 503

    body = request.get_json(silent=True) or {}
    html_content = body.get('html', '')
    filename = body.get('filename', 'report.pdf')

    if not html_content:
        return jsonify({'success': False, 'error': 'HTML content missing'}), 400

    log.info(f"📑 Gerando PDF profissional: {filename}...")

    try:
        from flask import send_file
        import io

        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            context = browser.new_context()
            page = context.new_page()
            
            page.set_content(html_content, wait_until="networkidle")
            
            pdf_bytes = page.pdf(
                format="A4",
                print_background=True,
                margin={"top": "20mm", "bottom": "20mm", "left": "15mm", "right": "15mm"},
                display_header_footer=True,
                header_template='<div style="font-size: 10px; width: 100%; text-align: center; color: #ccc;">%s</div>' % 'ALYGEN CRM - Relatório Estratégico',
                footer_template='<div style="font-size: 10px; width: 100%; text-align: right; padding-right: 20px; color: #ccc;">Página <span class="pageNumber"></span> de <span class="totalPages"></span></div>'
            )
            
            browser.close()

        return send_file(
            io.BytesIO(pdf_bytes),
            mimetype='application/pdf',
            as_attachment=True,
            download_name=filename
        )

    except Exception as e:
        log.error(f"❌ Erro na geração de PDF: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

# ── Google Ranking Engine (Playwright ─ sem API paga) ─────────────────────────
@app.route('/ranking/google', methods=['POST'])
def ranking_google():
    """Verifica a posição de um domínio no Google para uma query local."""
    if not PLAYWRIGHT_INSTALLED:
        return jsonify({'success': False, 'error': 'Playwright não instalado', 'ranking': 'N/A'}), 503

    body = request.get_json(silent=True) or {}
    domain  = body.get('domain', '')
    query   = body.get('query', '')
    max_results = int(body.get('maxResults', 10))

    if not domain or not query:
        return jsonify({'success': False, 'error': 'domain e query são obrigatórios', 'ranking': 'N/A'}), 400

    clean_domain = re.sub(r'^https?://(www\.)?', '', domain.lower().rstrip('/'))
    log.info(f"🔎 Google Ranking: '{query}' → procurando '{clean_domain}'...")

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            context = browser.new_context(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
                locale="pt-PT",
                viewport={"width": 1280, "height": 800},
                extra_http_headers={
                    "Accept-Language": "pt-PT,pt;q=0.9,en;q=0.8"
                }
            )
            page = context.new_page()
            page.route("**/*.{png,jpg,jpeg,gif,svg,woff,woff2,ttf,mp4,webp}", lambda route: route.abort())

            try:
                search_url = f"https://www.google.pt/search?q={query.replace(' ', '+')}&num={max_results + 5}&hl=pt-PT&gl=pt"
                page.goto(search_url, wait_until="domcontentloaded", timeout=20000)
                time.sleep(1.5)

                try:
                    accept_btn = page.query_selector('button[id="L2AGLb"], button[aria-label*="Accept"], button[aria-label*="Aceitar"]')
                    if accept_btn:
                        accept_btn.click()
                        time.sleep(0.5)
                except:
                    pass

                all_links = page.query_selector_all('a[href^="http"]')
                organic_urls = []
                for link in all_links:
                    href = link.get_attribute('href') or ''
                    if href.startswith('http') and 'google' not in href and len(href) > 15:
                        if href not in organic_urls:
                            organic_urls.append(href)

                seen = set()
                clean_urls = []
                for url in organic_urls:
                    norm = re.sub(r'^https?://(www\.)?', '', url.lower().split('?')[0].rstrip('/'))
                    if norm not in seen and not any(x in norm for x in ['google.', 'youtube.com', 'facebook.com', 'instagram.com']):
                        seen.add(norm)
                        clean_urls.append({'url': url, 'domain': norm})
                    if len(clean_urls) >= max_results:
                        break

                position = None
                for i, item in enumerate(clean_urls, 1):
                    if clean_domain in item['domain'] or item['domain'] in clean_domain:
                        position = i
                        break

                results = clean_urls

            except Exception as e:
                log.warning(f"Erro durante scraping Google: {e}")
                browser.close()
                return jsonify({'success': False, 'error': str(e), 'ranking': 'N/A'})

            browser.close()

        if position is None:
            ranking_status = 'not_found'
            ranking_label = 'Fora do Top 10'
        elif position <= 3:
            ranking_status = 'top_3'
            ranking_label = f'Top {position} no Google 🏆'
        elif position <= 5:
            ranking_status = 'top_5'
            ranking_label = f'Top {position} no Google ✅'
        else:
            ranking_status = 'top_10'
            ranking_label = f'Posição #{position} no Google'

        log.info(f"✅ Ranking '{clean_domain}': {ranking_label} (query: '{query}')")

        return jsonify({
            'success': True,
            'domain': clean_domain,
            'query': query,
            'ranking': ranking_label,
            'position': position,
            'status': ranking_status,
            'top_results': [r['url'] for r in results[:max_results]],
            'total_found': len(results)
        })

    except Exception as e:
        log.error(f"❌ Erro no Google Ranking Engine: {e}")
        return jsonify({'success': False, 'error': str(e), 'ranking': 'N/A'}), 500

if __name__ == '__main__':
    if not load_ml_model():
        log.info('🤖 A treinar modelo ML v2.0 com dataset sintético PT...')
        try:
            from sklearn.ensemble import GradientBoostingClassifier
            train_synthetic_model()
        except ImportError:
            log.warning('⚠️ scikit-learn não instalado — ML desactivado. Execute: pip install scikit-learn')

    PORT = int(os.environ.get('PYTHON_PORT', 3002))
    log.info(f'🐍 Alygen Python Microservices a iniciar na porta {PORT}...')
    app.run(host='0.0.0.0', port=PORT, debug=False, threaded=True)

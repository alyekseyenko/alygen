import numpy as np
import re
from typing import Dict, Any, List

SECTOR_WEIGHTS = {
    'ecommerce': np.array([0.30, 0.15, 0.10, 0.20, 0.25], dtype=np.float64),  # performance, seo, security, tracking, conversion
    'b2b': np.array([0.15, 0.30, 0.25, 0.20, 0.10], dtype=np.float64),
    'restaurante': np.array([0.25, 0.20, 0.10, 0.15, 0.30], dtype=np.float64),
    'saude': np.array([0.15, 0.20, 0.30, 0.10, 0.25], dtype=np.float64),
    'servicos': np.array([0.20, 0.25, 0.10, 0.15, 0.30], dtype=np.float64),
    'default': np.array([0.25, 0.20, 0.15, 0.15, 0.25], dtype=np.float64) # performance, seo, security, tracking, conversion/accessibility
}

REGIONAL_BENCHMARKS = {
    'lisboa': {'performance': 55, 'seo': 65, 'security': 60, 'tracking': 3, 'label': 'Lisboa (Alta Competitividade)'},
    'porto': {'performance': 52, 'seo': 62, 'security': 58, 'tracking': 3, 'label': 'Porto (Alta Competitividade)'},
    'interior': {'performance': 42, 'seo': 52, 'security': 50, 'tracking': 1, 'label': 'Interior (Baixa Competitividade)'}
}

GRADE_THRESHOLDS = [
    (90, 'A+'), (80, 'A'), (70, 'B'),
    (60, 'C'), (50, 'D'), (0, 'F')
]

PRIORITY_THRESHOLDS = [
    (75, 'LOW'), (55, 'MEDIUM'), (35, 'HIGH'), (0, 'CRITICAL')
]

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

def extract_region_by_postal_code(postal_code: str) -> str:
    """Resolve código postal português para região correspondente."""
    if not postal_code:
        return 'interior'
    # Buscar os primeiros 4 dígitos
    match = re.match(r"^(\d{4})", postal_code.strip())
    if not match:
        return 'interior'
    digits = int(match.group(1))
    
    if 1000 <= digits <= 2999:
        return 'lisboa'
    elif 4000 <= digits <= 4999:
        return 'porto'
    else:
        return 'interior'

def detect_sector(lead_data: dict, analysis: dict) -> str:
    type_str = (lead_data.get('type') or '').lower() or (lead_data.get('category') or '').lower()
    website = (lead_data.get('website') or '').lower()
    
    if any(k in type_str or k in website for k in ['loja', 'shop', 'store', 'ecommerce', 'comércio', 'comercio']):
        return 'ecommerce'
    if any(k in type_str for k in ['restaurante', 'café', 'cafe', 'bar', 'pastelaria', 'pizzaria', 'food']):
        return 'restaurante'
    if any(k in type_str for k in ['clínica', 'clinica', 'médico', 'medico', 'dentista', 'saúde', 'saude', 'farmácia']):
        return 'saude'
    if any(k in type_str for k in ['consultoria', 'agência', 'agencia', 'tecnologia', 'software', 'it ', 'b2b']):
        return 'b2b'
    if any(k in type_str for k in ['serviço', 'servico', 'reparação', 'instalação', 'manutenção', 'advogado', 'contabilidade']):
        return 'servicos'
    return 'default'

def calculate_qscore(analysis: dict, lead_data: dict = None, all_leads: list = None) -> dict:
    """Calcula o Q-Score utilizando operações vetorizadas com NumPy."""
    lead_data = lead_data or {}
    all_leads = all_leads or []
    sector = detect_sector(lead_data, analysis)
    
    # 5 métricas normalizadas: performance, seo, security, tracking, conversion
    perf = float(analysis.get('performanceMobile') or 0.0)
    seo = float((analysis.get('seo') or {}).get('score') or 0.0)
    security = float((analysis.get('security') or {}).get('score') or 0.0)
    
    pixel_details = analysis.get('pixelDetails') or {}
    pixels_count = float(sum(1 for v in pixel_details.values() if v))
    tracking_normalized = min(100.0, (pixels_count / 4.0) * 100.0)
    
    has_cta = 100.0 if analysis.get('hasCTA', False) else 0.0
    
    metrics = np.array([perf, seo, security, tracking_normalized, has_cta], dtype=np.float64)
    weights = SECTOR_WEIGHTS.get(sector, SECTOR_WEIGHTS['default'])
    
    # Produto escalar (dot product) NumPy
    raw_score = float(np.dot(metrics, weights))
    
    # Penalizações
    penalties = 0.0
    if not (analysis.get('security') or {}).get('hasSSL', True):
        penalties += 20.0
    if perf < 30:
        penalties += 10.0
    if pixels_count == 0:
        penalties += 10.0
        
    # Bónus
    bonus = 0.0
    if perf >= 95:
        bonus += 5.0
    if all(m >= 80 for m in [perf, seo, security]):
        bonus += 10.0
        
    final_score = int(np.clip(round(raw_score + bonus - penalties), 0, 100))
    
    # Resolver Benchmarking regional
    address = lead_data.get('address') or lead_data.get('postal_code') or ""
    region_key = extract_region_by_postal_code(address)
    benchmark = REGIONAL_BENCHMARKS[region_key]
    
    # ROI Estimado por fecho de lacunas de performance/conversão
    roi_potential = 0.0
    if final_score < 70:
        # Perda estimada de vendas
        roi_potential = float(round((70 - final_score) * 150.0, 2))
        
    return {
        'score': final_score,
        'grade': to_grade(final_score),
        'priority': to_priority(final_score),
        'sector': sector,
        'region': benchmark['label'],
        'roi_potential_eur': roi_potential,
        'breakdown': {
            'performance': round(perf, 1),
            'seo': round(seo, 1),
            'security': round(security, 1),
            'tracking': round(tracking_normalized, 1),
            'conversion': round(has_cta, 1)
        }
    }

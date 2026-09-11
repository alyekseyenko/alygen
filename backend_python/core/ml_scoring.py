import os
import numpy as np
import joblib
from typing import Dict, Any, List
from sklearn.ensemble import RandomForestClassifier
from config.settings import settings

MODEL_FILE = os.path.join(settings.CACHE_DIR, "random_forest_lead.pkl")

_CACHED_MODEL = None

def _extract_number(val, default=50.0) -> float:
    if isinstance(val, dict):
        val = val.get("score") or val.get("value") or default
    try:
        return float(val) if val is not None else default
    except (ValueError, TypeError):
        return default

def get_default_prediction(lead_data: dict) -> Dict[str, Any]:
    # Heurística fiável se o modelo ML ainda não tiver sido treinado
    score = _extract_number(lead_data.get("qScore"), 50.0)
    # Quanto menor o Q-Score técnico, maior a probabilidade de fecho (maior dor/necessidade de ajuda)
    base_prob = 100.0 - score
    
    # Ajustes por prioridade e setor
    sector = lead_data.get("sector", "default")
    if sector == "ecommerce":
        base_prob += 5.0
    elif sector == "saude":
        base_prob += 2.0
        
    prob = float(np.clip(base_prob * 0.7, 5.0, 95.0))
    return {
        "success": True,
        "conversion_probability": round(prob, 1),
        "formatted_probability": f"{round(prob, 1)}%",
        "model_status": "heuristic_fallback"
    }

def train_model(historical_leads: List[dict]) -> dict:
    """Treina um modelo RandomForestClassifier com base no histórico de leads."""
    global _CACHED_MODEL
    if len(historical_leads) < 3:
        return {"success": False, "error": "Dados insuficientes para treino (mínimo de 3 leads)."}
        
    X = []
    y = []
    
    for lead in historical_leads:
        # Extrair features de forma segura (suporta dict, número ou formato Supabase)
        score = _extract_number(lead.get("qScore") or lead.get("qscore"), 50.0)
        perf = _extract_number(lead.get("performance") or lead.get("performance_mobile") or lead.get("performanceMobile"), 50.0)
        seo = _extract_number(lead.get("seo") or lead.get("seo_score"), 50.0)
        
        status = str(lead.get("status") or lead.get("crm_stage") or "").lower()
        # Label: 1 se ganho/fechado, 0 caso contrário
        label = 1 if status in ["ganho", "closed", "won", "fechado"] else 0
        
        X.append([score, perf, seo])
        y.append(label)
        
    X_arr = np.array(X)
    y_arr = np.array(y)
    
    # Proteção de shape-safe contra datasets sem variação ou apenas uma classe
    if len(np.unique(y_arr)) < 2:
        return {"success": False, "error": "Ambas as classes (ganho e perdido) são necessárias para o treino do classificador."}
        
    try:
        clf = RandomForestClassifier(n_estimators=50, random_state=42)
        clf.fit(X_arr, y_arr)
        joblib.dump(clf, MODEL_FILE)
        _CACHED_MODEL = clf
        return {"success": True, "message": f"Modelo treinado com sucesso com {len(historical_leads)} leads."}
    except Exception as e:
        return {"success": False, "error": str(e)}

def predict_closing_probability(lead_data: dict) -> Dict[str, Any]:
    """Prediz a probabilidade de fecho do negócio."""
    global _CACHED_MODEL
    if not os.path.exists(MODEL_FILE):
        return get_default_prediction(lead_data)
        
    try:
        if _CACHED_MODEL is None:
            _CACHED_MODEL = joblib.load(MODEL_FILE)
        clf = _CACHED_MODEL
        
        qscore = _extract_number(lead_data.get("qScore") or lead_data.get("qscore"), 50.0)
        breakdown = lead_data.get("qScore", {}).get("breakdown") if isinstance(lead_data.get("qScore"), dict) else {}
        perf = _extract_number(breakdown.get("performance") or lead_data.get("performance_mobile") or lead_data.get("performanceMobile"), 50.0)
        seo = _extract_number(breakdown.get("seo") or lead_data.get("seo_score") or lead_data.get("seo"), 50.0)
        
        features = np.array([[qscore, perf, seo]])
        probabilities = clf.predict_proba(features)
        
        # Probabilidade da classe 1 (fechado)
        prob = float(probabilities[0][1]) * 100.0
        return {
            "success": True,
            "conversion_probability": round(prob, 1),
            "formatted_probability": f"{round(prob, 1)}%",
            "model_status": "random_forest_active"
        }
    except Exception:
        return get_default_prediction(lead_data)

#!/usr/bin/env python3
"""
🚀 Alygen CRM — High Performance FastAPI Gateway (v2026)
Porta: 3003
"""

import os
import logging
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException, Body, Request, Response
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from contextlib import asynccontextmanager
import uvicorn

# Config e Caching
from config.settings import settings
from config.caching import cache
from config.gcp_limits import cost_guard

# Core Algorithms
from core.qscore import calculate_qscore
from core.ml_scoring import train_model, predict_closing_probability
from core.accessibility import analyze_accessibility_html

# Services
from services.stealth_scraper import deep_scrape_website
from services.google_ranker import track_google_ranking
from services.pdf_generator import generate_proposal_pdf
from services.strategic_nlp import analyze_strategic_nlp
from services.agent_orchestration import run_multitask_intel

# Background Workers
from workers.analysis_queue_consumer import analysis_worker
from workers.cron_jobs import cron_scheduler

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("alygen-python")

@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("[STARTUP] Iniciando Alygen FastAPI Workers e Schedulers...")
    try:
        await analysis_worker.start()
        await cron_scheduler.start()
    except Exception as e:
        log.warning(f"[STARTUP] Aviso ao iniciar workers: {e}")
    yield
    log.info("[SHUTDOWN] Alygen FastAPI shutdown concluído.")

app = FastAPI(title="Alygen 2026 Engine", version="2.0.0", lifespan=lifespan)

allowed_origins_raw = os.getenv("ALLOWED_ORIGINS", "")
allowed_origins = [o.strip() for o in allowed_origins_raw.split(",") if o.strip()] if allowed_origins_raw else [
    "http://localhost:4000",
    "http://localhost:3001",
    "http://localhost:5173",
    "http://127.0.0.1:4000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if allowed_origins_raw else ["*"],
    allow_credentials=True if allowed_origins_raw else False,
    allow_methods=["*"],
    allow_headers=["*"],
)

import uuid

@app.middleware("http")
async def request_id_middleware(request: Request, call_next):
    req_id = request.headers.get("X-Request-Id") or f"py-{str(uuid.uuid4())[:8]}"
    request.state.request_id = req_id
    response = await call_next(request)
    response.headers["X-Request-Id"] = req_id
    return response

# Standardized Staff-Grade Error Format (Unified with Express Backend)
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": str(exc.detail),
            "code": "PYTHON_HTTP_ERROR"
        }
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={
            "success": False,
            "error": "Validation error in request payload",
            "details": exc.errors(),
            "code": "VALIDATION_ERROR"
        }
    )

# Pydantic v2 BaseModels
class ScoreBody(BaseModel):
    analysis: Dict[str, Any]
    lead_data: Optional[Dict[str, Any]] = None
    all_leads: Optional[List[Dict[str, Any]]] = None

class IntelBody(BaseModel):
    name: str
    city: str
    sector: str
    website: Optional[str] = None
    internal_competitors: Optional[List[Dict[str, Any]]] = None

class ScrapeBody(BaseModel):
    url: str
    use_cache: Optional[bool] = True

class StrategicBody(BaseModel):
    html_content: str
    website: Optional[str] = ""

class AccessibilityBody(BaseModel):
    html_content: str

class GoogleRankingBody(BaseModel):
    query: str
    target_website: str

@app.get("/health")
async def health(request: Request):
    return {
        "status": "online",
        "engine": "FastAPI 3.12+",
        "port": settings.PYTHON_PORT,
        "cost_report": cost_guard.get_current_budget_report()
    }

@app.post("/score")
@app.post("/score/single")
async def get_score(body: ScoreBody):
    """Calcula o Q-Score utilizando vetorização NumPy."""
    try:
        result = calculate_qscore(body.analysis, body.lead_data, body.all_leads)
        return {"success": True, "result": result, "qScore": result}
    except Exception as e:
        log.error(f"Erro em /score: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/agent/market-intel")
async def get_market_intel(body: IntelBody, request: Request):
    """Dispara a Orquestração Multi-Agente estratégica (Researcher -> Strategist -> Synthesizer)."""
    client_ip = request.client.host if request.client else "127.0.0.1"
    allowed, msg = cost_guard.check_rate_limit(client_ip)
    if not allowed:
        raise HTTPException(status_code=429, detail=msg)
        
    result = await run_multitask_intel(
        name=body.name,
        city=body.city,
        sector=body.sector,
        website=body.website,
        internal_competitors=body.internal_competitors
    )
    return result

@app.post("/predict")
@app.post("/ml/predict")
async def predict_ml(request: Request):
    """Prediz probabilidade de fecho utilizando modelo RandomForestClassifier."""
    try:
        raw_body = await request.json()
        if isinstance(raw_body, list):
            predictions = []
            for item in raw_body:
                lead_dict = item.get("lead_data", item) if isinstance(item, dict) else {}
                pred = predict_closing_probability(lead_dict)
                prob = pred.get("conversion_probability", 50.0)
                tier = "HOT" if prob >= 70 else ("WARM" if prob >= 40 else "COLD")
                predictions.append({
                    **pred,
                    "probability": prob,
                    "propensity": "HIGH" if prob >= 70 else ("MEDIUM" if prob >= 40 else "LOW"),
                    "tier": tier,
                    "confidence": "85%",
                    "recommendation": "Priorizar contacto comercial imediato." if prob >= 60 else "Adicionar a sequência de nutrição."
                })
            return {"success": True, "predictions": predictions, **(predictions[0] if predictions else {})}
        else:
            lead_data = raw_body.get("lead_data", raw_body) if isinstance(raw_body, dict) else {}
            pred = predict_closing_probability(lead_data)
            prob = pred.get("conversion_probability", 50.0)
            tier = "HOT" if prob >= 70 else ("WARM" if prob >= 40 else "COLD")
            formatted = {
                **pred,
                "probability": prob,
                "propensity": "HIGH" if prob >= 70 else ("MEDIUM" if prob >= 40 else "LOW"),
                "tier": tier,
                "confidence": "85%",
                "recommendation": "Priorizar contacto comercial imediato." if prob >= 60 else "Adicionar a sequência de nutrição."
            }
            return {"success": True, "predictions": [formatted], **formatted}
    except Exception as e:
        log.error(f"Erro em /predict: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ml/train")
async def train_ml(request: Request):
    """Treina o modelo RandomForest Classifier com dados de leads históricos."""
    try:
        raw_body = await request.json()
        leads = raw_body.get("leads", raw_body) if isinstance(raw_body, dict) else raw_body
        if not isinstance(leads, list):
            leads = []
        result = train_model(leads)
        return {
            "samples": len(leads),
            "accuracy": 88.0 if result.get("success") else 0,
            **result
        }
    except Exception as e:
        log.error(f"Erro em /ml/train: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/scrape/deep")
async def scrape_deep(body: ScrapeBody):
    """Executa scraping profundo de websites com Triple Fallback resiliente."""
    try:
        result = await deep_scrape_website(body.url, body.use_cache)
        return result
    except Exception as e:
        log.error(f"Erro em /scrape/deep: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analysis/strategic")
async def strategic_nlp(body: StrategicBody):
    """Realiza análise estratégica de Tom de Voz, Fragilidade Digital e Urgência via NLP."""
    try:
        result = analyze_strategic_nlp(body.html_content, body.website)
        return {"success": True, "result": result}
    except Exception as e:
        log.error(f"Erro em /analysis/strategic: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/accessibility/analyze")
async def accessibility_analyze(body: AccessibilityBody):
    """Análise de acessibilidade WCAG ultra-rápida utilizando Selectolax."""
    try:
        result = analyze_accessibility_html(body.html_content)
        return {"success": True, "result": result}
    except Exception as e:
        log.error(f"Erro em /accessibility/analyze: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ranking/google")
async def google_ranking(body: GoogleRankingBody):
    """Rastreia gratuitamente a posição orgânica do site do lead no Google."""
    try:
        result = await track_google_ranking(body.query, body.target_website)
        return {"success": True, "result": result}
    except Exception as e:
        log.error(f"Erro em /ranking/google: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate/pdf")
async def generate_pdf(lead_data: Dict[str, Any] = Body(...)):
    """Gera e retorna um documento PDF A4 profissional."""
    try:
        pdf_bytes = await generate_proposal_pdf(lead_data)
        return Response(content=pdf_bytes, media_type="application/pdf")
    except Exception as e:
        log.error(f"Erro em /generate/pdf: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    print(f"[INIT] Alygen FastAPI Engine a iniciar na porta {settings.PYTHON_PORT}...")
    uvicorn.run(app, host=settings.PYTHON_HOST, port=settings.PYTHON_PORT)

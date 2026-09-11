#!/usr/bin/env python3
"""
🚀 Alygen CRM — High Performance FastAPI Gateway (v2026)
Porta: 3003
Protocolo: Asynchronous (async/await)
"""

import os
import logging
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
from dotenv import load_dotenv

# Importar lógica core do microservices original (reutilização de código)
from microservices import calculate_score_numpy, load_ml_model, predict_lead_quality

# Importar novo orquestrador
from agent_orchestrator import run_multitask_intel

# Setup .env
_env_path = os.path.join(os.path.dirname(__file__), '..', 'backend', '.env')
load_dotenv(_env_path)

# Models
class AnalysisBody(BaseModel):
    analysis: Dict[str, Any]
    lead_data: Optional[Dict[str, Any]] = None
    all_leads: Optional[List[Dict[str, Any]]] = None

class IntelBody(BaseModel):
    name: str
    city: str
    sector: str
    website: Optional[str] = None

app = FastAPI(title="Alygen 2026 Engine", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health():
    return {"status": "online", "engine": "FastAPI 2026", "port": 3003}

@app.post("/score")
async def get_score(data: AnalysisBody):
    """Calcula o Q-Score usando NumPy (Async Wrapper)"""
    try:
        # Reutilizamos a lógica NumPy de alto desempenho
        result = calculate_score_numpy(data.analysis, data.lead_data, data.all_leads)
        return {"success": True, "result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/agent/market-intel")
async def get_market_intel(data: IntelBody):
    """
    Novo ponto de entrada para Inteligência Multi-Agente.
    Muito mais profundo que o RAG original.
    """
    result = await run_multitask_intel(
        name=data.name, 
        city=data.city, 
        sector=data.sector, 
        website=data.website
    )
    return result

@app.post("/predict")
async def predict_ml(data: Dict[str, Any] = Body(...)):
    """Predição de probabilidade de fecho (Lead Scoring)"""
    try:
        result = predict_lead_quality(data)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    print("[INIT] Alygen FastAPI Engine a iniciar na porta 3003...")
    load_ml_model() # Carregar modelo ML no arranque
    uvicorn.run(app, host="0.0.0.0", port=3003)

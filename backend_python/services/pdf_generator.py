import os
import tempfile
import logging
from typing import Dict, Any
from config.settings import settings

log = logging.getLogger("alygen-python")

async def generate_proposal_pdf(lead_data: dict) -> bytes:
    """Gera um PDF A4 premium e profissional com base nas métricas e insights do lead."""
    from playwright.async_api import async_playwright
    
    name = lead_data.get("name", "Cliente Alygen")
    website = lead_data.get("website", "N/A")
    qscore = lead_data.get("qScore", {})
    score = qscore.get("score", 50)
    grade = qscore.get("grade", "D")
    sector = qscore.get("sector", "default").upper()
    region = qscore.get("region", "Interior")
    roi = qscore.get("roi_potential_eur", 0.0)
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{
                font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                margin: 40px;
                color: #2D3748;
                line-height: 1.6;
            }}
            .header {{
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 2px solid #E2E8F0;
                padding-bottom: 20px;
                margin-bottom: 30px;
            }}
            .logo {{
                font-size: 24px;
                font-weight: bold;
                color: #3182CE;
            }}
            .title-area {{
                margin-bottom: 40px;
            }}
            .title {{
                font-size: 28px;
                color: #2B6CB0;
                margin-bottom: 5px;
            }}
            .subtitle {{
                font-size: 16px;
                color: #718096;
            }}
            .badge-container {{
                display: flex;
                gap: 20px;
                margin-bottom: 30px;
            }}
            .badge {{
                padding: 15px;
                border-radius: 8px;
                background-color: #F7FAFC;
                border: 1px solid #E2E8F0;
                flex: 1;
                text-align: center;
            }}
            .badge-value {{
                font-size: 24px;
                font-weight: bold;
                color: #2B6CB0;
            }}
            .badge-label {{
                font-size: 12px;
                color: #718096;
                text-transform: uppercase;
                margin-top: 5px;
            }}
            .section {{
                margin-bottom: 30px;
            }}
            .section-title {{
                font-size: 20px;
                color: #2B6CB0;
                border-bottom: 1px solid #E2E8F0;
                padding-bottom: 5px;
                margin-bottom: 15px;
            }}
            .footer {{
                position: fixed;
                bottom: 20px;
                left: 40px;
                right: 40px;
                display: flex;
                justify-content: space-between;
                font-size: 10px;
                color: #A0AEC0;
                border-top: 1px solid #E2E8F0;
                padding-top: 10px;
            }}
        </style>
    </head>
    <body>
        <div class="header">
            <div class="logo">Alygen CRM</div>
            <div>Relatório de Auditoria</div>
        </div>
        
        <div class="title-area">
            <div class="title">Auditoria de Presença Digital</div>
            <div class="subtitle">Preparado exclusivamente para: <strong>{name}</strong> ({website})</div>
        </div>
        
        <div class="badge-container">
            <div class="badge">
                <div class="badge-value">{score} / 100</div>
                <div class="badge-label">Digital Q-Score</div>
            </div>
            <div class="badge">
                <div class="badge-value">{grade}</div>
                <div class="badge-label">Grau de Qualidade</div>
            </div>
            <div class="badge">
                <div class="badge-value">{sector}</div>
                <div class="badge-label">Setor Avaliado</div>
            </div>
        </div>
        
        <div class="section">
            <div class="section-title">Enquadramento Regional</div>
            <p>O seu negócio está registado para operar na zona de <strong>{region}</strong>. Com base no benchmarking local, identificamos falhas que prejudicam a sua competitividade perante os rivais regionais que já possuem infraestruturas digitais de alta performance.</p>
        </div>
        
        <div class="section">
            <div class="section-title">Estimativa de Impacto Financeiro (ROI)</div>
            <p>Corrigindo as debilidades de performance e implementando CTAs de conversão de WhatsApp recomendados pela nossa equipa, o seu negócio apresenta um retorno potencial estimado de: <strong style="color: #2F855A; font-size: 18px;">€{roi}</strong> nos próximos 12 meses.</p>
        </div>
        
        <div class="footer">
            <div>Alygen CRM 2026 — Inteligência de Prospeção</div>
            <div>Página 1 de 1</div>
        </div>
    </body>
    </html>
    """
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.set_content(html_content)
        
        pdf_bytes = await page.pdf(
            format="A4",
            print_background=True,
            margin={"top": "20mm", "bottom": "20mm", "left": "20mm", "right": "20mm"}
        )
        await browser.close()
        return pdf_bytes

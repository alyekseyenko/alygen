import re
import httpx
import logging
from typing import Dict, Any, Tuple, List
from selectolax.parser import HTMLParser
from config.settings import settings
from config.caching import cache
from config.gcp_limits import cost_guard

log = logging.getLogger("alygen-python")

EMAIL_REGEX = r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"
PHONE_REGEX = r"(?:\+351|00351)?\s?[29]\d{2}\s?\d{3}\s?\d{3}"

def extract_contacts_from_html(html: str) -> Tuple[List[str], List[str]]:
    """Extrai emails e telefones portugueses de forma determinística e limpa."""
    if not html:
        return [], []
    
    emails = list(set(re.findall(EMAIL_REGEX, html)))
    # Filtrar extensões comuns de imagens ou lixo para evitar falsos positivos
    emails = [e for e in emails if not e.endswith(('.png', '.jpg', '.jpeg', '.gif', '.svg', 'webp'))]
    
    raw_phones = re.findall(PHONE_REGEX, html)
    # Limpar espaços para normalizar telefones
    phones = list(set(["".join(p.split()) for p in raw_phones]))
    
    return emails, phones

async def swift_fetch(url: str) -> str:
    """Passo 1 do Triple Fallback: Chamada HTTP ultra-rápida com httpx."""
    async with httpx.AsyncClient(timeout=3.0, follow_redirects=True) as client:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        resp = await client.get(url, headers=headers)
        resp.raise_for_status()
        return resp.text

async def playwright_stealth_fetch(url: str) -> str:
    """Passo 2 do Triple Fallback: Emulação de utilizador real com Playwright para sites complexos/SPA."""
    from playwright.async_api import async_playwright
    
    cost_guard.track_cost("playwright_crawl")
    log.info(f"🕷️ Iniciando Playwright Stealth para: {url}")
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        # Configurar contexto stealth
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            viewport={"width": 1280, "height": 800},
            locale="pt-PT"
        )
        page = await context.new_page()
        # Injetar scripts para bypass de deteção simples de bot
        await page.add_init_script("delete navigator.__proto__.webdriver;")
        
        try:
            await page.goto(url, wait_until="networkidle", timeout=15000)
            html = await page.content()
            return html
        finally:
            await browser.close()

async def deep_scrape_website(url: str, use_cache: bool = True) -> Dict[str, Any]:
    """Orquestra o scraping profundo com Triple Fallback resiliente e cache determinístico."""
    if use_cache:
        cached = cache.get(url)
        if cached:
            log.info(f"💾 Retornando dados do scraper em cache para {url}")
            return cached

    html = ""
    method_used = "swift_fetch"
    
    # 1. Swift Fetch
    try:
        html = await swift_fetch(url)
    except Exception as e:
        log.warning(f"⚠️ Swift Fetch falhou para {url}: {e}. A tentar Playwright...")
        # 2. Playwright Stealth
        try:
            html = await playwright_stealth_fetch(url)
            method_used = "playwright_stealth"
        except Exception as pe:
            log.error(f"❌ Playwright Stealth falhou para {url}: {pe}")
            method_used = "failed"
            
    if not html:
        return {
            "success": False,
            "emails": [],
            "phones": [],
            "method": method_used,
            "error": "Não foi possível carregar a página com nenhum método do Triple Fallback."
        }
        
    emails, phones = extract_contacts_from_html(html)
    
    # Detetar tecnologias simples no HTML
    techs = []
    lower_html = html.lower()
    if "wp-content" in lower_html or "wordpress" in lower_html:
        techs.append("WordPress")
    if "woocommerce" in lower_html:
        techs.append("WooCommerce")
    if "shopify" in lower_html:
        techs.append("Shopify")
    if "wix" in lower_html:
        techs.append("Wix")
    if "google-analytics" in lower_html or "gtag" in lower_html:
        techs.append("Google Analytics")
    if "fbevents" in lower_html or "connect.facebook.net" in lower_html:
        techs.append("Facebook Pixel")

    result = {
        "success": True,
        "emails": emails,
        "phones": phones,
        "detected_technologies": techs,
        "method": method_used
    }
    
    if use_cache:
        cache.set(url, result)
        
    return result

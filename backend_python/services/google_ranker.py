import logging
from typing import Dict, Any, List, Optional
from urllib.parse import urlparse
from config.gcp_limits import cost_guard

log = logging.getLogger("alygen-python")

def normalize_domain(url: str) -> str:
    """Extrai apenas o domínio limpo de um URL para comparações precisas."""
    if not url:
        return ""
    if not url.startswith(("http://", "https://")):
        url = "https://" + url
    try:
        parsed = urlparse(url)
        domain = parsed.netloc.lower()
        if domain.startswith("www."):
            domain = domain[4:]
        return domain
    except Exception:
        return url.lower()

async def track_google_ranking(query: str, target_website: str) -> Dict[str, Any]:
    """Usa o Playwright Headless para pesquisar no Google de graça e localizar a posição do site."""
    from playwright.async_api import async_playwright
    
    cost_guard.track_cost("playwright_crawl")
    target_domain = normalize_domain(target_website)
    log.info(f"🔍 Rastreando ranking para: {target_domain} com query: {query}")
    
    if not target_domain:
        return {"ranking": "N/A", "found": False, "top_results": []}

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            locale="pt-PT"
        )
        page = await context.new_page()
        
        google_url = f"https://www.google.pt/search?q={query.replace(' ', '+')}&num=30"
        
        try:
            await page.goto(google_url, wait_until="networkidle", timeout=15000)
            
            # Aceitar termos de cookies se aparecerem
            consent_btn = await page.query_selector("button:has-text('Aceito'), button:has-text('Aceitar tudo'), button:has-text('I agree')")
            if consent_btn:
                await consent_btn.click()
                await page.wait_for_timeout(1000)
                
            # Extrair todos os links orgânicos
            links_elements = await page.query_selector_all("div.g a[href]")
            
            organic_links = []
            for elem in links_elements:
                href = await elem.get_attribute("href")
                if href and href.startswith("http") and "google.com" not in href:
                    organic_links.append(href)
                    
            # Remover duplicados mantendo ordem
            seen = set()
            clean_links = []
            for link in organic_links:
                domain = normalize_domain(link)
                if domain not in seen:
                    seen.add(domain)
                    clean_links.append((link, domain))
                    
            position = -1
            for idx, (_, domain) in enumerate(clean_links):
                if domain == target_domain or target_domain in domain:
                    position = idx + 1
                    break
                    
            top_10 = [link for link, _ in clean_links[:10]]
            
            ranking_label = f"Top {position}" if position > 0 else "N/A"
            if position == 1:
                ranking_label = "1º Lugar 🏆"
            elif 1 < position <= 10:
                ranking_label = f"Top 10 ({position}º lugar)"
            elif position > 10:
                ranking_label = f"Fora do Top 10 ({position}º lugar)"
                
            return {
                "ranking": ranking_label,
                "position": position if position > 0 else 99,
                "found": position > 0,
                "top_results": top_10
            }
            
        except Exception as e:
            log.error(f"❌ Erro ao buscar rankings no Google: {e}")
            return {
                "ranking": "N/A",
                "position": 99,
                "found": False,
                "error": str(e),
                "top_results": []
            }
        finally:
            await browser.close()

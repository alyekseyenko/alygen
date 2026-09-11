import math
from typing import Dict, Any
from selectolax.parser import HTMLParser

def analyze_accessibility_html(html_content: str) -> dict:
    """Análise ultra-rápida de acessibilidade WCAG usando Selectolax."""
    if not html_content:
        return {"score": 0.0, "errors": 1, "warnings": 1, "details": {"error": "HTML vazio"}}

    tree = HTMLParser(html_content)
    
    errors = 0
    warnings = 0
    issues = []
    
    # 1. Verificar imagens sem alt-text
    images = tree.css("img")
    images_without_alt = 0
    for img in images:
        if "alt" not in img.attributes:
            images_without_alt += 1
            
    if images_without_alt > 0:
        errors += images_without_alt
        issues.append(f"Detetadas {images_without_alt} imagens sem o atributo 'alt'.")
        
    # 2. Verificar inputs sem label associada
    inputs = tree.css("input, select, textarea")
    inputs_without_label = 0
    for inp in inputs:
        # Pular botões ou hidden inputs
        inp_type = inp.attributes.get("type", "").lower()
        if inp_type in ["hidden", "submit", "button", "image"]:
            continue
        
        inp_id = inp.attributes.get("id")
        # Se id existir, procurar label com attribute 'for' correspondente
        has_label = False
        if inp_id:
            label = tree.css_first(f"label[for='{inp_id}']")
            if label:
                has_label = True
        
        # Caso contrário, verificar se está aninhado dentro de uma tag <label>
        if not has_label:
            parent = inp.parent
            while parent is not None:
                if parent.tag == "label":
                    has_label = True
                    break
                parent = parent.parent
                
        if not has_label:
            inputs_without_label += 1
            
    if inputs_without_label > 0:
        errors += inputs_without_label
        issues.append(f"Detetados {inputs_without_label} inputs de formulário sem label associada.")

    # 3. Verificar links vazios ou sem texto descritivo
    links = tree.css("a")
    empty_links = 0
    for link in links:
        link_text = link.text(strip=True)
        if not link_text and not link.css("img"):
            empty_links += 1
            
    if empty_links > 0:
        warnings += empty_links
        issues.append(f"Detetados {empty_links} links vazios (sem texto legível).")

    # 4. Verificar estrutura de hierarquia de Headings
    headings = tree.css("h1, h2, h3, h4, h5, h6")
    heading_levels = []
    for h in headings:
        level = int(h.tag[1])
        heading_levels.append(level)
        
    has_h1 = 1 in heading_levels
    if not has_h1:
        warnings += 1
        issues.append("Página não contém uma tag <h1> principal.")
        
    # Verificar saltos na hierarquia (ex: h1 direto para h3)
    leaps = 0
    for i in range(len(heading_levels) - 1):
        if heading_levels[i+1] - heading_levels[i] > 1:
            leaps += 1
            
    if leaps > 0:
        warnings += leaps
        issues.append(f"Detetados {leaps} saltos incorretos na hierarquia de cabeçalhos (ex: H1 para H3).")

    # 5. Verificar atributo lang em <html>
    html_tag = tree.css_first("html")
    has_lang = False
    if html_tag:
        has_lang = "lang" in html_tag.attributes
        
    if not has_lang:
        errors += 1
        issues.append("Tag <html> não possui o atributo 'lang' de idioma.")

    # Fórmulas de decaimento exponencial
    # score = 100 * e^(-0.07 * errors) * (1 - 0.03 * warnings)
    base_calc = 100.0 * math.exp(-0.07 * errors)
    final_score = base_calc * (1.0 - 0.03 * warnings)
    final_score = max(0.0, min(100.0, final_score))
    
    return {
        "score": round(final_score, 1),
        "errors": errors,
        "warnings": warnings,
        "issues": issues,
        "details": {
            "images_without_alt": images_without_alt,
            "inputs_without_label": inputs_without_label,
            "empty_links": empty_links,
            "has_h1": has_h1
        }
    }

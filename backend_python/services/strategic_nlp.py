import re
from typing import Dict, Any

def analyze_strategic_nlp(html_content: str, website: str = "") -> Dict[str, Any]:
    """Análise heurística de NLP para definir Tom de Voz, Fragilidade Digital e Nível de Urgência."""
    if not html_content:
        return {
            "tone": "neutral",
            "urgency": "MÉDIA",
            "fragility_score": 50,
            "digital_fragility": ["Incapaz de extrair HTML para análise."],
            "pitch_recommendation": "Garantir uma abordagem elegante focando na criação urgente de canais de contacto."
        }
        
    lower_html = html_content.lower()
    
    # 1. Determinação de Tom de Voz
    tone = "neutral"
    if any(k in lower_html for k in ["luxo", "exclusivo", "premium", "premium", "alta costura", "boutique", "luxury"]):
        tone = "luxury"
    elif any(k in lower_html for k in ["família", "familia", "crianças", "acolhedor", "casa", "tradicional"]):
        tone = "family"
    elif any(k in lower_html for k in ["inovação", "moderno", "tecnologia", "startup", "rápido", "ia", "ai"]):
        tone = "modern"
    elif any(k in lower_html for k in ["popular", "barato", "desconto", "promoção", "promocao", "melhor preço"]):
        tone = "popular"
    elif any(k in lower_html for k in ["corporativo", "profissional", "legal", "advogado", "consultor", "ética"]):
        tone = "professional"

    # 2. Fragilidade Digital (Placeholder lorem ipsum, copyright antigo)
    fragilities = []
    fragility_score = 0
    
    if "lorem ipsum" in lower_html:
        fragilities.append("Contém texto placeholder 'Lorem Ipsum'.")
        fragility_score += 30
        
    # Verificar copyrights desatualizados (anterior a 2025/2026)
    match_yr = re.search(r"©\s*(201\d|202[0-4])", html_content)
    if match_yr:
        fragilities.append(f"Copyright desatualizado detetado: {match_yr.group(0)}.")
        fragility_score += 20
        
    if "politica de privacidade" not in lower_html and "privacidade" not in lower_html:
        fragilities.append("Falta de link visível para a Política de Privacidade (RGPD).")
        fragility_score += 20
        
    if "cookies" not in lower_html:
        fragilities.append("Banner de consentimento de Cookies ausente.")
        fragility_score += 15

    # 3. Urgência do Pitch
    if fragility_score >= 50:
        urgency = "CRÍTICA"
    elif fragility_score >= 30:
        urgency = "ALTA"
    elif fragility_score >= 15:
        urgency = "MÉDIA"
    else:
        urgency = "BAIXA"

    # 4. Pitch Recommendation
    pitch_map = {
        "luxury": "Enfatize a exclusividade e a experiência impecável do utilizador sem focar no custo técnico. Mostre como a lentidão afasta clientes premium.",
        "family": "Apresente uma proposta amigável e segura, focada na segurança do cliente e na facilidade de contacto via WhatsApp.",
        "modern": "Foque no ROI, em tecnologias modernas e em acelerar o tempo de carregamento com as últimas ferramentas de Cloud Run.",
        "popular": "Demonstre diretamente como a melhoria técnica vai aumentar o volume de conversão e reter tráfego de promoções de forma imediata.",
        "professional": "Baseie o pitch na conformidade rigorosa com o RGPD (Cookies/SSL) e na autoridade técnica necessária para transmitir confiança legal/corporativa.",
        "neutral": "Apresente os benefícios gerais de otimização de velocidade, SEO local e canais de contacto."
    }
    
    pitch = pitch_map.get(tone, pitch_map["neutral"])
    if fragilities:
        pitch += f" Destaque urgentemente a correção de: {', '.join(fragilities[:2])}"

    return {
        "tone": tone,
        "urgency_level": urgency,
        "fragility_score": min(100, fragility_score),
        "digital_fragility": fragilities if fragilities else ["Sem fragilidades críticas visíveis."],
        "pitch_recommendation": pitch
    }
stream = None

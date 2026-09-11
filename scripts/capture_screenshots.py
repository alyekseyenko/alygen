import json
import time
from playwright.sync_api import sync_playwright

demo_leads = [
    {
        "id": "1",
        "name": "Apex Global Legal Partners",
        "website": "apex-legalpartners.com",
        "type": "Advocacia / Legal Services",
        "phone": "+351 21 000 9876",
        "email": "contact@apex-legalpartners.com",
        "city": "Lisboa",
        "district": "Lisboa",
        "rating": 4.9,
        "reviews": 128,
        "agent_intel": "DuckDuckGo Market Intelligence indicates direct rivals in Lisbon corporate law dominate regional search with Schema.org LegalService and llms.txt integrations. Apex Global Legal Partners is currently missing AI crawler accessibility, presenting a high-conversion sales hook.",
        "analysis": {
            "performanceMobile": 42,
            "seo": { "score": 68 },
            "security": { "score": 85, "ssl": True, "hasSSL": True, "hsts": True, "hasHSTS": True, "hasCSP": False },
            "accessibility": { "score": 74, "errors": 2, "warnings": 5 },
            "gdpr": { "score": 60, "hasPrivacyPolicy": True, "hasCookiePolicy": False, "hasConsentBanner": False },
            "pixelDetails": { "totalTracking": 2, "facebook": False, "ga4": True, "gtm": False, "hotjar": False },
            "qScore": { "technical": 58, "grade": "C", "score": 58 },
            "priority": "HIGH",
            "audit_phase": 2,
            "strategicInsights": {
                "strategic_recommendation": "Dominance in Lisbon commercial law requires cutting mobile latency under 2.0s and deploying JSON-LD LegalService schema for generative AI engine citations.",
                "vulnerabilities": ["Critical Mobile Latency (4.2s)", "Missing llms.txt Indexing", "No Cookie Consent Banner", "WCAG Color Contrast Errors"]
            },
            "ml_prediction": {
                "conversion_probability": 88,
                "tier": "HOT",
                "recommendation": "High propensity for corporate redesign & automated AI client intake workflows.",
                "confidence": "High (0.91)"
            },
            "pricing": {
                "total": 3850,
                "marketComparison": { "percentageSaved": 35 }
            }
        }
    },
    {
        "id": "2",
        "name": "Luxe Living Real Estate",
        "website": "luxeliving-cascais.pt",
        "type": "Luxury Real Estate",
        "phone": "+351 91 234 5678",
        "email": "geral@luxeliving.pt",
        "city": "Cascais",
        "district": "Lisboa",
        "rating": 4.8,
        "reviews": 94,
        "analysis": {
            "performanceMobile": 38,
            "seo": { "score": 52 },
            "security": { "score": 60, "ssl": True },
            "accessibility": { "score": 55 },
            "pixelDetails": { "totalTracking": 1, "facebookPixel": False, "googleAnalytics": False },
            "qScore": { "technical": 49, "grade": "D", "score": 49 },
            "priority": "CRITICAL",
            "audit_phase": 2,
            "ml_prediction": {
                "close_probability": 92,
                "priority": "HIGH",
                "recommendation": "Critical: Slow mobile experience and missing luxury property tracking."
            },
            "pricing": {
                "total": 4500,
                "marketComparison": { "percentageSaved": 40 }
            }
        }
    },
    {
        "id": "3",
        "name": "Clínica Estética & Longevidade",
        "website": "clinicaestetica-porto.pt",
        "type": "Healthcare & Wellness",
        "phone": "+351 22 456 7890",
        "email": "info@clinicaestetica.pt",
        "city": "Porto",
        "district": "Porto",
        "rating": 5.0,
        "reviews": 210,
        "analysis": {
            "performanceMobile": 78,
            "seo": { "score": 88 },
            "security": { "score": 90, "ssl": True },
            "accessibility": { "score": 82 },
            "pixelDetails": { "totalTracking": 5, "facebookPixel": True, "googleAnalytics": True },
            "qScore": { "technical": 84, "grade": "A", "score": 84 },
            "priority": "LOW",
            "audit_phase": 2,
            "ml_prediction": {
                "close_probability": 64,
                "priority": "MEDIUM",
                "recommendation": "High technical baseline. Strong candidate for WhatsApp automation."
            },
            "pricing": {
                "total": 2200,
                "marketComparison": { "percentageSaved": 25 }
            }
        }
    },
    {
        "id": "4",
        "name": "Serralharia Moderna do Norte",
        "website": "serralhariamoderna.pt",
        "type": "Industrial & Manufacturing",
        "phone": "+351 253 111 222",
        "email": "comercial@serralhariamoderna.pt",
        "city": "Braga",
        "district": "Braga",
        "rating": 4.6,
        "reviews": 42,
        "analysis": {
            "performanceMobile": 28,
            "seo": { "score": 35 },
            "security": { "score": 40, "ssl": False },
            "accessibility": { "score": 30 },
            "pixelDetails": { "totalTracking": 0, "facebookPixel": False, "googleAnalytics": False },
            "qScore": { "technical": 32, "grade": "F", "score": 32 },
            "priority": "CRITICAL",
            "audit_phase": 2,
            "ml_prediction": {
                "close_probability": 95,
                "priority": "HIGH",
                "recommendation": "Missing SSL certificate and mobile layout broken."
            },
            "pricing": {
                "total": 3100,
                "marketComparison": { "percentageSaved": 45 }
            }
        }
    },
    {
        "id": "5",
        "name": "Algarve Nautical Charter",
        "website": "algarvecharter.com",
        "type": "Tourism & Luxury Charters",
        "phone": "+351 289 999 888",
        "email": "bookings@algarvecharter.com",
        "city": "Faro",
        "district": "Faro",
        "rating": 4.9,
        "reviews": 315,
        "analysis": {
            "performanceMobile": 65,
            "seo": { "score": 75 },
            "security": { "score": 80, "ssl": True },
            "accessibility": { "score": 70 },
            "pixelDetails": { "totalTracking": 4, "facebookPixel": True, "googleAnalytics": True },
            "qScore": { "technical": 72, "grade": "B", "score": 72 },
            "priority": "MEDIUM",
            "audit_phase": 2,
            "ml_prediction": {
                "close_probability": 78,
                "priority": "MEDIUM",
                "recommendation": "Solid baseline, massive expansion potential with online instant booking."
            },
            "pricing": {
                "total": 2900,
                "marketComparison": { "percentageSaved": 30 }
            }
        }
    }
]

demo_pipeline = [
    {
        "id": "1",
        "name": "Apex Global Legal Partners",
        "website": "apex-legalpartners.com",
        "crm_stage": "PROPOSTA",
        "budget": 5550.00,
        "contact_person": "Dr. Alexandre Mendes",
        "client_email": "alexandre.mendes@apex-legalpartners.com",
        "client_phone": "+351 21 000 9876",
        "project_type": "AUTOMATION",
        "is_immune": True,
        "discount_percentage": 10.0,
        "budget_items": [
            {"name": "Digital Identity & High-Converting UI Strategy", "price": 1250, "description": "Swiss Minimalist design engineered for legal authority."},
            {"name": "AI Process Automation Engine (Node.js/Python)", "price": 2800, "description": "Asynchronous pipeline for automated client intake and scheduling."},
            {"name": "CRM Customization & Multi-Channel Funnel", "price": 1500, "description": "Advanced sales tracking, telemetry & automated sequence dispatch."}
        ]
    },
    {
        "id": "2",
        "name": "Luxe Living Real Estate",
        "website": "luxeliving-cascais.pt",
        "crm_stage": "REUNIAO",
        "budget": 4500.00,
        "contact_person": "Gonçalo Ribeiro",
        "client_email": "geral@luxeliving.pt",
        "client_phone": "+351 91 234 5678",
        "project_type": "WEBSITE",
        "is_immune": True,
        "discount_percentage": 5.0,
        "budget_items": [
            {"name": "Ultra-Fast Luxury Property Portal", "price": 3500, "description": "Lighthouse 95+ score with interactive map search."},
            {"name": "Meta Pixel & Google Analytics 4 Retargeting Setup", "price": 1000, "description": "Conversion API setup for high-net-worth real estate leads."}
        ]
    },
    {
        "id": "3",
        "name": "Clínica Estética & Longevidade",
        "website": "clinicaestetica-porto.pt",
        "crm_stage": "GANHO",
        "budget": 2800.00,
        "contact_person": "Dr. Mariana Sousa",
        "client_email": "mariana@clinicaestetica.pt",
        "client_phone": "+351 22 456 7890",
        "project_type": "MARKETING",
        "is_immune": True,
        "discount_percentage": 0.0,
        "budget_items": [
            {"name": "WhatsApp Booking Automation & Follow-Up", "price": 1800, "description": "Instant 24/7 consultation scheduling system."},
            {"name": "Local SEO & Google Maps Hyper-Optimization", "price": 1000, "description": "Dominance in top 3 local pack searches for Porto."}
        ]
    },
    {
        "id": "4",
        "name": "Serralharia Moderna do Norte",
        "website": "serralhariamoderna.pt",
        "crm_stage": "LEAD",
        "budget": 3100.00,
        "contact_person": "Eng. Manuel Ferreira",
        "client_email": "comercial@serralhariamoderna.pt",
        "client_phone": "+351 253 111 222",
        "project_type": "WEBSITE",
        "is_immune": True,
        "discount_percentage": 0.0,
        "budget_items": [
            {"name": "Complete Modern Web Reconstruction & SSL", "price": 3100, "description": "Secure, mobile-responsive catalog of metal constructions."}
        ]
    },
    {
        "id": "5",
        "name": "Algarve Nautical Charter",
        "website": "algarvecharter.com",
        "crm_stage": "CONTACTADO",
        "budget": 2900.00,
        "contact_person": "Capt. James Wilson",
        "client_email": "bookings@algarvecharter.com",
        "client_phone": "+351 289 999 888",
        "project_type": "AUTOMATION",
        "is_immune": True,
        "discount_percentage": 0.0,
        "budget_items": [
            {"name": "Online Boat Charter Booking Engine", "price": 2900, "description": "Multi-currency Stripe integration with live calendar."}
        ]
    }
]

demo_automations = [
    {
        "id": "auto_1",
        "name": "Critical Lead Instant WhatsApp Outreach",
        "description": "Triggered when Q-Score < 50 and priority is CRITICAL to dispatch diagnostic pitch.",
        "is_active": True,
        "trigger": {"type": "q_score_threshold", "condition": "less_than", "value": 50},
        "actions": [{"type": "send_whatsapp_alert"}, {"type": "create_crm_deal"}],
        "created_at": "2026-09-10T12:00:00Z"
    },
    {
        "id": "auto_2",
        "name": "VIP Medical & Law Firm Tailored Proposal",
        "description": "Automatically generates personalized PDF proposals for legal and clinic leads.",
        "is_active": True,
        "trigger": {"type": "sector_match", "sectors": ["Advocacia", "Saúde"]},
        "actions": [{"type": "generate_enterprise_pdf"}, {"type": "assign_to_senior_agent"}],
        "created_at": "2026-09-12T14:30:00Z"
    }
]

demo_report_analysis = {
    "id": "1",
    "company_name": "Apex Global Legal Partners",
    "website": "apex-legalpartners.com",
    "qScore": { "technical": 58, "grade": "C", "score": 58 },
    "aiWinRate": 88,
    "salesHook": "Apex Global Legal Partners is losing high-ticket corporate clients in Lisbon to regional benchmark competitors due to a 4.2s mobile loading latency and zero AI bot crawler indexing.",
    "agent_intel": "DuckDuckGo Market Intelligence indicates regional benchmark firms in Lisbon have deployed active Schema.org LegalService and llms.txt integrations. Apex Global Legal Partners currently has 0 tracking pixels and fails WCAG accessibility compliance.",
    "coreWebVitals": {
        "lcp": { "value": 4.2, "displayValue": "4.2s", "score": 42 },
        "inp": { "value": 180, "displayValue": "180ms", "score": 75 },
        "cls": { "value": 0.08, "displayValue": "0.08", "score": 92 },
        "ttfb": { "value": 920, "displayValue": "920ms", "score": 45 }
    },
    "aeo": {
        "score": 62,
        "factors": {
            "hasLlmsTxt": False,
            "aiBotsBlocked": False,
            "hasSchema": True,
            "schemaTypes": ["LegalService", "Organization", "LocalBusiness"],
            "searchRank": "Rank #4 in Lisbon Legal Pack",
            "aiSearchVisibility": 45
        },
        "recommendations": [
            "CRÍTICO: Deploy llms.txt and JSON-LD LegalService schema to ensure Perplexity and ChatGPT can cite Apex Global Legal Partners.",
            "CRÍTICO: Upgrade mobile performance to reduce LCP from 4.2s to sub-2.0s.",
            "Implement GDPR compliant cookie consent banner with CSP headers."
        ]
    },
    "lead_data": {
        "rating": 4.9,
        "reviews_count": 128
    },
    "security": {
        "score": 85,
        "hasSSL": True,
        "hasCSP": False,
        "hasHSTS": True
    },
    "gdpr": {
        "score": 60,
        "hasPrivacyPolicy": True,
        "hasCookiePolicy": False,
        "hasConsentBanner": False
    },
    "accessibility": {
        "score": 74,
        "errors": 2,
        "warnings": 5
    },
    "pixelDetails": {
        "totalTracking": 2,
        "facebook": False,
        "ga4": True,
        "gtm": False,
        "hotjar": False
    },
    "sheet_metadata": {
        "type": "Law Firm / Sociedade de Advogados",
        "types": "Corporate Law, M&A Advisory, Tax Litigation",
        "unclaimed_listing": "false",
        "price": "€€€€",
        "operating_hours": "Mon-Fri: 09:00 - 19:00\nSat-Sun: Closed",
        "service_options": "Online consultations, On-site services",
        "address": "Av. da Liberdade 180, 1250-096 Lisboa",
        "gps_coordinates": "38.7223° N, 9.1393° W",
        "description": "Leading corporate law firm specializing in cross-border M&A transactions, corporate governance, and tax litigation."
    }
}

def handle_route(route):
    url = route.request.url
    if "/fetch-leads" in url:
        route.fulfill(
            status=200,
            content_type="application/json",
            body=json.dumps({"success": True, "data": demo_leads})
        )
    elif "/contacts-log" in url:
        route.fulfill(
            status=200,
            content_type="application/json",
            body=json.dumps({"success": True, "data": []})
        )
    elif "/supabase/analyses" in url:
        route.fulfill(
            status=200,
            content_type="application/json",
            body=json.dumps({"success": True, "data": demo_pipeline})
        )
    elif "/supabase/analysis/" in url:
        route.fulfill(
            status=200,
            content_type="application/json",
            body=json.dumps({"success": True, "data": demo_report_analysis})
        )
    elif "/automations" in url:
        route.fulfill(
            status=200,
            content_type="application/json",
            body=json.dumps({"success": True, "data": demo_automations})
        )
    else:
        route.continue_()

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 1440, "height": 900},
            device_scale_factor=2
        )
        page = context.new_page()
        page.route("**/api/**", handle_route)

        # 1. Main Dashboard
        print("Capturing 1. Main Leads Suite...")
        page.goto("http://localhost:4005", wait_until="networkidle")
        page.wait_for_timeout(2500)
        page.screenshot(path="docs/assets/dashboard-main.png")

        # 2. Lead Drawer opened on Technical Audit tab
        print("Capturing 2. Lead Drawer Audit with Multi-Agent Intel...")
        apex_row = page.locator('tbody tr:has-text("Apex Global")')
        if apex_row.count() > 0:
            apex_row.first.click()
        else:
            page.locator("tbody tr").first.click()
        page.wait_for_timeout(1500)
        # Switch to Technical Audit tab
        tech_tab = page.locator('button[role="tab"]:has-text("Technical Audit")')
        if tech_tab.is_visible():
            tech_tab.click()
            page.wait_for_timeout(2000)
        page.screenshot(path="docs/assets/lead-audit-drawer.png")

        # 3. Interactive Client Audit Report Page
        print("Capturing 3. Client Audit Report Page...")
        page.goto("http://localhost:4005/report/apex-legalpartners.com", wait_until="networkidle")
        page.wait_for_timeout(3000)
        page.screenshot(path="docs/assets/client-audit-report.png")

        # 4. Pipeline / Funil
        print("Capturing 4. Sales Pipeline...")
        page.goto("http://localhost:4005/funil", wait_until="networkidle")
        page.wait_for_timeout(2500)
        page.screenshot(path="docs/assets/sales-pipeline.png")

        # 5. Automations
        print("Capturing 5. Visual Automator...")
        page.goto("http://localhost:4005/automacao", wait_until="networkidle")
        page.wait_for_timeout(2500)
        page.screenshot(path="docs/assets/visual-automations.png")

        browser.close()
        print("All screenshots captured successfully!")

if __name__ == "__main__":
    run()

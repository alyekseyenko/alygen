-- INSERIR DEAL DE DEMONSTRAÇÃO (ELITE CORPORATE)
-- Este script cria uma lead fictícia "MVA Advogados" com dados completos para gerar uma proposta de exemplo.

INSERT INTO lead_analyses (
  name, website, crm_stage, budget, contact_person, client_email, 
  project_type, is_immune, discount_percentage, budget_items, 
  third_party_services, private_notes, created_at
) VALUES (
  'MVA Advogados & Associados', 
  'mva-advogados.pt', 
  'PROPOSTA', 
  5550.00,  -- (1250 + 2800 + 1500) = 5550 antes de desconto
  'Dra. Teresa Almeida', 
  'teresa.almeida@mva-advogados.pt', 
  'AUTOMATION', 
  true, 
  10.00,    -- 10% de Benefício Comercial
  '[
    {"name": "Design de Identidade Digital & UI Strategy", "price": 1250, "description": "Arquitetura visual Swiss Brutalist e design de interface focado em conversão e autoridade jurídica."},
    {"name": "Engine de Automação de Processos (Node.js)", "price": 2800, "description": "Desenvolvimento do motor de inteligência e integração de fluxos assíncronos para gestão de processos."},
    {"name": "Customização de CRM e Fluxos Pipedrive", "price": 1500, "description": "Configuração avançada de funis, automações de e-mail e tracking de performance nativo."}
  ]'::jsonb,
  '[
    {"name": "Pipedrive (Plano Professional)", "price": 468.00, "description": "Licença anual. Inclui gestão avançada de deals e automação de comunicações."},
    {"name": "Cloud Hosting Premium (SME Plan)", "price": 26.04, "description": "Servidor seguro com backups diários e redundância geográfica."},
    {"name": "Make.com (Workflow Operations)", "price": 100.80, "description": "Subscrição mensal para 10k operações de automação de dados."}
  ]'::jsonb,
  'Cliente premium do setor jurídico. Exige conformidade RGPD total (Matriz RACI MVA) e segurança via Bitwarden (Cláusula 08-A). Link encriptado obrigatório.',
  NOW()
);

-- NOTA: Após correr este script, podes fazer refresh no Pipeline do CRM e o deal aparecerá na coluna "Proposta Enviada".

-- INSERIR DEAL DE DEMONSTRAÇÃO (dados fictícios — substitua por valores de teste locais)
-- Não use dados reais de clientes neste ficheiro versionado.

INSERT INTO lead_analyses (
  name, website, crm_stage, budget, contact_person, client_email,
  project_type, is_immune, discount_percentage, budget_items,
  third_party_services, private_notes, created_at
) VALUES (
  'Escritório Demo & Associados',
  'exemplo-escritorio.pt',
  'PROPOSTA',
  5550.00,
  'Contacto Demo',
  'contacto@exemplo-escritorio.pt',
  'AUTOMATION',
  true,
  10.00,
  '[
    {"name": "Design de Identidade Digital & UI Strategy", "price": 1250, "description": "Arquitetura visual e design de interface focado em conversão."},
    {"name": "Engine de Automação de Processos (Node.js)", "price": 2800, "description": "Motor de integração e fluxos assíncronos."},
    {"name": "Customização de CRM e Fluxos", "price": 1500, "description": "Configuração de funis e automações de e-mail."}
  ]'::jsonb,
  '[
    {"name": "CRM SaaS (Plano Professional)", "price": 468.00, "description": "Licença anual estimada."},
    {"name": "Cloud Hosting Premium", "price": 26.04, "description": "Servidor com backups diários."},
    {"name": "Automação (Workflow Operations)", "price": 100.80, "description": "Subscrição mensal estimada."}
  ]'::jsonb,
  'Lead de demonstração para ambiente local. Notas internas fictícias.',
  NOW()
);

-- Após correr este script, faça refresh no Pipeline do CRM.

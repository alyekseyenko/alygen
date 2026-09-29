# Visão técnica Alygen CRM (2026)

## North star
Webapp B2B profissional para prospeção digital em PT-PT: auditoria técnica, inteligência de mercado agêntica, automações com aprovação humana e conformidade RGPD.

## Pilares
1. **Postgres local + pgvector** — fonte única de verdade (sem Supabase em runtime).
2. **Spec-driven** — `specs/` antes de código; ADRs para decisões.
3. **Agentes** — pipeline Investigador → Estrategista → Sintetizador; prompts YAML; evals no CI.
4. **RAG** — documentos de nicho + híbrido vetor/keyword; contexto injetado no FastAPI.
5. **MCP** — CRM expõe ferramentas; agentes podem consumir MCPs externos (allowlist).
6. **Empresa** — JWT, audit log, backups `scripts/backup-pg.sh`, Docker prod (`Dockerfile.prod`).

## Próximos incrementos
- Fine-tune copy apenas após ≥500 aprovações em `ai_generations`.
- Retirar Flask `microservices.py` quando tráfego 100% FastAPI.
- OpenAPI gerado automaticamente a partir de Zod.

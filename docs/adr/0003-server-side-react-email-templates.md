# ADR 0003: Renderização Server-Side de Emails com React Email

## Contexto & Problema
O pipeline de automação do Alygen CRM necessita de enviar propostas comerciais, auditorias de performance e follow-ups visualmente ricos em formato HTML para os decisores.
Tradicionalmente, templates de email em Node.js são mantidos como strings concatenadas ou templates Handlebars/Mustache, que sofrem de:
1. Falta de tipagem e validação estática.
2. Incompatibilidade com clientes de email rígidos (Outlook, Apple Mail, Gmail).
3. Dificuldade de modularização de componentes (botões, tabelas de métricas, scores).

## Decisão Arquitetural
Adotámos o framework `@react-email/components` no backend Node.js (`backend/package.json`), com suporte direto a `react` e `react-dom`.

```
[ Lead Data + Q-Score ] ──► [ React Email Components ] ──► [ HTML SSR ] ──► [ Nodemailer / SMTP ]
```

## Consequências & Trade-offs
### Vantagens:
- **Design System Unificado:** O mesmo design system moderno utilizado no frontend é refletido nos emails enviados aos clientes.
- **Segurança:** Escaping automático de tags HTML evita injeção de código malicioso nos templates de email.
- **Manutenibilidade:** Cada secção do email (Score, Métricas, Call-to-Action) é um componente reutilizável.

### Custos:
- Requer `react` e `react-dom` declarados como dependências de runtime no `backend/package.json`.
- Auditorias superficiais podem presumir erradamente que `react` no backend é uma dependência residual desnecessária.

## Estado
**Aceite (Staff Level Approved)** — Justificado pela utilização ativa do `@react-email/components`.

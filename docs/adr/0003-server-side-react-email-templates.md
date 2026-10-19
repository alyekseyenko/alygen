# ADR 0003: Server-side email rendering with React Email

## Context & problem
The Alygen CRM automation pipeline sends rich HTML proposals, performance audits, and follow-ups to decision-makers.
Traditional Node email templates (concatenated strings, Handlebars/Mustache) suffer from:

1. Weak typing and static validation.
2. Rigid email clients (Outlook, Apple Mail, Gmail).
3. Hard-to-modularise components (buttons, metric tables, scores).

## Decision
Use `@react-email/components` in the Node backend (`backend/package.json`) with `react` and `react-dom`.

```
[ Lead Data + Q-Score ] ──► [ React Email Components ] ──► [ HTML SSR ] ──► [ Nodemailer / SMTP ]
```

## Consequences & trade-offs

### Advantages
- **Unified design system:** Frontend patterns can mirror client-facing emails.
- **Safety:** Automatic HTML escaping reduces injection risk in templates.
- **Maintainability:** Score, metrics, and CTA sections are reusable components.

### Costs
- `react` and `react-dom` as backend runtime dependencies.
- Superficial audits may mislabel React on the backend as unnecessary.

## Status
**Accepted** — Active use of `@react-email/components`.

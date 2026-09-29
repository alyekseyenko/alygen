import { describe, expect, it } from 'vitest';
import {
  shouldRunAuditEnrichment,
  mergeEnrichmentIntoAnalysis,
} from '../services/audit-enrichment.js';

describe('shouldRunAuditEnrichment', () => {
  it('não corre em fase 1', () => {
    expect(
      shouldRunAuditEnrichment({
        targetPhase: 1,
        dataQuality: { html: 'missing' },
        qScore: { confidence: 10 },
        emailList: [],
        phoneList: [],
      })
    ).toBe(false);
  });

  it('corre com confidence baixa', () => {
    expect(
      shouldRunAuditEnrichment({
        targetPhase: 3,
        dataQuality: { html: 'measured' },
        qScore: { confidence: 40 },
        emailList: ['a@b.pt'],
        phoneList: ['912'],
      })
    ).toBe(true);
  });

  it('corre sem contactos', () => {
    expect(
      shouldRunAuditEnrichment({
        targetPhase: 3,
        dataQuality: { html: 'measured', renderedHtml: 'measured' },
        qScore: { confidence: 90 },
        emailList: [],
        phoneList: [],
      })
    ).toBe(true);
  });
});

describe('mergeEnrichmentIntoAnalysis', () => {
  it('eleva prioridade quando agente sugere HIGH', () => {
    const analysis = { priority: 'MÉDIA' };
    mergeEnrichmentIntoAnalysis(analysis, {
      success: true,
      enrichment: {
        suggested_priority: 'HIGH',
        qualification_summary: 'Resumo',
        email_hook: 'Gancho',
        top_defects: [],
      },
    });
    expect(analysis.priority).toBe('ALTA');
    expect(analysis.auditEnrichment).toBeDefined();
  });
});

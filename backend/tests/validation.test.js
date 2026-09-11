import { describe, it, expect, vi } from 'vitest';
import { validateBody } from '../middleware/validate.js';
import { analyzeLeadSchema, sendLeadEmailSchema } from '../schemas/leads.schema.js';

describe('Zod Request Validation Middleware', () => {
  it('deve aprovar payload válido para analyzeLead', () => {
    const middleware = validateBody(analyzeLeadSchema);
    const req = {
      body: {
        url: 'https://clinicaexemplo.pt',
        forceReanalyze: true,
        phase: 2
      }
    };
    const res = {};
    const next = vi.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.body.url).toBe('https://clinicaexemplo.pt');
  });

  it('deve rejeitar payload sem URL com status 400 e INVALID_PAYLOAD', () => {
    const middleware = validateBody(analyzeLeadSchema);
    const req = {
      body: {
        forceReanalyze: true
      }
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    const next = vi.fn();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        code: 'INVALID_PAYLOAD'
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('deve rejeitar email inválido no sendLeadEmail', () => {
    const middleware = validateBody(sendLeadEmailSchema);
    const req = {
      body: {
        recipient: 'nao-e-um-email'
      }
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    const next = vi.fn();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'INVALID_PAYLOAD'
      })
    );
  });
});

describe('Automation Workflow Zod Schemas', () => {
  it('valida com sucesso um workflow bem-formado com nós e arestas', async () => {
    const { WorkflowSchema } = await import('../schemas/automation.schema.js');
    const validWorkflow = {
      nodes: [
        { id: '1', type: 'trigger', data: { event: 'lead_analyzed' } },
        { id: '2', type: 'action', data: { action: 'send_email' } }
      ],
      edges: [
        { id: 'e1-2', source: '1', target: '2' }
      ]
    };

    const result = WorkflowSchema.safeParse(validWorkflow);
    expect(result.success).toBe(true);
  });

  it('rejeita workflow sem nós', async () => {
    const { WorkflowSchema } = await import('../schemas/automation.schema.js');
    const invalidWorkflow = {
      nodes: [],
      edges: []
    };

    const result = WorkflowSchema.safeParse(invalidWorkflow);
    expect(result.success).toBe(false);
  });
});


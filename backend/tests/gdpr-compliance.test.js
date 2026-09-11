import { describe, it, expect, vi } from 'vitest';
import { eraseLead, unsubscribeLead, cleanupDataRetention } from '../controllers/leads.controller.js';
import { generateEmailTemplate } from '../services/email-template.js';

describe('🛡️ RGPD / EU Compliance & Data Protection Suite', () => {

  describe('Unsubscribe & Opt-out (RGPD)', () => {
    it('should return 400 when neither email nor website is provided', async () => {
      const req = { query: {}, body: {}, accepts: vi.fn().mockReturnValue(false) };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      };

      await unsubscribeLead(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: expect.stringContaining('obrigatório')
      }));
    });

    it('should process unsubscribe for valid email (JSON response)', async () => {
      const req = {
        query: { email: 'cliente@exemplo.pt' },
        body: {},
        accepts: vi.fn().mockReturnValue(false),
        method: 'GET'
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      };

      await unsubscribeLead(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        email: 'cliente@exemplo.pt'
      }));
    });

    it('should return HTML confirmation page when browser navigates to unsubscribe', async () => {
      const req = {
        query: { email: 'lead@empresa.pt' },
        body: {},
        accepts: vi.fn((type) => type === 'html'),
        method: 'GET'
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        send: vi.fn()
      };

      await unsubscribeLead(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalled();
      const htmlContent = res.send.mock.calls[0][0];
      expect(htmlContent).toContain('Subscrição Cancelada');
      expect(htmlContent).toContain('lead@empresa.pt');
      expect(htmlContent).toContain('RGPD');
    });
  });

  describe('Right to Erasure (RGPD Art. 17)', () => {
    it('should return 400 if no target lead identifier is supplied', async () => {
      const req = { params: {}, body: {} };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      };

      await eraseLead(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false
      }));
    });

    it('should successfully execute erasure for a given lead domain', async () => {
      const req = { params: { website: 'test-gdpr-erasure.pt' }, body: {} };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      };

      await eraseLead(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: expect.stringContaining('Art. 17.º')
      }));
    });
  });

  describe('Data Retention Policy & Cleanup (RGPD Art. 5)', () => {
    it('should accept retention cleanup triggers with retention days parameter', async () => {
      const req = { body: { retentionDays: 180 } };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      };

      await cleanupDataRetention(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        retentionDays: 180
      }));
    });
  });

  describe('Email Templates RGPD Legal Notice & Parameterization', () => {
    it('should generate template containing RGPD disclaimer and parameterized sender info', async () => {
      const mockAnalysis = {
        url: 'https://exemplo.pt',
        overallScore: 68,
        performanceMobile: 42,
        seo: { score: 55 },
        security: { score: 80, hasSsl: true },
        accessibility: { score: 70 },
        pixelDetails: { totalTracking: 1 }
      };
      const mockLeadData = {
        name: 'Clínica Exemplo',
        website: 'https://exemplo.pt',
        email: 'info@exemplo.pt',
        city: 'Porto'
      };

      const template = await generateEmailTemplate(mockAnalysis, mockLeadData);

      expect(template).toHaveProperty('subject');
      expect(template).toHaveProperty('html');
      expect(template).toHaveProperty('text');

      // Check RGPD/GDPR compliance footer in email
      expect(template.html).toMatch(/RGPD|GDPR/);
      expect(template.html).toContain('/api/unsubscribe');

      // Ensure no private hardcoded identities exist by default
      expect(template.html).not.toContain('omonbox');
      expect(template.html).not.toContain('vadym_alyekseyenko');
    });
  });

});

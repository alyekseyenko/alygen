import { z } from 'zod';

export const analyzeLeadSchema = z.object({
  url: z.string().min(1, 'URL é obrigatória'),
  leadData: z.record(z.any()).optional(),
  forceReanalyze: z.boolean().optional(),
  phase: z.number().int().min(1).max(3).optional()
});

export const sendLeadEmailSchema = z.object({
  recipient: z.string().email('Destinatário deve ser um email válido'),
  leadId: z.union([z.string(), z.number()]).optional(),
  emailBody: z.string().optional(),
  analysis: z.record(z.any()).optional(),
  leadData: z.record(z.any()).optional()
});

export const updateEmailSchema = z.object({
  website: z.string().min(1, 'Website é obrigatório'),
  email: z.string().email('Email deve ter um formato válido')
});

export const promoteLeadSchema = z.object({
  website: z.string().min(1, 'Website é obrigatório'),
  stage: z.string().optional()
});

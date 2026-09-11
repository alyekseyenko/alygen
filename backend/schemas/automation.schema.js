import { z } from 'zod';

export const NodeSchema = z.object({
  id: z.string().min(1, 'ID do nó é obrigatório'),
  type: z.string().min(1, 'Tipo do nó é obrigatório'),
  data: z.record(z.any()).optional().default({}),
  position: z.object({
    x: z.number().optional(),
    y: z.number().optional()
  }).optional()
});

export const EdgeSchema = z.object({
  id: z.string().optional(),
  source: z.string().min(1, 'ID de origem da conexão é obrigatório'),
  target: z.string().min(1, 'ID de destino da conexão é obrigatório'),
  sourceHandle: z.string().nullable().optional(),
  targetHandle: z.string().nullable().optional()
});

export const WorkflowSchema = z.object({
  nodes: z.array(NodeSchema).min(1, 'O fluxo deve conter pelo menos um nó'),
  edges: z.array(EdgeSchema).optional().default([])
});

export const AutomationSchema = z.object({
  id: z.union([z.string(), z.number()]),
  name: z.string().min(1, 'Nome da automação é obrigatório'),
  workflow_data: WorkflowSchema,
  active: z.boolean().optional()
});

/**
 * Servidor MCP do Alygen CRM — expõe leads e inteligência às ferramentas externas (Cursor, Claude Desktop).
 * Arranque: node backend/mcp/server.js
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import db from '../services/local-db-service.js';
import { getMarketIntelMultiAgent } from '../services/python-bridge.js';

const API_KEY = process.env.ALYGEN_API_KEY;

function assertAuth(extra) {
  if (!API_KEY) return;
  const key = extra?.auth?.apiKey || extra?.headers?.['x-api-key'];
  if (key !== API_KEY) throw new Error('Não autorizado');
}

const server = new Server(
  { name: 'alygen-crm', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'search_leads',
      description: 'Pesquisa leads na base local por nome, website ou cidade.',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string' },
          limit: { type: 'number', default: 10 },
        },
        required: ['query'],
      },
    },
    {
      name: 'get_lead_context',
      description: 'Devolve análise técnica e agent_intel de um lead pelo website.',
      inputSchema: {
        type: 'object',
        properties: { website: { type: 'string' } },
        required: ['website'],
      },
    },
    {
      name: 'generate_market_intel',
      description: 'Corre o pipeline multi-agente (Investigador → Estrategista → Sintetizador) para um lead.',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          city: { type: 'string' },
          sector: { type: 'string' },
          website: { type: 'string' },
        },
        required: ['name', 'sector'],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  assertAuth(request.params?._meta);
  const { name, arguments: args } = request.params;

  if (name === 'search_leads') {
    const term = `%${args.query}%`;
    const res = await db.query(
      `SELECT id, lead_name, lead_website, lead_city, lead_type, qscore, crm_stage
       FROM lead_analyses
       WHERE lead_name ILIKE $1 OR lead_website ILIKE $1 OR lead_city ILIKE $1
       ORDER BY analyzed_at DESC NULLS LAST
       LIMIT $2`,
      [term, args.limit || 10]
    );
    return { content: [{ type: 'text', text: JSON.stringify(res.rows, null, 2) }] };
  }

  if (name === 'get_lead_context') {
    const res = await db.query('SELECT * FROM lead_analyses WHERE lead_website = $1 LIMIT 1', [args.website]);
    const row = res.rows?.[0];
    if (!row) return { content: [{ type: 'text', text: 'Lead não encontrado' }] };
    return { content: [{ type: 'text', text: JSON.stringify(row, null, 2) }] };
  }

  if (name === 'generate_market_intel') {
    const result = await getMarketIntelMultiAgent(
      args.name,
      args.city || 'Portugal',
      args.sector,
      args.website || ''
    );
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }

  throw new Error(`Ferramenta desconhecida: ${name}`);
});

const transport = new StdioServerTransport();
await server.connect(transport);

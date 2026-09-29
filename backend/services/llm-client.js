import axios from 'axios';
import { getPythonFastApiUrl } from '../config/python-url.js';
import { pythonAuthHeaders } from './python-bridge.js';

const PYTHON_URL = getPythonFastApiUrl();

/**
 * Copy / reasoning via Python FastAPI LLM gateway (Groq + token accounting).
 */
export async function invokePythonLlm({ system = '', user, purpose = 'copy', timeoutMs = 45_000 }) {
  const { data } = await axios.post(
    `${PYTHON_URL}/llm/chat`,
    { system, user, purpose },
    { timeout: timeoutMs, headers: pythonAuthHeaders() }
  );
  if (!data?.success) {
    throw new Error(data?.error || 'LLM gateway failed');
  }
  return { text: data.text, usage: data.usage || {} };
}

export function parseJsonFromLlm(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('empty_llm_response');
  }
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('no_json_in_llm_response');
    // eslint-disable-next-line no-control-regex -- strip control chars from LLM JSON
    const cleaned = jsonMatch[0].replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
    return JSON.parse(cleaned);
  }
}

/**
 * Gateway JSON call with optional ai_generations logging.
 */
export async function invokeLlmJson({
  system = '',
  user,
  purpose = 'reasoning',
  timeoutMs = 45_000,
  agentName = null,
  leadWebsite = null,
  promptVersion = '1.0.0',
}) {
  const started = Date.now();
  const { text, usage } = await invokePythonLlm({ system, user, purpose, timeoutMs });
  const parsed = parseJsonFromLlm(text);
  if (agentName) {
    const { logAiGeneration } = await import('./ai-generations.js');
    await logAiGeneration({
      agentName,
      promptVersion,
      leadWebsite,
      inputContext: { purpose },
      outputText: text.slice(0, 4000),
      model: usage?.model || 'llm_gateway',
      latencyMs: usage?.latency_ms ?? Date.now() - started,
      tokensIn: usage?.tokens_in,
      tokensOut: usage?.tokens_out,
      costEur: usage?.cost_eur,
      degraded: false,
    });
  }
  return parsed;
}

/** Direct Groq fallback when FastAPI gateway is offline. */
export async function invokeGroqChat({
  groqApiKey,
  model,
  messages,
  temperature = 0.3,
  maxTokens = 800,
  timeoutMs = 30_000,
  responseFormat = null,
}) {
  if (!groqApiKey) throw new Error('GROQ_API_KEY missing');
  const body = {
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
  };
  if (responseFormat) body.response_format = responseFormat;
  const { data } = await axios.post(
    'https://api.groq.com/openai/v1/chat/completions',
    body,
    {
      headers: {
        Authorization: `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: timeoutMs,
    }
  );
  const content = data.choices?.[0]?.message?.content ?? '';
  return { text: content, usage: data.usage || {} };
}

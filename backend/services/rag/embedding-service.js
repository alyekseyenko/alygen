import axios from 'axios';

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_EMBED_MODEL || 'nomic-embed-text';
const GEMINI_DIM = 768;

export async function embedText(text) {
  if (!text?.trim()) return null;

  try {
    const { data } = await axios.post(
      `${OLLAMA_URL}/api/embeddings`,
      { model: OLLAMA_MODEL, prompt: text.slice(0, 8000) },
      { timeout: 15000 }
    );
    if (Array.isArray(data?.embedding) && data.embedding.length > 0) {
      return { vector: data.embedding, model: OLLAMA_MODEL, dim: data.embedding.length };
    }
  } catch {
    /* fallback Gemini */
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`;
    const response = await axios.post(
      url,
      { content: { parts: [{ text: text.slice(0, 8000) }] } },
      { timeout: 8000 }
    );
    const values = response.data?.embedding?.values;
    if (Array.isArray(values) && values.length === GEMINI_DIM) {
      return { vector: values, model: 'text-embedding-004', dim: GEMINI_DIM };
    }
  } catch {
    return null;
  }
  return null;
}

export default { embedText };

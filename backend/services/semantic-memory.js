import axios from 'axios';
import { db } from './local-db-service.js';

/**
 * Generates text embeddings using the official Gemini text-embedding-004 model.
 * Gracefully degrades to null if the API is offline or key is missing.
 */
async function generateEmbedding(text) {
  try {
    const apiKey = process.env.GEMINI_API_KEY || '';
    if (!apiKey) return null;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`;
    const response = await axios.post(url, {
      content: {
        parts: [{ text: text }]
      }
    }, { timeout: 5000 });

    const embedding = response.data?.embedding?.values;
    if (Array.isArray(embedding) && embedding.length === 1536) {
      return embedding;
    }
    return null;
  } catch (err) {
    console.warn('⚠️ [Semantic Memory] Failed to generate embedding via Gemini API, falling back to text-only mode:', err.message);
    return null;
  }
}

export const semanticMemoryService = {
  /**
   * Registers a new lead's intelligence result into the semantic memory database.
   */
  async saveMemory({ sector, district, companyName, website, painPoints, competitors }) {
    try {
      const textToEmbed = `${sector} em ${district}. Empresa: ${companyName}. Dores: ${painPoints}. Concorrentes: ${competitors}`;
      const embedding = await generateEmbedding(textToEmbed);

      // Save to active database layer (handles Postgres vector or SQLite text fallback)
      const embeddingParam = embedding ? JSON.stringify(embedding) : null;

      await db.query(`
        INSERT INTO semantic_memories (sector, district, company_name, website, pain_points, competitors, embedding)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [sector, district, companyName, website, painPoints, competitors, embeddingParam]);

      console.log(`✅ [Semantic Memory] Successfully saved local industry intel for: ${companyName} (${sector} - ${district})`);
      return true;
    } catch (err) {
      console.error('❌ [Semantic Memory] Error saving semantic memory:', err.message);
      return false;
    }
  },

  /**
   * Searches the semantic database to find related competitors and strategic pain-points
   * matching the current lead's context (sector and geographic district).
   * 
   * Includes PostgreSQL vector cosine distance AND dynamic SQLite fallback text match.
   */
  async findSimilarIntel(sector, district) {
    try {
      const queryText = `${sector} em ${district}`;
      const embedding = await generateEmbedding(queryText);

      // Check if we can do PostgreSQL vector cosine distance search
      const pgActive = process.env.PGHOST || !embedding; // Will default inside db.query if pg is disconnected
      
      if (embedding) {
        try {
          const pgVectorQuery = `
            SELECT sector, district, company_name, website, pain_points, competitors,
                   (embedding <=> $1::vector) as distance
            FROM semantic_memories
            ORDER BY distance ASC
            LIMIT 3
          `;
          const result = await db.query(pgVectorQuery, [JSON.stringify(embedding)]);
          if (result && result.rows && result.rows.length > 0) {
            console.log(`🧠 [Semantic Memory] Retrieved ${result.rows.length} vector matches via pgvector!`);
            return result.rows;
          }
        } catch (pgErr) {
          // Fall through to text-based search if pgvector fails or is SQLite fallback
        }
      }

      // SQLite/Keyword Fallback Search (Highly relevant literal sector/district match)
      console.log(`🧠 [Semantic Memory] Running relational text fallback search for sector: "${sector}" in "${district}"`);
      const fallbackQuery = `
        SELECT sector, district, company_name, website, pain_points, competitors
        FROM semantic_memories
        WHERE (sector ILIKE $1 OR pain_points ILIKE $1) AND district ILIKE $2
        LIMIT 3
      `;
      const fallbackRes = await db.query(fallbackQuery, [`%${sector}%`, `%${district}%`]);
      return fallbackRes?.rows || [];
    } catch (err) {
      console.error('❌ [Semantic Memory] Error retrieving matches:', err.message);
      return [];
    }
  }
};

export default semanticMemoryService;

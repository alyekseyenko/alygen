import { db } from './local-db-service.js';
import { embedText } from './rag/embedding-service.js';

const MAX_COSINE_DISTANCE = 0.15;
const CACHE_TTL_DAYS = 7;

async function generateEmbedding(text) {
  try {
    const result = await embedText(text);
    return result?.vector ? { embedding: result.vector, model: result.model } : null;
  } catch (err) {
    console.warn('⚠️ [Semantic Memory] Embedding failed:', err.message);
    return null;
  }
}

function serializeCompetitors(competitors) {
  if (competitors == null) return '';
  if (typeof competitors === 'string') return competitors;
  if (Array.isArray(competitors)) return competitors.join(', ');
  return String(competitors);
}

function normalizeWebsite(w) {
  if (!w) return '';
  return String(w)
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, '');
}

export const semanticMemoryService = {
  /**
   * Direct cache hit: same website only (never another company's verdict).
   */
  async findIntelForWebsite(website) {
    const norm = normalizeWebsite(website);
    if (!norm) return null;
    try {
      const res = await db.query(
        `
        SELECT intel_text, competitors, company_name, website
        FROM semantic_memories
        WHERE intel_text IS NOT NULL AND TRIM(intel_text) <> ''
          AND created_at >= NOW() - INTERVAL '${CACHE_TTL_DAYS} days'
          AND (
            LOWER(REPLACE(REPLACE(REPLACE(website, 'https://', ''), 'http://', ''), 'www.', '')) = $1
            OR LOWER(website) LIKE $2
          )
        ORDER BY created_at DESC
        LIMIT 1
        `,
        [norm, `%${norm}%`]
      );
      return res.rows?.[0] || null;
    } catch (err) {
      console.warn('⚠️ findIntelForWebsite:', err.message);
      return null;
    }
  },

  /**
   * Sector context for Researcher (not returned as final verdict).
   */
  async findSectorContext(sector, district, excludeWebsite = null) {
    try {
      const rows = await this.findSimilarIntel(sector, district, excludeWebsite);
      if (!rows?.length) return '';
      return rows
        .map(
          (r) =>
            `- ${r.company_name || 'Empresa'} (${r.website || 'N/A'}): ${String(r.intel_text || '').slice(0, 280)}`
        )
        .join('\n');
    } catch {
      return '';
    }
  },

  /**
   * Registers a new lead's intelligence result into the semantic memory database.
   */
  async saveMemory({ sector, district, companyName, website, painPoints, competitors, intelText }) {
    try {
      if (!intelText || !String(intelText).trim()) {
        return false;
      }
      const competitorsText = serializeCompetitors(competitors);
      const textToEmbed = `${sector} em ${district}. ${String(intelText).slice(0, 2000)}`;
      const embedded = await generateEmbedding(textToEmbed);

      const embeddingParam = embedded?.embedding ? JSON.stringify(embedded.embedding) : null;

      await db.query(`
        INSERT INTO semantic_memories (sector, district, company_name, website, pain_points, competitors, embedding, intel_text)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [sector, district, companyName, website, painPoints, competitorsText, embeddingParam, intelText]);

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
   */
  async findSimilarIntel(sector, district, website = null) {
    try {
      const queryText = `${sector} em ${district}`;
      const embedded = await generateEmbedding(queryText);

      if (embedded?.embedding) {
        try {
          const pgVectorQuery = `
            SELECT sector, district, company_name, website, pain_points, competitors, intel_text,
                   (embedding <=> $1::vector) as distance
            FROM semantic_memories
            WHERE embedding IS NOT NULL
              AND intel_text IS NOT NULL AND TRIM(intel_text) <> ''
              AND sector ILIKE $2
              AND district ILIKE $3
              AND created_at >= NOW() - INTERVAL '${CACHE_TTL_DAYS} days'
              AND ($4::text IS NULL OR website IS DISTINCT FROM $4)
            ORDER BY distance ASC
            LIMIT 3
          `;
          const sectorPattern = `%${sector}%`;
          const districtPattern = `%${district}%`;
          const result = await db.query(pgVectorQuery, [
            JSON.stringify(embedded.embedding),
            sectorPattern,
            districtPattern,
            website || null,
          ]);
          const rows = (result?.rows || []).filter(
            (r) => r.distance != null && Number(r.distance) <= MAX_COSINE_DISTANCE
          );
          if (rows.length > 0) {
            console.log(`🧠 [Semantic Memory] ${rows.length} vector cache hit(s) within threshold`);
            return rows;
          }
        } catch (pgErr) {
          console.warn('⚠️ [Semantic Memory] Vector search failed:', pgErr.message);
        }
      }

      const sectorPattern = `%${sector}%`;
      const districtPattern = `%${district}%`;
      const fallbackQuery = `
        SELECT sector, district, company_name, website, pain_points, competitors, intel_text
        FROM semantic_memories
        WHERE sector ILIKE $1 AND district ILIKE $2
          AND intel_text IS NOT NULL AND TRIM(intel_text) <> ''
          AND created_at >= NOW() - INTERVAL '${CACHE_TTL_DAYS} days'
          AND ($3::text IS NULL OR website IS DISTINCT FROM $3)
        ORDER BY created_at DESC
        LIMIT 1
      `;
      const fallbackRes = await db.query(fallbackQuery, [sectorPattern, districtPattern, website || null]);
      return fallbackRes?.rows || [];
    } catch (err) {
      console.error('❌ [Semantic Memory] Error retrieving matches:', err.message);
      return [];
    }
  }
};

export default semanticMemoryService;

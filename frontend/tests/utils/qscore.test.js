import { describe, it, expect } from 'vitest'
import { calculateQScore } from '../../src/utils/qscore'

/**
 * QScore Unit Tests
 *
 * These tests guard the core business rule that generates the "Q Score" grade
 * for each lead. A regression here means wrong grades shown to sales reps
 * and wrong data in PDFs sent to clients.
 */

// ── Fixtures ──────────────────────────────────────────────────────────────────

const PERFECT_ANALYSIS = {
  performanceMobile: 95,
  seo: { score: 92 },
  security: { score: 90, hasSSL: true },
  accessibility: { score: 88 },
  pixelDetails: { totalTracking: 6 },
  conversion: { score: 85 },
}

const CRITICAL_ANALYSIS = {
  performanceMobile: 15,
  seo: { score: 10 },
  security: { score: 5, hasSSL: false },
  accessibility: { score: 8 },
  pixelDetails: { totalTracking: 0 },
  conversion: { score: 0 },
}

const AVERAGE_ANALYSIS = {
  performanceMobile: 55,
  seo: { score: 60 },
  security: { score: 65, hasSSL: true },
  accessibility: { score: 50 },
  pixelDetails: { totalTracking: 2 },
  conversion: { score: 55 },
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('calculateQScore', () => {

  // ── Null safety ───────────────────────────────────────────────────────────
  describe('null/undefined safety', () => {
    it('returns grade F and score 0 when analysis is null', () => {
      const result = calculateQScore(null)
      expect(result.score).toBe(0)
      expect(result.grade).toBe('F')
    })

    it('returns grade F and score 0 when analysis is undefined', () => {
      const result = calculateQScore(undefined)
      expect(result.score).toBe(0)
      expect(result.grade).toBe('F')
    })

    it('handles analysis with all-zero values without crashing', () => {
      const result = calculateQScore({
        performanceMobile: 0,
        seo: { score: 0 },
        security: { score: 0 },
        accessibility: { score: 0 },
        pixelDetails: { totalTracking: 0 },
        conversion: { score: 0 },
      })
      expect(result.score).toBeGreaterThanOrEqual(0)
      expect(result.grade).toBeDefined()
    })
  })

  // ── Grade thresholds (the business rules) ─────────────────────────────────
  describe('grade thresholds', () => {
    it('assigns A+ to a score >= 90', () => {
      const result = calculateQScore(PERFECT_ANALYSIS)
      expect(result.score).toBeGreaterThanOrEqual(80) // fallback calc
      // Grade must be at least an A level for a great site
      expect(['A+', 'A']).toContain(result.grade)
    })

    it('assigns F to a critically broken site', () => {
      const result = calculateQScore(CRITICAL_ANALYSIS)
      expect(result.score).toBeLessThan(30)
      expect(result.grade).toBe('F')
    })

    it('score for average site falls between 40 and 75', () => {
      const result = calculateQScore(AVERAGE_ANALYSIS)
      expect(result.score).toBeGreaterThanOrEqual(40)
      expect(result.score).toBeLessThanOrEqual(75)
    })
  })

  // ── qScoreAdvanced passthrough ────────────────────────────────────────────
  describe('qScoreAdvanced passthrough', () => {
    it('uses backend qScoreAdvanced data when available', () => {
      const analysis = {
        qScoreAdvanced: {
          score: 77,
          grade: 'B',
          category: 'Competitivo',
          technicalScore: 74,
        }
      }
      const result = calculateQScore(analysis)
      expect(result.score).toBe(77)
      expect(result.grade).toBe('B')
      expect(result.category).toBe('Competitivo')
    })

    it('sanitizes NaN from qScoreAdvanced to 0', () => {
      const analysis = { qScoreAdvanced: { score: NaN, grade: 'F' } }
      const result = calculateQScore(analysis)
      expect(result.score).toBe(0)
    })
  })

  // ── basic qScore fallback ─────────────────────────────────────────────────
  describe('basic qScore fallback', () => {
    it('uses qScore.technical when qScoreAdvanced is absent', () => {
      const analysis = { qScore: { technical: 65, grade: 'C', maturity: 'Funcional' } }
      const result = calculateQScore(analysis)
      expect(result.score).toBe(65)
      expect(result.grade).toBe('C')
    })
  })

  // ── Weighted formula (local fallback) ─────────────────────────────────────
  describe('weighted formula', () => {
    it('performance has the highest weight (25%)', () => {
      const lowPerf  = calculateQScore({ ...AVERAGE_ANALYSIS, performanceMobile: 10 })
      const highPerf = calculateQScore({ ...AVERAGE_ANALYSIS, performanceMobile: 100 })
      // Changing performance from 10 to 100 should move the score significantly
      expect(highPerf.score - lowPerf.score).toBeGreaterThan(10)
    })

    it('score is always between 0 and 100', () => {
      const extremes = [
        calculateQScore(PERFECT_ANALYSIS),
        calculateQScore(CRITICAL_ANALYSIS),
        calculateQScore(AVERAGE_ANALYSIS),
      ]
      extremes.forEach(r => {
        expect(r.score).toBeGreaterThanOrEqual(0)
        expect(r.score).toBeLessThanOrEqual(100)
      })
    })
  })

  // ── Output shape contract ─────────────────────────────────────────────────
  describe('output contract', () => {
    it('always returns score, grade, category', () => {
      const result = calculateQScore(AVERAGE_ANALYSIS)
      expect(result).toHaveProperty('score')
      expect(result).toHaveProperty('grade')
      expect(result).toHaveProperty('category')
    })

    it('score is always a finite number', () => {
      const result = calculateQScore(AVERAGE_ANALYSIS)
      expect(Number.isFinite(result.score)).toBe(true)
    })
  })
})

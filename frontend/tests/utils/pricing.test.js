import { describe, it, expect } from 'vitest'
import { calculateProjectPrice } from '../../src/utils/pricing'

/**
 * Pricing Unit Tests
 *
 * These tests guard the revenue calculation rules — the most financially
 * sensitive logic in the CRM. A regression here means wrong quotes sent
 * to clients or incorrect revenue totals in the dashboard.
 */

// ── Fixtures ──────────────────────────────────────────────────────────────────

const QSCORE_LOW  = { score: 25, grade: 'F' }
const QSCORE_HIGH = { score: 82, grade: 'A' }

const POOR_SITE = {
  performanceMobile: 20,
  seo:           { score: 25, hasSitemap: false, hasSchema: false, images: { withoutAlt: 15 } },
  security:      { score: 30, hasSSL: false, headers: {} },
  accessibility: { score: 20, errors: 30 },
  pixelDetails:  { totalTracking: 0 },
  conversion:    { score: 15, ctas: { total: 0 }, contact: { whatsapp: false }, socialProof: {} },
}

const GOOD_SITE = {
  performanceMobile: 92,
  seo:           { score: 88 },
  security:      { score: 90, hasSSL: true },
  accessibility: { score: 85 },
  pixelDetails:  { totalTracking: 5 },
  conversion:    { score: 80 },
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('calculateProjectPrice', () => {

  // ── Null safety ───────────────────────────────────────────────────────────
  describe('null/undefined safety', () => {
    it('returns total 0 when analysis is null', () => {
      expect(calculateProjectPrice(null, QSCORE_LOW).total).toBe(0)
    })

    it('returns total 0 when qScore is null', () => {
      expect(calculateProjectPrice(POOR_SITE, null).total).toBe(0)
    })

    it('returns total 0 when both are null', () => {
      expect(calculateProjectPrice(null, null).total).toBe(0)
    })
  })

  // ── Output shape contract ─────────────────────────────────────────────────
  describe('output contract', () => {
    it('always returns the required fields', () => {
      const result = calculateProjectPrice(POOR_SITE, QSCORE_LOW)
      expect(result).toHaveProperty('total')
      expect(result).toHaveProperty('breakdown')
      expect(result).toHaveProperty('timeline')
      expect(result).toHaveProperty('totalHours')
      expect(result).toHaveProperty('hourlyRate')
      expect(result).toHaveProperty('marketComparison')
    })

    it('hourly rate is always €25', () => {
      const result = calculateProjectPrice(POOR_SITE, QSCORE_LOW)
      expect(result.hourlyRate).toBe(25)
    })

    it('total must be a non-negative integer', () => {
      const result = calculateProjectPrice(POOR_SITE, QSCORE_LOW)
      expect(Number.isInteger(result.total)).toBe(true)
      expect(result.total).toBeGreaterThanOrEqual(0)
    })
  })

  // ── Business rules: discount thresholds ───────────────────────────────────
  describe('discount thresholds', () => {
    it('applies 0% discount when price < €1000', () => {
      // A good site may have low price
      const result = calculateProjectPrice(GOOD_SITE, QSCORE_HIGH)
      if (result.originalPrice < 1000) {
        expect(result.discount).toBe(0)
      }
    })

    it('total is always <= originalPrice (discounts only reduce price)', () => {
      const result = calculateProjectPrice(POOR_SITE, QSCORE_LOW)
      expect(result.total).toBeLessThanOrEqual(result.originalPrice ?? result.total)
    })
  })

  // ── A poor site generates work items ─────────────────────────────────────
  describe('poor site generates breakdown', () => {
    it('generates at least 3 work categories for a poor site', () => {
      const result = calculateProjectPrice(POOR_SITE, QSCORE_LOW)
      expect(result.breakdown.length).toBeGreaterThanOrEqual(3)
    })

    it('performance category is included when mobile score < 70', () => {
      const result = calculateProjectPrice(POOR_SITE, QSCORE_LOW)
      const cats = result.breakdown.map(b => b.category)
      expect(cats).toContain('Performance')
    })

    it('security category is included when security score < 70', () => {
      const result = calculateProjectPrice(POOR_SITE, QSCORE_LOW)
      const cats = result.breakdown.map(b => b.category)
      expect(cats).toContain('Segurança')
    })

    it('tracking category is included when totalTracking < 2', () => {
      const result = calculateProjectPrice(POOR_SITE, QSCORE_LOW)
      const cats = result.breakdown.map(b => b.category)
      expect(cats).toContain('Tracking & Analytics')
    })
  })

  // ── A good site generates no unnecessary work ─────────────────────────────
  describe('good site minimal breakdown', () => {
    it('does NOT include performance work for a fast site', () => {
      const result = calculateProjectPrice(GOOD_SITE, QSCORE_HIGH)
      const cats = result.breakdown.map(b => b.category)
      expect(cats).not.toContain('Performance')
    })
  })

  // ── Timeline logic ────────────────────────────────────────────────────────
  describe('timeline', () => {
    it('timeline in weeks equals ceil(totalHours / 20)', () => {
      const result = calculateProjectPrice(POOR_SITE, QSCORE_LOW)
      const expected = Math.ceil(result.totalHours / 20)
      expect(result.timeline).toBe(expected)
    })

    it('timeline is at least 1 week when there is work to do', () => {
      const result = calculateProjectPrice(POOR_SITE, QSCORE_LOW)
      if (result.breakdown.length > 0) {
        expect(result.timeline).toBeGreaterThanOrEqual(1)
      }
    })
  })

  // ── Market comparison ─────────────────────────────────────────────────────
  describe('market comparison', () => {
    it('percentageSaved is always a finite number', () => {
      const result = calculateProjectPrice(POOR_SITE, QSCORE_LOW)
      expect(Number.isFinite(result.marketComparison.percentageSaved)).toBe(true)
    })

    it('marketAverage is > 0 when there is work to do', () => {
      const result = calculateProjectPrice(POOR_SITE, QSCORE_LOW)
      if (result.breakdown.length > 0) {
        expect(result.marketComparison.marketAverage).toBeGreaterThan(0)
      }
    })
  })
})

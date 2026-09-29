# Q-Score (English)

**Source of truth:** `backend_python/core/qscore.py` (runtime audit). **JS mirror:** `backend/services/analyzers/qscore-calculator.js` and `frontend/src/utils/qscore-core.js` with shared weights in `backend/config/qscore-weights.json` and `frontend/src/config/qscore-weights.json` (keep in sync).

## Formula (5 metrics, sector weights)
Weighted dot product of:
1. Performance (mobile Lighthouse / PageSpeed)
2. SEO score
3. Security score
4. Tracking (0–4 boolean pixels → 0–100%)
5. Conversion proxy (`hasCTA` → 0 or 100)

## Penalties / bonuses
- No SSL: −20
- Performance &lt; 30: −10
- No tracking: −10
- PageSpeed unavailable: −5
- Low Google visibility score: −5; high visibility: +3
- Performance ≥ 95: +5; all core metrics ≥ 80: +10

## Priority (deterministic)
| Score | Priority |
|-------|----------|
| ≥ 75 | LOW (well optimized — lower sales urgency) |
| ≥ 55 | MEDIUM |
| ≥ 35 | HIGH |
| &lt; 35 | CRITICAL |

Mapped to PT labels in the UI: BAIXA / MÉDIA / ALTA / CRÍTICA.

## ML close probability
RandomForest path exists; training not wired in CI. Heuristic: `(100 − qscore) × 0.7` clipped 5–95 until model is trained on won deals.

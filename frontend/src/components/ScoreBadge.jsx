/**
 * ScoreBadge — Renders a score (0-100) as a colored metric pill.
 * Uses the design system's .metric-pill classes from index.css.
 */
export default function ScoreBadge({ value }) {
  if (value === null || value === undefined || isNaN(value)) {
    return <span className="text-white/20">–</span>
  }
  const v   = Math.round(Number(value))
  const cls = v >= 90 ? 'good' : v >= 50 ? 'average' : 'poor'

  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className={`metric-pill ${cls}`}>{v}</span>
      <span className="text-[10px] text-white/25">/100</span>
    </div>
  )
}

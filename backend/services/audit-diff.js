/**
 * Compare current audit with previous persisted analysis (sales hook).
 */
export function computeAuditDiff(previousAnalysis, currentAnalysis) {
  if (!previousAnalysis || !currentAnalysis) return null;
  const changes = [];
  const prevMobile = previousAnalysis.performanceMobile;
  const currMobile = currentAnalysis.performanceMobile;
  if (prevMobile != null && currMobile != null && prevMobile !== currMobile) {
    const delta = currMobile - prevMobile;
    changes.push({
      metric: 'performanceMobile',
      previous: prevMobile,
      current: currMobile,
      delta,
      message:
        delta < 0
          ? `Performance mobile piorou ${Math.abs(delta)} pontos desde a última auditoria.`
          : `Performance mobile melhorou ${delta} pontos desde a última auditoria.`,
    });
  }
  const prevQ = previousAnalysis.qScore?.score ?? previousAnalysis.overallScore;
  const currQ = currentAnalysis.qScore?.score ?? currentAnalysis.overallScore;
  if (prevQ != null && currQ != null && prevQ !== currQ) {
    changes.push({
      metric: 'qscore',
      previous: prevQ,
      current: currQ,
      delta: currQ - prevQ,
    });
  }
  return changes.length ? { changes, generatedAt: new Date().toISOString() } : null;
}

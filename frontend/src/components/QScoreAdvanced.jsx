import { AlertTriangle, Award, TrendingUp, Target, Zap, Shield, Search, Users } from 'lucide-react'

export default function QScoreAdvanced({ qScore }) {
  if (!qScore || !qScore.urgencies) {
    return null; // No Advanced Q Score
  }

  return (
    <div className="space-y-4">
      {/* SETOR E REGIÃO */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-card p-3">
          <p className="text-xs text-foreground/70 mb-1">Sector</p>
          <p className="text-sm font-bold text-accent">{qScore.sectorName || 'General'}</p>
        </div>
        <div className="glass-card p-3">
          <p className="text-xs text-foreground/70 mb-1">Region</p>
          <p className="text-sm font-bold text-accent">{qScore.region || 'Portugal'}</p>
        </div>
      </div>

      {/* PENALIZAÇÕES */}
      {qScore.penalties && qScore.penalties.length > 0 && (
        <div className="glass-card p-4 border-2 border-red-500/50">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <h4 className="font-semibold text-foreground">
              Penalties ({qScore.totalPenalty} points)
            </h4>
          </div>
          <div className="space-y-2">
            {qScore.penalties.map((penalty, i) => (
              <div key={i} className="glass-card p-3 bg-red-500/10">
                <div className="flex justify-between items-start mb-1">
                  <span className={`text-xs font-bold ${
                    penalty.type === 'CRITICAL' ? 'text-red-400' :
                    penalty.type === 'HIGH' ? 'text-orange-400' :
                    'text-yellow-400'
                  }`}>
                    {penalty.type}
                  </span>
                  <span className="text-sm font-bold text-red-400">{penalty.penalty}</span>
                </div>
                <p className="text-sm text-foreground font-medium">{penalty.issue}</p>
                <p className="text-xs text-foreground/60 mt-1">{penalty.impact}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* BÔNUS */}
      {qScore.bonuses && qScore.bonuses.length > 0 && (
        <div className="glass-card p-4 border-2 border-green-500/50">
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-5 h-5 text-green-400" />
            <h4 className="font-semibold text-foreground">
              Bonus (+{qScore.totalBonus} points)
            </h4>
          </div>
          <div className="space-y-2">
            {qScore.bonuses.map((bonus, i) => (
              <div key={i} className="glass-card p-3 bg-green-500/10">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-xs font-bold text-green-400">{bonus.type}</span>
                  <span className="text-sm font-bold text-green-400">+{bonus.bonus}</span>
                </div>
                <p className="text-sm text-foreground font-medium">{bonus.achievement}</p>
                <p className="text-xs text-foreground/60 mt-1">{bonus.benefit}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* URGÊNCIAS */}
      {qScore.urgencies && qScore.urgencies.length > 0 && (
        <div className="glass-card p-4 border-2 border-orange-500/50">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-5 h-5 text-orange-400" />
            <h4 className="font-semibold text-foreground">
              Action Priorities
            </h4>
          </div>
          <div className="space-y-2">
            {qScore.urgencies.slice(0, 3).map((urgency, i) => (
              <div key={i} className="glass-card p-3">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className={`text-xs font-bold px-2 py-1 rounded ${
                      urgency.priority === 'CRITICAL' ? 'bg-red-500/20 text-red-400' :
                      urgency.priority === 'HIGH' ? 'bg-orange-500/20 text-orange-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {urgency.priority}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-accent">€{urgency.cost}</p>
                    <p className="text-xs text-foreground/50">{urgency.time} weeks</p>
                  </div>
                </div>
                <p className="text-sm font-medium text-foreground mb-1">{urgency.category}</p>
                <div className="flex gap-4 text-xs text-foreground/70">
                  <span>Gap: {urgency.gap} pts</span>
                  <span>Impacto: {urgency.impact}/10</span>
                  <span>Esforço: {urgency.effort}h</span>
                </div>
                <div className="mt-2 bg-foreground/10 rounded-full h-2">
                  <div 
                    className="bg-accent rounded-full h-2 transition-all"
                    style={{ width: `${Math.min(urgency.urgencyScore, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* COMPETITIVIDADE */}
      {qScore.competitiveness && qScore.competitiveness.position !== 'N/A' && (
        <div className="glass-card p-4 border-2 border-blue-500/50">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-5 h-5 text-blue-400" />
            <h4 className="font-semibold text-foreground">
              Análise Competitiva
            </h4>
          </div>
          <div className="space-y-3">
            <div className="glass-card p-3 bg-blue-500/10">
              <p className="text-sm text-foreground/70 mb-1">Posição no Mercado</p>
              <p className="text-2xl font-bold text-blue-400">
                #{qScore.competitiveness.position} de {qScore.competitiveness.total}
              </p>
              <p className="text-xs text-foreground/60 mt-1">
                {qScore.competitiveness.message}
              </p>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <div className="glass-card p-2 text-center">
                <p className="text-xs text-foreground/70">Seu Score</p>
                <p className="text-lg font-bold text-accent">{qScore.competitiveness.myScore}</p>
              </div>
              <div className="glass-card p-2 text-center">
                <p className="text-xs text-foreground/70">Média</p>
                <p className="text-lg font-bold text-foreground">{qScore.competitiveness.avgScore}</p>
              </div>
              <div className="glass-card p-2 text-center">
                <p className="text-xs text-foreground/70">Líder</p>
                <p className="text-lg font-bold text-green-400">{qScore.competitiveness.leaderScore}</p>
              </div>
            </div>

            {qScore.competitiveness.competitors && qScore.competitiveness.competitors.length > 0 && (
              <div>
                <p className="text-xs text-foreground/70 mb-2">Concorrentes Diretos:</p>
                <div className="space-y-1">
                  {qScore.competitiveness.competitors.slice(0, 3).map((comp, i) => (
                    <div key={i} className="glass-card p-2 flex justify-between items-center">
                      <span className="text-xs text-foreground truncate">{comp.name}</span>
                      <span className="text-sm font-bold text-accent">{comp.score}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* BENCHMARK REGIONAL */}
      {qScore.benchmarkComparison && (
        <div className="glass-card p-4 border-2 border-purple-500/50">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-5 h-5 text-purple-400" />
            <h4 className="font-semibold text-foreground">
              Benchmark Regional
            </h4>
          </div>
          <p className="text-sm text-foreground/70 mb-3">{qScore.benchmarkComparison.region}</p>
          <div className="space-y-2">
            {['performance', 'seo', 'security'].map(metric => {
              const data = qScore.benchmarkComparison[metric];
              if (!data) return null;
              
              const isAbove = data.diff > 0;
              
              return (
                <div key={metric} className="glass-card p-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-foreground capitalize">{metric}</span>
                    <span className={`text-sm font-bold ${isAbove ? 'text-green-400' : 'text-red-400'}`}>
                      {isAbove ? '+' : ''}{data.diff}
                    </span>
                  </div>
                  <div className="flex gap-2 text-xs text-foreground/70">
                    <span>Você: {data.yours}</span>
                    <span>•</span>
                    <span>Benchmark: {data.benchmark}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ROI POTENCIAL */}
      {qScore.roi && (
        <div className="glass-card p-4 border-2 border-green-500/50">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-5 h-5 text-green-400" />
            <h4 className="font-semibold text-foreground">
              ROI Potencial
            </h4>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="glass-card p-3 bg-green-500/10">
              <p className="text-xs text-foreground/70 mb-1">Investimento</p>
              <p className="text-2xl font-bold text-foreground">€{qScore.roi.investment}</p>
            </div>
            <div className="glass-card p-3 bg-green-500/10">
              <p className="text-xs text-foreground/70 mb-1">Retorno Anual</p>
              <p className="text-2xl font-bold text-green-400">€{qScore.roi.yearly}</p>
            </div>
          </div>
          <div className="mt-3 glass-card p-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-foreground/70">Payback</span>
              <span className="text-lg font-bold text-accent">{qScore.roi.payback} meses</span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-foreground/70">Multiplicador</span>
              <span className="text-lg font-bold text-green-400">{qScore.roi.multiplier}</span>
            </div>
          </div>
        </div>
      )}

      {/* RECOMENDAÇÃO */}
      {qScore.recommendation && (
        <div className="glass-card p-4 bg-accent/10 border-2 border-accent/50">
          <p className="text-sm text-foreground font-medium">{qScore.recommendation}</p>
        </div>
      )}
    </div>
  )
}

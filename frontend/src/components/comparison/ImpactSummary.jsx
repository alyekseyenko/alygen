import { Check, TrendingUp, Clock, AlertTriangle } from 'lucide-react'

export default function ImpactSummary({ 
  currentPosition, 
  potentialPosition, 
  currentSEO, 
  potentialSEO,
  currentPerformance,
  potentialPerformance,
  hasGuarantee,
  timeline 
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Garantias */}
      <div className="bg-card border border-accent/20 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Check className="w-5 h-5 text-accent" />
          <h4 className="text-lg font-bold text-white">Garantimos</h4>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
              <Check className="w-4 h-4 text-accent" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-white">Performance {potentialPerformance}+</p>
              <p className="text-xs text-muted-foreground">
                Site carrega em menos de 2 segundos. Otimização técnica completa.
              </p>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-accent transition-all duration-1000"
                    style={{ width: `${currentPerformance}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">{currentPerformance}</span>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-accent transition-all duration-1000"
                    style={{ width: `${potentialPerformance}%` }}
                  />
                </div>
                <span className="text-xs text-accent font-bold">{potentialPerformance}</span>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
              <Check className="w-4 h-4 text-accent" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-white">SEO Score {potentialSEO}+</p>
              <p className="text-xs text-muted-foreground">
                Meta tags, schema markup, sitemap, robots.txt otimizados.
              </p>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-accent transition-all duration-1000"
                    style={{ width: `${currentSEO}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">{currentSEO}</span>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-accent transition-all duration-1000"
                    style={{ width: `${potentialSEO}%` }}
                  />
                </div>
                <span className="text-xs text-accent font-bold">{potentialSEO}</span>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
              <Check className="w-4 h-4 text-accent" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-white">Tracking Completo</p>
              <p className="text-xs text-muted-foreground">
                GA4, Meta Pixel, GTM configurados e funcionais.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Projeções */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          {hasGuarantee ? (
            <TrendingUp className="w-5 h-5 text-accent" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-accent" />
          )}
          <h4 className="text-lg font-bold text-white">
            {hasGuarantee ? 'Melhoria Esperada' : 'Projeção (Sem Garantia)'}
          </h4>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              hasGuarantee ? 'bg-accent/20' : 'bg-white/10'
            }`}>
              {hasGuarantee ? (
                <TrendingUp className="w-4 h-4 text-accent" />
              ) : (
                <span className="text-white text-sm">~</span>
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-white">
                Posição Google TOP {potentialPosition <= 3 ? '3' : '10'}
              </p>
              <p className="text-xs text-muted-foreground mb-2">
                {currentPosition ? (
                  <>De #{currentPosition} para #{potentialPosition}</>
                ) : (
                  <>De fora do TOP 50 para #{potentialPosition}</>
                )}
              </p>
              {!hasGuarantee && (
                <div className="bg-accent/10 border border-accent/20 rounded p-2">
                  <p className="text-xs text-accent">
                    Projeção baseada em melhorias técnicas. Posição final depende do algoritmo Google e concorrência.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
              <Clock className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-white">Timeline</p>
              <div className="mt-2 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Melhorias técnicas</span>
                  <span className="text-xs text-accent font-bold">Imediato</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Impacto no Google</span>
                  <span className="text-xs text-accent font-bold">{timeline}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                * Google leva tempo para re-indexar. Resultados variam por setor.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

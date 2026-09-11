import {
  ReactCompareSlider,
  ReactCompareSliderImage,
  ReactCompareSliderHandle
} from 'react-compare-slider'
import GoogleSERPPreview from './GoogleSERPPreview'
import { AlertTriangle, TrendingUp, Clock } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function BeforeAfterSlider({ leadData, analysis }) {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-96 bg-card border border-border rounded-lg">
        <p className="text-white">Carregando comparação...</p>
      </div>
    )
  }
  const currentPosition = analysis?.googleRanking?.bestPosition?.position || null
  const currentSEO = analysis?.seo?.score || 0
  const currentPerformance = analysis?.performanceMobile || 0
  
  // Cálculos realistas
  const isInTop10 = currentPosition && currentPosition <= 10
  
  // Performance: garantir pelo menos 90
  const potentialPerformance = Math.max(90, Math.min(currentPerformance + 50, 98))
  
  // SEO: melhoria realista baseada no estado atual
  const seoGap = 100 - currentSEO
  const potentialSEO = Math.min(currentSEO + Math.floor(seoGap * 0.7), 95)
  
  // Posição Google: projeção realista
  let potentialPosition
  let positionMessage
  let hasGuarantee = false
  
  if (!currentPosition || currentPosition > 20) {
    // Não aparece no top 20 (2 primeiras páginas)
    potentialPosition = 15 // Projeção realista para TOP 20
    positionMessage = currentPosition ? `Atualmente na posição #${currentPosition}` : "Atualmente não aparece nas 2 primeiras páginas"
    hasGuarantee = false
  } else if (currentPosition > 10) {
    // Está na 2ª página (posições 11-20)
    potentialPosition = Math.max(5, Math.ceil(currentPosition * 0.5))
    positionMessage = `Atualmente na posição #${currentPosition} (2ª página)`
    hasGuarantee = false
  } else {
    // Já está no top 10 (1ª página)
    potentialPosition = Math.max(1, Math.ceil(currentPosition * 0.6))
    positionMessage = `Já está na 1ª página (#${currentPosition})`
    hasGuarantee = true
  }
  
  // Cálculo de tráfego baseado em CTR real
  const ctrBefore = currentPosition ? getCTR(currentPosition) : 0
  const ctrAfter = getCTR(potentialPosition)
  const trafficIncrease = ctrBefore > 0 ? Math.round(((ctrAfter - ctrBefore) / ctrBefore) * 100) : 500
  
  // Leads estimados (baseado em volume de busca médio do setor)
  const avgMonthlySearches = 2000 // Estimativa conservadora
  const currentLeads = Math.round(avgMonthlySearches * ctrBefore * 0.05) // 5% conversão
  const potentialLeads = Math.round(avgMonthlySearches * ctrAfter * 0.05)
  const leadsIncrease = potentialLeads - currentLeads
  
  // Timeline realista
  const timeline = hasGuarantee ? "3-6 meses" : "6-12 meses"
  
  return (
    <div className="space-y-6">
      {/* Header com Aviso */}
      <div className="text-center">
        <h3 className="text-2xl font-bold text-white mb-2">
          Projeção: Antes vs Depois da Otimização
        </h3>
        <p className="text-muted-foreground mb-4">
          Arraste o slider para ver o impacto potencial
        </p>
        
        {!hasGuarantee && (
          <div className="bg-accent/10 border border-accent/30 rounded-lg p-4 max-w-2xl mx-auto">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
              <div className="text-left">
                <p className="text-sm font-bold text-accent mb-1">
                  Projeção Realista
                </p>
                <p className="text-xs text-white">
                  {positionMessage}. <strong>Garantimos entrada nas 2 primeiras páginas do Google (TOP 20)</strong> com otimizações técnicas completas. 
                  A posição exata depende de fatores como concorrência e algoritmo, mas com Performance 90+ e SEO otimizado, 
                  <strong>há grande chance de alcançar o TOP 10 em 6-12 meses</strong>.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {hasGuarantee && (
          <div className="bg-accent/10 border border-accent/30 rounded-lg p-4 max-w-2xl mx-auto">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
              <div className="text-left">
                <p className="text-sm font-bold text-accent mb-1">
                  Otimização de Posição na 1ª Página
                </p>
                <p className="text-xs text-white">
                  {positionMessage}. Com otimizações técnicas e de conteúdo, podemos melhorar ainda mais sua posição e aumentar o tráfego orgânico.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Slider de Comparação */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <ReactCompareSlider
          itemOne={
            <div className="h-full bg-white p-4">
              <GoogleSERPPreview
                position={currentPosition || 25}
                title={leadData.name}
                url={leadData.website}
                description={`${leadData.name} - Encontre as melhores soluções em ${leadData.city || 'Portugal'}`}
                type="before"
                notInTop50={!currentPosition || currentPosition > 20}
              />
            </div>
          }
          itemTwo={
            <div className="h-full bg-white p-4">
              <GoogleSERPPreview
                position={potentialPosition}
                title={leadData.name}
                url={leadData.website}
                description={`${leadData.name} - Líder em ${leadData.type || 'serviços'} | Atendimento Premium | Avaliação 5★ | Desde 2020`}
                type="after"
                isProjection={true}
              />
            </div>
          }
          handle={
            <ReactCompareSliderHandle
              buttonStyle={{
                backdropFilter: undefined,
                background: '#FF4F00',
                border: '3px solid white',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                width: '48px',
                height: '48px'
              }}
              linesStyle={{
                background: '#FF4F00',
                width: '3px'
              }}
            />
          }
          style={{
            height: '600px'
          }}
        />
      </div>

      {/* Métricas Comparativas */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-2">Posição Google</p>
          <div className="flex items-center justify-between">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">
                {currentPosition ? `#${currentPosition}` : 'Fora TOP 20'}
              </p>
              <p className="text-xs text-muted-foreground">Atual</p>
            </div>
            <div className="text-accent text-2xl">→</div>
            <div className="text-center">
              <p className="text-2xl font-bold text-accent">#{potentialPosition}</p>
              <p className="text-xs text-accent">Projeção</p>
            </div>
          </div>
          {currentPosition && currentPosition > potentialPosition && (
            <div className="mt-3 bg-accent/10 border border-accent/20 rounded p-2">
              <p className="text-xs text-accent font-bold text-center">
                +{currentPosition - potentialPosition} posições
              </p>
            </div>
          )}
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-2">SEO Score</p>
          <div className="flex items-center justify-between">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{currentSEO}</p>
              <p className="text-xs text-muted-foreground">Atual</p>
            </div>
            <div className="text-accent text-2xl">→</div>
            <div className="text-center">
              <p className="text-2xl font-bold text-accent">{potentialSEO}</p>
              <p className="text-xs text-accent">Garantido</p>
            </div>
          </div>
          <div className="mt-3 bg-accent/10 border border-accent/20 rounded p-2">
            <p className="text-xs text-accent font-bold text-center">
              +{potentialSEO - currentSEO} pontos
            </p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-2">Performance</p>
          <div className="flex items-center justify-between">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{currentPerformance}</p>
              <p className="text-xs text-muted-foreground">Atual</p>
            </div>
            <div className="text-accent text-2xl">→</div>
            <div className="text-center">
              <p className="text-2xl font-bold text-accent">{potentialPerformance}</p>
              <p className="text-xs text-accent">Garantido 90+</p>
            </div>
          </div>
          <div className="mt-3 bg-accent/10 border border-accent/20 rounded p-2">
            <p className="text-xs text-accent font-bold text-center">
              +{potentialPerformance - currentPerformance} pontos
            </p>
          </div>
        </div>
      </div>

      {/* Impacto Estimado */}
      <div className="bg-accent/5 border border-accent/20 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-accent" />
          <h4 className="text-lg font-bold text-white">Impacto Estimado</h4>
        </div>
        
        <div className="grid grid-cols-2 gap-6 mb-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Aumento de Tráfego</p>
            <p className="text-3xl font-bold text-accent">+{trafficIncrease}%</p>
            <p className="text-xs text-muted-foreground mt-1">
              CTR: {(ctrBefore * 100).toFixed(1)}% → {(ctrAfter * 100).toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Novos Leads/Mês</p>
            <p className="text-3xl font-bold text-accent">+{leadsIncrease}</p>
            <p className="text-xs text-muted-foreground mt-1">
              De {currentLeads} para {potentialLeads} leads
            </p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <p className="text-sm font-bold text-white">Timeline Realista</p>
          </div>
          <p className="text-sm text-muted-foreground">
            Melhorias técnicas (Performance, SEO): <span className="text-accent font-bold">Imediato</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Impacto no ranking Google: <span className="text-accent font-bold">{timeline}</span>
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            * O Google leva tempo para re-indexar e avaliar melhorias. Resultados variam por setor e concorrência.
          </p>
        </div>
      </div>

      {/* Garantias */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-lg font-bold text-white mb-4">O Que Garantimos</h4>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-accent text-sm font-bold">✓</span>
            </div>
            <div>
              <p className="text-sm font-bold text-white">Performance 90+</p>
              <p className="text-xs text-muted-foreground">
                Otimização técnica garantida. Site carrega em menos de 2 segundos.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-accent text-sm font-bold">✓</span>
            </div>
            <div>
              <p className="text-sm font-bold text-white">SEO Score {potentialSEO}+</p>
              <p className="text-xs text-muted-foreground">
                Otimização completa: meta tags, schema markup, sitemap, robots.txt.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-accent text-sm font-bold">✓</span>
            </div>
            <div>
              <p className="text-sm font-bold text-white">Tracking Completo</p>
              <p className="text-xs text-muted-foreground">
                Google Analytics 4, Meta Pixel, Google Tag Manager configurados.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-accent text-sm font-bold">✓</span>
            </div>
            <div>
              <p className="text-sm font-bold text-white">Entrada nas 2 Primeiras Páginas (TOP 20)</p>
              <p className="text-xs text-muted-foreground">
                Garantimos que seu site aparecerá nas 2 primeiras páginas do Google com otimizações completas.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-sm">~</span>
            </div>
            <div>
              <p className="text-sm font-bold text-white">Posição TOP 10 (1ª Página)</p>
              <p className="text-xs text-muted-foreground">
                Projeção baseada em melhorias técnicas. Grande chance de alcançar TOP 10, mas não garantimos posição específica.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// CTR médio por posição (dados reais de estudos)
function getCTR(position) {
  const ctrMap = {
    1: 0.316,   // 31.6%
    2: 0.158,   // 15.8%
    3: 0.107,   // 10.7%
    4: 0.077,   // 7.7%
    5: 0.059,   // 5.9%
    6: 0.047,   // 4.7%
    7: 0.039,   // 3.9%
    8: 0.033,   // 3.3%
    9: 0.029,   // 2.9%
    10: 0.025,  // 2.5%
    11: 0.020,  // 2.0%
    12: 0.017,  // 1.7%
    13: 0.015,  // 1.5%
    14: 0.013,  // 1.3%
    15: 0.012,  // 1.2%
  }
  
  if (position <= 15) return ctrMap[position]
  if (position <= 20) return 0.010
  if (position <= 30) return 0.005
  if (position <= 50) return 0.002
  return 0.001
}

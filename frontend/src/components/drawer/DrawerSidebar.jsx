import React from 'react'
import { Brain, Zap, RefreshCw } from 'lucide-react'
import { Badge } from '../ui/badge'
import ClientBlob3D from '../ClientBlob3D'

export default function DrawerSidebar({
  effectiveAnalysis,
  lead,
  loadingML,
  mlPrediction
}) {
  return (
    <div className="hidden md:flex w-[35%] h-full bg-[#0e0f14] border-l border-border flex-col overflow-y-auto">
      {/* 3D BLOB CARD */}
      <div className="p-6 border-b border-border bg-black/20">
        <h4 className="text-xs font-bold text-accent uppercase tracking-wider mb-3 flex items-center gap-2">
          <Brain className="w-4 h-4 text-accent animate-pulse" /> Website Digital DNA (3D)
        </h4>
        <div className="h-[250px] bg-black/50 rounded-xl border border-border overflow-hidden relative shadow-inner group">
          {effectiveAnalysis && Object.keys(effectiveAnalysis).length > 0 ? (
            <ClientBlob3D key={lead.id} analysis={effectiveAnalysis} leadData={lead} />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-muted-foreground text-xs">Loading visualization...</span>
            </div>
          )}
          <div className="absolute bottom-2 left-2 right-2 bg-black/60 backdrop-blur-sm p-1.5 rounded-lg border border-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            <p className="text-[10px] text-white/80 text-center">Rotate and interact with mouse to explore</p>
          </div>
        </div>
      </div>

      {/* CONVERSION ACCURACY & MACHINE LEARNING STATUS */}
      <div className="p-6 space-y-4">
        <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Zap className="w-4 h-4 text-orange-400" /> Closing Forecast (Machine Learning)
        </h4>
        
        {loadingML ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <RefreshCw className="w-4 h-4 animate-spin text-accent" />
            <span>Analyzing closing propensity via Python ML...</span>
          </div>
        ) : mlPrediction ? (
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Win Probability:</span>
              <Badge className={`${
                mlPrediction.propensity === 'HIGH' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                mlPrediction.propensity === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                'bg-red-500/20 text-red-400 border-red-500/30'
              }`}>
                {mlPrediction.probability}% ({mlPrediction.propensity})
              </Badge>
            </div>
            <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${
                  mlPrediction.propensity === 'HIGH' ? 'bg-green-500' :
                  mlPrediction.propensity === 'MEDIUM' ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}
                style={{ width: `${mlPrediction.probability}%` }}
              />
            </div>
            <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
              Our model calculated this probability analyzing local competitors, rating of {lead.rating || 'N/A'} stars, and website gaps.
            </p>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Python algorithm in automatic calibration mode.</p>
        )}
      </div>
    </div>
  )
}

import React from 'react'
import { ShieldAlert } from 'lucide-react'
import { Card } from '../ui/card'
import { Badge } from '../ui/badge'

export default function PipelineBoard({
  stages,
  filteredLeads,
  handleDrop,
  handleDragStart,
  setSelectedDeal
}) {
  return (
    <div className="flex gap-6 overflow-x-auto pb-6 custom-scrollbar min-h-[calc(100vh-280px)] items-start">
      {stages.map(stage => {
        const stageLeads = filteredLeads.filter(l => l.crm_stage === stage.id)
        const stageTotal = stageLeads.reduce((acc, l) => acc + Number(l.budget), 0)

        return (
          <div
            key={stage.id}
            onDrop={e => handleDrop(e, stage.id)}
            onDragOver={e => {
              e.preventDefault()
              e.stopPropagation()
              e.dataTransfer.dropEffect = 'move'
            }}
            onDragEnter={e => {
              e.preventDefault()
              e.stopPropagation()
            }}
            className="w-[300px] flex-shrink-0 flex flex-col space-y-4"
          >
            <div className={`p-3 rounded-lg border-b-2 flex justify-between items-center bg-card transition-all ${stage.accent}`}>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-[10px] uppercase tracking-widest text-white/70">{stage.title}</h3>
                <Badge variant="secondary" className="text-[9px] px-1.5 py-0 bg-white/5">{stageLeads.length}</Badge>
              </div>
              {stageTotal > 0 && (
                <span className="text-[10px] font-black text-muted-foreground">
                  €{Math.round(stageTotal).toLocaleString()}
                </span>
              )}
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto max-h-[calc(100vh-380px)] overflow-x-hidden pr-1 custom-scrollbar">
              {stageLeads.map(lead => (
                <Card
                  key={lead.website}
                  draggable
                  onDragStart={e => handleDragStart(e, lead.website)}
                  onClick={() => setSelectedDeal(lead)}
                  className="glass-card cursor-grab active:cursor-grabbing p-4 hover:border-accent/40 bg-card border-border/40 group mb-3"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-xs truncate max-w-[180px] group-hover:text-accent transition-colors uppercase tracking-tight">
                      {lead.name || 'New Lead'}
                    </h4>
                    {lead.is_immune && (
                      <ShieldAlert className="w-3.5 h-3.5 text-accent animate-pulse" />
                    )}
                  </div>
                  <p className="text-[9px] text-muted-foreground mb-4 truncate font-medium text-white/30">
                    {lead.website.replace(/^https?:\/\//, '')}
                  </p>
                  <div className="flex justify-between items-center bg-black/50 p-2 rounded-lg border border-border/10">
                    <span className="text-[8px] font-black uppercase text-white/30 tracking-widest">Net Total</span>
                    <span className="text-[10px] font-black">€{Math.round(lead.budget).toLocaleString()}</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

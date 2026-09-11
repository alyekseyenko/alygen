import React from 'react'
import { X, RefreshCw, CheckCheck, ShieldAlert, FileText } from 'lucide-react'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import QScoreGauge from '../gauges/QScoreGauge'
import { toast } from 'sonner';

export default function DrawerHeader({
  lead,
  effectiveAnalysis,
  privacyMode,
  availablePhones,
  isLeadSaved,
  promoting,
  handlePromoteLead,
  onClose,
  qScore
}) {
  const handleToggleImmunity = async () => {
    try {
      const newStatus = !(effectiveAnalysis.is_immune || false);
      const { data } = await axios.post('http://localhost:3001/api/crm/update', { 
        website: lead.website, 
        payload: { is_immune: newStatus } 
      });
      if (data.success) {
        toast.success(newStatus ? 'Immunity activated' : 'Immunity removed');
        effectiveAnalysis.is_immune = newStatus; 
        window.dispatchEvent(new CustomEvent('lead-updated', { detail: { website: lead.website, is_immune: newStatus } }));
      }
    } catch (e) {
      toast.error('Error updating immunity');
    }
  };

  return (
    <div className="border-b border-border p-6">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h2 className="text-3xl font-bold text-white mb-2">
            {privacyMode ? <span className="blur-lg select-none">{lead.name}</span> : lead.name}
          </h2>
          <a 
            href={lead.website} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-muted-foreground hover:text-accent text-sm transition-colors"
          >
            {privacyMode ? <span className="blur-sm select-none">{lead.website}</span> : lead.website}
          </a>
          {availablePhones.length > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-muted-foreground">Tel:</span>
              <a href={`tel:${availablePhones[0].replace(/\s/g, '')}`} className="text-accent hover:underline text-sm font-medium">
                {privacyMode ? <span className="blur-sm select-none">{availablePhones[0]}</span> : availablePhones[0]}
              </a>
            </div>
          )}
          {lead.address && (
            <p className="text-muted-foreground text-xs mt-1">
              {privacyMode ? <span className="blur-sm select-none">{lead.address}</span> : lead.address}
            </p>
          )}
        </div>
        <div className="flex gap-2 items-center">
          {lead.isTemporary && !isLeadSaved && (
            <Button 
              onClick={handlePromoteLead} 
              disabled={promoting}
              className="bg-green-600 hover:bg-green-700 text-white border-none shadow-lg shadow-green-900/20"
              size="sm"
            >
              {promoting ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <CheckCheck className="w-4 h-4 mr-2" />}
              Save to CRM
            </Button>
          )}
          {isLeadSaved && (
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
              ✓ Saved
            </Badge>
          )}
          <button
            onClick={handleToggleImmunity}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${
              effectiveAnalysis.is_immune 
                ? 'bg-accent/20 border-accent/50 text-accent font-bold' 
                : 'bg-white/5 border-white/10 text-white/40 hover:text-white/60'
            }`}
            title={effectiveAnalysis.is_immune ? "Immunity Active" : "Activate Immunity (Stop Automations)"}
          >
            <ShieldAlert className="w-4 h-4" />
            <span className="text-xs">{effectiveAnalysis.is_immune ? 'IMMUNE' : 'IMMUNIZE'}</span>
          </button>
          <Button 
            onClick={() => window.open(`/report/${encodeURIComponent(lead.website)}`, '_blank')}
            className="bg-accent hover:bg-accent/90 text-white flex items-center gap-1.5 px-3.5 h-9"
            title="Open Elite Report"
          >
            <FileText className="w-4 h-4" />
            <span className="text-xs font-black uppercase tracking-wider">Full Report</span>
          </Button>
          <Button onClick={onClose} variant="ghost" size="icon" className="hover:bg-white/10 h-9 w-9">
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>
      
      {/* QUICK STATS */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-muted/50 p-3 rounded-lg border border-border flex flex-col items-center">
          <p className="text-xs text-muted-foreground mb-2">Q Score</p>
          <QScoreGauge score={qScore.score} grade={qScore.grade} size="small" showLabel={false} />
        </div>
        <div className="bg-muted/50 p-3 rounded-lg border border-border">
          <div className="flex justify-between items-start mb-1">
            <p className="text-xs text-muted-foreground">Urgency</p>
            {effectiveAnalysis?.strategicInsights?.urgency_level && (
              <Badge variant="outline" className={`text-[10px] py-0 px-1 ${
                effectiveAnalysis.strategicInsights.urgency_level === 'CRITICAL' ? 'border-red-500 text-red-500' :
                effectiveAnalysis.strategicInsights.urgency_level === 'HIGH' ? 'border-orange-500 text-orange-500' :
                'border-green-500 text-green-500'
              }`}>
                {effectiveAnalysis.strategicInsights.urgency_level}
              </Badge>
            )}
          </div>
          <p className="text-2xl font-bold text-white capitalize">{effectiveAnalysis?.strategicInsights?.tone || 'N/A'}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Tone of Voice</p>
        </div>
        <div className="bg-muted/50 p-3 rounded-lg border border-border">
          <p className="text-xs text-muted-foreground mb-1">Benchmark</p>
          <p className={`text-2xl font-bold ${
            (qScore.benchmark?.status === 'urgent_gap') ? 'text-red-500' : 
            (qScore.benchmark?.status === 'market_leader') ? 'text-green-500' : 'text-white'
          }`}>
            {qScore.benchmark?.category_avg ? `${qScore.score - qScore.benchmark.category_avg > 0 ? '+' : ''}${qScore.score - qScore.benchmark.category_avg}` : 'N/A'}
          </p>
          <p className="text-[10px] text-muted-foreground uppercase">vs. Market Avg</p>
        </div>
        <div className="bg-muted/50 p-3 rounded-lg border border-border">
          <p className="text-xs text-muted-foreground mb-1">Priority</p>
          <p className="text-2xl font-bold text-white">{effectiveAnalysis.priority}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Lead Ranking</p>
        </div>
      </div>
    </div>
  )
}

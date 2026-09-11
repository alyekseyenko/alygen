import { useState } from 'react'
import {
  Plus, Trash2, Clock, Play, Pause, BarChart3, AlertCircle, RefreshCw, FileText, ChevronRight, Bell, Target, Globe, Calendar, XCircle, Smartphone
} from 'lucide-react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'

const workflowTemplates = [
  {
    name: 'Lead Quente',
    description: 'Dispara quando lead abre email 2x',
    icon: Bell,
    trigger: 'Email aberto',
    condition: 'open_count >= 2',
    actions: ['Notificação Telegram', 'Pausar sequência automática'],
    color: 'orange'
  },
  {
    name: 'Sem Pixel = Oportunidade',
    description: 'Detecta leads sem pixel e envia proposta',
    icon: Target,
    trigger: 'Lead analisado',
    condition: 'hasPixel === false AND tem email',
    actions: ['Enviar email template "pixel"', 'Aguardar 3 dias', 'Enviar WhatsApp'],
    color: 'red'
  },
  {
    name: 'Sem Site = Proposta Imediata',
    description: 'Para leads sem website',
    icon: Globe,
    trigger: 'Lead analisado',
    condition: 'isSocialMediaOnly === true',
    actions: ['Enviar email template "nowebsite"', 'Aguardar 4 dias'],
    color: 'blue'
  },
  {
    name: 'Score Crítico',
    description: 'Marca prioridade crítica para scores baixos',
    icon: AlertCircle,
    trigger: 'Lead analisado',
    condition: 'qScore < 30',
    actions: ['Marcar prioridade CRÍTICA', 'Webhook para n8n'],
    color: 'purple'
  },
  {
    name: 'Follow-up Automático Diário',
    description: 'Envia follow-ups automáticos',
    icon: Calendar,
    trigger: 'Schedule (09:00 diario)',
    condition: 'seq. enviou ha + 3 dias',
    actions: ['Enviar followup automaticamente'],
    color: 'green'
  },
  {
    name: 'Calendly Premium Flow',
    description: 'Fluxo completo de agendamento e lembretes',
    icon: Smartphone,
    trigger: 'Calendly Booking',
    condition: 'Aprovação Humana (Telegram)',
    actions: ['Email Premium', 'WhatsApp Confirm', 'Agenda AI', 'Lembrete 15m'],
    color: 'blue'
  }
]

export default function AutomationList({
  automations,
  loading,
  error,
  fetchAutomations,
  onConfigure,
  onToggleActive,
  onDelete,
  onCreateNew,
  onOpenLogs
}) {
  const [showTemplates, setShowTemplates] = useState(false)

  const handleTemplateClick = (template) => {
    const newWorkflow = {
      name: template.name,
      is_active: true,
      workflow_data: {
        nodes: [
          { id: '1', type: 'trigger', position: { x: 250, y: 100 }, data: { label: template.trigger, description: 'Template trigger' } },
          { id: '2', type: 'condition', position: { x: 250, y: 300 }, data: { label: template.condition, description: 'Template condition' } }
        ],
        edges: [{ id: 'e1-2', source: '1', target: '2', condition: 'true', animated: true, style: { stroke: '#FF4F00', strokeWidth: 2 } }]
      }
    }
    onConfigure(newWorkflow)
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 relative overflow-hidden font-sans">
      <div className="max-w-7xl mx-auto relative z-10">
        <header className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <div className="bg-accent/20 border border-accent/20 p-3 rounded-xl">
              <BarChart3 className="w-8 h-8 text-accent" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                Engine <span className="text-accent">Automation</span>
              </h1>
              <p className="text-white/50 mt-1">Intelligent automation workflows for high-performance CRM.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => setShowTemplates(!showTemplates)} variant="ghost" className="text-white/60 hover:text-white glass-button">
              <FileText className="w-4 h-4 mr-2" /> Templates
            </Button>
            <Button onClick={onCreateNew} className="bg-accent hover:bg-accent/80 text-white font-bold px-6 border-none shadow-[0_0_20px_rgba(255,79,0,0.3)]">
              <Plus className="w-4 h-4 mr-2" /> Custom Flow
            </Button>
          </div>
        </header>

        {showTemplates && (
          <div className="absolute right-0 top-24 w-80 bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl z-50 max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Templates</h2>
                <Button onClick={() => setShowTemplates(false)} variant="ghost" className="text-white/40 hover:text-white p-0 h-auto">
                  <XCircle className="w-5 h-5" />
                </Button>
              </div>
              <div className="space-y-4">
                {workflowTemplates.map((template, index) => (
                  <Card key={index} className="bg-white/5 border border-white/10 hover:border-accent/40 transition-all cursor-pointer p-0 rounded-xl overflow-hidden group" onClick={() => handleTemplateClick(template)}>
                    <div className="p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-orange-500/20">
                          <template.icon className="w-5 h-5 text-orange-400" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-bold text-white mb-0">{template.name}</div>
                          <div className="text-xs text-white/50">{template.description}</div>
                        </div>
                      </div>
                      <div className="text-[10px] text-white/40 mt-3 pt-3 border-t border-white/5">
                        <span className="text-white/60 font-medium">Trigger:</span> {template.trigger} <br />
                        <span className="text-white/60 font-medium">Condition:</span> {template.condition}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        {error ? (
          <div className="py-24 text-center border border-dashed border-white/10 rounded-3xl bg-white/5">
            <AlertCircle className="w-12 h-12 text-red-500/50 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white">Error loading automations</h3>
            <p className="text-white/40 text-sm">{error}</p>
            <Button onClick={fetchAutomations} className="mt-6 glass-button text-white">
              <RefreshCw className="w-4 h-4 mr-2" /> Retry
            </Button>
          </div>
        ) : automations.length === 0 && !loading ? (
          <div className="py-24 text-center border border-dashed border-white/10 rounded-3xl bg-white/5">
            <FileText className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">No active automations</h3>
            <p className="text-white/40 text-sm mb-6 max-w-sm mx-auto">Build your first workflow to start selling more on autopilot.</p>
            <Button onClick={onCreateNew} className="bg-accent hover:bg-accent/80 text-white font-bold px-8 shadow-[0_0_20px_rgba(255,79,0,0.3)]">
              Create Workflow
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {automations.map((auto) => (
              <Card key={auto.id} className="glass-card group relative overflow-hidden flex flex-col h-full">
                <CardHeader className="pb-3 flex-none">
                  <div className="flex items-center justify-between">
                    <Badge variant={auto.is_active ? "default" : "secondary"} className={auto.is_active ? "bg-accent/10 border-accent/30 text-accent font-bold px-2 py-0.5" : "bg-white/5 border-white/10 text-white/40 font-bold px-2 py-0.5"}>
                      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${auto.is_active ? 'bg-accent' : 'bg-white/40'}`}></span>
                      {auto.is_active ? 'ACTIVE' : 'PAUSED'}
                    </Badge>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-white/40 hover:text-white" onClick={() => onOpenLogs(auto.id)}><Clock className="w-3.5 h-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-white/40 hover:text-red-400" onClick={() => onDelete(auto.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <CardTitle className="text-lg mb-4 text-white group-hover:text-accent transition-colors font-bold break-words">{auto.name}</CardTitle>

                  <div className="text-xs text-white/40 bg-white/[0.02] p-3 rounded-lg border border-white/5 mb-6 flex-1 flex items-center justify-center">
                    <div className="flex items-center gap-2">
                      <span className="font-mono bg-white/10 px-1.5 py-0.5 rounded text-white/80">{auto.workflow_data?.nodes?.length || 0}</span> nodes
                      <span className="text-white/20">•</span>
                      <span className="font-mono bg-white/10 px-1.5 py-0.5 rounded text-white/80">{auto.workflow_data?.edges?.length || 0}</span> edges
                    </div>
                  </div>

                  <div className="flex gap-2 mt-auto">
                    <Button variant="outline" className="flex-1 glass-button text-xs" onClick={() => onConfigure(auto)}>
                      Open Canvas
                    </Button>
                    <Button variant="outline" className={`glass-button w-10 p-0 ${auto.is_active ? 'border-accent/30 bg-accent/10 text-accent hover:bg-accent/20' : ''}`} onClick={() => onToggleActive(auto)}>
                      {auto.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

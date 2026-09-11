import { 
  Zap, 
  Settings, 
  Filter, 
  Mail, 
  MessageCircle,
  Timer, 
  Database,
  Webhook,
  Bell,
  Brain,
  RefreshCw,
  Calendar,
  ShieldCheck,
  Smartphone,
  TrendingDown,
  Award
} from 'lucide-react'
import { Card } from '../ui/card'
import { ScrollArea } from '../ui/scroll-area'

const categories = [
  {
    name: 'Triggers',
    items: [
      { type: 'trigger', label: 'Lead Analyzed', icon: Zap, iconName: 'Zap', description: 'Starts workflow when lead is processed', color: 'accent' },
      { type: 'trigger', label: 'Calendly Booking', icon: Calendar, iconName: 'Calendar', description: 'Starts workflow on new meeting', color: 'accent' },
      { type: 'trigger', label: 'Schedule', icon: Timer, iconName: 'Timer', description: 'Starts at specific time', color: 'accent' }
    ]
  },
  {
    name: 'Actions',
    items: [
      { type: 'action', data: { actionType: 'send_email' }, label: 'Send Email', icon: Mail, iconName: 'Mail', description: 'Send auto email', color: 'blue' },
      { type: 'action', data: { actionType: 'whatsapp' }, label: 'Send WhatsApp', icon: MessageCircle, iconName: 'MessageCircle', description: 'Send automated WA message', color: 'green' },
      { type: 'action', data: { actionType: 'google_sheets', config: { spreadsheetId: '', sheetName: 'Results', mapping: { 'Nome': '{{lead.name}}', 'Email': '{{lead.email}}', 'WhatsApp': '{{lead.phone}}', 'Qscore': '{{analysis.qScore}}' } } }, label: 'Google Sheets', icon: Database, iconName: 'Database', description: 'Append row to sheet', color: 'green' },
      { type: 'action', data: { actionType: 'notify_admin' }, label: 'Notify Admin', icon: Bell, iconName: 'Bell', description: 'Email de alerta ao Administrador', color: 'accent' },
      { type: 'action', data: { actionType: 'telegram_approval' }, label: 'Telegram Approval', icon: Smartphone, iconName: 'Smartphone', description: 'Human approval in-app/bot', color: 'blue' },
      { type: 'action', data: { actionType: 'meeting_reminder' }, label: 'Agenda Reminder', icon: Calendar, iconName: 'Calendar', description: 'Schedule appointment/notification', color: 'green' },
      { type: 'action', data: { actionType: 'ai_personalizer', config: { prompt: '' } }, label: 'AI Personalizer', icon: Brain, iconName: 'Brain', description: 'Gera um pitch de vendas com IA', color: 'accent' },
      { type: 'action', data: { actionType: 'update_lead', config: { field: 'status', value: 'hot' } }, label: 'Update Lead', icon: Database, iconName: 'Database', description: 'Update CRM field', color: 'default' },
      { type: 'action', data: { actionType: 'webhook', config: { url: '', method: 'POST' } }, label: 'Webhook', icon: Webhook, iconName: 'Webhook', description: 'Send data to an external URL', color: 'accent' },
      { type: 'action', data: { backendType: 'wait', config: { delay: 86400 } }, label: 'Wait (Delay)', icon: Timer, iconName: 'Timer', description: 'Pause workflow (seconds)', color: 'purple' },
      { type: 'action', data: { actionType: 'trigger_next_lead' }, label: 'Autopilot (Próximo)', icon: RefreshCw, iconName: 'RefreshCw', description: 'Trigger sequence for next lead', color: 'orange' }
    ]
  },
  {
    name: 'Strategic Logic (Python)',
    items: [
      { type: 'condition', data: { config: { property: 'urgency_level', operator: 'eq', value: 'CRÍTICA' } }, label: 'Urgency: Critical', icon: ShieldCheck, iconName: 'ShieldCheck', description: 'If site shows abandonment', color: 'red' },
      { type: 'condition', data: { config: { property: 'benchmark_status', operator: 'eq', value: 'urgent_gap' } }, label: 'Market Gap Awareness', icon: TrendingDown, iconName: 'TrendingDown', description: 'If score is below city avg', color: 'orange' },
      { type: 'condition', data: { config: { property: 'tone', operator: 'eq', value: 'luxury' } }, label: 'Tone: Premium', icon: Award, iconName: 'Award', description: 'Branch for luxury brands', color: 'indigo' }
    ]
  },
  {
    name: 'General Logic',
    items: [
      { type: 'condition', data: { config: { property: 'isSocialMediaOnly', operator: 'eq', value: 'true' } }, label: 'Condition', icon: Filter, iconName: 'Filter', description: 'If/Else branching (ex: Has Website)', color: 'yellow' }
    ]
  }
]

export default function Sidebar() {
  const onDragStart = (event, nodeType, item) => {
    event.dataTransfer.setData('application/reactflow', nodeType)
    event.dataTransfer.setData('application/json', JSON.stringify(item))
    event.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div className="w-80 bg-black/80 backdrop-blur-md border-r border-white/10 flex flex-col h-full z-10 relative">
      <div className="p-4 border-b border-white/10">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Zap className="w-5 h-5 text-accent" />
          Nodes
        </h2>
        <p className="text-white/50 text-xs mt-1">Drag and drop to build automations.</p>
      </div>
      
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-6">
          {categories.map((cat, i) => (
            <div key={i}>
              <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3">
                {cat.name}
              </h3>
              <div className="space-y-2">
                {cat.items.map((item, j) => {
                  const Icon = item.icon
                  return (
                    <div 
                      key={j}
                      onDragStart={(event) => onDragStart(event, item.type, item)}
                      draggable
                      className="glass-card p-3 flex items-center gap-3 cursor-grab active:cursor-grabbing hover:bg-white/5 border border-white/5"
                    >
                      <div className="p-2 rounded bg-white/5">
                        <Icon className="w-4 h-4 text-white/80" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">{item.label}</div>
                        <div className="text-xs text-white/40">{item.description}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}

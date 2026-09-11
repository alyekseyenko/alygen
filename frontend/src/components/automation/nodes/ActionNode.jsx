import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import { Settings, Mail, Timer, Database, Webhook, Zap, Filter, Bell, MessageSquare } from 'lucide-react'

const iconMap = {
  Settings, Mail, Timer, Database, Webhook, Zap, Filter, Bell, MessageSquare
}

function ActionNode({ data }) {
  const Icon = data.iconName && iconMap[data.iconName] ? iconMap[data.iconName] : Settings
  const color = data.color || 'blue'
  const colorMap = {
    blue: 'border-blue-500/50 text-blue-500 bg-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]',
    green: 'border-green-500/50 text-green-500 bg-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.1)]',
    purple: 'border-purple-500/50 text-purple-500 bg-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.1)]',
    red: 'border-red-500/50 text-red-500 bg-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]',
    accent: 'border-orange-500/50 text-orange-500 bg-orange-500/20 shadow-[0_0_15px_rgba(255,79,0,0.1)]',
    default: 'border-white/20 text-white bg-white/10'
  }

  const borderClass = colorMap[color] || colorMap.default
  const solidColorClass = borderClass.split(' ')[1] // Gets text-color

  return (
    <div className={`glass-card w-[280px] ${borderClass.split(' ')[0]} ${borderClass.split(' ')[3] || ''} relative overflow-hidden group transition-all`}>
      <Handle
        type="target"
        position={Position.Top}
        className={`w-3 h-3 ${solidColorClass.replace('text-', 'bg-')} border-2 border-black`}
        isConnectable={true}
      />
      
      <div className="absolute top-0 left-0 w-1 h-full bg-current opacity-50"></div>
      
      <div className="p-4">
        <div className="flex items-center gap-3 mb-2">
          <div className={`p-2 rounded-lg ${borderClass.split(' ')[2]}`}>
            <Icon className={`w-5 h-5 ${solidColorClass}`} />
          </div>
          <div>
            <div className={`text-xs font-bold ${solidColorClass} uppercase tracking-wider`}>Action</div>
            <div className="text-sm font-bold text-white">{data.label || 'New Action'}</div>
          </div>
        </div>
        
        {data.description && (
          <div className="text-xs text-white/60 mt-2 pl-11">
            {data.description}
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className={`w-3 h-3 ${solidColorClass.replace('text-', 'bg-')} border-2 border-black`}
        isConnectable={true}
      />
    </div>
  )
}

export default memo(ActionNode)

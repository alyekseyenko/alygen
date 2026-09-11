import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import { Zap } from 'lucide-react'

function TriggerNode({ data }) {
  return (
    <div className="glass-card w-[280px] border-orange-500/50 shadow-[0_0_15px_rgba(255,79,0,0.1)] relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-1 h-full bg-orange-500"></div>
      
      <div className="p-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-orange-500/20">
            <Zap className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <div className="text-xs font-bold text-orange-500 uppercase tracking-wider">Trigger</div>
            <div className="text-sm font-bold text-white">{data.label || 'New Trigger'}</div>
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
        className="w-3 h-3 bg-orange-500 border-2 border-black"
        isConnectable={true}
      />
    </div>
  )
}

export default memo(TriggerNode)

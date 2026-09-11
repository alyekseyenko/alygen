import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import { Filter } from 'lucide-react'

function ConditionNode({ data }) {
  return (
    <div className="glass-card w-[280px] border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.1)] relative overflow-hidden group">
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-yellow-500 border-2 border-black"
        isConnectable={true}
      />
      
      <div className="absolute top-0 left-0 w-1 h-full bg-yellow-500"></div>
      
      <div className="p-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-yellow-500/20">
            <Filter className="w-5 h-5 text-yellow-500" />
          </div>
          <div>
            <div className="text-xs font-bold text-yellow-500 uppercase tracking-wider">Condition</div>
            <div className="text-sm font-bold text-white">{data.label || 'If/Else'}</div>
          </div>
        </div>
        
        {data.description && (
          <div className="text-xs text-white/60 mt-2 pl-11">
            {data.description}
          </div>
        )}
      </div>

      <div className="w-full flex justify-between absolute bottom-0 left-0 transform translate-y-1/2 px-8">
        <Handle
          type="source"
          id="true"
          position={Position.Bottom}
          className="w-3 h-3 bg-green-500 border-2 border-black"
          isConnectable={true}
        />
        <Handle
          type="source"
          id="false"
          position={Position.Bottom}
          className="w-3 h-3 bg-red-500 border-2 border-black"
          isConnectable={true}
        />
      </div>
    </div>
  )
}

export default memo(ConditionNode)

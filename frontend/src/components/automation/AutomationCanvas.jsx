import { useState, useCallback, useRef } from 'react'
import {
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Save, ArrowLeft, Play, Pause, RefreshCw } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Badge } from '../ui/badge'
import { toast } from 'sonner'
import TriggerNode from './nodes/TriggerNode'
import ActionNode from './nodes/ActionNode'
import ConditionNode from './nodes/ConditionNode'
import Sidebar from './Sidebar'
import SettingsPanel from './SettingsPanel'
import { api } from '../../utils/api'

const nodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
  condition: ConditionNode,
}

let id = 1
const getId = () => `node_v2_${id++}_${Date.now()}`

function Canvas({ workflow, onBack, fetchAutomations }) {
  const reactFlowWrapper = useRef(null)

  // Initialize nodes ensuring backwards compatibility where possible
  const initNodes = (workflow?.workflow_data?.nodes || []).map(n => ({
    ...n,
    // Restoring visual 'type' if it was mapped as generic Action for wait delays
    type: n.data?.originalRfType || (n.type === 'wait' ? 'action' : n.type),
    data: {
      ...n.data,
      label: n.data?.label || n.config?.title || 'Imported Node'
    }
  }))

  // Initialize edges from new reactFlowEdges or fallback to translating backend edges mapping
  const initEdges = workflow?.workflow_data?.reactFlowEdges || (workflow?.workflow_data?.edges?.map((e, index) => ({
    id: `edge_${index}_${e.from}_${e.to}`,
    source: e.from,
    target: e.to,
    sourceHandle: e.condition,
    animated: true,
    style: { stroke: '#FF4F00', strokeWidth: 2 }
  })) || [])

  const [nodes, setNodes, onNodesChange] = useNodesState(initNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initEdges)
  const [reactFlowInstance, setReactFlowInstance] = useState(null)
  
  const [name, setName] = useState(workflow?.name || 'New Workflow')
  const [isActive, setIsActive] = useState(workflow?.is_active ?? true)
  const [selectedNode, setSelectedNode] = useState(null)
  const [isTesting, setIsTesting] = useState(false)

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#FF4F00', strokeWidth: 2 } }, eds)),
    [setEdges],
  )

  const onDragOver = useCallback((event) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (event) => {
      event.preventDefault()

      const type = event.dataTransfer.getData('application/reactflow')
      if (typeof type === 'undefined' || !type) return

      const itemData = JSON.parse(event.dataTransfer.getData('application/json'))
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      })

      const newNode = {
        id: getId(),
        type,
        position,
        data: { 
          label: itemData.label, 
          description: itemData.description, 
          iconName: itemData.iconName, 
          color: itemData.color,
          actionType: itemData.data?.actionType,
          backendType: itemData.data?.backendType,
          config: itemData.data?.config || {},
          originalRfType: type
        },
      }

      setNodes((nds) => nds.concat(newNode))
    },
    [reactFlowInstance, setNodes],
  )

  const onNodeClick = (_, node) => setSelectedNode(node)
  const onPaneClick = () => setSelectedNode(null)
  const onEdgeClick = (_, edge) => {
    if (window.confirm('Quer apagar esta ligação?')) {
      setEdges((eds) => eds.filter((e) => e.id !== edge.id))
    }
  }

  const handleUpdateNode = (updatedNode) => {
    setNodes((nds) => nds.map((n) => (n.id === updatedNode.id ? updatedNode : n)))
    setSelectedNode(updatedNode)
  }

  const handleDeleteNode = (id) => {
    setNodes((nds) => nds.filter((n) => n.id !== id))
    setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id))
    setSelectedNode(null)
  }

  const handleDuplicateNode = (node) => {
    const newNode = {
      ...node,
      id: getId(),
      position: { x: node.position.x + 50, y: node.position.y + 50 }
    }
    setNodes((nds) => nds.concat(newNode))
  }

  const saveWorkflow = async () => {
    try {
      // 1. Adapter for Backend execution format (Engine requires from, to, condition, and specific node structure)
      const backendNodes = nodes.map(n => ({
        id: n.id,
        type: n.data?.backendType || n.type,  // e.g if 'wait', override visual type
        actionType: n.data?.actionType,
        config: n.data?.config,
        position: n.position,
        data: n.data // Keep visual ReactFlow states preserved
      }))

      const backendEdges = edges.map(e => ({
        from: e.source,
        to: e.target,
        condition: e.sourceHandle || undefined
      }))

      const payload = {
        id: workflow?.id,
        name,
        is_active: isActive,
        workflow_data: { 
          nodes: backendNodes, 
          edges: backendEdges, 
          reactFlowEdges: edges 
        }
      }

      await api.post('/automations', payload)
      toast.success('Workflow saved successfully!')
      fetchAutomations()
    } catch (error) {
      toast.error('Error saving workflow.')
    }
  }

  const testWorkflow = async () => {
    setIsTesting(true)
    try {
      const backendNodes = nodes.map(n => ({
        id: n.id,
        type: n.data?.backendType || n.type,
        actionType: n.data?.actionType,
        config: n.data?.config,
        data: n.data
      }))

      const backendEdges = edges.map(e => ({
        from: e.source,
        to: e.target,
        condition: e.sourceHandle || undefined
      }))

      const payload = {
        workflow: { nodes: backendNodes, edges: backendEdges }
      }

      toast.loading('Testing workflow...', { id: 'testing-workflow' })
      const res = await api.post('/automations/test', payload)
      toast.dismiss('testing-workflow')
      
      if (res.data?.success) {
        toast.success(`Workflow tested with lead: ${res.data.lead?.name}`)
        console.log("TEST LOGS:", res.data.logs)
        alert("Workflow Test Results:\n\n" + res.data.logs.join('\n'))
      } else {
        toast.error(res.data?.error || 'Test failed')
      }
    } catch (error) {
      toast.dismiss('testing-workflow')
      toast.error(error.response?.data?.error || 'Error testing workflow.')
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <div className="flex h-screen w-full bg-black overflow-hidden relative">
      <Sidebar />
      
      <div className="flex-1 flex flex-col h-full relative" ref={reactFlowWrapper}>
        <div className="h-16 border-b border-white/10 bg-black/50 backdrop-blur-md flex items-center justify-between px-6 absolute top-0 left-0 right-0 z-10 pointer-events-none">
          <div className="flex items-center gap-4 pointer-events-auto">
            <Button variant="ghost" size="icon" onClick={onBack} className="text-white/60 hover:text-white rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="h-6 w-px bg-white/10"></div>
            <Input 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              className="bg-transparent border-none text-xl font-bold p-0 h-auto focus-visible:ring-0 w-64 text-white placeholder:text-white/20"
              placeholder="Workflow Name"
            />
            <Badge variant={isActive ? "default" : "secondary"} className={isActive ? "bg-accent/20 text-accent border-accent/30 pointer-events-none" : "pointer-events-none"}>
              {isActive ? 'ON' : 'OFF'}
            </Badge>
          </div>
          
          <div className="flex items-center gap-3 pointer-events-auto">
            <Button 
              variant="outline" 
              className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10 hover:text-purple-300"
              onClick={testWorkflow}
              disabled={isTesting}
            >
              {isTesting ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />} 
              {isTesting ? 'Testing...' : 'Test Workflow'}
            </Button>
            <Button 
              variant="outline" 
              className={`border-white/10 ${isActive ? 'text-red-400 hover:bg-red-500/10 hover:text-red-400' : 'text-green-400 hover:bg-green-500/10 hover:text-green-400'}`}
              onClick={() => setIsActive(!isActive)}
            >
              {isActive ? <><Pause className="w-4 h-4 mr-2" /> Pause</> : <><Play className="w-4 h-4 mr-2" /> Activate</>}
            </Button>
            <Button onClick={saveWorkflow} className="bg-accent hover:bg-accent/80 text-white font-bold px-6 shadow-[0_0_20px_rgba(255,79,0,0.3)] border-none">
              <Save className="w-4 h-4 mr-2" /> Save
            </Button>
          </div>
        </div>

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={setReactFlowInstance}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          onEdgeClick={onEdgeClick}
          nodeTypes={nodeTypes}
          fitView
          className="bg-black/95 pt-16"
          defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        >
          <Background color="#ffffff" gap={20} size={1} variant="dots" className="opacity-10" />
          <Controls className="fill-white bg-black/50 border border-white/10 text-white [&>button]:border-white/10 [&>button]:hover:bg-white/10" />
        </ReactFlow>

        {selectedNode && (
          <SettingsPanel 
            node={selectedNode} 
            onClose={() => setSelectedNode(null)} 
            onUpdate={handleUpdateNode}
            onDelete={handleDeleteNode}
            onDuplicate={handleDuplicateNode}
          />
        )}
      </div>
    </div>
  )
}

export default function AutomationCanvas(props) {
  return (
    <ReactFlowProvider>
      <Canvas {...props} />
    </ReactFlowProvider>
  )
}

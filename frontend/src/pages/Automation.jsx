import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { api } from '../utils/api'
import AutomationList from '../components/automation/AutomationList'
import AutomationCanvas from '../components/automation/AutomationCanvas'
import LogsModal from '../components/automation/LogsModal'

export default function Automation() {
  const [automations, setAutomations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeWorkflow, setActiveWorkflow] = useState(null)
  const [selectedLogsId, setSelectedLogsId] = useState(null)

  useEffect(() => {
    fetchAutomations()
  }, [])

  async function fetchAutomations() {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get('/automations')
      setAutomations(data.data || [])
    } catch (error) {
      setError('Error loading automations')
      toast.error('Error loading automations')
    } finally {
      setLoading(false)
    }
  }

  async function handleToggleActive(automation) {
    try {
      await api.post('/automations', {
        ...automation,
        is_active: !automation.is_active
      })
      fetchAutomations()
      toast.success(automation.is_active ? 'Automation paused' : 'Automation activated')
    } catch (error) {
      toast.error('Failed to update automation state')
    }
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this automation?')) return
    try {
      await api.delete(`/automations/${id}`)
      fetchAutomations()
      toast.success('Automation deleted')
    } catch (error) {
      toast.error('Failed to delete automation')
    }
  }

  function handleCreateNew() {
    const newWorkflow = {
      is_active: true,
      workflow_data: {
        nodes: [],
        edges: []
      }
    }
    setActiveWorkflow(newWorkflow)
  }

  function handleOpenLogs(id) {
    setSelectedLogsId(id)
  }

  if (activeWorkflow) {
    return (
      <AutomationCanvas 
        workflow={activeWorkflow} 
        onBack={() => setActiveWorkflow(null)} 
        fetchAutomations={fetchAutomations}
      />
    )
  }

  return (
    <>
      <AutomationList 
        automations={automations}
        loading={loading}
        error={error}
        fetchAutomations={fetchAutomations}
        onConfigure={setActiveWorkflow}
        onToggleActive={handleToggleActive}
        onDelete={handleDelete}
        onCreateNew={handleCreateNew}
        onOpenLogs={handleOpenLogs}
      />
      {selectedLogsId && (
        <LogsModal 
          automationId={selectedLogsId} 
          onClose={() => setSelectedLogsId(null)} 
        />
      )}
    </>
  )
}

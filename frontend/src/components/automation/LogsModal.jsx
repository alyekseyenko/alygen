import { useState, useEffect } from 'react'
import { 
  X, Clock, CheckCircle, AlertCircle, ExternalLink, ChevronDown, ChevronUp, Loader2
} from 'lucide-react'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { api } from '../../utils/api'
import { format } from 'date-fns'

export default function LogsModal({ automationId, onClose }) {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedLog, setExpandedLog] = useState(null)

  useEffect(() => {
    if (automationId) fetchLogs()
  }, [automationId])

  async function fetchLogs() {
    setLoading(true)
    try {
      const { data } = await api.get(`/automations/${automationId}/logs`)
      setLogs(data.data || [])
    } catch (error) {
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-white/10 w-full max-w-4xl max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <header className="p-6 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent/20">
              <Clock className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Execution Logs</h2>
              <p className="text-white/40 text-xs">History of automation runs and their outcomes.</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-white/40 hover:text-white">
            <X className="w-6 h-6" />
          </Button>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-10 h-10 text-accent animate-spin" />
              <p className="text-white/40">Fetching logs...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-white/5 rounded-2xl bg-white/[0.01]">
              <Clock className="w-12 h-12 text-white/10 mx-auto mb-4" />
              <p className="text-white/40">No execution logs found for this automation.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <div key={log.id} className="border border-white/5 bg-white/[0.02] rounded-xl overflow-hidden hover:border-white/10 transition-colors">
                  <div 
                    className="p-4 flex items-center justify-between cursor-pointer"
                    onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                  >
                    <div className="flex items-center gap-4">
                      {log.status === 'success' ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : log.status === 'skipped' ? (
                        <AlertCircle className="w-5 h-5 text-yellow-500" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      )}
                      <div>
                        <div className="text-sm font-medium text-white flex items-center gap-2">
                          Lead: <span className="text-accent">{log.details?.leadName || log.details?.leadWebsite || log.lead_id?.substring(0,12) || 'Unknown'}</span>
                          <span className="text-white/20">•</span>
                          {format(new Date(log.created_at), 'dd/MM HH:mm')}
                        </div>
                        <div className="text-xs text-white/40 max-w-md truncate">{log.details?.leadWebsite || log.details?.reason || 'No message'}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className={
                        log.status === 'success' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                        log.status === 'skipped' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                        'bg-red-500/10 text-red-400 border-red-500/20'
                      }>
                        {log.status.toUpperCase()}
                      </Badge>
                      {expandedLog === log.id ? <ChevronUp className="w-5 h-5 text-white/20" /> : <ChevronDown className="w-5 h-5 text-white/20" />}
                    </div>
                  </div>
                  
                  {expandedLog === log.id && (
                    <div className="px-4 pb-4 pt-0 border-t border-white/[0.03] bg-black/20">
                      <div className="mt-4 space-y-3">
                         <div className="grid grid-cols-2 gap-4">
                            <div>
                               <div className="text-[10px] uppercase tracking-wider text-white/30 mb-1">Execution Steps</div>
                               <pre className="text-[10px] font-mono p-3 bg-black/40 rounded-lg text-white/70 overflow-x-auto">
                                  {JSON.stringify(log.details?.steps || [], null, 2)}
                               </pre>
                            </div>
                            <div>
                               <div className="text-[10px] uppercase tracking-wider text-white/30 mb-1">Raw Context</div>
                               <pre className="text-[10px] font-mono p-3 bg-black/40 rounded-lg text-white/70 overflow-x-auto max-h-[200px]">
                                  {JSON.stringify(log.details?.context || {}, null, 2)}
                                </pre>
                            </div>
                         </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <footer className="p-4 border-t border-white/10 bg-white/[0.02] flex justify-end">
          <Button onClick={onClose} className="glass-button text-white">Close</Button>
        </footer>
      </div>
    </div>
  )
}

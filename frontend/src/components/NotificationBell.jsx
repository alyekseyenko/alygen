import { useState, useEffect, useRef } from 'react'
import { Bell, Eye, Mail, X, CheckCheck } from 'lucide-react'
import { toast } from 'sonner'
import { useSequences } from '../hooks/useSequences'

function timeAgo(iso) {
  if (!iso) return ''
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60)    return `${diff}s ago`
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return new Date(iso).toLocaleDateString('en-US')
}

export default function NotificationBell() {
  const [open,          setOpen]          = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unread,        setUnread]        = useState(0)
  const prevOpenCountsRef = useRef({})
  const ref = useRef(null)

  // ── Single shared query (no more setInterval!) ──────────────────────────────
  const { data: sequences = [] } = useSequences()

  // ── Detect new opens whenever sequences data changes ────────────────────────
  useEffect(() => {
    if (!sequences.length) return

    const newNotifications = []
    let newUnread = 0

    sequences.forEach(seq => {
      const prev = prevOpenCountsRef.current[seq.id] ?? seq.open_count

      // New open detected
      if ((seq.open_count || 0) > prev) {
        const count = seq.open_count - prev
        toast.success(`Email opened! ${seq.lead_name || seq.email}`, {
          description: count > 1 ? `+${count} new openings` : 'opened now',
          duration: 6000,
        })
        newUnread++
      }

      if ((seq.open_count || 0) > 0) {
        newNotifications.push({
          id:             seq.id,
          name:           seq.lead_name || seq.email,
          email:          seq.email,
          open_count:     seq.open_count,
          last_opened_at: seq.last_opened_at,
          status:         seq.status,
          isNew: (seq.open_count || 0) > (prevOpenCountsRef.current[seq.id] ?? seq.open_count),
        })
      }

      prevOpenCountsRef.current[seq.id] = seq.open_count || 0
    })

    newNotifications.sort((a, b) => new Date(b.last_opened_at) - new Date(a.last_opened_at))
    setNotifications(newNotifications)
    if (newUnread > 0) setUnread(prev => prev + newUnread)
  }, [sequences])

  // ── Close on outside click ──────────────────────────────────────────────────
  useEffect(() => {
    function handle(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  function handleOpen() {
    setOpen(prev => !prev)
    if (!open) setUnread(0)
  }

  const stageLabel = status => ({ sent: 'D1', followup1: 'D3', followup2: 'D7' }[status] || 'OK')

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleOpen}
        className={`relative w-8 h-8 rounded-lg border flex items-center justify-center transition-all ${
          unread > 0
            ? 'bg-green-500/10 border-green-500/25 text-green-400'
            : 'bg-white/[0.04] border-white/[0.08] text-white/35 hover:text-white/60 hover:bg-white/[0.07]'
        }`}
        title="Notificações de email"
      >
        <Bell className="w-3.5 h-3.5" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-green-500 text-white text-[9px] font-black rounded-full flex items-center justify-center leading-none">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-80 glass-card border-0 shadow-2xl z-50 overflow-hidden" data-animate="scale-in">
          {/* Header */}
          <div className="px-4 py-3 border-b border-white/[0.05] flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-white">Notificações</p>
              <p className="text-[10px] text-white/30">{notifications.length} emails abertos · atualiza a cada 60s</p>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/25 hover:text-white/60 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* List */}
          <div className="overflow-y-auto max-h-80 scrollbar-thin">
            {notifications.length === 0 ? (
              <div className="py-10 text-center">
                <Mail className="w-8 h-8 text-white/10 mx-auto mb-2" />
                <p className="text-sm text-white/25">Nenhuma abertura ainda</p>
                <p className="text-[10px] text-white/15 mt-1">As notificações aparecerão aqui</p>
              </div>
            ) : (
              notifications.map(n => (
                <div key={n.id}
                  className={`px-4 py-3 border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors flex items-start gap-3 ${n.isNew ? 'bg-green-500/[0.03]' : ''}`}>
                  <div className="w-7 h-7 rounded-full bg-green-500/10 border border-green-500/15 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCheck className="w-3.5 h-3.5 text-green-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-white truncate">{n.name}</p>
                      <span className="text-[9px] font-black uppercase text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded shrink-0">
                        {stageLabel(n.status)}
                      </span>
                    </div>
                    <p className="text-[11px] text-white/35 truncate">{n.email}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-green-400 font-bold">
                        <Eye className="w-2.5 h-2.5 inline mr-0.5" />
                        {n.open_count} {n.open_count === 1 ? 'view' : 'views'}
                      </span>
                      <span className="text-[10px] text-white/20">·</span>
                      <span className="text-[10px] text-white/25">{timeAgo(n.last_opened_at)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

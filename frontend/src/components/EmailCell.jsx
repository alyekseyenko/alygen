import { Copy, CheckCheck, Eye, Plus, Check, Loader2 } from 'lucide-react'

/**
 * EmailCell — Renders the email column for a lead row.
 * Supports inline editing, copy-to-clipboard and sequence status indicators.
 */
export default function EmailCell({
  lead,
  privacyMode,
  editingEmail,
  setEditingEmail,
  savingEmail,
  onSave,
}) {
  const allEmails = [
    ...(lead.analysis?.extractedEmails || []),
    ...(lead.email ? [lead.email] : []),
  ].filter((v, i, s) => s.indexOf(v) === i)

  const isEditing = editingEmail?.leadId === lead.id

  if (isEditing) return (
    <div className="flex flex-col gap-1">
      <input
        type="email"
        value={editingEmail.value}
        onChange={e => setEditingEmail({ ...editingEmail, value: e.target.value })}
        onKeyDown={e => {
          if (e.key === 'Enter')  onSave(lead)
          if (e.key === 'Escape') setEditingEmail(null)
        }}
        placeholder="email@exemplo.com"
        autoFocus
        className="px-2 py-1 bg-white/10 border border-[hsl(18,100%,52%)/0.4] rounded text-xs text-white focus:outline-none w-full"
      />
      <div className="flex gap-1">
        <button
          onClick={() => onSave(lead)}
          disabled={savingEmail}
          className="px-2 py-0.5 bg-[hsl(18,100%,52%)/0.15] hover:bg-[hsl(18,100%,52%)/0.25] text-[hsl(18,100%,62%)] rounded text-xs flex items-center gap-1 transition-all"
        >
          {savingEmail ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
          Save
        </button>
        <button
          onClick={() => setEditingEmail(null)}
          className="px-2 py-0.5 bg-white/5 hover:bg-white/10 text-white/40 rounded text-xs transition-all"
        >
          Cancel
        </button>
      </div>
    </div>
  )

  return (
    <div
      className="flex flex-col gap-1 cursor-pointer group"
      onDoubleClick={e => { e.stopPropagation(); setEditingEmail({ leadId: lead.id, value: '' }) }}
      title="Double-click to add/edit email"
    >
      {allEmails.length > 0 ? (
        <>
          {allEmails.slice(0, 2).map((email, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <button
                onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(email) }}
                className="px-2 py-1 bg-white/[0.06] hover:bg-white/10 text-white/70 rounded text-xs transition-all flex items-center gap-1 justify-between flex-1 group/em"
                title="Click to copy"
              >
                <span className="truncate max-w-[120px]">
                  {lead.analysis?.customEmail === email && (
                    <span className="text-[hsl(18,100%,62%)] mr-1">✎</span>
                  )}
                  {privacyMode
                    ? <span className="blur-sm select-none">{email}</span>
                    : email
                  }
                </span>
                <Copy className="w-3 h-3 opacity-0 group-hover/em:opacity-60 transition-opacity shrink-0" />
              </button>

              {lead.sequenceStatus && i === 0 && (
                <div className="flex items-center gap-1 shrink-0">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[7px] font-black border ${
                    lead.sequenceStatus.open_count > 0
                      ? 'bg-green-500/10 border-green-500/30 text-green-400'
                      : 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                  }`}>
                    {{ sent: 'D1', followup1: 'D3', followup2: 'D7', replied: 'OK' }[lead.sequenceStatus.status] || '•'}
                  </div>
                  {lead.sequenceStatus.open_count > 0
                    ? <CheckCheck className="w-3 h-3 text-green-500" strokeWidth={3} />
                    : <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                  }
                </div>
              )}
            </div>
          ))}
          <span className="text-[10px] text-white/20 opacity-0 group-hover:opacity-100 transition-opacity">
            Double-click to edit
          </span>
        </>
      ) : (
        <button
          onClick={e => { e.stopPropagation(); setEditingEmail({ leadId: lead.id, value: '' }) }}
          className="px-2 py-1 bg-white/[0.03] hover:bg-[hsl(18,100%,52%)/0.08] border border-dashed border-white/10 hover:border-[hsl(18,100%,52%)/0.3] text-white/25 hover:text-[hsl(18,100%,62%)] rounded text-xs transition-all flex items-center gap-1"
        >
          <Plus className="w-3 h-3" /> Add email
        </button>
      )}
    </div>
  )
}

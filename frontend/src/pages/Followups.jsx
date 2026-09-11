import { useEffect, useMemo, useState } from 'react'
import { Pause, Play, XCircle, RefreshCw, Mail, Globe, Clock, CheckCircle2, Eye, CheckCheck } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { Input } from '../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { api } from '../utils/api'

function daysSince(iso) {
  if (!iso) return null
  const ms = Date.now() - new Date(iso).getTime()
  return Math.floor(ms / (1000 * 60 * 60 * 24))
}

function formatDate(iso) {
  if (!iso) return '-'
  try {
    return new Date(iso).toLocaleString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch {
    return iso
  }
}

function addDays(iso, days) {
  if (!iso) return null
  const d = new Date(iso)
  d.setDate(d.getDate() + days)
  return d.toISOString()
}

function daysUntil(iso) {
  if (!iso) return null
  const ms = new Date(iso).getTime() - Date.now()
  return Math.ceil(ms / (1000 * 60 * 60 * 24))
}

function nextSendInfo(seq) {
  // Backend rules:
  // - followup1: sent_at + 3 days if status=sent
  // - followup2: followup1_sent_at + 4 days if status=followup1
  if (!seq) return { label: '-', dateIso: null, days: null, ready: false }
  if (seq.status === 'cancelled' || seq.status === 'replied' || seq.status === 'followup2') return { label: '—', dateIso: null, days: null, ready: false }
  if (seq.paused) return { label: 'Paused', dateIso: null, days: null, ready: false }

  if (seq.status === 'sent') {
    const dateIso = addDays(seq.sent_at, 3)
    const d = daysUntil(dateIso)
    const ready = d !== null && d <= 0
    return { label: ready ? 'Ready (Day 3)' : `Day 3 in ${d}d`, dateIso, days: d, ready }
  }
  if (seq.status === 'followup1') {
    const dateIso = addDays(seq.followup1_sent_at, 4)
    const d = daysUntil(dateIso)
    const ready = d !== null && d <= 0
    return { label: ready ? 'Ready (Day 7)' : `Day 7 in ${d}d`, dateIso, days: d, ready }
  }
  return { label: '-', dateIso: null, days: null, ready: false }
}

function StatusBadge({ seq }) {
  const status = seq.status
  const paused = !!seq.paused

  const { label, className } = (() => {
    if (status === 'replied') return { label: 'Replied', className: 'bg-emerald-500/15 text-emerald-200 border-emerald-500/30' }
    if (status === 'cancelled') return { label: 'Cancelled', className: 'bg-zinc-500/15 text-zinc-200 border-zinc-500/30' }
    if (status === 'followup2') return { label: paused ? 'Day 7 (paused)' : 'Day 7', className: 'bg-purple-500/15 text-purple-200 border-purple-500/30' }
    if (status === 'followup1') return { label: paused ? 'Day 3 (paused)' : 'Day 3', className: 'bg-blue-500/15 text-blue-200 border-blue-500/30' }
    return { label: paused ? 'Sent (paused)' : 'Sent', className: 'bg-amber-500/15 text-amber-200 border-amber-500/30' }
  })()

  return <Badge className={className}>{label}</Badge>
}

export default function Followups() {
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState(null)
  const [filter, setFilter] = useState('all')
  const [data, setData] = useState([])
  const [status, setStatus] = useState('all')
  const [template, setTemplate] = useState('all')
  const [paused, setPaused] = useState('all')
  const [q, setQ] = useState('')
  const [readyOnly, setReadyOnly] = useState(false)
  const [selected, setSelected] = useState({})
  const [privacyMode, setPrivacyMode] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const res = await api.get(`/sequences`, {
        params: {
          filter,
          status: status === 'all' ? undefined : status,
          template: template === 'all' ? undefined : template,
          paused: paused === 'all' ? undefined : paused,
          q: q?.trim() ? q.trim() : undefined,
        }
      })
      setData(res.data?.data || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, status, template, paused, q])

  const stats = useMemo(() => {
    const total = data.length
    const active = data.filter(s => (s.status === 'sent' || s.status === 'followup1') && !s.paused).length
    const paused = data.filter(s => s.paused).length
    const replied = data.filter(s => s.status === 'replied').length
    const cold = data.filter(s => s.status === 'followup2').length
    const cancelled = data.filter(s => s.status === 'cancelled').length
    return { total, active, paused, replied, cold, cancelled }
  }, [data])

  async function togglePause(seq) {
    setUpdatingId(seq.id)
    try {
      await api.patch(`/sequences/${seq.id}/pause`, { paused: !seq.paused })
      await load()
    } finally {
      setUpdatingId(null)
    }
  }

  async function cancel(seq) {
    if (!confirm(`Cancel sequence for ${seq.lead_name} (${seq.email})?`)) return
    setUpdatingId(seq.id)
    try {
      await api.patch(`/sequences/${seq.id}/cancel`, {})
      await load()
    } finally {
      setUpdatingId(null)
    }
  }

  async function markReplied(seq) {
    if (!confirm(`Mark as replied: ${seq.lead_name} (${seq.email})?`)) return
    setUpdatingId(seq.id)
    try {
      await api.patch(`/sequences/${seq.id}/replied`, {})
      await load()
    } finally {
      setUpdatingId(null)
    }
  }

  const selectedIds = useMemo(() => Object.keys(selected).filter((k) => selected[k]), [selected])

  const displayedData = useMemo(() => {
    if (!readyOnly) return data
    return data.filter((s) => nextSendInfo(s).ready)
  }, [data, readyOnly])

  function toggleAll(checked) {
    const next = {}
    for (const s of displayedData) next[s.id] = !!checked
    setSelected(next)
  }

  async function bulk(action) {
    if (selectedIds.length === 0) return
    const label =
      action === 'pause' ? 'Pause' :
        action === 'resume' ? 'Resume' :
          action === 'cancel' ? 'Cancel' :
            action === 'replied' ? 'Mark as replied' :
              'Execute'
    if (!confirm(`${label} ${selectedIds.length} sequence(s)?`)) return

    setUpdatingId('__bulk__')
    try {
      if (action === 'pause') await api.patch('/sequences/bulk/pause', { ids: selectedIds, paused: true })
      if (action === 'resume') await api.patch('/sequences/bulk/pause', { ids: selectedIds, paused: false })
      if (action === 'cancel') await api.patch('/sequences/bulk/cancel', { ids: selectedIds })
      if (action === 'replied') await api.patch('/sequences/bulk/replied', { ids: selectedIds })
      setSelected({})
      await load()
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      <div className="w-full space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3">
              <Mail className="w-8 h-8" />
              Follow-ups & Sequences
            </h1>
            <p className="text-white/60 mt-2">Client status: sent, day 3, day 7, paused, cancelled and replies.</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={() => setFilter('all')}
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              className={filter === 'all' ? '' : 'border-white/20 text-white hover:bg-white/10'}
            >
              All
            </Button>
            <Button
              onClick={() => setFilter('active')}
              variant={filter === 'active' ? 'default' : 'outline'}
              size="sm"
              className={filter === 'active' ? '' : 'border-white/20 text-white hover:bg-white/10'}
            >
              Active
            </Button>
            <Button
              onClick={() => setFilter('replied')}
              variant={filter === 'replied' ? 'default' : 'outline'}
              size="sm"
              className={filter === 'replied' ? '' : 'border-white/20 text-white hover:bg-white/10'}
            >
              Replied
            </Button>
            <Button
              onClick={() => setFilter('cold')}
              variant={filter === 'cold' ? 'default' : 'outline'}
              size="sm"
              className={filter === 'cold' ? '' : 'border-white/20 text-white hover:bg-white/10'}
            >
              Day 7
            </Button>
            <Button
              onClick={() => setFilter('cancelled')}
              variant={filter === 'cancelled' ? 'default' : 'outline'}
              size="sm"
              className={filter === 'cancelled' ? '' : 'border-white/20 text-white hover:bg-white/10'}
            >
              Cancelled
            </Button>
            {/* Privacy Mode Toggle */}
            <button
              onClick={() => setPrivacyMode(!privacyMode)}
              className={`p-2 rounded-lg transition-all border ${privacyMode
                  ? 'bg-accent/20 border-accent/40 text-accent'
                  : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:text-white/60'
                }`}
              title={privacyMode ? 'Disable privacy mode' : 'Enable privacy mode - hide sensitive data'}
            >
              <Eye className="w-4 h-4" />
            </button>
            <Button onClick={load} variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10" disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <Card className="md:col-span-8">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl">Filters</CardTitle>
              <CardDescription>Template, status, paused and search.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <div className="space-y-2">
                <div className="text-xs text-white/60">Status</div>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="sent">Enviado</SelectItem>
                    <SelectItem value="followup1">Day 3</SelectItem>
                    <SelectItem value="followup2">Day 7</SelectItem>
                    <SelectItem value="replied">Respondeu</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="text-xs text-white/60">Template</div>
                <Select value={template} onValueChange={setTemplate}>
                  <SelectTrigger>
                    <SelectValue placeholder="Template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="website">Improvement</SelectItem>
                    <SelectItem value="nowebsite">New website</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="text-xs text-white/60">Paused</div>
                <Select value={paused} onValueChange={setPaused}>
                  <SelectTrigger>
                    <SelectValue placeholder="Paused" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="true">Yes</SelectItem>
                    <SelectItem value="false">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="text-xs text-white/60">Search</div>
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Name, email or website…"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                />
              </div>

              <div className="space-y-2">
                <div className="text-xs text-white/60">Ready to send</div>
                <Button
                  variant={readyOnly ? 'default' : 'outline'}
                  size="sm"
                  className={readyOnly ? '' : 'border-white/20 text-white hover:bg-white/10'}
                  onClick={() => {
                    setSelected({})
                    setReadyOnly((v) => !v)
                  }}
                >
                  {readyOnly ? 'Only ready' : 'Show all'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl">Bulk actions</CardTitle>
              <CardDescription>{selectedIds.length} selected</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-white/20 text-white hover:bg-white/10"
                disabled={selectedIds.length === 0 || updatingId === '__bulk__'}
                onClick={() => bulk('pause')}
              >
                <Pause className="w-4 h-4 mr-2" />
                Pause
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-white/20 text-white hover:bg-white/10"
                disabled={selectedIds.length === 0 || updatingId === '__bulk__'}
                onClick={() => bulk('resume')}
              >
                <Play className="w-4 h-4 mr-2" />
                Resume
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-white/20 text-white hover:bg-white/10"
                disabled={selectedIds.length === 0 || updatingId === '__bulk__'}
                onClick={() => bulk('replied')}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Replied
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-white/20 text-white hover:bg-white/10"
                disabled={selectedIds.length === 0 || updatingId === '__bulk__'}
                onClick={() => bulk('cancel')}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <Card className="md:col-span-2">
            <CardHeader className="pb-3">
              <CardDescription>Sequences</CardDescription>
              <CardTitle className="text-3xl">{stats.total}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-white/60">
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-2"><Clock className="w-4 h-4" /> Active: <span className="text-white">{stats.active}</span></span>
                <span>· Paused: <span className="text-white">{stats.paused}</span></span>
                <span>· Replied: <span className="text-white">{stats.replied}</span></span>
                <span>· Day 7: <span className="text-white">{stats.cold}</span></span>
                <span>· Cancelled: <span className="text-white">{stats.cancelled}</span></span>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl">List</CardTitle>
              <CardDescription>Control pause/resume and cancellation.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[42px]">
                      <input
                        type="checkbox"
                        checked={displayedData.length > 0 && selectedIds.length === displayedData.length}
                        onChange={(e) => toggleAll(e.target.checked)}
                      />
                    </TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Website</TableHead>
                    <TableHead>Template</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Opens</TableHead>
                    <TableHead>Enviado</TableHead>
                    <TableHead>Since last</TableHead>
                    <TableHead>Day 3</TableHead>
                    <TableHead>Day 7</TableHead>
                    <TableHead>Next</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={11} className="text-white/60">Loading…</TableCell>
                    </TableRow>
                  ) : displayedData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} className="text-white/60">No data.</TableCell>
                    </TableRow>
                  ) : (
                    displayedData.map(seq => {
                      const sentDays = daysSince(seq.sent_at)
                      const templateLabel = seq.template === 'nowebsite' ? 'New website' : 'Improvement'
                      const next = nextSendInfo(seq)
                      const lastSentAt = seq.followup2_sent_at || seq.followup1_sent_at || seq.sent_at
                      const lastSentDays = daysSince(lastSentAt)
                      return (
                        <TableRow key={seq.id}>
                          <TableCell>
                            <input
                              type="checkbox"
                              checked={!!selected[seq.id]}
                              onChange={(e) => setSelected((prev) => ({ ...prev, [seq.id]: e.target.checked }))}
                            />
                          </TableCell>
                          <TableCell className="font-medium text-white">{privacyMode ? <span className="blur-sm select-none">{seq.lead_name || '-'}</span> : seq.lead_name || '-'}</TableCell>
                          <TableCell className="text-white/70">{privacyMode ? <span className="blur-sm select-none">{seq.email}</span> : seq.email}</TableCell>
                          <TableCell className="text-white/70">
                            {seq.website ? (
                              <a className="inline-flex items-center gap-2 hover:underline" href={seq.website.startsWith('http') ? seq.website : `https://${seq.website}`} target="_blank" rel="noreferrer">
                                <Globe className="w-4 h-4" />
                                {privacyMode ? <span className="blur-sm select-none">{seq.website}</span> : seq.website}
                              </a>
                            ) : (
                              <span className="text-white/50">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className={seq.template === 'nowebsite' ? 'bg-emerald-500/15 text-emerald-200 border-emerald-500/30' : 'bg-indigo-500/15 text-indigo-200 border-indigo-500/30'}>
                              {templateLabel}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <StatusBadge seq={seq} />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {seq.open_count > 0 ? (
                                <>
                                  <div className="w-6 h-6 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
                                    <CheckCheck className="w-3.5 h-3.5 text-green-400" />
                                  </div>
                                  <span className="text-white font-bold">{seq.open_count}</span>
                                  <span className="text-[10px] text-white/40 uppercase font-black">Views</span>
                                </>
                              ) : (
                                <>
                                  <div className="w-6 h-6 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                  </div>
                                  <span className="text-white/40 font-bold">0</span>
                                  <span className="text-[10px] text-white/20 uppercase font-black">Views</span>
                                </>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-white/70">
                            <div className="space-y-1">
                              <div>{formatDate(seq.sent_at)}</div>
                              <div className="text-xs text-white/40">{sentDays !== null ? `${sentDays} day(s)` : '-'}</div>
                            </div>
                          </TableCell>
                          <TableCell className="text-white/70">
                            <div className="space-y-1">
                              <div className="text-xs text-white/50">{formatDate(lastSentAt)}</div>
                              <div className="text-xs text-white/40">{lastSentDays !== null ? `${lastSentDays} day(s)` : '-'}</div>
                            </div>
                          </TableCell>
                          <TableCell className="text-white/70">{formatDate(seq.followup1_sent_at)}</TableCell>
                          <TableCell className="text-white/70">{formatDate(seq.followup2_sent_at)}</TableCell>
                          <TableCell>
                            <Badge className={next.ready ? 'bg-emerald-500/15 text-emerald-200 border-emerald-500/30' : 'bg-white/5 text-white border-white/10'}>
                              {next.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={updatingId === seq.id || seq.status === 'cancelled' || seq.status === 'replied'}
                                className="border-white/20 text-white hover:bg-white/10"
                                onClick={() => togglePause(seq)}
                              >
                                {seq.paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={updatingId === seq.id || seq.status === 'cancelled' || seq.status === 'replied'}
                                className="border-white/20 text-white hover:bg-white/10"
                                onClick={() => markReplied(seq)}
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={updatingId === seq.id || seq.status === 'cancelled'}
                                className="border-white/20 text-white hover:bg-white/10"
                                onClick={() => cancel(seq)}
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}


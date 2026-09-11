import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart3, RefreshCw, Users, TrendingUp, Shield, ShieldAlert, Mail, Zap, Eye, Search,
  Filter, AlertTriangle, Maximize, ChevronRight, Globe, Database, Target, Trophy, Clock,
  Loader2, Copy, Check, CheckCheck, Plus, PhoneOff, MessageCircle, ExternalLink
} from 'lucide-react'
import { toast } from 'sonner'
import { useLeads } from './hooks/useLeads'
import { useLeadFiltering } from './hooks/useLeadFiltering'
import { Button } from './components/ui/button'
import { Card, CardContent } from './components/ui/card'
import LeadDrawer from './components/LeadDrawer'
import Navbar from './components/Navbar'
import StatsBar from './components/StatsBar'
import LeadFilters, { DEFAULT_ADVANCED } from './components/LeadFilters'
import ScoreBadge from './components/ScoreBadge'
import MiniGauge from './components/gauges/MiniGauge'
import EmailCell from './components/EmailCell'
import { calculateQScore } from './utils/qscore'
import { calculateProjectPrice } from './utils/pricing'
import { api } from './utils/api'

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const navigate = useNavigate()

  const {
    leads,
    isLoading,
    isFetching,
    whatsappSentLeads,
    noWhatsappPhones,
    refetch,
    refreshLeads,
    analyze,
    analyzingProgress,
  } = useLeads()

  // ── UI State ────────────────────────────────────────────────────────────────
  const [selectedLead, setSelectedLead] = useState(null)
  const [filter, setFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [sortBy, setSortBy] = useState('name')
  const [sortOrder, setSortOrder] = useState('asc')
  const [analyzeModal, setAnalyzeModal] = useState(false)
  const [search, setSearch] = useState('')
  const [privacyMode, setPrivacyMode] = useState(false)
  const [showAdvancedPanel, setShowAdvancedPanel] = useState(false)
  const [advancedFilters, setAdvancedFilters] = useState(DEFAULT_ADVANCED)
  const [editingEmail, setEditingEmail] = useState(null)
  const [savingEmail, setSavingEmail] = useState(false)
  const [analyzing, setAnalyzing] = useState({})
  const [analyzingAll, setAnalyzingAll] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  // Reset page when search or filters change to make it faster
  useEffect(() => {
    setCurrentPage(1)
  }, [search, filter, typeFilter, advancedFilters])

  // ── Deep-link: ?lead=website ────────────────────────────────────────────────
  useEffect(() => {
    if (!leads?.length) return
    const params = new URLSearchParams(window.location.search)
    const site = params.get('lead')
    if (site) {
      const found = leads.find(l => l.website === site)
      if (found?.analysis) {
        setSelectedLead(found)
        window.history.replaceState({}, '', window.location.pathname)
      }
    }
  }, [leads])

  // ── Hook: Lead Filtering, Sorting and Pagination (Staff Architecture) ───────
  const {
    types,
    hasActiveAdvanced,
    filteredLeads,
    counts,
    sortedLeads,
    totalPages,
    paginatedLeads,
    handleSort
  } = useLeadFiltering({
    leads,
    search,
    filter,
    typeFilter,
    advancedFilters,
    whatsappSentLeads,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    currentPage,
    pageSize
  })

  const SortIcon = ({ column }) => {
    if (sortBy !== column) return <span className="opacity-20 text-xs">↕</span>
    return <span className="text-[hsl(18,100%,62%)] text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
  }

  const toggleImmunity = async lead => {
    const current = lead.analysis?.is_immune || false
    try {
      const { data } = await api.post('/crm/update', {
        website: lead.website || lead.url,
        payload: { is_immune: !current, crm_stage: lead.analysis?.crm_stage || 'LEAD' }
      })
      if (data.success) {
        toast.success(!current ? 'IMMUNE Client activated' : 'Immunity removed')
        refetch()
      }
    } catch { toast.error('Error updating immunity') }
  }

  const handleAnalyze = async (lead, force = false) => {
    setAnalyzing(p => ({ ...p, [lead.id]: true }))
    try { await analyze({ url: lead.website, leadData: lead, forceReanalyze: force, phase: 1 }) }
    catch (e) { console.error(e) }
    finally { setAnalyzing(p => ({ ...p, [lead.id]: false })) }
  }

  const handleAnalyzeAll = async mode => {
    setAnalyzeModal(false)
    const targets = mode === 'all' ? sortedLeads : sortedLeads.filter(l => !l.analysis)
    if (!targets.length) { toast('No leads to analyze'); return }
    setAnalyzingAll(true)
    const seen = new Set(); let done = 0
    for (const lead of targets) {
      if (seen.has(lead.website)) continue
      seen.add(lead.website)
      await handleAnalyze(lead, mode === 'all')
      done++
      if (done < targets.length) await new Promise(r => setTimeout(r, 60000))
    }
    setAnalyzingAll(false)
    toast.success(`✅ ${done} leads analyzed!`)
  }

  const handleSaveCustomEmail = async lead => {
    const email = editingEmail?.value?.trim()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Invalid email'); return
    }
    setSavingEmail(true)
    try {
      const { data } = await api.post('/update-email', { website: lead.website, email })
      if (data.success) { toast.success(`✅ Email saved: ${email}`); setEditingEmail(null); refetch() }
    } catch (e) { toast.error(e.response?.data?.error || 'Error saving email') }
    finally { setSavingEmail(false) }
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="w-full space-y-5">
        <Navbar
          search={search} setSearch={setSearch}
          privacyMode={privacyMode} setPrivacyMode={setPrivacyMode}
          onRefresh={refreshLeads} isRefreshing={isFetching}
          onAnalyzeAll={() => setAnalyzeModal(true)}
          analyzingAll={analyzingAll}
        />

        {/* ── Stats ──────────────────────────────────────────────────────────── */}
        <StatsBar leads={leads || []} />

        {/* ── Filters ────────────────────────────────────────────────────────── */}
        <LeadFilters
          filter={filter} setFilter={setFilter}
          typeFilter={typeFilter} setTypeFilter={setTypeFilter}
          types={types}
          search={search} setSearch={setSearch}
          counts={counts}
          showAdvancedPanel={showAdvancedPanel} setShowAdvancedPanel={setShowAdvancedPanel}
          advancedFilters={advancedFilters} setAdvancedFilters={setAdvancedFilters}
          hasActiveAdvanced={hasActiveAdvanced}
        />

        {/* ── Table ──────────────────────────────────────────────────────────── */}
        <Card className="glass-card border-0">
          <CardContent className="p-0">
            <div className="w-full overflow-x-auto">
              <table className="w-full text-sm table-fixed min-w-[1200px]">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    {[
                      { col: 'name', label: 'Client', center: false, width: 'w-[15%]' },
                      { col: null, label: 'Website', center: false, width: 'w-[12%]' },
                      { col: null, label: 'Email', center: false, width: 'w-[12%]' },
                      { col: null, label: 'Phone', center: false, width: 'w-[10%]' },
                      { col: 'performance', label: 'Perf', center: true, width: 'w-[5%]' },
                      { col: 'seo', label: 'SEO', center: true, width: 'w-[5%]' },
                      { col: 'security', label: 'Sec', center: true, width: 'w-[5%]' },
                      { col: 'accessibility', label: 'Acc', center: true, width: 'w-[5%]' },
                      { col: 'tracking', label: 'Pixels', center: true, width: 'w-[6%]' },
                      { col: 'qscore', label: 'Q Score', center: true, width: 'w-[6%]' },
                      { col: 'ml_prediction', label: 'AI Win %', center: true, width: 'w-[6%]' },
                      { col: 'price', label: 'Est. Price', center: true, width: 'w-[7%]' },
                      { col: 'priority', label: 'Priority', center: true, width: 'w-[6%]' },
                      { col: null, label: 'Actions', center: true, width: 'w-[5%]' },
                    ].map(({ col, label, center, width }) => (
                      <th key={label}
                        onClick={col ? () => handleSort(col) : undefined}
                        className={`${width} px-4 py-4 ${center ? 'text-center' : 'text-left'} text-xs font-bold text-white/70 uppercase tracking-wider ${col ? 'cursor-pointer hover:text-white transition-colors' : ''}`}>
                        <div className={`flex items-center gap-1.5 ${center ? 'justify-center' : ''}`}>
                          {label} {col && <SortIcon column={col} />}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {paginatedLeads.map((lead, idx) => {
                    const isAn = !!analyzing[lead.id]
                    const qScore = lead.analysis && !lead.analysis.isSocialMediaOnly ? calculateQScore(lead.analysis) : null
                    const pricing = qScore ? calculateProjectPrice(lead.analysis, qScore) : null
                    const phones = lead.analysis?.extractedPhones?.length > 0
                      ? lead.analysis.extractedPhones
                      : lead.phone ? [lead.phone] : []

                    return (
                      <tr key={lead.website || lead.id || idx}
                        data-animate="fade-in"
                        data-delay={String(Math.min(idx + 1, 5))}
                        className={`lead-row ${lead.analysis?.is_immune ? 'immune' : ''}`}
                        onClick={() => lead.analysis && setSelectedLead(lead)}>

                        {/* Client */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button onClick={e => { e.stopPropagation(); toggleImmunity(lead) }}
                              className={`p-1.5 rounded-lg border transition-all shrink-0 ${lead.analysis?.is_immune
                                  ? 'text-accent bg-accent/15 border-accent/30'
                                  : 'text-white/10 bg-transparent border-transparent hover:border-white/15 hover:text-white/30'
                                }`}
                              title={lead.analysis?.is_immune ? 'IMMUNE — click to remove' : 'Immunize (stop automations)'}>
                              <ShieldAlert className={`w-3.5 h-3.5 ${lead.analysis?.is_immune ? 'animate-pulse' : ''}`} />
                            </button>
                            <div>
                              <p className="font-semibold text-white leading-tight">
                                {privacyMode ? <span className="blur-sm select-none">{lead.name}</span> : lead.name}
                              </p>
                              {isAn ? (
                                <div className="mt-1 flex items-center gap-1.5">
                                  <span className="relative flex h-1.5 w-1.5 shrink-0">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[hsl(18,100%,52%)] opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[hsl(18,100%,52%)]"></span>
                                  </span>
                                  <span className="text-[10px] font-black text-[hsl(18,100%,62%)] uppercase tracking-wider animate-pulse max-w-[150px] truncate" title={analyzingProgress[lead.website] || 'Initializing...'}>
                                    {analyzingProgress[lead.website] || 'Initializing...'}
                                  </span>
                                </div>
                              ) : (
                                <>
                                  {lead.analysis?.isSocialMediaOnly && (
                                    <span className="text-[9px] text-[hsl(18,100%,62%)] font-bold uppercase tracking-wider">No Website</span>
                                  )}
                                  {lead.analysis?.aeo?.factors?.aiBotsBlocked && (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.15)] mt-1 animate-pulse" title="Blocks AI crawlers (ChatGPT, Perplexity) in robots.txt!">
                                      AEO Blocked
                                    </span>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Website */}
                        <td className="px-4 py-3 text-white/40 text-[13px] truncate">
                          {lead.analysis?.isSocialMediaOnly
                            ? <span className="text-white/25">{lead.analysis.socialMediaInfo?.platform || 'Social'}</span>
                            : privacyMode ? <span className="blur-sm select-none">{lead.website}</span> : lead.website
                          }
                        </td>

                        {/* Email */}
                        <td className="px-4 py-3 truncate" onClick={e => e.stopPropagation()}>
                          {isAn
                            ? <div className="skeleton h-5 w-28" />
                            : (
                              <EmailCell
                                lead={lead}
                                privacyMode={privacyMode}
                                editingEmail={editingEmail}
                                setEditingEmail={setEditingEmail}
                                savingEmail={savingEmail}
                                onSave={handleSaveCustomEmail}
                              />
                            )
                          }
                        </td>

                        {/* Phone */}
                        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                          {isAn ? <div className="skeleton h-5 w-24" /> : phones.length > 0 ? (
                            <div className="flex flex-col gap-1">
                              {phones.slice(0, 2).map((phone, i) => (
                                <div key={i} className="flex items-center gap-1">
                                  <a href={`tel:${phone.replace(/\s/g, '')}`} onClick={e => e.stopPropagation()}
                                    className="px-2 py-0.5 bg-[hsl(18,100%,52%)/0.08] hover:bg-[hsl(18,100%,52%)/0.16] text-[hsl(18,100%,62%)] rounded text-xs transition-all truncate max-w-[110px]">
                                    {privacyMode ? <span className="blur-sm select-none">{phone}</span> : phone}
                                  </a>
                                  {noWhatsappPhones[phone]
                                    ? <PhoneOff className="w-3 h-3 text-yellow-500/60 shrink-0" title="No WhatsApp" />
                                    : whatsappSentLeads[lead.website]
                                      ? <MessageCircle className="w-3 h-3 text-green-400/70 shrink-0" title="WhatsApp sent" />
                                      : null
                                  }
                                </div>
                              ))}
                            </div>
                          ) : <span className="text-white/15 text-xs">–</span>}
                        </td>

                        {/* Metric columns */}
                        {isAn ? (
                          Array.from({ length: 5 }).map((_, i) => (
                            <td key={i} className="px-4 py-3 text-center">
                              <div className="skeleton h-5 w-10 mx-auto" />
                            </td>
                          ))
                        ) : (
                          <>
                            <td className="px-4 py-3 text-center"><ScoreBadge value={lead.analysis?.performanceMobile} /></td>
                            <td className="px-4 py-3 text-center"><ScoreBadge value={lead.analysis?.seo?.score} /></td>
                            <td className="px-4 py-3 text-center"><ScoreBadge value={lead.analysis?.security?.score} /></td>
                            <td className="px-4 py-3 text-center"><ScoreBadge value={lead.analysis?.accessibility?.score} /></td>
                            <td className="px-4 py-3 text-center">
                              {lead.analysis?.pixelDetails ? (
                                <div className="flex flex-col items-center gap-0.5">
                                  <span className={`font-bold text-base ${(lead.analysis.pixelDetails.totalTracking || 0) >= 5 ? 'text-green-400' : (lead.analysis.pixelDetails.totalTracking || 0) >= 3 ? 'text-yellow-400' : 'text-[hsl(18,100%,62%)]'}`}>
                                    {lead.analysis.pixelDetails.totalTracking || 0}
                                  </span>
                                  <span className="text-[10px] text-white/20">/7</span>
                                </div>
                              ) : <span className="text-white/15">–</span>}
                            </td>
                          </>
                        )}

                        {/* Q Score */}
                        <td className="px-4 py-3 text-center">
                          {isAn ? <div className="skeleton h-8 w-12 mx-auto" /> :
                            qScore ? (
                              <div className="flex flex-col items-center gap-0.5">
                                <MiniGauge score={qScore.score} />
                                <span className="text-[10px] font-bold text-[hsl(18,100%,62%)]">{qScore.grade}</span>
                              </div>
                            ) : <span className="text-white/15">–</span>
                          }
                        </td>

                        {/* AI Predict */}
                        <td className="px-4 py-3 text-center">
                          {isAn ? <div className="skeleton h-5 w-10 mx-auto" /> :
                            lead.analysis?.ml_prediction ? (
                              <div className="flex flex-col items-center gap-0.5" title={lead.analysis.ml_prediction.recommendation}>
                                <span className={`font-bold text-sm ${lead.analysis.ml_prediction.priority === 'HIGH' ? 'text-green-400' :
                                    lead.analysis.ml_prediction.priority === 'MEDIUM' ? 'text-yellow-400' :
                                      'text-white/40'
                                  }`}>
                                  {lead.analysis.ml_prediction.close_probability}%
                                </span>
                                <span className="text-[9px] font-bold uppercase tracking-widest text-white/30">
                                  {lead.analysis.ml_prediction.priority}
                                </span>
                              </div>
                            ) : <span className="text-white/15" title="Run Analyze All or Refresh to fetch predictions">–</span>
                          }
                        </td>

                        {/* Price */}
                        <td className="px-4 py-3 text-center">
                          {isAn ? <div className="skeleton h-5 w-16 mx-auto" /> :
                            lead.analysis?.isSocialMediaOnly || lead.analysis?.category === 'NO_WEBSITE' ? (
                              <div className="flex flex-col items-center">
                                <span className="font-bold text-blue-400 text-sm">€{Number(lead.analysis?.websiteProposal?.proposal?.investment?.recommended) || 2500}</span>
                                <span className="text-[10px] text-blue-400/60">New site</span>
                              </div>
                            ) : pricing ? (
                              <div className="flex flex-col items-center">
                                <span className="font-bold text-white text-sm">€{Math.round(Number(pricing.total) || 0)}</span>
                                <span className="text-[10px] text-[hsl(18,100%,52%)]">{Number(pricing.marketComparison?.percentageSaved) || 0}% below</span>
                              </div>
                            ) : <span className="text-white/15">–</span>
                          }
                        </td>

                        {/* Priority */}
                        <td className="px-4 py-3 text-center">
                          {lead.analysis?.priority && (
                            <span className={`priority-badge ${lead.analysis.priority}`}>
                              {lead.analysis.priority}
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3 text-center" onClick={e => e.stopPropagation()}>
                          <div className="flex gap-1.5 justify-center">
                            {!lead.analysis ? (
                              <Button onClick={() => handleAnalyze(lead)} disabled={isAn} size="sm"
                                className="h-7 text-xs bg-[hsl(18,100%,52%)] hover:bg-[hsl(18,100%,58%)] text-white border-0">
                                {isAn ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Analyze'}
                              </Button>
                            ) : (
                              <>
                                <Button onClick={() => window.open(`/report/${encodeURIComponent(lead.website)}`, '_blank')} variant="outline" size="sm"
                                  className="h-7 text-xs border-white/[0.1] text-white/60 hover:text-white hover:border-white/20 flex items-center gap-1.5" title="Open Full Report">
                                  Report
                                  {lead.analysis.audit_phase === 1 && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                                  )}
                                </Button>
                                <Button onClick={() => handleAnalyze(lead, true)} disabled={isAn} variant="ghost" size="sm"
                                  className="h-7 w-7 p-0 text-white/30 hover:text-white" title="Re-analyze">
                                  {isAn ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              {sortedLeads.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-white/20">
                  <Search className="w-10 h-10 mb-3 opacity-30" />
                  <p className="text-sm">No leads match the current filters</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ── Visual Pagination Bar ───────────────────────────────────────── */}
        <div className="bg-white/[0.02] border border-white/[0.05] p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4 mt-2">
          <div className="flex items-center gap-3">
            <span className="text-xs font-black text-white/40 uppercase tracking-widest">
              Showing {sortedLeads.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} – {Math.min(currentPage * pageSize, sortedLeads.length)} of {sortedLeads.length} clients
            </span>
            <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10 ml-4">
              <span className="text-[10px] font-black text-white/30 px-2 uppercase tracking-widest">Per Page:</span>
              {[15, 25, 50, 100].map((size) => (
                <button
                  key={size}
                  onClick={() => { setPageSize(size); setCurrentPage(1); }}
                  className={`px-3 py-1 text-xs font-black rounded-lg transition-all ${
                    pageSize === size ? 'bg-[hsl(18,100%,52%)] text-white shadow-lg' : 'text-white/40 hover:text-white'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              variant="outline"
              className="h-9 px-4 bg-white/5 border-white/10 text-white hover:bg-white/10 disabled:opacity-30 rounded-xl text-xs font-black uppercase tracking-wider"
            >
              ← Previous
            </Button>
            <span className="text-xs font-black text-[hsl(18,100%,62%)] px-4 uppercase tracking-widest">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              variant="outline"
              className="h-9 px-4 bg-white/5 border-white/10 text-white hover:bg-white/10 disabled:opacity-30 rounded-xl text-xs font-black uppercase tracking-wider"
            >
              Next →
            </Button>
          </div>
        </div>

        {/* ── Footer count ───────────────────────────────────────────────────── */}
        <p className="text-xs text-white/20 text-center pb-2">
          Showing <span className="text-white/40 font-medium">{sortedLeads.length}</span> of{' '}
          <span className="text-white/40 font-medium">{(leads || []).length}</span> leads
          {isFetching && <span className="ml-2 text-[hsl(18,100%,52%)/0.7]">· refreshing...</span>}
        </p>
      </div>

      {/* ── Lead Drawer ───────────────────────────────────────────────────────── */}
      {selectedLead && (
        <LeadDrawer
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onWhatsAppSent={() => refetch()}
          onNoWhatsApp={() => refetch()}
          privacyMode={privacyMode}
        />
      )}

      {/* ── Analyze Modal ─────────────────────────────────────────────────────── */}
      {analyzeModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setAnalyzeModal(false)}>
          <div className="glass-card p-8 w-full max-w-md space-y-4 border-0" onClick={e => e.stopPropagation()}>
            <div>
              <h2 className="text-lg font-bold text-white mb-1">Analyze Leads</h2>
              <p className="text-xs text-white/40">
                {sortedLeads.filter(l => !l.analysis).length} without analysis ·{' '}
                {sortedLeads.filter(l => l.analysis).length} already analyzed
              </p>
            </div>
            <div className="space-y-2">
              {[
                { fn: () => { setAnalyzeModal(false); refetch() }, bg: 'green', emoji: '☁️', title: 'Reload from Supabase', desc: 'Sync saved analyses from cloud.' },
                { fn: () => handleAnalyzeAll('new'), bg: 'orange', emoji: '🔍', title: 'Analyze only new ones', desc: `Use ${sortedLeads.filter(l => !l.analysis).length} quotas.` },
                { fn: () => handleAnalyzeAll('all'), bg: 'red', emoji: '🔄', title: 'Re-analyze all', desc: `Ignore cache. Use ${sortedLeads.length} quotas.` },
              ].map(({ fn, bg, emoji, title, desc }) => (
                <button key={title} onClick={fn}
                  className={`w-full p-4 bg-${bg}-500/8 hover:bg-${bg}-500/15 border border-${bg}-500/20 rounded-xl text-left transition-all`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span>{emoji}</span>
                    <p className="font-semibold text-white text-sm">{title}</p>
                  </div>
                  <p className="text-xs text-white/40">{desc}</p>
                </button>
              ))}
            </div>
            <button onClick={() => setAnalyzeModal(false)} className="w-full text-xs text-white/25 hover:text-white/50 transition-colors pt-1">Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}

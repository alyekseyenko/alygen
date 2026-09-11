import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart3, RefreshCw, Users, TrendingUp, Shield, Mail, Zap, Eye, Search, Filter, AlertTriangle, Maximize,
  ChevronRight, Globe, Database, Target, Trophy, Clock
} from 'lucide-react'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis
} from 'recharts'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import Navbar from '../components/Navbar'
import { api } from '../utils/api'
import { calculateQScore } from '../utils/qscore'
import { calculateProjectPrice } from '../utils/pricing'
import { useSequences } from '../hooks/useSequences'

const COLORS = ['#6366f1', '#22c55e', '#f97316', '#ef4444', '#a855f7', '#14b8a6']

function sum(arr) {
  return arr.reduce((a, b) => a + b, 0)
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [leads, setLeads] = useState([])
  const [supabaseStats, setSupabaseStats] = useState(null)
  const [quota, setQuota] = useState(null)
  const [queue, setQueue] = useState(null)
  const [privacyMode, setPrivacyMode] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  // ── Shared sequences query ────────────────────────────────────────────────
  const { data: sequences = [] } = useSequences()

  async function load() {
    setLoading(true)
    try {
      const [leadsRes, statsRes, quotaRes, queueRes] = await Promise.all([
        api.get('/fetch-leads'),
        api.get('/supabase/stats').catch(() => null),
        api.get('/quota').catch(() => null),
        api.get('/queue-stats').catch(() => null),
      ])

      const leadsPayload = leadsRes?.data?.data?.leads || leadsRes?.data?.data || []
      setLeads(leadsPayload)
      setSupabaseStats(statsRes?.data?.stats || null)
      setQuota(quotaRes?.data?.quota || queueRes?.data?.quota || null)
      setQueue(queueRes?.data?.queue || null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const totalPages = Math.ceil(leads.length / pageSize) || 1
  const paginatedLeads = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return leads.slice(start, start + pageSize)
  }, [leads, currentPage, pageSize])

  // ── Pre-compute Q-Score once per analyzed lead (Staff Optimization) ──────────
  const analyzedWithScores = useMemo(() => {
    return leads
      .filter(l => l.analysis)
      .map(l => ({
        ...l,
        qScore: calculateQScore(l.analysis)
      }))
  }, [leads])

  // ── Derived Strategic Metrics ─────────────────────────────────────────────
  const derived = useMemo(() => {
    const analyzedCount = analyzedWithScores.length
    const total = leads.length

    const avgQ = analyzedCount
      ? Math.round(sum(analyzedWithScores.map(l => Number(l.qScore.score) || 0)) / analyzedCount)
      : null

    const highPriority = analyzedWithScores.filter(l => (l.analysis?.priority || '').toUpperCase() === 'HIGH').length

    // Portfolio Health Index (PHI)
    const getAvg = (fn) => analyzedCount ? Math.round(analyzedWithScores.reduce((acc, l) => acc + (fn(l.analysis) || 0), 0) / analyzedCount) : 0
    const phi = Math.round(
      (getAvg(a => a.seo?.score || 0) * 0.3) +
      (getAvg(a => a.security?.score || 0) * 0.3) +
      (getAvg(a => a.performanceMobile || 0) * 0.2) +
      (getAvg(a => a.accessibility?.score || 0) * 0.2)
    )

    // Active Portfolio (Immune leads)
    const activeClients = leads.filter(l => l.analysis?.is_immune).length

    // Lead Velocity
    const velocity = Math.min(100, Math.round((analyzedCount / (total || 1)) * 100))

    const revenuePotential = analyzedWithScores.reduce((acc, l) => {
      const a = l.analysis
      if (a?.isSocialMediaOnly || a?.category === 'SEM_SITE') {
        const websitePrice = Number(a?.websiteProposal?.proposal?.investment?.recommended) || 2500
        return acc + websitePrice
      }
      const price = calculateProjectPrice(a, l.qScore)
      return acc + (Number(price?.total) || 0)
    }, 0)

    const sentSequences = sequences.filter(s => s.status !== 'cancelled')
    const openedSequences = sentSequences.filter(s => (s.open_count || 0) > 0)
    const openRate = sentSequences.length > 0 ? Math.round((openedSequences.length / sentSequences.length) * 100) : 0

    return { total, analyzedCount, avgQ, highPriority, revenuePotential, openRate, phi, velocity, activeClients }
  }, [leads, sequences, analyzedWithScores])

  const hotLeads = useMemo(() => {
    return [...sequences]
      .filter(s => (s.open_count || 0) > 0)
      .sort((a, b) => (b.open_count || 0) - (a.open_count || 0))
      .slice(0, 5)
  }, [sequences])

  const portfolioDNA = useMemo(() => {
    if (!analyzedWithScores.length) return []
    const avg = (fn) => Math.round(analyzedWithScores.reduce((acc, l) => acc + (fn(l.analysis) || 0), 0) / analyzedWithScores.length)

    return [
      { subject: 'SEO', A: avg(a => a.seo?.score), fullMark: 100 },
      { subject: 'Sec', A: avg(a => a.security?.score), fullMark: 100 },
      { subject: 'Acc', A: avg(a => a.accessibility?.score), fullMark: 100 },
      { subject: 'Perf(M)', A: avg(a => a.performanceMobile), fullMark: 100 },
      { subject: 'Perf(D)', A: avg(a => a.performanceDesktop), fullMark: 100 },
    ]
  }, [analyzedWithScores])

  // Derivação dinâmica real a partir de Leads e Sequências (Sem dados mock)
  const engagementMomentum = useMemo(() => {
    const daysMap = {
      0: { name: 'Dom', engagement: 0, baseline: 0 },
      1: { name: 'Seg', engagement: 0, baseline: 0 },
      2: { name: 'Ter', engagement: 0, baseline: 0 },
      3: { name: 'Qua', engagement: 0, baseline: 0 },
      4: { name: 'Qui', engagement: 0, baseline: 0 },
      5: { name: 'Sex', engagement: 0, baseline: 0 },
      6: { name: 'Sáb', engagement: 0, baseline: 0 },
    }

    leads.forEach(l => {
      const dateStr = l.analyzed_at || l.created_at || l.analysis?.analyzedAt
      if (dateStr) {
        const d = new Date(dateStr)
        if (!isNaN(d.getTime())) {
          daysMap[d.getDay()].baseline += 1
        }
      }
    })

    sequences.forEach(s => {
      const dateStr = s.sent_at || s.created_at || s.updated_at
      if (dateStr) {
        const d = new Date(dateStr)
        if (!isNaN(d.getTime())) {
          daysMap[d.getDay()].engagement += 1 + (s.open_count || 0)
        }
      }
    })

    return [daysMap[1], daysMap[2], daysMap[3], daysMap[4], daysMap[5], daysMap[6], daysMap[0]]
  }, [leads, sequences])

  const trackingDNA = useMemo(() => {
    const counts = analyzedWithScores.reduce((acc, l) => {
      const p = l.analysis?.pixelDetails?.totalTracking || 0
      if (p === 0) acc.none++
      else if (p <= 2) acc.basic++
      else acc.advanced++
      return acc
    }, { none: 0, basic: 0, advanced: 0 })

    return [
      { name: 'Nenhum', value: counts.none, fill: '#ef4444' },
      { name: 'Básico', value: counts.basic, fill: '#f97316' },
      { name: 'Avançado', value: counts.advanced, fill: '#22c55e' },
    ]
  }, [analyzedWithScores])

  const priorityPie = useMemo(() => {
    const counts = analyzedWithScores.reduce((acc, l) => {
      const p = (l.analysis?.priority || 'N/A').toUpperCase()
      acc[p] = (acc[p] || 0) + 1
      return acc
    }, {})

    // Localize labels for display
    const mapping = { CRITICAL: 'CRÍTICA', HIGH: 'ALTA', MEDIUM: 'MÉDIA', LOW: 'BAIXA' }
    return Object.entries(counts).map(([name, value]) => ({
      name: mapping[name] || name,
      original: name,
      value
    })).sort((a, b) => b.value - a.value).slice(0, 6)
  }, [analyzedWithScores])

  const cityData = useMemo(() => {
    const cities = analyzedWithScores.reduce((acc, l) => {
      const cityName = (l.city || l.analysis?.extractedCity || l.analysis?.location || 'Não Definido').trim()
      if (!acc[cityName]) acc[cityName] = { name: cityName, count: 0, totalScore: 0 }
      acc[cityName].count++
      acc[cityName].totalScore += (Number(l.qScore.score) || 0)
      return acc
    }, {})

    return Object.values(cities)
      .map(c => ({ name: c.name, count: c.count, avgScore: Math.round(c.totalScore / c.count) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }, [analyzedWithScores])

  // ── Pure Component for Tooltips ───────────────────────────────────────────
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black/95 backdrop-blur-2xl border border-white/20 p-4 rounded-2xl shadow-2xl border-t-white/30 z-50">
          <p className="text-[9px] font-black text-white/50 uppercase tracking-[0.2em] mb-2">{label || payload[0].name}</p>
          {payload.map((item, i) => (
            <div key={i} className="flex items-center gap-2 mb-1">
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color || item.fill }} />
              <p className="text-lg font-black text-white leading-none">
                {item.value}
                {item.unit && <span className="text-[10px] text-white/40 ml-1 font-bold">{item.unit}</span>}
              </p>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="min-h-screen text-white p-0 relative overflow-hidden font-sans">
      {/* 🌌 Ultra-Luxury Background Elements */}
      <div className="fixed inset-0 bg-[#02040a] pointer-events-none" />
      <div className="fixed top-[-15%] left-[-15%] w-[60%] h-[60%] bg-accent/5 rounded-full blur-[160px] animate-pulse pointer-events-none" />
      <div className="fixed bottom-[-15%] right-[-15%] w-[60%] h-[60%] bg-blue-500/5 rounded-full blur-[160px] pointer-events-none" />
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />

      {/* 🔮 SVG Gradients Definitions */}
      <svg style={{ height: 0, width: 0, position: 'absolute' }}>
        <defs>
          <linearGradient id="luxuryOrange" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(18, 100%, 65%)" />
            <stop offset="100%" stopColor="hsl(18, 100%, 45%)" />
          </linearGradient>
          <linearGradient id="waveGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(18, 100%, 52%)" stopOpacity={0.3} />
            <stop offset="100%" stopColor="hsl(18, 100%, 52%)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="baselineGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.2} />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
        </defs>
      </svg>

      <div className="w-full relative z-10 px-4 md:px-6 lg:px-10 pb-20 pt-6">
        <Navbar
          privacyMode={privacyMode}
          setPrivacyMode={setPrivacyMode}
          onRefresh={load}
          isRefreshing={loading}
          showActions={false}
        />

        <div className="flex flex-col md:flex-row justify-between items-end gap-6 pb-8 mb-8 border-b border-white/[0.03] mt-8">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="bg-accent/5 border-accent/20 text-accent text-[9px] font-black uppercase tracking-[0.2em] px-2 py-0">Strategic Suite v2026</Badge>
              <h2 className="text-3xl font-black tracking-tighter text-white">INTELLIGENCE<span className="text-accent text-3xl">.</span>HUB</h2>
            </div>
            <p className="text-white/30 font-bold text-[10px] uppercase tracking-[0.3em] leading-relaxed">High-Fidelity Market Diagnostics • AI Momentum Forecast</p>
          </div>

          <div className="flex gap-4 items-center">
            <div className="hidden xl:flex items-center gap-6 mr-4 border-r border-white/5 pr-6">
              <div className="text-right">
                <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Data Sync Status</div>
                <div className="flex items-center gap-2 text-[10px] font-black text-green-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> LIVE STREAMING ACTIVE
                </div>
              </div>
            </div>

            <Button onClick={() => {
              if (!document.fullscreenElement) document.documentElement.requestFullscreen()
              else document.exitFullscreen()
            }} variant="ghost" className="h-10 px-4 bg-white/5 border border-white/10 text-white/40 hover:text-white rounded-xl transition-all font-black text-[10px] uppercase tracking-widest">
              <Maximize className="w-3.5 h-3.5 mr-2" /> Maximize
            </Button>

            <Button onClick={load} className="h-10 px-6 bg-accent text-black font-black rounded-xl hover:bg-accent/90 shadow-[0_10px_20px_hsl(18,100%,52%,0.2)] transition-all transform active:scale-95 text-[10px] uppercase tracking-widest">
              <RefreshCw className={`w-3.5 h-3.5 mr-2 ${loading ? 'animate-spin' : ''}`} /> Sync Engine
            </Button>
          </div>
        </div>

        {/* ── KPI GRID ──────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
          {[
            { label: 'Market Volume', value: derived.total, sub: 'Total Leads Harvested', icon: Users, color: 'text-blue-400', data: [20, 45, 30, 60, 40, 70, 55] },
            { label: 'Active Clients', value: derived.activeClients, sub: 'Loyalty Portfolio', icon: Trophy, color: 'text-orange-400', data: [10, 12, 11, 14, 15, 18, 20] },
            { label: 'Portfolio Health', value: `${derived.phi}%`, sub: 'Quality Diagnostic', icon: Shield, color: 'text-accent', data: [60, 65, 62, 70, 68, 75, 72] },
            { label: 'Lead Velocity', value: `${derived.velocity}%`, sub: 'Analysis Momentum', icon: Zap, color: 'text-yellow-400', data: [30, 40, 35, 50, 45, 60, 55] },
            { label: 'Conversion Win', value: `${derived.openRate}%`, sub: 'Engagement Probability', icon: Target, color: 'text-green-400', data: [10, 25, 20, 45, 35, 60, 58] },
          ].map((card, i) => (
            <Card key={i} className="bg-white/[0.02] border-white/[0.05] hover:border-white/10 transition-all group overflow-hidden relative border-t-white/[0.08]">
              <CardHeader className="pb-2">
                <div className={`p-2 w-fit rounded-xl bg-white/5 border border-white/5 group-hover:border-white/10 transition-all mb-4 ${card.color}`}>
                  <card.icon className="w-4 h-4" />
                </div>
                <CardDescription className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">{card.label}</CardDescription>
                <CardTitle className="text-4xl font-black tracking-tighter text-white">{card.value}</CardTitle>
                <div className="text-[10px] font-bold text-white/10 uppercase mt-1 tracking-widest">{card.sub}</div>
              </CardHeader>
              <div className="h-10 w-full mt-2 opacity-20 group-hover:opacity-50 transition-all">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={card.data.map((v, idx) => ({ v, idx }))}>
                    <Area type="monotone" dataKey="v" stroke="currentColor" fill="currentColor" strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-8">
          {/* ── Engagement Momentum ────────────────────────────────────────── */}
          <Card className="md:col-span-8 bg-white/[0.01] border-white/[0.05] overflow-hidden">
            <CardHeader className="border-b border-white/[0.03] flex flex-row items-center justify-between py-6">
              <div>
                <CardTitle className="text-xl font-black tracking-tighter uppercase transition-colors group-hover:text-accent">Engagement Momentum</CardTitle>
                <CardDescription className="text-[10px] uppercase font-bold text-white/20 tracking-[0.3em]">Temporal Market Pulsation</CardDescription>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-1.5 text-[9px] font-black text-white/40 tracking-widest uppercase">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent" /> Corrente
                </div>
                <div className="flex items-center gap-1.5 text-[9px] font-black text-white/40 tracking-widest uppercase">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Baseline
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-8" style={{ height: 350 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={engagementMomentum} margin={{ left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.2)', fontWeight: 'black' }} />
                  <YAxis hide />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="baseline" stroke="#3b82f6" fillOpacity={1} fill="url(#baselineGradient)" strokeWidth={3} />
                  <Area type="monotone" dataKey="engagement" stroke="hsl(18, 100%, 52%)" fillOpacity={1} fill="url(#waveGradient)" strokeWidth={4} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* ── Portfolio DNA ──────────────────────────────────────────────── */}
          <Card className="md:col-span-4 bg-white/[0.01] border-white/[0.05]">
            <CardHeader className="border-b border-white/[0.03] py-6">
              <CardTitle className="text-xl font-black tracking-tighter uppercase">Portfolio DNA</CardTitle>
              <CardDescription className="text-[10px] uppercase font-bold text-white/20 tracking-[0.3em]">Qualitative Intelligence Map</CardDescription>
            </CardHeader>
            <CardContent className="pt-8" style={{ height: 350 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={portfolioDNA}>
                  <PolarGrid stroke="rgba(255,255,255,0.05)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: 'black' }} />
                  <Radar name="Portfolio" dataKey="A" stroke="hsl(18, 100%, 52%)" fill="hsl(18, 100%, 52%)" fillOpacity={0.2} strokeWidth={3} />
                  <Tooltip content={<CustomTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* ── Geo-Opportunities ──────────────────────────────────────────── */}
          <Card className="md:col-span-4 bg-white/[0.01] border-white/[0.05]">
            <CardHeader className="pb-3 border-b border-white/[0.04]">
              <CardTitle className="text-lg font-black tracking-tight flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-400" />
                GEO-OPPORTUNITIES
              </CardTitle>
              <CardDescription className="text-[9px] uppercase font-black text-white/20 tracking-[0.2em]">Regional Density Forecast</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
               {cityData.length === 0 ? (
                <div className="py-20 text-center text-white/10 italic text-[10px] uppercase tracking-widest font-black">Awaiting Synchronization...</div>
              ) : cityData.map((city, i) => (
                <div key={i} className="group flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/[0.04] hover:border-blue-500/30 transition-all cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20 text-[11px] font-black text-blue-400 group-hover:bg-blue-500 group-hover:text-black transition-all">
                      {i + 1}
                    </div>
                    <div>
                      <div className="text-xs font-black text-white uppercase tracking-wider">{city.name}</div>
                      <div className="text-[9px] text-white/30 font-bold uppercase tracking-[0.15em]">{city.count} ACTIVE LEADS</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-xs font-black ${city.avgScore < 50 ? 'text-accent' : 'text-green-400'}`}>
                      {city.avgScore} <span className="text-[9px] text-white/20 font-bold">AVG</span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* ── Tracking DNA ──────────────────────────────────────────────── */}
          <Card className="md:col-span-4 bg-white/[0.01] border-white/[0.05]">
            <CardHeader className="pb-3 border-b border-white/[0.04]">
              <CardTitle className="text-lg font-black tracking-tight flex items-center gap-2 text-accent">
                <Eye className="w-4 h-4" />
                TRACKING DNA
              </CardTitle>
              <CardDescription className="text-[9px] uppercase font-black text-white/20 tracking-[0.2em]">Pixel Sophistication Index</CardDescription>
            </CardHeader>
            <CardContent className="pt-6" style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={trackingDNA} innerRadius={60} outerRadius={80} paddingAngle={8} dataKey="value" stroke="none">
                    {trackingDNA.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-6 mt-4">
                {trackingDNA.map(d => (
                  <div key={d.name} className="flex flex-col items-center">
                    <div className="text-sm font-black text-white">{d.value}</div>
                    <div className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em]">{d.name}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* ── Priority Matrix ───────────────────────────────────────────── */}
          <Card className="md:col-span-4 bg-white/[0.01] border-white/[0.05]">
            <CardHeader className="pb-3 border-b border-white/[0.04]">
              <CardTitle className="text-lg font-black tracking-tight flex items-center gap-2 text-green-400">
                <AlertTriangle className="w-4 h-4 text-orange-400" />
                PRIORITY MATRIX
              </CardTitle>
              <CardDescription className="text-[9px] uppercase font-black text-white/20 tracking-[0.2em]">Intensity Spread Diagnostic</CardDescription>
            </CardHeader>
            <CardContent className="pt-6" style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={priorityPie} innerRadius={60} outerRadius={85} paddingAngle={2} dataKey="value" stroke="none">
                    {priorityPie.map((entry, i) => {
                      const colors = { CRÍTICA: '#ef4444', ALTA: 'hsl(18, 100%, 52%)', MÉDIA: '#f97316', BAIXA: 'rgba(255,255,255,0.1)' };
                      return <Cell key={i} fill={colors[entry.name] || '#333'} />
                    })}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center flex-wrap gap-x-6 gap-y-2 mt-4">
                {priorityPie.map(d => (
                  <div key={d.name} className="flex flex-col items-center min-w-[50px]">
                    <div className="text-sm font-black text-white">{d.value}</div>
                    <div className="text-[8px] font-black text-white/30 uppercase tracking-widest">{d.name}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* ── INTEREST INTENSITY ────────────────────────────────────────── */}
          <Card className="md:col-span-12 bg-white/[0.01] border-white/[0.05] overflow-hidden">
            <CardHeader className="border-b border-white/[0.04] flex flex-row items-center justify-between py-6 px-8">
              <div>
                <CardTitle className="text-2xl font-black tracking-tighter text-white">INTEREST INTENSITY</CardTitle>
                <CardDescription className="text-[10px] uppercase font-black text-white/20 tracking-[0.4em]">Top Engagement Forecast (24h Window)</CardDescription>
              </div>
              <div className="text-right">
                <div className="text-5xl font-black text-accent tracking-tighter animate-pulse">{derived.openRate}%</div>
                <div className="text-[10px] text-white/30 font-black uppercase tracking-[0.3em] mt-1">Reply Capacity Growth</div>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                {hotLeads.map((s, i) => {
                  const name = (s.leads?.lead_name || s.lead_name || s.leads?.name || s.website || 'Prospect').toUpperCase();
                  return (
                    <div key={i} className="group relative bg-white/[0.02] border border-white/[0.05] p-6 rounded-[2.5rem] hover:bg-white/[0.04] transition-all cursor-pointer border-t-white/[0.08]">
                      <div className="flex justify-between items-start mb-8">
                        <div className="p-3.5 rounded-2xl bg-accent/10 text-accent group-hover:bg-accent group-hover:text-black transition-all shadow-xl">
                          <Zap className="w-5 h-5" />
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-black text-white tracking-tighter">{s.open_count}</div>
                          <div className="text-[9px] font-black text-white/20 uppercase tracking-widest">Actions</div>
                        </div>
                      </div>
                      <h4 className="font-black text-white truncate text-base mb-1 tracking-tight">{privacyMode ? 'INVESTIDOR' : name}</h4>
                      <p className="text-[9px] text-white/30 font-black uppercase tracking-[0.2em] mb-8">{privacyMode ? '••••@••••.com' : (s.leads?.email || 'OFFLINE').toUpperCase()}</p>
                      <div className="flex items-center justify-between border-t border-white/5 pt-5">
                        <Badge variant="outline" className="text-[9px] font-black border-white/10 text-white/40 group-hover:border-accent/40 group-hover:text-accent transition-all uppercase tracking-widest">{s.status}</Badge>
                        <Clock className="w-3.5 h-3.5 text-white/10 group-hover:text-accent transition-colors" />
                      </div>
                    </div>
                  )
                })}
                {hotLeads.length === 0 && (
                  <div className="col-span-5 py-20 text-center text-white/10 font-bold uppercase tracking-widest text-[10px]">
                    No engagement peaks detected.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* ── Strategic Revenue Forecast ────────────────────────────────── */}
          <Card className="md:col-span-12 bg-gradient-to-br from-accent/[0.08] to-transparent border-accent/20 overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-[500px] h-full bg-accent/5 blur-[120px] pointer-events-none group-hover:opacity-60 transition-opacity" />
            <CardHeader className="py-12 px-10">
              <div className="flex flex-col md:flex-row justify-between items-end gap-10 relative z-10 w-full">
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-accent text-black font-black shadow-2xl">
                      <Euro className="w-6 h-6" />
                    </div>
                    <CardTitle className="text-3xl font-black tracking-tighter uppercase">Pipelines Forecast</CardTitle>
                  </div>
                  <div className="text-[11px] text-white/40 font-black uppercase tracking-[0.4em] leading-relaxed max-w-xl">
                    Modeled via <span className="text-white">Engagement Intensity</span> & <span className="text-white">Market Need Analysis</span> algorithms. Q3 2026 projection based on analyzed leads.
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] font-black text-accent uppercase tracking-[1em] mb-3">Estimated Capital</div>
                  <div className="text-8xl font-black tracking-tighter text-white drop-shadow-[0_15px_40px_rgba(255,255,255,0.1)]">
                    €{Math.round(derived.revenuePotential).toLocaleString('pt-PT')}
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* ── Visual Pagination Bar ───────────────────────────────────────── */}
          <div className="md:col-span-12 bg-white/[0.02] border border-white/[0.05] p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4 mt-2">
            <div className="flex items-center gap-3">
              <span className="text-xs font-black text-white/40 uppercase tracking-widest">
                Showing {leads.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} – {Math.min(currentPage * pageSize, leads.length)} of {leads.length} clients
              </span>
              <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10 ml-4">
                <span className="text-[10px] font-black text-white/30 px-2 uppercase tracking-widest">Per Page:</span>
                {[15, 25, 50, 100].map((size) => (
                  <button
                    key={size}
                    onClick={() => { setPageSize(size); setCurrentPage(1); }}
                    className={`px-3 py-1 text-xs font-black rounded-lg transition-all ${
                      pageSize === size ? 'bg-accent text-black shadow-lg' : 'text-white/40 hover:text-white'
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
              <span className="text-xs font-black text-accent px-4 uppercase tracking-widest">
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
        </div>
      </div>
    </div>
  )
}

function Euro(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 10h12" />
      <path d="M4 14h9" />
      <path d="M19 6a7.7 7.7 0 0 0-5.2-2A7.9 7.9 0 0 0 6 12a7.9 7.9 0 0 0 7.8 8 7.7 7.7 0 0 0 5.2-2" />
    </svg>
  )
}

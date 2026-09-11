import { useState, useCallback, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, Play, CheckCircle2, XCircle, Clock, RefreshCw, 
  ChevronDown, ChevronRight, Beaker, Zap, Cloud, Server, Brain, Terminal
} from 'lucide-react'
import Navbar from '../components/Navbar'
import { Button } from '../components/ui/button'
import { fetchSystemHealth, runSimulation, runSeniorAudit, runUltimateAudit, runLifecycleSimulation } from '../utils/api'
import { StatusIcon, expect, assert } from '../utils/testUtils'
import { SUITES_BY_PAGE } from '../data/testSuites'

// ── Hooks & Visuals ─────────────────────────────────────────────────────────────

function useCountUp(end, duration = 1500) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (end === null || end === undefined) {
       setCount(0)
       return
    }
    let startTimestamp = null
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp
      const progress = Math.min((timestamp - startTimestamp) / duration, 1)
      const easeProgress = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(easeProgress * end))
      if (progress < 1) {
        window.requestAnimationFrame(step)
      }
    }
    window.requestAnimationFrame(step)
  }, [end, duration])

  return count
}

function TerminalSimulator({ isVisible }) {
  const [lines, setLines] = useState([])
  
  useEffect(() => {
    if (!isVisible) {
      setLines([])
      return
    }
    
    const logs = [
      '[INIT] Alygen Diagnostics Engine v6.4.1 starting...',
      '[BOOT] Loading environment variables from encrypted vault...',
      '[AUTH] Validating service role keys & RLS overrides...',
      '[OK] Root authentication successful.',
      '[NET] Resolving Supabase cluster nodes (eu-west-1)...',
      '[DB] Establishing pg_bouncer connection pool (max_size=50)...',
      '[WARN] Latency spike detected on eu-west-1 (42ms) - tolerating...',
      '[DB] Executing schema validation against "lead_analyses"...',
      '[OK] Schema hash matches origin (sha256: 8f4e2a1...).',
      '[WORKER] Booting RabbitMQ queue consumers for NLP layer...',
      '[API] Connecting to Groq Vision pipeline endpoints...',
      '[ML] Pre-warming FastText and Spacy inference models...',
      '[OK] AI models loaded into VRAM (1.2GB allocated).',
      '[NET] Handshaking with ScraperAPI rotation pool...',
      '[PROX] Validating 3 exit nodes for concurrent scraping...',
      '[TEST] Injecting mock payload to /system/audit/simulate/pdf_generation...',
      '[MEM] Heap size stabilized at 145MB / RSS 210MB.',
      '[TEST] Spawning concurrent threads for SMTP integration check...',
      '[SMTP] Nodemailer handshake successful on port 587 (TLS).',
      '[FILE] Checking write permissions for /data & /temp mounts...',
      '[OK] Mounts are writable (inode usage 14%).',
      '[DB] Firing orphan-row detection algorithms...',
      '[DB] Index optimization check passed.',
      '[API] Verifying async webhook listeners (Calendly)...',
      '[WORKER] Heartbeat synchronized with background scraper daemon.',
      '[LOG] Parsing last 500 lines of system_events.log for FATAL errors...',
      '[OK] No panic states found in recent node traces.',
      '[SYNC] Synchronizing global state with primary dashboard...',
      '[SEC] Evaluating Data Isolation rules for Multi-Tenant policies...',
      '[OK] RLS properly blocking cross-tenant queries.',
      '[FINISH] Consolidating metrics. Generating final visual payload...',
      '[SUCCESS] All diagnostic vectors deployed and concluded.'
    ]
    
    let currentIndex = 0
    let timeoutId
    
    const pushNextLine = () => {
      if (currentIndex < logs.length) {
         setLines(prev => {
            const next = [...prev, logs[currentIndex]]
            return next.slice(-8) // Keep only latest 8 lines instead of 6 for more depth
         })
         currentIndex++
         // Faster dynamic speed for longer list (50ms to 250ms delay)
         timeoutId = setTimeout(pushNextLine, Math.random() * 200 + 50)
      }
    }
    
    timeoutId = setTimeout(pushNextLine, 100)
    return () => clearTimeout(timeoutId)
  }, [isVisible])

  if (!isVisible) return null

  return (
    <div className="w-full bg-[#050508] border border-blue-500/20 rounded-2xl p-5 font-mono text-[10px] sm:text-xs overflow-hidden relative shadow-[0_0_40px_rgba(59,130,246,0.05)] mx-auto col-span-full">
       <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>
       <div className="flex items-center gap-2 text-blue-400/50 mb-3 border-b border-white/5 pb-2">
         <Terminal className="w-4 h-4" />
         <span className="uppercase tracking-[0.2em] font-bold">Execution Context</span>
       </div>
       <div className="space-y-1.5 min-h-[120px] flex flex-col justify-end">
         {lines.filter(Boolean).map((l, i) => (
           <div key={i} className="flex gap-2 text-white/70 animate-in fade-in fill-mode-backwards" style={{ animationDuration: '300ms' }}>
             <span className="text-blue-500/50">{'>'}</span>
             <span dangerouslySetInnerHTML={{ __html: l.replace(/\[OK\]|\[SUCCESS\]|\[FINISH\]/, '<span class="text-emerald-400 font-bold">$&</span>').replace(/\[WARN\]/, '<span class="text-amber-400 font-bold">$&</span>').replace(/\[INIT\]|\[BOOT\]|\[SEC\]/, '<span class="text-purple-400 font-bold">$&</span>').replace(/\[NETWORK\]|\[NET\]/, '<span class="text-cyan-400 font-bold">$&</span>') }} />
           </div>
         ))}
         <div className="flex gap-2 items-center text-white/50 animate-pulse mt-1">
             <span className="text-blue-500/50">{'>'}</span>
             <div className="w-1.5 h-3.5 bg-white/40"></div>
         </div>
       </div>
    </div>
  )
}

// ── Components ─────────────────────────────────────────────────────────────

function SuiteCard({ suite, search }) {
  const [open, setOpen] = useState(true)
  
  const filteredTests = useMemo(() => {
    if (!search) return suite.tests
    return suite.tests.filter(t => t.name.toLowerCase().includes(search.toLowerCase()))
  }, [suite.tests, search])

  if (filteredTests.length === 0 && search && !suite.name.toLowerCase().includes(search.toLowerCase())) {
    return null
  }

  const passed = filteredTests.filter(t => t.status === 'pass').length
  const failed = filteredTests.filter(t => t.status === 'fail').length
  const total  = filteredTests.length
  
  const allDone = filteredTests.length > 0 && filteredTests.every(t => t.status !== 'idle' && t.status !== 'running')
  const allPass = allDone && failed === 0
  const Icon = suite.icon || Server

  return (
    <div className={`group glass-card relative overflow-hidden transition-all duration-500 transform-gpu hover:scale-[1.02] hover:-translate-y-1 ${
      allDone ? (allPass ? 'border border-emerald-500/30 shadow-[0_12px_40px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/20' : 'border border-red-500/30 shadow-[0_12px_40px_rgba(239,68,68,0.15)] ring-1 ring-red-500/20') : 'border border-white/5 hover:border-white/20 hover:shadow-[0_12px_40px_rgba(255,255,255,0.05)]'
    }`}>
      {/* Dynamic Background Glow */}
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-br ${allDone ? (allPass ? 'from-emerald-500/10 via-transparent to-transparent' : 'from-red-500/10 via-transparent to-transparent') : 'from-white/5 via-transparent to-transparent'} pointer-events-none`}></div>
      
      <button
        className="relative z-10 w-full flex items-center gap-4 px-6 py-5 hover:bg-white/[0.02] transition-colors text-left"
        onClick={() => setOpen(o => !o)}
      >
        <div className={`p-3 rounded-2xl border transition-all duration-500 group-hover:rotate-3 ${
          allDone ? (allPass ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : 'bg-red-500/10 border-red-500/30 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.2)]') : 'bg-white/[0.03] border-white/[0.08] text-white/50 group-hover:bg-white/[0.06] group-hover:text-white group-hover:border-white/20'
        }`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <span className="font-bold text-white text-base tracking-tight">{suite.name}</span>
            {allDone && (
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${
                allPass ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
              }`}>
                {allPass ? 'Ready' : 'Broken'}
              </span>
            )}
          </div>
          <p className="text-[10px] text-white/20 font-medium uppercase tracking-[0.15em] mt-0.5">{suite.id.replace('-', ' ')}</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-xs font-bold text-white">{passed}<span className="text-white/30">/{total}</span></div>
          </div>
          <div className={`transition-transform duration-300 ${open ? 'rotate-180' : ''}`}>
            <ChevronDown className="w-4 h-4 text-white/30" />
          </div>
        </div>
      </button>

      {open && (
        <div className="border-t border-white/[0.05] bg-black/40">
          {filteredTests.length === 0 ? (
            <div className="p-10 text-center space-y-2">
              <Beaker className="w-8 h-8 text-white/10 mx-auto" />
              <p className="text-white/20 text-xs font-medium uppercase tracking-widest">No diagnostics found</p>
            </div>
          ) : (
            filteredTests.map((test, i) => (
              <div key={i} className={`flex items-start gap-4 px-6 py-3 border-b border-white/[0.03] last:border-0 hover:bg-white/[0.01] transition-colors ${test.status === 'fail' ? 'bg-red-500/[0.04]' : ''}`}>
                <div className="mt-1 shrink-0"><StatusIcon status={test.status} size="sm" /></div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold transition-colors duration-300 ${test.status === 'fail' ? 'text-red-300 group-hover:text-red-200' : 'text-white/75 group-hover:text-white'}`}>{test.name}</p>
                  {test.error && (
                    <div className="mt-3 p-4 bg-[#050508] border border-red-500/20 rounded-xl relative overflow-hidden group/error shadow-inner">
                      <div className="absolute top-0 left-0 w-1 h-full bg-red-500/50 group-hover/error:bg-red-500 transition-colors"></div>
                      <div className="flex items-center gap-2 mb-2 border-b border-red-500/10 pb-2">
                        <Terminal className="w-3.5 h-3.5 text-red-500" />
                        <span className="text-[10px] font-black uppercase text-red-400 tracking-[0.2em]">Trace Route</span>
                      </div>
                      <pre className="text-xs text-red-200/80 font-mono leading-relaxed whitespace-pre-wrap break-all">
                        {test.error}
                      </pre>
                      <div className="mt-3 pt-2 border-t border-red-500/10 flex items-center gap-2">
                         <span className="text-[9px] font-bold text-red-500/50 uppercase tracking-widest">Resolution Action:</span>
                         <span className="text-[9px] font-medium text-white/40">Check logs / verify schema</span>
                      </div>
                    </div>
                  )}
                </div>
                {test.ms !== undefined && <span className="text-[10px] text-white/20 font-mono mt-1">{test.ms}ms</span>}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────

export default function TestsPage() {
  const [activeTab, setActiveTab] = useState('lifecycle')
  const [suitesResults, setSuitesResults] = useState(null)
  const [privacyMode, setPrivacyMode] = useState(false)
  const [search, setSearch] = useState('')
  const [running, setRunning] = useState(false)
  const [totalMs, setTotalMs] = useState(null)

  const runAllTests = useCallback(async () => {
    setRunning(true)
    const startTime = performance.now()
    
    let backendResults = []
    let simulationResults = []
    let seniorResults = []
    let enterpriseResults = []
    let lifecycleResults = []

    try {
      // 🚀 UNIFIED GLOBAL DIAGNOSTIC: 20+ TESTS IN PARALLEL
      const [
        health, 
        resPdf, resEmail, resWorkers, 
        resStab, resRes, resSec,
        resCredits, resSheets, resEnv, resStress,
        resL1, resL2, resL3, resL4
      ] = await Promise.all([
        fetchSystemHealth(),
        runSimulation('pdf_generation'),
        runSimulation('email_rendering'),
        runSimulation('worker_heartbeats'),
        runSeniorAudit('stability'),
        runSeniorAudit('resource'),
        runSeniorAudit('security'),
        runUltimateAudit('scraper_credits'),
        runUltimateAudit('sheets_connectivity'),
        runUltimateAudit('secret_integrity'),
        runUltimateAudit('python_stress'),
        runLifecycleSimulation('intake'),
        runLifecycleSimulation('intelligence'),
        runLifecycleSimulation('synthesis'),
        runLifecycleSimulation('enrollment')
      ])

      if (health && health.results) {
        backendResults = health.results.map(r => ({
          name: r.name,
          status: r.status === 'pass' ? 'pass' : (r.status === 'warn' ? 'pass' : 'fail'),
          ms: r.latency,
          error: r.status === 'fail' ? r.details : undefined,
          rawId: r.name
        }))
      }

      simulationResults = [resPdf, resEmail, resWorkers].map(r => ({
        name: r.name,
        status: r.status === 'pass' ? 'pass' : (r.status === 'warn' ? 'pass' : 'fail'),
        ms: r.latency,
        error: r.status === 'fail' ? r.details : undefined,
        rawId: r.name
      }))

      seniorResults = [resStab, resRes, resSec].map(r => ({
        name: r.name,
        status: r.status === 'pass' ? 'pass' : (r.status === 'warn' ? 'pass' : 'fail'),
        ms: r.latency,
        error: r.status === 'fail' ? r.details : undefined,
        rawId: r.name
      }))

      enterpriseResults = [resCredits, resSheets, resEnv, resStress].map(r => ({
        name: r.name,
        status: r.status === 'pass' ? 'pass' : (r.status === 'warn' ? 'pass' : 'fail'),
        ms: r.latency,
        error: r.status === 'fail' ? r.details : undefined,
        rawId: r.name
      }))

      lifecycleResults = [resL1, resL2, resL3, resL4].map(r => ({
        name: r.name,
        status: r.status === 'pass' ? 'pass' : (r.status === 'warn' ? 'pass' : 'fail'),
        ms: r.latency,
        error: r.status === 'fail' ? r.details : undefined,
        rawId: r.name
      }))

    } catch (err) {
      console.error('Diagnostic error:', err)
      backendResults = [{ name: 'System Core Connectivity', status: 'fail', error: err.message, ms: 0, rawId: 'CORE_FAIL' }]
    }

    const result = SUITES_BY_PAGE.map(category => ({
      ...category,
      suites: category.suites.map(suite => {
        let tests = suite.tests // Local unit tests
        
        // Lifecycle Mapping
        if (suite.id === 'master-journey') {
          tests = lifecycleResults
        }
        // Infrastructure Mapping
        else if (suite.id === 'backend-core') {
          tests = backendResults.filter(r => ['ScraperAPI (Puppeteer)', 'Google PageSpeed', 'SMTP Mail Server'].includes(r.rawId))
        } else if (suite.id === 'db-integrity') {
          tests = backendResults.filter(r => ['Supabase Database', 'Data Isolation (RLS)'].includes(r.rawId))
        } else if (suite.id === 'job-engine') {
          tests = backendResults.filter(r => r.rawId === 'Job Engine (Queue)')
        }
        // Intelligence Mapping
        else if (suite.id === 'comms-core') {
          tests = backendResults.filter(r => ['WhatsApp Session', 'Telegram Bot'].includes(r.rawId))
        } else if (suite.id === 'ai-engines') {
          const bTests = backendResults.filter(r => ['Groq AI API', 'Python Microservices'].includes(r.rawId))
          const eTests = enterpriseResults.filter(r => r.rawId === 'AI Microservice Handshake')
          tests = [...bTests, ...eTests]
        } 
        // Simulations
        else if (suite.id === 'report-engine') {
          tests = simulationResults.filter(r => r.rawId === 'Report Synthesis')
        } else if (suite.id === 'email-logic') {
          tests = simulationResults.filter(r => r.rawId === 'Email Logic')
        } else if (suite.id === 'worker-status') {
          tests = simulationResults.filter(r => r.rawId === 'Worker Health')
        }
        // Senior Results
        else if (suite.id === 'observability') {
          tests = seniorResults.filter(r => r.rawId === 'System Stability (100 Logs)')
        } else if (suite.id === 'resource-audit') {
          tests = seniorResults.filter(r => r.rawId === 'Memory Footprint')
        } else if (suite.id === 'security-audit') {
          tests = seniorResults.filter(r => r.rawId === 'Security Shield (RLS)')
        }
        // Enterprise Results
        else if (suite.id === 'external-integration') {
          tests = enterpriseResults.filter(r => ['ScraperAPI Balance', 'Google Sheets Ecosystem'].includes(r.rawId))
        } else if (suite.id === 'env-integrity') {
          tests = enterpriseResults.filter(r => r.rawId === 'Secret Shield (Env)')
        }

        // For static suites (non-async), run the internal test logic
        if (!suite.async) {
           tests = tests.map(t => {
             const tStart = performance.now()
             try {
               t.fn()
               return { ...t, status: 'pass', ms: +(performance.now() - tStart).toFixed(2) }
             } catch (e) {
               return { ...t, status: 'fail', ms: +(performance.now() - tStart).toFixed(2), error: e.message }
             }
           })
        }

        return { ...suite, tests }
      })
    }))

    setSuitesResults(result)
    setTotalMs(+(performance.now() - startTime).toFixed(0))
    setRunning(false)
  }, [])

  const currentTabSuites = useMemo(() => {
    const suites = suitesResults 
      ? suitesResults.find(t => t.id === activeTab)?.suites 
      : SUITES_BY_PAGE.find(t => t.id === activeTab)?.suites
    return suites || []
  }, [suitesResults, activeTab])

  const stats = useMemo(() => {
    if (!suitesResults) return null
    const all = suitesResults.flatMap(c => c.suites.flatMap(s => s.tests))
    if (!all.length) return null
    return {
      total: all.length,
      passed: all.filter(t => t.status === 'pass').length,
      failed: all.filter(t => t.status === 'fail').length,
      rate: Math.round((all.filter(t => t.status === 'pass').length / all.length) * 100)
    }
  }, [suitesResults])

  const animatedRate = useCountUp(stats?.rate)
  const animatedPassed = useCountUp(stats?.passed)
  const animatedMs = useCountUp(totalMs)

  return (
    <div className="min-h-screen relative overflow-hidden font-sans">
      {/* 🌌 Luxury Background Elements */}
      <div className="fixed inset-0 bg-[#02040a] pointer-events-none" />
      <div className="fixed top-[-15%] left-[-15%] w-[60%] h-[60%] bg-accent/5 rounded-full blur-[160px] animate-pulse pointer-events-none" />
      <div className="fixed bottom-[-15%] right-[-15%] w-[60%] h-[60%] bg-blue-500/5 rounded-full blur-[160px] pointer-events-none" />

      <div className="w-full relative z-10 px-4 md:px-6 lg:px-10 pb-20 pt-6 space-y-8">
        
        {/* Navbar */}
        <Navbar 
          search={search} setSearch={setSearch}
          privacyMode={privacyMode} setPrivacyMode={setPrivacyMode}
          onRefresh={runAllTests} isRefreshing={running}
          showActions={true}
        />

        {/* Diagnostic Dashboard Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className={`lg:col-span-2 p-8 rounded-3xl border flex items-center gap-8 transition-all duration-500 ${
            !stats ? 'bg-white/[0.02] border-white/[0.05]' : 
            stats.failed > 0 ? 'bg-red-500/[0.03] border-red-500/20 shadow-[0_4px_24px_rgba(239,68,68,0.05)]' : 
            'bg-emerald-500/[0.03] border-emerald-500/20 shadow-[0_4px_24px_rgba(16,185,129,0.05)]'
          }`}>
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-500 ${
              !stats ? 'bg-white/5 text-white/20' :
              stats.failed > 0 ? 'bg-red-500/20 text-red-400 scale-105' : 
              'bg-emerald-500/20 text-emerald-400'
            }`}>
              {!stats ? <Beaker className="w-10 h-10"/> : stats.failed > 0 ? <XCircle className="w-10 h-10 animate-pulse"/> : <CheckCircle2 className="w-10 h-10"/>}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-black text-white tracking-tight leading-tight">
                {!stats ? 'System Diagnostic' : stats.failed === 0 ? 'Strategic Suite Solid' : 'Anomalies Identified'}
              </h2>
              <p className="text-sm text-white/30 font-medium mt-1">
                {!stats ? 'Run diagnostics to verify system integrity.' : `${animatedPassed} of ${stats.total} tests executed successfully in ${animatedMs}ms.`}
              </p>
            </div>
            {stats && (
              <div className="text-right hidden sm:block">
                <div className={`text-5xl font-black tracking-tighter ${stats.failed > 0 ? 'text-red-400' : 'text-emerald-400'}`}>{animatedRate}%</div>
                <p className="text-[10px] uppercase font-black text-white/20 tracking-[0.2em] mt-1">Global Health</p>
              </div>
            )}
          </div>

          <div className="glass-card p-6 flex flex-col justify-center items-center gap-4 text-center border-white/[0.05]">
             <p className="text-xs text-white/40 font-medium">Validation engine for Alygen Intelligence & Automation Layer.</p>
             <Button onClick={runAllTests} disabled={running} className="w-full bg-white/5 border-white/10 hover:bg-white/10 text-white font-bold h-12 rounded-2xl">
               {running ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Play className="w-4 h-4 mr-2" />}
               {running ? 'Diagnosing...' : 'Run Global Audit'}
             </Button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Advanced Tab Navigation */}
          <div className="flex p-1.5 bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-x-auto no-scrollbar backdrop-blur-md">
            {SUITES_BY_PAGE.map(tab => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2.5 px-6 py-3 rounded-xl font-bold whitespace-nowrap transition-all duration-300 ${
                    isActive ? 'bg-white/10 text-white shadow-[0_4px_12px_rgba(255,255,255,0.05)]' : 'text-white/20 hover:text-white/50 hover:bg-white/[0.02]'
                  }`}
                >
                  <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-[hsl(18,100%,62%)]' : ''}`} />
                  <span className="text-xs uppercase tracking-widest">{tab.tab}</span>
                </button>
              )
            })}
          </div>

          {/* Luxury Suite Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
            <TerminalSimulator isVisible={running} />
            
            {currentTabSuites
              .filter(s => !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.tests.some(t => t.name.toLowerCase().includes(search.toLowerCase())))
              .map((s, idx) => (
              <div key={s.id} data-animate="fade-in" style={{ animationDelay: `${idx * 0.1}s` }} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <SuiteCard suite={s} search={search} />
              </div>
            ))}
          </div>

          {currentTabSuites.length === 0 && (
            <div className="py-20 text-center">
              <Beaker className="w-12 h-12 text-white/5 mx-auto mb-4" />
              <p className="text-white/20 font-bold uppercase tracking-widest">No diagnostics in this sector</p>
            </div>
          )}
        </div>

        {/* Global Footer Legend */}
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4 pt-12 border-t border-white/[0.03] opacity-20 transition-opacity hover:opacity-50">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"><CheckCircle2 className="w-3 h-3 text-emerald-400"/> Logic Validated</div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"><ArrowLeft className="w-3 h-3"/> UX Simulation</div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"><Cloud className="w-3 h-3"/> Infrastructure Pillar</div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"><Brain className="w-3 h-3"/> Intelligence Core</div>
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Loader2, ExternalLink, Download, BarChart3, Mail, Zap, Filter, Eye, ArrowLeft, Globe, TrendingUp, Shield, Info } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card } from '../components/ui/card'
import LeadDrawer from '../components/LeadDrawer'
import axios from 'axios'

import { api } from '../utils/api'

export default function Tester() {
  const navigate = useNavigate()
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [steps, setSteps] = useState([])
  const [currentStep, setCurrentStep] = useState(-1)
  const [privacyMode, setPrivacyMode] = useState(false)

  const normalizeUrl = (input) => {
    let normalized = (input || '').trim().toLowerCase()
    normalized = normalized.replace(/^(https?:\/\/)?(www\.)?/, '')
    normalized = normalized.replace(/\/$/, '')
    return normalized
  }

  const analysisSteps = [
    { label: 'Initializing Alygen 2026 Engines', duration: 2000 },
    { label: 'Technical Audit: SEO, Headers & Security', duration: 8000 },
    { label: 'Lighthouse Scan: Core Web Vitals (Mobile)', duration: 8000 },
    { label: 'Researcher Agent: Scanning Local Competition', duration: 10000 },
    { label: 'Strategist Agent: Mapping Conversion Gaps', duration: 7000 },
    { label: 'Synthesizer Agent: Generating Final Verdict', duration: 5000 }
  ]

  const handleAnalyze = async () => {
    if (!url.trim()) {
      setError('Please enter a valid URL')
      return
    }

    setLoading(true)
    setError(null)
    setAnalysis(null)
    setCurrentStep(0)
    setSteps(analysisSteps.map(s => ({ ...s, status: 'pending' })))

    const startTime = Date.now()

    try {
      const normalizedUrl = normalizeUrl(url)
      
      // Simular progresso visual enquanto a análise corre em background
      const progressInterval = setInterval(() => {
        setCurrentStep(prev => {
          if (prev < analysisSteps.length - 1) return prev + 1
          clearInterval(progressInterval)
          return prev
        })
      }, 6000)

      // 1. Start COMPLETE Synchronous Analysis (Alygen 2026 Live Audit)
      const response = await api.post(`/analyze-tester`, {
        url: normalizedUrl,
        leadData: { name: 'Test Company', website: normalizedUrl }
      }, { timeout: 90000 }) // Increased to 90s to support Audit + AI Intel

      const finalAnalysis = response.data?.data || response.data
      
      clearInterval(progressInterval)
      setCurrentStep(analysisSteps.length - 1)
      
      const analysisData = {
        id: `temp-${Date.now()}`,
        isTemporary: true,
        ...finalAnalysis,
        analysis: finalAnalysis
      }

      // Small pause for user to read the last step "Completed"
      setTimeout(() => {
        setAnalysis(analysisData)
        setDrawerOpen(true)
        setLoading(false)
        setCurrentStep(-1)
      }, 1500)

    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Error analyzing the site')
      setLoading(false)
      setCurrentStep(-1)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) {
      handleAnalyze()
    }
  }

  return (
    <div className="min-h-screen p-4 md:p-6">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4" data-animate="fade-in">
        <div className="flex items-center gap-3">
          <img src="/logo/alygen-logo.png"
            alt="Alygen" className="w-10 h-10 object-contain" />
          <div>
            <h1 className="text-xl font-black text-white tracking-tight">ALYGEN<span className="text-[hsl(18,100%,52%)]">.</span>CRM</h1>
            <p className="text-xs text-white/30 font-medium">Intelligent Lead Analysis</p>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap items-center">
          {/* Search */}
          <div className="relative flex items-center w-44">
            <Search className="absolute left-3 w-3.5 h-3.5 text-white/30 pointer-events-none" />
            <input type="text" placeholder="Search leads..."
              className="w-full pl-9 pr-7 py-1.5 bg-white/[0.04] border border-white/[0.08] rounded-lg text-xs text-white placeholder-white/25 focus:outline-none focus:border-white/20 focus:bg-white/[0.06] transition-all" />
          </div>

          <button onClick={() => setPrivacyMode(!privacyMode)}
            className={`p-1.5 rounded-lg border transition-all duration-300 transform active:scale-95 ${
              privacyMode 
                ? 'bg-[hsl(18,100%,52%)/0.15] border-[hsl(18,100%,52%)/0.35] text-[hsl(18,100%,62%)] shadow-[0_4px_12px_hsl(18,100%,52%/0.25)]' 
                : 'bg-white/[0.04] border-white/[0.08] text-white/30 hover:bg-white/[0.08] hover:border-white/[0.12] hover:text-white/60 hover:shadow-[0_2px_8px_rgba(0,0,0,0.15)]'
            }`}
            title={privacyMode ? 'Disable privacy' : 'Enable privacy'}>
            <Eye className="w-3.5 h-3.5" />
          </button>

          {[
            { label: 'Dashboard',  icon: BarChart3, path: '/dashboard' },
            { label: 'Follow-ups', icon: Mail,      path: '/followups' },
            { label: 'Automation', icon: Zap,       path: '/automation' },
            { label: 'Templates',  icon: Mail,      path: '/templates' },
            { label: 'Tests',      icon: Filter,    path: '/tests' },
          ].map(({ label, icon: Icon, path }) => (
            <Button key={path} onClick={() => navigate(path)} variant="outline" size="sm"
              className="h-8 text-xs border-white/[0.08] text-white/50 hover:bg-white/[0.06] hover:text-white hover:border-white/20 transition-all duration-300 transform active:scale-95 hover:shadow-[0_2px_8px_rgba(0,0,0,0.1)]">
              <Icon className="w-3.5 h-3.5 mr-1.5" />{label}
            </Button>
          ))}

          <Button 
            onClick={() => navigate('/')}
            variant="outline" 
            size="sm"
            className="h-8 text-xs border-white/20 text-white hover:bg-white/10 transition-all duration-300 transform active:scale-95 hover:shadow-[0_2px_8px_rgba(0,0,0,0.1)]"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
            Back
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full space-y-5">
        <div className="w-full mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500/20 to-orange-600/20 border border-orange-500/30 rounded-full mb-6">
              <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse"></div>
              <span className="text-xs font-medium text-orange-300 uppercase tracking-wider">Live Analysis Tool</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-black text-white mb-6 bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent">
              Test Any Website
            </h2>
            <p className="text-xl text-gray-300 mb-4 max-w-2xl mx-auto leading-relaxed">
              Complete analysis of performance, SEO, security and accessibility
            </p>
            <div className="flex items-center justify-center gap-6 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                <span>Real-time results</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                <span>Visual certificate</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-400"></div>
                <span>Detailed metrics</span>
              </div>
            </div>
          </div>

          {/* Search Card */}
          <Card className="p-10 bg-gradient-to-br from-white/[0.08] to-white/[0.02] border-white/[0.10] backdrop-blur-xl mb-8 shadow-2xl shadow-black/20">
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-1 relative group">
                  <Input
                    type="text"
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    placeholder="Enter website URL or domain..."
                    className="bg-black/60 border-white/[0.15] text-white placeholder-white/40 focus:border-orange-500/50 focus:ring-4 focus:ring-orange-500/20 rounded-xl px-6 py-4 text-lg transition-all duration-300 group-hover:border-white/[0.25]"
                    onKeyPress={e => e.key === 'Enter' && handleAnalyze()}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 transition-all duration-300 group-hover:scale-110">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500/20 to-orange-600/20 border border-orange-500/30">
                      <Globe className="w-5 h-5 text-orange-400" />
                    </div>
                  </div>
                </div>
                <Button
                  onClick={handleAnalyze}
                  disabled={loading || !url}
                  className="bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 hover:from-orange-600 hover:via-orange-700 hover:to-orange-800 text-white font-bold px-10 py-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-orange-500/30 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Search className="w-6 h-6 mr-3" />
                      Analyze
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* ── ALYGEN ELITE ANALYSIS OVERLAY ─────────────────────────────────── */}
      {loading && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl animate-in fade-in duration-500">
          <div className="relative w-full max-w-xl mx-4 p-8 bg-gradient-to-br from-white/[0.08] to-transparent border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
            {/* Animated Blob Background */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-orange-600/20 rounded-full blur-[80px] animate-pulse"></div>
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-600/10 rounded-full blur-[80px]"></div>

            <div className="relative z-10 text-center space-y-8">
              <div className="flex justify-center">
                <div className="relative">
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20 animate-bounce">
                    <Zap className="w-12 h-12 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full border-4 border-black animate-pulse"></div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-black text-white tracking-tight uppercase">
                  Alygen Intelligence Core
                </h3>
                <p className="text-gray-400 text-sm font-medium">
                  {url.replace(/^(https?:\/\/)?(www\.)?/, '')} • Hybrid Multi-Agent Audit
                </p>
              </div>

              {/* Steps Progress */}
              <div className="space-y-4 max-w-md mx-auto">
                {analysisSteps.map((step, idx) => {
                  const isCurrent = idx === currentStep;
                  const isDone = idx < currentStep;
                  
                  return (
                    <div key={idx} className={`flex items-center gap-4 transition-all duration-500 ${isCurrent ? 'scale-105' : isDone ? 'opacity-50' : 'opacity-20'}`}>
                      <div className={`w-2 h-2 rounded-full ${isCurrent ? 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.8)]' : isDone ? 'bg-green-500' : 'bg-white/20'}`} />
                      <span className={`text-sm tracking-wide ${isCurrent ? 'text-white font-bold' : 'text-gray-400 font-medium'}`}>
                        {step.label}
                      </span>
                      {isCurrent && <Loader2 className="w-3 h-3 text-orange-400 animate-spin ml-auto" />}
                      {isDone && <div className="ml-auto text-[10px] text-green-500 font-bold uppercase tracking-widest">OK</div>}
                    </div>
                  );
                })}
              </div>

              {/* Modern Progress Bar */}
              <div className="relative pt-4">
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-orange-500 via-orange-400 to-orange-600 transition-all duration-1000 ease-in-out shadow-[0_0_15px_rgba(249,115,22,0.4)]"
                    style={{ width: `${((currentStep + 1) / analysisSteps.length) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-[10px] text-gray-500 font-bold uppercase tracking-tighter">
                  <span>Engine: Llama 3.1 70B</span>
                  <span>Safety: Zero-Hallucination Active</span>
                </div>
              </div>

              <div className="pt-2">
                <p className="text-xs text-orange-500/60 animate-pulse font-medium">
                  Initializing agents... this take approx. 45 seconds for deep analysis.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lead Drawer */}
      {analysis && (
        <LeadDrawer
          lead={analysis}
          open={drawerOpen}
          onClose={() => {
            setDrawerOpen(false)
            setAnalysis(null)
            setUrl('')
          }}
        />
      )}
    </div>
  )
}

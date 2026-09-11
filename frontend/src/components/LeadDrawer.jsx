import { useState, useEffect } from 'react'
import { X, TrendingDown, Zap, Award, Euro, Search, Shield, ShieldAlert, Users, Mail, Copy, Check, RefreshCw, FileText, Download, AlertTriangle, Eye, CheckCheck, Send, MessageCircle, Brain, Sparkles } from 'lucide-react'
import { toast } from 'react-hot-toast'
import axios from 'axios'
import { calculateQScore } from '../utils/qscore'
import { calculateProjectPrice } from '../utils/pricing'
import QScoreDetailed from './QScoreDetailed'
import QScoreAdvanced from './QScoreAdvanced'
import QScoreGauge from './gauges/QScoreGauge'
import MetricGauge from './gauges/MetricGauge'
import WebsiteScreenshot from './WebsiteScreenshot'
import ClientBlob3D from './ClientBlob3D'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Separator } from './ui/separator'
import { ScrollArea } from './ui/scroll-area'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'

export default function LeadDrawer({ lead, onClose, onWhatsAppSent, onNoWhatsApp, privacyMode }) {
  const [emailSent, setEmailSent] = useState(false)
  const [copied, setCopied] = useState(false)
  const [selectedEmail, setSelectedEmail] = useState('')
  const [customEmail, setCustomEmail] = useState('')
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [generatingPDF, setGeneratingPDF] = useState(false)
  const [certificate, setCertificate] = useState(null)
  const [editingHTML, setEditingHTML] = useState(false)
  const [editedHTML, setEditedHTML] = useState('')
  const [whatsappSent, setWhatsappSent] = useState(false)
  const [editingWhatsApp, setEditingWhatsApp] = useState(false)
  
  // SENIOR IMPROVEMENT: Lazy loading da análise completa para evitar timeouts na lista principal
  const [fullAnalysis, setFullAnalysis] = useState(null)
  const [loadingFull, setLoadingFull] = useState(false)
  const [errorFull, setErrorFull] = useState(null)
  const [mlPrediction, setMlPrediction] = useState(null)
  const [loadingML, setLoadingML] = useState(false)

  const [agentIntel, setAgentIntel] = useState(lead.agent_intel || null)
  const [loadingIntel, setLoadingIntel] = useState(false)
  const [promoting, setPromoting] = useState(false)
  const [isLeadSaved, setIsLeadSaved] = useState(false)

  // AI COPYWRITER SKILL STATES
  const [copywriterStyle, setCopywriterStyle] = useState('consultant_senior')
  const [loadingCopy, setLoadingCopy] = useState(false)

  const handleGenerateAICopy = async (channel) => {
    setLoadingCopy(true)
    try {
      const res = await axios.post(`http://localhost:3001/api/leads/${lead.id}/ai-copy`, {
        style: copywriterStyle,
        channel: channel,
        website: lead.website
      })
      if (res.data.success) {
        if (channel === 'email') {
          setEditedHTML(res.data.text)
          setSelectedEmail(res.data.text)
          setEditingHTML(true) // Open editor to show HTML copy
          toast.success('Email generated with AI Copywriter!')
        } else if (channel === 'whatsapp') {
          setWhatsappMessage(res.data.text)
          toast.success('WhatsApp generated with AI Copywriter!')
        }
      }
    } catch (err) {
      toast.error('Error generating copy with AI: ' + (err.response?.data?.error || err.message))
    } finally {
      setLoadingCopy(false)
    }
  }

  const handleGenerateIntel = async () => {
    setLoadingIntel(true)
    try {
      const res = await axios.post(`/api/leads/${lead.id}/market-intel`, {
        website: lead.website
      });
      if (res.data.success) {
        setAgentIntel(res.data.intel)
        if (res.data.newEmailHtml) {
          setEditedHTML(res.data.newEmailHtml)
        }
        toast.success('Market Intelligence generated and injected into email successfully!')
      } else {
        toast.error(res.data.error || 'Error generating intel')
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message
      if (msg.includes('Python') || msg.includes('offline')) {
        toast.error('Python server offline. Please start the Python microservice.')
      } else {
        toast.error('Error: ' + msg)
      }
    } finally {
      setLoadingIntel(false)
    }
  }

  const handlePromoteLead = async () => {
    setPromoting(true)
    try {
      const res = await axios.post('http://localhost:3001/api/leads/promote', {
        lead: lead,
        analysis: effectiveAnalysis
      });
      if (res.data.success) {
        setIsLeadSaved(true)
        toast.success('Lead saved to CRM successfully!')
      } else {
        toast.error(res.data.error || 'Error saving lead')
      }
    } catch (err) {
      toast.error('Error: ' + (err.response?.data?.error || err.message))
    } finally {
      setPromoting(false)
    }
  }

  const effectiveAnalysis = fullAnalysis || lead.analysis

  // Synchronize market intelligence saved in the database
  useEffect(() => {
    if (lead?.agent_intel) {
      setAgentIntel(lead.agent_intel)
    } else if (fullAnalysis?.agent_intel) {
      setAgentIntel(fullAnalysis.agent_intel)
    } else {
      setAgentIntel(null)
    }
  }, [lead, fullAnalysis])
  
  
  useEffect(() => {
    async function fetchFullDetails() {
      if (!lead.website) return
      
      setLoadingFull(true)
      setErrorFull(null)
      try {
        const websiteEncoded = encodeURIComponent(lead.website)
        const response = await axios.get(`http://localhost:3001/api/supabase/analysis/${websiteEncoded}`)
        if (response.data?.success) {
          const analysisData = response.data.data;
          console.log(`✅ Analysis loaded for ${lead.website}`);
          setFullAnalysis(analysisData);
          
          // If it is a fast Phase 1 analysis, perform an on-demand background upgrade to Phase 3 AI
          if (analysisData && (analysisData.audit_phase === 1 || !analysisData.audit_phase)) {
            console.log('⚡ Starting on-demand upgrade to Phase 3 AI...');
            const upgradeRes = await axios.post('http://localhost:3001/api/analyze-lead', {
              url: lead.website,
              leadData: lead,
              forceReanalyze: false,
              phase: 3
            });
            if (upgradeRes.data?.success && upgradeRes.data.data) {
              setFullAnalysis(upgradeRes.data.data);
            }
          }
        }
      } catch (err) {
        console.warn('⚠️ Failed to load full details (meta only):', err.message)
      } finally {
        setLoadingFull(false)
      }
    }

    if (lead.analysis && (lead.analysis.audit_phase === 1 || !lead.analysis.aiInsights || !lead.analysis.audit_phase)) {
      fetchFullDetails()
    } else if (lead.analysis) {
      setFullAnalysis(lead.analysis)
    }
  }, [lead.website])

  // AUTO-TRIGGER MARKET INTEL (Auto-generate to include in email)
  useEffect(() => {
    if (fullAnalysis && !agentIntel && !loadingIntel && !isNoWebsite) {
      console.info('Auto-Trigger: Generating Market Intel for professional report...')
      handleGenerateIntel()
    }
  }, [fullAnalysis, agentIntel])

  // ML Prediction — runs after having the complete analysis
  useEffect(() => {
    async function fetchMLPrediction() {
      if (!effectiveAnalysis || isNoWebsite) return
      setLoadingML(true)
      try {
        const res = await axios.post('http://localhost:3002/ml/predict', [effectiveAnalysis], { timeout: 8000 })
        if (res.data?.success && res.data.predictions?.[0]) {
          setMlPrediction(res.data.predictions[0])
        }
      } catch {
        // Silently fail — ML is optional
      } finally {
        setLoadingML(false)
      }
    }
    fetchMLPrediction()
  }, [effectiveAnalysis?.performanceMobile, effectiveAnalysis?.seo?.score])

  function buildWhatsAppMessage(emailWasSent = false) {
    const perf = effectiveAnalysis?.performanceMobile
    const seo = effectiveAnalysis?.seo?.score
    const hasPixel = effectiveAnalysis?.pixelDetails?.facebook || effectiveAnalysis?.pixelDetails?.ga4

    if (emailWasSent) {
      return `Hello! I am from the Alygen team.\n\nI sent an email to *${lead.name}* with a detailed report of your website.\n\nHave you had a chance to look at it? If you have any questions, I am available.\n\nBest regards,\nAlygen Team`
    }

    const issues = []
    if (perf !== undefined && perf < 50) issues.push(`• Mobile Performance: ${perf}/100`)
    if (seo !== undefined && seo < 50) issues.push(`• Weak SEO — low visibility on Google`)
    if (!hasPixel) issues.push(`• No conversion pixel (Meta/GA4)`)

    const issuesText = issues.length > 0 ? `\n\nI found some issues:\n${issues.join('\n')}` : ''

    return `Hello! I am from the Alygen team.\n\nI analyzed the website of *${lead.name}*.${issuesText}\n\nI sent you a detailed report by email. Would you be interested in discussing the results?\n\nBest regards,\nAlygen Team`
  }

  const [whatsappMessage, setWhatsappMessage] = useState('')

  useEffect(() => {
    if (effectiveAnalysis) setWhatsappMessage(buildWhatsAppMessage(emailSent))
  }, [effectiveAnalysis, emailSent])

  const isNoWebsite = effectiveAnalysis?.category === 'SEM_SITE' || effectiveAnalysis?.isSocialMediaOnly
  const availableEmails = effectiveAnalysis?.extractedEmails || []
  const availablePhones = effectiveAnalysis?.extractedPhones?.length > 0
    ? effectiveAnalysis.extractedPhones
    : lead.phone ? [lead.phone] : []
  const qScore = isNoWebsite ? { score: 0, grade: 'N/A', category: 'No Website' } : (effectiveAnalysis?.qScore || calculateQScore(effectiveAnalysis))
  const qScoreAdvanced = effectiveAnalysis?.qScoreAdvanced || null
  const pricing = isNoWebsite ? { total: effectiveAnalysis?.websiteProposal?.proposal?.investment?.total || 0, timeline: 0 } : calculateProjectPrice(effectiveAnalysis, qScore)
  const emailTemplate = editedHTML || effectiveAnalysis?.emailTemplate?.html || (loadingFull ? '<div style="padding: 20px; text-align: center; color: #666;">Loading full analysis...</div>' : '<div style="padding: 20px; text-align: center; color: #666;">Generating personalized template...</div>')
  
  useEffect(() => {
    if (availableEmails.length === 0) {
      setShowCustomInput(true)
    }
  }, [])

  useEffect(() => {
    async function generateCertificate() {
      if (!effectiveAnalysis || isNoWebsite) {
        console.log('Certificate not generated:', { hasAnalysis: !!effectiveAnalysis, isNoWebsite })
        return
      }
      
      const calculatedQScore = isNoWebsite ? { score: 0, grade: 'N/A' } : calculateQScore(effectiveAnalysis)
      
      console.log('Generating certificate...', { 
        companyName: lead.name, 
        website: lead.website,
        qscore: calculatedQScore.score 
      })
      
      try {
        const response = await axios.post(`http://localhost:3001/api/generate-certificate`, {
          companyName: lead.name,
          website: lead.website,
          qscore: calculatedQScore.score,
          qgrade: calculatedQScore.grade,
          metrics: {
            performance: effectiveAnalysis.performanceMobile || 0,
            seo: effectiveAnalysis.seo?.score || 0,
            security: effectiveAnalysis.security?.score || 0,
            tracking: effectiveAnalysis.pixelDetails?.totalTracking || 0
          }
        })
        console.log('Certificate generated:', response.data.certificate)
        setCertificate(response.data.certificate)
      } catch (error) {
        console.error('Error generating certificate:', error)
      }
    }
    generateCertificate()
  }, [effectiveAnalysis, lead, isNoWebsite])

  async function handleSendWhatsApp() {
    const phone = availablePhones[0]
    if (!phone) {
      toast.error('No phone available for this lead', {
        style: { background: '#0f0f0f', color: '#fff', border: '1px solid rgba(255,50,50,0.3)' }
      })
      return
    }
    try {
      await axios.post('http://localhost:3001/api/send-whatsapp', { phone, message: whatsappMessage, leadName: lead.name, website: lead.website })
      setWhatsappSent(true)
      if (onWhatsAppSent) onWhatsAppSent(lead.website)
      toast.custom((t) => (
        <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-sm w-full bg-[#0f0f0f] border border-green-500/30 shadow-2xl rounded-2xl pointer-events-auto flex items-start p-4 gap-3`}>
          <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
            <MessageCircle className="w-5 h-5 text-green-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-white">WhatsApp Enviado!</p>
            <p className="text-xs text-white/60 mt-0.5">Para: {phone}</p>
          </div>
        </div>
      ), { duration: 4000, position: 'bottom-right' })
      setTimeout(() => setWhatsappSent(false), 3000)
    } catch (error) {
      const msg = error.response?.data?.error || error.message
      const isNoWA = msg.includes('não está registado')
      if (isNoWA && onNoWhatsApp) onNoWhatsApp(availablePhones[0])
      toast.error(
        isNoWA
          ? `Number without WhatsApp — try contacting by phone or email.`
          : `Error sending WhatsApp: ${msg}`,
        { style: { background: '#0f0f0f', color: '#fff', border: '1px solid rgba(255,50,50,0.3)' }, duration: 6000 }
      )
    }
  }

  async function handleSendEmail() {
    const recipientEmail = customEmail || selectedEmail || availableEmails[0]
    
    if (!recipientEmail) {
      alert('Please enter a valid email.');
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      alert('Invalid email. Please enter a valid email.');
      return;
    }

    // Send only light fields — backend regenerates the template
    const lightAnalysis = {
      performanceMobile: effectiveAnalysis?.performanceMobile,
      performanceScore: effectiveAnalysis?.performanceScore,
      overallScore: effectiveAnalysis?.overallScore,
      qScore: effectiveAnalysis?.qScore,
      seo: effectiveAnalysis?.seo,
      security: effectiveAnalysis?.security,
      accessibility: effectiveAnalysis?.accessibility,
      pixelDetails: effectiveAnalysis?.pixelDetails,
      coreWebVitals: effectiveAnalysis?.coreWebVitals,
      conversion: effectiveAnalysis?.conversion,
      category: effectiveAnalysis?.category,
      isSocialMediaOnly: effectiveAnalysis?.isSocialMediaOnly,
      socialMediaInfo: effectiveAnalysis?.socialMediaInfo,
      priority: effectiveAnalysis?.priority,
    }
    
    try {
      await axios.post('http://localhost:3001/api/send-email', {
        leadId: lead.id,
        leadName: lead.name,
        recipient: recipientEmail,
        analysis: lightAnalysis,
        leadData: {
          name: lead.name,
          type: lead.type,
          address: lead.address,
          postal_code: lead.postal_code || lead.address?.match(/\d{4}/)?.[0],
          city: lead.city,
          website: lead.website
        }
      })
      setEmailSent(true)
      toast.custom((t) => (
        <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-sm w-full bg-[#0f0f0f] border border-green-500/30 shadow-2xl rounded-2xl pointer-events-auto flex items-start p-4 gap-3`}>
          <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
            <Send className="w-5 h-5 text-green-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-white">Email Sent! ✉️</p>
            <p className="text-xs text-white/60 mt-0.5">To: {recipientEmail}</p>
            <p className="text-[11px] text-green-400 mt-1">You will be notified when the client opens it</p>
          </div>
        </div>
      ), { duration: 5000, position: 'bottom-right' })
      setTimeout(() => setEmailSent(false), 3000)
    } catch (error) {
      console.error('Error sending email:', error)
      toast.error(`Error sending email: ${error.response?.data?.error || error.message}`, {
        style: { background: '#0f0f0f', color: '#fff', border: '1px solid rgba(255,50,50,0.3)' }
      })
    }
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(emailTemplate)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleGeneratePDF() {
    setGeneratingPDF(true)
    try {
      const response = await axios.post('http://localhost:3001/api/generate-pdf', {
        analysis: effectiveAnalysis,
        leadData: {
          name: lead.name,
          company_name: lead.name,
          website: lead.website,
          address: lead.address,
          city: lead.city,
          postal_code: lead.postal_code
        }
      }, {
        responseType: 'blob'
      })
      
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `Report-${lead.name.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      toast.success('PDF Report generated successfully!', {
        style: { background: '#0f0f0f', color: '#fff', border: '1px solid rgba(99,102,241,0.3)' }
      })
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast.error(`Error generating PDF: ${error.response?.data?.error || error.message}`, {
        style: { background: '#0f0f0f', color: '#fff', border: '1px solid rgba(255,50,50,0.3)' }
      })
    } finally {
      setGeneratingPDF(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center z-50 p-4 md:p-6 overflow-hidden">
      <div className="bg-[#0b0c10] border border-white/10 w-full max-w-7xl h-[calc(100vh-2rem)] rounded-2xl flex flex-col overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-200">
        
        {/* HEADER */}
        <div className="border-b border-border p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-white mb-2">{privacyMode ? <span className="blur-lg select-none">{lead.name}</span> : lead.name}</h2>
              <a href={lead.website} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-accent text-sm transition-colors">
                {privacyMode ? <span className="blur-sm select-none">{lead.website}</span> : lead.website}
              </a>
              {availablePhones.length > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-muted-foreground">Tel:</span>
                  <a href={`tel:${availablePhones[0].replace(/\s/g, '')}`} className="text-accent hover:underline text-sm font-medium">
                    {privacyMode ? <span className="blur-sm select-none">{availablePhones[0]}</span> : availablePhones[0]}
                  </a>
                </div>
              )}
              {lead.address && (
                <p className="text-muted-foreground text-xs mt-1">{privacyMode ? <span className="blur-sm select-none">{lead.address}</span> : lead.address}</p>
              )}
            </div>
            <div className="flex gap-2 items-center">
              {lead.isTemporary && !isLeadSaved && (
                <Button 
                  onClick={handlePromoteLead} 
                  disabled={promoting}
                  className="bg-green-600 hover:bg-green-700 text-white border-none shadow-lg shadow-green-900/20"
                  size="sm"
                >
                  {promoting ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <CheckCheck className="w-4 h-4 mr-2" />}
                  Save to CRM
                </Button>
              )}
              {isLeadSaved && (
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                  ✓ Saved
                </Badge>
              )}
              <button
                onClick={async () => {
                  try {
                    const newStatus = !(effectiveAnalysis.is_immune || false);
                    const { data } = await axios.post('http://localhost:3001/api/crm/update', { 
                      website: lead.website, 
                      payload: { is_immune: newStatus } 
                    });
                    if (data.success) {
                      toast.success(newStatus ? 'Immunity activated' : 'Immunity removed');
                      // To update the UI locally (the analysis is immutable via prop here, but we will notify the user)
                      effectiveAnalysis.is_immune = newStatus; 
                      window.dispatchEvent(new CustomEvent('lead-updated', { detail: { website: lead.website, is_immune: newStatus } }));
                    }
                  } catch (e) {
                    toast.error('Error updating immunity');
                    // toast.error('Erro ao atualizar imunidade');
                  }
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${
                  effectiveAnalysis.is_immune 
                    ? 'bg-accent/20 border-accent/50 text-accent font-bold' 
                    : 'bg-white/5 border-white/10 text-white/40 hover:text-white/60'
                }`}
                title={effectiveAnalysis.is_immune ? "Immunity Active" : "Activate Immunity (Stop Automations)"}
              >
                <ShieldAlert className="w-4 h-4" />
                <span className="text-xs">{effectiveAnalysis.is_immune ? 'IMMUNE' : 'IMMUNIZE'}</span>
              </button>
              <Button 
                onClick={handleGeneratePDF} 
                disabled={generatingPDF}
                variant="outline" 
                size="icon"
                title="Generate Professional PDF Report"
                className="hover:bg-accent/10 hover:text-accent"
              >
                {generatingPDF ? <RefreshCw className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
              </Button>
              <Button onClick={onClose} variant="ghost" size="icon" className="hover:bg-white/10">
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
          
          {/* QUICK STATS */}
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-muted/50 p-3 rounded-lg border border-border flex flex-col items-center">
              <p className="text-xs text-muted-foreground mb-2">Q Score</p>
              <QScoreGauge score={qScore.score} grade={qScore.grade} size="small" showLabel={false} />
            </div>
            <div className="bg-muted/50 p-3 rounded-lg border border-border">
              <div className="flex justify-between items-start mb-1">
                <p className="text-xs text-muted-foreground">Urgency</p>
                {effectiveAnalysis?.strategicInsights?.urgency_level && (
                  <Badge variant="outline" className={`text-[10px] py-0 px-1 ${
                    effectiveAnalysis.strategicInsights.urgency_level === 'CRITICAL' ? 'border-red-500 text-red-500' :
                    effectiveAnalysis.strategicInsights.urgency_level === 'HIGH' ? 'border-orange-500 text-orange-500' :
                    'border-green-500 text-green-500'
                  }`}>
                    {effectiveAnalysis.strategicInsights.urgency_level}
                  </Badge>
                )}
              </div>
              <p className="text-2xl font-bold text-white capitalize">{effectiveAnalysis?.strategicInsights?.tone || 'N/A'}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Tone of Voice</p>
            </div>
            <div className="bg-muted/50 p-3 rounded-lg border border-border">
              <p className="text-xs text-muted-foreground mb-1">Benchmark</p>
              <p className={`text-2xl font-bold ${
                (qScore.benchmark?.status === 'urgent_gap') ? 'text-red-500' : 
                (qScore.benchmark?.status === 'market_leader') ? 'text-green-500' : 'text-white'
              }`}>
                {qScore.benchmark?.category_avg ? `${qScore.score - qScore.benchmark.category_avg > 0 ? '+' : ''}${qScore.score - qScore.benchmark.category_avg}` : 'N/A'}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase">vs. Market Avg</p>
            </div>
            <div className="bg-muted/50 p-3 rounded-lg border border-border">
              <p className="text-xs text-muted-foreground mb-1">Priority</p>
              <p className="text-2xl font-bold text-white">{effectiveAnalysis.priority}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Lead Ranking</p>
            </div>
          </div>
        </div>

        {/* CONTENT IN GRID */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main workspace (Tabs / Email / Screenshot) - Left Column 65% */}
          <ScrollArea className="w-full md:w-[65%] h-full border-r border-border">
            <div className="p-6">
              <Tabs defaultValue="email" className="w-full">
              <TabsList className="w-full grid grid-cols-4 mb-6 bg-muted/30 p-1 rounded-xl">
                <TabsTrigger value="email" className="rounded-lg py-2 font-bold uppercase tracking-wider text-xs">Email Pitch</TabsTrigger>
                <TabsTrigger value="details" className="rounded-lg py-2 font-bold uppercase tracking-wider text-xs">Technical Audit</TabsTrigger>
                <TabsTrigger value="qscore" className="rounded-lg py-2 font-bold uppercase tracking-wider text-xs">Q-Score Report</TabsTrigger>
                <TabsTrigger value="screenshot" className="rounded-lg py-2 font-bold uppercase tracking-wider text-xs">Website Screenshot</TabsTrigger>
              </TabsList>

              {/* TAB: OVERVIEW */}

              {/* TAB: SCREENSHOT */}
              <TabsContent value="screenshot" className="space-y-6">
                {!isNoWebsite ? (
                  <div className="space-y-6">
                    {/* Header Section */}
                    <div className="text-center space-y-4">
                      <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/20">
                        <svg className="w-10 h-10 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-3xl font-bold text-white mb-2">
                          How Customers See Your Site
                        </h3>
                        <p className="text-muted-foreground text-base max-w-2xl mx-auto">
                          Real-time screenshot. First impression is crucial to convert visitors into customers.
                        </p>
                      </div>
                    </div>
                    
                    {/* Mobile Preview Card */}
                    <div className="max-w-lg mx-auto">
                      <div className="bg-gradient-to-br from-card to-muted/20 rounded-2xl p-8 border border-border shadow-2xl">
                        {/* Card Header */}
                        <div className="flex items-center justify-between mb-6 pb-6 border-b border-border">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center border border-accent/20">
                              <svg className="w-7 h-7 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <div>
                              <h4 className="text-xl font-bold text-white">Mobile View</h4>
                              <p className="text-sm text-muted-foreground">80% of accesses</p>
                            </div>
                          </div>
                          <div className="px-4 py-2 rounded-lg bg-accent/10 border border-accent/20">
                            <span className="text-sm font-semibold text-accent">Real Time</span>
                          </div>
                        </div>
                        
                        {/* Screenshot */}
                        <WebsiteScreenshot url={lead.website} device="mobile" showFrame={true} />
                      </div>
                    </div>
                    
                    {/* Impact Metrics Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
                      <div className="group bg-gradient-to-br from-card to-muted/20 border border-border rounded-xl p-6 hover:border-accent/30 transition-all duration-300">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-500/5 flex items-center justify-center flex-shrink-0 border border-blue-500/20 group-hover:scale-110 transition-transform">
                            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <div className="text-2xl font-bold text-white mb-1">0.05s</div>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              Tempo que tem para causar uma boa primeira impressão antes do utilizador decidir ficar ou sair
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="group bg-gradient-to-br from-card to-muted/20 border border-border rounded-xl p-6 hover:border-destructive/30 transition-all duration-300">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-red-500/20 to-red-500/5 flex items-center justify-center flex-shrink-0 border border-red-500/20 group-hover:scale-110 transition-transform">
                            <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <div className="text-2xl font-bold text-white mb-1">38%</div>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              Users abandon immediately if the layout is unattractive or confusing
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="group bg-gradient-to-br from-card to-muted/20 border border-border rounded-xl p-6 hover:border-accent/30 transition-all duration-300">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-500/5 flex items-center justify-center flex-shrink-0 border border-purple-500/20 group-hover:scale-110 transition-transform">
                            <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <div className="text-2xl font-bold text-white mb-1">94%</div>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              First impressions are related to the website's visual design
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="group bg-gradient-to-br from-card to-muted/20 border border-border rounded-xl p-6 hover:border-green-500/30 transition-all duration-300">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500/20 to-green-500/5 flex items-center justify-center flex-shrink-0 border border-green-500/20 group-hover:scale-110 transition-transform">
                            <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <div className="text-2xl font-bold text-white mb-1">75%</div>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              Users judge company credibility by the website's appearance
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Call to Action Card */}
                    <div className="max-w-4xl mx-auto">
                      <div className="relative overflow-hidden bg-gradient-to-br from-accent/10 via-accent/5 to-transparent border border-accent/20 rounded-2xl p-8">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl"></div>
                        <div className="relative">
                          <div className="flex items-start gap-6">
                            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-accent/30 to-accent/10 flex items-center justify-center flex-shrink-0 border border-accent/30">
                              <svg className="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <h5 className="text-2xl font-bold text-white mb-3">Oportunidade de Melhoria</h5>
                              <p className="text-muted-foreground mb-6 leading-relaxed">
                                Um design moderno e profissional pode aumentar a taxa de conversão em até 300%. 
                                Invista na primeira impressão e transforme visitantes em clientes.
                              </p>
                              <div className="flex flex-wrap gap-3">
                                <span className="px-4 py-2 rounded-lg bg-accent/10 border border-accent/20 text-accent text-sm font-medium hover:bg-accent/20 transition-colors">Design Responsivo</span>
                                <span className="px-4 py-2 rounded-lg bg-accent/10 border border-accent/20 text-accent text-sm font-medium hover:bg-accent/20 transition-colors">Carregamento Rápido</span>
                                <span className="px-4 py-2 rounded-lg bg-accent/10 border border-accent/20 text-accent text-sm font-medium hover:bg-accent/20 transition-colors">CTAs Claros</span>
                                <span className="px-4 py-2 rounded-lg bg-accent/10 border border-accent/20 text-accent text-sm font-medium hover:bg-accent/20 transition-colors">Navegação Intuitiva</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-card border border-border rounded-lg p-6 text-center">
                    <h3 className="text-2xl font-bold text-white mb-2">SEM SITE PRÓPRIO</h3>
                    <p className="text-muted-foreground">Screenshot não aplicável</p>
                  </div>
                )}
              </TabsContent>

              {/* TAB: Q SCORE */}
              <TabsContent value="qscore" className="space-y-6">
                {!isNoWebsite ? (
                  <div className="space-y-6">
                    {qScoreAdvanced && (
                      <QScoreAdvanced qScore={qScoreAdvanced} />
                    )}
                    <QScoreDetailed qScore={qScore} />
                  </div>
                ) : (
                  <div className="bg-card border border-border rounded-lg p-6 text-center">
                    <h3 className="text-2xl font-bold text-white mb-2">SEM SITE PRÓPRIO</h3>
                    <p className="text-muted-foreground">Q-Score não aplicável</p>
                  </div>
                )}
              </TabsContent>

              {/* TAB: DETAILS */}
              <TabsContent value="details" className="space-y-6">
                {!isNoWebsite && (
                  <>
                    {/* 🧠 GRID SUPERIOR: ML CONVERSION & INTELIGÊNCIA */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* ML Conversion Score */}
                      {(mlPrediction || loadingML) && (
                        <div className={`rounded-xl p-5 border ${
                          mlPrediction?.tier === 'HOT'    ? 'bg-red-500/10 border-red-500/30' :
                          mlPrediction?.tier === 'WARM'   ? 'bg-orange-500/10 border-orange-500/30' :
                          mlPrediction?.tier === 'COLD'   ? 'bg-blue-500/10 border-blue-500/30' :
                          'bg-white/5 border-white/10'
                        }`}>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-black text-accent">ML</span>
                              <h3 className="text-sm font-bold text-white uppercase tracking-widest">Conversão Preditiva</h3>
                            </div>
                            {mlPrediction && (
                              <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                                mlPrediction.tier === 'HOT'    ? 'bg-red-500/20 text-red-400' :
                                mlPrediction.tier === 'WARM'   ? 'bg-orange-500/20 text-orange-400' :
                                mlPrediction.tier === 'COLD'   ? 'bg-blue-500/20 text-blue-400' :
                                'bg-white/10 text-white/40'
                              }`}>{mlPrediction.tier}</span>
                            )}
                          </div>

                          {loadingML && !mlPrediction ? (
                            <div className="flex items-center gap-2 text-white/40 py-4">
                              <RefreshCw className="w-4 h-4 animate-spin text-accent" />
                              <span className="text-xs">A calcular probabilidade de fecho...</span>
                            </div>
                          ) : mlPrediction ? (
                            <>
                              <div className="flex items-end gap-3 mb-3">
                                <span className={`text-5xl font-black ${
                                  mlPrediction.tier === 'HOT'  ? 'text-red-400' :
                                  mlPrediction.tier === 'WARM' ? 'text-orange-400' :
                                  mlPrediction.tier === 'COLD' ? 'text-blue-400' :
                                  'text-white/30'
                                }`}>{mlPrediction.conversion_probability}%</span>
                                <span className="text-xs text-white/40 mb-2 leading-tight">probabilidade<br/>de fecho</span>
                              </div>
                              <p className="text-xs text-white/80 leading-relaxed mb-3">{mlPrediction.recommendation}</p>
                              <div className="pt-2 border-t border-white/5 flex justify-between items-center text-[9px] text-white/30 uppercase tracking-wider">
                                <span>Engine ML GradientBoosting</span>
                                <span>Confiança: {mlPrediction.confidence}</span>
                              </div>
                            </>
                          ) : null}
                        </div>
                      )}

                      {/* Inteligência de Mercado local (DuckDuckGo + Llama AI) */}
                      <div className="bg-gradient-to-br from-orange-500/10 via-background to-background border border-orange-500/25 rounded-xl p-5 shadow-lg">
                        <div className="flex items-center gap-2 mb-3">
                          <Brain className="w-5 h-5 text-orange-400" />
                          <h3 className="text-sm font-bold text-white uppercase tracking-widest">Inteligência de Mercado</h3>
                          {agentIntel && <Badge className="ml-auto bg-green-500/20 text-green-400 border-none text-[9px] py-0 px-2 uppercase font-black">Ativo</Badge>}
                        </div>

                        {agentIntel ? (
                          <div className="space-y-3">
                            <p className="text-xs text-orange-100/90 leading-relaxed italic font-medium">"{agentIntel}"</p>
                            <p className="text-[9px] text-orange-400/40 uppercase tracking-wider">✦ Alygen Multi-Agent Core v2.0</p>
                          </div>
                        ) : (
                          <div className="text-center py-4">
                            <Sparkles className="w-6 h-6 text-orange-400/30 mx-auto mb-2" />
                            <p className="text-xs text-muted-foreground mb-3">Descubra concorrentes reais locais e crie o pitch de elite.</p>
                            <Button
                              className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs h-8 px-4"
                              onClick={handleGenerateIntel}
                              disabled={loadingIntel}
                            >
                              {loadingIntel ? <><RefreshCw className="w-3 h-3 mr-2 animate-spin" /> A analisar concorrentes...</> : <><Brain className="w-3 h-3 mr-2" /> Ativar Inteligência</>}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 🧠 POSICIONAMENTO ESTRATÉGICO AI */}
                    {effectiveAnalysis?.strategicInsights && (
                      <div className="bg-gradient-to-br from-indigo-500/10 via-background to-background border border-indigo-500/20 rounded-xl p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <Zap className="w-5 h-5 text-indigo-400" />
                          <h3 className="text-sm font-bold text-white uppercase tracking-widest">Estratégia Recomendada</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-[10px] text-muted-foreground uppercase tracking-widest block mb-1">Pitch de Vendas Comercial</Label>
                            <p className="text-xs text-indigo-100 font-medium leading-relaxed">
                              "{effectiveAnalysis.strategicInsights.strategic_recommendation}"
                            </p>
                          </div>
                          <div>
                            <Label className="text-[10px] text-muted-foreground uppercase tracking-widest block mb-2">Vulnerabilidades Digitais Encontradas</Label>
                            <div className="flex flex-wrap gap-1.5">
                              {effectiveAnalysis.strategicInsights.fragility_details?.length > 0 ? (
                                effectiveAnalysis.strategicInsights.fragility_details.map((flag, idx) => (
                                  <Badge key={idx} variant="outline" className="bg-red-500/5 border-red-500/20 text-red-400 text-[9px] font-bold">
                                    {flag}
                                  </Badge>
                                ))
                              ) : (
                                <Badge variant="outline" className="bg-green-500/5 border-green-500/20 text-green-400 text-[9px]">
                                  ✓ Sem vulnerabilidades críticas detetadas
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 📊 GRID DE AUDITORIAS REAIS (SEO, Segurança, RGPD, Acessibilidade, Tracking) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      {/* SEO REAL CARD */}
                      {effectiveAnalysis?.seo && (
                        <div className="bg-card border border-border rounded-xl p-5">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <Search className="w-5 h-5 text-accent" />
                              <h4 className="text-sm font-bold text-white uppercase tracking-widest">Otimização SEO</h4>
                            </div>
                            <span className="text-xl font-black text-white">{effectiveAnalysis.seo.score}/100</span>
                          </div>
                          <Separator className="mb-3 opacity-20" />
                          <div className="grid grid-cols-2 gap-2">
                            {['title', 'description', 'hasSitemap', 'hasRobotsTxt', 'hasSchema'].map(key => (
                              <div key={key} className="flex justify-between items-center px-3 py-1.5 bg-muted/30 rounded-lg">
                                <span className="text-white text-[11px] capitalize">{key.replace('has', '')}</span>
                                <span className={effectiveAnalysis.seo[key] || effectiveAnalysis.seo[key]?.optimal ? 'text-green-400 text-xs font-bold' : 'text-red-400 text-xs font-bold'}>
                                  {effectiveAnalysis.seo[key] || effectiveAnalysis.seo[key]?.optimal ? '✓ SIM' : '× NÃO'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* SEGURANÇA CARD */}
                      {effectiveAnalysis?.security && (
                        <div className="bg-card border border-border rounded-xl p-5">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <Shield className="w-5 h-5 text-accent" />
                              <h4 className="text-sm font-bold text-white uppercase tracking-widest">Segurança & SSL</h4>
                            </div>
                            <span className="text-xl font-black text-white">{effectiveAnalysis.security.score}/100</span>
                          </div>
                          <Separator className="mb-3 opacity-20" />
                          <div className="space-y-2">
                            <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                              <span className="text-white text-xs">Ligação Segura (SSL/HTTPS)</span>
                              <span className={effectiveAnalysis.security.hasSSL ? 'text-green-400 text-xs font-bold' : 'text-red-400 text-xs font-bold'}>
                                {effectiveAnalysis.security.hasSSL ? '✓ ATIVO' : '× INATIVO'}
                              </span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                              <span className="text-white text-xs">Cabeçalhos HTTP CSP / HSTS</span>
                              <span className={effectiveAnalysis.security.hasCSP || effectiveAnalysis.security.hasHSTS ? 'text-green-400 text-xs font-bold' : 'text-red-400 text-xs font-bold'}>
                                {effectiveAnalysis.security.hasCSP || effectiveAnalysis.security.hasHSTS ? '✓ CONFIGURADO' : '× AUSENTE'}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* RGPD & COOKIES CARD (100% REAL!) */}
                      {effectiveAnalysis?.gdpr && (
                        <div className="bg-card border border-border rounded-xl p-5">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <ShieldAlert className="w-5 h-5 text-accent" />
                              <h4 className="text-sm font-bold text-white uppercase tracking-widest">RGPD & Cookies</h4>
                            </div>
                            <span className="text-xl font-black text-white">{effectiveAnalysis.gdpr.score || 0}/100</span>
                          </div>
                          <Separator className="mb-3 opacity-20" />
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex justify-between items-center px-3 py-1.5 bg-muted/30 rounded-lg">
                              <span className="text-white text-[11px]">Pol. Privacidade</span>
                              <span className={effectiveAnalysis.gdpr.hasPrivacyPolicy ? 'text-green-400 text-xs font-bold' : 'text-red-400 text-xs font-bold'}>
                                {effectiveAnalysis.gdpr.hasPrivacyPolicy ? '✓ DETETADA' : '× N/A'}
                              </span>
                            </div>
                            <div className="flex justify-between items-center px-3 py-1.5 bg-muted/30 rounded-lg">
                              <span className="text-white text-[11px]">Pol. Cookies</span>
                              <span className={effectiveAnalysis.gdpr.hasCookiePolicy ? 'text-green-400 text-xs font-bold' : 'text-red-400 text-xs font-bold'}>
                                {effectiveAnalysis.gdpr.hasCookiePolicy ? '✓ DETETADA' : '× N/A'}
                              </span>
                            </div>
                            <div className="flex justify-between items-center px-3 py-1.5 bg-muted/30 rounded-lg col-span-2">
                              <span className="text-white text-[11px]">Banner de Consentimento Activo</span>
                              <span className={effectiveAnalysis.gdpr.hasConsentBanner ? 'text-green-400 text-xs font-bold' : 'text-red-400 text-xs font-bold'}>
                                {effectiveAnalysis.gdpr.hasConsentBanner ? '✓ SIM (CONFORME)' : '× AUSENTE (MULTA)'}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* ACESSIBILIDADE REAL CARD */}
                      {effectiveAnalysis?.accessibility && (
                        <div className="bg-card border border-border rounded-xl p-5">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <Users className="w-5 h-5 text-accent" />
                              <h4 className="text-sm font-bold text-white uppercase tracking-widest">Acessibilidade</h4>
                            </div>
                            <span className="text-xl font-black text-white">{effectiveAnalysis.accessibility.score}/100</span>
                          </div>
                          <Separator className="mb-3 opacity-20" />
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-muted/30 p-3 rounded-lg text-center">
                              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Erros Críticos</p>
                              <p className="text-xl font-black text-red-400">{effectiveAnalysis.accessibility.errors || 0}</p>
                            </div>
                            <div className="bg-muted/30 p-3 rounded-lg text-center">
                              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Avisos Leves</p>
                              <p className="text-xl font-black text-yellow-400">{effectiveAnalysis.accessibility.warnings || 0}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* TRACKING CARD */}
                      {effectiveAnalysis?.pixelDetails && (
                        <div className="bg-card border border-border rounded-xl p-5 col-span-1 md:col-span-2">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <Zap className="w-5 h-5 text-accent" />
                              <h4 className="text-sm font-bold text-white uppercase tracking-widest">Píxeis de Rastreio (Tracking)</h4>
                            </div>
                            <span className="text-sm font-bold text-white">
                              {effectiveAnalysis.pixelDetails.totalTracking || 0} detetados
                            </span>
                          </div>
                          <Separator className="mb-3 opacity-20" />
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {['facebook', 'ga4', 'gtm', 'hotjar'].map(pixel => (
                              <div key={pixel} className={`p-2.5 rounded-lg border text-center ${
                                effectiveAnalysis.pixelDetails[pixel] 
                                  ? 'bg-accent/5 border-accent/20 text-accent font-bold' 
                                  : 'bg-muted/10 border-border text-white/30'
                              }`}>
                                <p className="text-xs uppercase tracking-wider">{pixel === 'ga4' ? 'GA4' : pixel === 'gtm' ? 'GTM' : pixel}</p>
                                <p className="text-[10px] font-semibold mt-1">
                                  {effectiveAnalysis.pixelDetails[pixel] ? '✓ DETETADO' : '× INATIVO'}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    </div>
                  </>
                )}
              </TabsContent>

              {/* TAB: EMAIL */}
              <TabsContent value="email" className="space-y-4">
                <div className="bg-card border border-border rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-white">Email Personalizado</h3>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-sm text-muted-foreground">{privacyMode ? <span className="blur-md select-none">Preview:</span> : 'Preview:'}</Label>
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => {
                            setEditingHTML(!editingHTML)
                            if (!editingHTML) {
                              setEditedHTML(emailTemplate)
                            }
                          }} 
                          variant="outline" 
                          size="sm"
                          className="text-xs"
                        >
                          {editingHTML ? 'Ver Preview' : 'Editar HTML'}
                        </Button>
                        <Button 
                          onClick={copyToClipboard} 
                          variant="ghost" 
                          size="sm"
                          className="text-xs"
                        >
                          {copied ? (
                            <><Check className="w-3 h-3 mr-1" /> Copiado!</>
                          ) : (
                            <><Copy className="w-3 h-3 mr-1" /> Copiar HTML</>
                          )}
                        </Button>
                      </div>
                    </div>
                    {editingHTML ? (
                      <textarea
                        value={editedHTML}
                        onChange={(e) => setEditedHTML(e.target.value)}
                        className="w-full h-96 p-4 bg-muted/50 border border-border rounded-lg font-mono text-sm text-white resize-none focus:outline-none focus:ring-2 focus:ring-accent"
                        placeholder="Cole ou edite o HTML aqui..."
                      />
                    ) : (
                      <div className="bg-white rounded-lg border border-border overflow-hidden shadow-lg">
                        <iframe 
                          srcDoc={emailTemplate}
                          className="w-full h-96 border-0"
                          title="Email Preview"
                        />
                      </div>
                    )}
                  </div>
                  
                  <Separator className="my-6" />
                  
                  <div className="space-y-4">
                    <Label className="text-sm text-white">Enviar para:</Label>
                    
                    {availableEmails.length === 0 && (
                      <div className="bg-accent/5 border border-accent/20 rounded-lg p-4">
                        <p className="text-sm text-white font-medium mb-1">Nenhum email encontrado</p>
                        <p className="text-xs text-muted-foreground">Digite manualmente o email do cliente</p>
                      </div>
                    )}
                    
                    {availablePhones.length > 0 && (
                      <div className="bg-muted/50 border border-border rounded-lg p-4">
                        <p className="text-sm text-white font-medium mb-2 flex items-center gap-2">
                          Telefone(s) Encontrado(s)
                        </p>
                        {availablePhones.map((phone, i) => (
                          <a 
                            key={i}
                            href={`tel:${phone.replace(/\s/g, '')}`}
                            className="block p-2 bg-white/5 hover:bg-white/10 rounded transition-colors"
                          >
                            {privacyMode ? <span className="blur-md select-none">{phone}</span> : phone}
                          </a>
                        ))}
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      {availableEmails.map((email, i) => (
                        <label key={i} className="flex items-center justify-between gap-3 p-3 bg-muted/50 rounded-lg border border-border cursor-pointer hover:bg-muted transition-colors group">
                          <div className="flex items-center gap-3 flex-1">
                            <input 
                              type="radio" 
                              name="email" 
                              value={email} 
                              checked={selectedEmail === email && !customEmail}
                              onChange={(e) => { setSelectedEmail(e.target.value); setCustomEmail(''); setShowCustomInput(false); }}
                              className="accent-accent"
                            />
                            <span className="font-medium text-white">{privacyMode ? <span className="blur-md select-none">{email}</span> : email}</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.preventDefault();
                              navigator.clipboard.writeText(email);
                              const btn = e.currentTarget;
                              const originalText = btn.innerHTML;
                              btn.innerHTML = '<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg>';
                              setTimeout(() => btn.innerHTML = originalText, 1000);
                            }}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </label>
                      ))}
                      <label className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-accent/20 cursor-pointer hover:bg-accent/5 transition-colors">
                        <input 
                          type="radio" 
                          name="email" 
                          checked={showCustomInput || availableEmails.length === 0}
                          onChange={() => { setShowCustomInput(true); setSelectedEmail(''); }}
                          className="accent-accent"
                        />
                        <span className="text-white font-medium">Email Customizado</span>
                      </label>
                      {(showCustomInput || availableEmails.length === 0) && (
                        <Input 
                          type="email" 
                          value={customEmail} 
                          onChange={(e) => setCustomEmail(e.target.value)}
                          placeholder="exemplo@empresa.pt" 
                          className="mt-2"
                          autoFocus 
                        />
                      )}
                    </div>
                  </div>
                  
                  <Button 
                    onClick={handleSendEmail} 
                    disabled={emailSent || (!customEmail && !selectedEmail)}
                    className="w-full mt-6"
                    size="lg"
                  >
                    <Mail className="w-5 h-5 mr-2" />
                    {emailSent ? 'Email Enviado!' : 'Enviar Email'}
                  </Button>
                  
                  {emailSent && (
                    <div className="bg-accent/5 border border-accent/20 rounded-lg p-4 mt-4">
                      <p className="text-sm text-accent font-medium text-center">
                        Email enviado com sucesso para {customEmail || selectedEmail}
                      </p>
                    </div>
                  )}

                  {/* WHATSAPP */}
                  {availablePhones.length > 0 && (
                    <div className="mt-6 bg-green-500/5 border border-green-500/20 rounded-xl p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <MessageCircle className="w-5 h-5 text-green-400" />
                          <h4 className="text-sm font-bold text-white">WhatsApp</h4>
                          <span className="text-xs text-green-400/70">{privacyMode ? <span className="blur-md select-none">{availablePhones[0]}</span> : availablePhones[0]}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-green-400 hover:text-green-300"
                          onClick={() => setEditingWhatsApp(!editingWhatsApp)}
                        >
                          {editingWhatsApp ? 'Fechar' : 'Editar mensagem'}
                        </Button>
                      </div>

                      {editingWhatsApp ? (
                        <textarea
                          value={whatsappMessage}
                          onChange={(e) => setWhatsappMessage(e.target.value)}
                          className="w-full h-48 p-3 bg-black/30 border border-green-500/20 rounded-lg text-sm text-white resize-none focus:outline-none focus:ring-2 focus:ring-green-500/40 font-mono"
                        />
                      ) : (
                        <pre className="text-xs text-white/70 whitespace-pre-wrap bg-black/20 rounded-lg p-3 font-sans">{privacyMode ? <span className="blur-md select-none">{whatsappMessage}</span> : whatsappMessage}</pre>
                      )}

                      <Button
                        onClick={handleSendWhatsApp}
                        disabled={whatsappSent}
                        className="w-full mt-3 bg-green-600 hover:bg-green-500 text-white"
                        size="lg"
                      >
                        <MessageCircle className="w-5 h-5 mr-2" />
                        {whatsappSent ? 'WhatsApp Enviado!' : 'Enviar WhatsApp'}
                      </Button>
                    </div>
                  )}

                  {/* TRACKING INFO */}
                  {lead.sequenceStatus && (
                    <div className="mt-8 bg-blue-500/5 border border-blue-500/20 rounded-xl p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-lg bg-blue-500/10">
                          <Mail className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white uppercase tracking-wider">Tracking de Email</h4>
                          <p className="text-[10px] text-blue-400/60 uppercase font-black">Status: {lead.sequenceStatus.status}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                          <p className="text-[10px] font-bold text-white/20 uppercase mb-1">Aberturas</p>
                          <div className="flex items-center gap-2">
                            <Eye className="w-4 h-4 text-green-400" />
                            <span className="text-xl font-black text-white">{lead.sequenceStatus.open_count || 0}</span>
                          </div>
                        </div>
                        <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                          <p className="text-[10px] font-bold text-white/20 uppercase mb-1">Sequência</p>
                          <span className="text-sm font-black text-blue-400">
                            {lead.sequenceStatus.status === 'sent' ? 'Dia 1' : 
                             lead.sequenceStatus.status === 'followup1' ? 'Dia 3' : 
                             lead.sequenceStatus.status === 'followup2' ? 'Dia 7' : 'Concluída'}
                          </span>
                        </div>
                        <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                          <p className="text-[10px] font-bold text-white/20 uppercase mb-1">Última Vista</p>
                          <span className="text-[10px] font-bold text-white/60">
                            {lead.sequenceStatus.last_opened_at ? new Date(lead.sequenceStatus.last_opened_at).toLocaleDateString() : 'Nunca'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
          </ScrollArea>

          {/* Persistent Sidebar (Interactive 3D Blob & Sales Copy Skills) - Right Column 35% */}
          <div className="hidden md:flex w-[35%] h-full bg-[#0e0f14] border-l border-border flex-col overflow-y-auto">
            
            {/* 3D BLOB CARD */}
            <div className="p-6 border-b border-border bg-black/20">
              <h4 className="text-xs font-bold text-accent uppercase tracking-wider mb-3 flex items-center gap-2">
                <Brain className="w-4 h-4 text-accent animate-pulse" /> ADN Digital do Website (3D)
              </h4>
              <div className="h-[250px] bg-black/50 rounded-xl border border-border overflow-hidden relative shadow-inner group">
                {effectiveAnalysis && Object.keys(effectiveAnalysis).length > 0 ? (
                  <ClientBlob3D key={lead.id} analysis={effectiveAnalysis} leadData={lead} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-muted-foreground text-xs">A carregar visualização...</span>
                  </div>
                )}
                <div className="absolute bottom-2 left-2 right-2 bg-black/60 backdrop-blur-sm p-1.5 rounded-lg border border-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                  <p className="text-[10px] text-white/80 text-center">Rode e interaja com o rato para explorar</p>
                </div>
              </div>
            </div>

            {/* AI COPYWRITING SKILL PANEL */}
            <div className="p-6 border-b border-border bg-accent/5">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accent" /> Skill de Copywriter IA
              </h4>
              <p className="text-xs text-muted-foreground mb-4">
                Escolha o tom de voz do consultor e reescreva as mensagens de vendas com inteligência local:
              </p>
              
              <div className="space-y-3 mb-4">
                <label className="text-[11px] font-bold text-white/50 uppercase block">Estilo de Copy:</label>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    onClick={() => setCopywriterStyle('vadym_senior')}
                    className={`text-left p-2.5 rounded-lg border text-xs font-semibold transition-all flex flex-col gap-0.5 ${
                      copywriterStyle === 'vadym_senior'
                        ? 'bg-accent/20 border-accent text-white'
                        : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                    }`}
                  >
                    <span>Tom do Vadym (Sénior de Elite)</span>
                    <span className="text-[10px] text-muted-foreground font-normal">Persuasivo, focado em ROI e competidores locais.</span>
                  </button>

                  <button
                    onClick={() => setCopywriterStyle('technical')}
                    className={`text-left p-2.5 rounded-lg border text-xs font-semibold transition-all flex flex-col gap-0.5 ${
                      copywriterStyle === 'technical'
                        ? 'bg-accent/20 border-accent text-white'
                        : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                    }`}
                  >
                    <span>Auditor Técnico Especialista</span>
                    <span className="text-[10px] text-muted-foreground font-normal">Preciso, focado em erros de segurança e RGPD.</span>
                  </button>

                  <button
                    onClick={() => setCopywriterStyle('direct_response')}
                    className={`text-left p-2.5 rounded-lg border text-xs font-semibold transition-all flex flex-col gap-0.5 ${
                      copywriterStyle === 'direct_response'
                        ? 'bg-accent/20 border-accent text-white'
                        : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                    }`}
                  >
                    <span>Gatilhos de Conversão Rápida</span>
                    <span className="text-[10px] text-muted-foreground font-normal">Curto, directo, instigante para marcar reuniões.</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => handleGenerateAICopy('email')}
                  disabled={loadingCopy}
                  className="bg-accent hover:bg-accent/90 text-white text-xs font-bold py-2"
                >
                  {loadingCopy ? 'A gerar...' : 'Gerar E-mail'}
                </Button>
                <Button
                  onClick={() => handleGenerateAICopy('whatsapp')}
                  disabled={loadingCopy}
                  variant="outline"
                  className="border-white/10 text-white hover:bg-white/5 text-xs font-bold py-2"
                >
                  {loadingCopy ? 'A gerar...' : 'Gerar WhatsApp'}
                </Button>
              </div>
            </div>

            {/* CONVERSION ACCURACY & MACHINE LEARNING STATUS */}
            <div className="p-6 space-y-4">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Zap className="w-4 h-4 text-orange-400" /> Previsão de Fecho (Machine Learning)
              </h4>
              
              {loadingML ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <RefreshCw className="w-4 h-4 animate-spin text-accent" />
                  <span>A analisar propensão de fecho via Python ML...</span>
                </div>
              ) : mlPrediction ? (
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Probabilidade de Sucesso:</span>
                    <Badge className={`${
                      mlPrediction.propensity === 'HIGH' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                      mlPrediction.propensity === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                      'bg-red-500/20 text-red-400 border-red-500/30'
                    }`}>
                      {mlPrediction.probability}% ({mlPrediction.propensity})
                    </Badge>
                  </div>
                  <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${
                        mlPrediction.propensity === 'HIGH' ? 'bg-green-500' :
                        mlPrediction.propensity === 'MEDIUM' ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${mlPrediction.probability}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
                    O nosso modelo calculou esta probabilidade analisando concorrentes locais, rating de {lead.rating || 'N/A'} estrelas, e gaps do site.
                  </p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Algoritmo Python em modo de calibração automática.</p>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

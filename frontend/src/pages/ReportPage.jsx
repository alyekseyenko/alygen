import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { 
  Globe, 
  Activity, 
  Cpu, 
  Award, 
  Search, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Printer, 
  ArrowLeft,
  Loader2,
  Lock,
  Compass,
  MapPin,
  TrendingUp,
  FileText,
  Mail,
  Copy,
  Check,
  CheckCheck,
  Send,
  MessageCircle,
  Brain,
  Sparkles,
  Shield,
  ShieldAlert,
  Users,
  Zap,
  RefreshCw
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import QScoreDetailed from '../components/QScoreDetailed';
import QScoreAdvanced from '../components/QScoreAdvanced';
import ClientBlob3D from '../components/ClientBlob3D';
import { calculateQScore } from '../utils/qscore';

export default function ReportPage() {
  const { website } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [copied, setCopied] = useState(false);
  const [copiedWA, setCopiedWhatsApp] = useState(false);
  const [whatsappMessage, setWhatsappMessage] = useState('');

  useEffect(() => {
    async function fetchReport() {
      try {
        setLoading(true);
        const websiteEncoded = encodeURIComponent(website);
        const response = await axios.get(`http://localhost:3001/api/supabase/analysis/${websiteEncoded}`);
        if (response.data && response.data.success) {
          setAnalysis(response.data.data);
        } else {
          setError('Could not load the analysis for this website.');
        }
      } catch (err) {
        console.error('Error fetching analysis:', err);
        setError('An error occurred while loading the report.');
      } finally {
        setLoading(false);
      }
    }

    if (website) {
      fetchReport();
    }
  }, [website]);

  useEffect(() => {
    if (analysis) {
      const perf = analysis?.performanceMobile;
      const seo = analysis?.seo?.score;
      const hasPixel = analysis?.pixelDetails?.facebook || analysis?.pixelDetails?.ga4;
      const issues = [];
      if (perf !== undefined && perf < 50) issues.push(`• Mobile Performance: ${perf}/100`);
      if (seo !== undefined && seo < 50) issues.push(`• Weak SEO — low Google visibility`);
      if (!hasPixel) issues.push(`• No conversion pixel (Meta/GA4)`);
      
      const issuesText = issues.length > 0 ? `\n\nI found some technical issues:\n${issues.join('\n')}` : '';
      
      const city = analysis?.sheet_metadata?.city || (analysis?.sheet_metadata?.address ? analysis.sheet_metadata.address.split(',').reverse()[1]?.replace(/\d{4}-\d{3}/, '').trim() : '') || 'Braga';
      const competitorHook = city ? `\n\nAdditionally, I crossed these metrics with direct competitors in *${city}* and identified digital positioning gaps that your local rivals are already exploiting to capture customers.` : '';

      setWhatsappMessage(`Hello! I am from the Alygen team.\n\nI analyzed the website of *${analysis.company_name || website}*.${issuesText}${competitorHook}\n\nI sent you a complete action plan by email. Would you be interested in discussing how to outperform local competitors and improve these results?\n\nBest regards,\nAlygen Team`);
    }
  }, [analysis, website]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-white flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 text-[hsl(18,100%,52%)] animate-spin" />
        <p className="text-sm font-medium text-white/60 tracking-wider">A carregar auditoria de mercado inteligente...</p>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-white flex flex-col items-center justify-center gap-4">
        <AlertTriangle className="w-12 h-12 text-amber-500" />
        <h2 className="text-lg font-bold">Relatorio nao encontrado</h2>
        <p className="text-sm text-white/40 max-w-md text-center">
          Nao foi possivel localizar uma analise concluida para o dominio <span className="text-white font-mono">{website}</span>. Certifique-se de que correu a analise no painel principal primeiro.
        </p>
        <Link to="/" className="mt-4 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-semibold hover:bg-white/10 transition-all flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Voltar ao Painel
        </Link>
      </div>
    );
  }

  const leadData = analysis.lead_data || {};
  const qScore = analysis.qScore?.score || analysis.qScore || 70;
  const qGrade = analysis.qScore?.grade || 'B';
  const rating = leadData.rating ? parseFloat(leadData.rating) : 0;
  const reviews_count = leadData.reviews_count ? parseInt(leadData.reviews_count) : 0;
  const cwv = analysis.coreWebVitals || { lcp: 3500, inp: 150, cls: 0.05, ttfb: 400 };
  const aeo = analysis.aeo || { score: 0, factors: {}, status: 'Não analisado', recommendations: [] };
  const winRate = analysis.aiWinRate || analysis.ml_prediction?.conversion_probability || 75;
  const salesHook = analysis.salesHook || analysis.strategy?.salesHook || '';
  const agentIntel = analysis.agent_intel || analysis.agentIntel || '';

  const getCwvValue = (metric) => {
    if (!cwv || !cwv[metric]) return 0;
    const item = cwv[metric];
    if (typeof item === 'object' && item !== null) {
      return item.value !== undefined ? parseFloat(item.value) : 0;
    }
    return parseFloat(item) || 0;
  };

  const getCwvDisplay = (metric, fallbackUnit = '') => {
    if (!cwv || !cwv[metric]) return `0${fallbackUnit}`;
    const item = cwv[metric];
    if (typeof item === 'object' && item !== null) {
      if (item.displayValue) return item.displayValue;
      return `${item.value || 0}${fallbackUnit}`;
    }
    return `${item}${fallbackUnit}`;
  };

  const getCwvStatus = (metric) => {
    const value = getCwvValue(metric);
    if (metric === 'lcp') {
      const lcpVal = value > 100 ? value : value * 1000;
      return lcpVal < 2500 ? 'good' : lcpVal < 4000 ? 'warning' : 'critical';
    }
    if (metric === 'inp') return value < 200 ? 'good' : value < 500 ? 'warning' : 'critical';
    if (metric === 'cls') return value < 0.1 ? 'good' : value < 0.25 ? 'warning' : 'critical';
    if (metric === 'ttfb') return value < 800 ? 'good' : value < 1500 ? 'warning' : 'critical';
    return 'good';
  };

  const statusLabel = {
    good: 'Excelente',
    warning: 'Necessita Melhoria',
    critical: 'Critico'
  };

  const statusColor = {
    good: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    warning: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    critical: 'text-rose-400 bg-rose-500/10 border-rose-500/20'
  };

  const isNoWebsite = analysis?.category === 'SEM_SITE' || analysis?.isSocialMediaOnly;
  const computedQScore = isNoWebsite ? { score: 0, grade: 'N/A', category: 'No Website' } : (analysis?.qScore || calculateQScore(analysis));
  const qScoreAdvanced = analysis?.qScoreAdvanced || null;
  const emailTemplate = analysis?.emailTemplate?.html || '';

  return (
    <div className="min-h-screen bg-[#070913] text-white selection:bg-[hsl(18,100%,52%)] selection:text-white pb-20 print:bg-white print:text-black">
      
      {/* Printable Style Injector */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body { background: white !important; color: black !important; }
          .no-print { display: none !important; }
          .print-card { border: 1px solid #e2e8f0 !important; background: white !important; color: black !important; box-shadow: none !important; }
          .print-text-muted { color: #4a5568 !important; }
          .print-text-primary { color: #000000 !important; }
        }
      `}} />

      {/* Navigation Header */}
      <header className="no-print border-b border-white/[0.05] bg-[#070913]/80 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="p-2 hover:bg-white/5 rounded-xl transition-all text-white/60 hover:text-white">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="h-4 w-[1px] bg-white/10" />
          <div>
            <h1 className="text-xs font-black tracking-widest text-white/40 uppercase">Relatorio de Inteligencia Comercial</h1>
            <p className="text-sm font-semibold text-white">{analysis.company_name || website}</p>
          </div>
        </div>

        <button 
          onClick={() => window.print()}
          className="px-4 py-2 bg-[hsl(18,100%,52%)] hover:bg-[hsl(18,100%,58%)] text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-[hsl(18,100%,52%)]/20 flex items-center gap-2"
        >
          <Printer className="w-4 h-4" /> Imprimir Relatorio
        </button>
      </header>

      {/* Report Container */}
      <main className="max-w-6xl mx-auto px-6 pt-12 space-y-8">
        
        {/* Core Executive Overview Card */}
        <section className="print-card bg-white/[0.02] border border-white/[0.05] rounded-3xl p-8 flex flex-col lg:flex-row justify-between gap-8 items-stretch relative overflow-hidden">
          <div className="space-y-4 flex-1">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold text-white/60 tracking-wider uppercase">
                Auditoria de Presenca Digital
              </span>
              <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-[10px] font-bold text-amber-400 tracking-wider uppercase">
                Veredicto Estrategico
              </span>
            </div>

            <div>
              <h2 className="text-3xl font-black tracking-tight">{analysis.company_name || 'Empresa Analisada'}</h2>
              <a href={`https://${website}`} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-[hsl(18,100%,60%)] hover:underline inline-flex items-center gap-1.5 mt-1">
                <Globe className="w-4 h-4" /> {website}
              </a>
            </div>

            {salesHook && (
              <div className="border-l-2 border-[hsl(18,100%,52%)] pl-4 py-1">
                <h3 className="text-xs font-black tracking-widest text-white/40 uppercase mb-1">Hook Comercial Recomendado</h3>
                <p className="text-sm text-white/80 leading-relaxed print-text-primary italic">
                  "{salesHook}"
                </p>
              </div>
            )}

            {agentIntel && (
              <div className="border-l-2 border-orange-500 pl-4 py-1 mt-4">
                <h3 className="text-xs font-black tracking-widest text-white/40 uppercase mb-1">Veredicto e Inteligência de Mercado</h3>
                <p className="text-sm text-white/80 leading-relaxed print-text-primary">
                  {agentIntel}
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-row sm:flex-col lg:flex-col justify-center items-center gap-6 lg:border-l border-white/[0.05] lg:pl-8 min-w-[200px]">
            <div className="text-center">
              <div className="text-[10px] font-black tracking-widest text-white/40 uppercase mb-1">Q-Score Alygen</div>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-5xl font-black text-white tracking-tight">{qScore}</span>
                <span className="text-white/30 text-xs font-medium">/100</span>
              </div>
              <div className={`mt-2 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border inline-block ${
                qScore >= 80 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                qScore >= 50 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                'bg-rose-500/10 text-rose-400 border-rose-500/20'
              }`}>
                Grau {qGrade}
              </div>
            </div>

            <div className="w-[1px] h-12 sm:w-12 sm:h-[1px] lg:w-16 lg:h-[1px] bg-white/[0.05]" />

            <div className="text-center">
              <div className="text-[10px] font-black tracking-widest text-white/40 uppercase mb-1">AI Win Rate</div>
              <div className="text-3xl font-black text-[hsl(18,100%,52%)] tracking-tight">{winRate}%</div>
              <div className="text-[9px] font-bold text-white/30 uppercase tracking-widest mt-1">Calibracao Multivariavel</div>
            </div>
          </div>
        </section>

        {/* Unified Interactive Workspace Tabs */}
        <div className="pt-6">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="w-full max-w-2xl mx-auto grid grid-cols-4 mb-8 bg-white/[0.02] border border-white/[0.05] p-1 rounded-2xl">
              <TabsTrigger value="overview" className="rounded-xl py-2.5 font-bold uppercase tracking-wider text-xs">Visão Geral</TabsTrigger>
              <TabsTrigger value="technical" className="rounded-xl py-2.5 font-bold uppercase tracking-wider text-xs">Auditoria Técnica</TabsTrigger>
              <TabsTrigger value="adn3d" className="rounded-xl py-2.5 font-bold uppercase tracking-wider text-xs">ADN Digital (3D)</TabsTrigger>
              <TabsTrigger value="pitch" className="rounded-xl py-2.5 font-bold uppercase tracking-wider text-xs">Proposta & Pitch</TabsTrigger>
            </TabsList>

            {/* TAB: VISÃO GERAL */}
            <TabsContent value="overview" className="space-y-8 outline-none">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left Column: Core Web Vitals (2/3 width) */}
                <div className="lg:col-span-2 space-y-8">
                  <section className="print-card bg-white/[0.02] border border-white/[0.05] rounded-3xl p-6 space-y-6">
                    <div className="flex items-center justify-between border-b border-white/[0.05] pb-4">
                      <div className="flex items-center gap-2">
                        <Activity className="w-5 h-5 text-[hsl(18,100%,52%)]" />
                        <h3 className="font-black text-sm uppercase tracking-wider">Performance de Velocidade & Core Web Vitals (2026)</h3>
                      </div>
                      <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">W3C Standards</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      
                      {/* LCP */}
                      <div className="space-y-2 border border-white/[0.03] rounded-2xl p-4 bg-white/[0.01]">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-black text-white/50 tracking-wider">Largest Contentful Paint</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${statusColor[getCwvStatus('lcp')]}`}>
                            {statusLabel[getCwvStatus('lcp')]}
                          </span>
                        </div>
                        <div className="text-2xl font-black text-white">
                          {getCwvDisplay('lcp', 's')}
                        </div>
                        <p className="text-[10px] text-white/40 leading-relaxed print-text-muted">
                          Tempo necessario para renderizar o conteudo principal da pagina. O ideal e inferior a 2.5s.
                        </p>
                      </div>

                      {/* INP */}
                      <div className="space-y-2 border border-white/[0.03] rounded-2xl p-4 bg-white/[0.01]">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-black text-white/50 tracking-wider">Interaction to Next Paint</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${statusColor[getCwvStatus('inp')]}`}>
                            {statusLabel[getCwvStatus('inp')]}
                          </span>
                        </div>
                        <div className="text-2xl font-black text-white">
                          {getCwvDisplay('inp', 'ms')}
                        </div>
                        <p className="text-[10px] text-white/40 leading-relaxed print-text-muted">
                          Mede a latência de interacao do utilizador com os controlos da pagina. O ideal e inferior a 200ms.
                        </p>
                      </div>

                      {/* CLS */}
                      <div className="space-y-2 border border-white/[0.03] rounded-2xl p-4 bg-white/[0.01]">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-black text-white/50 tracking-wider">Cumulative Layout Shift</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${statusColor[getCwvStatus('cls')]}`}>
                            {statusLabel[getCwvStatus('cls')]}
                          </span>
                        </div>
                        <div className="text-2xl font-black text-white">
                          {getCwvDisplay('cls', '')}
                        </div>
                        <p className="text-[10px] text-white/40 leading-relaxed print-text-muted">
                          Estabilidade visual da pagina. Evita saltos bruscos de elements no ecra. O ideal e inferior a 0.1.
                        </p>
                      </div>

                      {/* TTFB */}
                      <div className="space-y-2 border border-white/[0.03] rounded-2xl p-4 bg-white/[0.01]">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-black text-white/50 tracking-wider">Time to First Byte</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${statusColor[getCwvStatus('ttfb')]}`}>
                            {statusLabel[getCwvStatus('ttfb')]}
                          </span>
                        </div>
                        <div className="text-2xl font-black text-white">
                          {getCwvDisplay('ttfb', 'ms')}
                        </div>
                        <p className="text-[10px] text-white/40 leading-relaxed print-text-muted">
                          Tempo de resposta do servidor de alojamento web. O ideal e inferior a 800ms.
                        </p>
                      </div>

                    </div>
                  </section>

                  {/* GEO Optimization Section */}
                  <section className="print-card bg-white/[0.02] border border-white/[0.05] rounded-3xl p-6 space-y-6">
                    <div className="flex items-center justify-between border-b border-white/[0.05] pb-4">
                      <div className="flex items-center gap-2">
                        <Cpu className="w-5 h-5 text-[hsl(18,100%,52%)]" />
                        <h3 className="font-black text-sm uppercase tracking-wider">GEO: Otimizacao para Motores de Resposta de IA</h3>
                      </div>
                      <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Generative Optimization</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/10">
                          <div className="flex items-center gap-2">
                            <Lock className="w-4 h-4 text-white/40" />
                            <span className="text-xs font-semibold text-white/80">Ficheiro llms.txt</span>
                          </div>
                          {aeo.factors?.hasLlmsTxt ? (
                            <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-emerald-500/10 text-emerald-400 border-emerald-500/20 uppercase">Detetado</span>
                          ) : (
                            <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-rose-500/10 text-rose-400 border-rose-500/20 uppercase">Em Falta</span>
                          )}
                        </div>

                        <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/10">
                          <div className="flex items-center gap-2">
                            <Compass className="w-4 h-4 text-white/40" />
                            <span className="text-xs font-semibold text-white/80">Acesso Crawlers de IA</span>
                          </div>
                          {aeo.factors?.aiBotsBlocked ? (
                            <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-rose-500/10 text-rose-400 border-rose-500/20 uppercase">Bloqueado</span>
                          ) : (
                            <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-emerald-500/10 text-emerald-400 border-emerald-500/20 uppercase">Livre</span>
                          )}
                        </div>

                        <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/10">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-white/40" />
                            <span className="text-xs font-semibold text-white/80">Schema.org JSON-LD</span>
                          </div>
                          {aeo.factors?.hasSchema ? (
                            <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-emerald-500/10 text-emerald-400 border-emerald-500/20 uppercase">Ativo</span>
                          ) : (
                            <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-amber-500/10 text-amber-400 border-amber-500/20 uppercase">Parcial</span>
                          )}
                        </div>
                      </div>

                      <div className="border border-white/[0.03] rounded-2xl p-4 bg-white/[0.01] flex flex-col justify-between">
                        <div className="space-y-1">
                          <span className="text-xs font-black text-white/50 tracking-wider block">Verificacao de Citabilidade Local</span>
                          <div className="text-lg font-bold text-white mt-1">
                            {aeo.factors?.searchRank || 'Nao listado'}
                          </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-white/[0.05]">
                          <div className="flex justify-between text-[10px] text-white/40 font-bold uppercase tracking-widest mb-1">
                            <span>Index de Citabilidade</span>
                            <span>{aeo.factors?.aiSearchVisibility || 0}%</span>
                          </div>
                          <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className="bg-[hsl(18,100%,52%)] h-full transition-all" 
                              style={{ width: `${aeo.factors?.aiSearchVisibility || 0}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>

                {/* Right Column: Local Map Presence (1/3 width) */}
                <div className="space-y-8">
                  <section className="print-card bg-white/[0.02] border border-white/[0.05] rounded-3xl p-6 flex flex-col justify-between h-full space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-white/[0.05] pb-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-5 h-5 text-[hsl(18,100%,52%)]" />
                          <h3 className="font-black text-sm uppercase tracking-wider">Presenca Local & Mapas</h3>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-1">
                          <div className="text-xs text-white/40 font-bold uppercase tracking-widest">Avaliacoes Google Maps</div>
                          <div className="text-3xl font-black text-white">
                            {rating > 0 ? `${rating.toFixed(1)} ★` : 'N/A'}
                          </div>
                          <div className="text-[10px] text-white/30 font-bold uppercase tracking-widest">
                            Com base em {reviews_count || 0} avaliacoes de utilizadores.
                          </div>
                        </div>

                        <div className="space-y-2 pt-2">
                          <div className="text-xs text-white/40 font-bold uppercase tracking-widest">Entidades Detetadas</div>
                          <div className="flex flex-wrap gap-1.5">
                            {aeo.factors?.schemaTypes && aeo.factors.schemaTypes.length > 0 ? (
                              aeo.factors.schemaTypes.map((t, idx) => (
                                <span key={idx} className="text-[9px] px-2.5 py-0.5 rounded-full font-black bg-white/5 border border-white/10 text-white/70 uppercase">
                                  {t}
                                </span>
                              ))
                            ) : (
                              <span className="text-[9px] px-2.5 py-0.5 rounded-full font-black bg-white/5 border border-white/10 text-white/40 uppercase">
                                Nenhum Schema Estruturado
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-white/[0.05] space-y-2">
                      <div className="flex items-center gap-2 text-white/60">
                        <TrendingUp className="w-4 h-4 text-[hsl(18,100%,52%)]" />
                        <span className="text-xs font-semibold">Posicionamento Regional</span>
                      </div>
                      <p className="text-[10px] text-white/40 leading-relaxed print-text-muted">
                        A presença de concorrentes diretos no setor local exige otimização técnica imediata para proteger a quota de mercado regional de inteligência artificial.
                      </p>
                    </div>
                  </section>
                </div>
              </div>

              {/* Real-time Google Business Profile & Google Sheets Metadata Panel */}
              {analysis?.sheet_metadata && (
                <section className="print-card bg-white/[0.02] border border-white/[0.05] rounded-3xl p-8 space-y-6">
                  <div className="flex items-center gap-2 border-b border-white/[0.05] pb-4">
                    <Sparkles className="w-5 h-5 text-[hsl(18,100%,52%)]" />
                    <h3 className="font-black text-sm uppercase tracking-wider">Perfil Local Google Business & Dados de Mercado</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                    
                    {/* Column 1: Info Geral */}
                    <div className="space-y-4 border-r border-white/[0.03] pr-6">
                      <div className="space-y-1">
                        <span className="text-white/40 font-bold uppercase tracking-widest text-[9px]">Setor / Categorias</span>
                        <p className="text-white font-semibold text-sm">{analysis.sheet_metadata.type || 'N/A'}</p>
                        {analysis.sheet_metadata.types && (
                          <p className="text-[10px] text-white/50">{analysis.sheet_metadata.types}</p>
                        )}
                      </div>
                      
                      <div className="space-y-1">
                        <span className="text-white/40 font-bold uppercase tracking-widest text-[9px]">Estado de Propriedade</span>
                        <p className="text-white font-semibold">
                          {analysis.sheet_metadata.unclaimed_listing === 'true' ? (
                            <span className="text-rose-400 font-bold">⚠️ Perfil não Reivindicado</span>
                          ) : (
                            <span className="text-emerald-400 font-bold">✓ Reivindicado / Verificado</span>
                          )}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-white/40 font-bold uppercase tracking-widest text-[9px]">Gama de Preços</span>
                        <p className="text-white font-semibold">{analysis.sheet_metadata.price || 'N/A'}</p>
                      </div>
                    </div>

                    {/* Column 2: Atendimento & Horários */}
                    <div className="space-y-4 border-r border-white/[0.03] pr-6">
                      {analysis.sheet_metadata.operating_hours && (
                        <div className="space-y-1">
                          <span className="text-white/40 font-bold uppercase tracking-widest text-[9px]">Horario de Funcionamento</span>
                          <p className="text-white/80 leading-relaxed text-[11px] font-mono whitespace-pre-line">{analysis.sheet_metadata.operating_hours}</p>
                        </div>
                      )}
                      
                      {analysis.sheet_metadata.service_options && (
                        <div className="space-y-1">
                          <span className="text-white/40 font-bold uppercase tracking-widest text-[9px]">Opcoes de Servico</span>
                          <p className="text-white/70 leading-relaxed text-[11px]">{analysis.sheet_metadata.service_options}</p>
                        </div>
                      )}
                    </div>

                    {/* Column 3: Links de Reputação & Coordenadas */}
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <span className="text-white/40 font-bold uppercase tracking-widest text-[9px]">Localizacao & GPS</span>
                        <p className="text-white/80 leading-relaxed text-[11px]">{analysis.sheet_metadata.address || 'N/A'}</p>
                        {analysis.sheet_metadata.gps_coordinates && (
                          <p className="text-[10px] text-white/30 font-mono">{analysis.sheet_metadata.gps_coordinates}</p>
                        )}
                      </div>

                      <div className="pt-2 flex flex-col gap-2">
                        {analysis.sheet_metadata.reviews_link && (
                          <a 
                            href={analysis.sheet_metadata.reviews_link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl font-bold uppercase tracking-wider text-[10px] transition-all text-center text-white flex items-center justify-center gap-1.5"
                          >
                            <Search className="w-3 h-3" /> Ver Reviews no Google
                          </a>
                        )}
                        {analysis.sheet_metadata.photos_link && (
                          <a 
                            href={analysis.sheet_metadata.photos_link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl font-bold uppercase tracking-wider text-[10px] transition-all text-center text-white flex items-center justify-center gap-1.5"
                          >
                            <Printer className="w-3 h-3" /> Ver Fotografias Google Maps
                          </a>
                        )}
                      </div>
                    </div>

                  </div>

                  {analysis.sheet_metadata.description && (
                    <div className="pt-4 border-t border-white/[0.03] space-y-1">
                      <span className="text-white/40 font-bold uppercase tracking-widest text-[9px]">Descricao Google Business</span>
                      <p className="text-white/80 leading-relaxed text-[11px]">{analysis.sheet_metadata.description}</p>
                    </div>
                  )}
                </section>
              )}

              {/* Detailed Recommendations List */}
              {aeo.recommendations && aeo.recommendations.length > 0 && (
                <section className="print-card bg-white/[0.02] border border-white/[0.05] rounded-3xl p-8 space-y-6">
                  <div className="flex items-center gap-2 border-b border-white/[0.05] pb-4">
                    <Award className="w-5 h-5 text-[hsl(18,100%,52%)]" />
                    <h3 className="font-black text-sm uppercase tracking-wider">Ações Recomendadas para Crescimento Comercial</h3>
                  </div>

                  <ul className="space-y-3">
                    {aeo.recommendations.map((rec, index) => {
                      const isCritical = rec.includes('CRÍTICO') || rec.includes('🚨');
                      const cleanRec = rec.replace('🚨', '').replace('💡', '').replace('🔍', '').trim();
                      return (
                        <li 
                          key={index} 
                          className={`p-4 rounded-2xl border text-xs font-medium leading-relaxed flex items-start gap-3 ${
                            isCritical 
                              ? 'bg-rose-500/5 border-rose-500/10 text-rose-200' 
                              : 'bg-white/5 border-white/10 text-white/80'
                          }`}
                        >
                          {isCritical ? (
                            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                          ) : (
                            <CheckCircle className="w-4 h-4 text-[hsl(18,100%,52%)] shrink-0 mt-0.5" />
                          )}
                          <span>{cleanRec}</span>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              )}
            </TabsContent>

            {/* TAB: AUDITORIA TÉCNICA COMPLETA & Q-SCORE */}
            <TabsContent value="technical" className="space-y-6 outline-none">
              <div className="space-y-6">
                {qScoreAdvanced && (
                  <QScoreAdvanced qScore={qScoreAdvanced} />
                )}
                {computedQScore && (
                  <QScoreDetailed qScore={computedQScore} />
                )}

                {/* Sub-Technical Breakdown Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* SEGURANÇA */}
                  {analysis?.security && (
                    <div className="bg-white/[0.01] border border-white/[0.05] rounded-3xl p-6">
                      <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/5">
                        <div className="flex items-center gap-2">
                          <Shield className="w-5 h-5 text-[hsl(18,100%,52%)]" />
                          <h4 className="text-xs font-black uppercase tracking-wider">Segurança & SSL</h4>
                        </div>
                        <span className="text-xl font-black text-white">{analysis.security.score}/100</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center p-3.5 bg-black/20 rounded-xl border border-white/5">
                          <span className="text-white/70 text-xs font-bold">Ligação Segura (SSL/HTTPS)</span>
                          <span className={analysis.security.hasSSL ? 'text-emerald-400 text-xs font-black' : 'text-rose-400 text-xs font-black'}>
                            {analysis.security.hasSSL ? '✓ ATIVO' : '× INATIVO'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3.5 bg-black/20 rounded-xl border border-white/5">
                          <span className="text-white/70 text-xs font-bold">Cabeçalhos HTTP CSP / HSTS</span>
                          <span className={analysis.security.hasCSP || analysis.security.hasHSTS ? 'text-emerald-400 text-xs font-black' : 'text-rose-400 text-xs font-black'}>
                            {analysis.security.hasCSP || analysis.security.hasHSTS ? '✓ CONFIGURADO' : '× AUSENTE'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* RGPD & COOKIES */}
                  {analysis?.gdpr && (
                    <div className="bg-white/[0.01] border border-white/[0.05] rounded-3xl p-6">
                      <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/5">
                        <div className="flex items-center gap-2">
                          <ShieldAlert className="w-5 h-5 text-[hsl(18,100%,52%)]" />
                          <h4 className="text-xs font-black uppercase tracking-wider">RGPD & Cookies</h4>
                        </div>
                        <span className="text-xl font-black text-white">{analysis.gdpr.score || 0}/100</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex justify-between items-center p-3 bg-black/20 rounded-xl border border-white/5">
                          <span className="text-white/70 text-[11px] font-bold">Privacidade</span>
                          <span className={analysis.gdpr.hasPrivacyPolicy ? 'text-emerald-400 text-xs font-black' : 'text-rose-400 text-xs font-black'}>
                            {analysis.gdpr.hasPrivacyPolicy ? '✓ SIM' : '× NÃO'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-black/20 rounded-xl border border-white/5">
                          <span className="text-white/70 text-[11px] font-bold">Cookies</span>
                          <span className={analysis.gdpr.hasCookiePolicy ? 'text-emerald-400 text-xs font-black' : 'text-rose-400 text-xs font-black'}>
                            {analysis.gdpr.hasCookiePolicy ? '✓ SIM' : '× NÃO'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-black/20 rounded-xl border border-white/5 col-span-2">
                          <span className="text-white/70 text-[11px] font-bold">Banner de Consentimento</span>
                          <span className={analysis.gdpr.hasConsentBanner ? 'text-emerald-400 text-xs font-black' : 'text-rose-400 text-xs font-black'}>
                            {analysis.gdpr.hasConsentBanner ? '✓ SIM (CONFORME)' : '× AUSENTE'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ACESSIBILIDADE */}
                  {analysis?.accessibility && (
                    <div className="bg-white/[0.01] border border-white/[0.05] rounded-3xl p-6">
                      <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/5">
                        <div className="flex items-center gap-2">
                          <Users className="w-5 h-5 text-[hsl(18,100%,52%)]" />
                          <h4 className="text-xs font-black uppercase tracking-wider">Acessibilidade WCAG</h4>
                        </div>
                        <span className="text-xl font-black text-white">{analysis.accessibility.score}/100</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-black/20 p-3.5 rounded-xl border border-white/5 text-center">
                          <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Erros Críticos</p>
                          <p className="text-xl font-black text-rose-400">{analysis.accessibility.errors || 0}</p>
                        </div>
                        <div className="bg-black/20 p-3.5 rounded-xl border border-white/5 text-center">
                          <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Avisos Leves</p>
                          <p className="text-xl font-black text-amber-400">{analysis.accessibility.warnings || 0}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* PIXEIS DE RASTREIO */}
                  {analysis?.pixelDetails && (
                    <div className="bg-white/[0.01] border border-white/[0.05] rounded-3xl p-6">
                      <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/5">
                        <div className="flex items-center gap-2">
                          <Zap className="w-5 h-5 text-[hsl(18,100%,52%)]" />
                          <h4 className="text-xs font-black uppercase tracking-wider">Pixeis de Rastreio (Tracking)</h4>
                        </div>
                        <span className="text-xs font-black text-emerald-400">{analysis.pixelDetails.totalTracking || 0} Detetados</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {['facebook', 'ga4', 'gtm', 'hotjar'].map(pixel => (
                          <div key={pixel} className={`p-3 rounded-xl border text-center ${
                            analysis.pixelDetails[pixel] 
                              ? 'bg-[hsl(18,100%,52%)]/5 border-[hsl(18,100%,52%)]/20 text-[hsl(18,100%,52%)] font-black' 
                              : 'bg-white/[0.01] border-white/5 text-white/30'
                          }`}>
                            <p className="text-[10px] uppercase tracking-wider">{pixel}</p>
                            <p className="text-[9px] font-black mt-1">
                              {analysis.pixelDetails[pixel] ? '✓ DETETADO' : '× INATIVO'}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </TabsContent>

            {/* TAB: ADN DIGITAL (3D BLOB) */}
            <TabsContent value="adn3d" className="space-y-6 outline-none">
              <div className="bg-white/[0.01] border border-white/[0.05] rounded-3xl p-8 space-y-4">
                <div className="flex items-center gap-2 border-b border-white/[0.05] pb-4">
                  <Brain className="w-5 h-5 text-[hsl(18,100%,52%)] animate-pulse" />
                  <h3 className="font-black text-sm uppercase tracking-wider">Representação 3D do ADN Digital</h3>
                </div>
                <p className="text-xs text-white/60 max-w-2xl leading-relaxed">
                  Esta molécula 3D é gerada em tempo real alimentada pelas notas de velocidade, SEO, segurança e acessibilidade. Interaja arrastando o rato para explorar o ADN técnico da marca.
                </p>
                
                <div className="h-[450px] bg-black/40 rounded-2xl border border-white/5 overflow-hidden relative shadow-inner">
                  {analysis && (
                    <ClientBlob3D key={analysis.id} analysis={analysis} leadData={{ name: analysis.company_name || website, website }} />
                  )}
                </div>
              </div>
            </TabsContent>

            {/* TAB: PROPOSTA & PITCH */}
            <TabsContent value="pitch" className="space-y-6 outline-none">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Email Template Preview (2/3 width) */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="bg-white/[0.01] border border-white/[0.05] rounded-3xl p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-white/[0.05] pb-4">
                      <div className="flex items-center gap-2">
                        <Mail className="w-5 h-5 text-[hsl(18,100%,52%)]" />
                        <h3 className="font-black text-sm uppercase tracking-wider">E-mail de Abordagem de Elite</h3>
                      </div>
                      <Button 
                        onClick={() => {
                          navigator.clipboard.writeText(emailTemplate);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                          toast.success('Código HTML copiado!');
                        }} 
                        variant="outline" 
                        size="sm"
                        className="text-xs border-white/10 hover:bg-white/5 text-white"
                      >
                        {copied ? (
                          <><Check className="w-3.5 h-3.5 mr-1 text-emerald-400" /> Copiado</>
                        ) : (
                          <><Copy className="w-3.5 h-3.5 mr-1" /> Copiar Código HTML</>
                        )}
                      </Button>
                    </div>

                    <div className="bg-white rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
                      <iframe 
                        srcDoc={emailTemplate}
                        className="w-full h-[500px] border-0"
                        title="Email Preview"
                      />
                    </div>
                  </div>
                </div>

                {/* WhatsApp Pitch (1/3 width) */}
                <div className="space-y-6">
                  <div className="bg-white/[0.01] border border-white/[0.05] rounded-3xl p-6 space-y-4">
                    <div className="flex items-center gap-2 border-b border-white/[0.05] pb-4">
                      <MessageCircle className="w-5 h-5 text-[hsl(18,100%,52%)]" />
                      <h3 className="font-black text-sm uppercase tracking-wider">Mensagem WhatsApp Rápida</h3>
                    </div>
                    
                    <p className="text-[11px] text-white/50 leading-relaxed">
                      Pode ser usada para abrir contacto inicial direto com o tomador de decisão da empresa.
                    </p>

                    <div className="p-4 bg-black/30 rounded-2xl border border-white/5 font-medium text-xs text-white/80 leading-relaxed whitespace-pre-wrap select-text">
                      {whatsappMessage}
                    </div>

                    <Button 
                      onClick={() => {
                        navigator.clipboard.writeText(whatsappMessage);
                        setCopiedWhatsApp(true);
                        setTimeout(() => setCopiedWhatsApp(false), 2000);
                        toast.success('Mensagem copiada!');
                      }} 
                      className="w-full bg-[hsl(18,100%,52%)] hover:bg-[hsl(18,100%,58%)] text-white text-xs font-black uppercase tracking-wider h-10 rounded-xl transition-all"
                    >
                      {copiedWA ? (
                        <><Check className="w-4 h-4 mr-1.5" /> Copiado!</>
                      ) : (
                        <><Copy className="w-4 h-4 mr-1.5" /> Copiar Mensagem</>
                      )}
                    </Button>
                  </div>
                </div>

              </div>
            </TabsContent>
          </Tabs>
        </div>

      </main>
    </div>
  );
}

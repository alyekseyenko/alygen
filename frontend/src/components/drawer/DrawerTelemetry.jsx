import React from 'react'
import { RefreshCw, Brain, Sparkles, Search, Shield, ShieldAlert, Users, Zap } from 'lucide-react'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Separator } from '../ui/separator'

export default function DrawerTelemetry({
  isNoWebsite,
  mlPrediction,
  loadingML,
  agentIntel,
  loadingIntel,
  handleGenerateIntel,
  effectiveAnalysis
}) {
  if (isNoWebsite) {
    return (
      <div className="bg-card border border-border rounded-lg p-6 text-center">
        <h3 className="text-xl font-bold text-white mb-2">No Active Website</h3>
        <p className="text-muted-foreground text-sm">Technical audits require an active domain.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 🧠 TOP GRID: ML CONVERSION & INTELLIGENCE */}
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
                <h3 className="text-sm font-bold text-white uppercase tracking-widest">Predictive Conversion</h3>
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
                <span className="text-xs">Calculating closing probability...</span>
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
                  <span className="text-xs text-white/40 mb-2 leading-tight">closing<br/>probability</span>
                </div>
                <p className="text-xs text-white/80 leading-relaxed mb-3">{mlPrediction.recommendation}</p>
                <div className="pt-2 border-t border-white/5 flex justify-between items-center text-[9px] text-white/30 uppercase tracking-wider">
                  <span>GradientBoosting ML Engine</span>
                  <span>Confidence: {mlPrediction.confidence}</span>
                </div>
              </>
            ) : null}
          </div>
        )}

        {/* Local Market Intelligence (DuckDuckGo + Llama AI) */}
        <div className="bg-gradient-to-br from-orange-500/10 via-background to-background border border-orange-500/25 rounded-xl p-5 shadow-lg">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="w-5 h-5 text-orange-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-widest">Market Intelligence</h3>
            {agentIntel && <Badge className="ml-auto bg-green-500/20 text-green-400 border-none text-[9px] py-0 px-2 uppercase font-black">Active</Badge>}
          </div>

          {agentIntel ? (
            <div className="space-y-3">
              <p className="text-xs text-orange-100/90 leading-relaxed italic font-medium">"{agentIntel}"</p>
              <p className="text-[9px] text-orange-400/40 uppercase tracking-wider">✦ Alygen Multi-Agent Core v2.0</p>
            </div>
          ) : (
            <div className="text-center py-4">
              <Sparkles className="w-6 h-6 text-orange-400/30 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground mb-3">Discover real local competitors and generate the elite pitch.</p>
              <Button
                className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs h-8 px-4"
                onClick={handleGenerateIntel}
                disabled={loadingIntel}
              >
                {loadingIntel ? <><RefreshCw className="w-3 h-3 mr-2 animate-spin" /> Analyzing competitors...</> : <><Brain className="w-3 h-3 mr-2" /> Activate Intelligence</>}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* 📊 REAL AUDITS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* SEO REAL CARD */}
        {effectiveAnalysis?.seo && (
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Search className="w-5 h-5 text-accent" />
                <h4 className="text-sm font-bold text-white uppercase tracking-widest">SEO Optimization</h4>
              </div>
              <span className="text-xl font-black text-white">{effectiveAnalysis.seo.score}/100</span>
            </div>
            <Separator className="mb-3 opacity-20" />
            <div className="grid grid-cols-2 gap-2">
              {['title', 'description', 'hasSitemap', 'hasRobotsTxt', 'hasSchema'].map(key => (
                <div key={key} className="flex justify-between items-center px-3 py-1.5 bg-muted/30 rounded-lg">
                  <span className="text-white text-[11px] capitalize">{key.replace('has', '')}</span>
                  <span className={effectiveAnalysis.seo[key] || effectiveAnalysis.seo[key]?.optimal ? 'text-green-400 text-xs font-bold' : 'text-red-400 text-xs font-bold'}>
                    {effectiveAnalysis.seo[key] || effectiveAnalysis.seo[key]?.optimal ? '✓ YES' : '× NO'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECURITY CARD */}
        {effectiveAnalysis?.security && (
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-accent" />
                <h4 className="text-sm font-bold text-white uppercase tracking-widest">Security & SSL</h4>
              </div>
              <span className="text-xl font-black text-white">{effectiveAnalysis.security.score}/100</span>
            </div>
            <Separator className="mb-3 opacity-20" />
            <div className="space-y-2">
              <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                <span className="text-white text-xs">Secure Connection (SSL/HTTPS)</span>
                <span className={effectiveAnalysis.security.hasSSL ? 'text-green-400 text-xs font-bold' : 'text-red-400 text-xs font-bold'}>
                  {effectiveAnalysis.security.hasSSL ? '✓ ACTIVE' : '× INACTIVE'}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                <span className="text-white text-xs">HTTP Headers CSP / HSTS</span>
                <span className={effectiveAnalysis.security.hasCSP || effectiveAnalysis.security.hasHSTS ? 'text-green-400 text-xs font-bold' : 'text-red-400 text-xs font-bold'}>
                  {effectiveAnalysis.security.hasCSP || effectiveAnalysis.security.hasHSTS ? '✓ CONFIGURED' : '× MISSING'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* GDPR & COOKIES CARD */}
        {effectiveAnalysis?.gdpr && (
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-accent" />
                <h4 className="text-sm font-bold text-white uppercase tracking-widest">GDPR & Cookies</h4>
              </div>
              <span className="text-xl font-black text-white">{effectiveAnalysis.gdpr.score || 0}/100</span>
            </div>
            <Separator className="mb-3 opacity-20" />
            <div className="grid grid-cols-2 gap-2">
              <div className="flex justify-between items-center px-3 py-1.5 bg-muted/30 rounded-lg">
                <span className="text-white text-[11px]">Privacy Policy</span>
                <span className={effectiveAnalysis.gdpr.hasPrivacyPolicy ? 'text-green-400 text-xs font-bold' : 'text-red-400 text-xs font-bold'}>
                  {effectiveAnalysis.gdpr.hasPrivacyPolicy ? '✓ DETECTED' : '× N/A'}
                </span>
              </div>
              <div className="flex justify-between items-center px-3 py-1.5 bg-muted/30 rounded-lg">
                <span className="text-white text-[11px]">Cookie Policy</span>
                <span className={effectiveAnalysis.gdpr.hasCookiePolicy ? 'text-green-400 text-xs font-bold' : 'text-red-400 text-xs font-bold'}>
                  {effectiveAnalysis.gdpr.hasCookiePolicy ? '✓ DETECTED' : '× N/A'}
                </span>
              </div>
              <div className="flex justify-between items-center px-3 py-1.5 bg-muted/30 rounded-lg col-span-2">
                <span className="text-white text-[11px]">Active Consent Banner</span>
                <span className={effectiveAnalysis.gdpr.hasConsentBanner ? 'text-green-400 text-xs font-bold' : 'text-red-400 text-xs font-bold'}>
                  {effectiveAnalysis.gdpr.hasConsentBanner ? '✓ YES (COMPLIANT)' : '× MISSING (RISK)'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ACCESSIBILITY CARD */}
        {effectiveAnalysis?.accessibility && (
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-accent" />
                <h4 className="text-sm font-bold text-white uppercase tracking-widest">Accessibility</h4>
              </div>
              <span className="text-xl font-black text-white">{effectiveAnalysis.accessibility.score}/100</span>
            </div>
            <Separator className="mb-3 opacity-20" />
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/30 p-3 rounded-lg text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Critical Errors</p>
                <p className="text-xl font-black text-red-400">{effectiveAnalysis.accessibility.errors || 0}</p>
              </div>
              <div className="bg-muted/30 p-3 rounded-lg text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Minor Warnings</p>
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
                <h4 className="text-sm font-bold text-white uppercase tracking-widest">Tracking Pixels</h4>
              </div>
              <span className="text-sm font-bold text-white">
                {effectiveAnalysis.pixelDetails.totalTracking || 0} detected
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
                    {effectiveAnalysis.pixelDetails[pixel] ? '✓ DETECTED' : '× INACTIVE'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

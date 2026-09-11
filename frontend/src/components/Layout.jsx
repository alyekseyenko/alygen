import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Users, BarChart3, Mail, Zap, Globe, Search, FileText, Calendar, LayoutGrid, CheckCheck,
  ChevronLeft, ChevronRight, Menu, Eye, ShieldCheck, Sparkles, Bell
} from 'lucide-react'
import NotificationBell from './NotificationBell'

export default function Layout({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  
  // Collapse sidebar on smaller screens by default, expand on desktop
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [privacyMode, setPrivacyMode] = useState(false)

  // Auto-collapse sidebar based on screen size on mount
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1280) {
        setCollapsed(true)
      } else {
        setCollapsed(false)
      }
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Sync privacy mode with document-level class or localStorage if needed
  useEffect(() => {
    const root = document.documentElement;
    if (privacyMode) {
      root.classList.add('privacy-mode');
    } else {
      root.classList.remove('privacy-mode');
    }
  }, [privacyMode])

  const menuSections = [
    {
      title: 'Sales & Pipeline',
      items: [
        { label: 'Leads Suite', icon: Users, path: '/' },
        { label: 'Sales Funnel', icon: LayoutGrid, path: '/funil' },
        { label: 'Client Map', icon: Globe, path: '/mapa' }
      ]
    },
    {
      title: 'Communication & AI',
      items: [
        { label: 'Follow-ups', icon: Mail, path: '/followups' },
        { label: 'Email Templates', icon: FileText, path: '/templates' },
        { label: 'Schedule & Meetings', icon: Calendar, path: '/agenda' }
      ]
    },
    {
      title: 'Intelligence & Engine',
      items: [
        { label: 'Analytics Dashboard', icon: BarChart3, path: '/dashboard' },
        { label: 'Visual Automator', icon: Zap, path: '/automation' },
        { label: 'Crawler Tester', icon: Search, path: '/tester' }
      ]
    },
    {
      title: 'Diagnostics',
      items: [
        { label: 'Tests & UI', icon: CheckCheck, path: '/tests' }
      ]
    }
  ]

  const allItems = menuSections.flatMap(s => s.items)
  const activeItem = allItems.find(item => {
    if (item.path === '/') return location.pathname === '/'
    return location.pathname.startsWith(item.path)
  }) || allItems[0]

  const handleNavigate = (path) => {
    navigate(path)
    setMobileOpen(false)
  }

  return (
    <div className="min-h-screen bg-[#0c0c0e] text-white flex font-sans antialiased">
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,107,43,0.03),transparent_40%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(124,58,237,0.02),transparent_50%)] pointer-events-none" />

      {/* MOBILE HEADER */}
      <div className="xl:hidden fixed top-0 left-0 right-0 h-16 bg-[#0c0c0e]/80 backdrop-blur-md border-b border-white/[0.06] px-4 flex items-center justify-between z-40">
        <div className="flex items-center gap-2" onClick={() => handleNavigate('/')}>
          <img src="/logo/alygen-logo.png" alt="Alygen" className="w-8 h-8 object-contain" />
          <span className="font-black text-sm tracking-tight">ALYGEN<span className="text-[hsl(18,100%,52%)]">.</span>CRM</span>
        </div>
        
        <div className="flex items-center gap-2">
          <button onClick={() => setPrivacyMode(!privacyMode)}
            className={`p-2 rounded-lg transition-all ${privacyMode ? 'text-[hsl(18,100%,52%)] bg-[hsl(18,100%,52%)/0.1]' : 'text-white/40'}`}>
            <Eye className="w-4 h-4" />
          </button>
          <NotificationBell />
          <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 text-white/80 hover:text-white bg-white/5 rounded-lg">
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* DESKTOP SIDEBAR NAVIGATION */}
      <aside className={`hidden xl:flex flex-col border-r border-white/[0.06] bg-[#0d0d10] transition-all duration-300 relative z-30 shrink-0 ${collapsed ? 'w-20' : 'w-64'}`}>
        {/* Toggle Button */}
        <button onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 bg-[#0d0d10] border border-white/[0.08] hover:border-white/20 text-white/60 hover:text-white rounded-full p-1 transition-all">
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>

        {/* Brand / Logo */}
        <div className={`p-6 flex items-center gap-3 border-b border-white/[0.04] cursor-pointer`} onClick={() => handleNavigate('/')}>
          <img src="/logo/alygen-logo.png" alt="Alygen" className="w-9 h-9 object-contain shrink-0 animate-pulse" />
          {!collapsed && (
            <div className="transition-opacity duration-200">
              <h1 className="text-base font-black tracking-tight leading-none text-white">ALYGEN<span className="text-[hsl(18,100%,52%)]">.</span>CRM</h1>
              <p className="text-[8px] text-white/30 font-bold uppercase tracking-[0.2em] mt-1.5">Intelligence Suite</p>
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-6 scrollbar-thin">
          {menuSections.map((section, idx) => (
            <div key={idx} className="space-y-1.5">
              {!collapsed && (
                <p className="text-[10px] text-white/20 font-black uppercase tracking-widest px-3 mb-2">{section.title}</p>
              )}
              {section.items.map((item) => {
                const isActive = item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path);
                const Icon = item.icon
                return (
                  <button key={item.path} onClick={() => handleNavigate(item.path)}
                    title={collapsed ? item.label : undefined}
                    className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-lg text-sm transition-all duration-200 group relative ${
                      isActive 
                        ? 'bg-[hsl(18,100%,52%)/0.08] text-[hsl(18,100%,62%)] font-semibold border border-[hsl(18,100%,52%)/0.25]' 
                        : 'text-white/50 hover:bg-white/[0.04] hover:text-white border border-transparent'
                    }`}>
                    <Icon className={`w-4 h-4 shrink-0 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-[hsl(18,100%,52%)]' : 'text-white/40 group-hover:text-white'}`} />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                    {isActive && (
                      <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-[hsl(18,100%,52%)] shadow-[0_0_8px_hsl(18,100%,52%)]" />
                    )}
                  </button>
                )
              })}
            </div>
          ))}
        </nav>

        {/* Sidebar Footer Details */}
        <div className="p-4 border-t border-white/[0.04] bg-[#09090b]/40">
          <div className="flex items-center justify-between gap-2">
            {!collapsed && (
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">Local DB Active</span>
              </div>
            )}
            <button onClick={() => setPrivacyMode(!privacyMode)}
              title={privacyMode ? "Desativar modo privado" : "Ativar modo privado"}
              className={`p-2 rounded-lg border transition-all shrink-0 ${privacyMode ? 'bg-[hsl(18,100%,52%)/0.1] border-[hsl(18,100%,52%)/0.3] text-[hsl(18,100%,62%)]' : 'bg-white/5 border-transparent text-white/30 hover:text-white'}`}>
              <Eye className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* MOBILE NAVIGATION OVERLAY (DRAWER) */}
      {mobileOpen && (
        <div className="xl:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity">
          <aside className="w-72 max-w-[85vw] h-full bg-[#0d0d10] border-r border-white/[0.06] p-6 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img src="/logo/alygen-logo.png" alt="Alygen" className="w-8 h-8 object-contain" />
                  <span className="font-black text-sm tracking-tight">ALYGEN<span className="text-[hsl(18,100%,52%)]">.</span>CRM</span>
                </div>
                <button onClick={() => setMobileOpen(false)} className="text-white/40 hover:text-white text-lg">×</button>
              </div>

              <nav className="space-y-6 overflow-y-auto max-h-[70vh]">
                {menuSections.map((section, idx) => (
                  <div key={idx} className="space-y-1">
                    <p className="text-[9px] text-white/20 font-black uppercase tracking-widest px-2 mb-1">{section.title}</p>
                    {section.items.map((item) => {
                      const isActive = item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path);
                      const Icon = item.icon
                      return (
                        <button key={item.path} onClick={() => handleNavigate(item.path)}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs transition-all ${
                            isActive 
                              ? 'bg-[hsl(18,100%,52%)/0.08] text-[hsl(18,100%,62%)] font-semibold border border-[hsl(18,100%,52%)/0.25]' 
                              : 'text-white/50 hover:bg-white/[0.04] hover:text-white'
                          }`}>
                          <Icon className="w-3.5 h-3.5" />
                          <span>{item.label}</span>
                        </button>
                      )
                    })}
                  </div>
                ))}
              </nav>
            </div>

            <div className="pt-4 border-t border-white/[0.04] flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-[9px] text-emerald-500 font-bold uppercase tracking-wider">Local DB</span>
              </div>
              <span className="text-[9px] text-white/20 font-mono">v2026.09</span>
            </div>
          </aside>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 min-w-0 flex flex-col pt-16 xl:pt-0">
        {/* Global Page Header (Breadcrumbs, Stats & Alerts) */}
        <header className="hidden xl:flex h-16 px-8 border-b border-white/[0.04] bg-[#0c0c0e]/40 backdrop-blur-sm items-center justify-between shrink-0 relative z-20">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-white/30 font-medium">ALYGEN SUITE</span>
            <span className="text-white/15">/</span>
            <span className="text-[hsl(18,100%,62%)] font-bold uppercase tracking-widest">{activeItem?.label || 'CRM'}</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-emerald-400 animate-spin" />
              Alygen Engine Online
            </div>
            <NotificationBell />
          </div>
        </header>

        {/* Page Content viewport */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto relative">
          {children}
        </main>
      </div>
    </div>
  )
}

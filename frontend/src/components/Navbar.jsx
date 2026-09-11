import { useNavigate, useLocation } from 'react-router-dom'
import { Search, Eye, RefreshCw, Loader2, Zap } from 'lucide-react'
import { Button } from './ui/button'
import NotificationBell from './NotificationBell'
import { useState } from 'react'

export default function Navbar({ 
  search, setSearch, 
  privacyMode, setPrivacyMode, 
  onRefresh, isRefreshing, 
  onAnalyzeAll, analyzingAll,
  showActions = true 
}) {
  const [searchFocused, setSearchFocused] = useState(false)

  return (
    <div className="flex flex-col md:flex-row justify-end items-start md:items-center gap-4 mb-6" data-animate="fade-in">
      <div className="flex gap-2 flex-wrap items-center w-full md:w-auto justify-end">
        {/* Search */}
        <div className={`relative flex items-center transition-all duration-300 ${searchFocused ? 'w-64' : 'w-44'} group`}>
          <Search className="absolute left-3 w-3.5 h-3.5 text-white/30 pointer-events-none" />
          <input type="text" value={search || ''} onChange={e => setSearch?.(e.target.value)}
            onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)}
            placeholder="Search leads..."
            className="w-full pl-9 pr-7 py-1.5 bg-white/[0.04] border border-white/[0.08] rounded-lg text-xs text-white placeholder-white/25 focus:outline-none focus:border-white/20 focus:bg-white/[0.06] transition-all" />
        </div>

        <button onClick={() => setPrivacyMode?.(!privacyMode)}
          className={`p-1.5 rounded-lg border transition-all duration-300 transform active:scale-95 ${privacyMode ? 'bg-[hsl(18,100%,52%)/0.15] border-[hsl(18,100%,52%)/0.35] text-[hsl(18,100%,62%)] shadow-[0_4px_12px_hsl(18,100%,52%/0.25)]' : 'bg-white/[0.04] border-white/[0.08] text-white/30 hover:bg-white/[0.08] hover:border-white/[0.12] hover:text-white/60 hover:shadow-[0_2px_8px_rgba(0,0,0,0.15)]'}`}
          title={privacyMode ? 'Disable privacy' : 'Enable privacy'}>
          <Eye className="w-3.5 h-3.5" />
        </button>

        <NotificationBell />

        {showActions && (
          <>
            <Button onClick={() => onRefresh?.()} disabled={isRefreshing} variant="outline" size="sm"
              className="h-8 text-xs border-white/[0.08] text-white/50 hover:bg-white/[0.06] hover:text-white hover:border-white/20">
              {isRefreshing ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 mr-1.5" />}
              Refresh
            </Button>

            <Button onClick={() => onAnalyzeAll?.()} disabled={analyzingAll} size="sm"
              className="h-8 text-xs bg-[hsl(18,100%,52%)] hover:bg-[hsl(18,100%,58%)] text-white border-0 shadow-[0_2px_12px_hsl(18,100%,52%/0.35)]">
              {analyzingAll ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Zap className="w-3.5 h-3.5 mr-1.5" />}
              Analyze All
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

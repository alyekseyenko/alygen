import { Globe2, AlertTriangle, Radio, Mail, Phone, X, SlidersHorizontal, ChevronDown } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'

const FILTER_TABS = [
  { key: 'all',           label: 'All' },
  { key: 'no-website',    label: 'No Website',   icon: Globe2 },
  { key: 'high-priority', label: 'High Priority', icon: AlertTriangle },
  { key: 'no-pixel',      label: 'No Pixel',      icon: Radio },
  { key: 'has-email',     label: 'Has Email',     icon: Mail },
  { key: 'has-phone',     label: 'Has Phone',     icon: Phone },
]

const DEFAULT_ADVANCED = {
  qScoreMin: 0, qScoreMax: 100,
  perfMin: 0,   perfMax: 100,
  seoMin: 0,    seoMax: 100,
  secMin: 0,    secMax: 100,
  accMin: 0,    accMax: 100,
  priorities: [],
  hasPixel: 'any', analyzed: 'any', emailSent: 'any', whatsappSent: 'any',
}

export { DEFAULT_ADVANCED }

export default function LeadFilters({
  filter, setFilter,
  typeFilter, setTypeFilter,
  types,
  search, setSearch,
  counts,
  showAdvancedPanel, setShowAdvancedPanel,
  advancedFilters, setAdvancedFilters,
  hasActiveAdvanced,
}) {
  function resetAll() {
    setSearch('')
    setFilter('all')
    setTypeFilter('all')
    setAdvancedFilters(DEFAULT_ADVANCED)
  }

  return (
    <div className="space-y-3">
      {/* Primary Filter Row */}
      <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
        <div className="flex flex-wrap gap-1.5 flex-1">
          {FILTER_TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`filter-chip ${filter === key ? 'active' : ''}`}
            >
              {Icon && <Icon className="w-3.5 h-3.5" />}
              {label}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                filter === key
                  ? 'bg-[hsl(18,100%,52%)/0.2] text-[hsl(18,100%,65%)]'
                  : 'bg-white/[0.06] text-white/30'
              }`}>
                {counts[key] ?? 0}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {types.length > 0 && (
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px] h-8 text-xs bg-white/[0.04] border-white/[0.08] text-white/70">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {types.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          )}

          {(search || filter !== 'all' || typeFilter !== 'all' || hasActiveAdvanced) && (
            <button onClick={resetAll} className="filter-chip text-white/40 hover:text-white/70">
              <X className="w-3 h-3" /> Clear
            </button>
          )}

          <button
            onClick={() => setShowAdvancedPanel(p => !p)}
            className={`filter-chip ${showAdvancedPanel || hasActiveAdvanced ? 'active' : ''}`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filters
            {hasActiveAdvanced && <span className="w-1.5 h-1.5 rounded-full bg-[hsl(18,100%,52%)]" />}
            <ChevronDown className={`w-3 h-3 transition-transform ${showAdvancedPanel ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Advanced Panel */}
      {showAdvancedPanel && (
        <div data-animate="fade-in" className="glass-card p-5 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { label: 'Q Score',       minKey: 'qScoreMin', maxKey: 'qScoreMax' },
              { label: 'Performance',   minKey: 'perfMin',   maxKey: 'perfMax' },
              { label: 'SEO',           minKey: 'seoMin',    maxKey: 'seoMax' },
              { label: 'Security',      minKey: 'secMin',    maxKey: 'secMax' },
              { label: 'Accessibility', minKey: 'accMin',    maxKey: 'accMax' },
            ].map(({ label, minKey, maxKey }) => (
              <div key={label} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-white/50">{label}</span>
                  <span className="text-xs text-white/30 mono">{advancedFilters[minKey]} – {advancedFilters[maxKey]}</span>
                </div>
                <div className="flex items-center gap-2">
                  <input type="range" min={0} max={100} value={advancedFilters[minKey]}
                    onChange={e => setAdvancedFilters(p => ({ ...p, [minKey]: Math.min(+e.target.value, p[maxKey]) }))}
                    className="flex-1 h-1 accent-orange-500 cursor-pointer" />
                  <input type="range" min={0} max={100} value={advancedFilters[maxKey]}
                    onChange={e => setAdvancedFilters(p => ({ ...p, [maxKey]: Math.max(+e.target.value, p[minKey]) }))}
                    className="flex-1 h-1 accent-orange-500 cursor-pointer" />
                </div>
              </div>
            ))}

            {/* Priority */}
            <div className="space-y-2">
              <span className="text-xs font-medium text-white/50">Priority</span>
              <div className="flex flex-wrap gap-1.5">
                {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(p => (
                  <button key={p}
                    onClick={() => setAdvancedFilters(prev => ({
                      ...prev,
                      priorities: prev.priorities.includes(p)
                        ? prev.priorities.filter(x => x !== p)
                        : [...prev.priorities, p]
                    }))}
                    className={`priority-badge ${advancedFilters.priorities.includes(p) ? p : 'LOW'} cursor-pointer transition-all ${
                      advancedFilters.priorities.includes(p) ? 'opacity-100' : 'opacity-40 hover:opacity-70'
                    }`}
                  >{p}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Toggle row */}
          <div className="flex flex-wrap gap-4 pt-3 border-t border-white/[0.04]">
            {[
              { label: 'Has Pixel',      key: 'hasPixel' },
              { label: 'Analyzed',       key: 'analyzed' },
              { label: 'Email Sent',     key: 'emailSent' },
              { label: 'WhatsApp Sent',  key: 'whatsappSent' },
            ].map(({ label, key }) => (
              <div key={key} className="flex items-center gap-2">
                <span className="text-xs text-white/40">{label}</span>
                <div className="flex rounded-lg overflow-hidden border border-white/[0.08]">
                  {['any', 'yes', 'no'].map(val => (
                    <button key={val}
                      onClick={() => setAdvancedFilters(p => ({ ...p, [key]: val }))}
                      className={`px-2.5 py-1 text-xs transition-all ${
                        advancedFilters[key] === val
                          ? 'bg-white text-black font-semibold'
                          : 'bg-white/[0.04] text-white/30 hover:text-white/60'
                      }`}
                    >{val}</button>
                  ))}
                </div>
              </div>
            ))}
            <button
              onClick={() => setAdvancedFilters(DEFAULT_ADVANCED)}
              className="ml-auto text-xs text-white/20 hover:text-white/50 transition-colors"
            >Reset advanced</button>
          </div>
        </div>
      )}
    </div>
  )
}

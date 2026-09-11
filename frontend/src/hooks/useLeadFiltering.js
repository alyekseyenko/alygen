import { useMemo } from 'react'
import { calculateQScore } from '../utils/qscore'
import { calculateProjectPrice } from '../utils/pricing'
import { DEFAULT_ADVANCED } from '../components/LeadFilters'

export function useLeadFiltering({
  leads = [],
  search = '',
  filter = 'all',
  typeFilter = 'all',
  advancedFilters = DEFAULT_ADVANCED,
  whatsappSentLeads = {},
  sortBy = 'name',
  setSortBy,
  sortOrder = 'asc',
  setSortOrder,
  currentPage = 1,
  pageSize = 25
}) {
  const types = useMemo(() =>
    [...new Set(leads.map(l => l.type).filter(Boolean))],
    [leads]
  )

  const hasActiveAdvanced = useMemo(() => (
    advancedFilters.qScoreMin > 0 || advancedFilters.qScoreMax < 100 ||
    advancedFilters.perfMin > 0 || advancedFilters.perfMax < 100 ||
    advancedFilters.seoMin > 0 || advancedFilters.seoMax < 100 ||
    advancedFilters.secMin > 0 || advancedFilters.secMax < 100 ||
    advancedFilters.accMin > 0 || advancedFilters.accMax < 100 ||
    advancedFilters.priorities?.length > 0 ||
    advancedFilters.hasPixel !== 'any' ||
    advancedFilters.analyzed !== 'any' ||
    advancedFilters.emailSent !== 'any' ||
    advancedFilters.whatsappSent !== 'any'
  ), [advancedFilters])

  const filteredLeads = useMemo(() => {
    if (!leads.length) return []
    const st = search?.toLowerCase().trim() || ''
    const af = advancedFilters || DEFAULT_ADVANCED

    return leads.filter(lead => {
      if (!lead) return false
      if (st) {
        const hit = [lead.name, lead.website, lead.city, lead.type, lead.phone]
          .some(v => v?.toLowerCase().includes(st))
          || lead.analysis?.extractedEmails?.some(e => e.toLowerCase().includes(st))
        if (!hit) return false
      }

      if (typeFilter !== 'all' && lead.type?.trim() !== typeFilter) return false

      if (filter === 'no-pixel') return lead.analysis && !lead.analysis.hasPixel
      if (filter === 'low-performance') return lead.analysis && lead.analysis.performanceScore < 50
      if (filter === 'high-priority') return ['HIGH', 'CRITICAL'].includes(lead.analysis?.priority)
      if (filter === 'has-email') return lead.analysis?.extractedEmails?.length > 0
      if (filter === 'has-phone') return lead.analysis?.extractedPhones?.length > 0 || !!lead.phone
      if (filter === 'no-website') return lead.analysis?.category === 'NO_WEBSITE' || lead.analysis?.isSocialMediaOnly

      if (hasActiveAdvanced) {
        if (af.analyzed === 'yes' && !lead.analysis) return false
        if (af.analyzed === 'no' && lead.analysis) return false

        if (lead.analysis) {
          const qs = calculateQScore(lead.analysis).score
          const perf = lead.analysis.performanceMobile ?? 0
          const seo = lead.analysis.seo?.score ?? 0
          const sec = lead.analysis.security?.score ?? 0
          const acc = lead.analysis.accessibility?.score ?? 0

          if (qs < af.qScoreMin || qs > af.qScoreMax) return false
          if (perf < af.perfMin || perf > af.perfMax) return false
          if (seo < af.seoMin || seo > af.seoMax) return false
          if (sec < af.secMin || sec > af.secMax) return false
          if (acc < af.accMin || acc > af.accMax) return false
          if (af.priorities?.length && !af.priorities.includes(lead.analysis.priority)) return false
          if (af.hasPixel === 'yes' && !lead.analysis.hasPixel) return false
          if (af.hasPixel === 'no' && lead.analysis.hasPixel) return false
          if (af.emailSent === 'yes' && !lead.sequenceStatus) return false
          if (af.emailSent === 'no' && lead.sequenceStatus) return false
        }
      }

      if (af.whatsappSent === 'yes' && !whatsappSentLeads[lead.website]) return false
      if (af.whatsappSent === 'no' && whatsappSentLeads[lead.website]) return false

      return true
    })
  }, [leads, search, filter, typeFilter, advancedFilters, whatsappSentLeads, hasActiveAdvanced])

  const counts = useMemo(() => ({
    all: leads.length,
    'no-website': leads.filter(l => l.analysis?.category === 'NO_WEBSITE' || l.analysis?.isSocialMediaOnly).length,
    'high-priority': leads.filter(l => ['HIGH', 'CRITICAL'].includes(l.analysis?.priority)).length,
    'no-pixel': leads.filter(l => l.analysis && !l.analysis.hasPixel).length,
    'has-email': leads.filter(l => l.analysis?.extractedEmails?.length > 0).length,
    'has-phone': leads.filter(l => l.analysis?.extractedPhones?.length > 0 || !!l.phone).length,
  }), [leads])

  const sortedLeads = useMemo(() => {
    const priorityMap = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 }
    const list = Array.isArray(filteredLeads) ? filteredLeads : []
    return [...list].sort((a, b) => {
      if (!a || !b) return 0
      let av, bv
      switch (sortBy) {
        case 'name': av = a.name?.toLowerCase() || ''; bv = b.name?.toLowerCase() || ''; break
        case 'performance': av = a.analysis?.performanceMobile || 0; bv = b.analysis?.performanceMobile || 0; break
        case 'seo': av = a.analysis?.seo?.score || 0; bv = b.analysis?.seo?.score || 0; break
        case 'security': av = a.analysis?.security?.score || 0; bv = b.analysis?.security?.score || 0; break
        case 'accessibility': av = a.analysis?.accessibility?.score || 0; bv = b.analysis?.accessibility?.score || 0; break
        case 'tracking': av = a.analysis?.pixelDetails?.totalTracking || 0; bv = b.analysis?.pixelDetails?.totalTracking || 0; break
        case 'qscore': av = a.analysis ? calculateQScore(a.analysis).score : 0; bv = b.analysis ? calculateQScore(b.analysis).score : 0; break
        case 'price':
          av = a.analysis ? calculateProjectPrice(a.analysis, calculateQScore(a.analysis)).total : 0
          bv = b.analysis ? calculateProjectPrice(b.analysis, calculateQScore(b.analysis)).total : 0
          break
        case 'priority': av = priorityMap[a.analysis?.priority] || 0; bv = priorityMap[b.analysis?.priority] || 0; break
        default: return 0
      }
      if (typeof av === 'string') return sortOrder === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
      return sortOrder === 'asc' ? av - bv : bv - av
    })
  }, [filteredLeads, sortBy, sortOrder])

  const totalPages = Math.ceil(sortedLeads.length / pageSize) || 1
  const paginatedLeads = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return sortedLeads.slice(start, start + pageSize)
  }, [sortedLeads, currentPage, pageSize])

  const handleSort = col => {
    if (sortBy === col) setSortOrder(o => o === 'asc' ? 'desc' : 'asc')
    else { setSortBy(col); setSortOrder('asc') }
  }

  return {
    types,
    hasActiveAdvanced,
    filteredLeads,
    counts,
    sortedLeads,
    totalPages,
    paginatedLeads,
    handleSort
  }
}

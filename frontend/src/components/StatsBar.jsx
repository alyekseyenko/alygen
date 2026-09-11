import { useMemo } from 'react'
import { TrendingUp, Euro, AlertTriangle, Phone } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { calculateQScore } from '../utils/qscore'
import { calculateProjectPrice } from '../utils/pricing'

function StatCard({ icon: Icon, label, value, sub, color = 'text-white', delay = '1' }) {
  return (
    <Card data-animate="fade-in" data-delay={delay} className="glass-card border-0">
      <CardHeader className="pb-2 pt-4 px-5">
        <CardDescription className="flex items-center gap-2 text-xs text-white/40 font-medium uppercase tracking-wider">
          <Icon className="w-3.5 h-3.5" />
          {label}
        </CardDescription>
        <CardTitle className={`text-3xl font-black mt-1 ${color}`}>{value}</CardTitle>
      </CardHeader>
      <CardContent className="pb-4 px-5">
        <p className="text-xs text-white/30">{sub}</p>
      </CardContent>
    </Card>
  )
}

export default function StatsBar({ leads = [] }) {
  const stats = useMemo(() => {
    const analyzed = leads.filter(l => l.analysis)

    const avgQScore = (() => {
      if (!analyzed.length) return '-'
      const scores = analyzed.map(l => Number(calculateQScore(l.analysis).score) || 0)
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length
      return isNaN(avg) ? '-' : Math.round(avg)
    })()

    const revenue = analyzed.reduce((acc, l) => {
      if (l.analysis.isSocialMediaOnly || l.analysis.category === 'NO_WEBSITE') {
        return acc + (Number(l.analysis?.websiteProposal?.proposal?.investment?.recommended) || 2500)
      }
      const qs = calculateQScore(l.analysis)
      return acc + (Number(calculateProjectPrice(l.analysis, qs).total) || 0)
    }, 0)

    const highPriority = leads.filter(l => l.analysis?.priority === 'HIGH' || l.analysis?.priority === 'CRITICAL').length
    const withPhone    = leads.filter(l => l.analysis?.extractedPhones?.length > 0 || l.phone).length

    return { avgQScore, revenue, highPriority, withPhone, analyzedCount: analyzed.length, total: leads.length }
  }, [leads])

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <StatCard
        icon={TrendingUp}
        label="Avg Q Score"
        value={stats.avgQScore}
        sub={`${stats.analyzedCount} of ${stats.total} analyzed`}
        color="text-white"
        delay="1"
      />
      <StatCard
        icon={Euro}
        label="Potential Revenue"
        value={stats.revenue === 0 ? '€0' : `€${Math.round(stats.revenue).toLocaleString()}`}
        sub="Total across projects"
        color="text-[hsl(18,100%,62%)]"
        delay="2"
      />
      <StatCard
        icon={AlertTriangle}
        label="High Priority"
        value={stats.highPriority}
        sub="Require urgent action"
        color={stats.highPriority > 0 ? 'text-[hsl(38,95%,60%)]' : 'text-white'}
        delay="3"
      />
      <StatCard
        icon={Phone}
        label="Available Phones"
        value={stats.withPhone}
        sub="Leads with phone contact"
        color="text-white"
        delay="4"
      />
    </div>
  )
}

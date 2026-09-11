import { 
  Server, Target, BarChart3, Filter, Zap, Settings, 
  Calculator, ShieldCheck, Rocket, Brain, Calendar, Cloud, Users, FileText,
  LayoutDashboard, Mail, Shield, MessageCircle, Database, PlayCircle, Activity, Lock, Globe, Key, RefreshCcw
} from 'lucide-react'
import { calculateQScore } from '../utils/qscore'
import { calculateProjectPrice } from '../utils/pricing'
import { expect, assert } from '../utils/testUtils'

// ── Mock Data ─────────────────────────────────────────────────────────────────
const PERFECT   = { performanceMobile: 95, seo: { score: 92 }, security: { score: 90, hasSSL: true }, accessibility: { score: 88 }, pixelDetails: { totalTracking: 6 }, conversion: { score: 85 } }
const CRITICAL  = { performanceMobile: 15, seo: { score: 10 }, security: { score: 5,  hasSSL: false }, accessibility: { score: 8  }, pixelDetails: { totalTracking: 0 }, conversion: { score: 0  } }
const AVERAGE   = { performanceMobile: 55, seo: { score: 60 }, security: { score: 65, hasSSL: true }, accessibility: { score: 50 }, pixelDetails: { totalTracking: 2 }, conversion: { score: 55 } }
const QS_LOW    = { score: 25, grade: 'F' }
const POOR_SITE = {
  performanceMobile: 20,
  seo: { score: 25, hasSitemap: false, hasSchema: false, images: { withoutAlt: 15 } },
  security: { score: 30, hasSSL: false, headers: {} },
  accessibility: { score: 20, errors: 30 },
  pixelDetails: { totalTracking: 0 },
  conversion: { score: 15, ctas: { total: 0 }, contact: { whatsapp: false }, socialProof: {} },
}

export const SUITES_BY_PAGE = [
  {
    id: 'lifecycle',
    tab: '0-to-100 Simulation',
    icon: RefreshCcw,
    suites: [
      {
        id: 'master-journey',
        name: 'Master Lead Journey',
        icon: Rocket,
        async: true,
        tests: [] // Preenchido via audit/lifecycle/intake | intelligence | synthesis | enrollment
      }
    ]
  },
  {
    id: 'enterprise',
    tab: 'Enterprise Audit',
    icon: Globe,
    suites: [
      {
        id: 'external-integration',
        name: 'Third-Party Handshakes',
        icon: Zap,
        async: true,
        tests: [] 
      },
      {
        id: 'env-integrity',
        name: 'Secret Shield (Env)',
        icon: Key,
        async: true,
        tests: [] 
      }
    ]
  },
  {
    id: 'senior',
    tab: 'Senior Resilience',
    icon: Activity,
    suites: [
      {
        id: 'observability',
        name: 'System Stability Audit',
        icon: BarChart3,
        async: true,
        tests: [] 
      },
      {
        id: 'resource-audit',
        name: 'Process Resource Monitor',
        icon: Settings,
        async: true,
        tests: [] 
      },
      {
        id: 'security-audit',
        name: 'Security Shield & RLS',
        icon: Lock,
        async: true,
        tests: [] 
      }
    ]
  },
  {
    id: 'flows',
    tab: 'Workflow Simulation',
    icon: PlayCircle,
    suites: [
      {
        id: 'report-engine',
        name: 'Relatório Engine (E2E)',
        icon: FileText,
        async: true,
        tests: [] 
      },
      {
        id: 'email-logic',
        name: 'Communication Logic',
        icon: Mail,
        async: true,
        tests: [] 
      },
      {
        id: 'worker-status',
        name: 'Background Heartbeats',
        icon: Settings,
        async: true,
        tests: [] 
      }
    ]
  },
  {
    id: 'infra',
    tab: 'Infrastructure',
    icon: Cloud,
    suites: [
      {
        id: 'backend-core',
        name: 'Systems & APIs',
        icon: Server,
        async: true,
        tests: [] 
      },
      {
        id: 'db-integrity',
        name: 'Critical Storage (DB)',
        icon: Database,
        async: true,
        tests: []
      },
      {
        id: 'job-engine',
        name: 'Processing Pipeline',
        icon: Settings,
        async: true,
        tests: []
      }
    ]
  },
  {
    id: 'intelligence',
    tab: 'Intelligence Core',
    icon: Brain,
    suites: [
      {
        id: 'comms-core',
        name: 'Messaging Hub',
        icon: MessageCircle,
        async: true,
        tests: [] 
      },
      {
        id: 'ai-engines',
        name: 'AI AI & Vision Calibration',
        icon: Rocket,
        async: true,
        tests: [] 
      },
      {
        id: 'qscore-logic',
        name: 'Rating Engine (Local)',
        icon: Target,
        tests: [
          { name: 'Returns 0 for null data', fn: () => expect(calculateQScore(null).score).toBe(0) },
          { name: 'Perfect Site gets A+', fn: () => expect(calculateQScore(PERFECT).grade).toBe('A+') },
          { name: 'Critical Site gets F', fn: () => expect(calculateQScore(CRITICAL).grade).toBe('F') }
        ]
      }
    ]
  },
  {
    id: 'financial',
    tab: 'Pricing Logic',
    icon: Calculator,
    suites: [
        {
          id: 'pricing-engine',
          name: 'Value Calculation',
          icon: Calculator,
          tests: [
            { name: 'Total Hours Calculation', fn: () => { const r = calculateProjectPrice(POOR_SITE, QS_LOW); expect(r.totalHours).toBeGreaterThan(0) } },
            { name: 'Timeline by Workload', fn: () => { const r = calculateProjectPrice(POOR_SITE, QS_LOW); expect(r.timeline).toBe(Math.ceil(r.totalHours / 20)) } }
          ]
        }
    ]
  }
]

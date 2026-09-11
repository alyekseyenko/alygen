import { CheckCircle2, XCircle, Clock, RefreshCw } from 'lucide-react'

export function assert(condition, message) {
  if (!condition) throw new Error(message)
}

export function expect(value) {
  return {
    toBe:                 (expected) => assert(value === expected,           `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(value)}`),
    toEqual:              (expected) => assert(JSON.stringify(value) === JSON.stringify(expected), `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(value)}`),
    toBeGreaterThan:      (n)        => assert(value > n,                   `Expected ${value} > ${n}`),
    toBeGreaterThanOrEqual:(n)       => assert(value >= n,                  `Expected ${value} >= ${n}`),
    toBeLessThan:         (n)        => assert(value < n,                   `Expected ${value} < ${n}`),
    toBeLessThanOrEqual:  (n)        => assert(value <= n,                  `Expected ${value} <= ${n}`),
    toBeDefined:          ()         => assert(value !== undefined,          `Expected value to be defined`),
    toBeNull:             ()         => assert(value === null,               `Expected null, got ${value}`),
    toContain:            (item)     => assert(Array.isArray(value) ? value.includes(item) : value.includes?.(item), `Expected [${value}] to contain ${item}`),
    not: {
      toContain: (item)  => assert(!(Array.isArray(value) ? value.includes(item) : value.includes?.(item)), `Expected [${value}] NOT to contain ${item}`),
      toBe:      (expected) => assert(value !== expected, `Expected NOT ${JSON.stringify(expected)}`),
    },
    toHaveProperty: (key) => assert(value !== null && typeof value === 'object' && key in value, `Expected object to have property "${key}"`),
  }
}

export function StatusIcon({ status, size = 'md' }) {
  const sz = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'
  if (status === 'pass')    return <CheckCircle2 className={`${sz} text-emerald-400`} />
  if (status === 'fail')    return <XCircle      className={`${sz} text-red-400`} />
  if (status === 'running') return <RefreshCw    className={`${sz} text-yellow-400 animate-spin`} />
  return <Clock className={`${sz} text-white/20`} />
}

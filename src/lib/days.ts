import type { Report } from '../types'

const DAY = 86_400_000

/** Whole days a pothole has been open, or how long it took to fix. */
export function daysUnfixed(r: Pick<Report, 'createdAt' | 'status' | 'fixedAt'>, now = Date.now()): number {
  const end = r.status === 'fixed' && r.fixedAt ? r.fixedAt : now
  return Math.max(0, Math.floor((end - r.createdAt) / DAY))
}

export type Severity = 'fresh' | 'old' | 'ancient' | 'fixed'

export function severity(r: Pick<Report, 'createdAt' | 'status' | 'fixedAt'>, now = Date.now()): Severity {
  if (r.status === 'fixed') return 'fixed'
  const d = daysUnfixed(r, now)
  return d > 90 ? 'ancient' : d >= 30 ? 'old' : 'fresh'
}

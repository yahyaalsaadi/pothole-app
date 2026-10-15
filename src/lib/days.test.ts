import { describe, expect, it } from 'vitest'
import { daysUnfixed, severity } from './days'
import { nearestDistrict, inBaghdad } from '../districts'

const DAY = 86_400_000
const now = Date.UTC(2026, 9, 15)

describe('daysUnfixed', () => {
  it('counts whole days while open', () => {
    expect(daysUnfixed({ createdAt: now - 45.5 * DAY, status: 'open', fixedAt: null }, now)).toBe(45)
  })
  it('stops counting when fixed', () => {
    expect(daysUnfixed({ createdAt: now - 100 * DAY, status: 'fixed', fixedAt: now - 40 * DAY }, now)).toBe(60)
  })
  it('never goes negative', () => {
    expect(daysUnfixed({ createdAt: now + DAY, status: 'open', fixedAt: null }, now)).toBe(0)
  })
})

describe('severity', () => {
  it('buckets by age', () => {
    expect(severity({ createdAt: now - 5 * DAY, status: 'open', fixedAt: null }, now)).toBe('fresh')
    expect(severity({ createdAt: now - 30 * DAY, status: 'open', fixedAt: null }, now)).toBe('old')
    expect(severity({ createdAt: now - 91 * DAY, status: 'open', fixedAt: null }, now)).toBe('ancient')
    expect(severity({ createdAt: now - 91 * DAY, status: 'fixed', fixedAt: now }, now)).toBe('fixed')
  })
})

describe('districts', () => {
  it('finds the nearest district', () => {
    expect(nearestDistrict(33.303, 44.418)).toBe('karrada')
    expect(nearestDistrict(33.393, 44.46)).toBe('sadr')
  })
  it('rejects points outside Baghdad', () => {
    expect(inBaghdad(36.19, 44.01)).toBe(false) // Erbil
    expect(inBaghdad(33.31, 44.37)).toBe(true)
  })
})

/**
 * 概览 / Overview
 * 活动条件测试 L19–L22：默认值（含月末与闰年）、校验规则、查询转换。
 * Tests L19–L22: defaults (month end, leap year), validation rules, query conversion.
 */
import { describe, expect, it } from 'vitest'
import { defaultFilters, toQuery, validateFilters, type EventFilterDraft } from './eventFilters'

/** 一份合法草稿 / A valid draft. */
function makeDraft(overrides: Partial<EventFilterDraft> = {}): EventFilterDraft {
  return {
    location: '洛杉矶',
    radiusMiles: '60',
    startDate: '2026-09-29',
    endDate: '2026-10-29',
    maxBudgetPerPerson: '',
    ...overrides,
  }
}

describe('defaultFilters', () => {
  it('L19: defaults to LA, 60 miles, LA today to the same day next month, no budget', () => {
    expect(defaultFilters(new Date('2026-09-29T19:00:00Z'))).toEqual({
      location: '洛杉矶',
      radiusMiles: '60',
      startDate: '2026-09-29',
      endDate: '2026-10-29',
      maxBudgetPerPerson: '',
    })
  })

  it('L20: clamps month ends, handles leap years and December rollover, and uses the LA date', () => {
    expect(defaultFilters(new Date('2026-01-31T20:00:00Z')).endDate).toBe('2026-02-28')
    expect(defaultFilters(new Date('2028-01-31T20:00:00Z')).endDate).toBe('2028-02-29')
    expect(defaultFilters(new Date('2026-12-15T20:00:00Z')).endDate).toBe('2027-01-15')
    // UTC 已是 10-01，但洛杉矶仍是 09-30。/ Already Oct 1 in UTC, still Sep 30 in LA.
    const laEvening = defaultFilters(new Date('2026-10-01T03:00:00Z'))
    expect(laEvening.startDate).toBe('2026-09-30')
    expect(laEvening.endDate).toBe('2026-10-30')
  })
})

describe('validateFilters', () => {
  it('L21: reports each invalid field and accepts the valid edge cases', () => {
    expect(validateFilters(makeDraft({ location: '   ' }))).toHaveProperty('location')
    for (const radiusMiles of ['0', '-1', '1.5', '501', '', 'abc']) {
      expect(validateFilters(makeDraft({ radiusMiles }))).toHaveProperty('radiusMiles')
    }
    expect(validateFilters(makeDraft({ maxBudgetPerPerson: '-1' }))).toHaveProperty('maxBudgetPerPerson')
    expect(validateFilters(makeDraft({ maxBudgetPerPerson: 'free' }))).toHaveProperty('maxBudgetPerPerson')
    expect(validateFilters(makeDraft({ endDate: '2026-09-28' })).endDate).toBe('结束日期不能早于开始日期')

    expect(validateFilters(makeDraft())).toEqual({})
    expect(validateFilters(makeDraft({ radiusMiles: '1' }))).toEqual({})
    expect(validateFilters(makeDraft({ radiusMiles: '500' }))).toEqual({})
    expect(validateFilters(makeDraft({ maxBudgetPerPerson: '0' }))).toEqual({})
    expect(validateFilters(makeDraft({ endDate: '2026-09-29' }))).toEqual({})
  })
})

describe('toQuery', () => {
  it('L22: converts numbers, maps a blank budget to null and keeps 0 as free-only', () => {
    expect(toQuery(makeDraft({ location: ' 洛杉矶 ', maxBudgetPerPerson: '' }))).toEqual({
      location: '洛杉矶',
      radiusMiles: 60,
      startDate: '2026-09-29',
      endDate: '2026-10-29',
      maxBudgetPerPerson: null,
    })
    expect(toQuery(makeDraft({ maxBudgetPerPerson: '0' })).maxBudgetPerPerson).toBe(0)
    expect(toQuery(makeDraft({ maxBudgetPerPerson: '45.5' })).maxBudgetPerPerson).toBe(45.5)
  })
})

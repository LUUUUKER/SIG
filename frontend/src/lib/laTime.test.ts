/**
 * 概览 / Overview
 * 洛杉矶时间工具测试 L1–L5：时区换算、夏令时、主题边界、每日鼓励语稳定性。
 * Tests L1–L5 for LA time helpers: zone conversion, DST, theme boundaries, stable daily phrase.
 */
import { describe, expect, it } from 'vitest'
import { dailyEncouragement, losAngelesParts, themeForTime } from './laTime'

describe('losAngelesParts', () => {
  it('L1: converts a winter UTC instant to PST (UTC−8), crossing the date line back', () => {
    expect(losAngelesParts(new Date('2026-01-15T07:30:00Z'))).toEqual({
      year: 2026,
      month: 1,
      day: 14,
      hour: 23,
      minute: 30,
    })
  })

  it('L2: converts a summer UTC instant to PDT (UTC−7)', () => {
    expect(losAngelesParts(new Date('2026-07-15T07:30:00Z'))).toEqual({
      year: 2026,
      month: 7,
      day: 15,
      hour: 0,
      minute: 30,
    })
  })
})

describe('themeForTime', () => {
  it('L3: switches at 06:00 and 18:00 LA time (winter, UTC−8)', () => {
    expect(themeForTime(new Date('2026-01-15T13:59:00Z'))).toBe('dark') // 05:59
    expect(themeForTime(new Date('2026-01-15T14:00:00Z'))).toBe('light') // 06:00
    expect(themeForTime(new Date('2026-01-16T01:59:00Z'))).toBe('light') // 17:59
    expect(themeForTime(new Date('2026-01-16T02:00:00Z'))).toBe('dark') // 18:00
  })

  it('L4: still switches at local 06:00 on both 2026 DST change days', () => {
    // 2026-03-08 起为 PDT（UTC−7）；若误用固定 −8，13:00Z 会被算成 05:00。
    expect(themeForTime(new Date('2026-03-08T12:59:00Z'))).toBe('dark') // 05:59 PDT
    expect(themeForTime(new Date('2026-03-08T13:00:00Z'))).toBe('light') // 06:00 PDT
    // 2026-11-01 回到 PST（UTC−8）。
    expect(themeForTime(new Date('2026-11-01T13:59:00Z'))).toBe('dark') // 05:59 PST
    expect(themeForTime(new Date('2026-11-01T14:00:00Z'))).toBe('light') // 06:00 PST
  })
})

describe('dailyEncouragement', () => {
  it('L5: is stable within one LA date (even across UTC midnight) and changes the next day', () => {
    const laJan14Noon = dailyEncouragement(new Date('2026-01-14T20:00:00Z')) // LA 01-14 12:00
    const laJan14LateNight = dailyEncouragement(new Date('2026-01-15T07:59:00Z')) // LA 01-14 23:59
    const laJan15Midnight = dailyEncouragement(new Date('2026-01-15T08:00:00Z')) // LA 01-15 00:00

    expect(laJan14LateNight).toBe(laJan14Noon)
    expect(laJan15Midnight).not.toBe(laJan14Noon)
  })
})

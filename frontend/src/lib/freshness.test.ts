/**
 * 概览 / Overview
 * 新鲜度规则测试 L6–L10：更新判断、24 小时窗口、相对时间文案。
 * Tests L6–L10: refresh due check, 24h window, relative time text.
 */
import { describe, expect, it } from 'vitest'
import { formatUpdatedAgo, isWithin24h, needsRefresh } from './freshness'

const NOW = new Date('2026-09-29T19:00:00Z')
const MINUTE = 60_000
const HOUR = 3_600_000

/** 相对 NOW 的时间点 / An instant relative to NOW. */
function msBeforeNow(milliseconds: number): Date {
  return new Date(NOW.getTime() - milliseconds)
}

describe('needsRefresh', () => {
  it('L6: is true when there has never been a refresh', () => {
    expect(needsRefresh(null, NOW)).toBe(true)
  })

  it('L7: uses an 8-hour interval with an inclusive boundary', () => {
    expect(needsRefresh(msBeforeNow(7 * HOUR + 59 * MINUTE), NOW)).toBe(false)
    expect(needsRefresh(msBeforeNow(8 * HOUR), NOW)).toBe(true)
    expect(needsRefresh(msBeforeNow(9 * HOUR), NOW)).toBe(true)
  })

  it('L8: is false when the last run is in the future (clock skew)', () => {
    expect(needsRefresh(msBeforeNow(-10 * MINUTE), NOW)).toBe(false)
  })
})

describe('isWithin24h', () => {
  it('L9: includes exactly 24h, excludes older, tolerates up to 5 minutes in the future', () => {
    expect(isWithin24h(msBeforeNow(23 * HOUR + 59 * MINUTE), NOW)).toBe(true)
    expect(isWithin24h(msBeforeNow(24 * HOUR), NOW)).toBe(true)
    expect(isWithin24h(msBeforeNow(24 * HOUR + 1), NOW)).toBe(false)
    expect(isWithin24h(msBeforeNow(-5 * MINUTE), NOW)).toBe(true)
    expect(isWithin24h(msBeforeNow(-5 * MINUTE - 1), NOW)).toBe(false)
  })
})

describe('formatUpdatedAgo', () => {
  it('L10: formats minutes, hours, days and the never-updated case', () => {
    expect(formatUpdatedAgo(null, NOW)).toBe('尚未更新')
    expect(formatUpdatedAgo(msBeforeNow(30_000), NOW)).toBe('刚刚')
    expect(formatUpdatedAgo(msBeforeNow(5 * MINUTE), NOW)).toBe('5 分钟前')
    expect(formatUpdatedAgo(msBeforeNow(59 * MINUTE), NOW)).toBe('59 分钟前')
    expect(formatUpdatedAgo(msBeforeNow(60 * MINUTE), NOW)).toBe('1 小时前')
    expect(formatUpdatedAgo(msBeforeNow(23 * HOUR), NOW)).toBe('23 小时前')
    expect(formatUpdatedAgo(msBeforeNow(24 * HOUR), NOW)).toBe('1 天前')
  })
})

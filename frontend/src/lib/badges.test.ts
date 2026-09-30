/**
 * 概览 / Overview
 * 标记规则测试 L11–L14：「新」「更新」与不标记的判定。
 * Tests L11–L14 for the new / update / none badge rule.
 */
import { describe, expect, it } from 'vitest'
import { badgeFor, type BadgeInput } from './badges'

const PREVIOUS_VISIT = new Date('2026-09-29T10:00:00Z')

/** 构造一条内容 / Build an item. */
function makeItem(overrides: Partial<BadgeInput> = {}): BadgeInput {
  return {
    firstSeenAt: '2026-09-29T08:00:00Z',
    eventClusterId: 'cluster-1',
    latestDevelopmentAt: '2026-09-29T08:00:00Z',
    ...overrides,
  }
}

describe('badgeFor', () => {
  it('L11: marks items first seen after the previous visit as new', () => {
    expect(badgeFor(makeItem({ firstSeenAt: '2026-09-29T12:00:00Z' }), PREVIOUS_VISIT, {})).toBe('new')
    expect(badgeFor(makeItem({ firstSeenAt: '2026-09-29T09:00:00Z' }), PREVIOUS_VISIT, {})).toBeNull()
  })

  it('L12: shows no badge on the very first visit', () => {
    expect(badgeFor(makeItem({ firstSeenAt: '2026-09-29T12:00:00Z' }), null, {})).toBeNull()
  })

  it('L13: marks a seen event with a later development as update', () => {
    const item = makeItem({ latestDevelopmentAt: '2026-09-29T15:00:00Z' })
    expect(badgeFor(item, PREVIOUS_VISIT, { 'cluster-1': '2026-09-29T11:00:00Z' })).toBe('update')
  })

  it('L14: shows nothing for a seen event without new developments, even if first seen recently', () => {
    const item = makeItem({
      firstSeenAt: '2026-09-29T12:00:00Z',
      latestDevelopmentAt: '2026-09-29T12:00:00Z',
    })
    expect(badgeFor(item, PREVIOUS_VISIT, { 'cluster-1': '2026-09-29T13:00:00Z' })).toBeNull()
  })
})

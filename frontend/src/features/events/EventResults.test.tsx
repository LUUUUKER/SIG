/**
 * 概览 / Overview
 * 活动结果测试 C13：尚未接入时说明已记录的条件，只显示标注为"分类示例"的卡片、没有任何链接；分类过滤生效。
 * Test C13: not-connected explains the recorded query, shows only cards labelled as examples with
 * no links, and filters by category.
 */
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { EventResults } from './EventResults'

const QUERY = {
  location: '洛杉矶',
  radiusMiles: 60,
  startDate: '2026-09-29',
  endDate: '2026-10-29',
  maxBudgetPerPerson: 0,
}

describe('EventResults', () => {
  it('C13: states the search is not connected and never shows fabricated events', () => {
    const { rerender } = render(<EventResults status="not_connected" query={QUERY} category="全部" onRetry={vi.fn()} />)

    const notice = screen.getByRole('status')
    expect(notice).toHaveTextContent('洛杉矶 · 60 miles · 2026-09-29 至 2026-10-29 · 只看免费')
    expect(notice).toHaveTextContent('不会显示任何活动')
    expect(screen.queryAllByRole('link')).toHaveLength(0)
    const cards = screen.getAllByRole('region', { name: /^分类示例：/ })
    expect(cards).toHaveLength(4)
    cards.forEach((card) => expect(card).toHaveTextContent('分类示例'))

    rerender(<EventResults status="not_connected" query={QUERY} category="演出" onRetry={vi.fn()} />)
    expect(screen.getAllByRole('region', { name: /^分类示例：/ })).toHaveLength(1)
  })
})

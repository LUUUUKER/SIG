/**
 * 概览 / Overview
 * 头版选择测试 L15–L18：每领域取最高分、缺失跳过、同分规则、24h 与类型过滤。
 * Tests L15–L18: best per domain, skip missing, tie-break, 24h and type filtering.
 */
import { describe, expect, it } from 'vitest'
import type { ContentType, Domain } from './domains'
import { pickHeadlines, type HeadlineCandidate } from './headlines'

const NOW = new Date('2026-09-29T19:00:00Z')

interface TestItem extends HeadlineCandidate {
  id: string
}

/** 构造候选 / Build a candidate. */
function makeItem(
  id: string,
  domain: Domain,
  importanceScore: number,
  options: { type?: ContentType; publishedAt?: string } = {},
): TestItem {
  return {
    id,
    domain,
    importanceScore,
    type: options.type ?? '新闻',
    publishedAt: options.publishedAt ?? '2026-09-29T12:00:00Z',
  }
}

/** 取 id 列表 / Map to ids. */
function ids(items: TestItem[]): string[] {
  return items.map((item) => item.id)
}

describe('pickHeadlines', () => {
  it('L15: picks the highest score per domain and orders by the domain list', () => {
    const items = [
      makeItem('sports-low', '体育', 3),
      makeItem('ai-low', 'AI', 5),
      makeItem('sports-high', '体育', 9),
      makeItem('ai-high', 'AI', 8),
    ]
    expect(ids(pickHeadlines(items, NOW))).toEqual(['ai-high', 'sports-high'])
  })

  it('L16: skips domains with no content instead of filling them', () => {
    const headlines = pickHeadlines([makeItem('finance', '金融', 4)], NOW)
    expect(ids(headlines)).toEqual(['finance'])
    expect(headlines).toHaveLength(1)
  })

  it('L17: breaks score ties in favour of the newer item', () => {
    const items = [
      makeItem('older', 'GitHub', 7, { publishedAt: '2026-09-29T09:00:00Z' }),
      makeItem('newer', 'GitHub', 7, { publishedAt: '2026-09-29T15:00:00Z' }),
    ]
    expect(ids(pickHeadlines(items, NOW))).toEqual(['newer'])
  })

  it('L18: only considers news inside the 24h window, and returns [] for empty input', () => {
    const items = [
      makeItem('stale-news', 'AI', 10, { publishedAt: '2026-09-28T12:00:00Z' }),
      makeItem('curated', 'AI', 10, { type: '精选文章' }),
      makeItem('person', 'AI', 10, { type: '名人动态' }),
      makeItem('fresh-news', 'AI', 1),
    ]
    expect(ids(pickHeadlines(items, NOW))).toEqual(['fresh-news'])
    expect(pickHeadlines([], NOW)).toEqual([])
  })
})

/**
 * 概览 / Overview
 * 头版选择：从最近 24 小时的新闻里，每个领域选最重要的一条；没有合格内容的领域直接跳过。
 * Headline selection: from news in the last 24h, pick the most important item per domain;
 * domains without a qualifying item are skipped, never filled with made-up content.
 *
 * 包含 / Contents
 * - HeadlineCandidate：参与选择所需的最少字段。/ Minimum fields needed for selection.
 * - pickHeadlines(items, now, domains)：返回按领域顺序排列的头版列表。/ Headlines in domain order.
 */

import { DOMAINS, type ContentType, type Domain } from './domains'
import { isWithin24h } from './freshness'

export interface HeadlineCandidate {
  domain: Domain
  type: ContentType
  publishedAt: string
  importanceScore: number
}

/**
 * 判断 a 是否比 b 更适合当头版 / Whether candidate a beats b.
 * 规则 / Rule: 分数高者胜；同分时发布更晚者胜。/ Higher score wins; ties go to the newer item.
 */
function isBetterHeadline(a: HeadlineCandidate, b: HeadlineCandidate): boolean {
  if (a.importanceScore !== b.importanceScore) return a.importanceScore > b.importanceScore
  return new Date(a.publishedAt) > new Date(b.publishedAt)
}

/**
 * 选择头版 / Pick headlines.
 * 输入 / Input
 * - items：候选内容。/ candidates.
 * - now：当前时间，用于 24 小时窗口。/ current time for the 24h window.
 * - domains：领域顺序，默认七领域。/ domain order, defaults to the seven domains.
 * 输出 / Output: 每个有内容的领域一条，按 domains 顺序；可能少于领域数，可能为空。
 *                One item per domain that has content, in domain order; may be shorter or empty.
 * 算法 / Algorithm: 先过滤，再对每个领域做一次线性扫描取最大值，O(领域数 × 条数)。
 *                   Filter, then a linear max-scan per domain: O(domains × items).
 * 步骤 / Steps
 * 1. 只保留类型为"新闻"且在最近 24 小时内的内容。/ Keep only news inside the 24h window.
 * 2. 按领域顺序，每个领域扫描出最佳一条。/ For each domain in order, scan for the best item.
 * 3. 没有候选的领域跳过。/ Skip domains without candidates.
 */
export function pickHeadlines<T extends HeadlineCandidate>(
  items: readonly T[],
  now: Date,
  domains: readonly Domain[] = DOMAINS,
): T[] {
  const eligibleNews = items.filter(
    (item) => item.type === '新闻' && isWithin24h(new Date(item.publishedAt), now),
  ) // 步骤 1 / Step 1

  const headlines: T[] = []
  for (const domain of domains) {
    let bestItem: T | undefined
    for (const item of eligibleNews) {
      if (item.domain !== domain) continue
      if (bestItem === undefined || isBetterHeadline(item, bestItem)) bestItem = item // 步骤 2 / Step 2
    }
    if (bestItem !== undefined) headlines.push(bestItem) // 步骤 3 / Step 3
  }
  return headlines
}

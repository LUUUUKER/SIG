/**
 * 概览 / Overview
 * 演示 API 测试 S1–S6：信息流过滤、收藏、模拟更新、活动搜索、演示对话、找不到的对象。
 * Tests S1–S6 for the mock API: feed filtering, saving, simulated refresh, events, chat, not-found.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { isWithin24h } from '../lib/freshness'
import { pickHeadlines } from '../lib/headlines'
import { ApiError, NotFoundError } from './errors'
import { createMockApi } from './mockApi'
import type { ContextRef } from './types'

const NOW = new Date('2026-09-29T19:00:00Z')
const REFRESH_DURATION_MS = 2_000

/** 固定时钟、无延迟的实例 / Instance with a fixed clock and no latency. */
function makeApi() {
  return createMockApi({ now: () => NOW, latencyMs: 0, refreshDurationMs: REFRESH_DURATION_MS })
}

const ARTICLE_CONTEXT: ContextRef = {
  kind: 'article',
  id: 'news-ai-agents',
  label: '当 AI 开始替你行动，谁来决定它的边界？',
}

afterEach(() => {
  vi.useRealTimers()
})

describe('mockApi.getFeed', () => {
  it('S1: keeps news and people updates inside 24h, marks everything demo, derives headlines', async () => {
    const feed = await makeApi().getFeed()

    const timeBound = feed.articles.filter((item) => item.type !== '精选文章')
    expect(timeBound.length).toBeGreaterThan(0)
    expect(timeBound.every((item) => isWithin24h(new Date(item.publishedAt), NOW))).toBe(true)
    expect(feed.articles.some((item) => item.id === 'news-github-stale')).toBe(false)
    expect(feed.articles.some((item) => item.type === '精选文章')).toBe(true)
    expect(feed.articles.every((item) => item.isDemo)).toBe(true)
    expect(feed.headlines.map((item) => item.id)).toEqual(
      pickHeadlines(feed.articles, NOW).map((item) => item.id),
    )
  })
})

describe('mockApi saving', () => {
  it('S2: saves and unsaves, and a simulated failure rejects without changing state', async () => {
    const api = makeApi()

    await api.setSaved('news-ai-agents', true)
    expect((await api.listSaved()).map((item) => item.id)).toEqual(['news-ai-agents'])

    api.configureMock({ failNext: 'setSaved' })
    await expect(api.setSaved('news-sports-nba', true)).rejects.toBeInstanceOf(ApiError)
    expect((await api.listSaved()).map((item) => item.id)).toEqual(['news-ai-agents'])

    await api.setSaved('news-ai-agents', false)
    expect(await api.listSaved()).toEqual([])
  })
})

describe('mockApi refresh', () => {
  it('S3a: runs, then succeeds with new items and an updated lastRunAt', async () => {
    vi.useFakeTimers()
    const api = makeApi()
    const before = await api.getFeed()

    const run = await api.startRefresh()
    expect(run.status).toBe('running')
    expect((await api.startRefresh()).id).toBe(run.id) // 进行中不重复发起 / no duplicate while running

    vi.advanceTimersByTime(REFRESH_DURATION_MS)
    const finished = await api.getRefreshStatus(run.id)
    expect(finished.status).toBe('succeeded')
    expect(finished.newArticleCount).toBe(3)

    const after = await api.getFeed()
    expect(after.lastRunAt).toBe(NOW.toISOString())
    expect(after.lastRunAt).not.toBe(before.lastRunAt)
    expect(after.articles).toHaveLength(before.articles.length + 3)
  })

  it('S3b: a simulated failure ends the run as failed with a reason and keeps lastRunAt', async () => {
    vi.useFakeTimers()
    const api = makeApi()
    const before = await api.getFeed()

    api.configureMock({ failNext: 'startRefresh' })
    const run = await api.startRefresh()
    vi.advanceTimersByTime(REFRESH_DURATION_MS)

    const finished = await api.getRefreshStatus(run.id)
    expect(finished.status).toBe('failed')
    expect(finished.errorMessage).toBeTruthy()
    expect((await api.getFeed()).lastRunAt).toBe(before.lastRunAt)
  })
})

describe('mockApi.searchEvents', () => {
  it('S4: reports not_connected and never returns events', async () => {
    const query = {
      location: '洛杉矶',
      radiusMiles: 60,
      startDate: '2026-09-29',
      endDate: '2026-10-29',
      maxBudgetPerPerson: null,
    }
    const result = await makeApi().searchEvents(query)

    expect(result).toEqual({ status: 'not_connected', query })
    expect(result).not.toHaveProperty('events')
  })
})

describe('mockApi.sendChat', () => {
  it('S5: replies about the given context, marked as demo, and can fail on request', async () => {
    const api = makeApi()

    const reply = await api.sendChat({ text: '背景是什么？', contextRef: ARTICLE_CONTEXT })
    expect(reply.content).toContain(ARTICLE_CONTEXT.label)
    expect(reply.content).toContain('演示')
    expect(reply.isDemo).toBe(true)

    api.configureMock({ failNext: 'sendChat' })
    await expect(api.sendChat({ text: '再说说', contextRef: ARTICLE_CONTEXT })).rejects.toBeInstanceOf(ApiError)
  })
})

describe('mockApi not found', () => {
  it('S6: rejects unknown article ids with NotFoundError', async () => {
    const api = makeApi()

    await expect(api.getArticle('missing')).rejects.toBeInstanceOf(NotFoundError)
    await expect(api.getArticleAnalysis('missing')).rejects.toBeInstanceOf(NotFoundError)
  })
})

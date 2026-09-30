/**
 * 概览 / Overview
 * SigApi 的内存演示实现：数据来自 mockData，状态只存在本次页面会话中（刷新即重置）。
 * 支持模拟延迟、模拟一次失败、模拟后台更新，方便演示与测试各种状态；从不发起网络请求。
 * In-memory demo implementation of SigApi. Data comes from mockData and lives only for this page
 * session. Supports simulated latency, one-shot failures and a simulated background refresh;
 * it never makes network requests.
 *
 * 包含 / Contents
 * - MockApiOptions：可注入的时钟、延迟、更新耗时、初始"上次更新时间"。/ injectable clock and timings.
 * - MockApi：SigApi + configureMock()。
 * - createMockApi(options)：创建实例。/ build an instance.
 *   内部函数 / Internal: simulateLatency、failIfRequested、findArticle、completeRefresh。
 */

import { pickHeadlines } from '../lib/headlines'
import { isWithin24h } from '../lib/freshness'
import type { SigApi } from './api'
import { ApiError, NotFoundError } from './errors'
import { buildDemoAnalysis, buildMockArticles, buildRefreshBatch } from './mockData'
import type { Article, ChatReply, ChatRequest, EventQuery, Feed, RefreshRun } from './types'

const MILLISECONDS_PER_HOUR = 3_600_000
const DEFAULT_LATENCY_MS = 250
const DEFAULT_REFRESH_DURATION_MS = 2_000
/** 默认"上次更新"为 9 小时前，使首次打开时触发一次模拟更新。/ 9h ago so the first open triggers a refresh. */
const DEFAULT_LAST_RUN_HOURS_AGO = 9

export type MockApiMethod = keyof SigApi

export interface MockApiOptions {
  now?: () => Date
  latencyMs?: number
  refreshDurationMs?: number
  /** 初始上次更新时间；undefined 用默认（9 小时前），null 表示从未更新。/ undefined = default, null = never. */
  initialLastRunAt?: string | null
}

export interface MockApi extends SigApi {
  /** 让指定方法的下一次调用失败（startRefresh 为"本次更新以失败结束"）。/ Make the next call fail. */
  configureMock(settings: { failNext: MockApiMethod | null }): void
}

/** 深拷贝，防止调用方修改内部状态 / Deep copy so callers cannot mutate internal state. */
function copy<T>(value: T): T {
  return structuredClone(value)
}

/**
 * 创建演示 API / Create the demo API.
 * 输入 / Input: options（均可选）。/ all optional.
 * 输出 / Output: MockApi 实例，每个实例有独立的内存状态。/ an instance with its own in-memory state.
 */
export function createMockApi(options: MockApiOptions = {}): MockApi {
  const now = options.now ?? (() => new Date())
  const latencyMs = options.latencyMs ?? DEFAULT_LATENCY_MS
  const refreshDurationMs = options.refreshDurationMs ?? DEFAULT_REFRESH_DURATION_MS

  const articles: Article[] = buildMockArticles(now())
  const savedArticleIds: string[] = [] // 按收藏先后顺序 / in save order
  const refreshRuns = new Map<string, RefreshRun>()
  let activeRefreshRunId: string | null = null
  let refreshRunCounter = 0
  let failNextMethod: MockApiMethod | null = null
  let lastRunAt: string | null =
    options.initialLastRunAt === undefined
      ? new Date(now().getTime() - DEFAULT_LAST_RUN_HOURS_AGO * MILLISECONDS_PER_HOUR).toISOString()
      : options.initialLastRunAt

  /** 模拟网络延迟；0 时不经过计时器。/ Simulated latency; 0 skips timers entirely. */
  function simulateLatency(): Promise<void> {
    if (latencyMs <= 0) return Promise.resolve()
    return new Promise((resolve) => setTimeout(resolve, latencyMs))
  }

  /** 若该方法被标记为下次失败，则清除标记并返回 true。/ Consume a pending failure flag. */
  function consumeFailure(method: MockApiMethod): boolean {
    if (failNextMethod !== method) return false
    failNextMethod = null
    return true
  }

  /** 被标记失败时抛出 ApiError。/ Throw ApiError when a failure was requested. */
  function failIfRequested(method: MockApiMethod): void {
    if (consumeFailure(method)) throw new ApiError('模拟失败：请重试')
  }

  /** 按 ID 查文章，找不到抛 NotFoundError。/ Find an article or throw NotFoundError. */
  function findArticle(articleId: string): Article {
    const article = articles.find((item) => item.id === articleId)
    if (article === undefined) throw new NotFoundError(`找不到文章：${articleId}`)
    return article
  }

  /**
   * 完成一次模拟更新 / Finish a simulated refresh.
   * 步骤 / Steps
   * 1. 标记为失败时：状态 failed，写入原因，不改上次更新时间。/ On failure: failed + reason, lastRunAt unchanged.
   * 2. 否则加入尚不存在的新内容（重复更新不会重复加入）。/ Otherwise add items not yet present.
   * 3. 状态 succeeded，记录新增条数，更新上次更新时间。/ Mark succeeded, record count, update lastRunAt.
   */
  function completeRefresh(runId: string, shouldFail: boolean): void {
    const run = refreshRuns.get(runId)
    if (run === undefined) return
    const completedAt = now()
    activeRefreshRunId = null
    if (shouldFail) {
      // 步骤 1 / Step 1
      refreshRuns.set(runId, {
        ...run,
        status: 'failed',
        finishedAt: completedAt.toISOString(),
        errorMessage: '模拟更新失败：内容源暂时不可用',
      })
      return
    }
    const existingIds = new Set(articles.map((item) => item.id)) // 步骤 2 / Step 2
    const newArticles = buildRefreshBatch(completedAt).filter((item) => !existingIds.has(item.id))
    articles.push(...newArticles)
    lastRunAt = completedAt.toISOString() // 步骤 3 / Step 3
    refreshRuns.set(runId, {
      ...run,
      status: 'succeeded',
      finishedAt: lastRunAt,
      newArticleCount: newArticles.length,
    })
  }

  return {
    configureMock(settings) {
      failNextMethod = settings.failNext
    },

    /**
     * 信息流 / Feed.
     * 步骤 / Steps: 1. 新闻与名人动态只保留 24h 内，精选文章全部保留。2. 按发布时间倒序。3. 计算头版。
     * 1. Keep news/people inside 24h, all long reads. 2. Newest first. 3. Compute headlines.
     */
    async getFeed(): Promise<Feed> {
      await simulateLatency()
      failIfRequested('getFeed')
      const currentTime = now()
      const visibleArticles = articles
        .filter((item) => item.type === '精选文章' || isWithin24h(new Date(item.publishedAt), currentTime)) // 步骤 1
        .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)) // 步骤 2
      return copy({
        lastRunAt,
        articles: visibleArticles,
        headlines: pickHeadlines(visibleArticles, currentTime), // 步骤 3
      })
    },

    async getArticle(articleId: string): Promise<Article> {
      await simulateLatency()
      failIfRequested('getArticle')
      return copy(findArticle(articleId))
    },

    async getArticleAnalysis(articleId: string) {
      await simulateLatency()
      failIfRequested('getArticleAnalysis')
      return buildDemoAnalysis(findArticle(articleId))
    },

    async listSaved(): Promise<Article[]> {
      await simulateLatency()
      failIfRequested('listSaved')
      return copy([...savedArticleIds].reverse().map(findArticle))
    },

    /**
     * 收藏 / Save toggle.
     * 步骤 / Steps: 1. 失败标记 → 抛错且不改状态。2. 文章必须存在。3. 加入或移出收藏列表（幂等）。
     */
    async setSaved(articleId: string, saved: boolean): Promise<void> {
      await simulateLatency()
      failIfRequested('setSaved') // 步骤 1 / Step 1
      findArticle(articleId) // 步骤 2 / Step 2
      const existingIndex = savedArticleIds.indexOf(articleId) // 步骤 3 / Step 3
      if (saved && existingIndex === -1) savedArticleIds.push(articleId)
      if (!saved && existingIndex !== -1) savedArticleIds.splice(existingIndex, 1)
    },

    /**
     * 发起更新 / Start a refresh.
     * 步骤 / Steps
     * 1. 已有进行中的更新 → 直接返回它，避免重复。/ Return the running one to avoid duplicates.
     * 2. 新建 running 记录；读取失败标记决定结局。/ Create a running record; the failure flag decides the outcome.
     * 3. refreshDurationMs 后完成。/ Complete after refreshDurationMs.
     */
    async startRefresh(): Promise<RefreshRun> {
      await simulateLatency()
      if (activeRefreshRunId !== null) {
        const activeRun = refreshRuns.get(activeRefreshRunId) // 步骤 1 / Step 1
        if (activeRun !== undefined) return copy(activeRun)
      }
      refreshRunCounter += 1 // 步骤 2 / Step 2
      const run: RefreshRun = {
        id: `refresh-run-${refreshRunCounter}`,
        status: 'running',
        startedAt: now().toISOString(),
        finishedAt: null,
        newArticleCount: 0,
        errorMessage: null,
      }
      const shouldFail = consumeFailure('startRefresh')
      refreshRuns.set(run.id, run)
      activeRefreshRunId = run.id
      setTimeout(() => completeRefresh(run.id, shouldFail), refreshDurationMs) // 步骤 3 / Step 3
      return copy(run)
    },

    async getRefreshStatus(runId: string): Promise<RefreshRun> {
      await simulateLatency()
      failIfRequested('getRefreshStatus')
      const run = refreshRuns.get(runId)
      if (run === undefined) throw new NotFoundError(`找不到更新记录：${runId}`)
      return copy(run)
    },

    async searchEvents(query: EventQuery) {
      await simulateLatency()
      failIfRequested('searchEvents')
      return { status: 'not_connected' as const, query: copy(query) }
    },

    /**
     * 演示对话 / Demo chat.
     * 输出 / Output: 围绕请求上下文的预设回复，明确标注为演示、未连接模型。
     *                A canned reply about the request context, clearly marked as a demo without a model.
     */
    async sendChat(request: ChatRequest): Promise<ChatReply> {
      await simulateLatency()
      failIfRequested('sendChat')
      const intro =
        request.contextRef.kind === 'article'
          ? `我们正在讨论「${request.contextRef.label}」。`
          : `当前关联：${request.contextRef.label}。`
      return {
        content: `${intro}\n\n可以从事实依据、背景和潜在影响三个角度继续展开，并回到原始来源核对。\n\n（演示回复：尚未连接模型。）`,
        isDemo: true,
      }
    },
  }
}

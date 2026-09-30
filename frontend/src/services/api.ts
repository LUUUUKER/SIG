/**
 * 概览 / Overview
 * 数据层接口：列出前端需要的全部数据操作，并导出当前使用的实现。页面只依赖这个接口，
 * 阶段 2 把实现从 mock 换成真实 HTTP 调用时，页面代码不用改。
 * Data-layer contract listing every data operation the UI needs, plus the implementation in use.
 * Pages depend only on this contract, so swapping mock for HTTP in phase 2 needs no page changes.
 *
 * 包含 / Contents
 * - SigApi：接口定义。/ the contract.
 * - api：当前实现（阶段 1 为 createMockApi()）。/ current implementation (mock in phase 1).
 */

import { createMockApi } from './mockApi'
import type {
  Article,
  ArticleAnalysis,
  ChatReply,
  ChatRequest,
  EventQuery,
  EventSearchResult,
  Feed,
  RefreshRun,
} from './types'

export interface SigApi {
  /** 当前信息流：新闻与名人动态限 24h，精选文章不限；附头版。/ Current feed with headlines. */
  getFeed(): Promise<Feed>
  /** 单篇文章（含已超出 24h 的收藏）；不存在抛 NotFoundError。/ One article; NotFoundError if missing. */
  getArticle(articleId: string): Promise<Article>
  /** 深度分析，打开详情时才请求；不存在抛 NotFoundError。/ Lazy deep analysis. */
  getArticleAnalysis(articleId: string): Promise<ArticleAnalysis>
  /** 收藏列表，最近收藏在前。/ Saved articles, most recent first. */
  listSaved(): Promise<Article[]>
  /** 收藏或取消收藏。/ Save or unsave. */
  setSaved(articleId: string, saved: boolean): Promise<void>
  /** 发起后台更新；已有进行中的更新则返回它。/ Start a refresh, or return the one in progress. */
  startRefresh(): Promise<RefreshRun>
  /** 查询更新状态。/ Poll a refresh. */
  getRefreshStatus(runId: string): Promise<RefreshRun>
  /** 搜索活动（阶段 1 返回尚未接入）。/ Search events (not connected in phase 1). */
  searchEvents(query: EventQuery): Promise<EventSearchResult>
  /** 发送聊天消息并取得回复。/ Send a chat message and get the reply. */
  sendChat(request: ChatRequest): Promise<ChatReply>
}

export const api: SigApi = createMockApi()

/**
 * 概览 / Overview
 * 数据类型：前端与数据层（现为 mock，阶段 2 为后端 API）之间约定的对象结构。时间一律用 ISO 字符串，便于 JSON 与本地存储。
 * Data types shared between the UI and the data layer (mock now, backend API from phase 2).
 * Timestamps are ISO strings so they serialize cleanly to JSON and local storage.
 *
 * 包含 / Contents
 * - Source、Article、ArticleAnalysis：内容与来源。/ content and sources.
 * - Feed：一次取回的信息流（上次更新时间、文章、头版）。/ the feed snapshot.
 * - RefreshRun：一次后台更新的状态。/ one background refresh.
 * - EventSearchResult：活动搜索结果（阶段 1 恒为"尚未接入"）。/ event search result.
 * - ContextRef、ChatMessage、ChatRequest、ChatReply：对话相关。/ chat objects.
 * - 重新导出 Domain、ContentType、EventQuery。/ re-exports.
 */

import type { ContentType, Domain } from '../lib/domains'
import type { EventQuery } from '../lib/eventFilters'

export type { ContentType, Domain, EventQuery }

export interface Source {
  url: string
  publisher: string
  title: string
  publishedAt: string
}

export interface Article {
  id: string
  domain: Domain
  type: ContentType
  title: string
  summary: string
  keyPoints: string[]
  publishedAt: string
  /** 本系统首次收录的时间，用于「新」标记。/ When SIG first ingested it; drives the "new" badge. */
  firstSeenAt: string
  /** 同一事件的多篇报道共享一个 ID。/ Shared by all reports of the same event. */
  eventClusterId: string
  /** 该事件最近一次重大进展的时间，用于「更新」标记。/ Latest major development; drives "update". */
  latestDevelopmentAt: string
  /** 头版排序用的重要度，越大越重要。/ Importance for headline ranking; higher is more important. */
  importanceScore: number
  readingMinutes: number
  sources: Source[]
  /** 演示内容标记；真实数据为 false。/ Demo marker; false for real data. */
  isDemo: boolean
}

export interface ArticleAnalysis {
  articleId: string
  analysis: string
  openQuestions: string
  isDemo: boolean
}

export interface Feed {
  lastRunAt: string | null
  articles: Article[]
  headlines: Article[]
}

export type RefreshRunStatus = 'running' | 'succeeded' | 'failed'

export interface RefreshRun {
  id: string
  status: RefreshRunStatus
  startedAt: string
  finishedAt: string | null
  newArticleCount: number
  errorMessage: string | null
}

export interface EventSearchResult {
  status: 'not_connected'
  query: EventQuery
}

export type ContextKind = 'feed' | 'article' | 'events'

export interface ContextRef {
  kind: ContextKind
  /** 文章 ID；非文章上下文为 null。/ Article id; null for non-article contexts. */
  id: string | null
  label: string
}

export type ChatRole = 'user' | 'assistant'

export interface ChatMessage {
  id: string
  role: ChatRole
  content: string
  contextRef: ContextRef
  createdAt: string
  isDemo: boolean
}

export interface ChatRequest {
  text: string
  contextRef: ContextRef
}

export interface ChatReply {
  content: string
  isDemo: boolean
}

/**
 * 概览 / Overview
 * TanStack Query 钩子：页面读取与修改数据的唯一入口。加载中、失败、重试、缓存都由 TanStack Query 管理。
 * TanStack Query hooks: the only way pages read or change data. Loading, errors, retries and caching
 * are handled by TanStack Query.
 *
 * 包含 / Contents
 * - queryKeys：缓存键。/ cache keys.
 * - REFRESH_POLL_MS：更新进行中的轮询间隔。/ polling interval while a refresh runs.
 * - useFeed()、useArticle(id)、useArticleAnalysis(id)、useSaved()：读取。/ reads.
 * - useToggleSaved()：收藏（先改界面，失败回滚）；提示条由 features/feed/useSaveToggle 负责，数据层不依赖状态层。
 *   Optimistic save with rollback; toasts live in features/feed/useSaveToggle so services never import state.
 * - useStartRefresh()、useRefreshRun(runId)：发起更新与轮询状态。/ start and poll a refresh.
 * - useEventSearch(query)：活动搜索（query 为 null 时不请求）。/ event search, disabled when null.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useApi } from './apiContext'
import type { Article, EventQuery } from './types'

export const REFRESH_POLL_MS = 1_000

export const queryKeys = {
  feed: ['feed'] as const,
  article: (articleId: string) => ['article', articleId] as const,
  analysis: (articleId: string) => ['analysis', articleId] as const,
  saved: ['saved'] as const,
  refreshRun: (runId: string | null) => ['refreshRun', runId] as const,
  events: (query: EventQuery | null) => ['events', query] as const,
}

/** 信息流 / Feed. */
export function useFeed() {
  const api = useApi()
  return useQuery({ queryKey: queryKeys.feed, queryFn: () => api.getFeed() })
}

/** 单篇文章 / One article. */
export function useArticle(articleId: string) {
  const api = useApi()
  return useQuery({
    queryKey: queryKeys.article(articleId),
    queryFn: () => api.getArticle(articleId),
  })
}

/** 深度分析（进入详情才请求）/ Deep analysis, requested only on the detail page. */
export function useArticleAnalysis(articleId: string) {
  const api = useApi()
  return useQuery({
    queryKey: queryKeys.analysis(articleId),
    queryFn: () => api.getArticleAnalysis(articleId),
  })
}

/** 收藏列表 / Saved articles. */
export function useSaved() {
  const api = useApi()
  return useQuery({ queryKey: queryKeys.saved, queryFn: () => api.listSaved() })
}

interface ToggleSavedVariables {
  article: Article
  saved: boolean
}

/**
 * 收藏切换 / Toggle saved.
 * 输出 / Output: useMutation；调用 mutate({ article, saved })。
 * 步骤 / Steps
 * 1. onMutate：暂停收藏列表的请求，记下旧列表，立即把界面改成目标状态（乐观更新）。
 *    Pause saved-list fetches, snapshot it, and apply the target state immediately.
 * 2. mutationFn：调用 api.setSaved。/ Call api.setSaved.
 * 3. onError：恢复旧列表。/ Restore the snapshot.
 * 4. onSettled：触发重新获取收藏列表但不等待它完成——若返回该 Promise，调用方的 onSuccess / onError
 *    （提示条）会被推迟到重新获取结束之后。
 *    Trigger a saved-list refetch without awaiting it; returning the promise would delay the caller's
 *    onSuccess / onError (toasts) until the refetch finishes.
 */
export function useToggleSaved() {
  const api = useApi()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ article, saved }: ToggleSavedVariables) => api.setSaved(article.id, saved), // 步骤 2
    onMutate: async ({ article, saved }: ToggleSavedVariables) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.saved }) // 步骤 1 / Step 1
      const previousSaved = queryClient.getQueryData<Article[]>(queryKeys.saved)
      queryClient.setQueryData<Article[]>(queryKeys.saved, (current = []) => {
        const withoutArticle = current.filter((item) => item.id !== article.id)
        return saved ? [article, ...withoutArticle] : withoutArticle
      })
      return { previousSaved }
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(queryKeys.saved, context?.previousSaved) // 步骤 3 / Step 3
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.saved }) // 步骤 4 / Step 4
    },
  })
}

/** 发起后台更新 / Start a background refresh. */
export function useStartRefresh() {
  const api = useApi()
  return useMutation({ mutationFn: () => api.startRefresh() })
}

/**
 * 更新状态 / Refresh run status.
 * 输入 / Input: runId；null 时不请求。/ null disables the query.
 * 输出 / Output: useQuery；状态为 running 时每秒轮询一次，结束后停止。
 *                Polls every second while running and stops afterwards.
 */
export function useRefreshRun(runId: string | null) {
  const api = useApi()
  return useQuery({
    queryKey: queryKeys.refreshRun(runId),
    queryFn: () => api.getRefreshStatus(runId as string),
    enabled: runId !== null,
    staleTime: 0,
    refetchInterval: (query) => (query.state.data?.status === 'running' ? REFRESH_POLL_MS : false),
  })
}

/**
 * 活动搜索 / Event search.
 * 输入 / Input: query；null（尚未提交）时不请求。/ null (not submitted yet) disables it.
 */
export function useEventSearch(query: EventQuery | null) {
  const api = useApi()
  return useQuery({
    queryKey: queryKeys.events(query),
    queryFn: () => api.searchEvents(query as EventQuery),
    enabled: query !== null,
  })
}

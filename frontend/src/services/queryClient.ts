/**
 * 概览 / Overview
 * TanStack Query 客户端配置：数据缓存与重试策略。窗口重新获得焦点时不自动刷新，避免信息流在阅读中跳动。
 * TanStack Query client settings. No refetch on window focus, so the feed never shifts while reading.
 *
 * 包含 / Contents
 * - createQueryClient({ retry })：应用默认失败重试 1 次，但"找不到"（NotFoundError）从不重试；
 *   测试传 retry: false 让失败立即可见。重试规则只在这里定义，查询钩子不单独覆盖。
 *   The app retries failures once but never NotFoundError; tests pass retry: false. The retry rule
 *   lives only here; query hooks never override it.
 */
import { QueryClient } from '@tanstack/react-query'
import { NotFoundError } from './errors'

interface QueryClientOptions {
  retry?: false
}

/**
 * 创建查询客户端 / Create a query client.
 * 输入 / Input: options.retry —— 传 false 关闭重试。/ pass false to disable retries.
 * 输出 / Output: QueryClient —— 数据 1 分钟内视为新鲜，窗口聚焦不重新获取。
 *                data is fresh for one minute; no refetch on focus.
 */
export function createQueryClient(options: QueryClientOptions = {}): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        refetchOnWindowFocus: false,
        retry:
          options.retry === false
            ? false
            : (failureCount, error) => !(error instanceof NotFoundError) && failureCount < 1,
      },
      mutations: { retry: false },
    },
  })
}

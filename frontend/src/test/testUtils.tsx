/**
 * 概览 / Overview
 * 测试辅助：模拟 matchMedia（jsdom 没有实现）、把全局 store 恢复为初始状态、用全新的 mock API 与
 * QueryClient 渲染完整应用或单个组件，避免测试之间共享数据。
 * Test helpers: a matchMedia stub (missing in jsdom), resetting global stores, and rendering the app
 * or a component with a fresh mock API and QueryClient so tests never share data.
 *
 * 包含 / Contents
 * - setViewportMatches(matches)：让所有媒体查询返回指定结果（true = 桌面）。/ make media queries match or not.
 * - resetStores()：清空 localStorage、滚动记忆，并恢复 ui / chat / toast / refresh store。
 * - createTestApi(options)：无延迟、上次更新为"刚刚"（不触发自动更新）的 mock API。
 *   A zero-latency mock API whose last refresh is "now", so auto-refresh does not fire.
 * - TestProviders：QueryClient + ApiContext。/ providers for component tests.
 * - renderApp(initialEntry, options)：用内存路由渲染 appRoutes，返回 router 与 api。
 */
import { QueryClientProvider, type QueryClient } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import type { ReactNode } from 'react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { appRoutes } from '../app/router'
import { clearScrollMemory } from '../features/feed/useScrollMemory'
import type { SigApi } from '../services/api'
import { ApiContext } from '../services/apiContext'
import { createMockApi, type MockApi, type MockApiOptions } from '../services/mockApi'
import { createQueryClient } from '../services/queryClient'
import { chatSessionStore } from '../state/chatSessionStore'
import { refreshStore } from '../state/refreshStore'
import { toastStore } from '../state/toastStore'
import { uiStore } from '../state/uiStore'

/**
 * 模拟视口 / Stub the viewport.
 * 输入 / Input: matches —— 所有 matchMedia 查询的结果。/ result for every matchMedia query.
 */
export function setViewportMatches(matches: boolean): void {
  window.matchMedia = (query: string) =>
    ({
      matches,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList
}

/** 恢复全局 store 与本地存储 / Reset global stores and local storage. */
export function resetStores(): void {
  localStorage.clear()
  clearScrollMemory()
  uiStore.setState(uiStore.getInitialState(), true)
  chatSessionStore.setState(chatSessionStore.getInitialState(), true)
  refreshStore.setState(refreshStore.getInitialState(), true)
  toastStore.getState().dismissToast()
}

/**
 * 测试用 API / Test API.
 * 输入 / Input: options —— 覆盖默认值（例如 initialLastRunAt 设为 9 小时前以测试自动更新）。
 * 输出 / Output: MockApi；默认无延迟，上次更新为当前时刻。/ zero latency, last run = now by default.
 */
export function createTestApi(options: MockApiOptions = {}): MockApi {
  return createMockApi({ latencyMs: 0, initialLastRunAt: new Date().toISOString(), ...options })
}

interface TestProvidersProps {
  api: SigApi
  queryClient: QueryClient
  children: ReactNode
}

/** 测试 Provider / Test providers. */
export function TestProviders({ api, queryClient, children }: TestProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <ApiContext.Provider value={api}>{children}</ApiContext.Provider>
    </QueryClientProvider>
  )
}

interface RenderAppOptions {
  api?: MockApi
}

/**
 * 渲染应用 / Render the app.
 * 输入 / Input: initialEntry —— 初始地址，默认 "/"；options.api —— 自定义 mock API。
 * 输出 / Output: render 结果、router（可读 router.state.location）与 api。
 */
export function renderApp(initialEntry = '/', options: RenderAppOptions = {}) {
  const api = options.api ?? createTestApi()
  const queryClient = createQueryClient({ retry: false })
  const router = createMemoryRouter(appRoutes, { initialEntries: [initialEntry] })
  const view = render(
    <TestProviders api={api} queryClient={queryClient}>
      <RouterProvider router={router} />
    </TestProviders>,
  )
  return { ...view, router, api, queryClient }
}

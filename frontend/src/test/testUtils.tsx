/**
 * 概览 / Overview
 * 测试辅助：模拟 matchMedia（jsdom 没有实现）、把全局 store 恢复为初始状态、渲染完整应用路由。
 * Test helpers: a matchMedia stub (missing in jsdom), resetting global stores, rendering the app router.
 *
 * 包含 / Contents
 * - setViewportMatches(matches)：让所有媒体查询返回指定结果（true = 桌面）。/ make media queries match or not.
 * - resetStores()：清空 localStorage，并把 uiStore / chatSessionStore / toastStore 恢复初始值。
 * - renderApp(initialEntry)：用内存路由渲染 appRoutes，返回 router 以便断言地址。/ render appRoutes in memory.
 */
import { render } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { appRoutes } from '../app/router'
import { chatSessionStore } from '../state/chatSessionStore'
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
  uiStore.setState(uiStore.getInitialState(), true)
  chatSessionStore.setState(chatSessionStore.getInitialState(), true)
  toastStore.getState().dismissToast()
}

/**
 * 渲染应用 / Render the app.
 * 输入 / Input: initialEntry —— 初始地址，默认 "/"。/ initial URL, default "/".
 * 输出 / Output: render 结果与 router（可读 router.state.location）。/ render result plus the router.
 */
export function renderApp(initialEntry = '/') {
  const router = createMemoryRouter(appRoutes, { initialEntries: [initialEntry] })
  const view = render(<RouterProvider router={router} />)
  return { ...view, router }
}

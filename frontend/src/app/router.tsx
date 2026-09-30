/**
 * 概览 / Overview
 * 路由表：所有页面都挂在 AppShell 下。1b 阶段各页面为占位，1c 替换为真实页面。
 * Route table: every page renders inside AppShell. Pages are placeholders in 1b, replaced in 1c.
 *
 * 包含 / Contents
 * - appRoutes：路由配置（测试用 createMemoryRouter 复用）。/ route config, reused by tests.
 * - createAppRouter()：浏览器路由实例。/ the browser router.
 */
import { createBrowserRouter, type RouteObject } from 'react-router'
import { AppShell } from './AppShell'
import { DomainPlaceholder, PlaceholderPage } from './PlaceholderPage'

export const appRoutes: RouteObject[] = [
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <PlaceholderPage title="为你精选" /> },
      { path: 'domain/:domain', element: <DomainPlaceholder /> },
      { path: 'article/:articleId', element: <PlaceholderPage title="文章详情" /> },
      { path: 'saved', element: <PlaceholderPage title="稍后阅读" /> },
      { path: 'events', element: <PlaceholderPage title="近期活动" /> },
      { path: '*', element: <PlaceholderPage title="页面不存在" /> },
    ],
  },
]

/**
 * 浏览器路由 / Browser router.
 * 输出 / Output: 基于 appRoutes 的 createBrowserRouter 实例。/ a browser router over appRoutes.
 */
export function createAppRouter() {
  return createBrowserRouter(appRoutes)
}

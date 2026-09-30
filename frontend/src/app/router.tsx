/**
 * 概览 / Overview
 * 路由表：所有页面都挂在 AppShell 下。
 * Route table: every page renders inside AppShell.
 *
 * 包含 / Contents
 * - appRoutes：路由配置（测试用 createMemoryRouter 复用）。/ route config, reused by tests.
 * - createAppRouter()：浏览器路由实例。/ the browser router.
 */
import { createBrowserRouter, type RouteObject } from 'react-router'
import { ArticlePage } from '../features/articles/ArticlePage'
import { EventPage } from '../features/events/EventPage'
import { FeedPage } from '../features/feed/FeedPage'
import { NotFoundPage } from '../features/notFound/NotFoundPage'
import { SavedPage } from '../features/saved/SavedPage'
import { AppShell } from './AppShell'

export const appRoutes: RouteObject[] = [
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <FeedPage /> },
      { path: 'domain/:domain', element: <FeedPage /> },
      { path: 'article/:articleId', element: <ArticlePage /> },
      { path: 'saved', element: <SavedPage /> },
      { path: 'events', element: <EventPage /> },
      { path: '*', element: <NotFoundPage /> },
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

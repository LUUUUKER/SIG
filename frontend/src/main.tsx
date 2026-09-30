/**
 * 概览 / Overview
 * 前端入口：加载全局样式，提供 TanStack Query 客户端，挂载路由。数据实现来自 services/api.ts 的默认 api
 * （阶段 1 为演示数据）。
 * Frontend entry: load global styles, provide the TanStack Query client and mount the router.
 * Data comes from the default api in services/api.ts (demo data in phase 1).
 */
import { QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router/dom'
import { createAppRouter } from './app/router'
import { createQueryClient } from './services/queryClient'
import './styles/tokens.css'
import './styles/base.css'

const router = createAppRouter()
const queryClient = createQueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
)

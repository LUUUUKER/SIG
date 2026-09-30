/**
 * 概览 / Overview
 * 前端入口：加载全局样式，挂载路由。1c 会在这里加上 TanStack Query 的 QueryClientProvider。
 * Frontend entry: load global styles and mount the router. 1c adds QueryClientProvider here.
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router/dom'
import { createAppRouter } from './app/router'
import './styles/tokens.css'
import './styles/base.css'

const router = createAppRouter()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)

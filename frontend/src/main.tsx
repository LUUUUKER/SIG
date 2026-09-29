/**
 * 概览 / Overview
 * 前端入口：把根组件挂载到 index.html 的 #root。阶段 1 会在这里加上 QueryClient 与 Router。
 * Frontend entry: mount the root component into #root. Phase 1 adds QueryClient and Router here.
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

/**
 * 概览 / Overview
 * Vite 构建与 Vitest 测试的统一配置。
 * Shared configuration for the Vite dev/build pipeline and Vitest.
 *
 * - plugins：启用 React（JSX、热更新）。/ Enable React (JSX, fast refresh).
 * - server.proxy：开发时把 /api 转发给本地后端 8000 端口，前端代码只写相对路径。
 *   Forward /api to the local backend on :8000 during development, so the app uses relative URLs.
 * - test：Vitest 使用 jsdom 模拟浏览器；只收集 src 下的 *.test.ts(x)，e2e 交给 Playwright。
 *   Vitest runs in jsdom and only collects src/**\/*.test.ts(x); e2e belongs to Playwright.
 */
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://127.0.0.1:8000',
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
})

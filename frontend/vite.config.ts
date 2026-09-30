/**
 * 概览 / Overview
 * Vite 构建与 Vitest 测试的统一配置。
 * Shared configuration for the Vite dev/build pipeline and Vitest.
 *
 * - plugins：启用 React；themeBootPlugin 把 bootTheme 内联进 <head>，首屏前设置主题，避免闪烁。
 *   React, plus themeBootPlugin which inlines bootTheme into <head> to set the theme before first paint.
 * - server.proxy：开发时把 /api 转发给本地后端 8000 端口，前端代码只写相对路径。
 *   Forward /api to the local backend on :8000 during development, so the app uses relative URLs.
 * - test：Vitest 使用 jsdom 模拟浏览器；只收集 src 下的 *.test.ts(x)，e2e 交给 Playwright。
 *   Vitest runs in jsdom and only collects src/**\/*.test.ts(x); e2e belongs to Playwright.
 *
 * 包含 / Contents
 * - themeBootPlugin()：transformIndexHtml 钩子，在 </head> 前插入内联脚本。/ injects the inline script.
 */
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vitest/config'
import { bootTheme } from './src/lib/themeBoot.ts'

/**
 * 首屏主题插件 / First-paint theme plugin.
 * 输出 / Output: Vite 插件；开发与构建时都会把脚本放进 HTML。访问 localStorage 本身可能抛错，
 * 因此在外层 try 中取得后再传入。
 * A Vite plugin used in dev and build. Accessing localStorage may throw, so it is fetched in a try first.
 */
function themeBootPlugin(): Plugin {
  const inlineScript =
    `(function(){var storage=null;try{storage=window.localStorage}catch(e){}` +
    `(${bootTheme.toString()})(storage,new Date(),document.documentElement)})()`
  return {
    name: 'sig-theme-boot',
    transformIndexHtml: (html) => html.replace('</head>', `  <script>${inlineScript}</script>\n  </head>`),
  }
}

export default defineConfig({
  plugins: [react(), themeBootPlugin()],
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

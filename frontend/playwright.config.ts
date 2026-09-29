/**
 * 概览 / Overview
 * Playwright 端到端测试配置。运行时自动启动 Vite 开发服务器（已在运行则复用）。
 * Playwright end-to-end config. Starts the Vite dev server automatically (reuses a running one).
 *
 * - testDir：e2e/ 目录。/ tests live in e2e/.
 * - projects：阶段 0 只用桌面 Chromium；阶段 1 加入 1440×900、1920×1080、1024×768、768×1024、390×844。
 *   Phase 0 uses desktop Chromium only; phase 1 adds the five acceptance viewports.
 */
import { defineConfig, devices } from '@playwright/test'

const DEV_SERVER_URL = 'http://127.0.0.1:5173'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: DEV_SERVER_URL,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'pnpm dev --host 127.0.0.1 --strictPort',
    url: DEV_SERVER_URL,
    reuseExistingServer: true,
  },
})

/**
 * 概览 / Overview
 * Playwright 端到端测试配置。运行时自动启动 Vite 开发服务器（已在运行则复用）。
 * Playwright end-to-end config. Starts the Vite dev server automatically (reuses a running one).
 *
 * 项目 / Projects
 * - desktop-chromium：冒烟与首屏主题（smoke、themeBoot），只在一个尺寸上跑。/ smoke and theme boot, one size.
 * - 1440、1920、1024、768、390：视觉与布局验收（visual.spec.ts，V1–V12），五种尺寸各跑一遍；
 *   只适用于桌面或窄屏的用例在用例内按宽度跳过。
 *   Visual/layout acceptance (V1–V12) at five sizes; desktop- or narrow-only cases skip by width.
 */
import { defineConfig, devices } from '@playwright/test'

const DEV_SERVER_URL = 'http://127.0.0.1:5173'

const VIEWPORTS = [
  { name: 'desktop-1440', width: 1440, height: 900 },
  { name: 'desktop-1920', width: 1920, height: 1080 },
  { name: 'desktop-1024', width: 1024, height: 768 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'mobile-390', width: 390, height: 844 },
]

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: DEV_SERVER_URL,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'desktop-chromium',
      testMatch: /(smoke|themeBoot)\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    ...VIEWPORTS.map(({ name, width, height }) => ({
      name,
      testMatch: /visual\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], viewport: { width, height } },
    })),
  ],
  webServer: {
    command: 'pnpm dev --host 127.0.0.1 --strictPort',
    url: DEV_SERVER_URL,
    reuseExistingServer: true,
  },
})

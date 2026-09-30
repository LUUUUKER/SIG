/**
 * 概览 / Overview
 * 端到端测试 V13：只靠 <head> 里的内联脚本（屏蔽掉 React 应用脚本）也能设置正确主题，证明首屏前已生效。
 * E2E test V13: the inline <head> script alone (with the React bundle blocked) sets the right theme,
 * proving it applies before the app renders.
 */
import { expect, test } from '@playwright/test'

test('V13: inline boot script sets the theme before the app bundle runs', async ({ page }) => {
  // 热更新后 Vite 会给入口加 ?t=时间戳，因此用正则同时匹配带参数的地址。
  // After HMR Vite serves the entry as main.tsx?t=<timestamp>, so match with or without a query.
  await page.route(/\/src\/main\.tsx(\?.*)?$/, (route) => route.abort())

  // 洛杉矶 20:00，自动模式 → 深色 / LA 20:00 in auto mode → dark
  await page.clock.setFixedTime(new Date('2026-01-16T04:00:00Z'))
  await page.goto('/')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')

  // 已保存"浅色" → 即使在夜间也是浅色 / saved "light" wins at night
  await page.evaluate(() =>
    localStorage.setItem('sig-ui', JSON.stringify({ state: { themeMode: 'light' }, version: 1 })),
  )
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  await expect(page.getByRole('link', { name: 'SIG 首页' })).toHaveCount(0) // 应用确实没有运行 / app did not run
})

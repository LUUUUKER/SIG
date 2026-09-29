/**
 * 概览 / Overview
 * 端到端冒烟测试 F2：在真实浏览器打开开发服务器，页面标题含 SIG，品牌可见。
 * E2E smoke test F2: the dev server opens in a real browser, the title contains SIG and the brand is visible.
 */
import { expect, test } from '@playwright/test'

test('F2: dev server serves the SIG page', async ({ page }) => {
  await page.goto('/')

  await expect(page).toHaveTitle(/SIG/)
  await expect(page.getByRole('heading', { name: 'SIG' })).toBeVisible()
})

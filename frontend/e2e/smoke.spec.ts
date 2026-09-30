/**
 * 概览 / Overview
 * 端到端冒烟测试 F2：在真实浏览器打开开发服务器，页面标题含 SIG，品牌可见。
 * E2E smoke test F2: the dev server opens in a real browser, the title contains SIG and the brand is visible.
 * 1b 起品牌是页眉里的链接（名称"SIG 首页"），不再是标题。/ Since 1b the brand is a header link, not a heading.
 */
import { expect, test } from '@playwright/test'

test('F2: dev server serves the SIG page', async ({ page }) => {
  await page.goto('/')

  await expect(page).toHaveTitle(/SIG/)
  await expect(page.getByRole('link', { name: 'SIG 首页' })).toBeVisible()
})

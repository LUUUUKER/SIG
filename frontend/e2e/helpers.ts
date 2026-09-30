/**
 * 概览 / Overview
 * 端到端测试辅助：打开页面并等内容就绪、判断桌面 / 窄屏、确保助手打开、读取元素几何信息。
 * E2E helpers: open a page and wait for content, desktop/narrow checks, open the assistant, geometry.
 *
 * 包含 / Contents
 * - DESKTOP_MIN_WIDTH：桌面断点 951px。/ desktop breakpoint.
 * - isDesktop(page)：当前视口是否桌面。/ whether the viewport is desktop.
 * - openApp(page, path)：打开页面并等待品牌出现；列表页再等第一张卡片。/ open and wait for content.
 * - ensureChatOpen(page)：助手未打开时点页眉开关。/ open the assistant if needed.
 * - boxOf(locator)：元素的边界框（不存在时报错）。/ bounding box or throw.
 */
import { expect, type Locator, type Page } from '@playwright/test'

export const DESKTOP_MIN_WIDTH = 951

/** 是否桌面视口 / Whether the viewport is desktop-sized. */
export function isDesktop(page: Page): boolean {
  return (page.viewportSize()?.width ?? 0) >= DESKTOP_MIN_WIDTH
}

/**
 * 打开页面 / Open a page.
 * 输入 / Input: page、path、options.waitForCards（列表页等待第一张卡片）。
 */
export async function openApp(page: Page, path: string, options: { waitForCards?: boolean } = {}): Promise<void> {
  await page.goto(path)
  await expect(page.getByRole('link', { name: 'SIG 首页' })).toBeVisible()
  if (options.waitForCards) {
    await expect(page.getByRole('button', { name: /^(收藏文章|取消收藏)$/ }).first()).toBeVisible()
  }
}

/** 页眉助手开关 / The header assistant toggle. */
export function chatToggle(page: Page): Locator {
  return page.locator('#chat-toggle')
}

/** 确保助手打开 / Make sure the assistant is open. */
export async function ensureChatOpen(page: Page): Promise<void> {
  if ((await chatToggle(page).getAttribute('aria-expanded')) !== 'true') await chatToggle(page).click()
  await expect(page.locator('#chat')).toBeVisible()
}

/** 边界框 / Bounding box, throwing when the element has none. */
export async function boxOf(locator: Locator): Promise<{ x: number; y: number; width: number; height: number }> {
  const box = await locator.boundingBox()
  if (box === null) throw new Error('element has no bounding box')
  return box
}

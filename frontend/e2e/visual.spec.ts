/**
 * 概览 / Overview
 * 视觉与布局验收 V1–V12：在 1440×900、1920×1080、1024×768、768×1024、390×844 五种尺寸各跑一遍
 * （项目见 playwright.config.ts）。只适用于桌面或窄屏的用例按视口宽度跳过。
 * V10 只生成新版与原型的对比截图供人工检查，不判定通过或失败。
 * Visual/layout acceptance V1–V12 at five viewport sizes. Desktop- or narrow-only cases skip by width.
 * V10 only produces new-vs-prototype screenshots for manual review; it never fails on differences.
 */
import { expect, test, type Page } from '@playwright/test'
import { boxOf, chatToggle, ensureChatOpen, isDesktop, openApp } from './helpers.ts'

const PROTOTYPE_URL = new URL('../../sig-handoff/prototype/index.html', import.meta.url).href
const SCREENSHOT_DIR = new URL('./screenshots/', import.meta.url).pathname
const ROUTES = ['/', '/domain/AI', '/article/news-ai-agents', '/saved', '/events', '/nope']

/** 页面是否有横向溢出 / Whether the page overflows horizontally. */
async function hasHorizontalOverflow(page: Page): Promise<boolean> {
  return page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
}

/** 当前主题 / Current data-theme. */
async function currentTheme(page: Page): Promise<string | null> {
  return page.locator('html').getAttribute('data-theme')
}

test('V1: header and assistant header bottoms align within 1px on desktop', async ({ page }) => {
  test.skip(!isDesktop(page), 'desktop only')
  await openApp(page, '/', { waitForCards: true })

  const headerBox = await boxOf(page.locator('header').first())
  const chatHeadBox = await boxOf(page.locator('#chat > div').first())

  expect(Math.abs(headerBox.y + headerBox.height - (chatHeadBox.y + chatHeadBox.height))).toBeLessThanOrEqual(1)
})

test('V2: no page overflows horizontally', async ({ page }) => {
  for (const route of ROUTES) {
    await openApp(page, route)
    await page.waitForLoadState('networkidle')
    expect(await hasHorizontalOverflow(page), route).toBe(false)
  }
})

test('V3: on narrow screens the header toggle stays reachable; backdrop and Esc close the panel', async ({ page }) => {
  test.skip(isDesktop(page), 'narrow only')
  await openApp(page, '/', { waitForCards: true })

  await chatToggle(page).click()
  await expect(page.locator('#chat')).toBeVisible()
  const toggleBox = await boxOf(chatToggle(page))
  const hitIsToggle = await page.evaluate(
    ({ x, y }) => document.elementFromPoint(x, y)?.closest('#chat-toggle') !== null,
    { x: toggleBox.x + toggleBox.width / 2, y: toggleBox.y + toggleBox.height / 2 },
  )
  expect(hitIsToggle).toBe(true)

  const headerBox = await boxOf(page.locator('header').first())
  await page.mouse.click(2, headerBox.y + headerBox.height + 40)
  await expect(page.locator('#chat')).toBeHidden()

  await chatToggle(page).click()
  await page.getByRole('textbox', { name: '向 sig 提问' }).focus()
  await page.keyboard.press('Escape')
  await expect(page.locator('#chat')).toBeHidden()
  await expect(chatToggle(page)).toBeFocused()
})

test('V4: hiding the assistant widens the centre, keeps the carousel aligned and the draft', async ({ page }) => {
  test.skip(!isDesktop(page), 'desktop only')
  await openApp(page, '/', { waitForCards: true })
  await page.getByRole('button', { name: '查看GitHub头版' }).click()
  await page.getByRole('textbox', { name: '向 sig 提问' }).fill('草稿不应丢失')
  const mainWidthBefore = (await boxOf(page.locator('#main-content'))).width

  await chatToggle(page).click()
  await expect(page.locator('#chat')).toBeHidden()
  const mainWidthAfter = (await boxOf(page.locator('#main-content'))).width
  expect(mainWidthAfter).toBeGreaterThan(mainWidthBefore + 250)

  await expect
    .poll(() =>
      page.evaluate(() => {
        const track = document.querySelector('[aria-roledescription="轮播"] > div') as HTMLElement
        return Math.abs(track.scrollLeft - 2 * track.clientWidth)
      }),
    )
    .toBeLessThanOrEqual(1)
  await expect(page.getByTestId('headline-count')).toContainText('03 /')

  await chatToggle(page).click()
  await expect(page.getByRole('textbox', { name: '向 sig 提问' })).toHaveValue('草稿不应丢失')
})

test('V5: on desktop scrolling the centre keeps the header and sidebar in place', async ({ page }) => {
  test.skip(!isDesktop(page), 'desktop only')
  await openApp(page, '/', { waitForCards: true })
  const headerBefore = await boxOf(page.locator('header').first())
  const sidebarBefore = await boxOf(page.getByRole('complementary', { name: '导航' }))

  const mainBox = await boxOf(page.locator('#main-content'))
  await page.mouse.move(mainBox.x + mainBox.width / 2, mainBox.y + mainBox.height / 2)
  await page.mouse.wheel(0, 900)

  await expect.poll(() => page.locator('#main-content').evaluate((element) => element.scrollTop)).toBeGreaterThan(0)
  expect(await page.evaluate(() => window.scrollY)).toBe(0)
  expect(await boxOf(page.locator('header').first())).toEqual(headerBefore)
  expect(await boxOf(page.getByRole('complementary', { name: '导航' }))).toEqual(sidebarBefore)
})

test('V6: the composer grows to 144px, then scrolls, and shrinks after sending', async ({ page }) => {
  await openApp(page, '/', { waitForCards: true })
  await ensureChatOpen(page)
  const composer = page.getByRole('textbox', { name: '向 sig 提问' })

  await composer.fill('一行')
  expect((await boxOf(composer)).height).toBeLessThanOrEqual(27)

  await composer.fill(Array.from({ length: 12 }, (_, index) => `第 ${index + 1} 行`).join('\n'))
  expect(Math.round((await boxOf(composer)).height)).toBe(144)
  expect(await composer.evaluate((element) => getComputedStyle(element).overflowY)).toBe('auto')

  await composer.press('Enter')
  await expect(composer).toHaveValue('')
  expect((await boxOf(composer)).height).toBeLessThanOrEqual(27)
})

test('V7: at 390px the horizontal nav still offers 稍后阅读 and 近期活动', async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 0) > 600, 'phone width only')
  await openApp(page, '/')

  const navigation = page.getByRole('navigation', { name: 'MY EDITION' })
  await expect(navigation.getByRole('link', { name: '稍后阅读' })).toBeVisible()
  await expect(navigation.getByRole('link', { name: '近期活动' })).toBeVisible()
  expect(await hasHorizontalOverflow(page)).toBe(false)
})

test('V8: auto theme follows LA time (10:00 light, 20:00 dark)', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-01-15T18:00:00Z')) // LA 10:00
  await openApp(page, '/')
  expect(await currentTheme(page)).toBe('light')

  await page.clock.setFixedTime(new Date('2026-01-16T04:00:00Z')) // LA 20:00
  await page.reload()
  await expect(page.getByRole('link', { name: 'SIG 首页' })).toBeVisible()
  expect(await currentTheme(page)).toBe('dark')
})

test('V9: with reduced motion the carousel does not auto-advance', async ({ page }) => {
  test.skip(test.info().project.name !== 'desktop-1440', 'timing test runs on one size only')
  test.setTimeout(30_000)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await openApp(page, '/', { waitForCards: true })
  await expect(page.getByTestId('headline-count')).toContainText('01 /')

  await page.waitForTimeout(9_000)
  await expect(page.getByTestId('headline-count')).toContainText('01 /')
  await expect(page.getByRole('button', { name: '开始自动播放' })).toBeVisible()
})

test('V10: capture new-vs-prototype screenshots for manual review (light and dark)', async ({ page }) => {
  test.setTimeout(60_000)
  const projectName = test.info().project.name

  for (const theme of ['light', 'dark'] as const) {
    await page.goto('/')
    await page.evaluate((mode) => {
      localStorage.setItem('sig-ui', JSON.stringify({ state: { themeMode: mode }, version: 1 }))
    }, theme)
    await openApp(page, '/', { waitForCards: true })
    await page.getByRole('button', { name: '暂停自动播放' }).click()
    await page.screenshot({ path: `${SCREENSHOT_DIR}${projectName}-new-${theme}.png` })

    await page.goto(PROTOTYPE_URL)
    if (theme === 'dark') await page.getByRole('button', { name: '晚报' }).click()
    await page.getByRole('button', { name: '暂停自动播放' }).click()
    await page.screenshot({ path: `${SCREENSHOT_DIR}${projectName}-prototype-${theme}.png` })
  }
})

test('V11: no console errors on any page', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('pageerror', (error) => errors.push(error.message))

  for (const route of ROUTES) {
    await openApp(page, route)
    await page.waitForLoadState('networkidle')
  }

  expect(errors).toEqual([])
})

test('V12: chat history survives a reload and can be reopened', async ({ page }) => {
  await openApp(page, '/', { waitForCards: true })
  await ensureChatOpen(page)
  await page.getByRole('button', { name: /今天最值得深读的是什么/ }).click()
  await expect(page.locator('#chat').getByText('（演示回复：尚未连接模型。）', { exact: false })).toBeVisible()

  await page.reload()
  await expect(page.getByRole('link', { name: 'SIG 首页' })).toBeVisible()
  await ensureChatOpen(page)
  await page.getByRole('button', { name: '新对话' }).click()
  await page.getByRole('button', { name: '对话历史' }).click()
  await page.getByRole('button', { name: /^今天最值得深读的是什么/ }).click()

  await expect(page.locator('#chat').getByText('今天最值得深读的是什么？').first()).toBeVisible()
  await expect(page.locator('#chat').getByText('（演示回复：尚未连接模型。）', { exact: false })).toBeVisible()
})

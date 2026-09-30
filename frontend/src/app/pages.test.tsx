/**
 * 概览 / Overview
 * 页面集成测试 P1–P8：真实路由 + 全新 mock API，覆盖首页、内容类型、领域页、文章详情、稍后阅读、活动页、
 * 404 与"与 sig 深聊"。
 * Page integration tests P1–P8 with the real router and a fresh mock API: home, content types,
 * domains, article detail, saved, events, 404 and "discuss with sig".
 */
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { isWithin24h } from '../lib/freshness'
import { MAIN_CONTENT_ID } from '../lib/layoutIds'
import { buildMockArticles } from '../services/mockData'
import { uiStore } from '../state/uiStore'
import { createTestApi, renderApp, setViewportMatches } from '../test/testUtils'

/** 列表卡片（每张卡片有收藏按钮）/ Article cards, found via their save buttons. */
function cards(): HTMLElement[] {
  return screen
    .getAllByRole('button', { name: /^(收藏文章|取消收藏)$/ })
    .map((button) => button.closest('article') as HTMLElement)
}

/** 有 24 小时内新闻的领域数 / Number of domains with news inside 24h. */
function domainsWithFreshNews(): number {
  const now = new Date()
  const domains = buildMockArticles(now)
    .filter((article) => article.type === '新闻' && isWithin24h(new Date(article.publishedAt), now))
    .map((article) => article.domain)
  return new Set(domains).size
}

describe('pages', () => {
  it('P1: home shows the headline carousel (one per domain with content), news list and activity teaser', async () => {
    renderApp('/')

    const carousel = await screen.findByRole('region', { name: '七个领域头版轮播' })
    expect(within(carousel).getAllByRole('button', { name: /^查看.+头版$/ })).toHaveLength(domainsWithFreshNews())
    expect(cards().length).toBeGreaterThan(0)
    expect(cards().every((card) => within(card).queryByText('新闻') !== null)).toBe(true)
    expect(screen.getByRole('heading', { name: '把好奇心，带到生活里。' })).toBeInTheDocument()
  })

  it('P2: switching to 精选文章 updates ?type= and hides the carousel', async () => {
    const user = userEvent.setup()
    const { router } = renderApp('/')
    await screen.findByRole('region', { name: '七个领域头版轮播' })

    await user.click(screen.getByRole('button', { name: '精选文章' }))

    expect(new URLSearchParams(router.state.location.search).get('type')).toBe('精选文章')
    expect(screen.queryByRole('region', { name: '七个领域头版轮播' })).toBeNull()
    expect(cards().every((card) => within(card).queryByText('精选文章') !== null)).toBe(true)
  })

  it('P3: a domain page shows only that domain; an empty domain/type shows the empty state', async () => {
    const aiPage = renderApp('/domain/AI')
    expect(await screen.findByRole('heading', { level: 1, name: 'AI' })).toBeInTheDocument()
    await waitFor(() => expect(cards().length).toBeGreaterThan(0))
    expect(cards().every((card) => within(card).getAllByText('AI').length > 0)).toBe(true)
    aiPage.unmount()

    renderApp('/domain/体育?type=名人动态')
    expect(await screen.findByText('这个分类暂时没有内容。试试其他领域或内容类型。')).toBeInTheDocument()
  })

  it('P4: article detail loads analysis lazily, retries on failure, sets context, and back restores the list', async () => {
    const user = userEvent.setup()
    const api = createTestApi({ latencyMs: 30 })
    api.configureMock({ failNext: 'getArticleAnalysis' })
    const { router } = renderApp('/', { api })

    await waitFor(() => expect(cards().length).toBeGreaterThan(0))
    const mainContent = document.getElementById(MAIN_CONTENT_ID)!
    mainContent.scrollTop = 400
    fireEvent.scroll(mainContent)

    const firstTitle = within(cards()[0]).getAllByRole('link')[0]
    const title = firstTitle.textContent ?? ''
    await user.click(firstTitle)

    expect(await screen.findByRole('heading', { level: 1, name: title })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '重点摘要' })).toBeInTheDocument()
    expect(uiStore.getState().readingContext).toMatchObject({ kind: 'article', label: title })
    expect(await screen.findByText('分析暂时没有生成成功。')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '重试' }))
    expect(await screen.findByText('AI 分析生成中…')).toBeInTheDocument()
    expect(await screen.findByText(/一个有用的解读/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '← 返回' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/'))
    await waitFor(() => expect(document.getElementById(MAIN_CONTENT_ID)!.scrollTop).toBe(400))
  })

  it('P5: saved page shows an empty state, then saved items including ones older than 24h', async () => {
    const user = userEvent.setup()
    const api = createTestApi()
    const { unmount } = renderApp('/saved', { api })
    expect(await screen.findByText('还没有收藏。点击内容旁的 ◇ 即可加入。')).toBeInTheDocument()
    unmount()

    await api.setSaved('news-github-stale', true)
    renderApp('/', { api })
    await waitFor(() => expect(cards().length).toBeGreaterThan(0))
    const firstCardTitle = within(cards()[0]).getAllByRole('link')[0].textContent
    await user.click(within(cards()[0]).getByRole('button', { name: '收藏文章' }))
    await user.click(screen.getByRole('link', { name: '稍后阅读' }))

    expect(await screen.findByText('开源协作如何把一个想法变成可靠的工具？')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByText(firstCardTitle ?? '')).toBeInTheDocument())
  })

  it('P6: events page shows defaults, switches category, and reports that search is not connected', async () => {
    const user = userEvent.setup()
    renderApp('/events')

    expect(screen.getByLabelText('当前地点')).toHaveValue('洛杉矶')
    await user.click(screen.getByRole('button', { name: '演出' }))
    expect(screen.getByRole('button', { name: '演出' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getAllByRole('region', { name: /^分类示例：/ })).toHaveLength(1)

    await user.click(screen.getByRole('button', { name: '搜索活动' }))
    expect(await screen.findByText(/活动搜索尚未接入真实数据源/)).toBeInTheDocument()
  })

  it('P7: unknown URLs and invalid domains show the 404 page', async () => {
    const unknown = renderApp('/nope')
    expect(screen.getByRole('heading', { name: '页面不存在' })).toBeInTheDocument()
    unknown.unmount()

    renderApp('/domain/不存在的领域')
    expect(screen.getByRole('heading', { name: '页面不存在' })).toBeInTheDocument()
  })

  it('P8: "与 sig 深聊" opens the article, shows the assistant and focuses the input', async () => {
    const user = userEvent.setup()
    setViewportMatches(false) // 窄屏：助手默认隐藏 / narrow: assistant hidden by default
    const { router } = renderApp('/')
    await waitFor(() => expect(cards().length).toBeGreaterThan(0))
    expect(screen.queryByRole('complementary', { name: 'sig 阅读助手' })).toBeNull()

    await user.click(within(cards()[0]).getByRole('button', { name: '与 sig 深聊 →' }))

    await waitFor(() => expect(router.state.location.pathname).toMatch(/^\/article\//))
    expect(screen.getByRole('complementary', { name: 'sig 阅读助手' })).toBeVisible()
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('textbox', { name: '向 sig 提问' })))
  })
})

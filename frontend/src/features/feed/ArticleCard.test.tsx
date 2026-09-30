/**
 * 概览 / Overview
 * 文章卡片测试 C10：字段齐全；标题进入详情；来源在新标签页打开并带安全属性；标记；收藏状态与名称；深聊回调。
 * Test C10: all fields, title links to detail, source opens safely in a new tab, badge, save state
 * and name, discuss callback.
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { buildMockArticles } from '../../services/mockData'
import { ArticleCard } from './ArticleCard'

const ARTICLE = buildMockArticles(new Date('2026-09-29T19:00:00Z')).find((item) => item.id === 'news-ai-agents')!

describe('ArticleCard', () => {
  it('C10: renders fields, safe links, badge, save state and callbacks', async () => {
    const user = userEvent.setup()
    const onToggleSave = vi.fn()
    const onDiscuss = vi.fn()
    const renderCard = (saved: boolean) => (
      <MemoryRouter>
        <ArticleCard
          article={ARTICLE}
          index={0}
          badge="new"
          saved={saved}
          onToggleSave={onToggleSave}
          onDiscuss={onDiscuss}
        />
      </MemoryRouter>
    )
    const { rerender } = render(renderCard(false))

    expect(screen.getByText('01')).toBeInTheDocument()
    expect(screen.getByText('AI')).toBeInTheDocument()
    expect(screen.getByText('新闻')).toBeInTheDocument()
    expect(screen.getByText('深读 6 分钟')).toBeInTheDocument()
    expect(screen.getByText('新')).toBeInTheDocument()
    expect(screen.getByText('演示')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: ARTICLE.title })).toHaveAttribute('href', '/article/news-ai-agents')

    const sourceLink = screen.getByRole('link', { name: /研究阅读专题/ })
    expect(sourceLink).toHaveAttribute('href', ARTICLE.sources[0].url)
    expect(sourceLink).toHaveAttribute('target', '_blank')
    expect(sourceLink).toHaveAttribute('rel', 'noopener noreferrer')

    const saveButton = screen.getByRole('button', { name: '收藏文章' })
    expect(saveButton).toHaveAttribute('aria-pressed', 'false')
    await user.click(saveButton)
    expect(onToggleSave).toHaveBeenCalledWith(ARTICLE)

    rerender(renderCard(true))
    expect(screen.getByRole('button', { name: '取消收藏' })).toHaveAttribute('aria-pressed', 'true')

    await user.click(screen.getByRole('button', { name: '与 sig 深聊 →' }))
    expect(onDiscuss).toHaveBeenCalledWith(ARTICLE)
  })
})

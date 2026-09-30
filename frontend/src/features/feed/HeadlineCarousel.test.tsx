/**
 * 概览 / Overview
 * 头版轮播测试 C11：条数、领域标签、"01 / 0N"计数、非当前幻灯片 inert；点击领域标签切换；空列表不渲染。
 * Test C11: slide count, domain tabs, "01 / 0N" counter, inert inactive slides, tab switching, empty.
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { buildMockArticles } from '../../services/mockData'
import { HeadlineCarousel } from './HeadlineCarousel'

const HEADLINES = buildMockArticles(new Date('2026-09-29T19:00:00Z'))
  .filter((item) => ['news-ai-agents', 'news-tech-ecosystem', 'news-github-stars'].includes(item.id))

/** 所有幻灯片 / All slides. */
function slides(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>('[aria-roledescription="幻灯片"]'))
}

describe('HeadlineCarousel', () => {
  it('C11: renders slides, tabs and counter, keeps inactive slides inert, and switches by tab', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <HeadlineCarousel headlines={HEADLINES} />
      </MemoryRouter>,
    )

    expect(slides()).toHaveLength(3)
    expect(screen.getAllByRole('button', { name: /^查看.+头版$/ })).toHaveLength(3)
    expect(screen.getByTestId('headline-count')).toHaveTextContent('01 / 03')
    expect(slides().map((slide) => slide.hasAttribute('inert'))).toEqual([false, true, true])

    await user.click(screen.getByRole('button', { name: '查看GitHub头版' }))
    expect(screen.getByTestId('headline-count')).toHaveTextContent('03 / 03')
    expect(slides().map((slide) => slide.hasAttribute('inert'))).toEqual([true, true, false])
    expect(screen.getByRole('button', { name: '开始自动播放' })).toBeInTheDocument()
  })

  it('C11: renders nothing when there are no headlines', () => {
    const { container } = render(
      <MemoryRouter>
        <HeadlineCarousel headlines={[]} />
      </MemoryRouter>,
    )

    expect(container).toBeEmptyDOMElement()
  })
})

/**
 * 概览 / Overview
 * 新内容提示测试 C14：没有新内容时不显示；后台更新完成后显示"有 N 条新内容"，点击前列表不变，点击后才刷新。
 * Test C14: hidden with nothing new; after a background refresh it shows the count, the list stays
 * unchanged until clicked, then refreshes.
 */
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { createTestApi, renderApp } from '../../test/testUtils'
import { NewContentBanner } from './NewContentBanner'

const NINE_HOURS_MS = 9 * 3_600_000

/** 列表中的卡片数（每张卡片有一个收藏按钮）/ Card count via their save buttons. */
function cardCount(): number {
  return screen.getAllByRole('button', { name: /^(收藏文章|取消收藏)$/ }).length
}

describe('NewContentBanner', () => {
  it('C14: renders nothing for zero and calls onApply on click', async () => {
    const user = userEvent.setup()
    const onApply = vi.fn()
    const { rerender, container } = render(<NewContentBanner count={0} onApply={onApply} />)
    expect(container).toBeEmptyDOMElement()

    rerender(<NewContentBanner count={3} onApply={onApply} />)
    await user.click(screen.getByRole('button', { name: '有 3 条新内容 · 点击查看' }))
    expect(onApply).toHaveBeenCalledOnce()
  })

  it('C14: keeps the list unchanged until the banner is clicked', async () => {
    const user = userEvent.setup()
    const api = createTestApi({
      initialLastRunAt: new Date(Date.now() - NINE_HOURS_MS).toISOString(),
      refreshDurationMs: 0,
    })
    renderApp('/', { api })

    const banner = await screen.findByRole('button', { name: '有 3 条新内容 · 点击查看' }, { timeout: 4000 })
    const cardsBeforeClick = cardCount()
    expect(screen.queryByText('看懂一份财报，先找到真正的收入来源')).toBeNull()

    await user.click(banner)
    await waitFor(() => expect(cardCount()).toBe(cardsBeforeClick + 3))
    expect(screen.getByText('看懂一份财报，先找到真正的收入来源')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /条新内容/ })).toBeNull()
  })
})

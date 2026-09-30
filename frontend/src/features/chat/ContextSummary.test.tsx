/**
 * 概览 / Overview
 * 上下文摘要测试 C9：默认折叠，点击后展开显示完整标题。
 * Test C9: collapsed by default, expands on click to show the full title.
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { ContextSummary } from './ContextSummary'

const LONG_TITLE = '当 AI 开始替你行动，谁来决定它的边界？这是一个很长的标题'

describe('ContextSummary', () => {
  it('C9: starts collapsed and expands to the full title', async () => {
    const user = userEvent.setup()
    const { container } = render(<ContextSummary context={{ kind: 'article', id: 'a', label: LONG_TITLE }} />)
    const details = container.querySelector('details')!

    expect(details.open).toBe(false)
    expect(screen.getByRole('group')).toBeInTheDocument()

    await user.click(container.querySelector('summary')!)
    expect(details.open).toBe(true)
    expect(screen.getByText(LONG_TITLE, { selector: 'span' })).toBeVisible()
  })
})

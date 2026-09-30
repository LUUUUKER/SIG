/**
 * 概览 / Overview
 * 助手面板测试 C16：标题栏有"对话历史""新对话"，没有"重置"，面板内没有显隐开关；
 * 历史按钮切换到历史列表，新对话回到欢迎页。
 * Test C16: the header has history and new-chat buttons, no reset and no visibility toggle;
 * history opens the list and new chat returns to the welcome view.
 */
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { ChatPanel } from './ChatPanel'

describe('ChatPanel', () => {
  it('C16: shows history and new-chat actions without reset or a visibility toggle', async () => {
    const user = userEvent.setup()
    render(<ChatPanel hidden={false} />)
    const panel = screen.getByRole('complementary', { name: 'sig 阅读助手' })

    expect(within(panel).getByText('sig · 阅读伙伴')).toBeInTheDocument()
    expect(within(panel).getByRole('button', { name: '对话历史' })).toBeInTheDocument()
    expect(within(panel).getByRole('button', { name: '新对话' })).toBeInTheDocument()
    expect(within(panel).queryByRole('button', { name: /重置/ })).toBeNull()
    expect(within(panel).queryByRole('button', { name: /sig 助手/ })).toBeNull()
    expect(within(panel).getByRole('button', { name: /今天最值得深读的是什么/ })).toBeInTheDocument()

    await user.click(within(panel).getByRole('button', { name: '对话历史' }))
    expect(within(panel).getByText('还没有历史对话。')).toBeInTheDocument()

    await user.click(within(panel).getByRole('button', { name: '新对话' }))
    expect(within(panel).queryByText('还没有历史对话。')).toBeNull()
    expect(within(panel).getByText(/最近 24 小时的精选已经准备好/)).toBeInTheDocument()
  })
})

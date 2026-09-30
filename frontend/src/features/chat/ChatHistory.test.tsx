/**
 * 概览 / Overview
 * 历史列表测试 C15：按给定顺序列出标题、关联文章与"X 前"；当前会话标记；点击切换；单条删除；空状态。
 * Test C15: lists title, context and "X ago" in order; marks the active one; select; delete; empty state.
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { ChatSession } from '../../state/chatSessionStore'
import { ChatHistory } from './ChatHistory'

const NOW = new Date('2026-09-29T19:00:00Z')

/** 构造会话 / Build a session. */
function makeSession(id: string, title: string, contextLabel: string, lastActiveAt: string): ChatSession {
  return {
    id,
    title,
    createdAt: lastActiveAt,
    lastActiveAt,
    status: 'idle',
    errorMessage: null,
    pendingRequest: null,
    messages: [
      {
        id: `${id}-m1`,
        role: 'user',
        content: title,
        contextRef: { kind: 'article', id: id, label: contextLabel },
        createdAt: lastActiveAt,
        isDemo: false,
      },
    ],
  }
}

describe('ChatHistory', () => {
  it('C15: lists sessions with context and age, supports select and delete', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    const onDelete = vi.fn()
    const sessions = [
      makeSession('recent', '最近的问题', '文章 B', '2026-09-29T18:55:00Z'),
      makeSession('older', '更早的问题', '文章 A', '2026-09-29T16:00:00Z'),
    ]

    render(
      <ChatHistory sessions={sessions} activeSessionId="older" now={NOW} onSelect={onSelect} onDelete={onDelete} />,
    )

    const items = screen.getAllByRole('listitem')
    expect(items[0]).toHaveTextContent('最近的问题')
    expect(items[0]).toHaveTextContent('文章 B · 5 分钟前')
    expect(items[1]).toHaveTextContent('文章 A · 3 小时前')
    expect(screen.getByRole('button', { name: /^更早的问题/ })).toHaveAttribute('aria-current', 'true')

    await user.click(screen.getByRole('button', { name: /^最近的问题/ }))
    expect(onSelect).toHaveBeenCalledWith('recent')

    await user.click(screen.getByRole('button', { name: '删除对话：更早的问题' }))
    expect(onDelete).toHaveBeenCalledWith('older')
  })

  it('C15: shows an empty state when there is no history', () => {
    render(<ChatHistory sessions={[]} activeSessionId={null} now={NOW} onSelect={vi.fn()} onDelete={vi.fn()} />)

    expect(screen.getByText('还没有历史对话。')).toBeInTheDocument()
  })
})

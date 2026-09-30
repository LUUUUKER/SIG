/**
 * 概览 / Overview
 * 消息列表测试 C8：用户消息显示"关联：…"；回复中提示；失败显示错误并可重试。
 * Test C8: user messages show "关联：…", a replying indicator, and an error with retry.
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { ChatSession } from '../../state/chatSessionStore'
import { MessageList } from './MessageList'

const CONTEXT = { kind: 'article' as const, id: 'a', label: '文章 A' }

/** 构造会话 / Build a session. */
function makeSession(overrides: Partial<ChatSession> = {}): ChatSession {
  return {
    id: 'session-1',
    title: '问题',
    createdAt: '2026-09-29T19:00:00Z',
    lastActiveAt: '2026-09-29T19:00:00Z',
    status: 'idle',
    errorMessage: null,
    pendingRequest: null,
    messages: [
      { id: 'm1', role: 'user', content: '背景是什么？', contextRef: CONTEXT, createdAt: '', isDemo: false },
      { id: 'm2', role: 'assistant', content: '演示回复', contextRef: CONTEXT, createdAt: '', isDemo: true },
    ],
    ...overrides,
  }
}

describe('MessageList', () => {
  it('C8: labels user messages with their context and shows replying and error states', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()

    const { rerender } = render(<MessageList session={makeSession()} onRetry={onRetry} />)
    expect(screen.getByText('关联：文章 A')).toBeInTheDocument()
    expect(screen.getByText('演示回复')).toBeInTheDocument()
    expect(screen.queryByRole('status')).toBeNull()

    rerender(<MessageList session={makeSession({ status: 'replying' })} onRetry={onRetry} />)
    expect(screen.getByRole('status')).toHaveTextContent('sig 正在回复…')

    rerender(<MessageList session={makeSession({ status: 'error', errorMessage: '网络错误' })} onRetry={onRetry} />)
    expect(screen.getByRole('alert')).toHaveTextContent('网络错误')
    await user.click(screen.getByRole('button', { name: '重试' }))
    expect(onRetry).toHaveBeenCalledWith('session-1')
  })
})

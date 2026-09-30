/**
 * 概览 / Overview
 * 输入框测试 C7：Enter 发送、Shift+Enter 换行、输入法组合中不发送、空白禁发、发送后清空并缩回一行。
 * Test C7: Enter sends, Shift+Enter newline, no send during IME composition, blank disabled,
 * cleared and shrunk after sending.
 */
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { ChatComposer } from './ChatComposer'

/** 受控包装：提交后像 ChatPanel 一样清空草稿。/ Controlled wrapper that clears like ChatPanel. */
function ComposerHarness({ onSubmit }: { onSubmit: (text: string) => void }) {
  const [draft, setDraft] = useState('')
  return (
    <ChatComposer
      value={draft}
      onChange={setDraft}
      onSubmit={(text) => {
        onSubmit(text)
        setDraft('')
      }}
    />
  )
}

describe('ChatComposer', () => {
  it('C7: handles Enter, Shift+Enter, IME composition, blank input and resets after sending', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<ComposerHarness onSubmit={onSubmit} />)
    const textarea = screen.getByRole('textbox', { name: '向 sig 提问' })
    const sendButton = screen.getByRole('button', { name: '发送消息' })

    await user.type(textarea, '   ')
    expect(sendButton).toBeDisabled()
    await user.keyboard('{Enter}')
    expect(onSubmit).not.toHaveBeenCalled()

    await user.clear(textarea)
    await user.type(textarea, '第一行')
    await user.keyboard('{Shift>}{Enter}{/Shift}第二行')
    expect(textarea).toHaveValue('第一行\n第二行')
    expect(onSubmit).not.toHaveBeenCalled()

    fireEvent.keyDown(textarea, { key: 'Enter', isComposing: true })
    expect(onSubmit).not.toHaveBeenCalled()

    await user.keyboard('{Enter}')
    expect(onSubmit).toHaveBeenCalledWith('第一行\n第二行')
    expect(textarea).toHaveValue('')
    expect(textarea.style.height).toBe('26px')
  })
})

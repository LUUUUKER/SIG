/**
 * 概览 / Overview
 * 聊天输入框：受控组件。一行起步随内容增高，144px 后内部滚动；Enter 发送，Shift+Enter 换行，
 * 中文输入法选词时的 Enter 不发送；空白或禁用时不能发送。
 * Chat composer (controlled). Starts at one line, grows, scrolls internally past 144px. Enter sends,
 * Shift+Enter adds a newline, Enter during IME composition never sends; blank or disabled cannot send.
 *
 * 包含 / Contents
 * - CHAT_INPUT_ID：供"与 sig 深聊"把焦点送进来。/ id used to focus the input from elsewhere.
 * - ChatComposer({ value, onChange, onSubmit, disabled })。
 */
import { useLayoutEffect, useRef, type FormEvent, type KeyboardEvent } from 'react'
import { COMPOSER_MIN_HEIGHT_PX, composerHeight } from '../../lib/composerHeight'
import styles from './Chat.module.css'

export const CHAT_INPUT_ID = 'chat-input'
/** 部分浏览器在输入法组合中按键的 keyCode。/ keyCode reported by some browsers during IME composition. */
const IME_PROCESS_KEY_CODE = 229

interface ChatComposerProps {
  value: string
  onChange: (text: string) => void
  onSubmit: (text: string) => void
  disabled?: boolean
}

/**
 * 输入框 / Composer.
 * 输入 / Input: value、onChange、onSubmit（收到当前文字，由上层清空）、disabled。
 * 输出 / Output: <form>，含 textarea 与发送按钮。/ a form with a textarea and a send button.
 * 步骤 / Steps
 * 1. 文字变化后：先把高度设为最小值，再按 scrollHeight 计算新高度与是否滚动。
 *    After each change: reset to the minimum height, then size from scrollHeight.
 * 2. 提交（按钮或 Enter）：空白或禁用时忽略，否则调用 onSubmit。/ Submit unless blank or disabled.
 * 3. 键盘：Enter（无 Shift、非输入法组合）提交；其余按键保持默认。/ Enter submits; others default.
 */
export function ChatComposer({ value, onChange, onSubmit, disabled = false }: ChatComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const canSend = !disabled && value.trim() !== ''

  useLayoutEffect(() => {
    const textarea = textareaRef.current // 步骤 1 / Step 1
    if (textarea === null) return
    textarea.style.height = `${COMPOSER_MIN_HEIGHT_PX}px`
    const { heightPx, scrollable } = composerHeight(textarea.scrollHeight)
    textarea.style.height = `${heightPx}px`
    textarea.style.overflowY = scrollable ? 'auto' : 'hidden'
  }, [value])

  function submit() {
    if (!canSend) return // 步骤 2 / Step 2
    onSubmit(value)
  }

  function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    submit()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    const composing = event.nativeEvent.isComposing || event.keyCode === IME_PROCESS_KEY_CODE // 步骤 3
    if (event.key === 'Enter' && !event.shiftKey && !composing) {
      event.preventDefault()
      submit()
    }
  }

  return (
    <form className={styles.composer} onSubmit={handleFormSubmit}>
      <textarea
        id={CHAT_INPUT_ID}
        ref={textareaRef}
        rows={1}
        value={value}
        placeholder="问问 sig…"
        aria-label="向 sig 提问"
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
      />
      <button type="submit" className={styles.send} aria-label="发送消息" disabled={!canSend}>
        ↑
      </button>
    </form>
  )
}

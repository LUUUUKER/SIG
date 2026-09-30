/**
 * 概览 / Overview
 * 消息列表：显示当前会话的消息；用户消息标注"关联：<上下文>"；回复中显示提示；失败显示错误与重试。
 * 新消息或状态变化时自动滚动到底部。
 * Message list for the active session: user messages show "关联：<context>", a replying indicator,
 * and an error with retry. Scrolls to the bottom on new messages or status changes.
 *
 * 包含 / Contents
 * - MessageList({ session, onRetry })。
 */
import { useEffect, useRef } from 'react'
import type { ChatSession } from '../../state/chatSessionStore'
import styles from './Chat.module.css'

interface MessageListProps {
  session: ChatSession
  onRetry: (sessionId: string) => void
}

/**
 * 消息列表 / Message list.
 * 输入 / Input: session、onRetry。
 * 输出 / Output: 可滚动的消息区。/ the scrollable message area.
 * 步骤 / Steps
 * 1. 渲染消息（用户消息带关联上下文）。/ Render messages (user ones with their context).
 * 2. 按状态显示"正在回复"或"错误 + 重试"。/ Show replying or error + retry.
 * 3. 消息数或状态变化后滚到底部。/ Scroll to the bottom after changes.
 */
export function MessageList({ session, onRetry }: MessageListProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const scrollArea = scrollAreaRef.current // 步骤 3 / Step 3
    if (scrollArea !== null) scrollArea.scrollTop = scrollArea.scrollHeight
  }, [session.messages.length, session.status])

  return (
    <div className={styles.messages} ref={scrollAreaRef}>
      <div className={styles.assistantLabel}>YOUR PERSONAL EDITOR</div>
      {session.messages.map((message) => (
        <div key={message.id} className={`${styles.message} ${styles[message.role]}`}>
          {message.role === 'user' && (
            <span className={styles.messageContext}>关联：{message.contextRef.label}</span>
          )}
          {message.content}
        </div>
      ))}
      {session.status === 'replying' && (
        <p className={styles.replying} role="status">
          sig 正在回复…
        </p>
      )}
      {session.status === 'error' && (
        <div className={styles.error} role="alert">
          <span>{session.errorMessage ?? '回复失败'}</span>
          <button type="button" onClick={() => onRetry(session.id)}>
            重试
          </button>
        </div>
      )}
    </div>
  )
}

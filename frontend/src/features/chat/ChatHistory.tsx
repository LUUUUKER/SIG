/**
 * 概览 / Overview
 * 对话历史：在助手面板内列出最近的会话（最近使用在前），每行显示标题、关联文章、"X 前"；
 * 点击切换，单条删除；没有会话时显示空状态。
 * Chat history inside the panel: recent sessions (most recently used first) with title, related
 * context and "X ago"; click to switch, delete individually, empty state when none.
 *
 * 包含 / Contents
 * - ChatHistory({ sessions, activeSessionId, now, onSelect, onDelete })。
 */
import { formatUpdatedAgo } from '../../lib/freshness'
import type { ChatSession } from '../../state/chatSessionStore'
import { CloseIcon } from '../../components/icons/Icons'
import styles from './Chat.module.css'

interface ChatHistoryProps {
  /** 已按最近使用排序。/ Already sorted by recent use. */
  sessions: ChatSession[]
  activeSessionId: string | null
  now: Date
  onSelect: (sessionId: string) => void
  onDelete: (sessionId: string) => void
}

/**
 * 历史列表 / History list.
 * 输入 / Input: sessions（已排序）、activeSessionId、now、onSelect、onDelete。
 * 输出 / Output: 列表；当前会话 aria-current="true"；关联文章取首条消息的上下文。
 *                A list; the active session has aria-current="true"; context comes from the first message.
 */
export function ChatHistory({ sessions, activeSessionId, now, onSelect, onDelete }: ChatHistoryProps) {
  if (sessions.length === 0) {
    return (
      <div className={styles.history}>
        <p className={styles.historyEmpty}>还没有历史对话。</p>
      </div>
    )
  }

  return (
    <div className={styles.history}>
      <p className={styles.historyTitle}>最近 {sessions.length} 个对话</p>
      <ul className={styles.historyList}>
        {sessions.map((session) => {
          const contextLabel = session.messages[0]?.contextRef.label ?? ''
          return (
            <li key={session.id} className={styles.historyItem}>
              <button
                type="button"
                className={styles.historySelect}
                aria-current={session.id === activeSessionId ? 'true' : undefined}
                onClick={() => onSelect(session.id)}
              >
                <strong>{session.title}</strong>
                <span>
                  {contextLabel} · {formatUpdatedAgo(new Date(session.lastActiveAt), now)}
                </span>
              </button>
              <button
                type="button"
                className={styles.historyDelete}
                aria-label={`删除对话：${session.title}`}
                onClick={() => onDelete(session.id)}
              >
                <CloseIcon size={14} />
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

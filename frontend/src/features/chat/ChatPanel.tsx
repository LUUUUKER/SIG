/**
 * 概览 / Overview
 * sig 助手面板：标题栏（头像、sig · 阅读伙伴、历史、新对话）、上下文、消息或欢迎页、输入框、演示说明。
 * 把 chatSessionStore 与 uiStore 连接到各个子组件。显隐由页眉开关控制，面板内不放开关。
 * The sig assistant panel: header (mark, title, history, new chat), context, messages or welcome,
 * composer and demo note. Wires chatSessionStore and uiStore into child components. Visibility is
 * controlled by the header toggle only.
 *
 * 包含 / Contents
 * - QUICK_PROMPTS：欢迎页快捷问题。/ quick prompts on the welcome view.
 * - ChatWelcome({ onPrompt })：无当前会话时的欢迎页。/ welcome view when no session is active.
 * - ChatPanel({ hidden })。
 */
import { useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { CHAT_PANEL_ID } from '../../components/Header/ChatToggle'
import { HistoryIcon, PlusIcon } from '../../components/icons/Icons'
import {
  selectActiveSession,
  selectSessionsByRecent,
  useChatSessionStore,
} from '../../state/chatSessionStore'
import { useUiStore } from '../../state/uiStore'
import { ChatComposer } from './ChatComposer'
import { ChatHistory } from './ChatHistory'
import { ContextSummary } from './ContextSummary'
import { MessageList } from './MessageList'
import styles from './Chat.module.css'

const QUICK_PROMPTS = ['今天最值得深读的是什么？', '只看 AI 和 GitHub', '看看近期活动'] as const

/**
 * 欢迎页 / Welcome view.
 * 输入 / Input: onPrompt —— 点击快捷问题时以该文字发送消息（不跳转页面）。
 *               sends the prompt as a message (no navigation).
 */
function ChatWelcome({ onPrompt }: { onPrompt: (prompt: string) => void }) {
  return (
    <div className={styles.messages}>
      <div className={styles.assistantLabel}>YOUR PERSONAL EDITOR</div>
      <div className={`${styles.message} ${styles.assistant}`}>
        你好，luuuuker。{'\n\n'}最近 24 小时的精选已经准备好。你可以直接读，也可以和我一起，把一条新闻读得更深。
      </div>
      <div className={styles.rule} />
      <div className={styles.suggestions}>
        {QUICK_PROMPTS.map((prompt) => (
          <button key={prompt} type="button" onClick={() => onPrompt(prompt)}>
            {prompt}
            <span aria-hidden="true">↗</span>
          </button>
        ))}
      </div>
      <p className={styles.note}>选中一篇新闻后，你可以追问背景、比较观点，或告诉我你想关注的新方向。</p>
    </div>
  )
}

interface ChatPanelProps {
  hidden: boolean
}

/**
 * 助手面板 / Assistant panel.
 * 输入 / Input: hidden —— 隐藏时整块不可见也不可聚焦，但状态保留。/ hidden but state is kept.
 * 输出 / Output: <aside id="chat">。
 * 步骤 / Steps
 * 1. 从 store 读当前会话、排序后的历史、草稿、阅读上下文。/ Read session, history, draft, context.
 * 2. 标题栏：历史按钮切换列表；新对话按钮开始空白会话并关闭列表。/ History toggles; new chat resets view.
 * 3. 主体：历史列表 / 当前会话消息 / 欢迎页三选一。/ Body: history, messages or welcome.
 * 4. 发送：取草稿文字，先清空草稿，再以当前上下文发送。/ Send: take draft, clear it, send with context.
 */
export function ChatPanel({ hidden }: ChatPanelProps) {
  // 打开历史的时刻；null 表示历史未打开。用于计算"X 前"，避免在渲染中取当前时间。
  // When history was opened (null = closed); used for "X ago" without reading the clock during render.
  const [historyOpenedAt, setHistoryOpenedAt] = useState<Date | null>(null)
  const historyOpen = historyOpenedAt !== null
  const activeSession = useChatSessionStore(selectActiveSession) // 步骤 1 / Step 1
  const recentSessions = useChatSessionStore(useShallow(selectSessionsByRecent))
  const activeSessionId = useChatSessionStore((state) => state.activeSessionId)
  const draft = useChatSessionStore((state) => state.draft)
  const setDraft = useChatSessionStore((state) => state.setDraft)
  const sendMessage = useChatSessionStore((state) => state.sendMessage)
  const retry = useChatSessionStore((state) => state.retry)
  const startNewSession = useChatSessionStore((state) => state.startNewSession)
  const switchSession = useChatSessionStore((state) => state.switchSession)
  const deleteSession = useChatSessionStore((state) => state.deleteSession)
  const readingContext = useUiStore((state) => state.readingContext)

  function send(text: string) {
    setDraft('') // 步骤 4 / Step 4
    void sendMessage(text, readingContext)
  }

  function handleNewSession() {
    startNewSession() // 步骤 2 / Step 2
    setHistoryOpenedAt(null)
  }

  function handleSelectSession(sessionId: string) {
    switchSession(sessionId)
    setHistoryOpenedAt(null)
  }

  function renderBody() {
    // 步骤 3 / Step 3
    if (historyOpenedAt !== null) {
      return (
        <ChatHistory
          sessions={recentSessions}
          activeSessionId={activeSessionId}
          now={historyOpenedAt}
          onSelect={handleSelectSession}
          onDelete={deleteSession}
        />
      )
    }
    if (activeSession === null) return <ChatWelcome onPrompt={(prompt) => void sendMessage(prompt, readingContext)} />
    return <MessageList session={activeSession} onRetry={(sessionId) => void retry(sessionId)} />
  }

  return (
    <aside id={CHAT_PANEL_ID} className={styles.chat} aria-label="sig 阅读助手" hidden={hidden}>
      <div className={styles.head}>
        <div className={styles.assistantMark} aria-hidden="true">
          S
        </div>
        <strong className={styles.title}>sig · 阅读伙伴</strong>
        <div className={styles.headActions}>
          <button
            type="button"
            className={styles.headButton}
            aria-label="对话历史"
            title="对话历史"
            aria-expanded={historyOpen}
            data-active={historyOpen}
            onClick={() => setHistoryOpenedAt(historyOpen ? null : new Date())}
          >
            <HistoryIcon size={17} />
          </button>
          <button type="button" className={styles.headButton} aria-label="新对话" title="新对话" onClick={handleNewSession}>
            <PlusIcon size={17} />
          </button>
        </div>
      </div>
      {!historyOpen && <ContextSummary context={readingContext} />}
      {renderBody()}
      <ChatComposer
        value={draft}
        onChange={setDraft}
        onSubmit={send}
        disabled={activeSession?.status === 'replying'}
      />
      <div className={styles.disclaimer}>交互演示 · 回复为预设示例，尚未连接模型</div>
    </aside>
  )
}

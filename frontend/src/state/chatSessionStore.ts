/**
 * 概览 / Overview
 * 对话会话状态：多会话 + LRU 历史（最多 10 个），发送、重试、新对话、切换、删除。
 * 关键规则：发送时冻结"会话 ID + 阅读上下文"，回复永远写回发出时的那个会话、关联发出时的那篇文章。
 * Chat session state: multiple sessions with LRU history (max 10), plus send, retry, new, switch, delete.
 * Key rule: each send freezes its session id and reading context, so the reply always lands in the
 * session it was sent from and stays tied to the article that was open at that moment.
 *
 * 包含 / Contents
 * - ChatSession、ChatSessionState、PendingChatRequest。
 * - makeSessionTitle(text)：取首条消息前 20 字作标题。/ Title from the first message.
 * - evictLeastRecentlyUsed(sessions, activeSessionId, maxSessions)：LRU 淘汰（不淘汰当前会话）。
 * - selectActiveSession(state) / selectSessionsByRecent(state)：选择器。/ selectors.
 * - createChatSessionStore(options)：创建 store（注入 api、存储、时钟、ID 生成器）。
 * - chatSessionStore / useChatSessionStore(selector)：应用实例与 React 钩子。
 */

import { useStore } from 'zustand'
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware'
import { createStore } from 'zustand/vanilla'
import { api as defaultApi, type SigApi } from '../services/api'
import type { ChatMessage, ContextRef } from '../services/types'
import { browserStorage } from './storage'

export const MAX_CHAT_SESSIONS = 10
export const SESSION_TITLE_MAX_CHARS = 20
export const CHAT_STORAGE_KEY = 'sig-chat-sessions'
export const INTERRUPTED_REPLY_MESSAGE = '回复被中断，可重试'

export type SessionStatus = 'idle' | 'replying' | 'error'

export interface PendingChatRequest {
  text: string
  contextRef: ContextRef
}

export interface ChatSession {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: string
  /** 最后一次"使用"（发送或切回）的时间，LRU 依据。/ Last use (send or switch back); LRU key. */
  lastActiveAt: string
  status: SessionStatus
  errorMessage: string | null
  /** 等待回复或失败待重试的请求。/ Request awaiting a reply or a retry. */
  pendingRequest: PendingChatRequest | null
}

export interface ChatSessionState {
  sessions: ChatSession[]
  /** null 表示"新对话"空白页，尚未创建会话。/ null = blank new chat, no session yet. */
  activeSessionId: string | null
  draft: string

  setDraft: (text: string) => void
  sendMessage: (text: string, contextRef: ContextRef) => Promise<void>
  retry: (sessionId: string) => Promise<void>
  startNewSession: () => void
  switchSession: (sessionId: string) => void
  deleteSession: (sessionId: string) => void
}

type PersistedChatState = Pick<ChatSessionState, 'sessions' | 'activeSessionId'>

export interface ChatSessionStoreOptions {
  api?: Pick<SigApi, 'sendChat'>
  storage?: StateStorage
  now?: () => Date
  generateId?: () => string
  maxSessions?: number
}

/**
 * 会话标题 / Session title.
 * 输入 / Input: 首条用户消息。/ first user message.
 * 输出 / Output: 去掉首尾空白、合并换行后的前 20 个字；超出加"…"。
 *                Trimmed, newlines collapsed, first 20 characters, with "…" when truncated.
 */
export function makeSessionTitle(text: string): string {
  const singleLine = text.trim().replace(/\s+/g, ' ')
  const characters = Array.from(singleLine)
  if (characters.length <= SESSION_TITLE_MAX_CHARS) return singleLine
  return `${characters.slice(0, SESSION_TITLE_MAX_CHARS).join('')}…`
}

/**
 * LRU 淘汰 / LRU eviction.
 * 输入 / Input: sessions、activeSessionId（受保护）、maxSessions。
 * 输出 / Output: 不超过上限的新数组。/ a new array within the limit.
 * 算法 / Algorithm: 超出上限时，反复移除"非当前会话中 lastActiveAt 最早的一个"。
 *                   While over the limit, remove the non-active session with the oldest lastActiveAt.
 */
export function evictLeastRecentlyUsed(
  sessions: ChatSession[],
  activeSessionId: string | null,
  maxSessions: number,
): ChatSession[] {
  const remaining = [...sessions]
  while (remaining.length > maxSessions) {
    let oldestIndex = -1
    remaining.forEach((session, index) => {
      if (session.id === activeSessionId) return
      if (oldestIndex === -1 || session.lastActiveAt < remaining[oldestIndex].lastActiveAt) {
        oldestIndex = index
      }
    })
    if (oldestIndex === -1) break
    remaining.splice(oldestIndex, 1)
  }
  return remaining
}

/** 当前会话 / The active session, or null. */
export function selectActiveSession(state: Pick<ChatSessionState, 'sessions' | 'activeSessionId'>) {
  return state.sessions.find((session) => session.id === state.activeSessionId) ?? null
}

/**
 * 按最近使用排序 / Sessions by recent use.
 * 输出 / Output: 新数组，lastActiveAt 倒序。在 React 中请配合 useShallow 使用。
 *                A new array, newest first. Use with useShallow in React.
 */
export function selectSessionsByRecent(state: Pick<ChatSessionState, 'sessions'>): ChatSession[] {
  return [...state.sessions].sort((a, b) => b.lastActiveAt.localeCompare(a.lastActiveAt))
}

/**
 * 读回时处理中断 / Fix interrupted replies on rehydrate.
 * 页面刷新时仍在"回复中"的会话，改为"失败，可重试"，并保留待重试的请求。
 * Sessions still replying at reload become errors that keep their pending request for retry.
 */
function markInterruptedSessions(sessions: ChatSession[]): ChatSession[] {
  return sessions.map((session) =>
    session.status === 'replying'
      ? { ...session, status: 'error', errorMessage: INTERRUPTED_REPLY_MESSAGE }
      : session,
  )
}

/**
 * 创建会话 store / Create the chat session store.
 * 输入 / Input: options（api、storage、now、generateId、maxSessions 均可注入）。
 * 输出 / Output: Zustand vanilla store；会话与当前会话 ID 持久化，草稿不持久化。
 *                Persists sessions and the active id; the draft is not persisted.
 */
export function createChatSessionStore(options: ChatSessionStoreOptions = {}) {
  const chatApi = options.api ?? defaultApi
  const storage = options.storage ?? browserStorage
  const now = options.now ?? (() => new Date())
  const generateId = options.generateId ?? (() => crypto.randomUUID())
  const maxSessions = options.maxSessions ?? MAX_CHAT_SESSIONS

  return createStore<ChatSessionState>()(
    persist(
      (set, get) => {
        /** 修改指定会话 / Update one session by id (no-op if it was deleted). */
        function updateSession(sessionId: string, change: (session: ChatSession) => ChatSession) {
          set((state) => ({
            sessions: state.sessions.map((session) => (session.id === sessionId ? change(session) : session)),
          }))
        }

        /**
         * 请求回复 / Request a reply.
         * 输入 / Input: 冻结的 sessionId 与请求。/ frozen session id and request.
         * 步骤 / Steps
         * 1. 调用 api.sendChat。/ Call api.sendChat.
         * 2. 成功：把回复追加到冻结的会话，状态回到 idle。/ Success: append to the frozen session, idle.
         * 3. 失败：状态 error，保存错误信息与待重试请求。/ Failure: error with message and pending request.
         */
        async function requestReply(sessionId: string, request: PendingChatRequest): Promise<void> {
          try {
            const reply = await chatApi.sendChat(request) // 步骤 1 / Step 1
            const assistantMessage: ChatMessage = {
              id: generateId(),
              role: 'assistant',
              content: reply.content,
              contextRef: request.contextRef,
              createdAt: now().toISOString(),
              isDemo: reply.isDemo,
            }
            updateSession(sessionId, (session) => ({
              ...session,
              messages: [...session.messages, assistantMessage],
              status: 'idle',
              errorMessage: null,
              pendingRequest: null,
            })) // 步骤 2 / Step 2
          } catch (error) {
            updateSession(sessionId, (session) => ({
              ...session,
              status: 'error',
              errorMessage: error instanceof Error ? error.message : '回复失败，可重试',
              pendingRequest: request,
            })) // 步骤 3 / Step 3
          }
        }

        return {
          sessions: [],
          activeSessionId: null,
          draft: '',

          setDraft: (text) => set({ draft: text }),

          /**
           * 发送消息 / Send a message.
           * 输入 / Input: text、contextRef（调用时的阅读上下文）。/ text and the current reading context.
           * 步骤 / Steps
           * 1. 去空白后为空 → 不发送。/ Blank → ignore.
           * 2. 当前会话正在回复 → 忽略，防止重复提交。/ Active session replying → ignore duplicates.
           * 3. 冻结上下文，生成用户消息。/ Freeze the context and build the user message.
           * 4. 有当前会话 → 追加并置为 replying；否则新建会话（此时才入列）并做 LRU 淘汰。
           *    Append to the active session, or create one now and apply LRU eviction.
           * 5. 请求回复，回复写回冻结的会话。/ Request the reply into the frozen session.
           */
          async sendMessage(text, contextRef) {
            const trimmedText = text.trim()
            if (trimmedText === '') return // 步骤 1 / Step 1
            const activeSession = selectActiveSession(get())
            if (activeSession?.status === 'replying') return // 步骤 2 / Step 2

            const timestamp = now().toISOString() // 步骤 3 / Step 3
            const frozenRequest: PendingChatRequest = { text: trimmedText, contextRef: { ...contextRef } }
            const userMessage: ChatMessage = {
              id: generateId(),
              role: 'user',
              content: trimmedText,
              contextRef: frozenRequest.contextRef,
              createdAt: timestamp,
              isDemo: false,
            }

            let frozenSessionId: string // 步骤 4 / Step 4
            if (activeSession !== null) {
              frozenSessionId = activeSession.id
              updateSession(frozenSessionId, (session) => ({
                ...session,
                messages: [...session.messages, userMessage],
                lastActiveAt: timestamp,
                status: 'replying',
                errorMessage: null,
                pendingRequest: frozenRequest,
              }))
            } else {
              frozenSessionId = generateId()
              const newSession: ChatSession = {
                id: frozenSessionId,
                title: makeSessionTitle(trimmedText),
                messages: [userMessage],
                createdAt: timestamp,
                lastActiveAt: timestamp,
                status: 'replying',
                errorMessage: null,
                pendingRequest: frozenRequest,
              }
              set((state) => ({
                sessions: evictLeastRecentlyUsed([...state.sessions, newSession], frozenSessionId, maxSessions),
                activeSessionId: frozenSessionId,
              }))
            }

            await requestReply(frozenSessionId, frozenRequest) // 步骤 5 / Step 5
          },

          /**
           * 重试 / Retry.
           * 只对处于 error 且有待重试请求的会话生效；用原文字与原上下文重发，不新增用户消息。
           * Only for sessions in error with a pending request; resends the same text and context
           * without adding another user message.
           */
          async retry(sessionId) {
            const session = get().sessions.find((item) => item.id === sessionId)
            if (session === undefined || session.status !== 'error' || session.pendingRequest === null) return
            const request = session.pendingRequest
            updateSession(sessionId, (item) => ({ ...item, status: 'replying', errorMessage: null }))
            await requestReply(sessionId, request)
          },

          startNewSession: () => set({ activeSessionId: null }),

          switchSession: (sessionId) => {
            if (!get().sessions.some((session) => session.id === sessionId)) return
            const timestamp = now().toISOString()
            set({ activeSessionId: sessionId })
            updateSession(sessionId, (session) => ({ ...session, lastActiveAt: timestamp }))
          },

          deleteSession: (sessionId) =>
            set((state) => ({
              sessions: state.sessions.filter((session) => session.id !== sessionId),
              activeSessionId: state.activeSessionId === sessionId ? null : state.activeSessionId,
            })),
        }
      },
      {
        name: CHAT_STORAGE_KEY,
        version: 1,
        storage: createJSONStorage<PersistedChatState>(() => storage),
        partialize: (state): PersistedChatState => ({
          sessions: state.sessions,
          activeSessionId: state.activeSessionId,
        }),
        merge: (persistedState, currentState) => {
          const persisted = (persistedState ?? {}) as Partial<PersistedChatState>
          return {
            ...currentState,
            sessions: markInterruptedSessions(persisted.sessions ?? []),
            activeSessionId: persisted.activeSessionId ?? null,
          }
        },
      },
    ),
  )
}

export const chatSessionStore = createChatSessionStore()

/**
 * 读取会话状态 / Read chat session state in React.
 * 输入 / Input: selector（返回新数组时配合 useShallow）。/ selector (use useShallow for new arrays).
 * 输出 / Output: 选中的值。/ the selected value.
 */
export function useChatSessionStore<Selected>(selector: (state: ChatSessionState) => Selected): Selected {
  return useStore(chatSessionStore, selector)
}

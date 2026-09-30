/**
 * 概览 / Overview
 * 对话会话测试 S7–S17：发送规则、冻结上下文、状态与重试、防重复、会话创建、LRU、切换、删除、
 * 回复归属、持久化与中断恢复。
 * Tests S7–S17: send rules, frozen context, status & retry, duplicate guard, session creation, LRU,
 * switching, deletion, reply ownership, persistence and interrupted-reply recovery.
 *
 * 辅助 / Helpers
 * - createControllableChatApi()：回复由测试手动完成或失败。/ replies resolved or failed by the test.
 * - createAutoReplyApi()：立即回复。/ replies immediately.
 * - createClock()：可前进的假时钟。/ an advanceable fake clock.
 * - makeStore()：用内存存储、假时钟、顺序 ID 创建 store。/ store with memory storage, fake clock, sequential ids.
 */
import { describe, expect, it, vi } from 'vitest'
import type { ChatReply, ChatRequest, ContextRef } from '../services/types'
import {
  INTERRUPTED_REPLY_MESSAGE,
  createChatSessionStore,
  evictLeastRecentlyUsed,
  selectActiveSession,
  selectSessionsByRecent,
  type ChatSession,
  type ChatSessionStoreOptions,
} from './chatSessionStore'
import { createMemoryStorage } from './storage'
import { createUiStore } from './uiStore'

const ARTICLE_A: ContextRef = { kind: 'article', id: 'article-a', label: '文章 A' }
const ARTICLE_B: ContextRef = { kind: 'article', id: 'article-b', label: '文章 B' }

interface PendingReply {
  request: ChatRequest
  resolve: (reply: ChatReply) => void
  reject: (error: Error) => void
}

function createControllableChatApi() {
  const pendingReplies: PendingReply[] = []
  const sendChat = vi.fn(
    (request: ChatRequest) =>
      new Promise<ChatReply>((resolve, reject) => pendingReplies.push({ request, resolve, reject })),
  )
  return {
    api: { sendChat },
    pendingReplies,
    reply: (index: number, content = `回复 ${index}`) => pendingReplies[index].resolve({ content, isDemo: true }),
    fail: (index: number) => pendingReplies[index].reject(new Error('网络错误')),
  }
}

function createAutoReplyApi() {
  return { sendChat: vi.fn(async (request: ChatRequest) => ({ content: `回复：${request.text}`, isDemo: true })) }
}

function createClock() {
  let currentTime = new Date('2026-09-29T19:00:00Z')
  return {
    now: () => currentTime,
    advanceMinutes: (minutes: number) => {
      currentTime = new Date(currentTime.getTime() + minutes * 60_000)
    },
  }
}

function makeStore(overrides: Partial<ChatSessionStoreOptions> = {}) {
  let idCounter = 0
  const clock = createClock()
  const storage = overrides.storage ?? createMemoryStorage()
  const store = createChatSessionStore({
    api: createAutoReplyApi(),
    storage,
    now: clock.now,
    generateId: () => `id-${++idCounter}`,
    ...overrides,
  })
  return { store, clock, storage }
}

/** 连续创建 n 个会话，每个间隔 1 分钟 / Create n sessions one minute apart. */
async function createSessions(
  store: ReturnType<typeof makeStore>['store'],
  clock: ReturnType<typeof createClock>,
  count: number,
): Promise<string[]> {
  const sessionIds: string[] = []
  for (let index = 1; index <= count; index += 1) {
    clock.advanceMinutes(1)
    store.getState().startNewSession()
    await store.getState().sendMessage(`问题 ${index}`, ARTICLE_A)
    sessionIds.push(store.getState().activeSessionId!)
  }
  return sessionIds
}

describe('sendMessage', () => {
  it('S7: ignores blank text', async () => {
    const { store } = makeStore()

    await store.getState().sendMessage('   \n ', ARTICLE_A)

    expect(store.getState().sessions).toEqual([])
  })

  it('S8: keeps the reply tied to the context frozen at send time', async () => {
    const chat = createControllableChatApi()
    const { store } = makeStore({ api: chat.api })

    const firstSend = store.getState().sendMessage('背景是什么？', ARTICLE_A)
    // 用户在回复返回前切到了文章 B / user opens article B before the reply arrives
    chat.reply(0)
    await firstSend
    const secondSend = store.getState().sendMessage('这篇呢？', ARTICLE_B)
    chat.reply(1)
    await secondSend

    const messages = selectActiveSession(store.getState())!.messages
    expect(chat.pendingReplies[0].request.contextRef).toEqual(ARTICLE_A)
    expect(messages.map((message) => message.contextRef.id)).toEqual([
      'article-a',
      'article-a',
      'article-b',
      'article-b',
    ])
  })

  it('S9: moves idle → replying → idle, and retry resends without duplicating the user message', async () => {
    const chat = createControllableChatApi()
    const { store } = makeStore({ api: chat.api })

    const sending = store.getState().sendMessage('问题', ARTICLE_A)
    expect(selectActiveSession(store.getState())!.status).toBe('replying')
    chat.fail(0)
    await sending

    const failed = selectActiveSession(store.getState())!
    expect(failed.status).toBe('error')
    expect(failed.errorMessage).toBe('网络错误')

    const retrying = store.getState().retry(failed.id)
    expect(selectActiveSession(store.getState())!.status).toBe('replying')
    expect(chat.pendingReplies[1].request).toEqual({ text: '问题', contextRef: ARTICLE_A })
    chat.reply(1)
    await retrying

    const recovered = selectActiveSession(store.getState())!
    expect(recovered.status).toBe('idle')
    expect(recovered.messages.map((message) => message.role)).toEqual(['user', 'assistant'])
  })

  it('S10: ignores a second send while the active session is replying', async () => {
    const chat = createControllableChatApi()
    const { store } = makeStore({ api: chat.api })

    const firstSend = store.getState().sendMessage('第一问', ARTICLE_A)
    await store.getState().sendMessage('重复提交', ARTICLE_A)

    expect(chat.api.sendChat).toHaveBeenCalledTimes(1)
    expect(selectActiveSession(store.getState())!.messages).toHaveLength(1)
    chat.reply(0)
    await firstSend
  })
})

describe('sessions', () => {
  it('S11: creates a session only on the first message; new chat never stores empty sessions', async () => {
    const { store } = makeStore()

    store.getState().startNewSession()
    store.getState().startNewSession()
    expect(store.getState().sessions).toHaveLength(0)

    await store.getState().sendMessage('你好，这是一条很长很长很长很长很长的第一条消息', ARTICLE_A)
    const session = selectActiveSession(store.getState())!
    expect(store.getState().sessions).toHaveLength(1)
    expect(session.title).toBe('你好，这是一条很长很长很长很长很长的第一…')

    store.getState().startNewSession()
    expect(store.getState().activeSessionId).toBeNull()
    expect(store.getState().sessions).toHaveLength(1)
  })

  it('S12: evicts the least recently used session when the 11th is created', async () => {
    const { store, clock } = makeStore()
    const sessionIds = await createSessions(store, clock, 11)

    const remainingIds = store.getState().sessions.map((session) => session.id)
    expect(remainingIds).toHaveLength(10)
    expect(remainingIds).not.toContain(sessionIds[0])
    expect(remainingIds).toContain(sessionIds[10])
  })

  it('S13: switching back refreshes lastActiveAt, so that session survives the next eviction', async () => {
    const { store, clock } = makeStore()
    const sessionIds = await createSessions(store, clock, 10)

    clock.advanceMinutes(1)
    store.getState().switchSession(sessionIds[0])
    expect(selectSessionsByRecent(store.getState())[0].id).toBe(sessionIds[0])

    await createSessions(store, clock, 1)
    const remainingIds = store.getState().sessions.map((session) => session.id)
    expect(remainingIds).toContain(sessionIds[0])
    expect(remainingIds).not.toContain(sessionIds[1])
  })

  it('S14: never evicts the active session, even when it is the oldest', () => {
    const makeSession = (id: string, lastActiveAt: string): ChatSession => ({
      id,
      title: id,
      messages: [],
      createdAt: lastActiveAt,
      lastActiveAt,
      status: 'idle',
      errorMessage: null,
      pendingRequest: null,
    })
    const sessions = [
      makeSession('oldest-active', '2026-09-29T10:00:00Z'),
      makeSession('middle', '2026-09-29T11:00:00Z'),
      makeSession('newest', '2026-09-29T12:00:00Z'),
    ]

    const remaining = evictLeastRecentlyUsed(sessions, 'oldest-active', 2)

    expect(remaining.map((session) => session.id)).toEqual(['oldest-active', 'newest'])
  })

  it('S15: switching restores messages and their contexts; deleting removes the session', async () => {
    const { store, clock } = makeStore()
    await store.getState().sendMessage('关于 A', ARTICLE_A)
    const sessionA = store.getState().activeSessionId!
    clock.advanceMinutes(1)
    store.getState().startNewSession()
    await store.getState().sendMessage('关于 B', ARTICLE_B)

    store.getState().switchSession(sessionA)
    const restored = selectActiveSession(store.getState())!
    expect(restored.messages.map((message) => message.content)).toEqual(['关于 A', '回复：关于 A'])
    expect(restored.messages.every((message) => message.contextRef.id === 'article-a')).toBe(true)

    store.getState().deleteSession(sessionA)
    expect(store.getState().sessions.map((session) => session.id)).not.toContain(sessionA)
    expect(store.getState().activeSessionId).toBeNull()
  })

  it('S16: a reply sent from session A lands in A even after switching to B', async () => {
    const chat = createControllableChatApi()
    const { store } = makeStore({ api: chat.api })

    const sendInA = store.getState().sendMessage('A 的问题', ARTICLE_A)
    const sessionA = store.getState().activeSessionId!
    store.getState().startNewSession()
    const sendInB = store.getState().sendMessage('B 的问题', ARTICLE_B)
    const sessionB = store.getState().activeSessionId!

    chat.reply(0, 'A 的回复')
    await sendInA
    const sessionsById = new Map(store.getState().sessions.map((session) => [session.id, session]))
    expect(sessionsById.get(sessionA)!.messages.map((message) => message.content)).toEqual(['A 的问题', 'A 的回复'])
    expect(sessionsById.get(sessionB)!.messages.map((message) => message.content)).toEqual(['B 的问题'])

    chat.reply(1, 'B 的回复')
    await sendInB
  })

  it('S17: persists sessions across reloads, turns interrupted replies into retryable errors, leaves UI prefs alone', async () => {
    const storage = createMemoryStorage()
    const first = makeStore({ storage })
    await first.store.getState().sendMessage('第一问', ARTICLE_A)

    const reloaded = makeStore({ storage })
    expect(reloaded.store.getState().sessions).toEqual(first.store.getState().sessions)
    expect(reloaded.store.getState().activeSessionId).toBe(first.store.getState().activeSessionId)

    const chat = createControllableChatApi()
    const interrupted = makeStore({ storage, api: chat.api })
    void interrupted.store.getState().sendMessage('第二问', ARTICLE_A) // 回复未返回即"刷新" / reload mid-reply

    const recovery = makeStore({ storage })
    const recoveredSession = selectActiveSession(recovery.store.getState())!
    expect(recoveredSession.status).toBe('error')
    expect(recoveredSession.errorMessage).toBe(INTERRUPTED_REPLY_MESSAGE)
    await recovery.store.getState().retry(recoveredSession.id)
    expect(selectActiveSession(recovery.store.getState())!.status).toBe('idle')

    const uiStore = createUiStore({ storage: createMemoryStorage() })
    uiStore.getState().setThemeMode('dark')
    recovery.store.getState().startNewSession()
    expect(uiStore.getState().themeMode).toBe('dark')
  })
})

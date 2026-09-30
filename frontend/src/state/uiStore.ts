/**
 * 概览 / Overview
 * 界面状态：主题模式、助手显隐、当前阅读上下文、访问时间、看过的事件、活动表单。
 * 只有主题模式、上次访问时间、看过的事件会存到本地；其余只在本次会话中有效。
 * UI state: theme mode, assistant visibility, reading context, visit times, seen events, event form.
 * Only theme mode, last visit time and seen events are persisted; the rest lives for this session.
 *
 * 包含 / Contents
 * - ThemeMode、UiState。
 * - DEFAULT_READING_CONTEXT：默认上下文"为你精选 · 最近 24 小时"。/ default context.
 * - createUiStore(options)：创建 store（测试可注入存储与时钟）。/ build a store (injectable storage/clock).
 * - uiStore / useUiStore(selector)：应用使用的实例与 React 钩子。/ app instance and React hook.
 */

import { useStore } from 'zustand'
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware'
import { createStore } from 'zustand/vanilla'
import type { SeenClusters } from '../lib/badges'
import {
  defaultFilters,
  type EventCategory,
  type EventFilterDraft,
  type EventQuery,
} from '../lib/eventFilters'
import type { ContextRef } from '../services/types'
import { browserStorage } from './storage'

export type ThemeMode = 'auto' | 'light' | 'dark'

export const UI_STORAGE_KEY = 'sig-ui'

export const DEFAULT_READING_CONTEXT: ContextRef = {
  kind: 'feed',
  id: null,
  label: '为你精选 · 最近 24 小时',
}

export interface UiState {
  themeMode: ThemeMode
  chatOpen: boolean
  readingContext: ContextRef
  /** 本次打开之前的那次访问时间，「新」标记以它为基准。/ Previous visit; baseline for "new". */
  previousVisitAt: string | null
  /** 最近一次访问时间（持久化）。/ Most recent visit (persisted). */
  lastVisitAt: string | null
  seenClusters: SeenClusters
  activityDraft: EventFilterDraft
  submittedActivityQuery: EventQuery | null
  activityCategory: EventCategory

  setThemeMode: (mode: ThemeMode) => void
  setChatOpen: (open: boolean) => void
  toggleChat: () => void
  setReadingContext: (context: ContextRef) => void
  /** 每次打开应用调用一次：上次访问 → previousVisitAt，本次时间 → lastVisitAt。/ Call once per app load. */
  recordVisit: () => void
  markClusterSeen: (eventClusterId: string) => void
  updateActivityDraft: (changes: Partial<EventFilterDraft>) => void
  submitActivityQuery: (query: EventQuery) => void
  setActivityCategory: (category: EventCategory) => void
}

type PersistedUiState = Pick<UiState, 'themeMode' | 'lastVisitAt' | 'seenClusters'>

export interface UiStoreOptions {
  storage?: StateStorage
  now?: () => Date
}

/**
 * 创建界面 store / Create the UI store.
 * 输入 / Input: options.storage（默认 browserStorage）、options.now（默认当前时间）。
 * 输出 / Output: Zustand vanilla store；创建时从存储同步读回持久化字段。
 *                A vanilla Zustand store that rehydrates persisted fields synchronously on creation.
 */
export function createUiStore(options: UiStoreOptions = {}) {
  const storage = options.storage ?? browserStorage
  const now = options.now ?? (() => new Date())

  return createStore<UiState>()(
    persist(
      (set) => ({
        themeMode: 'auto',
        chatOpen: true,
        readingContext: DEFAULT_READING_CONTEXT,
        previousVisitAt: null,
        lastVisitAt: null,
        seenClusters: {},
        activityDraft: defaultFilters(now()),
        submittedActivityQuery: null,
        activityCategory: '全部',

        setThemeMode: (mode) => set({ themeMode: mode }),
        setChatOpen: (open) => set({ chatOpen: open }),
        toggleChat: () => set((state) => ({ chatOpen: !state.chatOpen })),
        setReadingContext: (context) => set({ readingContext: context }),
        recordVisit: () =>
          set((state) => ({ previousVisitAt: state.lastVisitAt, lastVisitAt: now().toISOString() })),
        markClusterSeen: (eventClusterId) =>
          set((state) => ({
            seenClusters: { ...state.seenClusters, [eventClusterId]: now().toISOString() },
          })),
        updateActivityDraft: (changes) =>
          set((state) => ({ activityDraft: { ...state.activityDraft, ...changes } })),
        submitActivityQuery: (query) => set({ submittedActivityQuery: query }),
        setActivityCategory: (category) => set({ activityCategory: category }),
      }),
      {
        name: UI_STORAGE_KEY,
        version: 1,
        storage: createJSONStorage<PersistedUiState>(() => storage),
        partialize: (state): PersistedUiState => ({
          themeMode: state.themeMode,
          lastVisitAt: state.lastVisitAt,
          seenClusters: state.seenClusters,
        }),
      },
    ),
  )
}

export const uiStore = createUiStore()

/**
 * 读取界面状态 / Read UI state in React.
 * 输入 / Input: selector —— 从状态中取需要的部分（返回新数组/对象时请配合 useShallow）。
 *               pick what you need (use useShallow when returning new arrays/objects).
 * 输出 / Output: 选中的值；变化时组件重新渲染。/ the selected value; re-renders on change.
 */
export function useUiStore<Selected>(selector: (state: UiState) => Selected): Selected {
  return useStore(uiStore, selector)
}

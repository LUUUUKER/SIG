/**
 * 概览 / Overview
 * 更新状态：记录本次会话是否已自动更新、进行中的更新、最近一次成功的时间、是否失败、待显示的新内容条数。
 * 页眉（更新状态）和信息流（"有 N 条新内容"）通过它共享同一份状态。只在本次会话有效，不持久化。
 * Refresh state shared by the header status and the feed's "N new items" banner: whether this session
 * already auto-refreshed, the active run, last success time, failure flag and pending new-item count.
 * Session-only; not persisted.
 *
 * 包含 / Contents
 * - RefreshState、createRefreshStore()、refreshStore、useRefreshStore(selector)。
 */
import { useStore } from 'zustand'
import { createStore } from 'zustand/vanilla'
import type { RefreshRun } from '../services/types'

export interface RefreshState {
  /** 本次会话是否已判断过自动更新（StrictMode 重复执行也只判断一次）。/ Auto-refresh already considered. */
  autoRefreshAttempted: boolean
  activeRunId: string | null
  /** 当前这次更新是否由用户手动发起。/ Whether the active run was started manually. */
  activeRunIsManual: boolean
  lastHandledRunId: string | null
  /** 最近一次成功更新的完成时间（早于信息流重新获取时用于页眉）。/ Last success, shown before the feed refetches. */
  latestRunAt: string | null
  lastRunFailed: boolean
  /** 已更新但尚未显示到列表的新内容条数。/ New items not yet applied to the list. */
  pendingNewArticleCount: number

  markAutoRefreshAttempted: () => void
  beginRun: (runId: string, manual: boolean) => void
  /**
   * 处理已结束的更新（同一个 run 只处理一次）。返回 true 表示本次确实处理了。
   * Handle a finished run once; returns true when it was handled now.
   */
  completeRun: (run: RefreshRun) => boolean
  markStartFailed: () => void
  clearPending: () => void
}

/**
 * 创建更新 store / Create the refresh store.
 * 输出 / Output: Zustand vanilla store。
 */
export function createRefreshStore() {
  return createStore<RefreshState>()((set, get) => ({
    autoRefreshAttempted: false,
    activeRunId: null,
    activeRunIsManual: false,
    lastHandledRunId: null,
    latestRunAt: null,
    lastRunFailed: false,
    pendingNewArticleCount: 0,

    markAutoRefreshAttempted: () => set({ autoRefreshAttempted: true }),

    beginRun: (runId, manual) => set({ activeRunId: runId, activeRunIsManual: manual, lastRunFailed: false }),

    /**
     * 完成更新 / Complete a run.
     * 步骤 / Steps
     * 1. 仍在进行或已处理过 → 忽略。/ Still running or already handled → ignore.
     * 2. 成功：记录完成时间，累加待显示条数。/ Success: record time, add pending items.
     * 3. 失败：标记失败。/ Failure: flag it.
     */
    completeRun: (run) => {
      if (run.status === 'running' || get().lastHandledRunId === run.id) return false // 步骤 1
      if (run.status === 'succeeded') {
        set((state) => ({
          lastHandledRunId: run.id,
          latestRunAt: run.finishedAt,
          lastRunFailed: false,
          pendingNewArticleCount: state.pendingNewArticleCount + run.newArticleCount,
        })) // 步骤 2 / Step 2
      } else {
        set({ lastHandledRunId: run.id, lastRunFailed: true }) // 步骤 3 / Step 3
      }
      return true
    },

    markStartFailed: () => set({ lastRunFailed: true, activeRunId: null }),

    clearPending: () => set({ pendingNewArticleCount: 0 }),
  }))
}

export const refreshStore = createRefreshStore()

/** 读取更新状态 / Read refresh state in React. */
export function useRefreshStore<Selected>(selector: (state: RefreshState) => Selected): Selected {
  return useStore(refreshStore, selector)
}

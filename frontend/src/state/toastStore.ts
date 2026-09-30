/**
 * 概览 / Overview
 * 提示条状态：同一时间只显示一条（新提示替换旧提示），6.5 秒后自动消失，可带"撤销"。
 * Toast state: one toast at a time (a new one replaces the old), auto-dismissed after 6.5s,
 * with an optional undo action.
 *
 * 包含 / Contents
 * - Toast、ToastState、TOAST_DURATION_MS。
 * - createToastStore()：创建 store。/ build a store.
 * - toastStore / useToastStore(selector)：应用实例与 React 钩子。
 */

import { useStore } from 'zustand'
import { createStore } from 'zustand/vanilla'

export const TOAST_DURATION_MS = 6_500

export interface Toast {
  id: number
  message: string
  undo: (() => void) | null
}

export interface ToastState {
  toast: Toast | null
  showToast: (message: string, undo?: () => void) => void
  dismissToast: () => void
  /** 执行撤销并关闭提示。/ Run the undo action and close the toast. */
  undoToast: () => void
}

/**
 * 创建提示 store / Create the toast store.
 * 输出 / Output: Zustand vanilla store；计时器保存在闭包中，新提示会重置计时。
 *                The timer lives in a closure; each new toast restarts it.
 */
export function createToastStore() {
  let dismissTimer: ReturnType<typeof setTimeout> | null = null
  let toastCounter = 0

  /** 清除计时器 / Clear the pending timer. */
  function clearDismissTimer() {
    if (dismissTimer !== null) clearTimeout(dismissTimer)
    dismissTimer = null
  }

  return createStore<ToastState>()((set, get) => ({
    toast: null,

    /**
     * 显示提示 / Show a toast.
     * 步骤 / Steps: 1. 替换当前提示。2. 重置 6.5 秒自动关闭计时。
     * 1. Replace the current toast. 2. Restart the 6.5s dismissal timer.
     */
    showToast(message, undo) {
      toastCounter += 1
      set({ toast: { id: toastCounter, message, undo: undo ?? null } }) // 步骤 1 / Step 1
      clearDismissTimer() // 步骤 2 / Step 2
      dismissTimer = setTimeout(() => set({ toast: null }), TOAST_DURATION_MS)
    },

    dismissToast() {
      clearDismissTimer()
      set({ toast: null })
    },

    undoToast() {
      const undo = get().toast?.undo
      clearDismissTimer()
      set({ toast: null })
      undo?.()
    },
  }))
}

export const toastStore = createToastStore()

/** 读取提示状态 / Read toast state in React. */
export function useToastStore<Selected>(selector: (state: ToastState) => Selected): Selected {
  return useStore(toastStore, selector)
}

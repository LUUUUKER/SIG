/**
 * 概览 / Overview
 * 提示条测试 S19：显示、撤销、6.5 秒自动消失、新提示重置计时。
 * Test S19: show, undo, auto-dismiss after 6.5s, and a new toast restarting the timer.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { TOAST_DURATION_MS, createToastStore } from './toastStore'

afterEach(() => {
  vi.useRealTimers()
})

describe('toastStore', () => {
  it('S19: shows, undoes, and auto-dismisses after 6.5 seconds', () => {
    vi.useFakeTimers()
    const store = createToastStore()
    const undo = vi.fn()

    store.getState().showToast('已加入稍后阅读', undo)
    expect(store.getState().toast?.message).toBe('已加入稍后阅读')

    store.getState().undoToast()
    expect(undo).toHaveBeenCalledOnce()
    expect(store.getState().toast).toBeNull()

    store.getState().showToast('第一条')
    vi.advanceTimersByTime(TOAST_DURATION_MS - 1000)
    store.getState().showToast('第二条') // 重置计时 / restarts the timer
    vi.advanceTimersByTime(1000)
    expect(store.getState().toast?.message).toBe('第二条')

    vi.advanceTimersByTime(TOAST_DURATION_MS)
    expect(store.getState().toast).toBeNull()
  })
})

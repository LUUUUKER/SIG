/**
 * 概览 / Overview
 * 访问记录测试 H7：上次访问成为 previousVisitAt，本次写入 lastVisitAt；StrictMode 重复执行与重复挂载
 * 都不会覆盖基准；首次访问 previousVisitAt 为空。
 * Test H7: the previous visit becomes previousVisitAt and this one is written to lastVisitAt;
 * StrictMode double effects and remounts do not overwrite the baseline; first visit has null.
 */
import { renderHook } from '@testing-library/react'
import { StrictMode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { uiStore } from '../state/uiStore'
import { useVisitTracker } from './useVisitTracker'

afterEach(() => {
  vi.useRealTimers()
})

describe('useVisitTracker', () => {
  it('H7: records the visit once per session, keeping the previous visit as the baseline', () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-09-29T19:00:00Z'))
    uiStore.setState({ lastVisitAt: '2026-09-28T10:00:00.000Z' })

    renderHook(() => useVisitTracker(), { wrapper: StrictMode })
    renderHook(() => useVisitTracker()) // 再次挂载 / a second mount

    expect(uiStore.getState().previousVisitAt).toBe('2026-09-28T10:00:00.000Z')
    expect(uiStore.getState().lastVisitAt).toBe('2026-09-29T19:00:00.000Z')
  })

  it('H7: leaves previousVisitAt empty on the very first visit', () => {
    renderHook(() => useVisitTracker())

    expect(uiStore.getState().previousVisitAt).toBeNull()
    expect(uiStore.getState().lastVisitAt).not.toBeNull()
  })
})

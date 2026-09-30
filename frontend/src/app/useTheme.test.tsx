/**
 * 概览 / Overview
 * 主题钩子测试 H5：自动模式按洛杉矶时间切换并每分钟重算；手动模式优先；写入 <html data-theme>。
 * Test H5: auto mode follows LA time and re-evaluates each minute; manual wins; writes <html data-theme>.
 */
import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { uiStore } from '../state/uiStore'
import { THEME_TICK_MS, useTheme } from './useTheme'

afterEach(() => {
  vi.useRealTimers()
})

describe('useTheme', () => {
  it('H5: switches from dark to light within a minute of 06:00 LA, and manual mode wins', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-15T13:59:30Z')) // LA 05:59:30（冬令时）

    const { result } = renderHook(() => useTheme())
    expect(result.current).toBe('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')

    act(() => {
      vi.advanceTimersByTime(THEME_TICK_MS) // → LA 06:00:30
    })
    expect(result.current).toBe('light')
    expect(document.documentElement.dataset.theme).toBe('light')

    act(() => {
      uiStore.getState().setThemeMode('dark')
    })
    expect(result.current).toBe('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
  })
})

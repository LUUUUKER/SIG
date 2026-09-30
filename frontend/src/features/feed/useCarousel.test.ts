/**
 * 概览 / Overview
 * 轮播逻辑测试 H1–H4：8 秒前进并循环、各种保持条件、手动切换暂停与恢复、0 条和 1 条。
 * Tests H1–H4: 8s advance with wrap, hold conditions, manual pause/resume, zero and one slide.
 */
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { setViewportMatches } from '../../test/testUtils'
import { CAROUSEL_INTERVAL_MS, useCarousel } from './useCarousel'

/** 创建钩子 / Render the hook. */
function renderCarousel(count: number) {
  const scrollToIndex = vi.fn()
  const view = renderHook(() => useCarousel({ count, scrollToIndex }))
  return { ...view, scrollToIndex }
}

/** 前进若干个周期 / Advance by whole intervals. */
function advanceIntervals(intervals: number) {
  act(() => {
    vi.advanceTimersByTime(intervals * CAROUSEL_INTERVAL_MS)
  })
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
  Reflect.deleteProperty(document, 'hidden')
})

describe('useCarousel', () => {
  it('H1: advances every 8 seconds and wraps from the last slide to the first', () => {
    const { result, scrollToIndex } = renderCarousel(3)

    advanceIntervals(1)
    expect(result.current.index).toBe(1)
    expect(scrollToIndex).toHaveBeenLastCalledWith(1)

    advanceIntervals(2)
    expect(result.current.index).toBe(0)
    expect(scrollToIndex).toHaveBeenLastCalledWith(0)
  })

  it('H2: holds while hovered, focused inside, tab hidden, or with reduced motion', () => {
    const { result } = renderCarousel(3)

    act(() => result.current.holdHandlers.onMouseEnter())
    advanceIntervals(1)
    expect(result.current.index).toBe(0)
    act(() => result.current.holdHandlers.onMouseLeave())

    act(() => result.current.holdHandlers.onFocus())
    advanceIntervals(1)
    expect(result.current.index).toBe(0)
    act(() =>
      result.current.holdHandlers.onBlur({
        currentTarget: { contains: () => false },
        relatedTarget: null,
      } as never),
    )

    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true })
    advanceIntervals(1)
    expect(result.current.index).toBe(0)
    Reflect.deleteProperty(document, 'hidden')

    advanceIntervals(1)
    expect(result.current.index).toBe(1)

    setViewportMatches(true) // 所有媒体查询成立 → 偏好减少动态效果 / reduced motion preferred
    const reduced = renderCarousel(3)
    expect(reduced.result.current.paused).toBe(true)
    advanceIntervals(2)
    expect(reduced.result.current.index).toBe(0)
  })

  it('H3: manual navigation pauses; play resumes auto-advance; touch pauses', () => {
    const { result } = renderCarousel(3)

    act(() => result.current.goTo(2))
    expect(result.current.index).toBe(2)
    expect(result.current.paused).toBe(true)
    advanceIntervals(2)
    expect(result.current.index).toBe(2)

    act(() => result.current.togglePause())
    expect(result.current.paused).toBe(false)
    advanceIntervals(1)
    expect(result.current.index).toBe(0)

    act(() => result.current.holdHandlers.onPointerDown({ pointerType: 'touch' }))
    expect(result.current.paused).toBe(true)
  })

  it('H4: starts no timer for zero slides and never moves a single slide', () => {
    const empty = renderCarousel(0)
    expect(vi.getTimerCount()).toBe(0)
    advanceIntervals(2)
    expect(empty.scrollToIndex).not.toHaveBeenCalled()
    empty.unmount()

    const single = renderCarousel(1)
    expect(vi.getTimerCount()).toBe(0)
    advanceIntervals(2)
    expect(single.result.current.index).toBe(0)
  })
})

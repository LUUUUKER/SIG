/**
 * 概览 / Overview
 * 头版轮播逻辑：每 8 秒前进一条（末条后回到首条）；鼠标悬停、键盘焦点在轮播内、标签页隐藏时不前进；
 * 系统开启"减少动态效果"时默认暂停；手动切换或触摸后进入暂停，点播放恢复。
 * 滚动由调用方执行（scrollToIndex），本钩子只管"该到第几条"。
 * Headline carousel logic: advance every 8s (wrapping); hold while hovered, focused or the tab is
 * hidden; paused by default with reduced motion; manual navigation or touch pauses; play resumes.
 * The caller performs scrolling via scrollToIndex; this hook only decides the index.
 *
 * 包含 / Contents
 * - CAROUSEL_INTERVAL_MS、REDUCED_MOTION_QUERY。
 * - useCarousel({ count, scrollToIndex, intervalMs })。
 */
import { useCallback, useEffect, useRef, useState, type FocusEvent } from 'react'

export const CAROUSEL_INTERVAL_MS = 8_000
export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

interface UseCarouselOptions {
  count: number
  /** 滚动到第 index 条（由组件实现）。/ Scroll to slide `index` (implemented by the component). */
  scrollToIndex: (index: number) => void
  intervalMs?: number
}

/** 是否偏好减少动态效果 / Whether reduced motion is preferred. */
function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia(REDUCED_MOTION_QUERY).matches
}

/**
 * 轮播 / Carousel.
 * 输出 / Output
 * - index、paused：当前条与是否暂停。/ current slide and paused flag.
 * - goTo(i)、next()、prev()：手动切换（会暂停）。/ manual navigation (pauses).
 * - togglePause()：播放 / 暂停。/ play or pause.
 * - syncIndex(i)：用户拖动滚动后同步当前条（不暂停、不再次滚动）。/ sync after user scrolling.
 * - holdHandlers：挂在轮播根元素上的悬停 / 焦点 / 触摸处理。/ hover, focus and touch handlers.
 * 步骤 / Steps
 * 1. 少于 2 条或已暂停 → 不启动计时器。/ No timer with <2 slides or when paused.
 * 2. 每次计时：悬停、焦点在内或标签页隐藏时跳过，否则前进一条并滚动。/ Skip while held; else advance.
 */
export function useCarousel({ count, scrollToIndex, intervalMs = CAROUSEL_INTERVAL_MS }: UseCarouselOptions) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(prefersReducedMotion)
  const indexRef = useRef(0)
  const hoveredRef = useRef(false)
  const focusedRef = useRef(false)
  const scrollToIndexRef = useRef(scrollToIndex)

  useEffect(() => {
    scrollToIndexRef.current = scrollToIndex
  }, [scrollToIndex])

  const moveTo = useCallback(
    (targetIndex: number) => {
      if (count === 0) return
      const wrappedIndex = ((targetIndex % count) + count) % count
      indexRef.current = wrappedIndex
      setIndex(wrappedIndex)
      scrollToIndexRef.current(wrappedIndex)
    },
    [count],
  )

  useEffect(() => {
    if (count < 2 || paused) return // 步骤 1 / Step 1
    const timer = setInterval(() => {
      if (hoveredRef.current || focusedRef.current || document.hidden) return // 步骤 2 / Step 2
      moveTo(indexRef.current + 1)
    }, intervalMs)
    return () => clearInterval(timer)
  }, [count, paused, intervalMs, moveTo])

  const goTo = useCallback(
    (targetIndex: number) => {
      setPaused(true)
      moveTo(targetIndex)
    },
    [moveTo],
  )

  const syncIndex = useCallback((visibleIndex: number) => {
    indexRef.current = visibleIndex
    setIndex(visibleIndex)
  }, [])

  const holdHandlers = {
    onMouseEnter: () => {
      hoveredRef.current = true
    },
    onMouseLeave: () => {
      hoveredRef.current = false
    },
    onFocus: () => {
      focusedRef.current = true
    },
    onBlur: (event: FocusEvent<HTMLElement>) => {
      focusedRef.current = event.currentTarget.contains(event.relatedTarget as Node | null)
    },
    onPointerDown: (event: { pointerType: string }) => {
      if (event.pointerType === 'touch') setPaused(true)
    },
  }

  return {
    index,
    paused,
    goTo,
    next: () => goTo(indexRef.current + 1),
    prev: () => goTo(indexRef.current - 1),
    togglePause: () => setPaused((current) => !current),
    syncIndex,
    holdHandlers,
  }
}

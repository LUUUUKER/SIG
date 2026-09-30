/**
 * 概览 / Overview
 * 滚动记忆：记住每个列表地址的滚动位置；浏览器"返回"（POP）回到该列表时恢复，其他方式进入则回到顶部。
 * 桌面由中栏 #main-content 滚动，窄屏由整个页面滚动，两者都会记录与恢复。
 * Scroll memory: remember each list URL's scroll position; restore it on history back (POP) and
 * start at the top otherwise. Desktop scrolls #main-content, narrow screens scroll the page; both are handled.
 *
 * 包含 / Contents
 * - clearScrollMemory()：清空记录（测试用）。/ clear all positions (tests).
 * - useScrollMemory(key, ready)：key 通常是 pathname + search；ready 为数据已渲染。
 */
import { useEffect, useLayoutEffect, useRef } from 'react'
import { useNavigationType } from 'react-router'
import { MAIN_CONTENT_ID } from '../../lib/layoutIds'

const scrollPositions = new Map<string, number>()

/** 清空记录 / Clear remembered positions. */
export function clearScrollMemory(): void {
  scrollPositions.clear()
}

/** 当前滚动位置（中栏或页面，取正在滚动的那个）/ Current position of whichever container scrolls. */
function readScrollTop(): number {
  const mainContent = document.getElementById(MAIN_CONTENT_ID)
  return Math.max(mainContent?.scrollTop ?? 0, document.documentElement.scrollTop)
}

/** 设置滚动位置 / Apply a position to both possible containers. */
function writeScrollTop(scrollTop: number): void {
  const mainContent = document.getElementById(MAIN_CONTENT_ID)
  if (mainContent !== null) mainContent.scrollTop = scrollTop
  document.documentElement.scrollTop = scrollTop
}

/**
 * 滚动记忆 / Scroll memory.
 * 输入 / Input: key —— 列表地址；ready —— 列表内容是否已渲染（未渲染时无法恢复）。
 * 输出 / Output: 无。/ none.
 * 步骤 / Steps
 * 1. 监听中栏与页面的滚动事件，持续记录 key 对应的位置。/ Record positions on scroll.
 * 2. ready 后对每个 key 只恢复一次：POP 且有记录 → 恢复；否则回到顶部。/ Restore once per key when ready.
 */
export function useScrollMemory(key: string, ready: boolean): void {
  const navigationType = useNavigationType()
  const restoredKeyRef = useRef<string | null>(null)

  useEffect(() => {
    const recordPosition = () => scrollPositions.set(key, readScrollTop()) // 步骤 1 / Step 1
    const mainContent = document.getElementById(MAIN_CONTENT_ID)
    mainContent?.addEventListener('scroll', recordPosition, { passive: true })
    window.addEventListener('scroll', recordPosition, { passive: true })
    return () => {
      mainContent?.removeEventListener('scroll', recordPosition)
      window.removeEventListener('scroll', recordPosition)
    }
  }, [key])

  useLayoutEffect(() => {
    if (!ready || restoredKeyRef.current === key) return // 步骤 2 / Step 2
    restoredKeyRef.current = key
    const savedPosition = scrollPositions.get(key)
    writeScrollTop(navigationType === 'POP' && savedPosition !== undefined ? savedPosition : 0)
  }, [key, ready, navigationType])
}

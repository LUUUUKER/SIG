/**
 * 概览 / Overview
 * 媒体查询钩子：返回某个 CSS 媒体查询当前是否成立，并在窗口变化时更新。
 * Media query hook: whether a CSS media query currently matches, updated on change.
 *
 * 包含 / Contents
 * - DESKTOP_QUERY：桌面断点（≥951px），助手面板默认显示。/ desktop breakpoint.
 * - useMediaQuery(query)。
 */
import { useSyncExternalStore } from 'react'

export const DESKTOP_QUERY = '(min-width: 951px)'

/**
 * 媒体查询 / Media query.
 * 输入 / Input: query —— 例如 "(min-width: 951px)"。
 * 输出 / Output: boolean；没有 matchMedia 的环境返回 false。/ false where matchMedia is unavailable.
 * 实现 / How: useSyncExternalStore 订阅 MediaQueryList 的 change 事件，避免渲染与实际状态不一致。
 *            Subscribes to the MediaQueryList change event via useSyncExternalStore.
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      if (typeof window.matchMedia !== 'function') return () => {}
      const mediaQueryList = window.matchMedia(query)
      mediaQueryList.addEventListener('change', onChange)
      return () => mediaQueryList.removeEventListener('change', onChange)
    },
    () => (typeof window.matchMedia === 'function' ? window.matchMedia(query).matches : false),
  )
}

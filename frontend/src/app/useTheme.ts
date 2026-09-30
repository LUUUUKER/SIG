/**
 * 概览 / Overview
 * 主题钩子：把 uiStore.themeMode 解析成实际主题并写到 <html data-theme>。
 * 自动模式按洛杉矶时间（06:00–18:00 浅色）；通过"分钟时钟"每分钟重新计算，跨过边界时自动切换。
 * Theme hook: resolve uiStore.themeMode into the actual theme and write <html data-theme>.
 * Auto mode follows LA time (light 06:00–18:00) and re-evaluates every minute via a minute clock.
 *
 * 包含 / Contents
 * - THEME_TICK_MS：分钟时钟的检查间隔。/ minute clock interval.
 * - resolveTheme(mode, now)：纯函数。/ pure resolver.
 * - useMinuteClock()：返回当前分钟序号，每分钟变化一次。/ current minute number, changes once a minute.
 * - useTheme()：返回实际主题。/ returns the resolved theme.
 */
import { useEffect, useSyncExternalStore } from 'react'
import { themeForTime, type Theme } from '../lib/laTime'
import { useUiStore, type ThemeMode } from '../state/uiStore'

export const THEME_TICK_MS = 60_000

/**
 * 解析主题 / Resolve theme.
 * 输入 / Input: mode、now。
 * 输出 / Output: 手动模式直接返回；自动模式按时间计算。/ manual modes win; auto uses the time.
 */
export function resolveTheme(mode: ThemeMode, now: Date): Theme {
  return mode === 'auto' ? themeForTime(now) : mode
}

/** 订阅分钟时钟 / Subscribe to the minute clock. */
function subscribeToMinuteClock(onChange: () => void): () => void {
  const timer = setInterval(onChange, THEME_TICK_MS)
  return () => clearInterval(timer)
}

/** 当前分钟序号 / Current minute number since the epoch. */
function currentMinute(): number {
  return Math.floor(Date.now() / THEME_TICK_MS)
}

/**
 * 分钟时钟 / Minute clock.
 * 输出 / Output: 自 1970 年起的分钟数；同一分钟内不变，因此不会引起多余渲染。
 *                Minutes since the epoch; stable within a minute, so it causes no extra renders.
 */
export function useMinuteClock(): number {
  return useSyncExternalStore(subscribeToMinuteClock, currentMinute)
}

/**
 * 主题钩子 / Theme hook.
 * 输出 / Output: 当前实际主题。/ the resolved theme.
 * 步骤 / Steps
 * 1. 读取 themeMode 与分钟时钟。/ Read themeMode and the minute clock.
 * 2. 解析出实际主题。/ Resolve the theme.
 * 3. 主题变化时写入 <html data-theme>。/ Write <html data-theme> when it changes.
 */
export function useTheme(): Theme {
  const themeMode = useUiStore((state) => state.themeMode) // 步骤 1 / Step 1
  const minute = useMinuteClock()
  const theme = resolveTheme(themeMode, new Date(minute * THEME_TICK_MS)) // 步骤 2 / Step 2

  useEffect(() => {
    document.documentElement.dataset.theme = theme // 步骤 3 / Step 3
  }, [theme])

  return theme
}

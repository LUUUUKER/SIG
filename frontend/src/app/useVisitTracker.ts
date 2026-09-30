/**
 * 概览 / Overview
 * 访问记录钩子：应用启动时记录一次访问，使上次访问时间成为「新」标记的基准。
 * Visit tracker: records one visit on app start so the previous visit becomes the "new" baseline.
 *
 * 包含 / Contents
 * - useVisitTracker()。
 */
import { useEffect } from 'react'
import { useUiStore } from '../state/uiStore'

/**
 * 记录访问 / Record the visit.
 * 输出 / Output: 无；调用 uiStore.recordVisit()（同一会话内只生效一次，StrictMode 重复执行也安全）。
 *                none; calls uiStore.recordVisit(), which is a no-op after the first call per session.
 */
export function useVisitTracker(): void {
  const recordVisit = useUiStore((state) => state.recordVisit)

  useEffect(() => {
    recordVisit()
  }, [recordVisit])
}

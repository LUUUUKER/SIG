/**
 * 概览 / Overview
 * 收藏切换（界面层）：包装 useToggleSaved，并负责提示条与"是否已收藏"的查询。
 * Save toggle for the UI: wraps useToggleSaved, adds toasts and exposes an "is saved" lookup.
 *
 * 包含 / Contents
 * - useSaveToggle()：返回 { isSaved(articleId), toggleSaved(article) }。
 */
import { useCallback, useMemo } from 'react'
import { useSaved, useToggleSaved } from '../../services/queries'
import type { Article } from '../../services/types'
import { toastStore } from '../../state/toastStore'

/**
 * 收藏切换 / Save toggle.
 * 输出 / Output
 * - isSaved(articleId)：根据收藏列表（含乐观更新）判断。/ based on the saved list, including optimistic state.
 * - toggleSaved(article)：切换状态；成功提示结果，失败提示已恢复。/ toggle with success/failure toasts.
 */
export function useSaveToggle() {
  const savedQuery = useSaved()
  const { mutate } = useToggleSaved()

  const savedIds = useMemo(() => new Set((savedQuery.data ?? []).map((article) => article.id)), [savedQuery.data])

  const isSaved = useCallback((articleId: string) => savedIds.has(articleId), [savedIds])

  const toggleSaved = useCallback(
    (article: Article) => {
      const saved = !savedIds.has(article.id)
      mutate(
        { article, saved },
        {
          onSuccess: () => toastStore.getState().showToast(saved ? '已加入稍后阅读 · 本次预览内有效' : '已取消收藏'),
          onError: () => toastStore.getState().showToast('收藏没有成功，已恢复原状态，请重试'),
        },
      )
    },
    [mutate, savedIds],
  )

  return { isSaved, toggleSaved }
}

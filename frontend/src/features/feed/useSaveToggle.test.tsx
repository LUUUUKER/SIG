/**
 * 概览 / Overview
 * 收藏切换测试 H9：点击后立即显示已收藏（数据层尚未返回）；失败时恢复原状态并提示。
 * Test H9: saved state shows immediately before the data layer answers; failures roll back with a toast.
 */
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { createQueryClient } from '../../services/queryClient'
import { toastStore } from '../../state/toastStore'
import { createTestApi, TestProviders } from '../../test/testUtils'
import { useSaveToggle } from './useSaveToggle'

/** 带较长延迟的 API，便于观察乐观状态 / A slow API so the optimistic state is observable. */
function renderSaveToggle() {
  const api = createTestApi({ latencyMs: 200 })
  const queryClient = createQueryClient({ retry: false })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <TestProviders api={api} queryClient={queryClient}>
      {children}
    </TestProviders>
  )
  return { ...renderHook(() => useSaveToggle(), { wrapper }), api }
}

describe('useSaveToggle', () => {
  it('H9: shows saved immediately, then confirms', async () => {
    const { result, api } = renderSaveToggle()
    const article = await api.getArticle('news-ai-agents')

    act(() => result.current.toggleSaved(article))
    await waitFor(() => expect(result.current.isSaved(article.id)).toBe(true), { timeout: 150 })

    await waitFor(() => expect(toastStore.getState().toast?.message).toContain('已加入稍后阅读'))
    expect(result.current.isSaved(article.id)).toBe(true)
  })

  it('H9: rolls back and shows a toast when saving fails', async () => {
    const { result, api } = renderSaveToggle()
    const article = await api.getArticle('news-sports-nba')
    api.configureMock({ failNext: 'setSaved' })

    act(() => result.current.toggleSaved(article))
    await waitFor(() => expect(result.current.isSaved(article.id)).toBe(true), { timeout: 150 })

    await waitFor(() => expect(result.current.isSaved(article.id)).toBe(false))
    expect(toastStore.getState().toast?.message).toBe('收藏没有成功，已恢复原状态，请重试')
  })
})

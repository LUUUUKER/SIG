/**
 * 概览 / Overview
 * 自动更新测试 H6：上次更新在 9 小时前 → 只发起一次（StrictMode 重复执行也不重复）；1 小时前 → 不发起。
 * Test H6: last run 9h ago → exactly one refresh, even under StrictMode; 1h ago → none.
 */
import { renderHook, waitFor } from '@testing-library/react'
import { StrictMode, type ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { createQueryClient } from '../services/queryClient'
import { createTestApi, TestProviders } from '../test/testUtils'
import { useAutoRefresh } from './useAutoRefresh'

const HOUR_MS = 3_600_000

/** 用指定"上次更新"渲染钩子 / Render the hook with a given last-run age. */
function renderAutoRefresh(hoursSinceLastRun: number) {
  const api = createTestApi({
    initialLastRunAt: new Date(Date.now() - hoursSinceLastRun * HOUR_MS).toISOString(),
  })
  const startRefresh = vi.spyOn(api, 'startRefresh')
  const queryClient = createQueryClient({ retry: false })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <StrictMode>
      <TestProviders api={api} queryClient={queryClient}>
        {children}
      </TestProviders>
    </StrictMode>
  )
  const view = renderHook(() => useAutoRefresh(), { wrapper })
  return { ...view, startRefresh }
}

describe('useAutoRefresh', () => {
  it('H6: starts exactly one refresh when the last run is 9 hours old', async () => {
    const { result, startRefresh } = renderAutoRefresh(9)

    await waitFor(() => expect(result.current.status).toBe('running'))
    expect(startRefresh).toHaveBeenCalledTimes(1)
  })

  it('H6: does not refresh when the last run is 1 hour old', async () => {
    const { result, startRefresh } = renderAutoRefresh(1)

    await waitFor(() => expect(result.current.lastRunAt).not.toBeNull())
    expect(result.current.status).toBe('idle')
    expect(startRefresh).not.toHaveBeenCalled()
  })
})

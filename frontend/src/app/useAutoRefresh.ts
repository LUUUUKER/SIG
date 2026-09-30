/**
 * 概览 / Overview
 * 自动更新钩子：应用打开且信息流加载后，若距上次更新 ≥ 8 小时就在后台更新一次；也提供手动更新。
 * 更新完成后只更新页眉时间并累计"有 N 条新内容"，不直接改动列表（由用户点击后才刷新）。
 * Auto-refresh hook: once the feed loads, refresh in the background if the last run is ≥ 8h old;
 * also offers manual refresh. On completion it updates the header time and the pending "N new items"
 * count, but never changes the list until the user asks.
 *
 * 包含 / Contents
 * - useAutoRefresh()：返回给 RefreshStatus 的 props。/ returns RefreshStatus props.
 */
import { useCallback, useEffect } from 'react'
import type { RefreshStatusProps, RefreshViewStatus } from '../components/Header/RefreshStatus'
import { needsRefresh } from '../lib/freshness'
import { useFeed, useRefreshRun, useStartRefresh } from '../services/queries'
import { refreshStore, useRefreshStore } from '../state/refreshStore'
import { toastStore } from '../state/toastStore'
import { THEME_TICK_MS, useMinuteClock } from './useTheme'

/**
 * 自动更新 / Auto refresh.
 * 输出 / Output: { status, lastRunAt, now, onRefresh }。
 * 步骤 / Steps
 * 1. 信息流首次加载后，本会话只判断一次：needsRefresh 为真就自动发起（StrictMode 下也只一次）。
 *    After the first feed load, decide once per session and start if needsRefresh is true.
 * 2. 发起：调用 startRefresh，成功后记录 runId（开始轮询），失败则标记失败。/ Start; record the run or failure.
 * 3. 轮询到结束状态：交给 refreshStore.completeRun 处理一次；手动更新且没有新内容时提示"已是最新"。
 *    When the run ends, hand it to completeRun once; manual runs with no news show "up to date".
 * 4. 汇总页眉状态：进行中 / 失败 / 空闲，时间优先用最近一次成功的完成时间。
 *    Summarize header status; prefer the latest success time.
 */
export function useAutoRefresh(): RefreshStatusProps {
  const feed = useFeed()
  const startRefresh = useStartRefresh()
  const activeRunId = useRefreshStore((state) => state.activeRunId)
  const latestRunAt = useRefreshStore((state) => state.latestRunAt)
  const lastRunFailed = useRefreshStore((state) => state.lastRunFailed)
  const refreshRun = useRefreshRun(activeRunId)
  const minute = useMinuteClock()
  const { mutate: mutateStart, isPending: startPending } = startRefresh

  const beginRefresh = useCallback(
    (manual: boolean) => {
      mutateStart(undefined, {
        onSuccess: (run) => refreshStore.getState().beginRun(run.id, manual), // 步骤 2 / Step 2
        onError: () => refreshStore.getState().markStartFailed(),
      })
    },
    [mutateStart],
  )

  useEffect(() => {
    if (feed.data === undefined || refreshStore.getState().autoRefreshAttempted) return // 步骤 1
    refreshStore.getState().markAutoRefreshAttempted()
    const lastRunAt = feed.data.lastRunAt === null ? null : new Date(feed.data.lastRunAt)
    if (needsRefresh(lastRunAt, new Date())) beginRefresh(false)
  }, [feed.data, beginRefresh])

  useEffect(() => {
    const run = refreshRun.data // 步骤 3 / Step 3
    if (run === undefined) return
    const handled = refreshStore.getState().completeRun(run)
    if (handled && run.status === 'succeeded' && run.newArticleCount === 0 && refreshStore.getState().activeRunIsManual) {
      toastStore.getState().showToast('已是最新内容')
    }
  }, [refreshRun.data])

  const running = startPending || refreshRun.data?.status === 'running' // 步骤 4 / Step 4
  const status: RefreshViewStatus = running ? 'running' : lastRunFailed ? 'failed' : 'idle'

  return {
    status,
    lastRunAt: latestRunAt ?? feed.data?.lastRunAt ?? null,
    now: new Date(minute * THEME_TICK_MS),
    onRefresh: () => {
      if (!running) beginRefresh(true)
    },
  }
}

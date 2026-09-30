/**
 * 概览 / Overview
 * 更新状态：显示"更新于 X 前 / 更新中… / 更新失败 · 重试"，附手动刷新按钮。纯展示组件，
 * 数据由上层传入（1b 为静态值，1c 接 useAutoRefresh）。
 * Refresh status: "updated X ago / updating… / failed · retry" with a manual refresh button.
 * Presentational only; the parent supplies data (static in 1b, useAutoRefresh from 1c).
 *
 * 包含 / Contents
 * - RefreshViewStatus、RefreshStatusProps。
 * - RefreshStatus(props)。
 */
import { formatUpdatedAgo } from '../../lib/freshness'
import { RefreshIcon } from '../icons/Icons'
import styles from './Header.module.css'

export type RefreshViewStatus = 'idle' | 'running' | 'failed'

export interface RefreshStatusProps {
  status: RefreshViewStatus
  lastRunAt: string | null
  now: Date
  onRefresh: () => void
}

/**
 * 更新状态 / Refresh status.
 * 输入 / Input: status、lastRunAt、now、onRefresh。
 * 输出 / Output
 * - idle：文字"更新于 X 前"（从未更新为"尚未更新"）+ 可点的刷新图标。
 * - running：文字"更新中…"，刷新按钮禁用。
 * - failed："更新失败 · 重试"按钮，点击即重试。
 */
export function RefreshStatus({ status, lastRunAt, now, onRefresh }: RefreshStatusProps) {
  const agoText = formatUpdatedAgo(lastRunAt === null ? null : new Date(lastRunAt), now)
  const idleText = lastRunAt === null ? agoText : `更新于 ${agoText}`

  return (
    <div className={styles.refresh} aria-live="polite">
      {status === 'failed' ? (
        <button type="button" className={styles.refreshFailed} onClick={onRefresh}>
          更新失败 · 重试
        </button>
      ) : (
        <span className={styles.refreshText}>{status === 'running' ? '更新中…' : idleText}</span>
      )}
      <button
        type="button"
        className={styles.iconButton}
        aria-label="立即更新"
        title="立即更新"
        disabled={status === 'running'}
        data-spinning={status === 'running'}
        onClick={onRefresh}
      >
        <RefreshIcon size={16} />
      </button>
    </div>
  )
}

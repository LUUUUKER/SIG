/**
 * 概览 / Overview
 * 新内容提示："有 N 条新内容 · 点击查看"。后台更新完成后出现，点击才刷新列表，阅读中不跳动。
 * "N new items · click to view". Appears after a background refresh; the list only changes on click.
 *
 * 包含 / Contents
 * - NewContentBanner({ count, onApply })。
 */
import styles from './Feed.module.css'

interface NewContentBannerProps {
  count: number
  onApply: () => void
}

/**
 * 新内容提示 / New-content banner.
 * 输入 / Input: count（≤0 时不渲染）、onApply。/ nothing is rendered when count ≤ 0.
 */
export function NewContentBanner({ count, onApply }: NewContentBannerProps) {
  if (count <= 0) return null
  return (
    <button type="button" className={styles.banner} onClick={onApply}>
      有 {count} 条新内容 · 点击查看
    </button>
  )
}

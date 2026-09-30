/**
 * 概览 / Overview
 * 通用状态块：加载中、空、失败（可重试）。任何数据区域都用它表达非正常状态，不用假数据掩盖。
 * Shared status block for loading, empty and error (with retry). Data areas use it instead of hiding
 * problems behind fake content.
 *
 * 包含 / Contents
 * - StatusView({ state, message, onRetry })。
 */
import styles from './StatusView.module.css'

export type StatusViewState = 'loading' | 'empty' | 'error'

interface StatusViewProps {
  state: StatusViewState
  message?: string
  onRetry?: () => void
}

const DEFAULT_MESSAGES: Record<StatusViewState, string> = {
  loading: '正在加载…',
  empty: '这里暂时没有内容。',
  error: '加载失败。',
}

/**
 * 状态块 / Status block.
 * 输入 / Input: state、message（可选，覆盖默认文案）、onRetry（仅 error 时显示重试按钮）。
 * 输出 / Output: 加载与空态用 role="status"，失败用 role="alert"。
 *                role="status" for loading/empty, role="alert" for errors.
 */
export function StatusView({ state, message, onRetry }: StatusViewProps) {
  const text = message ?? DEFAULT_MESSAGES[state]
  return (
    <div className={styles.status} role={state === 'error' ? 'alert' : 'status'} data-state={state}>
      <p>{text}</p>
      {state === 'error' && onRetry !== undefined && (
        <button type="button" className={styles.retry} onClick={onRetry}>
          重试
        </button>
      )}
    </div>
  )
}

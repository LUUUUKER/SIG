/**
 * 概览 / Overview
 * 当前阅读上下文：默认折叠为一行"当前 · 标题"，展开后显示完整标题与说明。
 * Current reading context: a collapsed "当前 · title" line that expands to the full title and a note.
 *
 * 包含 / Contents
 * - ContextSummary({ context })。
 */
import type { ContextRef } from '../../services/types'
import styles from './Chat.module.css'

interface ContextSummaryProps {
  context: ContextRef
}

/**
 * 上下文摘要 / Context summary.
 * 输入 / Input: context —— 当前阅读上下文。
 * 输出 / Output: <details>，默认关闭。/ a closed-by-default <details>.
 */
export function ContextSummary({ context }: ContextSummaryProps) {
  return (
    <details className={styles.context}>
      <summary aria-label={`当前阅读上下文：${context.label}，展开查看`}>
        <span className={styles.contextLabel}>当前</span>
        <strong>{context.label}</strong>
      </summary>
      <div className={styles.contextFull}>
        <span>{context.label}</span>
        <p>新问题将关联这里的内容；切换文章会保留已有对话。</p>
      </div>
    </details>
  )
}

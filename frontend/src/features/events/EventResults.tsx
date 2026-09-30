/**
 * 概览 / Overview
 * 活动结果区：未搜索 / 搜索中 / 失败可重试 / 尚未接入四种状态。阶段 1 没有真实活动数据，因此只显示
 * 明确标注"分类示例"的方向说明，绝不显示伪造的场次、票价或链接。
 * Event results: idle, loading, error with retry, or not connected. Phase 1 has no real events, so it
 * only shows category explanations clearly labelled as examples, never fabricated listings.
 *
 * 包含 / Contents
 * - EventResultsStatus。
 * - describeQuery(query)：把已提交条件转成一句话。/ one-line summary of the submitted query.
 * - EventResults({ status, query, category, onRetry })。
 */
import { StatusView } from '../../components/StatusView'
import type { EventCategory, EventQuery } from '../../lib/eventFilters'
import styles from './Events.module.css'

export type EventResultsStatus = 'idle' | 'loading' | 'error' | 'not_connected'

const CATEGORY_EXAMPLES: ReadonlyArray<{ category: Exclude<EventCategory, '全部'>; title: string; body: string }> = [
  { category: '演出', title: '音乐现场，让周末有另一种节奏', body: '音乐节、Live House、Jazz、戏剧与喜剧演出。' },
  { category: '比赛', title: '走进看台，感受比赛的现场', body: '篮球、足球、棒球及其他值得关注的体育赛事。' },
  { category: '社交活动', title: '认识一些有共同兴趣的人', body: '科技聚会、行业交流、读书会与兴趣社群。' },
  { category: '展览与放映', title: '给自己一次新的观看方式', body: '艺术展览、电影节、特别放映与映后交流。' },
]

/**
 * 条件摘要 / Query summary.
 * 输入 / Input: query。
 * 输出 / Output: 例如"洛杉矶 · 60 miles · 2026-09-29 至 2026-10-29 · 预算不限"。
 */
function describeQuery(query: EventQuery): string {
  const budget =
    query.maxBudgetPerPerson === null
      ? '预算不限'
      : query.maxBudgetPerPerson === 0
        ? '只看免费'
        : `每人 $${query.maxBudgetPerPerson} 以内`
  return `${query.location} · ${query.radiusMiles} miles · ${query.startDate} 至 ${query.endDate} · ${budget}`
}

interface EventResultsProps {
  status: EventResultsStatus
  query: EventQuery | null
  category: EventCategory
  onRetry: () => void
}

/**
 * 结果区 / Results.
 * 输出 / Output: 状态提示 + 按分类过滤的"分类示例"卡片（明确说明不是真实活动）。
 *                A status line plus category example cards that state they are not real events.
 */
export function EventResults({ status, query, category, onRetry }: EventResultsProps) {
  const examples = CATEGORY_EXAMPLES.filter((example) => category === '全部' || example.category === category)

  return (
    <div>
      {status === 'loading' && <StatusView state="loading" message="正在搜索活动…" />}
      {status === 'error' && <StatusView state="error" message="活动搜索失败，条件已保留。" onRetry={onRetry} />}
      {status === 'not_connected' && query !== null && (
        <p className={styles.notice} role="status">
          已记录搜索条件：{describeQuery(query)}。活动搜索尚未接入真实数据源，因此不会显示任何活动。
        </p>
      )}
      <p className={styles.disclosure}>以下是分类示例，尚未检索真实活动；不代表存在对应场次、票价或可售门票。</p>
      {examples.map((example, index) => (
        <section key={example.category} className={styles.card} aria-label={`分类示例：${example.category}`}>
          <div className={styles.datebox}>
            {String(index + 1).padStart(2, '0')}
            <span>探索方向</span>
          </div>
          <div>
            <div className={styles.meta}>
              <span className={styles.tag}>{example.category}</span>
              <span>分类示例</span>
            </div>
            <h2>{example.title}</h2>
            <p>{example.body}</p>
            <p>接入后将展示：日期与时间 · 场地与距离 · 票价 · 官方链接</p>
          </div>
        </section>
      ))}
    </div>
  )
}

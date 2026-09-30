/**
 * 概览 / Overview
 * 文章卡片：序号、领域、类型、阅读时长、「新」「更新」标记、演示标注、标题（进入详情）、摘要、
 * 来源外链（新标签页，带安全属性）、"与 sig 深聊"、收藏按钮。
 * Article card: number, domain, type, reading time, new/update badge, demo marker, title (opens detail),
 * summary, external source link (new tab, safe rel), "discuss with sig" and a save button.
 *
 * 包含 / Contents
 * - ArticleCard({ article, index, badge, saved, onToggleSave, onDiscuss })。
 */
import { Link } from 'react-router'
import { BADGE_LABELS, type Badge } from '../../lib/badges'
import type { Article } from '../../services/types'
import styles from './Feed.module.css'

interface ArticleCardProps {
  article: Article
  index: number
  badge: Badge
  saved: boolean
  onToggleSave: (article: Article) => void
  onDiscuss: (article: Article) => void
}

/**
 * 文章卡片 / Article card.
 * 输入 / Input: article、index（从 0 开始，显示为 01）、badge、saved、两个回调。
 * 输出 / Output: <article>。收藏按钮用 aria-pressed 表示状态，名称随状态在"收藏文章/取消收藏"间切换。
 *                The save button exposes aria-pressed and switches its name between save/unsave.
 */
export function ArticleCard({ article, index, badge, saved, onToggleSave, onDiscuss }: ArticleCardProps) {
  const source = article.sources[0]

  return (
    <article className={styles.story}>
      <span className={styles.number}>{String(index + 1).padStart(2, '0')}</span>
      <div>
        <div className={styles.meta}>
          <span className={styles.tag}>{article.domain}</span>
          <span>{article.type}</span>
          <span>深读 {article.readingMinutes} 分钟</span>
          {badge !== null && (
            <span className={styles.badge} data-badge={badge}>
              {BADGE_LABELS[badge]}
            </span>
          )}
          {article.isDemo && <span className={styles.demo}>演示</span>}
        </div>
        <Link to={`/article/${encodeURIComponent(article.id)}`} className={styles.storyTitle}>
          {article.title}
        </Link>
        <p>{article.summary}</p>
        <div className={styles.storyFooter}>
          {source !== undefined && (
            <a href={source.url} target="_blank" rel="noopener noreferrer">
              {source.publisher} ↗
            </a>
          )}
          <button type="button" onClick={() => onDiscuss(article)}>
            与 sig 深聊 →
          </button>
        </div>
      </div>
      <button
        type="button"
        className={styles.save}
        aria-pressed={saved}
        aria-label={saved ? '取消收藏' : '收藏文章'}
        title={saved ? '取消收藏' : '收藏文章'}
        onClick={() => onToggleSave(article)}
      >
        {saved ? '◆' : '◇'}
      </button>
    </article>
  )
}

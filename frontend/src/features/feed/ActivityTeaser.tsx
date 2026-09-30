/**
 * 概览 / Overview
 * 首页活动入口：地点与范围取自活动表单的当前条件（修复原型写死 LA 的问题），链接到近期活动页。
 * Home activity teaser: location and radius come from the event form state (fixing the prototype's
 * hard-coded LA) and link to the events page.
 *
 * 包含 / Contents
 * - ActivityTeaser()。
 */
import { Link } from 'react-router'
import { useUiStore } from '../../state/uiStore'
import styles from './Feed.module.css'

/** 活动入口 / Activity teaser. */
export function ActivityTeaser() {
  const location = useUiStore((state) => state.activityDraft.location)
  const radiusMiles = useUiStore((state) => state.activityDraft.radiusMiles)

  return (
    <section className={styles.activity} aria-labelledby="activity-teaser-title">
      <div className={styles.datebox}>
        {location}
        <span>{radiusMiles} MILES</span>
      </div>
      <div>
        <h2 id="activity-teaser-title">把好奇心，带到生活里。</h2>
        <p>近期活动 · 从现在起一个月 · 演出 / 比赛 / 社交 / 展览</p>
      </div>
      <Link to="/events" className={styles.activityLink}>
        探索近期活动 ↗
      </Link>
    </section>
  )
}

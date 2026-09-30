/**
 * 概览 / Overview
 * 活动分类：全部 / 演出 / 比赛 / 社交活动 / 展览与放映，当前项 aria-pressed="true"。
 * Event categories with aria-pressed on the current one.
 *
 * 包含 / Contents
 * - EventCategoryTabs({ value, onChange })。
 */
import { EVENT_CATEGORIES, type EventCategory } from '../../lib/eventFilters'
import styles from './Events.module.css'

interface EventCategoryTabsProps {
  value: EventCategory
  onChange: (category: EventCategory) => void
}

/** 活动分类 / Event category tabs. */
export function EventCategoryTabs({ value, onChange }: EventCategoryTabsProps) {
  return (
    <div className={styles.tabs} role="group" aria-label="活动分类">
      {EVENT_CATEGORIES.map((category) => (
        <button key={category} type="button" aria-pressed={category === value} onClick={() => onChange(category)}>
          {category}
        </button>
      ))}
    </div>
  )
}

/**
 * 概览 / Overview
 * 内容类型切换：新闻 / 精选文章 / 名人动态，当前项 aria-pressed="true"。
 * Content type switch (news / long reads / people); the current one has aria-pressed="true".
 *
 * 包含 / Contents
 * - ContentTypeTabs({ value, onChange })。
 */
import { CONTENT_TYPES, type ContentType } from '../../lib/domains'
import styles from './Feed.module.css'

interface ContentTypeTabsProps {
  value: ContentType
  onChange: (contentType: ContentType) => void
}

/** 内容类型切换 / Content type tabs. */
export function ContentTypeTabs({ value, onChange }: ContentTypeTabsProps) {
  return (
    <div className={styles.tabs} role="group" aria-label="内容类型">
      {CONTENT_TYPES.map((contentType) => (
        <button
          key={contentType}
          type="button"
          aria-pressed={contentType === value}
          onClick={() => onChange(contentType)}
        >
          {contentType}
        </button>
      ))}
    </div>
  )
}

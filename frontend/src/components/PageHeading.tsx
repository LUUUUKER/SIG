/**
 * 概览 / Overview
 * 页面标题：领域页、稍后阅读、近期活动等使用的紧凑标题；首页可只对读屏可见（原型首页不显示大标题）。
 * Page heading used by domain, saved and events pages; the home page can keep it screen-reader only
 * (the prototype shows no big heading on home).
 *
 * 包含 / Contents
 * - PageHeading({ title, visuallyHidden })。
 */
import styles from './PageHeading.module.css'

interface PageHeadingProps {
  title: string
  visuallyHidden?: boolean
}

/**
 * 页面标题 / Page heading.
 * 输入 / Input: title；visuallyHidden 为 true 时只对读屏可见。/ screen-reader only when true.
 * 输出 / Output: <h1>。
 */
export function PageHeading({ title, visuallyHidden = false }: PageHeadingProps) {
  if (visuallyHidden) return <h1 className="visually-hidden">{title}</h1>
  return (
    <div className={styles.heading}>
      <h1>{title}</h1>
    </div>
  )
}

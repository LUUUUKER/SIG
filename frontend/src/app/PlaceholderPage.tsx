/**
 * 概览 / Overview
 * 临时占位页（仅阶段 1b 使用）：让路由与布局可以先跑起来。1c 会用真实页面替换并删除本文件。
 * Temporary placeholder (phase 1b only) so routing and layout work; replaced and deleted in 1c.
 *
 * 包含 / Contents
 * - PlaceholderPage({ title })。
 * - DomainPlaceholder()：读取 :domain 参数的临时领域页。/ temporary domain page reading :domain.
 */
import { useParams } from 'react-router'
import { StatusView } from '../components/StatusView'

interface PlaceholderPageProps {
  title: string
}

/**
 * 占位页 / Placeholder page.
 * 输入 / Input: title —— 页面名称。
 * 输出 / Output: 标题 + 空状态说明，明确告知内容尚未实现。/ heading plus an honest "not built yet" note.
 */
export function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <section>
      <h1 style={{ font: '500 24px/1.5 var(--display)', margin: '0 0 20px' }}>{title}</h1>
      <StatusView state="empty" message="这个页面将在阶段 1c 实现。" />
    </section>
  )
}

/** 领域占位页 / Domain placeholder (reads the :domain param). */
export function DomainPlaceholder() {
  const { domain } = useParams()
  return <PlaceholderPage title={domain ?? '领域'} />
}

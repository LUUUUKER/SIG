/**
 * 概览 / Overview
 * 稍后阅读：显示收藏的文章（最近收藏在前），不受 24 小时窗口限制；没有收藏时显示空状态。
 * Saved articles, most recent first, not limited by the 24h window; empty state when none.
 *
 * 包含 / Contents
 * - SavedPage()。
 */
import { useEffect } from 'react'
import { PageHeading } from '../../components/PageHeading'
import { StatusView } from '../../components/StatusView'
import { useSaved } from '../../services/queries'
import { useUiStore } from '../../state/uiStore'
import { ArticleList } from '../feed/ArticleList'

/**
 * 稍后阅读 / Saved page.
 * 步骤 / Steps: 1. 设置阅读上下文。2. 加载收藏：加载中 / 失败可重试 / 列表或空状态。
 * 1. Set the reading context. 2. Load saved items with loading, retry and empty states.
 */
export function SavedPage() {
  const saved = useSaved()
  const setReadingContext = useUiStore((state) => state.setReadingContext)

  useEffect(() => {
    setReadingContext({ kind: 'feed', id: null, label: '稍后阅读' }) // 步骤 1 / Step 1
  }, [setReadingContext])

  function renderBody() {
    if (saved.isPending) return <StatusView state="loading" message="正在加载收藏…" /> // 步骤 2 / Step 2
    if (saved.isError) {
      return <StatusView state="error" message="收藏加载失败。" onRetry={() => void saved.refetch()} />
    }
    return <ArticleList articles={saved.data} emptyMessage="还没有收藏。点击内容旁的 ◇ 即可加入。" />
  }

  return (
    <section>
      <PageHeading title="稍后阅读" />
      {renderBody()}
    </section>
  )
}

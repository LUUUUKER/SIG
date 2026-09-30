/**
 * 概览 / Overview
 * 文章列表：信息流与稍后阅读共用。为每张卡片计算「新」「更新」标记、收藏状态，并处理收藏与"与 sig 深聊"。
 * Article list shared by the feed and saved pages: computes badges and saved state per card and
 * handles saving and "discuss with sig".
 *
 * 包含 / Contents
 * - ArticleList({ articles, emptyMessage })。
 */
import { useNavigate } from 'react-router'
import { StatusView } from '../../components/StatusView'
import { badgeFor } from '../../lib/badges'
import type { Article } from '../../services/types'
import { toastStore } from '../../state/toastStore'
import { useUiStore } from '../../state/uiStore'
import { useOpenChat } from '../chat/useOpenChat'
import { ArticleCard } from './ArticleCard'
import { useSaveToggle } from './useSaveToggle'

interface ArticleListProps {
  articles: Article[]
  emptyMessage: string
}

/**
 * 文章列表 / Article list.
 * 输入 / Input: articles、emptyMessage（列表为空时显示）。/ shown when the list is empty.
 * 步骤 / Steps
 * 1. 读取上次访问时间与看过的事件，用 badgeFor 算标记。/ Compute badges from visit data.
 * 2. 收藏：交给 useSaveToggle。/ Saving via useSaveToggle.
 * 3. 深聊：进入详情、打开助手并聚焦输入框、提示已关联。/ Discuss: open detail, open chat, focus input.
 */
export function ArticleList({ articles, emptyMessage }: ArticleListProps) {
  const previousVisitAt = useUiStore((state) => state.previousVisitAt) // 步骤 1 / Step 1
  const seenClusters = useUiStore((state) => state.seenClusters)
  const { isSaved, toggleSaved } = useSaveToggle() // 步骤 2 / Step 2
  const openChat = useOpenChat()
  const navigate = useNavigate()

  if (articles.length === 0) return <StatusView state="empty" message={emptyMessage} />

  const previousVisit = previousVisitAt === null ? null : new Date(previousVisitAt)

  function discuss(article: Article) {
    navigate(`/article/${encodeURIComponent(article.id)}`) // 步骤 3 / Step 3
    openChat()
    toastStore.getState().showToast('已关联这篇文章，可以在右侧继续提问')
  }

  return (
    <div>
      {articles.map((article, index) => (
        <ArticleCard
          key={article.id}
          article={article}
          index={index}
          badge={badgeFor(article, previousVisit, seenClusters)}
          saved={isSaved(article.id)}
          onToggleSave={toggleSaved}
          onDiscuss={discuss}
        />
      ))}
    </div>
  )
}

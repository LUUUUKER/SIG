/**
 * 概览 / Overview
 * 信息流页：首页（/）与领域页（/domain/:domain）共用。读取 ?type= 决定内容类型；首页选"新闻"时显示头版轮播；
 * 显示"有 N 条新内容"提示、内容类型切换、文章列表；首页底部放活动入口。
 * Feed page for home (/) and domains (/domain/:domain). ?type= selects the content type; home + news
 * shows the headline carousel; also the new-content banner, type tabs, article list and, on home,
 * the activity teaser.
 *
 * 包含 / Contents
 * - FeedPage()。
 */
import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useLocation, useParams, useSearchParams } from 'react-router'
import { PageHeading } from '../../components/PageHeading'
import { StatusView } from '../../components/StatusView'
import { DEFAULT_CONTENT_TYPE, DOMAINS, parseContentType, type ContentType } from '../../lib/domains'
import { queryKeys, useFeed } from '../../services/queries'
import { refreshStore, useRefreshStore } from '../../state/refreshStore'
import { useUiStore } from '../../state/uiStore'
import { NotFoundPage } from '../notFound/NotFoundPage'
import { ActivityTeaser } from './ActivityTeaser'
import { ArticleList } from './ArticleList'
import { ContentTypeTabs } from './ContentTypeTabs'
import { HeadlineCarousel } from './HeadlineCarousel'
import { NewContentBanner } from './NewContentBanner'
import { useScrollMemory } from './useScrollMemory'

/**
 * 信息流页 / Feed page.
 * 步骤 / Steps
 * 1. 解析领域参数（非法领域显示 404 内容）与内容类型。/ Parse domain (invalid → 404) and type.
 * 2. 设置阅读上下文为"<领域或为你精选> · <类型>"。/ Set the reading context.
 * 3. 读取信息流：加载中 / 失败可重试 / 成功。/ Load the feed with loading and retry states.
 * 4. 按领域与类型筛选；首页 + 新闻时显示头版。/ Filter; show headlines on home + news.
 * 5. "有 N 条新内容"：点击后清零并重新获取信息流。/ Banner click clears the count and refetches.
 * 6. 滚动记忆：数据渲染后按导航方式恢复或回到顶部。/ Scroll memory once data is rendered.
 */
export function FeedPage() {
  const { domain: domainParam } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const location = useLocation()
  const queryClient = useQueryClient()
  const feed = useFeed()
  const setReadingContext = useUiStore((state) => state.setReadingContext)
  const pendingNewArticleCount = useRefreshStore((state) => state.pendingNewArticleCount)

  const isHome = domainParam === undefined // 步骤 1 / Step 1
  const domain = DOMAINS.find((item) => item === domainParam)
  const contentType = parseContentType(searchParams.get('type'))
  const invalidDomain = !isHome && domain === undefined
  const pageLabel = domain ?? '为你精选'

  useEffect(() => {
    if (invalidDomain) return // 步骤 2 / Step 2
    setReadingContext({ kind: 'feed', id: null, label: `${pageLabel} · ${contentType}` })
  }, [invalidDomain, pageLabel, contentType, setReadingContext])

  useScrollMemory(location.pathname + location.search, feed.data !== undefined) // 步骤 6 / Step 6

  if (invalidDomain) return <NotFoundPage />

  function selectContentType(nextType: ContentType) {
    setSearchParams(nextType === DEFAULT_CONTENT_TYPE ? {} : { type: nextType })
  }

  function applyNewContent() {
    refreshStore.getState().clearPending() // 步骤 5 / Step 5
    void queryClient.invalidateQueries({ queryKey: queryKeys.feed })
  }

  function renderBody() {
    if (feed.isPending) return <StatusView state="loading" message="正在加载最近 24 小时的内容…" /> // 步骤 3
    if (feed.isError) {
      return <StatusView state="error" message="信息流加载失败。" onRetry={() => void feed.refetch()} />
    }
    const articles = feed.data.articles.filter(
      (article) => article.type === contentType && (domain === undefined || article.domain === domain),
    ) // 步骤 4 / Step 4
    const showHeadlines = isHome && contentType === DEFAULT_CONTENT_TYPE
    return (
      <>
        {showHeadlines && <HeadlineCarousel headlines={feed.data.headlines} />}
        <ContentTypeTabs value={contentType} onChange={selectContentType} />
        <ArticleList articles={articles} emptyMessage="这个分类暂时没有内容。试试其他领域或内容类型。" />
      </>
    )
  }

  return (
    <section>
      <PageHeading title={pageLabel} visuallyHidden={isHome} />
      <NewContentBanner count={pendingNewArticleCount} onApply={applyNewContent} />
      {renderBody()}
      {isHome && <ActivityTeaser />}
    </section>
  )
}

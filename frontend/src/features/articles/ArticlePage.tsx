/**
 * 概览 / Overview
 * 文章详情：返回、元信息、标题、导语、重点摘要、AI 分析与评价（进入页面后才加载，有加载与失败状态）、
 * 值得追问的问题、原始来源（新标签页）、"围绕这篇继续聊"。打开时把阅读上下文设为本文，并把事件记为已看。
 * Article detail: back, meta, title, lede, key points, AI analysis (loaded on entry, with loading and
 * error states), open questions, original source (new tab) and "keep discussing". On open it sets the
 * reading context to this article and marks its event as seen.
 *
 * 包含 / Contents
 * - ArticlePage()。
 * - AnalysisSection({ articleId })：分析区块。/ the analysis block.
 */
import { useEffect } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router'
import { StatusView } from '../../components/StatusView'
import { MAIN_CONTENT_ID } from '../../lib/layoutIds'
import { NotFoundError } from '../../services/errors'
import { useArticle, useArticleAnalysis } from '../../services/queries'
import { useUiStore } from '../../state/uiStore'
import { useOpenChat } from '../chat/useOpenChat'
import styles from './Article.module.css'

/**
 * 分析区块 / Analysis section.
 * 输入 / Input: articleId。
 * 输出 / Output: 加载中提示 / 失败 + 重试 / "AI 分析与评价"与"还值得追问什么？"。
 */
function AnalysisSection({ articleId }: { articleId: string }) {
  const analysis = useArticleAnalysis(articleId)

  if (analysis.isPending) {
    return (
      <div className={styles.analysisBox}>
        <h2>AI 分析与评价</h2>
        <p role="status">AI 分析生成中…</p>
      </div>
    )
  }
  if (analysis.isError) {
    return (
      <div className={styles.analysisBox}>
        <h2>AI 分析与评价</h2>
        <StatusView state="error" message="分析暂时没有生成成功。" onRetry={() => void analysis.refetch()} />
      </div>
    )
  }
  return (
    <>
      <div className={styles.analysisBox}>
        <h2>AI 分析与评价</h2>
        <p>{analysis.data.analysis}</p>
      </div>
      <h2>还值得追问什么？</h2>
      <p>{analysis.data.openQuestions}</p>
    </>
  )
}

/**
 * 文章详情 / Article page.
 * 步骤 / Steps
 * 1. 读取 :articleId 并加载文章；找不到与其他失败分别显示。/ Load; separate not-found from other errors.
 * 2. 加载成功后：设置阅读上下文、记为已看、滚到顶部。/ On success: set context, mark seen, scroll top.
 * 3. 返回：站内有历史则后退，直接打开时回首页。/ Back: history back, or home when opened directly.
 */
export function ArticlePage() {
  const { articleId = '' } = useParams()
  const article = useArticle(articleId) // 步骤 1 / Step 1
  const navigate = useNavigate()
  const location = useLocation()
  const openChat = useOpenChat()
  const setReadingContext = useUiStore((state) => state.setReadingContext)
  const markClusterSeen = useUiStore((state) => state.markClusterSeen)
  const loadedArticle = article.data

  useEffect(() => {
    if (loadedArticle === undefined) return // 步骤 2 / Step 2
    setReadingContext({ kind: 'article', id: loadedArticle.id, label: loadedArticle.title })
    markClusterSeen(loadedArticle.eventClusterId)
    const mainContent = document.getElementById(MAIN_CONTENT_ID)
    if (mainContent !== null) mainContent.scrollTop = 0
    document.documentElement.scrollTop = 0
  }, [loadedArticle, setReadingContext, markClusterSeen])

  function goBack() {
    if (location.key !== 'default') navigate(-1) // 步骤 3 / Step 3
    else navigate('/')
  }

  const backButton = (
    <button type="button" className={styles.back} onClick={goBack}>
      ← 返回
    </button>
  )

  if (article.isPending) return <StatusView state="loading" message="正在打开文章…" />
  if (article.isError) {
    return (
      <section>
        {backButton}
        {article.error instanceof NotFoundError ? (
          <StatusView state="empty" message="找不到这篇文章，可能已超出保留范围。" />
        ) : (
          <StatusView state="error" message="文章加载失败。" onRetry={() => void article.refetch()} />
        )}
      </section>
    )
  }

  const { data } = article
  const source = data.sources[0]

  return (
    <article className={styles.detail}>
      {backButton}
      <div className={styles.meta}>
        <span className={styles.tag}>
          {data.domain} / {data.type}
        </span>
        <span>深读 {data.readingMinutes} 分钟</span>
        {data.isDemo && <span>演示</span>}
      </div>
      <h1>{data.title}</h1>
      <p className={styles.lede}>{data.summary}</p>
      <h2>重点摘要</h2>
      <ul className={styles.keyPoints}>
        {data.keyPoints.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>
      <AnalysisSection articleId={data.id} />
      <div className={styles.sources}>
        {source !== undefined && (
          <a href={source.url} target="_blank" rel="noopener noreferrer">
            打开原始参考资料 ↗
          </a>
        )}
        <button type="button" onClick={openChat}>
          围绕这篇继续聊 →
        </button>
      </div>
      {data.isDemo && <p className={styles.demoNote}>演示说明：本文为设计样稿，不是实时报道；链接指向相关参考页面。</p>}
    </article>
  )
}

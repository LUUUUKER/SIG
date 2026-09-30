/**
 * 概览 / Overview
 * 头版轮播：横向滚动吸附的大卡片（每领域一条）、领域标签、"01 / 07"计数、前后切换与播放/暂停。
 * 非当前幻灯片设为 inert（不可聚焦、读屏跳过）；宽度变化时重新对齐到当前条。
 * 程序发起的平滑滚动进行中，忽略中途的滚动事件（否则会把当前条误同步为动画经过的位置）。
 * Headline carousel: scroll-snapped hero slides (one per domain), domain tabs, "01 / 07" counter,
 * prev/next and play/pause. Inactive slides are inert; realigns on width changes. While a
 * programmatic smooth scroll runs, intermediate scroll events are ignored so the index never
 * snaps back to a slide the animation merely passes.
 *
 * 包含 / Contents
 * - PROGRAMMATIC_SCROLL_TIMEOUT_MS：程序滚动目标的兜底清除时间。/ fallback to clear the scroll target.
 * - HeadlineCarousel({ headlines })。
 */
import { useCallback, useEffect, useRef } from 'react'
import { Link } from 'react-router'
import type { Article } from '../../services/types'
import { REDUCED_MOTION_QUERY, useCarousel } from './useCarousel'
import styles from './Feed.module.css'

export const PROGRAMMATIC_SCROLL_TIMEOUT_MS = 1_000

interface HeadlineCarouselProps {
  headlines: Article[]
}

/** 两位序号 / Two-digit number. */
function padTwo(value: number): string {
  return String(value).padStart(2, '0')
}

/**
 * 头版轮播 / Headline carousel.
 * 输入 / Input: headlines（已按领域顺序；为空时不渲染）。/ ordered headlines; renders nothing when empty.
 * 步骤 / Steps
 * 1. scrollToIndex：记下"程序滚动目标"，再把轨道滚到第 i 条（减少动态效果时瞬移）；1 秒后兜底清除目标。
 *    Record the programmatic target, then scroll (instant with reduced motion); clear it after 1s at most.
 * 2. 滚动事件：有程序目标时只等待到达目标（到达即清除），不同步中途位置；没有目标（用户拖动）才按位置同步。
 *    With a programmatic target, wait for arrival and ignore intermediate positions; otherwise sync.
 * 3. 用户开始触摸 / 拖动 / 滚轮时，取消程序目标，交还手动控制。/ User input cancels the target.
 * 4. 轨道宽度变化（助手显隐、窗口缩放）时，对齐到程序目标或当前条。/ Realign to the target or index.
 */
export function HeadlineCarousel({ headlines }: HeadlineCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const scrollTargetRef = useRef<number | null>(null)
  const scrollTargetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearScrollTarget = useCallback(() => {
    scrollTargetRef.current = null
    if (scrollTargetTimerRef.current !== null) clearTimeout(scrollTargetTimerRef.current)
    scrollTargetTimerRef.current = null
  }, [])

  const scrollToIndex = useCallback(
    (slideIndex: number) => {
      const track = trackRef.current // 步骤 1 / Step 1
      if (track === null || typeof track.scrollTo !== 'function') return
      clearScrollTarget()
      scrollTargetRef.current = slideIndex
      scrollTargetTimerRef.current = setTimeout(clearScrollTarget, PROGRAMMATIC_SCROLL_TIMEOUT_MS)
      const reduced = typeof window.matchMedia === 'function' && window.matchMedia(REDUCED_MOTION_QUERY).matches
      track.scrollTo({ left: slideIndex * track.clientWidth, behavior: reduced ? 'instant' : 'smooth' })
    },
    [clearScrollTarget],
  )

  const carousel = useCarousel({ count: headlines.length, scrollToIndex })
  const { index, syncIndex } = carousel
  const indexRef = useRef(index)

  useEffect(() => {
    indexRef.current = index
  }, [index])

  useEffect(() => clearScrollTarget, [clearScrollTarget])

  useEffect(() => {
    const track = trackRef.current // 步骤 4 / Step 4
    if (track === null || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => {
      if (typeof track.scrollTo === 'function') {
        const alignIndex = scrollTargetRef.current ?? indexRef.current
        track.scrollTo({ left: alignIndex * track.clientWidth, behavior: 'instant' })
      }
    })
    observer.observe(track)
    return () => observer.disconnect()
  }, [])

  if (headlines.length === 0) return null

  function handleScroll() {
    const track = trackRef.current // 步骤 2 / Step 2
    if (track === null || track.clientWidth === 0) return
    const targetIndex = scrollTargetRef.current
    if (targetIndex !== null) {
      if (Math.abs(track.scrollLeft - targetIndex * track.clientWidth) <= 1) clearScrollTarget()
      return
    }
    const visibleIndex = Math.round(track.scrollLeft / track.clientWidth)
    if (visibleIndex !== indexRef.current) syncIndex(Math.min(headlines.length - 1, Math.max(0, visibleIndex)))
  }

  return (
    <section
      className={styles.headlines}
      aria-label="七个领域头版轮播"
      aria-roledescription="轮播"
      {...carousel.holdHandlers}
    >
      <div
        className={styles.track}
        ref={trackRef}
        onScroll={handleScroll}
        onPointerDown={clearScrollTarget} // 步骤 3 / Step 3
        onWheel={clearScrollTarget}
      >
        {headlines.map((article, slideIndex) => {
          const source = article.sources[0]
          return (
            <article
              key={article.id}
              className={styles.slide}
              aria-roledescription="幻灯片"
              aria-label={`${slideIndex + 1} / ${headlines.length} ${article.domain}`}
              inert={slideIndex !== index}
            >
              <div className={styles.heroArt} aria-hidden="true" />
              <div className={styles.heroCopy}>
                <div className={styles.meta}>
                  <span className={styles.tag}>{article.domain} / 头版</span>
                  <span>深读 {article.readingMinutes} 分钟</span>
                  {article.isDemo && <span>演示</span>}
                </div>
                <h2>{article.title}</h2>
                <p>{article.summary}</p>
                <div className={styles.heroActions}>
                  <Link to={`/article/${encodeURIComponent(article.id)}`} className={styles.filled}>
                    阅读全文 →
                  </Link>
                  {source !== undefined && (
                    <a href={source.url} target="_blank" rel="noopener noreferrer">
                      阅读来源 ↗
                    </a>
                  )}
                </div>
              </div>
            </article>
          )
        })}
      </div>
      <div className={styles.controls}>
        <div className={styles.topics} role="group" aria-label="选择头版领域">
          {headlines.map((article, slideIndex) => (
            <button
              key={article.id}
              type="button"
              aria-pressed={slideIndex === index}
              aria-label={`查看${article.domain}头版`}
              onClick={() => carousel.goTo(slideIndex)}
            >
              {article.domain}
            </button>
          ))}
        </div>
        <div className={styles.playback}>
          <span data-testid="headline-count">
            {padTwo(index + 1)} / {padTwo(headlines.length)}
          </span>
          <button type="button" aria-label="上一条头版" onClick={carousel.prev}>
            ←
          </button>
          <button
            type="button"
            aria-label={carousel.paused ? '开始自动播放' : '暂停自动播放'}
            onClick={carousel.togglePause}
          >
            {carousel.paused ? '播放' : '暂停'}
          </button>
          <button type="button" aria-label="下一条头版" onClick={carousel.next}>
            →
          </button>
        </div>
      </div>
    </section>
  )
}

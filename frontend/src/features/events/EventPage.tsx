/**
 * 概览 / Overview
 * 近期活动页：紧凑搜索表单（编辑中的草稿）、分类、结果区。区分"正在编辑的条件"与"已提交的查询"：
 * 分类与结果基于已提交的查询，表单保留输入供继续修改。
 * Events page: compact search form (draft), categories and results. Separates the editing draft from
 * the submitted query; results use the submitted query and the form keeps its input.
 *
 * 包含 / Contents
 * - EventPage()。
 */
import { useEffect, useState } from 'react'
import { PageHeading } from '../../components/PageHeading'
import { toQuery, validateFilters, type EventFilterErrors } from '../../lib/eventFilters'
import { useEventSearch } from '../../services/queries'
import { useUiStore } from '../../state/uiStore'
import { EventCategoryTabs } from './EventCategoryTabs'
import { EventResults, type EventResultsStatus } from './EventResults'
import { EventSearchForm } from './EventSearchForm'

/**
 * 活动页 / Events page.
 * 步骤 / Steps
 * 1. 设置阅读上下文为"近期活动 · 地点 · 范围"（以已提交条件优先）。/ Set the reading context.
 * 2. 编辑：更新草稿，并清除该字段的错误。/ Edit: update the draft, clear that field's error.
 * 3. 提交：validateFilters；有错误则显示并停止；否则 toQuery 后保存为已提交查询。
 *    Submit: validate; stop on errors; otherwise store the converted query.
 * 4. 按已提交查询请求结果，映射为结果区状态。/ Search with the submitted query and map its status.
 */
export function EventPage() {
  const activityDraft = useUiStore((state) => state.activityDraft)
  const submittedQuery = useUiStore((state) => state.submittedActivityQuery)
  const activityCategory = useUiStore((state) => state.activityCategory)
  const updateActivityDraft = useUiStore((state) => state.updateActivityDraft)
  const submitActivityQuery = useUiStore((state) => state.submitActivityQuery)
  const setActivityCategory = useUiStore((state) => state.setActivityCategory)
  const setReadingContext = useUiStore((state) => state.setReadingContext)
  const [errors, setErrors] = useState<EventFilterErrors>({})
  const search = useEventSearch(submittedQuery)

  const contextLocation = submittedQuery?.location ?? activityDraft.location
  const contextRadius = submittedQuery?.radiusMiles ?? activityDraft.radiusMiles

  useEffect(() => {
    setReadingContext({ kind: 'events', id: null, label: `近期活动 · ${contextLocation} · ${contextRadius} miles` }) // 步骤 1
  }, [contextLocation, contextRadius, setReadingContext])

  function handleChange(changes: Partial<typeof activityDraft>) {
    updateActivityDraft(changes) // 步骤 2 / Step 2
    setErrors((current) => {
      const remaining = { ...current }
      for (const field of Object.keys(changes) as Array<keyof typeof activityDraft>) delete remaining[field]
      return remaining
    })
  }

  function handleSubmit() {
    const validationErrors = validateFilters(activityDraft) // 步骤 3 / Step 3
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return
    submitActivityQuery(toQuery(activityDraft))
  }

  const status: EventResultsStatus =
    submittedQuery === null
      ? 'idle'
      : search.isPending
        ? 'loading'
        : search.isError
          ? 'error'
          : 'not_connected' // 步骤 4 / Step 4

  return (
    <section>
      <PageHeading title="近期活动" />
      <EventSearchForm draft={activityDraft} errors={errors} onChange={handleChange} onSubmit={handleSubmit} />
      <EventCategoryTabs value={activityCategory} onChange={setActivityCategory} />
      <EventResults
        status={status}
        query={submittedQuery}
        category={activityCategory}
        onRetry={() => void search.refetch()}
      />
    </section>
  )
}

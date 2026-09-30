/**
 * 概览 / Overview
 * 活动搜索表单：地点、范围（miles）、开始日期、结束日期、预算上限（$ / 人）与放大镜提交按钮。
 * 受控组件：值与错误由上层传入；校验失败时在字段下方显示原因，字段标记 aria-invalid。
 * Event search form: location, radius, start, end, budget per person and a magnifier submit button.
 * Controlled: values and errors come from the parent; invalid fields show a message and aria-invalid.
 *
 * 包含 / Contents
 * - EventSearchForm({ draft, errors, onChange, onSubmit })。
 */
import type { FormEvent } from 'react'
import { SearchIcon } from '../../components/icons/Icons'
import type { EventFilterDraft, EventFilterErrors, EventFilterField } from '../../lib/eventFilters'
import styles from './Events.module.css'

interface EventSearchFormProps {
  draft: EventFilterDraft
  errors: EventFilterErrors
  onChange: (changes: Partial<EventFilterDraft>) => void
  onSubmit: () => void
}

interface FieldConfig {
  field: EventFilterField
  label: string
  type: 'text' | 'number' | 'date'
  placeholder?: string
}

const FIELDS: FieldConfig[] = [
  { field: 'location', label: '当前地点', type: 'text', placeholder: '城市或地址' },
  { field: 'radiusMiles', label: '范围（miles）', type: 'number' },
  { field: 'startDate', label: '开始日期', type: 'date' },
  { field: 'endDate', label: '结束日期', type: 'date' },
  { field: 'maxBudgetPerPerson', label: '预算上限（$ / 人）', type: 'number', placeholder: '不限' },
]

/**
 * 搜索表单 / Search form.
 * 输入 / Input: draft、errors、onChange（单字段变化）、onSubmit（由上层校验并提交）。
 * 输出 / Output: <form noValidate>，由我们自己的校验统一提示，不用浏览器默认气泡。
 *                A form using our own validation messages instead of native bubbles.
 */
export function EventSearchForm({ draft, errors, onChange, onSubmit }: EventSearchFormProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSubmit()
  }

  return (
    <form className={styles.form} aria-label="搜索近期活动" noValidate onSubmit={handleSubmit}>
      {FIELDS.map(({ field, label, type, placeholder }) => {
        const inputId = `event-${field}`
        const errorId = `event-${field}-error`
        const error = errors[field]
        // 错误提示放在 <label> 之外：否则会被并入输入框的可访问名称（名称应始终只是字段名）。
        // The error sits outside <label>; otherwise it would leak into the input's accessible name.
        return (
          <div key={field} className={styles.field}>
            <label htmlFor={inputId}>{label}</label>
            <input
              id={inputId}
              name={field}
              type={type}
              value={draft[field]}
              placeholder={placeholder}
              min={field === 'endDate' ? draft.startDate : type === 'number' ? 0 : undefined}
              step={type === 'number' ? 1 : undefined}
              aria-invalid={error !== undefined}
              aria-describedby={error !== undefined ? errorId : undefined}
              onChange={(event) => onChange({ [field]: event.target.value })}
            />
            {error !== undefined && (
              <span id={errorId} className={styles.fieldError} role="alert">
                {error}
              </span>
            )}
          </div>
        )
      })}
      <button type="submit" className={styles.searchButton} aria-label="搜索活动" title="搜索活动">
        <SearchIcon size={20} />
      </button>
    </form>
  )
}

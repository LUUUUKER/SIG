/**
 * 概览 / Overview
 * 活动搜索条件：默认值、校验与转换。表单里的值都是字符串（与 <input> 一致），提交时才转成查询对象。
 * Event search filters: defaults, validation and conversion. Form values stay strings (like <input>)
 * and are converted to a query object only on submit.
 *
 * 包含 / Contents
 * - EVENT_CATEGORIES / EventCategory：全部、演出、比赛、社交活动、展览与放映。
 * - EventFilterDraft：表单草稿（字符串）。/ Form draft (strings).
 * - EventQuery：提交给数据层的查询。/ Query sent to the data layer.
 * - defaultFilters(now)：洛杉矶、60 miles、今天到下个月同日（月末截断）。
 *   LA, 60 miles, today to the same day next month (clamped at month end).
 * - validateFilters(draft)：返回各字段的错误信息，空对象表示通过。/ Per-field errors; {} means valid.
 * - toQuery(draft)：把已通过校验的草稿转成 EventQuery。/ Convert a valid draft into an EventQuery.
 */

import { losAngelesParts } from './laTime'

export const EVENT_CATEGORIES = ['全部', '演出', '比赛', '社交活动', '展览与放映'] as const
export type EventCategory = (typeof EVENT_CATEGORIES)[number]

export const DEFAULT_EVENT_LOCATION = '洛杉矶'
export const DEFAULT_RADIUS_MILES = 60
export const MIN_RADIUS_MILES = 1
export const MAX_RADIUS_MILES = 500

export interface EventFilterDraft {
  location: string
  radiusMiles: string
  startDate: string
  endDate: string
  maxBudgetPerPerson: string
}

export type EventFilterField = keyof EventFilterDraft
export type EventFilterErrors = Partial<Record<EventFilterField, string>>

export interface EventQuery {
  location: string
  radiusMiles: number
  startDate: string
  endDate: string
  /** null 表示不限；0 表示只看免费。/ null = unlimited; 0 = free only. */
  maxBudgetPerPerson: number | null
}

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const WHOLE_NUMBER_PATTERN = /^\d+$/
const NUMBER_PATTERN = /^-?\d+(\.\d+)?$/

/** 两位补零 / Pad to two digits. */
function padTwo(value: number): string {
  return String(value).padStart(2, '0')
}

/** 某年某月（1–12）的天数 / Days in a month (1–12). */
function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

/**
 * 默认搜索条件 / Default filters.
 * 输入 / Input: now。
 * 输出 / Output: EventFilterDraft —— 地点洛杉矶、范围 60、开始为洛杉矶今天、结束为下个月同一天、预算为空（不限）。
 *                LA, 60 miles, start = LA today, end = same day next month, budget empty (unlimited).
 * 步骤 / Steps
 * 1. 取洛杉矶今天的年月日。/ Get LA today.
 * 2. 计算下个月的年、月（12 月进位到次年 1 月）。/ Next month, rolling December into January.
 * 3. 日取 min(今天的日, 下个月天数)，避免 1-31 变成 3-03。/ Clamp the day to next month's length.
 */
export function defaultFilters(now: Date): EventFilterDraft {
  const today = losAngelesParts(now) // 步骤 1 / Step 1
  const nextMonthYear = today.month === 12 ? today.year + 1 : today.year // 步骤 2 / Step 2
  const nextMonth = today.month === 12 ? 1 : today.month + 1
  const endDay = Math.min(today.day, daysInMonth(nextMonthYear, nextMonth)) // 步骤 3 / Step 3
  return {
    location: DEFAULT_EVENT_LOCATION,
    radiusMiles: String(DEFAULT_RADIUS_MILES),
    startDate: `${today.year}-${padTwo(today.month)}-${padTwo(today.day)}`,
    endDate: `${nextMonthYear}-${padTwo(nextMonth)}-${padTwo(endDay)}`,
    maxBudgetPerPerson: '',
  }
}

/**
 * 校验搜索条件 / Validate filters.
 * 输入 / Input: draft。
 * 输出 / Output: EventFilterErrors；没有键即通过。/ no keys means valid.
 * 规则 / Rules
 * 1. 地点去空格后不能为空。/ Location must not be blank.
 * 2. 范围必须是 1–500 的整数。/ Radius must be a whole number from 1 to 500.
 * 3. 预算可留空（不限）；填写时必须是数字且不小于 0（0 = 只看免费）。
 *    Budget may be blank (unlimited); otherwise a number ≥ 0 (0 = free only).
 * 4. 两个日期都要是 YYYY-MM-DD；结束不能早于开始（同一天可以）。
 *    Both dates must be YYYY-MM-DD; end may not be before start (same day is fine).
 */
export function validateFilters(draft: EventFilterDraft): EventFilterErrors {
  const errors: EventFilterErrors = {}

  if (draft.location.trim() === '') errors.location = '请输入地点' // 规则 1 / Rule 1

  const radiusText = draft.radiusMiles.trim() // 规则 2 / Rule 2
  const radiusMiles = Number(radiusText)
  if (
    !WHOLE_NUMBER_PATTERN.test(radiusText) ||
    radiusMiles < MIN_RADIUS_MILES ||
    radiusMiles > MAX_RADIUS_MILES
  ) {
    errors.radiusMiles = `范围需为 ${MIN_RADIUS_MILES}–${MAX_RADIUS_MILES} 的整数`
  }

  const budgetText = draft.maxBudgetPerPerson.trim() // 规则 3 / Rule 3
  if (budgetText !== '') {
    if (!NUMBER_PATTERN.test(budgetText)) errors.maxBudgetPerPerson = '预算需为数字'
    else if (Number(budgetText) < 0) errors.maxBudgetPerPerson = '预算不能为负数'
  }

  const startValid = ISO_DATE_PATTERN.test(draft.startDate) // 规则 4 / Rule 4
  const endValid = ISO_DATE_PATTERN.test(draft.endDate)
  if (!startValid) errors.startDate = '请选择开始日期'
  if (!endValid) errors.endDate = '请选择结束日期'
  if (startValid && endValid && draft.endDate < draft.startDate) {
    errors.endDate = '结束日期不能早于开始日期'
  }

  return errors
}

/**
 * 转成查询 / Convert to a query.
 * 输入 / Input: 已通过 validateFilters 的草稿。/ a draft that passed validateFilters.
 * 输出 / Output: EventQuery —— 数字字段转为 number，预算留空转为 null。
 *                numeric fields parsed; blank budget becomes null.
 */
export function toQuery(draft: EventFilterDraft): EventQuery {
  const budgetText = draft.maxBudgetPerPerson.trim()
  return {
    location: draft.location.trim(),
    radiusMiles: Number(draft.radiusMiles.trim()),
    startDate: draft.startDate,
    endDate: draft.endDate,
    maxBudgetPerPerson: budgetText === '' ? null : Number(budgetText),
  }
}

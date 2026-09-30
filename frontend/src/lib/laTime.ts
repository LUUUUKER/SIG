/**
 * 概览 / Overview
 * 洛杉矶时间工具：所有"按当地时间"的规则都从这里取时间，避免用固定 UTC 偏移（夏令时会出错）。
 * Los Angeles time helpers. Every local-time rule reads time here instead of using a fixed UTC offset,
 * which would break across daylight-saving changes.
 *
 * 包含 / Contents
 * - losAngelesParts(now)：把某一瞬间换算成洛杉矶的年月日时分。/ Convert an instant to LA date-time parts.
 * - themeForTime(now)：06:00–18:00 返回浅色，其余深色。/ Light from 06:00 to 18:00 LA, dark otherwise.
 * - dailyEncouragement(now)：同一洛杉矶日期返回同一句鼓励语。/ Same encouragement for the same LA date.
 */

export const LA_TIME_ZONE = 'America/Los_Angeles'
export const LIGHT_THEME_START_HOUR = 6
export const DARK_THEME_START_HOUR = 18
const MILLISECONDS_PER_DAY = 86_400_000

export type Theme = 'light' | 'dark'

export interface LaDateTimeParts {
  year: number
  month: number
  day: number
  hour: number
  minute: number
}

export const ENCOURAGEMENTS = [
  '每一份好奇，都在拓宽你的世界。',
  '把今天的一小步，走得认真一点。',
  '成长，藏在每一次主动探索里。',
  '保持热爱，也给自己从容的时间。',
  '你付出的耐心，正在成为你的力量。',
  '不必急着抵达，前进本身就有意义。',
  '让行动，比昨天的犹豫多一点。',
] as const

const laFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: LA_TIME_ZONE,
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  hourCycle: 'h23',
})

/**
 * 洛杉矶日期时间 / LA date-time parts.
 * 输入 / Input: now —— 任意瞬间。/ any instant.
 * 输出 / Output: 洛杉矶当地的 { year, month(1–12), day, hour(0–23), minute }。
 * 实现 / How: 用 Intl.DateTimeFormat 指定时区格式化，再取出各字段；时区数据库自动处理夏令时。
 *            Format with Intl in the LA zone and read the parts; the tz database handles DST.
 */
export function losAngelesParts(now: Date): LaDateTimeParts {
  const partValues = Object.fromEntries(
    laFormatter
      .formatToParts(now)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, Number(part.value)]),
  )
  return {
    year: partValues.year,
    month: partValues.month,
    day: partValues.day,
    hour: partValues.hour,
    minute: partValues.minute,
  }
}

/**
 * 按时间选主题 / Theme for the time of day.
 * 输入 / Input: now。
 * 输出 / Output: 洛杉矶 06:00（含）到 18:00（不含）为 'light'，否则 'dark'。
 *                'light' from 06:00 inclusive to 18:00 exclusive in LA, otherwise 'dark'.
 */
export function themeForTime(now: Date): Theme {
  const { hour } = losAngelesParts(now)
  return hour >= LIGHT_THEME_START_HOUR && hour < DARK_THEME_START_HOUR ? 'light' : 'dark'
}

/**
 * 每日鼓励语 / Daily encouragement.
 * 输入 / Input: now。
 * 输出 / Output: ENCOURAGEMENTS 中的一句；同一洛杉矶日期不变，相邻两天一定不同。
 *                One phrase; stable within an LA date and different on consecutive days.
 * 步骤 / Steps
 * 1. 取洛杉矶日期。/ Get the LA date.
 * 2. 把该日期换算为"自 1970-01-01 起第几天"。/ Convert it to a day number since 1970-01-01.
 * 3. 用天数对句子数量取余，得到下标。/ Day number modulo the phrase count gives the index.
 */
export function dailyEncouragement(now: Date): string {
  const { year, month, day } = losAngelesParts(now) // 步骤 1 / Step 1
  const dayNumber = Math.floor(Date.UTC(year, month - 1, day) / MILLISECONDS_PER_DAY) // 步骤 2 / Step 2
  return ENCOURAGEMENTS[dayNumber % ENCOURAGEMENTS.length] // 步骤 3 / Step 3
}

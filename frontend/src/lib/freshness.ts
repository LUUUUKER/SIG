/**
 * 概览 / Overview
 * 新鲜度规则：何时需要更新、内容是否在 24 小时窗口内、"更新于 X 前"的文案。
 * Freshness rules: when to refresh, whether content is inside the 24h window, and "updated X ago" text.
 *
 * 包含 / Contents
 * - needsRefresh(lastRunAt, now, intervalHours)：距上次更新是否已满间隔（默认 8h）。
 *   Whether the refresh interval (default 8h) has elapsed.
 * - isWithin24h(publishedAt, now)：是否属于最近 24 小时（容忍未来 5 分钟时钟误差）。
 *   Whether within the last 24h (tolerating 5 minutes of future clock skew).
 * - formatUpdatedAgo(lastRunAt, now)："刚刚 / X 分钟前 / X 小时前 / X 天前 / 尚未更新"。
 */

export const REFRESH_INTERVAL_HOURS = 8
export const FRESHNESS_WINDOW_HOURS = 24
export const FUTURE_TOLERANCE_MINUTES = 5

const MILLISECONDS_PER_MINUTE = 60_000
const MILLISECONDS_PER_HOUR = 3_600_000
const MILLISECONDS_PER_DAY = 86_400_000

/**
 * 是否需要更新 / Whether a refresh is due.
 * 输入 / Input
 * - lastRunAt：上次成功更新时间；null 表示从未更新。/ last successful refresh; null = never.
 * - now：当前时间。/ current time.
 * - intervalHours：更新间隔小时数，默认 8。/ interval in hours, default 8.
 * 输出 / Output: boolean。
 * 规则 / Rules
 * 1. 从未更新 → true。/ Never refreshed → true.
 * 2. 上次时间在未来（时钟误差）→ false，避免反复触发付费生成。
 *    lastRunAt in the future (clock skew) → false, so paid generation is not triggered repeatedly.
 * 3. 已过时长 ≥ 间隔 → true，否则 false。/ Elapsed ≥ interval → true, else false.
 */
export function needsRefresh(
  lastRunAt: Date | null,
  now: Date,
  intervalHours: number = REFRESH_INTERVAL_HOURS,
): boolean {
  if (lastRunAt === null) return true // 规则 1 / Rule 1
  const elapsedMilliseconds = now.getTime() - lastRunAt.getTime()
  if (elapsedMilliseconds < 0) return false // 规则 2 / Rule 2
  return elapsedMilliseconds >= intervalHours * MILLISECONDS_PER_HOUR // 规则 3 / Rule 3
}

/**
 * 是否在最近 24 小时 / Whether inside the last 24 hours.
 * 输入 / Input: publishedAt —— 发布时间；now —— 当前时间。
 * 输出 / Output: boolean。
 * 规则 / Rules
 * 1. 发布时间比现在晚超过 5 分钟 → false（数据异常）。/ More than 5 min in the future → false.
 * 2. 距今不超过 24 小时（含恰好 24 小时）→ true。/ Age ≤ 24h (inclusive) → true.
 */
export function isWithin24h(publishedAt: Date, now: Date): boolean {
  const ageMilliseconds = now.getTime() - publishedAt.getTime()
  if (ageMilliseconds < -FUTURE_TOLERANCE_MINUTES * MILLISECONDS_PER_MINUTE) return false // 规则 1
  return ageMilliseconds <= FRESHNESS_WINDOW_HOURS * MILLISECONDS_PER_HOUR // 规则 2
}

/**
 * "X 前"文案 / Relative "ago" text.
 * 输入 / Input: lastRunAt（可为 null）、now。
 * 输出 / Output: 字符串；调用方负责加上"更新于"前缀。/ string; callers add the "更新于" prefix.
 * 规则 / Rules
 * 1. null → "尚未更新"。
 * 2. 不足 1 分钟（含轻微未来时间）→ "刚刚"。/ Under a minute (incl. slight future) → "刚刚".
 * 3. 不足 1 小时 → "N 分钟前"；不足 1 天 → "N 小时前"；否则 "N 天前"（均向下取整）。
 *    Under an hour → minutes; under a day → hours; otherwise days (all floored).
 */
export function formatUpdatedAgo(lastRunAt: Date | null, now: Date): string {
  if (lastRunAt === null) return '尚未更新' // 规则 1 / Rule 1
  const elapsedMilliseconds = now.getTime() - lastRunAt.getTime()
  if (elapsedMilliseconds < MILLISECONDS_PER_MINUTE) return '刚刚' // 规则 2 / Rule 2
  if (elapsedMilliseconds < MILLISECONDS_PER_HOUR) {
    return `${Math.floor(elapsedMilliseconds / MILLISECONDS_PER_MINUTE)} 分钟前` // 规则 3 / Rule 3
  }
  if (elapsedMilliseconds < MILLISECONDS_PER_DAY) {
    return `${Math.floor(elapsedMilliseconds / MILLISECONDS_PER_HOUR)} 小时前`
  }
  return `${Math.floor(elapsedMilliseconds / MILLISECONDS_PER_DAY)} 天前`
}

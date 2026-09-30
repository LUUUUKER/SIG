/**
 * 概览 / Overview
 * 列表标记规则：决定一条内容显示「新」「更新」还是不标记。
 * Badge rule: decide whether an item shows "新" (new), "更新" (update) or nothing.
 *
 * 包含 / Contents
 * - Badge：'new' | 'update' | null。
 * - SeenClusters：已看过的事件 → 看过的时间（ISO）。/ Seen event cluster id → seen-at ISO time.
 * - BADGE_LABELS：标记对应的界面文字。/ UI text per badge.
 * - badgeFor(item, previousVisitAt, seenClusters)：计算单条内容的标记。/ Compute one item's badge.
 */

export type Badge = 'new' | 'update' | null
export type SeenClusters = Record<string, string>

export const BADGE_LABELS: Record<Exclude<Badge, null>, string> = {
  new: '新',
  update: '更新',
}

export interface BadgeInput {
  firstSeenAt: string
  eventClusterId: string
  latestDevelopmentAt: string
}

/**
 * 计算标记 / Compute a badge.
 * 输入 / Input
 * - item：含首次收录时间、事件 ID、最新进展时间。/ first-seen time, cluster id, latest development time.
 * - previousVisitAt：上一次打开网页的时间；首次访问为 null。/ previous visit; null on the first visit.
 * - seenClusters：已看过的事件及看过的时间。/ seen clusters with seen-at times.
 * 输出 / Output: Badge。
 * 步骤 / Steps
 * 1. 看过这个事件：最新进展晚于看过的时间 → 'update'，否则不标记（看过的不算"新"）。
 *    Seen cluster: development after seen-at → 'update'; otherwise none (seen items are never "new").
 * 2. 首次访问 → 不标记，避免所有内容都是「新」。/ First visit → none, so not everything is "new".
 * 3. 首次收录晚于上次访问 → 'new'，否则不标记。/ First seen after the previous visit → 'new'.
 */
export function badgeFor(
  item: BadgeInput,
  previousVisitAt: Date | null,
  seenClusters: SeenClusters,
): Badge {
  const seenAt = seenClusters[item.eventClusterId]
  if (seenAt !== undefined) {
    // 步骤 1 / Step 1
    return new Date(item.latestDevelopmentAt) > new Date(seenAt) ? 'update' : null
  }
  if (previousVisitAt === null) return null // 步骤 2 / Step 2
  return new Date(item.firstSeenAt) > previousVisitAt ? 'new' : null // 步骤 3 / Step 3
}

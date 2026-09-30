/**
 * 概览 / Overview
 * 聊天输入框高度规则：一行起步，随内容增高，到上限后改为内部滚动。
 * Chat composer height rule: start at one line, grow with content, scroll internally past the cap.
 *
 * 包含 / Contents
 * - COMPOSER_MIN_HEIGHT_PX / COMPOSER_MAX_HEIGHT_PX：26px 与 144px。
 * - composerHeight(scrollHeight)：由内容高度算出输入框高度与是否需要内部滚动。
 *   Compute the textarea height and whether it should scroll internally.
 */

export const COMPOSER_MIN_HEIGHT_PX = 26
export const COMPOSER_MAX_HEIGHT_PX = 144

export interface ComposerHeight {
  heightPx: number
  scrollable: boolean
}

/**
 * 计算输入框高度 / Compute composer height.
 * 输入 / Input: scrollHeight —— 先把高度重置为最小值后测得的内容高度（px）。
 *               content height measured after resetting the height to the minimum.
 * 输出 / Output: { heightPx: 限制在 26–144 之间, scrollable: 内容超过 144 时为 true }。
 */
export function composerHeight(scrollHeight: number): ComposerHeight {
  const heightPx = Math.min(COMPOSER_MAX_HEIGHT_PX, Math.max(COMPOSER_MIN_HEIGHT_PX, scrollHeight))
  return { heightPx, scrollable: scrollHeight > COMPOSER_MAX_HEIGHT_PX }
}

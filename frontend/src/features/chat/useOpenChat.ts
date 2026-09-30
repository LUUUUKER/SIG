/**
 * 概览 / Overview
 * 打开助手并聚焦输入框：供"与 sig 深聊""围绕这篇继续聊"使用。
 * Open the assistant and focus its input, for the "discuss with sig" actions.
 *
 * 包含 / Contents
 * - useOpenChat()：返回 openChat()。
 */
import { useCallback } from 'react'
import { useUiStore } from '../../state/uiStore'
import { CHAT_INPUT_ID } from './ChatComposer'

/**
 * 打开助手 / Open the assistant.
 * 输出 / Output: openChat() —— 显示面板，等面板渲染可见后把焦点放进输入框。
 *                shows the panel, then focuses the input once it is visible.
 */
export function useOpenChat(): () => void {
  const setChatOpen = useUiStore((state) => state.setChatOpen)

  return useCallback(() => {
    setChatOpen(true)
    setTimeout(() => document.getElementById(CHAT_INPUT_ID)?.focus(), 0)
  }, [setChatOpen])
}

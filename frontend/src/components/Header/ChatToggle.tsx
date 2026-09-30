/**
 * 概览 / Overview
 * 助手开关：全站唯一控制 sig 助手显隐的按钮，aria-expanded 与面板实际可见性一致。
 * The one control that shows or hides the sig assistant; aria-expanded mirrors real visibility.
 *
 * 包含 / Contents
 * - CHAT_TOGGLE_ID：供其他地方把焦点送回开关。/ id used to return focus here.
 * - ChatToggle()。
 */
import { useUiStore } from '../../state/uiStore'
import { PanelIcon } from '../icons/Icons'
import styles from './Header.module.css'

export const CHAT_TOGGLE_ID = 'chat-toggle'
export const CHAT_PANEL_ID = 'chat'

/**
 * 助手开关 / Assistant toggle.
 * 输出 / Output: 按钮；aria-controls 指向助手面板，名称随状态在"隐藏/显示 sig 助手"间切换。
 *                A button controlling the panel; its name switches between hide/show.
 */
export function ChatToggle() {
  const chatOpen = useUiStore((state) => state.chatOpen)
  const toggleChat = useUiStore((state) => state.toggleChat)
  const label = chatOpen ? '隐藏 sig 助手' : '显示 sig 助手'

  return (
    <button
      id={CHAT_TOGGLE_ID}
      type="button"
      className={styles.panelToggle}
      aria-controls={CHAT_PANEL_ID}
      aria-expanded={chatOpen}
      aria-label={label}
      title={label}
      onClick={toggleChat}
    >
      <PanelIcon />
    </button>
  )
}

/**
 * 概览 / Overview
 * 应用外壳：页眉 + 左栏 + 中间内容（路由出口）+ sig 助手面板 + 提示条。负责主题、访问记录、
 * 助手在不同屏宽下的默认显隐、窄屏遮罩与 Esc 关闭，以及关闭后把焦点送回页眉开关。
 * App shell: header, sidebar, routed content, the sig panel and toasts. Owns theme, visit tracking,
 * default panel visibility per viewport, the narrow-screen backdrop, Esc to close, and returning
 * focus to the header toggle after closing.
 *
 * 包含 / Contents
 * - AppShell()。
 */
import { useCallback, useEffect } from 'react'
import { Outlet } from 'react-router'
import { CHAT_PANEL_ID, CHAT_TOGGLE_ID } from '../components/Header/ChatToggle'
import { Header } from '../components/Header/Header'
import { SidebarNav } from '../components/Sidebar/SidebarNav'
import { ToastHost } from '../components/ToastHost'
import { ChatPanel } from '../features/chat/ChatPanel'
import { useUiStore } from '../state/uiStore'
import { MAIN_CONTENT_ID } from '../lib/layoutIds'
import styles from './AppShell.module.css'
import { useAutoRefresh } from './useAutoRefresh'
import { DESKTOP_QUERY, useMediaQuery } from './useMediaQuery'
import { useTheme } from './useTheme'
import { useVisitTracker } from './useVisitTracker'

/**
 * 应用外壳 / App shell.
 * 步骤 / Steps
 * 1. 主题、访问记录与自动更新（结果交给页眉的更新状态）。/ Theme, visit tracking and auto-refresh.
 * 2. 屏宽跨过 951px 时设置助手默认显隐：桌面显示，窄屏隐藏。/ Default visibility per viewport.
 * 3. Esc：窄屏面板打开时，或焦点在面板内时，关闭面板。/ Esc closes on narrow screens or from inside.
 * 4. 关闭时把焦点送回页眉开关。/ Return focus to the toggle on close.
 * 5. 渲染布局；窄屏打开时加遮罩，点击关闭。/ Render; narrow screens get a click-to-close backdrop.
 */
export function AppShell() {
  useTheme() // 步骤 1 / Step 1
  useVisitTracker()
  const refreshStatus = useAutoRefresh()

  const isDesktop = useMediaQuery(DESKTOP_QUERY)
  const chatOpen = useUiStore((state) => state.chatOpen)
  const setChatOpen = useUiStore((state) => state.setChatOpen)

  useEffect(() => {
    setChatOpen(isDesktop) // 步骤 2 / Step 2
  }, [isDesktop, setChatOpen])

  const closeChat = useCallback(() => {
    setChatOpen(false)
    document.getElementById(CHAT_TOGGLE_ID)?.focus() // 步骤 4 / Step 4
  }, [setChatOpen])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape' || !chatOpen) return // 步骤 3 / Step 3
      const focusInsidePanel = document.getElementById(CHAT_PANEL_ID)?.contains(document.activeElement) ?? false
      if (!isDesktop || focusInsidePanel) closeChat()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [chatOpen, isDesktop, closeChat])

  return (
    <div className={styles.shell} data-chat-open={chatOpen}>
      <div className="page-material" aria-hidden="true" />
      <div className={styles.workspace}>
        <Header refresh={refreshStatus} />
        <div className={styles.layout}>
          <SidebarNav />
          <main id={MAIN_CONTENT_ID} className={styles.main}>
            <Outlet />
          </main>
        </div>
      </div>
      {!isDesktop && chatOpen && (
        <div className={styles.backdrop} aria-hidden="true" data-testid="chat-backdrop" onClick={closeChat} />
      )}
      <ChatPanel hidden={!chatOpen} />
      <ToastHost />
    </div>
  )
}

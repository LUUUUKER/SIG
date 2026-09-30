/**
 * 概览 / Overview
 * 页眉测试 C1–C4：页眉内容与助手开关一致性、品牌回首页并重置类型、主题切换、更新状态三种形态。
 * Tests C1–C4: header content and toggle consistency, brand resets to home, theme toggle, refresh states.
 */
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { dailyEncouragement } from '../../lib/laTime'
import { uiStore } from '../../state/uiStore'
import { renderApp, setViewportMatches } from '../../test/testUtils'
import { Header } from './Header'
import { RefreshStatus } from './RefreshStatus'
import { ThemeToggle } from './ThemeToggle'

const NOW = new Date('2026-09-29T19:00:00Z')

describe('Header', () => {
  it('C1: shows brand and daily quote without a label, and the toggle mirrors the panel', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <Header refresh={{ status: 'idle', lastRunAt: null, now: NOW, onRefresh: () => {} }} />
      </MemoryRouter>,
    )
    expect(screen.getByRole('link', { name: 'SIG 首页' })).toBeInTheDocument()
    expect(screen.getByText(dailyEncouragement(NOW))).toBeInTheDocument()
    expect(screen.queryByText('每日一句')).toBeNull()
    cleanup() // 换成完整应用再验证开关与面板 / switch to the full app for the toggle check

    setViewportMatches(true)
    renderApp('/')
    const toggle = screen.getByRole('button', { name: '隐藏 sig 助手' })
    const panel = document.getElementById('chat')!
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(panel).not.toHaveAttribute('hidden')

    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(toggle).toHaveAccessibleName('显示 sig 助手')
    expect(panel).toHaveAttribute('hidden')
  })

  it('C2: the brand returns to "/" and drops the content type', async () => {
    const user = userEvent.setup()
    const { router } = renderApp('/domain/AI?type=精选文章')

    await user.click(screen.getByRole('link', { name: 'SIG 首页' }))

    expect(router.state.location.pathname).toBe('/')
    expect(router.state.location.search).toBe('')
  })
})

describe('ThemeToggle', () => {
  it('C3: exposes three pressed-state buttons and switches to dark', async () => {
    const user = userEvent.setup()
    render(<ThemeToggle />)

    const buttons = screen.getAllByRole('button')
    expect(buttons.map((button) => button.textContent)).toEqual(['浅', '深', '自动'])
    expect(screen.getByRole('button', { name: '自动' })).toHaveAttribute('aria-pressed', 'true')

    await user.click(screen.getByRole('button', { name: '深' }))
    expect(uiStore.getState().themeMode).toBe('dark')
    expect(screen.getByRole('button', { name: '深' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: '自动' })).toHaveAttribute('aria-pressed', 'false')
  })
})

describe('RefreshStatus', () => {
  it('C4: renders idle, never-updated, running and failed states', async () => {
    const user = userEvent.setup()
    const onRefresh = vi.fn()
    const threeHoursAgo = new Date(NOW.getTime() - 3 * 3_600_000).toISOString()

    const { rerender } = render(
      <RefreshStatus status="idle" lastRunAt={threeHoursAgo} now={NOW} onRefresh={onRefresh} />,
    )
    expect(screen.getByText('更新于 3 小时前')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '立即更新' }))
    expect(onRefresh).toHaveBeenCalledTimes(1)

    rerender(<RefreshStatus status="idle" lastRunAt={null} now={NOW} onRefresh={onRefresh} />)
    expect(screen.getByText('尚未更新')).toBeInTheDocument()

    rerender(<RefreshStatus status="running" lastRunAt={threeHoursAgo} now={NOW} onRefresh={onRefresh} />)
    expect(screen.getByText('更新中…')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '立即更新' })).toBeDisabled()

    rerender(<RefreshStatus status="failed" lastRunAt={threeHoursAgo} now={NOW} onRefresh={onRefresh} />)
    await user.click(screen.getByRole('button', { name: '更新失败 · 重试' }))
    expect(onRefresh).toHaveBeenCalledTimes(2)
  })
})

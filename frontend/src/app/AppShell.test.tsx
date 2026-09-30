/**
 * 概览 / Overview
 * 应用外壳冒烟测试 F1（由阶段 0 的 App 测试迁移）：在 "/" 渲染出品牌、导航与内容区；
 * 助手默认显隐随视口：桌面显示，窄屏隐藏。
 * Shell smoke test F1 (migrated from the phase-0 App test): brand, navigation and content render
 * at "/"; the assistant is shown by default on desktop and hidden on narrow screens.
 */
import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderApp, setViewportMatches } from '../test/testUtils'

describe('AppShell', () => {
  it('F1: renders the brand, navigation and home content at "/"', () => {
    renderApp('/')

    expect(screen.getByRole('link', { name: 'SIG 首页' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'MY EDITION' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '为你精选' })).toBeInTheDocument()
  })

  it('F1: shows the assistant by default on desktop and hides it on narrow screens', () => {
    setViewportMatches(true)
    const desktop = renderApp('/')
    expect(screen.getByRole('complementary', { name: 'sig 阅读助手' })).toBeVisible()
    desktop.unmount()

    setViewportMatches(false)
    renderApp('/')
    expect(screen.queryByRole('complementary', { name: 'sig 阅读助手' })).toBeNull()
  })
})

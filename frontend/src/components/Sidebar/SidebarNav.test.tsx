/**
 * 概览 / Overview
 * 左栏测试 C5：两组导航与标签、七领域、当前页 aria-current、切换领域保留内容类型、无"你的关注"。
 * Test C5: both groups and labels, seven domains, aria-current, domain links keep ?type, no "你的关注".
 */
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { DOMAINS } from '../../lib/domains'
import { SidebarNav } from './SidebarNav'

describe('SidebarNav', () => {
  it('C5: renders MY EDITION and DOMAINS, marks the current page, and keeps the content type', () => {
    render(
      <MemoryRouter initialEntries={['/domain/AI?type=精选文章']}>
        <SidebarNav />
      </MemoryRouter>,
    )

    const myEdition = screen.getByRole('navigation', { name: 'MY EDITION' })
    expect(within(myEdition).getAllByRole('link').map((link) => link.textContent)).toEqual([
      '◉为你精选',
      '◇稍后阅读',
      '↗近期活动',
    ])

    const domains = screen.getByRole('navigation', { name: 'DOMAINS' })
    const domainLinks = within(domains).getAllByRole('link')
    expect(domainLinks).toHaveLength(DOMAINS.length)

    const aiLink = within(domains).getByRole('link', { name: 'AI' })
    expect(aiLink).toHaveAttribute('aria-current', 'page')
    expect(within(myEdition).getByRole('link', { name: '为你精选' })).not.toHaveAttribute('aria-current')
    expect(within(domains).getByRole('link', { name: 'GitHub' })).toHaveAttribute(
      'href',
      `/domain/GitHub?type=${encodeURIComponent('精选文章')}`,
    )
    expect(screen.queryByText('你的关注')).toBeNull()
  })
})

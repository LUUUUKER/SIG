/**
 * 概览 / Overview
 * 滚动记忆测试 H8：离开列表时记住位置；再次"前进"进入回到顶部；浏览器返回（POP）时恢复。
 * Test H8: positions are recorded; a forward (PUSH) visit starts at the top; history back (POP) restores.
 */
import { act, fireEvent, render } from '@testing-library/react'
import { createMemoryRouter, Outlet, RouterProvider, useLocation } from 'react-router'
import { describe, expect, it } from 'vitest'
import { MAIN_CONTENT_ID } from '../../lib/layoutIds'
import { useScrollMemory } from './useScrollMemory'

/** 使用滚动记忆的列表页 / A list page using scroll memory. */
function ListPage() {
  const location = useLocation()
  useScrollMemory(location.pathname, true)
  return <p>list</p>
}

/** 模拟外壳：提供可滚动的 #main-content / Fake shell with a scrollable #main-content. */
function Shell() {
  return (
    <main id={MAIN_CONTENT_ID}>
      <Outlet />
    </main>
  )
}

/** 滚动中栏并触发 scroll 事件 / Scroll the main column and fire the event. */
function scrollMainTo(scrollTop: number) {
  const mainContent = document.getElementById(MAIN_CONTENT_ID)!
  mainContent.scrollTop = scrollTop
  fireEvent.scroll(mainContent)
}

describe('useScrollMemory', () => {
  it('H8: restores the position on history back and starts at the top on forward visits', async () => {
    const router = createMemoryRouter(
      [
        {
          path: '/',
          element: <Shell />,
          children: [
            { path: 'list', element: <ListPage /> },
            { path: 'other', element: <p>other</p> },
          ],
        },
      ],
      { initialEntries: ['/list'] },
    )
    render(<RouterProvider router={router} />)
    const mainContent = () => document.getElementById(MAIN_CONTENT_ID)!

    scrollMainTo(480)
    await act(() => router.navigate('/other'))
    await act(() => router.navigate('/list'))
    expect(mainContent().scrollTop).toBe(0)

    scrollMainTo(300)
    await act(() => router.navigate('/other'))
    mainContent().scrollTop = 0
    await act(() => router.navigate(-1))
    expect(router.state.location.pathname).toBe('/list')
    expect(mainContent().scrollTop).toBe(300)
  })
})

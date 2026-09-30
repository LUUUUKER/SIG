/**
 * 概览 / Overview
 * 状态块测试 C6：加载、空、失败三种形态；失败时重试调用回调。
 * Test C6: loading, empty and error states; retry calls the callback.
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { StatusView } from './StatusView'

describe('StatusView', () => {
  it('C6: renders loading, empty and error with retry', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()

    const { rerender } = render(<StatusView state="loading" />)
    expect(screen.getByRole('status')).toHaveTextContent('正在加载…')

    rerender(<StatusView state="empty" message="还没有收藏。" />)
    expect(screen.getByRole('status')).toHaveTextContent('还没有收藏。')
    expect(screen.queryByRole('button')).toBeNull()

    rerender(<StatusView state="error" message="加载失败。" onRetry={onRetry} />)
    expect(screen.getByRole('alert')).toHaveTextContent('加载失败。')
    await user.click(screen.getByRole('button', { name: '重试' }))
    expect(onRetry).toHaveBeenCalledOnce()
  })
})

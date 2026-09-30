/**
 * 概览 / Overview
 * 活动表单测试 C12：默认值；结束日期早于开始日期时显示错误且不提交；改正后提交；放大镜按钮名称"搜索活动"。
 * Test C12: defaults; reversed dates show an error and do not submit; fixing them submits; the
 * magnifier button is named "搜索活动".
 */
import { fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { defaultFilters } from '../../lib/eventFilters'
import { uiStore } from '../../state/uiStore'
import { renderApp } from '../../test/testUtils'

describe('EventSearchForm', () => {
  it('C12: shows defaults, blocks reversed dates, then submits once fixed', async () => {
    const user = userEvent.setup()
    renderApp('/events')
    const defaults = defaultFilters(new Date())

    expect(screen.getByLabelText('当前地点')).toHaveValue('洛杉矶')
    expect(screen.getByLabelText('范围（miles）')).toHaveValue(60)
    expect(screen.getByLabelText('开始日期')).toHaveValue(defaults.startDate)
    expect(screen.getByLabelText('结束日期')).toHaveValue(defaults.endDate)
    expect(screen.getByLabelText('预算上限（$ / 人）')).toHaveValue(null)

    fireEvent.change(screen.getByLabelText('结束日期'), { target: { value: '2000-01-01' } })
    await user.click(screen.getByRole('button', { name: '搜索活动' }))
    expect(screen.getByRole('alert')).toHaveTextContent('结束日期不能早于开始日期')
    expect(screen.getByLabelText('结束日期')).toHaveAttribute('aria-invalid', 'true')
    expect(uiStore.getState().submittedActivityQuery).toBeNull()

    fireEvent.change(screen.getByLabelText('结束日期'), { target: { value: defaults.endDate } })
    expect(screen.queryByRole('alert')).toBeNull()
    await user.click(screen.getByRole('button', { name: '搜索活动' }))
    expect(uiStore.getState().submittedActivityQuery).toEqual({
      location: '洛杉矶',
      radiusMiles: 60,
      startDate: defaults.startDate,
      endDate: defaults.endDate,
      maxBudgetPerPerson: null,
    })
  })
})

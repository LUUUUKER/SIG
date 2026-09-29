/**
 * 概览 / Overview
 * 前端冒烟测试 F1：根组件能渲染且页面上有 SIG。
 * Frontend smoke test F1: the root component renders and shows SIG.
 */
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  it('F1: renders the SIG brand without crashing', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: 'SIG' })).toBeInTheDocument()
  })
})

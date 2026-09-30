/**
 * 概览 / Overview
 * Vitest 全局准备：注册 jest-dom 断言；默认模拟为窄屏视口（jsdom 没有 matchMedia）；每个测试后
 * 清理渲染结果并恢复全局 store。
 * Vitest global setup: register jest-dom matchers, stub matchMedia as a narrow viewport by default,
 * and clean up renders and global stores after each test.
 */
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach } from 'vitest'
import { resetStores, setViewportMatches } from './testUtils'

beforeEach(() => {
  setViewportMatches(false)
})

afterEach(() => {
  cleanup()
  resetStores()
})

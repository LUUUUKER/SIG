/**
 * 概览 / Overview
 * Vitest 全局准备：注册 jest-dom 断言（如 toBeInTheDocument），每个测试后清理渲染结果。
 * Vitest global setup: register jest-dom matchers (e.g. toBeInTheDocument) and clean up
 * rendered components after each test.
 */
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => {
  cleanup()
})

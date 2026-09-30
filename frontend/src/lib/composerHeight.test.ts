/**
 * 概览 / Overview
 * 输入框高度测试 L23：26px 下限、144px 上限与内部滚动开关。
 * Test L23: 26px floor, 144px cap and the internal-scroll flag.
 */
import { describe, expect, it } from 'vitest'
import { composerHeight } from './composerHeight'

describe('composerHeight', () => {
  it('L23: clamps to 26–144px and only scrolls above the cap', () => {
    expect(composerHeight(20)).toEqual({ heightPx: 26, scrollable: false })
    expect(composerHeight(100)).toEqual({ heightPx: 100, scrollable: false })
    expect(composerHeight(144)).toEqual({ heightPx: 144, scrollable: false })
    expect(composerHeight(200)).toEqual({ heightPx: 144, scrollable: true })
  })
})

/**
 * 概览 / Overview
 * 首屏主题测试 L24：bootTheme 在各种已保存状态与时间下，结果都与 resolveTheme 一致，并写入 data-theme；
 * 存储损坏或不可用时按自动处理；函数源码自包含，可被内联。
 * Test L24: bootTheme matches resolveTheme for every saved state and time, writes data-theme,
 * treats broken or missing storage as auto, and its source is self-contained for inlining.
 */
import { describe, expect, it } from 'vitest'
import { resolveTheme } from '../app/useTheme'
import type { ThemeMode } from '../state/uiStore'
import { bootTheme, type BootRoot, type BootStorage } from './themeBoot'

const TIMES = [
  '2026-01-15T13:59:00Z', // LA 05:59 PST
  '2026-01-15T14:00:00Z', // LA 06:00 PST
  '2026-01-16T01:59:00Z', // LA 17:59 PST
  '2026-01-16T02:00:00Z', // LA 18:00 PST
  '2026-03-08T13:00:00Z', // LA 06:00 PDT（夏令时开始当天）
  '2026-11-01T13:59:00Z', // LA 05:59 PST（夏令时结束当天）
].map((iso) => new Date(iso))

/** 存有指定主题模式的存储 / Storage holding a saved theme mode. */
function storageWith(themeMode: ThemeMode): BootStorage {
  const saved = JSON.stringify({ state: { themeMode, lastVisitAt: null, seenClusters: {} }, version: 1 })
  return { getItem: (key) => (key === 'sig-ui' ? saved : null) }
}

describe('bootTheme', () => {
  it('L24: agrees with resolveTheme for every saved mode and boundary time, and writes data-theme', () => {
    for (const mode of ['light', 'dark', 'auto'] as const) {
      for (const now of TIMES) {
        const root: BootRoot = { dataset: {} }
        const theme = bootTheme(storageWith(mode), now, root)
        expect(theme, `${mode} @ ${now.toISOString()}`).toBe(resolveTheme(mode, now))
        expect(root.dataset.theme).toBe(theme)
      }
    }
  })

  it('L24: treats missing, corrupted or throwing storage as auto', () => {
    const darkHour = new Date('2026-01-16T04:00:00Z') // LA 20:00
    const throwingStorage: BootStorage = {
      getItem: () => {
        throw new Error('blocked')
      },
    }
    const corruptedStorage: BootStorage = { getItem: () => '{not json' }

    for (const storage of [null, { getItem: () => null }, corruptedStorage, throwingStorage]) {
      expect(bootTheme(storage, darkHour, { dataset: {} })).toBe('dark')
    }
  })

  it('L24: has self-contained source that runs after being inlined', () => {
    const inlined = new Function(`return (${bootTheme.toString()})`)() as typeof bootTheme
    const root: BootRoot = { dataset: {} }

    expect(inlined(storageWith('dark'), new Date('2026-01-15T20:00:00Z'), root)).toBe('dark')
    expect(root.dataset.theme).toBe('dark')
  })
})

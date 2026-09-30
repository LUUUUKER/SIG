/**
 * 概览 / Overview
 * 界面状态测试 S18：本地存储读写抛错时，store 仍以默认值正常工作；正常存储时能读回持久化字段。
 * Test S18: the UI store works with defaults when storage throws, and restores persisted fields otherwise.
 */
import { describe, expect, it } from 'vitest'
import { createMemoryStorage, createSafeStorage } from './storage'
import { createUiStore } from './uiStore'

/** 每个操作都抛错的存储（模拟隐私模式或已满）。/ A Storage that throws on every call. */
function createThrowingStorage(): Storage {
  const fail = () => {
    throw new Error('storage unavailable')
  }
  return {
    length: 0,
    clear: fail,
    getItem: fail,
    key: fail,
    removeItem: fail,
    setItem: fail,
  }
}

describe('uiStore persistence', () => {
  it('S18: falls back to defaults when storage throws, and restores persisted fields when it works', () => {
    const brokenStore = createUiStore({ storage: createSafeStorage(createThrowingStorage) })
    expect(brokenStore.getState().themeMode).toBe('auto')
    expect(() => brokenStore.getState().setThemeMode('dark')).not.toThrow()
    expect(brokenStore.getState().themeMode).toBe('dark')

    const storage = createMemoryStorage()
    const firstVisit = createUiStore({ storage, now: () => new Date('2026-09-29T10:00:00Z') })
    firstVisit.getState().setThemeMode('light')
    firstVisit.getState().recordVisit()

    const secondVisit = createUiStore({ storage, now: () => new Date('2026-09-29T19:00:00Z') })
    expect(secondVisit.getState().themeMode).toBe('light')
    secondVisit.getState().recordVisit()
    expect(secondVisit.getState().previousVisitAt).toBe('2026-09-29T10:00:00.000Z')
    expect(secondVisit.getState().lastVisitAt).toBe('2026-09-29T19:00:00.000Z')
  })
})

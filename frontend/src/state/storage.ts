/**
 * 概览 / Overview
 * 本地存储适配：给 Zustand 持久化用的存储接口。浏览器的 localStorage 在隐私模式、被禁用或空间已满时
 * 可能抛错，这里把所有读写包进 try/catch，失败时当作"没有存储"，页面照常以默认值运行。
 * Storage adapters for Zustand persistence. Browser localStorage can throw (private mode, blocked,
 * quota); every access is wrapped so failures behave like "no storage" and the app keeps defaults.
 *
 * 包含 / Contents
 * - createSafeStorage(getStorage)：把可能抛错的 Storage 包装成永不抛错的 StateStorage。
 *   Wrap a possibly-throwing Storage into a never-throwing StateStorage.
 * - browserStorage：包装后的 window.localStorage。/ The wrapped window.localStorage.
 * - createMemoryStorage()：内存存储，用于测试与无浏览器环境。/ In-memory storage for tests.
 */

import type { StateStorage } from 'zustand/middleware'

/**
 * 安全存储 / Safe storage.
 * 输入 / Input: getStorage —— 返回 Storage 的函数（取 localStorage 本身也可能抛错）。
 *               a function returning a Storage (accessing localStorage itself may throw).
 * 输出 / Output: StateStorage —— 读失败返回 null，写/删失败静默忽略。
 *                reads return null on failure; writes and removals fail silently.
 */
export function createSafeStorage(getStorage: () => Storage | undefined): StateStorage {
  return {
    getItem(name) {
      try {
        return getStorage()?.getItem(name) ?? null
      } catch {
        return null
      }
    },
    setItem(name, value) {
      try {
        getStorage()?.setItem(name, value)
      } catch {
        // 存储不可用时只保留本次会话内的状态。/ Keep in-session state only.
      }
    },
    removeItem(name) {
      try {
        getStorage()?.removeItem(name)
      } catch {
        // 同上 / Same as above.
      }
    },
  }
}

export const browserStorage: StateStorage = createSafeStorage(() => globalThis.localStorage)

/**
 * 内存存储 / Memory storage.
 * 输出 / Output: 基于 Map 的 StateStorage，多个 store 共用同一实例即可模拟"刷新后读回"。
 *                A Map-backed StateStorage; share one instance across stores to simulate a reload.
 */
export function createMemoryStorage(): StateStorage {
  const entries = new Map<string, string>()
  return {
    getItem: (name) => entries.get(name) ?? null,
    setItem: (name, value) => {
      entries.set(name, value)
    },
    removeItem: (name) => {
      entries.delete(name)
    },
  }
}

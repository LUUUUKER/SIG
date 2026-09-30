/**
 * 概览 / Overview
 * API 注入：用 React Context 提供 SigApi 实例。应用默认用 services/api.ts 的 api；
 * 测试可以注入一个全新的 mock 实例，避免测试之间共享收藏、更新等内存状态。
 * API injection via React Context. The app uses the default api from services/api.ts; tests inject
 * a fresh mock so saved items and refresh state never leak between tests.
 *
 * 包含 / Contents
 * - ApiContext：<ApiContext.Provider value={...}> 注入。/ provide with <ApiContext.Provider>.
 * - useApi()：读取当前 SigApi。/ read the current SigApi.
 */
import { createContext, useContext } from 'react'
import { api, type SigApi } from './api'

export const ApiContext = createContext<SigApi>(api)

/** 当前 API / The current SigApi from context. */
export function useApi(): SigApi {
  return useContext(ApiContext)
}

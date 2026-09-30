/**
 * 概览 / Overview
 * 数据层错误类型：让界面区分"找不到"和其他失败，分别显示不同状态。
 * Data-layer error types, so the UI can tell "not found" apart from other failures.
 *
 * 包含 / Contents
 * - ApiError：数据请求失败（网络、服务端、模拟失败）。/ A data request failed.
 * - NotFoundError：请求的对象不存在。/ The requested object does not exist.
 */

export class ApiError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string) {
    super(message)
    this.name = 'NotFoundError'
  }
}

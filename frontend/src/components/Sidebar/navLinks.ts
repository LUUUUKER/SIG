/**
 * 概览 / Overview
 * 导航链接定义：个人入口列表与领域链接生成。与组件分开存放，便于复用并保持开发时热更新可用。
 * Navigation link definitions: personal entries and domain link building. Kept apart from components
 * for reuse and so fast refresh keeps working.
 *
 * 包含 / Contents
 * - PERSONAL_LINKS：为你精选、稍后阅读、近期活动。/ personal entries.
 * - domainPath(domain, contentType)：生成领域链接。/ build a domain link.
 */
import { DEFAULT_CONTENT_TYPE, type ContentType, type Domain } from '../../lib/domains'

export const PERSONAL_LINKS = [
  { to: '/', label: '为你精选', mark: '◉' },
  { to: '/saved', label: '稍后阅读', mark: '◇' },
  { to: '/events', label: '近期活动', mark: '↗' },
] as const

/**
 * 领域链接 / Domain link.
 * 输入 / Input: domain、contentType。
 * 输出 / Output: "/domain/<领域>"；非默认类型时附加 "?type=<类型>"。
 *                "/domain/<domain>", plus "?type=<type>" when not the default type.
 */
export function domainPath(domain: Domain, contentType: ContentType): string {
  const path = `/domain/${encodeURIComponent(domain)}`
  return contentType === DEFAULT_CONTENT_TYPE ? path : `${path}?type=${encodeURIComponent(contentType)}`
}

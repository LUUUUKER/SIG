/**
 * 概览 / Overview
 * 领域与内容类型常量：全站唯一的领域顺序、导航符号和三种内容类型。
 * Domain and content-type constants: the single source of domain order, nav marks and content types.
 *
 * 包含 / Contents
 * - DOMAINS / Domain：七个新闻领域，顺序即头版与导航顺序。/ Seven domains; order drives headlines and nav.
 * - DOMAIN_MARKS：左栏导航使用的符号。/ Symbols shown in the sidebar.
 * - CONTENT_TYPES / ContentType：新闻、精选文章、名人动态。/ The three content types.
 * - DEFAULT_CONTENT_TYPE：默认内容类型"新闻"。/ Default content type.
 * - parseContentType(value)：把 ?type= 的值转成合法类型，非法或缺失时回到默认。/ Parse ?type= safely.
 */

export const DOMAINS = ['AI', '科技', 'GitHub', '金融', '中美政治', '体育', '影视'] as const
export type Domain = (typeof DOMAINS)[number]

export const DOMAIN_MARKS: Record<Domain, string> = {
  AI: '✳',
  科技: '⌘',
  GitHub: '⌥',
  金融: '↗',
  中美政治: '◎',
  体育: '◌',
  影视: '▤',
}

export const CONTENT_TYPES = ['新闻', '精选文章', '名人动态'] as const
export type ContentType = (typeof CONTENT_TYPES)[number]

export const DEFAULT_CONTENT_TYPE: ContentType = '新闻'

/**
 * 解析内容类型 / Parse a content type.
 * 输入 / Input: value —— 通常来自 URL 的 ?type=，可能为 null 或任意字符串。/ usually ?type=, possibly null.
 * 输出 / Output: 合法的 ContentType；否则返回默认"新闻"。/ a valid ContentType, else the default.
 */
export function parseContentType(value: string | null): ContentType {
  return CONTENT_TYPES.find((contentType) => contentType === value) ?? DEFAULT_CONTENT_TYPE
}

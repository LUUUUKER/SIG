/**
 * 概览 / Overview
 * 布局元素 ID：多个模块需要按 ID 找到同一个元素（聚焦、滚动），集中定义避免拼写不一致，
 * 也避免 features 反向引用 AppShell 组件文件。
 * Layout element ids shared by modules that focus or scroll them; defined once to avoid typos and
 * so features never import the AppShell component file.
 *
 * 包含 / Contents
 * - MAIN_CONTENT_ID：中间内容区。/ the centre column.
 */

export const MAIN_CONTENT_ID = 'main-content'

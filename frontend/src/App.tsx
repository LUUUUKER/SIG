/**
 * 概览 / Overview
 * 阶段 0 占位根组件：只证明前端工具链能渲染页面。阶段 1 会由 AppShell + 路由替换。
 * Phase-0 placeholder root: proves the toolchain renders. Replaced by AppShell + router in phase 1.
 *
 * 包含 / Contents
 * - App()：渲染品牌名 SIG 与一句状态说明。/ Renders the SIG brand and a status line.
 */

/**
 * 根组件 / Root component.
 * 输入 / Input: 无。/ none.
 * 输出 / Output: 含 SIG 标题的占位页面。/ Placeholder page with the SIG heading.
 */
export default function App() {
  return (
    <main>
      <h1>SIG</h1>
      <p>项目骨架已就绪 · 界面将在阶段 1 按设计稿还原。</p>
    </main>
  )
}

/**
 * 概览 / Overview
 * 首屏主题：在 React 加载之前、页面第一次绘制之前设置 <html data-theme>，避免深色时段先闪一下浅色。
 * 本函数会被 Vite 插件（vite.config.ts）以源码形式内联进 index.html 的 <head>，因此必须完全自包含：
 * 不能引用任何外部变量或导入，常量都写在函数内部。结果与 resolveTheme 一致由测试 L24 保证。
 * First-paint theme: set <html data-theme> before React loads so dark hours never flash light.
 * A Vite plugin inlines this function's source into index.html <head>, so it must be fully
 * self-contained (no imports, no outer variables). Test L24 keeps it consistent with resolveTheme.
 *
 * 包含 / Contents
 * - BootStorage、BootRoot：最小结构类型（配置文件的 TS 环境没有 DOM 类型）。/ minimal structural types.
 * - bootTheme(storage, now, root)：读取已保存的主题模式并写入 data-theme。/ read saved mode, write data-theme.
 */

export interface BootStorage {
  getItem(key: string): string | null
}

export interface BootRoot {
  dataset: { theme?: string }
}

/**
 * 首屏主题 / First-paint theme.
 * 输入 / Input
 * - storage：localStorage 或 null（不可用时）。/ localStorage, or null when unavailable.
 * - now：当前时间。/ current time.
 * - root：<html> 元素。/ the <html> element.
 * 输出 / Output: 实际主题 'light' | 'dark'，并已写入 root.dataset.theme。
 * 步骤 / Steps
 * 1. 从 "sig-ui" 读取 state.themeMode；读取或解析失败按 'auto' 处理。/ Read the saved mode; failures mean 'auto'.
 * 2. 'light' / 'dark' 直接使用。/ Manual modes are used as-is.
 * 3. 'auto'：取洛杉矶小时数，06:00–18:00 为浅色，否则深色。/ Auto: LA hour 6–18 is light.
 * 4. 写入 data-theme。/ Write data-theme.
 */
export function bootTheme(storage: BootStorage | null, now: Date, root: BootRoot): 'light' | 'dark' {
  let themeMode = 'auto'
  try {
    const stored = storage === null ? null : storage.getItem('sig-ui') // 步骤 1 / Step 1
    const parsed = stored === null ? null : JSON.parse(stored)
    if (parsed && parsed.state && typeof parsed.state.themeMode === 'string') themeMode = parsed.state.themeMode
  } catch {
    themeMode = 'auto'
  }

  let theme: 'light' | 'dark'
  if (themeMode === 'light' || themeMode === 'dark') {
    theme = themeMode // 步骤 2 / Step 2
  } else {
    const hourText = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Los_Angeles',
      hour: 'numeric',
      hourCycle: 'h23',
    }).format(now) // 步骤 3 / Step 3
    const laHour = Number(hourText)
    theme = laHour >= 6 && laHour < 18 ? 'light' : 'dark'
  }

  root.dataset.theme = theme // 步骤 4 / Step 4
  return theme
}

/**
 * 概览 / Overview
 * 主题切换：浅 / 深 / 自动 三段内凹切换，写入 uiStore.themeMode；实际主题由 useTheme 计算。
 * Theme switch (light / dark / auto) writing uiStore.themeMode; useTheme resolves the actual theme.
 *
 * 包含 / Contents
 * - THEME_OPTIONS：选项与文字。/ options and labels.
 * - ThemeToggle()。
 */
import { useUiStore, type ThemeMode } from '../../state/uiStore'
import styles from './Header.module.css'

const THEME_OPTIONS: ReadonlyArray<{ mode: ThemeMode; label: string; description: string }> = [
  { mode: 'light', label: '浅', description: '浅色主题' },
  { mode: 'dark', label: '深', description: '深色主题' },
  { mode: 'auto', label: '自动', description: '按洛杉矶时间自动切换主题' },
]

/**
 * 主题切换 / Theme toggle.
 * 输出 / Output: role="group" 的三个按钮，当前项 aria-pressed="true"。
 *                Three buttons in a group; the current one has aria-pressed="true".
 */
export function ThemeToggle() {
  const themeMode = useUiStore((state) => state.themeMode)
  const setThemeMode = useUiStore((state) => state.setThemeMode)

  return (
    <div className={styles.toggle} role="group" aria-label="主题">
      {THEME_OPTIONS.map((option) => (
        <button
          key={option.mode}
          type="button"
          className={styles.toggleButton}
          aria-pressed={themeMode === option.mode}
          title={option.description}
          onClick={() => setThemeMode(option.mode)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

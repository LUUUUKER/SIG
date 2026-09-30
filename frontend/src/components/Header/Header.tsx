/**
 * 概览 / Overview
 * 页眉：左侧 SIG｜每日鼓励句；右侧更新状态、主题切换、头像、助手开关。
 * Header: SIG | daily encouragement on the left; refresh status, theme switch, avatar and the
 * assistant toggle on the right.
 *
 * 包含 / Contents
 * - Header({ refresh })：refresh 为更新状态的数据与回调。/ refresh data and callback.
 */
import { Link } from 'react-router'
import { dailyEncouragement } from '../../lib/laTime'
import { ChatToggle } from './ChatToggle'
import styles from './Header.module.css'
import { RefreshStatus, type RefreshStatusProps } from './RefreshStatus'
import { ThemeToggle } from './ThemeToggle'

interface HeaderProps {
  refresh: RefreshStatusProps
}

/**
 * 页眉 / Header.
 * 输入 / Input: refresh —— 传给 RefreshStatus。
 * 输出 / Output: <header>。品牌链接指向 "/"（不带 type 参数，因此内容类型回到默认"新闻"）。
 *                The brand links to "/" without a type param, which resets the content type to 新闻.
 */
export function Header({ refresh }: HeaderProps) {
  return (
    <header className={styles.topbar}>
      <Link to="/" className={styles.brand} aria-label="SIG 首页">
        SIG
      </Link>
      <div className={styles.dailyQuote}>
        <p>{dailyEncouragement(refresh.now)}</p>
      </div>
      <div className={styles.controls}>
        <RefreshStatus {...refresh} />
        <ThemeToggle />
        <div className={styles.avatar} role="img" aria-label="luuuuker">
          LK
        </div>
        <ChatToggle />
      </div>
    </header>
  )
}

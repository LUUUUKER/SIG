/**
 * 概览 / Overview
 * 左侧导航：MY EDITION（为你精选、稍后阅读、近期活动）与 DOMAINS（七领域）两组，DOMAINS 上方细分割线。
 * 切换领域时保留当前内容类型（?type=）。窄屏（≤600px）改为横排，个人入口在前，竖线后接领域。
 * Sidebar: MY EDITION and DOMAINS groups with a hairline above DOMAINS. Switching domains keeps the
 * current content type (?type=). At ≤600px it becomes a horizontal strip with personal entries first.
 *
 * 包含 / Contents
 * - useCurrentContentType()：读取 ?type=，非法值回到默认。/ read ?type= with a safe fallback.
 * - SidebarNav()。链接定义见 navLinks.ts。/ Link definitions live in navLinks.ts.
 */
import { NavLink, useSearchParams } from 'react-router'
import { DOMAINS, DOMAIN_MARKS, parseContentType, type ContentType } from '../../lib/domains'
import { PERSONAL_LINKS, domainPath } from './navLinks'
import styles from './SidebarNav.module.css'

/** 读取当前内容类型，非法值回到默认 / Current content type; invalid values fall back to the default. */
function useCurrentContentType(): ContentType {
  const [searchParams] = useSearchParams()
  return parseContentType(searchParams.get('type'))
}

/** 导航项样式 / Nav item class, with the active variant. */
function navItemClass({ isActive }: { isActive: boolean }): string {
  return isActive ? `${styles.navItem} ${styles.active}` : styles.navItem
}

/**
 * 左侧导航 / Sidebar navigation.
 * 输出 / Output: 两组 NavLink；当前页由 NavLink 自动加 aria-current="page"。
 *                Two NavLink groups; NavLink sets aria-current="page" on the current page.
 */
export function SidebarNav() {
  const contentType = useCurrentContentType()

  return (
    <aside className={styles.sidebar} aria-label="导航">
      <nav className={styles.group} aria-labelledby="nav-my-edition">
        <p className={styles.label} id="nav-my-edition">
          MY EDITION
        </p>
        <div className={styles.items}>
          {PERSONAL_LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} end className={navItemClass}>
              <span className={styles.mark} aria-hidden="true">
                {link.mark}
              </span>
              {link.label}
            </NavLink>
          ))}
        </div>
      </nav>

      <nav className={`${styles.group} ${styles.domains}`} aria-labelledby="nav-domains">
        <p className={styles.label} id="nav-domains">
          DOMAINS
        </p>
        <div className={styles.items}>
          {DOMAINS.map((domain) => (
            <NavLink key={domain} to={domainPath(domain, contentType)} className={navItemClass}>
              <span className={styles.mark} aria-hidden="true">
                {DOMAIN_MARKS[domain]}
              </span>
              {domain}
            </NavLink>
          ))}
        </div>
      </nav>

      <div className={styles.footnote}>
        由你的好奇心驱动
        <strong>兴趣可以随时改变。</strong>
        告诉右侧助手，你想看什么。
      </div>
    </aside>
  )
}

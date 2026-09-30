/**
 * 概览 / Overview
 * 线性 SVG 图标：侧栏开关、放大镜、刷新、历史（时钟）、新对话（加号）、删除（叉）。
 * 图标本身对读屏隐藏，可访问名称由外层按钮提供。
 * Line SVG icons. Icons are hidden from screen readers; the wrapping button provides the name.
 *
 * 包含 / Contents
 * - PanelIcon、SearchIcon、RefreshIcon、HistoryIcon、PlusIcon、CloseIcon。
 * - IconFrame：统一尺寸与描边的外框。/ shared size and stroke wrapper.
 */
import type { ReactNode } from 'react'

interface IconProps {
  size?: number
}

/** 图标外框 / Shared SVG frame. */
function IconFrame({ size = 18, children }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  )
}

/** 侧栏开关 / Panel toggle. */
export function PanelIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M15 4v16" />
    </IconFrame>
  )
}

/** 放大镜 / Search. */
export function SearchIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m16 16 5 5" />
    </IconFrame>
  )
}

/** 刷新 / Refresh. */
export function RefreshIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <path d="M20 11a8 8 0 1 0-2.3 5.7" />
      <path d="M20 5v6h-6" />
    </IconFrame>
  )
}

/** 历史（时钟）/ History (clock). */
export function HistoryIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </IconFrame>
  )
}

/** 新对话（加号）/ New chat (plus). */
export function PlusIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <path d="M12 5v14M5 12h14" />
    </IconFrame>
  )
}

/** 删除（叉）/ Delete (cross). */
export function CloseIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <path d="m6 6 12 12M18 6 6 18" />
    </IconFrame>
  )
}

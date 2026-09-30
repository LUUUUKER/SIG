/**
 * 概览 / Overview
 * 404：地址不存在（或领域名不合法）时显示，并提供回到首页的入口。
 * 404 for unknown URLs (or invalid domain names), with a link back home.
 *
 * 包含 / Contents
 * - NotFoundPage()。
 */
import { Link } from 'react-router'
import { PageHeading } from '../../components/PageHeading'
import { StatusView } from '../../components/StatusView'

/** 404 页面 / Not-found page. */
export function NotFoundPage() {
  return (
    <section>
      <PageHeading title="页面不存在" />
      <StatusView state="empty" message="这个地址没有对应的内容。" />
      <p style={{ textAlign: 'center' }}>
        <Link to="/" style={{ color: 'var(--accent)' }}>
          回到为你精选 →
        </Link>
      </p>
    </section>
  )
}

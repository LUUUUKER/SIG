/**
 * 概览 / Overview
 * 演示数据：沿用原型中的示例标题与参考链接。所有时间都按"当前时刻往前推 N 小时"生成，
 * 这样无论哪天打开，24 小时窗口和「新」「更新」标记都能正常演示。每条都标记 isDemo，不代表真实报道。
 * Demo data reusing the prototype's sample titles and reference links. Every timestamp is "now minus
 * N hours", so the 24h window and badges work on any day. Every item is marked isDemo; none is real reporting.
 *
 * 包含 / Contents
 * - buildMockArticles(now)：初始演示内容（七领域新闻、一条已超 24h 的新闻、名人动态、精选文章）。
 *   Initial demo content (news for all seven domains, one stale news item, people updates, long reads).
 * - buildRefreshBatch(completedAt)：模拟一次后台更新新增的内容。/ Items added by a simulated refresh.
 * - buildDemoAnalysis(article)：详情页"AI 分析"的演示文本。/ Demo text for the analysis section.
 */

import type { ContentType, Domain } from '../lib/domains'
import type { Article, ArticleAnalysis } from './types'

const MILLISECONDS_PER_HOUR = 3_600_000

interface ArticleSeed {
  id: string
  domain: Domain
  type: ContentType
  title: string
  summary: string
  keyPoints: string[]
  hoursAgo: number
  importanceScore: number
  readingMinutes: number
  publisher: string
  url: string
  /** 距今多少小时有最新进展；缺省等于发布时间。/ Hours since the latest development; defaults to publish time. */
  developmentHoursAgo?: number
}

const DEMO_KEY_POINTS = [
  '这是演示内容，用于展示详情页的版式与层次。',
  '正式版会从原始资料提取重点，并核实发布时间与事件状态。',
  '事实、来源观点与 AI 推断会分开呈现。',
]

const NEWS_SEEDS: ArticleSeed[] = [
  {
    id: 'news-ai-agents',
    domain: 'AI',
    type: '新闻',
    title: '当 AI 开始替你行动，谁来决定它的边界？',
    summary: '从回答问题到调用工具，Agent 的变化不只发生在模型能力上。权限、可追踪性与人的控制权，正在成为产品设计中更重要的问题。',
    keyPoints: [
      '这是一篇用于展示阅读体验的专题示例，而非当日新闻报道。',
      '以 Agent 为线索，讨论模型、工具与权限如何组成可用的系统。',
      '判断 Agent 产品要同时看能力、授权范围与出错后的恢复能力。',
    ],
    hoursAgo: 3,
    importanceScore: 9,
    readingMinutes: 6,
    publisher: '研究阅读专题',
    url: 'https://www.anthropic.com/engineering/building-effective-agents',
    developmentHoursAgo: 1,
  },
  {
    id: 'news-ai-landing',
    domain: 'AI',
    type: '新闻',
    title: '从演示到落地，AI 产品还需要跨过哪些门槛？',
    summary: '头版专题演示 · 从原始资料出发，梳理关键问题、不同观点与值得继续观察的变化。',
    keyPoints: DEMO_KEY_POINTS,
    hoursAgo: 11,
    importanceScore: 6,
    readingMinutes: 5,
    publisher: '相关参考资料',
    url: 'https://www.anthropic.com/engineering/building-effective-agents',
  },
  {
    id: 'news-tech-ecosystem',
    domain: '科技',
    type: '新闻',
    title: '设备之外，生态如何影响我们的选择？',
    summary: '连接性、可维修性与长期支持，让一次购买成为对整套使用体验的选择。',
    keyPoints: DEMO_KEY_POINTS,
    hoursAgo: 5,
    importanceScore: 7,
    readingMinutes: 5,
    publisher: '专题阅读示例',
    url: 'https://www.ifixit.com/News',
  },
  {
    id: 'news-github-stars',
    domain: 'GitHub',
    type: '新闻',
    title: '一个开源项目，值得关注的不只是 Star 数',
    summary: '从文档、维护节奏到真实使用场景：如何判断一个项目是否值得加入你的工具箱。',
    keyPoints: DEMO_KEY_POINTS,
    hoursAgo: 7,
    importanceScore: 8,
    readingMinutes: 4,
    publisher: 'GitHub Open Source Guides',
    url: 'https://opensource.guide/how-to-contribute/',
  },
  {
    id: 'news-github-stale',
    domain: 'GitHub',
    type: '新闻',
    title: '开源协作如何把一个想法变成可靠的工具？',
    summary: '演示用的过期条目：发布已超过 24 小时，不应出现在信息流中。',
    keyPoints: DEMO_KEY_POINTS,
    hoursAgo: 30,
    importanceScore: 10,
    readingMinutes: 5,
    publisher: '相关参考资料',
    url: 'https://opensource.guide/how-to-contribute/',
  },
  {
    id: 'news-finance-capex',
    domain: '金融',
    type: '新闻',
    title: '从算力到现金流：如何阅读科技公司的投入',
    summary: '把资本支出、收入和实际需求放在一起，理解一家公司正在押注怎样的未来。',
    keyPoints: DEMO_KEY_POINTS,
    hoursAgo: 9,
    importanceScore: 7,
    readingMinutes: 7,
    publisher: 'SEC 投资者资料',
    url: 'https://www.investor.gov/',
  },
  {
    id: 'news-policy-source',
    domain: '中美政治',
    type: '新闻',
    title: '阅读一项科技政策，从原文与实施范围开始',
    summary: '区分政策提议、正式发布与实际生效，再比较不同利益相关方的解读。',
    keyPoints: DEMO_KEY_POINTS,
    hoursAgo: 12,
    importanceScore: 8,
    readingMinutes: 6,
    publisher: '政策原始资料入口',
    url: 'https://www.federalregister.gov/',
  },
  {
    id: 'news-sports-nba',
    domain: '体育',
    type: '新闻',
    title: '看懂一场 NBA 比赛，比分之外还有什么？',
    summary: '回合节奏、轮换方式和空间分布，往往比一张赛后数据表更能解释球队如何获胜。',
    keyPoints: DEMO_KEY_POINTS,
    hoursAgo: 14,
    importanceScore: 6,
    readingMinutes: 5,
    publisher: 'NBA Stats',
    url: 'https://www.nba.com/stats',
  },
  {
    id: 'news-film-weekend',
    domain: '影视',
    type: '新闻',
    title: '周末观影：给一部电影留出完整的注意力',
    summary: '按叙事风格和观看心情挑选电影，区分院线上映、流媒体可看与值得重温的作品。',
    keyPoints: DEMO_KEY_POINTS,
    hoursAgo: 18,
    importanceScore: 5,
    readingMinutes: 4,
    publisher: 'BFI',
    url: 'https://www.bfi.org.uk/',
  },
]

const PEOPLE_SEEDS: ArticleSeed[] = [
  {
    id: 'people-ai-researchers',
    domain: 'AI',
    type: '名人动态',
    title: '从研究者的公开表达，理解他们正在思考的问题',
    summary: '关注公开演讲、研究文章与作品本身。把原话、媒体转述和我们的理解分开。',
    keyPoints: DEMO_KEY_POINTS,
    hoursAgo: 6,
    importanceScore: 5,
    readingMinutes: 5,
    publisher: 'Stanford HAI',
    url: 'https://hai.stanford.edu/news',
  },
]

const CURATED_TITLES: Record<Domain, string> = {
  AI: '从工具到伙伴：理解 Agent 的设计边界',
  科技: '技术改变生活之前，我们该问哪些问题？',
  GitHub: '读懂一个开源项目：从 README 到真实使用',
  金融: '理解风险，比追逐预测更重要',
  中美政治: '怎样阅读政策原文，而不被标题带走',
  体育: '从战术与空间，重新看懂一场比赛',
  影视: '镜头之外：理解一部电影的表达',
}

const CURATED_REFERENCE_URLS: Record<Domain, string> = {
  AI: 'https://www.anthropic.com/engineering/building-effective-agents',
  科技: 'https://www.ifixit.com/News',
  GitHub: 'https://opensource.guide/how-to-contribute/',
  金融: 'https://www.investor.gov/',
  中美政治: 'https://www.federalregister.gov/',
  体育: 'https://www.nba.com/stats',
  影视: 'https://www.bfi.org.uk/',
}

/** 精选文章种子：不受 24h 限制，故意设为几天前。/ Long reads are exempt from 24h, so they are days old. */
const CURATED_SEEDS: ArticleSeed[] = (Object.keys(CURATED_TITLES) as Domain[]).map((domain, index) => ({
  id: `curated-${index + 1}`,
  domain,
  type: '精选文章',
  title: CURATED_TITLES[domain],
  summary: '精选长文样稿 · 聚焦长期值得理解的问题，保留关键摘要、背景分析与参考资料，适合慢下来阅读。',
  keyPoints: [
    '这是一篇精选文章的版式演示，并非已检索到的完整文章。',
    '正式版会说明作者、发布日期、推荐理由及原文出处。',
  ],
  hoursAgo: 48 + index * 24,
  importanceScore: 5,
  readingMinutes: 8,
  publisher: '相关参考资料',
  url: CURATED_REFERENCE_URLS[domain],
}))

const REFRESH_SEEDS: ArticleSeed[] = [
  {
    id: 'refresh-finance-report',
    domain: '金融',
    type: '新闻',
    title: '看懂一份财报，先找到真正的收入来源',
    summary: '更新演示 · 本条由模拟后台更新加入，用来展示「新」标记与"有 N 条新内容"提示。',
    keyPoints: DEMO_KEY_POINTS,
    hoursAgo: 0.5,
    importanceScore: 6,
    readingMinutes: 5,
    publisher: '相关参考资料',
    url: 'https://www.investor.gov/',
  },
  {
    id: 'refresh-sports-review',
    domain: '体育',
    type: '新闻',
    title: '当比赛结束，哪些细节值得重新回看？',
    summary: '更新演示 · 本条由模拟后台更新加入，用来展示「新」标记与"有 N 条新内容"提示。',
    keyPoints: DEMO_KEY_POINTS,
    hoursAgo: 0.5,
    importanceScore: 5,
    readingMinutes: 5,
    publisher: 'NBA Stats',
    url: 'https://www.nba.com/stats',
  },
  {
    id: 'refresh-film-editing',
    domain: '影视',
    type: '新闻',
    title: '声音、节奏与剪辑，如何共同塑造一场戏？',
    summary: '更新演示 · 本条由模拟后台更新加入，用来展示「新」标记与"有 N 条新内容"提示。',
    keyPoints: DEMO_KEY_POINTS,
    hoursAgo: 0.5,
    importanceScore: 7,
    readingMinutes: 4,
    publisher: 'BFI',
    url: 'https://www.bfi.org.uk/',
  },
]

/** 某时刻往前推若干小时的 ISO 时间 / ISO time N hours before a reference instant. */
function hoursBefore(reference: Date, hours: number): string {
  return new Date(reference.getTime() - hours * MILLISECONDS_PER_HOUR).toISOString()
}

/**
 * 种子转文章 / Seed to article.
 * 输入 / Input: seed、reference（计算时间的基准时刻）。/ seed and the reference instant.
 * 输出 / Output: Article —— 首次收录时间等于发布时间；事件 ID 为 "cluster-<id>"。
 *                firstSeenAt equals publishedAt; eventClusterId is "cluster-<id>".
 */
function seedToArticle(seed: ArticleSeed, reference: Date): Article {
  const publishedAt = hoursBefore(reference, seed.hoursAgo)
  return {
    id: seed.id,
    domain: seed.domain,
    type: seed.type,
    title: seed.title,
    summary: seed.summary,
    keyPoints: seed.keyPoints,
    publishedAt,
    firstSeenAt: publishedAt,
    eventClusterId: `cluster-${seed.id}`,
    latestDevelopmentAt:
      seed.developmentHoursAgo === undefined ? publishedAt : hoursBefore(reference, seed.developmentHoursAgo),
    importanceScore: seed.importanceScore,
    readingMinutes: seed.readingMinutes,
    sources: [{ url: seed.url, publisher: seed.publisher, title: seed.title, publishedAt }],
    isDemo: true,
  }
}

/**
 * 初始演示内容 / Initial demo articles.
 * 输入 / Input: now。
 * 输出 / Output: 新闻（含 1 条超过 24h 的过期条目）、名人动态、精选文章。
 *                News (including one stale item older than 24h), people updates and long reads.
 */
export function buildMockArticles(now: Date): Article[] {
  return [...NEWS_SEEDS, ...PEOPLE_SEEDS, ...CURATED_SEEDS].map((seed) => seedToArticle(seed, now))
}

/**
 * 模拟更新新增内容 / Items added by a simulated refresh.
 * 输入 / Input: completedAt —— 更新完成时刻。/ refresh completion time.
 * 输出 / Output: 3 条新闻，首次收录时间 = completedAt（因而会带「新」标记）。
 *                Three news items first seen at completedAt (so they get the "new" badge).
 */
export function buildRefreshBatch(completedAt: Date): Article[] {
  return REFRESH_SEEDS.map((seed) => ({
    ...seedToArticle(seed, completedAt),
    firstSeenAt: completedAt.toISOString(),
  }))
}

/**
 * 演示分析 / Demo analysis.
 * 输入 / Input: article。
 * 输出 / Output: ArticleAnalysis，文本明确说明是演示。/ analysis text that states it is a demo.
 */
export function buildDemoAnalysis(article: Article): ArticleAnalysis {
  return {
    articleId: article.id,
    analysis:
      '（演示）一个有用的解读，应先说明证据能够支持什么，再讨论可能的影响。将事实、不同观点与分析分开，让你既能快速理解，也能回到来源作出自己的判断。',
    openQuestions:
      '这件事与之前的进展有什么不同？哪些说法有原始资料支持？如果出现新的证据，判断需要怎样改变？这些问题都可以在右侧继续和 sig 讨论。',
    isDemo: true,
  }
}

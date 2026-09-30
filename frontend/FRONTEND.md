# SIG 前端设计文档

> 维护规则：前端任何文件的新增、删除、改名，以及调用链、状态、已定规则的变化，都要**在同一次改动里**更新本文件。状态列必须如实标注：✅ 已实现 ／ 📝 计划中。
>
> 最近更新：2026-09-29 · 阶段 0 完成（F1、F2 通过）；阶段 1a 完成（L1–L23、S1–S19 通过）；阶段 1b 完成（样式、外壳、页眉、左栏、助手面板；H5、H7、C1–C9、C15、C16、F1、F2 通过），并修复首屏主题闪烁（L24、V13 通过）；阶段 1c 完成（完整页面与数据接入；H1–H4、H6、H8、H9、C10–C14、P1–P8 通过，共 87 个单元测试 + F2、V13）。

## 1. 概览

SIG 是个人使用的 AI 新闻与活动阅读空间。前端负责展示与交互；数据、AI 调用和密钥全部在后端。

| 项目 | 选择 |
|---|---|
| 框架 | React 19 + TypeScript + Vite 8 |
| 路由 | React Router（阶段 1 引入） |
| 服务端数据 | TanStack Query（阶段 1 引入） |
| 界面状态 | Zustand（阶段 1 引入） |
| 样式 | 原生 CSS 变量 + CSS Modules；不使用组件库 |
| 测试 | Vitest + React Testing Library（单元/组件），Playwright（端到端） |
| 设计基线 | `../sig-handoff/prototype/index.html`（视觉参考，不是代码模板） |

### 已确认的产品规则（影响前端）

- **没有早晚报。** 采用"滚动 24h 信息流"：新闻、名人动态只展示最近 24 小时；精选文章不受 24h 限制但不重复推荐。
- **更新机制**：打开网页时若距上次更新超过 **8 小时**，后台自动更新；页眉显示"更新于 X 前"，可手动刷新。新结果以"有 N 条新内容"提示，点击后才刷新列表，不自动跳动。
- **头版**：七领域（AI、科技、GitHub、金融、中美政治、体育、影视）各取最近 24h 最重要的一条；某领域没有合格内容就跳过，绝不编造。
- **标记**：「新」= 在上一次打开网页之后首次收录；「更新」= 看过的事件出现重大新进展。本次打开期间标记不消失。
- **主题**：按洛杉矶时间自动切换（06:00–18:00 浅色，其余深色），页眉可切换 浅 / 深 / 自动。浅色 = 原型早报配色，深色 = 原型晚报配色。
- **品牌 SIG**：点击回首页，内容类型重置为"新闻"。
- **稍后阅读**：收藏不受 24h 限制。
- **助手**：仅页眉一个开关。窄屏时助手面板从页眉下方开始（页眉开关始终可点），点遮罩或 Esc 也可关闭。
- **对话历史**：LRU 保留最近 **10** 个对话（按最后活跃时间 `lastActiveAt`，发消息或切回都算使用）。点"新对话"开始新会话；切换文章不新开会话，每条消息各自记录关联上下文。空对话不保存、不占名额；当前对话不被淘汰。标题取首条消息前约 20 字。发送时同时冻结 `sessionId` 与 `ContextRef`，回复写回原会话。阶段 1 存 localStorage，阶段 3 改存数据库。
- **助手标题栏**：头像、sig · 阅读伙伴 … [历史]（时钟图标）[新对话]（加号图标）。历史在面板内展开列表：标题、关联文章、"X 前"，可切换、可单条删除。取代原型的"重置"。
- **其他默认值**：首次访问不标「新」；24h 边界含等于 24h、容忍未来 5 分钟；`needsRefresh` 遇未来时间返回 false；活动范围为 1–500 的整数 miles；模拟更新约 2 秒并新增几条演示内容；快捷问题只作为消息发送，不跳转页面。
- **窄屏导航**：横排导航最前面放"为你精选 / 稍后阅读 / 近期活动"，竖线后接七个领域。
- **欢迎语**与时间段无关（不再提"晨间/晚间精选"）。
- 必须保留的外观：克制科技风、浮雕卡片、内凹输入；页眉为 SIG｜每日鼓励句 … 控件；无顶部方案栏、无「你的关注」、无「每日一句」标签；左栏 MY EDITION / DOMAINS，DOMAINS 上方细分割线；聊天标题栏底线与页眉底线对齐；输入框 26px 起、144px 封顶后内部滚动；活动为紧凑表单 + 放大镜按钮。

## 2. 分层规则

```
features/（页面与业务） → components/（通用界面） → state/（界面状态） → services/（数据） → lib/（纯函数）
```

- 只能沿箭头方向依赖，禁止反向引用。`app/` 位于最上层，负责组装。
- `lib/` 只放纯函数，不引用 React，最容易测试。
- `services/` 是唯一接触数据的地方。当前实现是 `mockApi`；阶段 2 替换为真实 HTTP 实现，页面代码不改。
- 测试文件与被测文件同目录（`xxx.test.ts(x)`）；Playwright 端到端测试放 `e2e/`。
- 每个文件开头写中英双语概览注释；每个函数写输入、输出、功能与步骤。

## 3. 目录结构

```
frontend/
├─ FRONTEND.md               本文档
├─ index.html                HTML 外壳（lang=zh-CN，标题 SIG）
├─ vite.config.ts            Vite 与 Vitest 配置；/api 代理到 127.0.0.1:8000；themeBootPlugin 把 bootTheme 内联进 <head>
├─ playwright.config.ts      端到端测试配置，自动启动开发服务器
├─ e2e/                      Playwright 测试
├─ public/favicon.svg        SIG 图标
└─ src/
   ├─ main.tsx               入口
   ├─ test/setup.ts          Vitest 全局准备（默认窄屏 matchMedia、每个测试后重置 store）
   ├─ test/testUtils.tsx     测试辅助：setViewportMatches、resetStores、createTestApi、TestProviders、renderApp
   ├─ app/                   组装层：布局、路由、全局 hook
   ├─ styles/                设计 token 与全局样式
   ├─ lib/                   纯函数
   ├─ services/              数据类型、API 接口与 mock 实现、Query 钩子
   ├─ state/                 Zustand 界面状态
   ├─ components/            通用组件
   └─ features/              feed / articles / saved / events / chat / notFound
```

## 4. 文件职责

### 4.1 入口与组装 `app/`

| 文件 | 状态 | 职责 |
|---|---|---|
| `main.tsx` | ✅ | 引入 `tokens.css`、`base.css`；`QueryClientProvider`（`createQueryClient()`）包住 `react-router/dom` 的 `RouterProvider` |
| `app/router.tsx` | ✅ | `appRoutes`（测试复用）与 `createAppRouter()`；`/` 与 `/domain/:domain` → FeedPage，`/article/:articleId` → ArticlePage，`/saved` → SavedPage，`/events` → EventPage，`*` → NotFoundPage，全部挂在 AppShell 下；内容类型用 `?type=`。1b 的临时 `PlaceholderPage.tsx` 已在 1c 删除 |
| `app/AppShell.tsx` + `.module.css` | ✅ | 页眉 + 左栏 + `<main id="main-content">`（路由出口）+ ChatPanel + ToastHost。桌面：页面不滚动，助手打开时 workspace 右侧让出 `--chat-width`；窄屏：覆盖面板 + 遮罩。屏宽跨过 951px 时设置默认显隐；Esc（窄屏打开时或焦点在面板内）关闭；关闭后焦点回到页眉开关。页眉更新状态来自 `useAutoRefresh()` |
| `app/useMediaQuery.ts` | ✅ | `useMediaQuery(query)`（useSyncExternalStore 订阅 matchMedia）、`DESKTOP_QUERY = (min-width: 951px)` |
| `app/useTheme.ts` | ✅ | `resolveTheme(mode, now)`、`useMinuteClock()`（每分钟变化一次的分钟序号）、`useTheme()`：写入 `<html data-theme>` |
| `app/useVisitTracker.ts` | ✅ | 启动时调用 `uiStore.recordVisit()`；该动作每个会话只生效一次，StrictMode 重复执行也安全 |
| `app/useAutoRefresh.ts` | ✅ | 返回 RefreshStatus 的 props。信息流首次加载后本会话只判断一次（`refreshStore.autoRefreshAttempted`，StrictMode 安全）：`needsRefresh(lastRunAt, now, 8h)` 为真则发起；轮询到结束交给 `refreshStore.completeRun`；手动更新且无新内容提示"已是最新内容"；时间优先用最近一次成功的完成时间，`now` 来自分钟时钟 |

### 4.2 样式 `styles/`

| 文件 | 状态 | 职责 |
|---|---|---|
| `tokens.css` | ✅ | `:root` 为浅色（原早报）、`:root[data-theme='dark']` 为深色（原晚报）的颜色与材质变量，含 `--orb` 与按钮填充 `--fill-*`；布局变量 `--header-height`（81，≤600 为 110）、`--sidebar-width`（190 / 951–1180 为 150 / ≥1550 为 210 / ≤950 为 135）、`--chat-width`（345 / 300 / 385）、`--main-padding-x` |
| `base.css` | ✅ | reset、`[hidden]` 强制隐藏、按钮/链接默认、焦点环、`.page-material` 背景细网格、`.visually-hidden`、细滚动条、减少动态效果；桌面时 html/body/#root 高 100% 且不滚动 |

### 4.3 纯函数 `lib/`

| 文件 | 函数 | 状态 | 作用 |
|---|---|---|---|
| `domains.ts` | `DOMAINS`、`DOMAIN_MARKS`、`CONTENT_TYPES`、`DEFAULT_CONTENT_TYPE`、`parseContentType(value)` | ✅ | 七领域顺序与导航符号、三种内容类型；`parseContentType` 把 `?type=` 转成合法类型（1c 新增，FeedPage 与 SidebarNav 共用） |
| `layoutIds.ts` | `MAIN_CONTENT_ID` | ✅ | 布局元素 ID（1c 新增）。放在 lib 而不是 app，是为了让 features 引用时不违反分层 |
| `laTime.ts` | `losAngelesParts(now)` | ✅ | 当前时刻换算为洛杉矶的年月日时分（Intl 时区，自动处理夏令时） |
| | `themeForTime(now)` | ✅ | 洛杉矶 06:00–18:00 返回 `light`，其余 `dark` |
| | `dailyEncouragement(now)` | ✅ | 同一洛杉矶日期返回同一句鼓励语，相邻两天不同 |
| `freshness.ts` | `needsRefresh(lastRunAt, now, hours = 8)` | ✅ | null → true；未来时间 → false；满间隔 → true |
| | `isWithin24h(publishedAt, now)` | ✅ | 含恰好 24h；容忍未来 5 分钟，更远的未来视为异常 |
| | `formatUpdatedAgo(lastRunAt, now)` | ✅ | 刚刚 / N 分钟前 / N 小时前 / N 天前 / 尚未更新（"更新于"前缀由组件加） |
| `badges.ts` | `badgeFor(item, previousVisitAt, seenClusters)`、`BADGE_LABELS` | ✅ | 返回 `'new'` / `'update'` / `null`；看过的事件优先判断更新；首次访问不标新 |
| `headlines.ts` | `pickHeadlines(items, now, domains = DOMAINS)` | ✅ | 只看 24h 内的新闻；每领域最高分（同分取更新）；缺失领域跳过 |
| `eventFilters.ts` | `EVENT_CATEGORIES`、`defaultFilters(now)`、`validateFilters(draft)`、`toQuery(draft)` | ✅ | 活动默认条件（LA、60、今天到下月同日，月末截断）、校验、转查询。原计划放 `features/events/`，因 `state/uiStore` 需要其类型而移到 `lib/`（分层规则禁止 state 引用 features） |
| `composerHeight.ts` | `composerHeight(scrollHeight)` | ✅ | 输入框高度限制 26–144px，超出时内部滚动。同理从 `features/chat/` 移到 `lib/` |
| `themeBoot.ts` | `bootTheme(storage, now, root)` | ✅ | 首屏主题：React 加载前读取 `sig-ui` 中的 `themeMode`（读取失败按自动），写入 `<html data-theme>`，消除深色时段首屏闪浅色。由 `vite.config.ts` 的 `themeBootPlugin` 以源码内联进 `<head>`，因此函数必须完全自包含；与 `resolveTheme` 的一致性由 L24 保证 |

### 4.4 数据层 `services/`

| 文件 | 状态 | 职责 |
|---|---|---|
| `types.ts` | ✅ | `Article`（领域、类型、标题、摘要、重点、发布时间、首次收录时间、事件 ID、最新进展时间、重要度、阅读时长、来源、是否演示）、`Source`、`ArticleAnalysis`、`Feed`、`RefreshRun`、`EventSearchResult`、`ContextRef`、`ChatMessage`、`ChatRequest`、`ChatReply`；时间一律 ISO 字符串 |
| `errors.ts` | ✅ | `ApiError`（请求失败）、`NotFoundError`（对象不存在） |
| `api.ts` | ✅ | `SigApi` 接口：`getFeed`、`getArticle`、`getArticleAnalysis`（打开详情才生成）、`listSaved`、`setSaved`、`startRefresh`、`getRefreshStatus`、`searchEvents`、`sendChat`；导出当前实现 `api = createMockApi()` |
| `mockData.ts` | ✅ | `buildMockArticles(now)`（七领域新闻 + 1 条超 24h 的过期新闻 + 名人动态 + 7 篇精选）、`buildRefreshBatch(completedAt)`（模拟更新新增 3 条）、`buildDemoAnalysis(article)`；全部 `isDemo: true` |
| `mockApi.ts` | ✅ | `createMockApi({ now, latencyMs, refreshDurationMs, initialLastRunAt })`：内存状态、模拟延迟（默认 250ms）、`configureMock({ failNext })` 模拟一次失败；默认上次更新为 9 小时前，使首次打开触发模拟更新（约 2 秒）；进行中不重复发起；重复更新不重复加入内容 |
| `apiContext.ts` | ✅ | `ApiContext`（默认值为 `api`）与 `useApi()`：测试注入全新 mock，避免测试之间共享内存状态 |
| `queryClient.ts` | ✅ | `createQueryClient({ retry })`：数据 1 分钟内新鲜、窗口聚焦不重新获取；失败重试 1 次但 `NotFoundError` 不重试（重试规则只在这里定义）；测试传 `retry: false` |
| `queries.ts` | ✅ | `queryKeys`、`REFRESH_POLL_MS = 1000`；`useFeed`、`useArticle`、`useArticleAnalysis`、`useSaved`；`useToggleSaved`（`onMutate` 乐观更新收藏列表，`onError` 回滚，`onSettled` 触发重新获取但不等待，避免调用方的提示被推迟；不弹提示，数据层不依赖状态层）；`useStartRefresh`、`useRefreshRun(runId)`（running 时每秒轮询）；`useEventSearch(query)`（null 时不请求）。原计划的 `useRefresh` 拆成这两个钩子，由 `useAutoRefresh` 组合 |

### 4.5 界面状态 `state/`

每个 store 都提供工厂函数（`createXxxStore(options)`，测试注入存储、时钟、api）、应用实例和 React 钩子（`useXxxStore(selector)`）。选择器返回新数组时须配合 `useShallow`，否则会无限重渲染。

| 文件 | 状态 | 内容 |
|---|---|---|
| `storage.ts` | ✅ | `createSafeStorage(getStorage)`（读写全部 try/catch，失败时等同无存储）、`browserStorage`、`createMemoryStorage()` |
| `uiStore.ts` | ✅ | `themeMode`、`chatOpen`、`readingContext`（默认"为你精选 · 最近 24 小时"）、`previousVisitAt`、`lastVisitAt`、`visitRecorded`（1b 新增：本会话是否已记录访问，不持久化，使 `recordVisit` 只生效一次）、`seenClusters`、`activityDraft`、`submittedActivityQuery`、`activityCategory`；动作 `setThemeMode`、`setChatOpen`、`toggleChat`、`setReadingContext`、`recordVisit`、`markClusterSeen`、`updateActivityDraft`、`submitActivityQuery`、`setActivityCategory`。持久化键 `sig-ui`，只存 `themeMode`、`lastVisitAt`、`seenClusters` |
| `chatSessionStore.ts` | ✅ | `sessions`（LRU 上限 10）、`activeSessionId`（null = 新对话空白页）、`draft`（全局一份，不持久化）；每会话 `status`（idle / replying / error）、`errorMessage`、`pendingRequest`。动作 `setDraft`、`sendMessage(text, contextRef)`、`retry(sessionId)`、`startNewSession`、`switchSession`、`deleteSession`。工具 `makeSessionTitle`、`evictLeastRecentlyUsed`、`selectActiveSession`、`selectSessionsByRecent`。持久化键 `sig-chat-sessions`；刷新时仍在回复中的会话变为"回复被中断，可重试" |
| `toastStore.ts` | ✅ | 同一时间一条提示（新提示替换旧提示并重置计时），6.5 秒自动消失；`showToast(message, undo?)`、`dismissToast`、`undoToast` |
| `refreshStore.ts` | ✅ | 1c 新增，会话内状态、不持久化：`autoRefreshAttempted`、`activeRunId`、`activeRunIsManual`、`lastHandledRunId`、`latestRunAt`、`lastRunFailed`、`pendingNewArticleCount`；动作 `markAutoRefreshAttempted`、`beginRun`、`completeRun(run)`（同一个 run 只处理一次，成功累加待显示条数）、`markStartFailed`、`clearPending`。页眉与"有 N 条新内容"共享它 |

### 4.6 通用组件 `components/`

| 文件 | 状态 | 职责 |
|---|---|---|
| `Header/Header.tsx` + `Header.module.css` | ✅ | `Header({ refresh })`：SIG 链接（名称"SIG 首页"，指向 `/`，因此类型回到新闻）｜每日鼓励句 … RefreshStatus、ThemeToggle、头像（LK）、ChatToggle。≤950 页眉 sticky、隐藏更新文字只留图标；≤600 两行布局、隐藏头像 |
| `Header/ThemeToggle.tsx` | ✅ | 浅 / 深 / 自动，内凹三段切换，`aria-pressed` 表示当前项 |
| `Header/RefreshStatus.tsx` | ✅ | 纯展示：`status`（idle / running / failed）、`lastRunAt`、`now`、`onRefresh`；idle"更新于 X 前"或"尚未更新"，running"更新中…"且按钮禁用、图标旋转，failed"更新失败 · 重试" |
| `Header/ChatToggle.tsx` | ✅ | 唯一助手开关（`id="chat-toggle"`，`aria-controls="chat"`，`aria-expanded` 与面板一致，名称在"隐藏/显示 sig 助手"间切换）；导出 `CHAT_TOGGLE_ID`、`CHAT_PANEL_ID` |
| `Sidebar/SidebarNav.tsx` + `.module.css` | ✅ | MY EDITION + DOMAINS 两个 `<nav>`（DOMAINS 上方分割线）；NavLink 自动加 `aria-current="page"`；领域链接保留当前 `?type=`。≤600 横排可滑动，个人入口在前、竖线后接领域 |
| `Sidebar/navLinks.ts` | ✅ | `PERSONAL_LINKS`、`domainPath(domain, contentType)`（从组件文件拆出，保证热更新可用） |
| `StatusView.tsx` + `.module.css` | ✅ | `StatusView({ state, message, onRetry })`：loading / empty 用 `role="status"`，error 用 `role="alert"` 并带重试 |
| `ToastHost.tsx` + `.module.css` | ✅ | 始终存在的 `role="status"` 区域，显示当前提示与"撤销" |
| `icons/Icons.tsx` | ✅ | `PanelIcon`、`SearchIcon`、`RefreshIcon`、`HistoryIcon`、`PlusIcon`、`CloseIcon`（线性 SVG，对读屏隐藏） |
| `PageHeading.tsx` + `.module.css` | ✅ | 1c 新增：紧凑页面标题 `<h1>`（24px）；首页用 `visuallyHidden` 只对读屏可见（原型首页不显示大标题） |

### 4.7 页面与业务 `features/`

| 文件 | 状态 | 职责 |
|---|---|---|
| `feed/FeedPage.tsx` | ✅ | 首页与领域页共用：领域名不合法显示 404；`?type=` 决定内容类型；阅读上下文"<领域或为你精选> · <类型>"；加载 / 失败可重试；首页 + 新闻显示头版轮播（没有头版就不显示）；NewContentBanner、ContentTypeTabs、ArticleList；首页底部 ActivityTeaser；`useScrollMemory` |
| `feed/ArticleList.tsx` | ✅ | 1c 新增，信息流与稍后阅读共用：用 `badgeFor` 算标记、`useSaveToggle` 处理收藏；"与 sig 深聊"＝进入详情 + 打开助手并聚焦输入框 + 提示；空列表显示传入的空状态文案 |
| `feed/NewContentBanner.tsx` | ✅ | "有 N 条新内容 · 点击查看"，N ≤ 0 不渲染；点击后由 FeedPage 清零并重新获取信息流 |
| `feed/HeadlineCarousel.tsx` | ✅ | 滚动吸附大卡片（hero 渐变 + 圆环 orb）、"领域 / 头版"、阅读全文（站内）与阅读来源（新标签页）；领域标签、"01 / 0N"、前后、播放 / 暂停；非当前幻灯片 `inert`；用户拖动时按位置同步；ResizeObserver 在宽度变化后重新对齐；空列表不渲染 |
| `feed/useCarousel.ts` | ✅ | `useCarousel({ count, scrollToIndex, intervalMs })`：8 秒前进并循环；悬停 / 焦点在内 / 标签页隐藏时跳过；减少动态效果默认暂停；`goTo` / `next` / `prev` 手动切换会暂停，触摸也暂停；`syncIndex` 只同步不滚动；返回 `holdHandlers` |
| `feed/ContentTypeTabs.tsx` | ✅ | 新闻 / 精选文章 / 名人动态，`aria-pressed` 表示当前项 |
| `feed/ArticleCard.tsx` | ✅ | 序号、领域、类型、"深读 N 分钟"、「新」「更新」、演示；标题链接到 `/article/:id`；来源外链 `target="_blank"` + `rel="noopener noreferrer"`；与 sig 深聊；收藏按钮 `aria-pressed` + 名称在"收藏文章 / 取消收藏"间切换 |
| `feed/ActivityTeaser.tsx` | ✅ | 首页活动入口；地点与范围取自 `uiStore.activityDraft`（不写死 LA），链接到 `/events` |
| `feed/useScrollMemory.ts` | ✅ | `useScrollMemory(key, ready)`：持续记录 `#main-content` 与页面的滚动位置；ready 后每个 key 只恢复一次：浏览器返回（POP）且有记录则恢复，否则回到顶部；`clearScrollMemory()` 供测试 |
| `feed/useSaveToggle.ts` | ✅ | 1c 新增：包装 `useToggleSaved`，提供 `isSaved(id)` 与 `toggleSaved(article)`，负责"已加入稍后阅读 / 已取消收藏 / 收藏没有成功，已恢复原状态"提示 |
| `feed/Feed.module.css` | ✅ | 头版、类型切换、卡片、标记、新内容提示、活动入口样式（取自原型最终规则） |
| `articles/ArticlePage.tsx` + `Article.module.css` | ✅ | 返回（站内后退，直接打开时回首页）、元信息、标题、导语、重点摘要；`AnalysisSection` 进入后才加载，含"AI 分析生成中…"与失败重试；还值得追问什么；原始资料外链；围绕这篇继续聊；演示说明。加载成功后设置阅读上下文、`markClusterSeen`、滚到顶部；找不到与其他失败分开显示。小节标题用 h2（原型为 h3）以保证标题层级 |
| `saved/SavedPage.tsx` | ✅ | 标题"稍后阅读"；加载 / 失败可重试；`ArticleList`（不受 24h 限制，最近收藏在前）；空状态"还没有收藏。点击内容旁的 ◇ 即可加入。" |
| `events/EventPage.tsx` | ✅ | 区分草稿与已提交查询；编辑时清除对应字段错误；提交时 `validateFilters`，通过则 `submitActivityQuery(toQuery(draft))`；按已提交查询请求并映射为 idle / loading / error / not_connected；阅读上下文"近期活动 · 地点 · 范围" |
| `events/EventSearchForm.tsx` | ✅ | 受控表单（`noValidate`，用自己的校验文案）：地点、范围、开始、结束（`min` = 开始）、预算（占位"不限"）；错误显示在字段下方且位于 `<label>` 之外（否则会混进输入框的可访问名称；`role="alert"`、`aria-invalid`、`aria-describedby`）；放大镜按钮名称"搜索活动" |
| `events/EventCategoryTabs.tsx` | ✅ | 全部 / 演出 / 比赛 / 社交活动 / 展览与放映，`aria-pressed` |
| `events/EventResults.tsx` | ✅ | 加载 / 失败（条件保留）/ 尚未接入（复述已记录的条件，明确不会显示任何活动）；下方只显示标注"分类示例"的方向卡片，按分类过滤，没有任何链接或票价 |
| `events/Events.module.css` | ✅ | 紧凑表单（宽屏一行、951–1550 三列、≤750 两列）、分类、提示与示例卡片样式 |
| `notFound/NotFoundPage.tsx` | ✅ | 1c 新增：404 标题、说明与"回到为你精选"链接；FeedPage 遇到不合法的领域名也显示它 |
| `chat/useOpenChat.ts` | ✅ | 1c 新增：`useOpenChat()` 返回 `openChat()`，显示助手并在下一个事件循环把焦点放进 `#chat-input` |
| `chat/ChatPanel.tsx` | ✅ | `ChatPanel({ hidden })`：标题栏（S 标记、sig · 阅读伙伴、历史、新对话）、ContextSummary、主体三选一（历史 / 当前会话 MessageList / 欢迎页 + 3 个快捷问题）、ChatComposer、演示说明。发送时先清空草稿再以当前阅读上下文发送；回复中禁用输入。历史的"X 前"以打开历史的时刻为准 |
| `chat/ChatHistory.tsx` | ✅ | 面板内历史列表：标题、首条消息的关联上下文、"X 前"；当前会话 `aria-current`；点击切换，单条删除；空状态"还没有历史对话。" |
| `chat/ContextSummary.tsx` | ✅ | `<details>` 默认折叠为"当前 · 标题"，展开显示完整标题与说明 |
| `chat/MessageList.tsx` | ✅ | 用户消息显示"关联：…"；回复中 `role="status"`；失败 `role="alert"` + 重试；变化时滚到底部 |
| `chat/ChatComposer.tsx` | ✅ | 受控组件（`value`、`onChange`、`onSubmit`、`disabled`），`id="chat-input"`；Enter 发送、Shift+Enter 换行、输入法组合中（`isComposing` 或 keyCode 229）不发、空白或禁用不发；每次变化用 `composerHeight` 重算高度 |
| `chat/Chat.module.css` | ✅ | 助手面板全部样式；桌面固定右侧、标题栏高 `--header-height` 与页眉底线对齐；≤950 从页眉下方开始的覆盖面板（方案 A） |

## 5. 调用链

1. **启动**：`main` → `AppShell` → `useTheme`（主题）、`useVisitTracker`（访问时间）、`useAutoRefresh`（是否后台更新）。
2. **首页**：`FeedPage` → `useFeed` → `useApi().getFeed` → `HeadlineCarousel`（头版）+ `ContentTypeTabs` + `ArticleList` → `ArticleCard[]`（每张用 `badgeFor` 算标记）+ `ActivityTeaser`。
3. **自动更新**：`AppShell` → `useAutoRefresh` → 信息流加载后 `needsRefresh`（本会话一次）→ `useStartRefresh` → `api.startRefresh` → `refreshStore.beginRun` → `useRefreshRun` 每秒轮询 `api.getRefreshStatus` → 结束 → `refreshStore.completeRun` → 页眉 `RefreshStatus` 显示新时间；`FeedPage` 的 `NewContentBanner` 显示待显示条数 → 点击 → `clearPending` + 使 `queryKeys.feed` 失效 → 列表重新获取。
4. **读文章**：`ArticleCard` 标题 → 路由 `/article/:id` → `ArticlePage` → `useArticle` + `AnalysisSection`（`useArticleAnalysis`）→ 设置阅读上下文 + `markClusterSeen`；返回 → `navigate(-1)` → `FeedPage` 的 `useScrollMemory` 在 POP 时恢复滚动。
5. **收藏**：`ArticleCard` ◇ → `ArticleList` → `useSaveToggle.toggleSaved` → `useToggleSaved`（乐观更新收藏列表）→ `api.setSaved` → 成功提示 / 失败回滚 + 提示 → 重新获取收藏列表。
   **深聊**：`ArticleCard` "与 sig 深聊" → `ArticleList.discuss` → 进入 `/article/:id` + `useOpenChat`（显示助手、聚焦输入框）+ 提示。
6. **聊天**：`ChatComposer` → `chatSessionStore.sendMessage`（无会话则创建；冻结 `sessionId` + `ContextRef`）→ `api.sendChat` → 回复写回冻结的会话 → `MessageList` 显示；失败显示重试。
   **历史**：`ChatHistory` → `switchSession(id)`（刷新 `lastActiveAt`）/ `deleteSession(id)`；`startNewSession()` 只清空当前视图，发出首条消息后才入列，超过 10 个时淘汰 `lastActiveAt` 最早的非当前会话。
7. **助手显隐**：`ChatToggle` → `uiStore.toggleChat` → 桌面释放中栏宽度；窄屏从页眉下方覆盖 + 遮罩；关闭后焦点回到开关；草稿与消息保留。
8. **活动**：`EventSearchForm` 编辑 → `uiStore.updateActivityDraft` → 提交 → `validateFilters`（有错误就显示并停止）→ `toQuery` → `uiStore.submitActivityQuery` → `useEventSearch` → `api.searchEvents` → `EventResults`（阶段 1 返回"尚未接入"，只显示分类示例）。

## 6. 测试

| 层 | 工具 | 位置 |
|---|---|---|
| 纯函数、hook、store | Vitest | `src/**/xxx.test.ts` |
| 组件 | Vitest + React Testing Library + user-event | `src/**/Xxx.test.tsx` |
| 端到端、多尺寸、截图 | Playwright | `e2e/*.spec.ts` |

已有测试（状态：⬜ 未运行 ／ ✅ 通过 ／ ❌ 失败）：

| 编号 | 文件 | 场景 | 期望 | 状态 |
|---|---|---|---|---|
| F1 | `src/app/AppShell.test.tsx`（1b 由 `App.test.tsx` 迁移） | 在 `/` 渲染应用外壳；桌面默认显示助手、窄屏默认隐藏 | 有品牌链接、导航与内容区；显隐正确 | ✅ 2026-09-29 |
| F2 | `e2e/smoke.spec.ts` | Chromium 打开开发服务器首页 | 页面标题含 SIG，品牌链接"SIG 首页"可见（1b 起品牌不再是标题） | ✅ 2026-09-29 |

### 阶段 1 测试清单（2026-09-29 确认）

分批：1a = lib / services / state；1b = 样式、AppShell、Header、Sidebar、Chat；1c = Feed、轮播、详情、稍后阅读、活动；1d = Playwright。

**纯函数 L（1a）**

| 编号 | 场景 → 期望 | 状态 |
|---|---|---|
| L1 | `losAngelesParts`：UTC 2026-01-15 07:30 → LA 01-14 23:30（PST） | ✅ 2026-09-29 |
| L2 | `losAngelesParts`：UTC 2026-07-15 07:30 → LA 07-15 00:30（PDT） | ✅ 2026-09-29 |
| L3 | `themeForTime`：05:59 深、06:00 浅、17:59 浅、18:00 深 | ✅ 2026-09-29 |
| L4 | `themeForTime`：2026-03-08、2026-11-01 夏令时切换日 06:00 仍为浅色 | ✅ 2026-09-29 |
| L5 | `dailyEncouragement`：同一 LA 日期（含跨 UTC 午夜）同一句；次日换句 | ✅ 2026-09-29 |
| L6 | `needsRefresh`：null → true | ✅ 2026-09-29 |
| L7 | `needsRefresh`：7h59m → false；8h → true；9h → true | ✅ 2026-09-29 |
| L8 | `needsRefresh`：lastRunAt 在未来 → false | ✅ 2026-09-29 |
| L9 | `isWithin24h`：23h59m 前、恰 24h 前 → true；24h+1ms → false；未来 ≤5 分钟 → true；更远未来 → false | ✅ 2026-09-29 |
| L10 | `formatUpdatedAgo`：<1 分钟"刚刚"；5 分钟；60 分钟"1 小时前"；满 24h"1 天前"；null"尚未更新" | ✅ 2026-09-29 |
| L11 | `badgeFor`：首次收录晚于上次访问 → 新 | ✅ 2026-09-29 |
| L12 | `badgeFor`：首次访问（无上次访问时间）→ 无标记 | ✅ 2026-09-29 |
| L13 | `badgeFor`：看过的事件后来有新进展 → 更新 | ✅ 2026-09-29 |
| L14 | `badgeFor`：看过且无新进展 → 无标记 | ✅ 2026-09-29 |
| L15 | `pickHeadlines`：每领域最高分一条，按七领域顺序 | ✅ 2026-09-29 |
| L16 | `pickHeadlines`：缺失领域跳过，不补内容 | ✅ 2026-09-29 |
| L17 | `pickHeadlines`：同分取发布更晚者 | ✅ 2026-09-29 |
| L18 | `pickHeadlines`：只从 24h 内新闻中选；空输入 → [] | ✅ 2026-09-29 |
| L19 | `defaultFilters`：2026-09-29 → LA、60、09-29 至 10-29、预算空 | ✅ 2026-09-29 |
| L20 | `defaultFilters`：01-31 → 02-28；2028-01-31 → 02-29；12-15 → 次年 01-15 | ✅ 2026-09-29 |
| L21 | `validateFilters`：地点空、范围 0/负/小数/>500、预算负、结束早于开始 → 各自报错；预算空、0、同一天 → 通过 | ✅ 2026-09-29 |
| L22 | `toQuery`：预算空 → null；0 → 0；数字字符串转数字 | ✅ 2026-09-29 |
| L23 | `composerHeight`：20→26；100→100；144→144 不滚动；200→144 且滚动 | ✅ 2026-09-29 |
| L24 | `bootTheme`：三种模式 × 边界与夏令时时间点均与 `resolveTheme` 一致并写入 `data-theme`；存储缺失 / 损坏 / 抛错按自动；源码自包含可内联 | ✅ 2026-09-29 |

**数据层与状态 S（1a）**

| 编号 | 场景 → 期望 | 状态 |
|---|---|---|
| S1 | `getFeed`：新闻、名人动态都在 24h 内；全部标演示；头版来自 `pickHeadlines` | ✅ 2026-09-29 |
| S2 | `setSaved`/`listSaved`：收藏、取消正确；模拟失败抛错且状态不变 | ✅ 2026-09-29 |
| S3 | `startRefresh`/`getRefreshStatus`：running → succeeded（新增条数、更新时间刷新）；模拟失败 → failed 带原因 | ✅ 2026-09-29 |
| S4 | `searchEvents`：返回 not_connected，无任何活动 | ✅ 2026-09-29 |
| S5 | `sendChat`：回复带上下文且标演示；模拟失败抛错 | ✅ 2026-09-29 |
| S6 | `getArticle`/`getArticleAnalysis`：未知 ID → 未找到错误 | ✅ 2026-09-29 |
| S7 | `sendMessage`：空白不发送 | ✅ 2026-09-29 |
| S8 | `sendMessage`：回复未返回时切换文章 → 回复关联原文章 | ✅ 2026-09-29 |
| S9 | `sendMessage`：状态 idle → replying → idle；失败后重试用原文字与上下文，不重复用户消息 | ✅ 2026-09-29 |
| S10 | `sendMessage`：回复进行中再次提交被忽略 | ✅ 2026-09-29 |
| S11 | 会话：首条消息时才创建；`startNewSession` 不产生空会话 | ✅ 2026-09-29 |
| S12 | 会话：第 11 个会话入列时淘汰 `lastActiveAt` 最早者 | ✅ 2026-09-29 |
| S13 | 会话：切回旧会话后其 `lastActiveAt` 更新、排到最前 | ✅ 2026-09-29 |
| S14 | 会话：当前会话不被淘汰 | ✅ 2026-09-29 |
| S15 | 会话：切换后消息与上下文正确恢复；删除会话正确 | ✅ 2026-09-29 |
| S16 | 会话：A 发出后切到 B，A 的回复写回 A、不出现在 B | ✅ 2026-09-29 |
| S17 | 会话：刷新（重新加载 store）后会话仍在；新对话不影响主题等偏好 | ✅ 2026-09-29 |
| S18 | `uiStore` 持久化：localStorage 抛错时用默认值照常运行 | ✅ 2026-09-29 |
| S19 | `toastStore`：显示、撤销回调、6.5 秒自动消失 | ✅ 2026-09-29 |

**Hook H（1a–1c）**

| 编号 | 场景 → 期望 | 状态 |
|---|---|---|
| H1 | `useCarousel`：每 8 秒前进，末条后回到首条 | ✅ 2026-09-30 |
| H2 | `useCarousel`：悬停、焦点在内、标签页隐藏、减少动态效果时不前进 | ✅ 2026-09-30 |
| H3 | `useCarousel`：手动切换后暂停；播放恢复 | ✅ 2026-09-30 |
| H4 | `useCarousel`：0 条不启动计时器；1 条不前进 | ✅ 2026-09-30 |
| H5 | `useTheme`：自动模式 05:59 深色，走到 06:00 后一分钟内变浅色；手动优先；写入 `data-theme` | ✅ 2026-09-29 |
| H6 | `useAutoRefresh`：9h 前 → 只发起一次（StrictMode 下也不重复）；1h 前 → 不发起 | ✅ 2026-09-30 |
| H7 | `useVisitTracker`：存量访问时间成为上次访问时间，再写入本次；首次为空 | ✅ 2026-09-29 |
| H8 | `useScrollMemory`：离开记录、返回恢复 | ✅ 2026-09-30 |
| H9 | `useToggleSaved`：立即显示已收藏；失败回滚并提示 | ✅ 2026-09-30 |

**组件 C（1b–1c）**

| 编号 | 场景 → 期望 | 状态 |
|---|---|---|
| C1 | Header：品牌、鼓励句；无"每日一句"；开关 `aria-expanded` 与面板一致 | ✅ 2026-09-29 |
| C2 | 品牌：在 `/domain/AI?type=精选文章` 点击 → `/`，类型为新闻 | ✅ 2026-09-29 |
| C3 | ThemeToggle：三选项 `aria-pressed` 正确；点"深"切深色 | ✅ 2026-09-29 |
| C4 | RefreshStatus：空闲 / 更新中（按钮禁用）/ 失败可重试 | ✅ 2026-09-29 |
| C5 | SidebarNav：MY EDITION、DOMAINS、七领域；`aria-current` 高亮；无"你的关注" | ✅ 2026-09-29 |
| C6 | StatusView：加载 / 空 / 失败，重试调用回调 | ✅ 2026-09-29 |
| C7 | ChatComposer：Enter 发送；Shift+Enter 换行；输入法组合中不发；空白禁发；发送后清空并缩回 | ✅ 2026-09-29 |
| C8 | MessageList：用户消息显示"关联：…"；回复中提示；失败有重试 | ✅ 2026-09-29 |
| C9 | ContextSummary：默认折叠，展开显示完整标题 | ✅ 2026-09-29 |
| C10 | ArticleCard：字段齐全；外链 `target=_blank` + `rel=noopener noreferrer`；新/更新标记；收藏无障碍名称随状态变 | ✅ 2026-09-30 |
| C11 | HeadlineCarousel：条数、标签、"01 / 0N"；非当前幻灯片不可聚焦 | ✅ 2026-09-30 |
| C12 | EventSearchForm：默认值；日期反向报错不提交；改正后提交；放大镜名称"搜索活动" | ✅ 2026-09-30 |
| C13 | EventResults：not_connected 显示说明，无伪造活动 | ✅ 2026-09-30 |
| C14 | NewContentBanner：显示 N；点击前列表不变，点击后刷新 | ✅ 2026-09-30 |
| C15 | ChatHistory：按 `lastActiveAt` 倒序列出标题、关联文章、"X 前"；点击切换；单条删除；空状态 | ✅ 2026-09-29 |
| C16 | ChatPanel 标题栏：有"历史""新对话"，无"重置"，无显隐开关 | ✅ 2026-09-29 |

**页面集成 P（1c）**

| 编号 | 场景 → 期望 | 状态 |
|---|---|---|
| P1 | 首页：轮播、新闻列表、活动入口；头版条数 = 有内容的领域数 | ✅ 2026-09-30 |
| P2 | 切"精选文章" → `?type=精选文章`，轮播隐藏 | ✅ 2026-09-30 |
| P3 | `/domain/AI` 只显示 AI；无内容领域显示空状态 | ✅ 2026-09-30 |
| P4 | 详情：重点摘要；分析先加载后显示，失败可重试；聊天上下文为本文；返回恢复列表与滚动 | ✅ 2026-09-30 |
| P5 | 稍后阅读：空状态；收藏后出现；超过 24h 仍显示 | ✅ 2026-09-30 |
| P6 | 活动：默认值、分类切换、提交后显示尚未接入 | ✅ 2026-09-30 |
| P7 | 未知网址 → 404 | ✅ 2026-09-30 |
| P8 | "与 sig 深聊" → 打开详情、展开助手、焦点进入输入框 | ✅ 2026-09-30 |

**端到端 V（1d）**：尺寸 1440×900、1920×1080、1024×768、768×1024、390×844。

| 编号 | 场景 → 期望 | 状态 |
|---|---|---|
| V1 | 桌面三尺寸：页眉底线与聊天标题栏底线误差 ≤1px | ⬜ |
| V2 | 所有尺寸与页面无横向溢出 | ⬜ |
| V3 | 窄屏：助手打开时页眉开关可见可点；遮罩 / Esc 关闭；焦点回到开关 | ⬜ |
| V4 | 桌面：收起助手后中栏变宽、轮播对齐；展开后草稿仍在 | ⬜ |
| V5 | 桌面：滚动中栏时页眉与左栏不动 | ⬜ |
| V6 | 输入框长到 144px 后内部滚动，发送后缩回 | ⬜ |
| V7 | 390 宽：横排导航含稍后阅读、近期活动 | ⬜ |
| V8 | 固定 LA 10:00 → 浅色；20:00 → 深色 | ⬜ |
| V9 | 减少动态效果：9 秒内轮播不自动切换 | ⬜ |
| V10 | 各尺寸 × 浅/深，新版与原型截图并存，供人工对比（不判定） | ⬜ |
| V11 | 各页面无控制台错误 | ⬜ |
| V12 | 刷新页面后对话历史仍在，可从历史切回 | ⬜ |
| V13 | 屏蔽应用脚本后，仅靠 `<head>` 内联脚本即设置正确主题（夜间自动 → 深；已存浅色 → 浅）（`e2e/themeBoot.spec.ts`，1b 修复首屏闪烁时提前完成） | ✅ 2026-09-29 |

## 7. 常用命令

```bash
pnpm dev                                # 开发服务器 http://127.0.0.1:5173
pnpm test                               # 单元 + 组件测试
pnpm exec playwright install chromium   # 首次运行 e2e 前安装浏览器
pnpm test:e2e                           # 端到端测试
pnpm build                              # 类型检查 + 打包
pnpm lint                               # oxlint 检查
```

## 8. 总结

前端以"分层 + 数据层可替换"为骨架：`lib` 纯函数承载规则（时间、新鲜度、标记、头版），`services` 隔离数据来源，`state` 管界面状态，`features` 组合成页面。阶段 1 用标注清楚的演示数据还原已认可的设计与交互；阶段 2 起只替换 `services` 的实现即可接入真实后端。

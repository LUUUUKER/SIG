# SIG 前端设计文档

> 维护规则：前端任何文件的新增、删除、改名，以及调用链、状态、已定规则的变化，都要**在同一次改动里**更新本文件。状态列必须如实标注：✅ 已实现 ／ 📝 计划中。
>
> 最近更新：2026-09-29 · 阶段 0（骨架）完成，F1、F2 通过；阶段 1 尚未开始。

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
├─ vite.config.ts            Vite 与 Vitest 配置；开发时 /api 代理到 127.0.0.1:8000
├─ playwright.config.ts      端到端测试配置，自动启动开发服务器
├─ e2e/                      Playwright 测试
├─ public/favicon.svg        SIG 图标
└─ src/
   ├─ main.tsx               入口
   ├─ App.tsx                阶段 0 占位根组件（阶段 1 由 AppShell 取代）
   ├─ test/setup.ts          Vitest 全局准备
   ├─ app/                   组装层：布局、路由、全局 hook
   ├─ styles/                设计 token 与全局样式
   ├─ lib/                   纯函数
   ├─ services/              数据类型、API 接口与 mock 实现、Query 钩子
   ├─ state/                 Zustand 界面状态
   ├─ components/            通用组件
   └─ features/              feed / articles / saved / events / chat
```

## 4. 文件职责

### 4.1 入口与组装 `app/`

| 文件 | 状态 | 职责 |
|---|---|---|
| `main.tsx` | ✅（阶段 1 扩展） | 挂载根组件；阶段 1 加上 QueryClientProvider、RouterProvider 与全局样式 |
| `App.tsx` | ✅ 临时 | 阶段 0 占位，显示 SIG；阶段 1 删除 |
| `test/setup.ts` | ✅ | 注册 jest-dom 断言；每个测试后清理 |
| `app/router.tsx` | 📝 | 路由：`/`、`/domain/:domain`、`/article/:id`、`/saved`、`/events`、404；内容类型用 `?type=` |
| `app/AppShell.tsx` + `.module.css` | 📝 | 三栏布局：Header + SidebarNav + 中间内容区（独立滚动）+ ChatPanel；窄屏遮罩；Esc 关闭助手 |
| `app/useTheme.ts` | 📝 | 按 `themeMode` 算出实际主题（自动模式用 `themeForTime`，每分钟重算），写入 `<html data-theme>` |
| `app/useAutoRefresh.ts` | 📝 | 应用启动时调用一次：`needsRefresh(lastRunAt, now, 8h)` 为真则开始后台更新 |
| `app/useVisitTracker.ts` | 📝 | 启动时把上次访问时间存为 `previousVisitAt`（「新」标记基准），再写入本次时间 |

### 4.2 样式 `styles/`

| 文件 | 状态 | 职责 |
|---|---|---|
| `tokens.css` | 📝 | `[data-theme="light"]` / `[data-theme="dark"]` 两套颜色与材质变量（取原型最终生效的早报/晚报值）；页眉高度、左栏宽、助手宽等布局变量，按断点分档 |
| `base.css` | 📝 | reset、背景细网格、焦点样式、减少动态效果、滚动条 |

### 4.3 纯函数 `lib/`

| 文件 | 函数 | 状态 | 作用 |
|---|---|---|---|
| `laTime.ts` | `losAngelesParts(now)` | 📝 | 当前时刻换算为洛杉矶的年月日时分 |
| | `themeForTime(now)` | 📝 | 洛杉矶 06:00–18:00 返回 `light`，其余 `dark` |
| | `dailyEncouragement(now)` | 📝 | 同一洛杉矶日期返回同一句鼓励语 |
| `freshness.ts` | `needsRefresh(lastRunAt, now, hours)` | 📝 | 是否需要更新；从未更新过（null）也返回 true |
| | `isWithin24h(publishedAt, now)` | 📝 | 是否在最近 24 小时内；未来时间戳视为异常 |
| | `formatUpdatedAgo(lastRunAt, now)` | 📝 | "更新于 X 分钟前 / X 小时前" |
| `badges.ts` | `badgeFor(item, previousVisitAt, seenClusters)` | 📝 | 返回「新」「更新」或无 |
| `headlines.ts` | `pickHeadlines(items, domains)` | 📝 | 每领域取分数最高的一条；缺失领域跳过 |
| `domains.ts` | `DOMAINS`、`CONTENT_TYPES` | 📝 | 七领域（含图标符号）与三种内容类型 |

### 4.4 数据层 `services/`

| 文件 | 状态 | 职责 |
|---|---|---|
| `types.ts` | 📝 | `Article`（领域、类型、标题、摘要、重点、发布时间、首次收录时间、事件 ID、最新进展时间、来源、阅读时长、是否演示）、`Source`、`Feed`（上次更新时间、文章、头版）、`RefreshRun`（running / succeeded / failed、新增条数）、`EventQuery`、`EventSearchResult`、`ChatMessage`、`ContextRef` |
| `api.ts` | 📝 | `SigApi` 接口：`getFeed`、`getArticle`、`getArticleAnalysis`（打开详情才生成，省 AI 费用）、`listSaved`、`setSaved`、`startRefresh`、`getRefreshStatus`、`searchEvents`、`sendChat`；导出当前实现 |
| `mockData.ts` | 📝 | 演示数据；时间戳按"当前时刻往前推"生成，每条标注演示 |
| `mockApi.ts` | 📝 | 内存实现 `SigApi`；模拟延迟；`configureMock({ failNext })` 供测试模拟失败 |
| `queries.ts` | 📝 | TanStack Query 钩子：`useFeed`、`useArticle`、`useArticleAnalysis`、`useSaved`、`useToggleSaved`（先改界面，失败回滚）、`useRefresh`（发起并轮询）、`useEventSearch` |

### 4.5 界面状态 `state/`

| 文件 | 状态 | 内容 |
|---|---|---|
| `uiStore.ts` | 📝 | `themeMode`、`chatOpen`、`readingContext`、`previousVisitAt`、`seenClusterIds`、活动表单 `draftFilters` / `submittedFilters` / `category` |
| `chatStore.ts` | 📝 | `draft`、`messages`、`status`；`sendMessage`（发送时冻结上下文）、`retry`、`reset`（只清对话，不动偏好） |
| `toastStore.ts` | 📝 | 提示队列：`showToast(message, undo?)` |

持久化（阶段 1）：`themeMode`、访问时间、看过的事件存 localStorage，读写包 try/catch，读不到时按默认值运行。阶段 2 起偏好类数据移到后端。

### 4.6 通用组件 `components/`

| 文件 | 状态 | 职责 |
|---|---|---|
| `Header/Header.tsx` | 📝 | SIG（回首页并重置为新闻）｜每日鼓励句 … RefreshStatus、ThemeToggle、头像、ChatToggle |
| `Header/ThemeToggle.tsx` | 📝 | 浅 / 深 / 自动，内凹三段切换 |
| `Header/RefreshStatus.tsx` | 📝 | "更新于 X 前" / "更新中…" / "更新失败 · 重试"，刷新图标按钮 |
| `Header/ChatToggle.tsx` | 📝 | 唯一助手开关；`aria-expanded` 与实际可见性一致 |
| `Sidebar/SidebarNav.tsx` | 📝 | MY EDITION + DOMAINS（上方分割线）；窄屏横排，个人入口在前、竖线后接领域 |
| `StatusView.tsx` | 📝 | 通用加载 / 空 / 失败 + 重试 |
| `ToastHost.tsx` | 📝 | 显示提示条，可带"撤销" |
| `icons/` | 📝 | 放大镜、侧栏、刷新三个线性 SVG |

### 4.7 页面与业务 `features/`

| 文件 | 状态 | 职责 |
|---|---|---|
| `feed/FeedPage.tsx` | 📝 | 首页与领域页共用；读 `?type`；首页 + 新闻时显示头版轮播；列表；首页底部活动入口 |
| `feed/NewContentBanner.tsx` | 📝 | "有 N 条新内容"，点击才刷新列表 |
| `feed/HeadlineCarousel.tsx` | 📝 | 头版大卡片、领域标签、计数、前后切换、暂停 |
| `feed/useCarousel.ts` | 📝 | 8 秒切换；悬停 / 键盘焦点 / 标签页隐藏 / 减少动态效果时不切换；手动或触摸后暂停；宽度变化时重新对齐（ResizeObserver） |
| `feed/ContentTypeTabs.tsx` | 📝 | 新闻 / 精选文章 / 名人动态 |
| `feed/ArticleCard.tsx` | 📝 | 领域、类型、时长、「新」「更新」、标题、摘要、来源外链、收藏、与 sig 深聊 |
| `feed/ActivityTeaser.tsx` | 📝 | 首页活动入口；地点与范围取自活动表单状态（不写死 LA） |
| `feed/useScrollMemory.ts` | 📝 | 记住并恢复中间内容区滚动位置（React Router 自带的滚动恢复管不到内部滚动容器） |
| `articles/ArticlePage.tsx` | 📝 | 重点摘要、AI 分析（进入后加载，含加载与失败状态）、来源、返回；设置阅读上下文；记为已看 |
| `saved/SavedPage.tsx` | 📝 | 收藏列表（不受 24h 限制）；空状态 |
| `events/EventPage.tsx` | 📝 | 组合表单、分类、结果 |
| `events/EventSearchForm.tsx` | 📝 | 地点、范围、开始、结束、预算 + 放大镜提交 |
| `events/EventCategoryTabs.tsx` | 📝 | 全部 / 演出 / 比赛 / 社交活动 / 展览与放映 |
| `events/EventResults.tsx` | 📝 | 尚未接入 / 加载 / 无结果 / 失败 / 结果 |
| `events/eventFilters.ts` | 📝 | `defaultFilters(now)`（LA、60 miles、一个日历月，月末截断）、`validateFilters(draft)`、`toQuery(filters)` |
| `chat/ChatPanel.tsx` | 📝 | 标题栏（头像、sig · 阅读伙伴、重置）、上下文、消息、快捷问题、输入框、演示说明 |
| `chat/ContextSummary.tsx` | 📝 | 当前阅读上下文，默认折叠 |
| `chat/MessageList.tsx` | 📝 | 每条消息显示关联上下文；回复中 / 失败 · 重试 |
| `chat/ChatComposer.tsx` | 📝 | Enter 发送、Shift+Enter 换行、输入法组合中不发、空白不发 |
| `chat/composerHeight.ts` | 📝 | `composerHeight(scrollHeight)`：限制在 26–144px，并判断是否内部滚动 |

## 5. 调用链

1. **启动**：`main` → `AppShell` → `useTheme`（主题）、`useVisitTracker`（访问时间）、`useAutoRefresh`（是否后台更新）。
2. **首页**：`FeedPage` → `useFeed` → `api.getFeed` → `HeadlineCarousel`（头版）+ `ContentTypeTabs` + `ArticleCard[]`（每张用 `badgeFor` 算标记）+ `ActivityTeaser`。
3. **自动更新**：`useAutoRefresh` → `needsRefresh` → `useRefresh` → `api.startRefresh` → 轮询 `api.getRefreshStatus` → 完成 → `RefreshStatus` 显示新时间、`NewContentBanner` 显示新增条数 → 点击后使 `useFeed` 重新获取。
4. **读文章**：`ArticleCard` 标题 → 路由 `/article/:id` → `ArticlePage` → `useArticle` + `useArticleAnalysis` → 设置阅读上下文 + 记为已看；返回 → `navigate(-1)` → `useScrollMemory` 恢复滚动。
5. **收藏**：`ArticleCard` ◇ → `useToggleSaved` → 乐观更新 → `api.setSaved` → 失败回滚 + 提示。
6. **聊天**：`ChatComposer` → `chatStore.sendMessage`（冻结当前 `ContextRef`）→ `api.sendChat` → `MessageList` 显示回复；失败显示重试。
7. **助手显隐**：`ChatToggle` → `uiStore.toggleChat` → 桌面释放中栏宽度；窄屏从页眉下方覆盖 + 遮罩；关闭后焦点回到开关；草稿与消息保留。
8. **活动**：`EventSearchForm` 编辑 `draftFilters` → 提交 → `validateFilters` → `submittedFilters` → `useEventSearch` → `api.searchEvents` → `EventResults`（阶段 1 返回"尚未接入"）。

## 6. 测试

| 层 | 工具 | 位置 |
|---|---|---|
| 纯函数、hook、store | Vitest | `src/**/xxx.test.ts` |
| 组件 | Vitest + React Testing Library + user-event | `src/**/Xxx.test.tsx` |
| 端到端、多尺寸、截图 | Playwright | `e2e/*.spec.ts` |

已有测试（状态：⬜ 未运行 ／ ✅ 通过 ／ ❌ 失败）：

| 编号 | 文件 | 场景 | 期望 | 状态 |
|---|---|---|---|---|
| F1 | `src/App.test.tsx` | 在 jsdom 中渲染根组件 | 不报错，有标题 SIG | ✅ 2026-09-29 |
| F2 | `e2e/smoke.spec.ts` | Chromium 打开开发服务器首页 | 页面标题含 SIG，品牌可见 | ✅ 2026-09-29 |

阶段 1 验收尺寸：1440×900、1920×1080、1024×768、768×1024、390×844。

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

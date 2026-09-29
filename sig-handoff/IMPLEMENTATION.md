# 实施建议（未定案）

## 概览

当前交付为静态 HTML、CSS、原生 JS。以下用于讨论后续工程实现，不是已选定的技术架构、API 合约或开发授权。

## 技术路线候选

| 路线 | 优点 | 代价 |
| --- | --- | --- |
| React + FastAPI + PostgreSQL（优先讨论） | 符合用户技术栈，前端与采集/AI任务职责清楚 | 两端项目与部署需要协调 |
| 全栈 JavaScript 方案 | 单语言、前后端类型复用方便 | 用户需决定具体框架及后台任务运行方式 |
| 继续静态原型 | 最快验证 UI | 不足以可靠实现私有密钥、持久化、定时任务 |

框架版本、模型、搜索供应商、托管服务和费用均待确认，本包没有做最新供应商选型研究。

## 建议文件职责

```text
frontend/src/
  app/AppShell                 页眉、导航、助手显隐、响应式布局
  components/Header           版本切换与每日句
  features/feed/FeedPage       列表/领域/内容类型
  features/feed/HeadlineCarousel  轮播与暂停逻辑
  features/articles/ArticlePage   摘要/分析/引用
  features/saved/SavedPage     稍后阅读
  features/events/EventPage    表单与搜索结果状态
  features/chat/ChatPanel      消息、输入、上下文
  state/                      临时视图状态与偏好分离
  services/                   统一调用后端，错误与取消
  styles/tokens               主题与材质变量
backend/
  api/                        请求校验与鉴权边界
  services/curation            来源选择、归并、筛选
  services/editions            早晚报快照与已投递去重
  services/chat               上下文与模型调用
  services/events             活动搜索与地理/时间过滤
  jobs/                       采集、生成、投递的可重试任务
  repositories/               收藏、偏好、报刊与会话存储
```

这是逻辑目录，扩展名和具体库在方案确认后确定。

## 关键调用链建议

1. 阅读：FeedPage → getEdition(editionId, filters) → editions service → 已生成的报刊快照 → cards；ArticlePage → getArticle(id) → 正文摘要与来源。
2. 对话：ChatPanel → sendMessage(text, contextRef) → 服务端校验 → 获取关联文章/来源 → 模型 → 流式事件 → 消息状态更新。
3. 活动：EventPage → validateFilters → searchEvents(filters) → 地点解析 → 供应商检索 → 日期/距离/预算过滤 → 有来源的活动结果。
4. 收藏：toggleSaved(id) → 保存接口 → 用户收藏记录 → 成功确认；失败回滚。
5. 定时：按 America/Los_Angeles 触发 → 数据采集/核实 → 事件去重 → 构建报刊 → 原子发布 → 渠道投递 → 记录投递结果。建议报刊键使用用户+洛杉矶日期+早晚版本实现幂等；不要用固定 UTC 偏移替代时区。

需要讨论生成提前量与投递截止时间，以保证9点可读；采集失败时不能发布伪完整报刊。

## 建议数据对象

| 对象 | 最小字段方向 |
| --- | --- |
| Article | id、domain、type、title、summary、keyPoints、analysis、publishedAt、sources、eventClusterId |
| Source | url、publisher、title、publishedAt、retrievedAt、支持的摘要/分析段落 |
| Edition | id、localDate、timezone、morning/evening、status、articleIds、headlineIds、publishedAt |
| Event | id、title、category、startAt/endAt、timezone、venue、coordinates、priceRange/currency、ticketStatus、sourceUrl、verifiedAt |
| EventQuery | location、radiusMiles、startAt/endAt、maxBudgetPerPerson、category |
| ChatMessage | id、role、content、contextRef、citations、status、createdAt |
| Preference | 长期领域与过滤规则、变更记录、撤销依据 |
| Delivery | editionId、channel、status、attemptCount、deliveredAt、idempotencyKey |

真正的表结构、接口请求/响应与错误格式应在选型后补充；不要把原型 stories 数组直接视为生产 Schema。

## 开发顺序建议

阶段1：组件化还原已认可视觉与交互，仍用明确标注的假数据。
阶段2：文章/收藏/偏好持久化与可追溯来源，打通真实阅读链路。
阶段3：sig 对话与引用，受控的临时/长期偏好变更。
阶段4：真实活动搜索与核实。
阶段5：采集、早晚报去重、时区调度、选定渠道投递。

每阶段先提交文件/函数/调用链与测试方案，获授权后实现；用户 review 后再按约定运行测试。

## 总结

从稳定 UI 到真实数据，再到 AI 与自动分发。不要在一轮中把所有未定问题当作默认答案。

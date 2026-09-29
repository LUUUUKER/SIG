# SIG 项目说明

## 概览

SIG 是个人使用的 AI 新闻与活动阅读空间，助手名为 sig。设计基线与原始交接文档在 `sig-handoff/`（`prototype/index.html` 为唯一视觉基线）。本文件记录项目结构、已确认决策和协作规则；后续用户明确指令优先。

## 目录

| 路径 | 内容 |
|---|---|
| `sig-handoff/` | 设计交接包（只读参考；其中早晚报相关内容已被下方决策取代） |
| `frontend/` | React + TS + Vite；设计文档见 `frontend/FRONTEND.md` |
| `backend/` | FastAPI + SQLAlchemy + PostgreSQL（uv 管理依赖）；设计与测试清单见 `backend/BACKEND.md` |
| `docker-compose.yml` | 本地 db（Postgres 16 + pgvector）与 backend |

## 已确认决策（2026-09-29）

- 网页应用；本地部署；暂不做登录；推送只做站内。
- **取消早晚报**，改为滚动 24h 信息流：打开网页时距上次更新超过 8h 自动更新（以后服务器每 8h 定时）；久未打开只抓最近 24h；新闻与名人动态限最近 24h，精选文章例外但不重复。
- 同一事件聚类；看过的事件有重大新进展标「更新」，上次访问后的新内容标「新」。
- 列表摘要在更新时批量生成；深度分析在打开详情时生成并缓存。
- 主题按洛杉矶时间自动（06:00–18:00 浅色），页眉可切 浅 / 深 / 自动。
- LLM 暂用 OpenAI，经 `LLMProvider` 适配层调用；每次调用记录 token 用量，上线前测算月成本并比价。
- 窄屏助手面板从页眉下方开始，页眉开关始终可达。
- 技术栈：React + Vite + TypeScript、React Router、TanStack Query、Zustand、CSS 变量 + CSS Modules；FastAPI、SQLAlchemy 2、Alembic、PostgreSQL + pgvector、APScheduler；Docker Compose；Vitest、RTL、Playwright、pytest。

## 协作规则

- 中文沟通，代码与专有名词用英文。
- 流程：讨论方案 → 文件职责、函数、调用链 → 测试设计 → 用户明确说"开始写代码"才实现 → 用户 review → 用户同意后才运行测试。测试失败先定位原因并说明方案，获许可再改。
- 每个文件开头写中英双语概览；每个函数写输入、输出、功能、步骤，步骤在代码旁标注。
- 变量名贴近真实含义。不擅自扩大范围或重构。
- **前端有任何结构、文件、状态、调用链变化，同步更新 `frontend/FRONTEND.md`；后端的文件、接口、调用链、数据表、测试变化，同步更新 `backend/BACKEND.md`（含测试运行状态）。**
- 不得把演示内容当真实新闻；不得宣称接入了未接入的服务；密钥只放后端 `.env`，不进 git。
- 不授权上线、付费、开通账户或执行真实推送。

## 常用命令

```bash
# 数据库 + 后端（Docker）
docker compose up -d --build
curl http://127.0.0.1:8000/api/health
docker compose down            # 不加 -v，保留数据卷

# 后端测试
cd backend && uv run pytest                                          # 单元测试
cd backend && set -a && source ../.env && set +a && uv run pytest -m integration   # 需要 db 在运行

# 前端
cd frontend && pnpm dev
cd frontend && pnpm test
cd frontend && pnpm test:e2e
```

## 总结

先对齐方案，再分阶段实现；阶段 0 为骨架，阶段 1 为前端界面还原（演示数据），之后依次接入后端数据、sig 对话、采集流水线与活动搜索。

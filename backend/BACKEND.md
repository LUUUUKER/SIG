# SIG 后端设计文档

> 维护规则：后端任何文件的新增、删除、改名，以及接口、调用链、数据表、测试的变化，都要**在同一次改动里**更新本文件。状态列如实标注：✅ 已实现 ／ 📝 计划中。测试状态标注：⬜ 未运行 ／ ✅ 通过 ／ ❌ 失败。
>
> 最近更新：2026-09-29 · 阶段 0（骨架）完成：B1–B5、I1–I2、E1–E4 全部通过。

## 1. 概览

后端负责所有数据与 AI 能力：内容采集与生成、收藏与偏好存储、sig 对话、活动搜索。前端只通过 `/api/*` 访问它；密钥只存在后端环境变量中。

| 项目 | 选择 |
|---|---|
| 语言 / 运行时 | Python 3.12（uv 管理依赖与虚拟环境） |
| Web 框架 | FastAPI（自动文档：`/docs`） |
| 数据库访问 | SQLAlchemy 2（同步）+ psycopg 3 驱动 |
| 数据库 | PostgreSQL 16 + pgvector（Docker 容器） |
| 配置 | pydantic-settings，从环境变量读取 |
| 迁移 | Alembic（阶段 2 引入） |
| 定时任务 | APScheduler（阶段 4 引入） |
| 测试 | pytest + httpx（FastAPI TestClient） |

## 2. 目录结构

```
backend/
├─ BACKEND.md               本文档
├─ Dockerfile               后端镜像构建步骤
├─ .dockerignore            不打进镜像的文件
├─ .python-version          固定 Python 3.12
├─ pyproject.toml           依赖与 pytest 配置
├─ uv.lock                  锁定的依赖版本
├─ app/
│  ├─ main.py               应用入口
│  ├─ core/config.py        配置
│  ├─ db/session.py         数据库连接
│  └─ api/health.py         健康检查接口
└─ tests/
   ├─ test_health.py        B1、B2
   ├─ test_config.py        B3、B4
   ├─ test_session.py       B5
   └─ integration/
      └─ test_database.py   I1、I2（需要真实数据库）
```

## 3. 文件职责

| 文件 | 状态 | 主要函数 / 对象 | 职责 |
|---|---|---|---|
| `app/main.py` | ✅ | `create_app()`、`app` | 创建 FastAPI 实例并注册路由；不连数据库。uvicorn 启动 `app.main:app` |
| `app/core/config.py` | ✅ | `Settings`、`get_settings()` | 从环境变量读 `DATABASE_URL`（必填）与 `DB_CONNECT_TIMEOUT_SECONDS`（默认 3）；缺必填项立即报错；全进程缓存一份 |
| `app/db/session.py` | ✅ | `make_engine()`、`get_engine()`、`check_db()` | 创建带连接超时的 Engine；全进程共用一个连接池；`check_db` 执行 `SELECT 1`，成功 True，失败 False，不抛异常 |
| `app/api/health.py` | ✅ | `HealthResponse`、`get_db_checker()`、`health()` | `GET /api/health`；数据库检查通过 `Depends` 注入，测试可替换 |

后续阶段计划（📝，细节到对应阶段再定）：`api/`（feed、articles、saved、refresh、events、chat 路由）、`services/`（curation、refresh、chat、events）、`llm/`（`LLMProvider` 适配层与用量记录）、`repositories/`、`models/`、`jobs/`、`alembic/`。

## 4. 接口

| 方法 | 路径 | 状态 | 返回 |
|---|---|---|---|
| GET | `/api/health` | ✅ | 200 `{"status":"ok","database":"ok"}`；数据库不可用 503 `{"status":"degraded","database":"unreachable"}` |

## 5. 调用链

**健康检查**：请求 `GET /api/health` → FastAPI 解析依赖 `get_db_checker()` → `get_engine()`（首次调用时 `get_settings()` 读环境变量并创建 Engine）→ 返回检查函数 → `health()` 调用它 → `check_db(engine)` 执行 `SELECT 1` → 根据结果返回 200 或 503。

**测试时**：`app.dependency_overrides[get_db_checker]` 替换为返回固定结果的假函数，整条链不接触数据库和环境变量。

## 6. 测试清单

运行方式：
- 单元测试（不需要数据库）：`cd backend && uv run pytest`
- 集成测试（需要 `docker compose up -d db`）：`cd backend && set -a && source ../.env && set +a && uv run pytest -m integration`
- 默认配置 `-m 'not integration'`，所以单元测试命令不会误跑集成测试。

### 6.1 单元测试

| 编号 | 文件 | 场景 | 期望 | 状态 |
|---|---|---|---|---|
| B1 | `tests/test_health.py` | 数据库检查被替换为"可用" | 200，`{"status":"ok","database":"ok"}` | ✅ 2026-09-29 |
| B2 | `tests/test_health.py` | 数据库检查被替换为"不可用" | 503，`{"status":"degraded","database":"unreachable"}` | ✅ 2026-09-29 |
| B3 | `tests/test_config.py` | 设置 `DATABASE_URL`，不设超时 | 读到该连接串；超时为默认 3 | ✅ 2026-09-29 |
| B4 | `tests/test_config.py` | 删除 `DATABASE_URL` | 创建 `Settings()` 抛 `ValidationError` | ✅ 2026-09-29 |
| B5 | `tests/test_session.py` | 连接 `127.0.0.1:1`（没有服务监听的端口），超时 1 秒 | `check_db` 返回 False，耗时 < 5 秒，不抛异常 | ✅ 2026-09-29 |

### 6.2 集成测试

| 编号 | 文件 | 场景 | 期望 | 状态 |
|---|---|---|---|---|
| I1 | `tests/integration/test_database.py` | 连接 Compose 中运行的数据库 | `check_db` 返回 True | ✅ 2026-09-29 |
| I2 | `tests/integration/test_database.py` | 执行 `CREATE EXTENSION IF NOT EXISTS vector` | 成功，`pg_extension` 中能查到 `vector` | ✅ 2026-09-29 |

未设置 `DATABASE_URL` 时，集成测试自动跳过并提示先加载 `.env`。

### 6.3 环境验收（手动执行）

| 编号 | 操作 | 期望 | 状态 |
|---|---|---|---|
| E1 | `docker compose up -d --build`，再 `docker compose ps` | db 为 healthy，backend 为 running | ✅ 2026-09-29 |
| E2 | `curl http://127.0.0.1:8000/api/health` | 返回 ok/ok | ✅ 2026-09-29 |
| E3 | `docker compose stop db` 后再请求 | 返回 503 degraded/unreachable；之后 `docker compose start db` 恢复 | ✅ 2026-09-29 |
| E4 | 写入一行测试数据 → `docker compose down`（不加 `-v`）→ `up -d` → 查询 | 数据仍在，证明数据卷生效 | ✅ 2026-09-29 |

### 6.4 已知提示

- 运行 pytest 时有一条 `StarletteDeprecationWarning`：Starlette 建议 TestClient 改用 `httpx2`。不影响结果；待 FastAPI 官方文档给出推荐做法后再处理。

## 7. 数据库与环境

| 项目 | 说明 |
|---|---|
| 容器 | Compose 服务 `db`，镜像 `pgvector/pgvector:pg16` |
| 数据 | Docker 数据卷 `sig_pgdata`（不在项目文件夹里；`docker volume ls` 查看；`docker compose down -v` 会删除） |
| 账号 | 根目录 `.env`（不进 git）；模板见 `.env.example` |
| 连接地址 | Mac 上 `localhost:5432`；后端容器内 `db:5432` |
| 表结构 | 暂无；阶段 2 起用 Alembic 管理 |

## 8. 总结

阶段 0 的后端只证明三件事：应用能启动、配置能正确读取、能判断数据库是否可用。它同时是 Docker 学习的载体和阶段 2 的起点。阶段 1 前端使用演示数据，不依赖后端运行。

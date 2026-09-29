"""
概览 / Overview
---------------
后端入口：创建 FastAPI 应用并注册各路由。uvicorn 通过 `app.main:app` 启动它。
Backend entry point: build the FastAPI app and register routers. uvicorn starts `app.main:app`.

包含 / Contents
- create_app()：创建并返回配置好的 FastAPI 实例（测试也用它创建独立实例）。
  Build and return a configured FastAPI instance (tests use it to get isolated apps).
- app：供 uvicorn 使用的模块级实例。/ module-level instance for uvicorn.
"""

from fastapi import FastAPI

from app.api import health


def create_app() -> FastAPI:
    """
    创建应用 / Create the application.

    输入 / Input: 无。/ none.
    输出 / Output: 已注册路由的 FastAPI 实例。创建时不连数据库。
                   A FastAPI instance with routers registered. Does not touch the database.

    步骤 / Steps
    1. 新建 FastAPI 实例（自动文档在 /docs）。/ New FastAPI instance (docs at /docs).
    2. 注册健康检查路由。/ Register the health router.
    """
    application = FastAPI(title="SIG API", version="0.1.0")  # 步骤 1 / Step 1
    application.include_router(health.router)  # 步骤 2 / Step 2
    return application


app = create_app()

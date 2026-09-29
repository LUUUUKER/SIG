"""
概览 / Overview
---------------
数据库连接层：创建 SQLAlchemy Engine，并提供"数据库是否可用"的检查。
Database connection layer: create the SQLAlchemy Engine and check whether the database is reachable.

包含 / Contents
- make_engine(database_url, connect_timeout_seconds)：按连接串创建 Engine（带连接超时）。
  Build an Engine for a URL, with a connect timeout.
- get_engine()：用全局配置创建并缓存进程唯一的 Engine。
  Build and cache the single process-wide Engine from settings.
- check_db(engine)：执行 SELECT 1，能连上返回 True，否则返回 False（不抛异常）。
  Run SELECT 1; return True when reachable, False otherwise (never raises).
"""

from functools import lru_cache

from sqlalchemy import Engine, create_engine, text
from sqlalchemy.exc import SQLAlchemyError

from app.core.config import get_settings


def make_engine(database_url: str, connect_timeout_seconds: int = 3) -> Engine:
    """
    创建 Engine / Create an Engine.

    输入 / Input
    - database_url：SQLAlchemy 连接串。/ SQLAlchemy URL.
    - connect_timeout_seconds：驱动层连接超时秒数。/ driver-level connect timeout in seconds.
    输出 / Output: Engine。创建时不会真正连接，第一次使用时才连。
                   Engine. Creating it does not connect; the first use does.

    说明 / Notes
    - pool_pre_ping=True：从连接池取连接前先探测，避免拿到已断开的连接。
      Probe pooled connections before use so dropped connections are replaced.
    """
    return create_engine(
        database_url,
        pool_pre_ping=True,
        connect_args={"connect_timeout": connect_timeout_seconds},
    )


@lru_cache
def get_engine() -> Engine:
    """
    获取全局 Engine / Get the process-wide Engine.

    输入 / Input: 无，读取 get_settings()。/ none; uses get_settings().
    输出 / Output: 缓存的 Engine，全进程共用一个连接池。/ cached Engine sharing one pool.
    """
    settings = get_settings()
    return make_engine(settings.database_url, settings.db_connect_timeout_seconds)


def check_db(engine: Engine) -> bool:
    """
    检查数据库连通性 / Check database reachability.

    输入 / Input: engine —— 要检查的 Engine。/ the Engine to probe.
    输出 / Output: True 表示能执行查询；False 表示连接失败或查询出错。
                   True if a query succeeds; False on connection or query failure.

    步骤 / Steps
    1. 从 Engine 取一个连接。/ Open a connection.
    2. 执行 SELECT 1。/ Run SELECT 1.
    3. 任一步抛出 SQLAlchemyError 都视为不可用，返回 False。
       Any SQLAlchemyError means unreachable → False.
    """
    try:
        with engine.connect() as connection:  # 步骤 1 / Step 1
            connection.execute(text("SELECT 1"))  # 步骤 2 / Step 2
        return True
    except SQLAlchemyError:  # 步骤 3 / Step 3
        return False

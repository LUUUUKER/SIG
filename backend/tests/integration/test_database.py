"""
概览 / Overview
---------------
集成测试：连接 Docker Compose 里的真实 PostgreSQL。默认不运行，需要：
Integration tests against the real PostgreSQL in Docker Compose. Skipped by default; run with:

    docker compose up -d db
    set -a; source ../.env; set +a
    uv run pytest -m integration

包含 / Contents
- real_engine()：fixture，用 DATABASE_URL 创建 Engine；没设置时跳过。
  Fixture building an Engine from DATABASE_URL; skips when it is not set.
- test_check_db_true_for_running_database (I1)：真实数据库 → check_db 返回 True。
- test_pgvector_extension_available (I2)：能启用 vector 扩展（后续事件去重要用）。
  The vector extension can be enabled (needed later for event de-duplication).
"""

import os
from collections.abc import Iterator

import pytest
from sqlalchemy import Engine, text

from app.db.session import check_db, make_engine

pytestmark = pytest.mark.integration


@pytest.fixture
def real_engine() -> Iterator[Engine]:
    """
    真实数据库 Engine / Engine for the real database.

    输出 / Output: 指向 DATABASE_URL 的 Engine；测试结束后释放连接池。
                   Engine for DATABASE_URL; the pool is disposed after the test.
    """
    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        pytest.skip("DATABASE_URL 未设置 / not set — source ../.env first")
    engine = make_engine(database_url)
    yield engine
    engine.dispose()


def test_check_db_true_for_running_database(real_engine: Engine) -> None:
    """I1：数据库在运行时 check_db 返回 True。/ Running database → True."""
    assert check_db(real_engine) is True


def test_pgvector_extension_available(real_engine: Engine) -> None:
    """I2：可以启用并查到 vector 扩展。/ The vector extension can be created and is listed."""
    with real_engine.begin() as connection:
        connection.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        installed = connection.execute(
            text("SELECT extname FROM pg_extension WHERE extname = 'vector'")
        ).scalar_one_or_none()

    assert installed == "vector"

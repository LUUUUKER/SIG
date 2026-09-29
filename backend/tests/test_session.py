"""
概览 / Overview
---------------
数据库检查函数的单元测试（不需要真实数据库）。
Unit tests for the database check (no real database needed).

包含 / Contents
- test_check_db_returns_false_for_unreachable_address (B5)：连接不存在的地址时，
  在限定时间内返回 False，不卡住也不抛异常。
  An unreachable address returns False within the time limit, without hanging or raising.
"""

import time

from app.db.session import check_db, make_engine

# 端口 1 上不会有 PostgreSQL，连接会被立即拒绝。/ Nothing listens on port 1; connection is refused.
UNREACHABLE_DATABASE_URL = "postgresql+psycopg://nobody:nothing@127.0.0.1:1/none"
MAX_EXPECTED_SECONDS = 5


def test_check_db_returns_false_for_unreachable_address() -> None:
    """B5：不可达地址 → False，且耗时在上限内。/ Unreachable → False, within the time limit."""
    engine = make_engine(UNREACHABLE_DATABASE_URL, connect_timeout_seconds=1)

    started_at = time.monotonic()
    reachable = check_db(engine)
    elapsed_seconds = time.monotonic() - started_at

    assert reachable is False
    assert elapsed_seconds < MAX_EXPECTED_SECONDS

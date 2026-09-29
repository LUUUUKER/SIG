"""
概览 / Overview
---------------
配置读取测试。/ Settings loading tests.

包含 / Contents
- test_settings_reads_database_url_from_env (B3)：从环境变量读到 DATABASE_URL，超时用默认值。
  DATABASE_URL is read from the environment; timeout falls back to its default.
- test_settings_requires_database_url (B4)：缺少 DATABASE_URL 时立即抛 ValidationError。
  Missing DATABASE_URL raises ValidationError immediately.
"""

import pytest
from pydantic import ValidationError

from app.core.config import Settings

EXAMPLE_DATABASE_URL = "postgresql+psycopg://sig:secret@db:5432/sig"


def test_settings_reads_database_url_from_env(monkeypatch: pytest.MonkeyPatch) -> None:
    """B3：环境变量里的连接串被正确读取。/ The URL from the environment is loaded."""
    monkeypatch.setenv("DATABASE_URL", EXAMPLE_DATABASE_URL)
    monkeypatch.delenv("DB_CONNECT_TIMEOUT_SECONDS", raising=False)

    settings = Settings()

    assert settings.database_url == EXAMPLE_DATABASE_URL
    assert settings.db_connect_timeout_seconds == 3


def test_settings_requires_database_url(monkeypatch: pytest.MonkeyPatch) -> None:
    """B4：没有 DATABASE_URL 时启动即报错。/ No DATABASE_URL → fail fast."""
    monkeypatch.delenv("DATABASE_URL", raising=False)

    with pytest.raises(ValidationError):
        Settings()

"""
概览 / Overview
---------------
后端配置：从环境变量读取运行参数，集中校验，缺失必填项时在启动阶段立即报错。
Backend settings: read runtime parameters from environment variables, validate them in one place,
and fail fast at startup when a required value is missing.

包含 / Contents
- Settings：配置模型（数据库连接串、连接超时）。
  Settings: configuration model (database URL, connect timeout).
- get_settings()：读取并缓存一份 Settings，整个进程共用。
  get_settings(): build and cache a single Settings instance for the process.
"""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    运行配置 / Runtime configuration.

    字段 / Fields
    - database_url：必填。SQLAlchemy 连接串，例如 postgresql+psycopg://user:pass@db:5432/sig。
      Required. SQLAlchemy URL, e.g. postgresql+psycopg://user:pass@db:5432/sig.
    - db_connect_timeout_seconds：连接数据库的最长等待秒数，默认 3，防止健康检查被卡住。
      Max seconds to wait when connecting, default 3, so health checks never hang.

    环境变量名与字段同名、不区分大小写（DATABASE_URL → database_url）。
    Environment variable names match field names case-insensitively (DATABASE_URL → database_url).
    """

    model_config = SettingsConfigDict(extra="ignore")

    database_url: str
    db_connect_timeout_seconds: int = 3


@lru_cache
def get_settings() -> Settings:
    """
    获取全局配置 / Get the process-wide settings.

    输入 / Input: 无，读取环境变量。/ none; reads environment variables.
    输出 / Output: Settings 实例；首次调用后缓存。/ a Settings instance, cached after the first call.
    异常 / Raises: 缺少 DATABASE_URL 时抛出 pydantic.ValidationError。
                   pydantic.ValidationError when DATABASE_URL is missing.
    """
    return Settings()

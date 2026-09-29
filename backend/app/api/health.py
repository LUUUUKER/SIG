"""
概览 / Overview
---------------
健康检查接口：告诉调用方后端是否在运行、数据库是否连得上。
Health endpoint: reports whether the backend is up and the database is reachable.

包含 / Contents
- HealthResponse：返回体结构。/ response body schema.
- get_db_checker()：依赖项，返回一个"检查数据库"的函数；测试时可替换成假函数。
  Dependency returning a zero-arg "check the database" function; tests override it.
- health()：GET /api/health。数据库可用返回 200，不可用返回 503。
  GET /api/health. 200 when the database is reachable, 503 otherwise.
"""

from collections.abc import Callable
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, Response, status
from pydantic import BaseModel

from app.db.session import check_db, get_engine

router = APIRouter(prefix="/api", tags=["health"])

DbChecker = Callable[[], bool]


class HealthResponse(BaseModel):
    """
    健康检查返回体 / Health response body.

    - status："ok" 全部正常；"degraded" 服务在跑但依赖有问题。
      "ok" all good; "degraded" service is up but a dependency is failing.
    - database："ok" 或 "unreachable"。/ "ok" or "unreachable".
    """

    status: Literal["ok", "degraded"]
    database: Literal["ok", "unreachable"]


def get_db_checker() -> DbChecker:
    """
    提供数据库检查函数 / Provide the database checker.

    输入 / Input: 无。/ none.
    输出 / Output: 无参函数，调用时返回数据库是否可用。
                   A zero-arg function returning whether the database is reachable.

    说明 / Notes: 通过 FastAPI 的 Depends 注入；测试用 app.dependency_overrides 替换，
    这样不启动数据库也能测接口的两种结果。
    Injected with Depends; tests replace it through app.dependency_overrides so both
    outcomes can be tested without a running database.
    """
    engine = get_engine()
    return lambda: check_db(engine)


@router.get("/health", response_model=HealthResponse)
def health(
    response: Response,
    db_checker: Annotated[DbChecker, Depends(get_db_checker)],
) -> HealthResponse:
    """
    健康检查 / Health check.

    输入 / Input: 注入的 db_checker。/ injected db_checker.
    输出 / Output: HealthResponse；数据库不可用时 HTTP 状态码设为 503。
                   HealthResponse; HTTP status set to 503 when the database is unreachable.

    步骤 / Steps
    1. 调用 db_checker 检查数据库。/ Call db_checker.
    2. 可用 → 200 + ok/ok。/ Reachable → 200 with ok/ok.
    3. 不可用 → 503 + degraded/unreachable。/ Unreachable → 503 with degraded/unreachable.
    """
    database_reachable = db_checker()  # 步骤 1 / Step 1
    if database_reachable:
        return HealthResponse(status="ok", database="ok")  # 步骤 2 / Step 2
    response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE  # 步骤 3 / Step 3
    return HealthResponse(status="degraded", database="unreachable")

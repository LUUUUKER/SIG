"""
概览 / Overview
---------------
健康检查接口测试（不需要真实数据库）。通过 dependency_overrides 把数据库检查换成假函数。
Health endpoint tests (no real database). The database checker is replaced via dependency_overrides.

包含 / Contents
- client_with_db(reachable)：创建一个"数据库检查结果固定"的测试客户端。
  Build a TestClient whose database check always returns `reachable`.
- test_health_ok_when_db_reachable (B1)：数据库可用 → 200 + ok/ok。
- test_health_503_when_db_unreachable (B2)：数据库不可用 → 503 + degraded/unreachable。
"""

from fastapi.testclient import TestClient

from app.api.health import get_db_checker
from app.main import create_app


def client_with_db(reachable: bool) -> TestClient:
    """
    构造测试客户端 / Build a test client.

    输入 / Input: reachable —— 假数据库检查要返回的值。/ value the fake checker returns.
    输出 / Output: 使用独立 app 实例的 TestClient。/ TestClient over an isolated app instance.
    """
    application = create_app()
    application.dependency_overrides[get_db_checker] = lambda: (lambda: reachable)
    return TestClient(application)


def test_health_ok_when_db_reachable() -> None:
    """B1：数据库可用时返回 200 与 ok/ok。/ Reachable database → 200 with ok/ok."""
    response = client_with_db(reachable=True).get("/api/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "database": "ok"}


def test_health_503_when_db_unreachable() -> None:
    """B2：数据库不可用时返回 503 与 degraded/unreachable。/ Unreachable → 503 with degraded/unreachable."""
    response = client_with_db(reachable=False).get("/api/health")

    assert response.status_code == 503
    assert response.json() == {"status": "degraded", "database": "unreachable"}

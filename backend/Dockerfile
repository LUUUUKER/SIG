# 概览 / Overview:
#   后端镜像的"菜谱"。分层构建：先装依赖、再复制代码，改代码时不用重新下载依赖（利用层缓存）。
#   Recipe for the backend image. Dependencies are installed before the code is copied,
#   so editing code reuses the cached dependency layer.
#   步骤 / Steps
#   1. 以官方 Python 3.12 精简镜像为底。/ Start from the slim Python 3.12 image.
#   2. 拷入 uv 可执行文件。/ Copy in the uv binary.
#   3. 只拷依赖清单并安装运行依赖（不含 pytest 等开发依赖）。/ Install runtime deps only.
#   4. 拷入应用代码。/ Copy the application code.
#   5. 用 uvicorn 在 0.0.0.0:8000 启动。/ Start uvicorn on 0.0.0.0:8000.

# 步骤 1 / Step 1
FROM python:3.12-slim

# 步骤 2 / Step 2
COPY --from=ghcr.io/astral-sh/uv:0.11.7 /uv /uvx /bin/

WORKDIR /app
ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    PYTHONUNBUFFERED=1

# 步骤 3 / Step 3
COPY pyproject.toml uv.lock .python-version ./
RUN uv sync --frozen --no-dev

# 步骤 4 / Step 4
COPY app ./app

# 步骤 5 / Step 5
ENV PATH="/app/.venv/bin:$PATH"
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

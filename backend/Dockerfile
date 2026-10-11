# Multi-stage image with uv (compose files in the repo root).
# compose.prod.yaml builds without target -> last stage (prod).
# compose.dev.yaml builds target dev: includes the dev dependency group (ruff, mypy, pytest).

FROM python:3.11-slim AS base

COPY --from=ghcr.io/astral-sh/uv:0.12.3 /uv /bin/uv

ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_NO_CACHE=1 \
    UV_PYTHON_DOWNLOADS=never \
    PYTHONUNBUFFERED=1 \
    PATH="/app/.venv/bin:$PATH"

RUN useradd --create-home --uid 1000 dnd

WORKDIR /app

COPY pyproject.toml uv.lock ./

EXPOSE 8000

# Run app (no reload; the dev compose file adds --reload via command)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]


FROM base AS dev

RUN uv sync --frozen
COPY app ./app
# Writable work dir for caches of pytest/ruff/mypy when run in the container
RUN chown dnd:dnd /app
USER dnd


FROM base AS prod

RUN uv sync --frozen --no-dev
COPY app ./app
USER dnd

FROM python:3.11-alpine

# Системные зависимости для psycopg2 и pwdlib (argon2/bcrypt)
RUN apk add --no-cache gcc musl-dev postgresql-dev libpq curl build-base

WORKDIR /app

ENV POETRY_VERSION=1.8.5 \
    POETRY_VIRTUALENVS_CREATE=false \
    POETRY_NO_INTERACTION=1 \
    POETRY_CACHE_DIR=/tmp/poetry_cache

RUN pip install --no-cache-dir "poetry==${POETRY_VERSION}"

# Сначала только манифесты — кеш слоя при изменении кода backend
COPY pyproject.toml poetry.lock ./
RUN poetry install --only main --no-root \
    && rm -rf "${POETRY_CACHE_DIR}"

COPY ./backend ./backend

EXPOSE 8000

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]

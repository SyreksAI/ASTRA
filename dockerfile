FROM python:3.11-alpine

# Установка системных зависимостей
RUN apk add --no-cache gcc musl-dev postgresql-dev libpq curl build-base

WORKDIR /app

# Установка Poetry
RUN curl -sSL https://install.python-poetry.org | POETRY_HOME=/opt/poetry python3 - && \
    ln -s /opt/poetry/bin/poetry /usr/local/bin/poetry

ENV POETRY_VIRTUALENVS_CREATE=false

# Копируем файлы зависимостей
COPY pyproject.toml poetry.lock* ./

# Установка зависимостей
RUN poetry install --no-interaction --no-ansi --without dev

# Копируем исходный код
COPY ./backend ./backend

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
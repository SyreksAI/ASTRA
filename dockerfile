FROM python:3.13-alpine

# Установка системных зависимостей для компиляции пакетов и работы с БД
RUN apk add --no-cache gcc musl-dev postgresql-dev libpq curl build-base

WORKDIR /app

# Установка Poetry
RUN curl -sSL https://install.python-poetry.org | POETRY_HOME=/opt/poetry python3 -

ENV PATH="/opt/poetry/bin:$PATH"
ENV POETRY_VIRTUALENVS_CREATE=false

# Копируем файлы зависимостей первыми для кэширования слоя
COPY pyproject.toml poetry.lock* ./

# Установка зависимостей (если есть poetry.lock, использует его, иначе создает)
# Флаг --no-interaction отключает запросы, --no-root не ставит сам проект как пакет (так как package-mode = false)
RUN poetry install --no-interaction --no-ansi --without dev

# Если нужны dev-зависимости для сборки или тестов, раскомментируйте:
# RUN poetry install --no-interaction --no-ansi

# Копируем исходный код
COPY ./backend ./backend

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
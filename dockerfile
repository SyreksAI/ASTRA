# ============================================
# СТАДИЯ 1: БЭКЕНД
# ============================================
FROM python:3.11-slim AS backend

WORKDIR /app

# Установка системных зависимостей для компиляции Python-пакетов
RUN apt-get update && apt-get install -y gcc libpq-dev && rm -rf /var/lib/apt/lists/*

COPY backend/pyproject.toml .

# Установка Python зависимостей
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir \
    fastapi==0.104.1 \
    uvicorn[standard]==0.24.0 \
    sqlalchemy==2.0.23 \
    asyncpg==0.29.0 \
    redis==5.0.1 \
    python-jose[cryptography]==3.3.0 \
    passlib[bcrypt]==1.7.4 \
    python-multipart==0.0.6 \
    pydantic-settings==2.1.0 \
    python-dotenv==1.0.0 \
    psycopg2-binary==2.9.9

COPY backend/app/ ./app/

# ============================================
# СТАДИЯ 2: ФРОНТЕНД (Сборка UI)
# ИСПОЛЬЗУЕМ NODE 20 ДЛЯ СОВМЕСТИМОСТИ
# ============================================
FROM node:20-alpine AS frontend

WORKDIR /app

COPY frontend/package*.json ./

# Установка зависимостей и очистка кэша
RUN npm install && npm cache clean --force

COPY frontend/ ./

# Сборка проекта
RUN npm run build

# ============================================
# СТАДИЯ 3: ФИНАЛЬНЫЙ ОБРАЗ (Runtime)
# ============================================
FROM python:3.11-slim

WORKDIR /app

# Установка Nginx и очистка кэша
RUN apt-get update && apt-get install -y nginx && rm -rf /var/lib/apt/lists/*

# 1. Копируем Python библиотеки
COPY --from=backend /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages

# 2. Копируем исполняемые файлы Python/UVICORN
COPY --from=backend /usr/local/bin/uvicorn /usr/local/bin/uvicorn
COPY --from=backend /usr/local/bin/pip /usr/local/bin/pip
COPY --from=backend /usr/local/bin/python /usr/local/bin/python
COPY --from=backend /usr/local/bin/python3 /usr/local/bin/python3

# 3. Копируем код приложения
COPY --from=backend /app /app

# 4. Копируем собранный фронтенд
COPY --from=frontend /app/dist /app/frontend-build

# 5. Копируем конфиг Nginx
COPY nginx/nginx.conf /etc/nginx/conf.d/app.conf

# 6. Создаем скрипт запуска с помощью printf (надежнее чем cat <<EOF)
RUN printf '#!/bin/sh\n\
echo "Starting Nginx..."\n\
nginx -g "daemon off;" &\n\
echo "Starting Uvicorn..."\n\
cd /app\n\
exec uvicorn app.main:app --host 0.0.0.0 --port 8000' > /app/start.sh

# Делаем скрипт исполняемым
RUN chmod +x /app/start.sh

EXPOSE 80 8000

CMD ["/app/start.sh"]
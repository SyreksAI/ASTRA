FROM python:3.11-slim AS backend

WORKDIR /app

# Установка системных зависимостей
RUN apt-get update && apt-get install -y gcc libpq-dev && rm -rf /var/lib/apt/lists/*

COPY backend/pyproject.toml .

# Установка Python зависимостей
# Важно: устанавливаем именно в /usr/local, чтобы скопировать потом
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
# ============================================
FROM node:18-alpine AS frontend

WORKDIR /app

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
RUN npm run build

# ============================================
# СТАДИЯ 3: ФИНАЛЬНЫЙ ОБРАЗ (Runtime)
# ============================================
FROM python:3.11-slim

WORKDIR /app

# Установка Nginx и очистка кэша
RUN apt-get update && apt-get install -y nginx && rm -rf /var/lib/apt/lists/*

# 1. Копируем site-packages (библиотеки)
COPY --from=backend /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages

# 2. Копируем исполняемые файлы (uvicorn, pip и т.д.)
# Копируем только нужное, чтобы не ломать системный путь
COPY --from=backend /usr/local/bin/uvicorn /usr/local/bin/uvicorn
COPY --from=backend /usr/local/bin/pip /usr/local/bin/pip
COPY --from=backend /usr/local/bin/python /usr/local/bin/python

# 3. Копируем код приложения
COPY --from=backend /app /app

# 4. Копируем собранный фронтенд
COPY --from=frontend /app/dist /app/frontend-build

# 5. Копируем конфиг Nginx
COPY nginx/nginx.conf /etc/nginx/conf.d/app.conf

# Скрипт запуска
# Используем exec form для корректной передачи сигналов, но здесь нужен shell form для фона
RUN echo '#!/bin/bash\n\
echo "Starting Nginx..."\n\
nginx -g "daemon off;" &\n\
echo "Starting Uvicorn..."\n\
cd /app\n\
exec uvicorn app.main:app --host 0.0.0.0 --port 8000' > /app/start.sh && chmod +x /app/start.sh

EXPOSE 80 8000

CMD ["/app/start.sh"]
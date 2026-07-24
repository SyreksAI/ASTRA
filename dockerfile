# ============================================
# СТАДИЯ 1: БЭКЕНД
# ============================================
FROM python:3.11-slim AS backend

WORKDIR /app

RUN apt-get update && apt-get install -y gcc libpq-dev && rm -rf /var/lib/apt/lists/*

COPY backend/pyproject.toml .

# Устанавливаем зависимости ЯВНО
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
    python-dotenv==1.0.0

COPY backend/app/ ./app/

# ============================================
# СТАДИЯ 2: ФРОНТЕНД
# ============================================
FROM node:18-alpine AS frontend

WORKDIR /app

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
RUN npm run build

# ============================================
# СТАДИЯ 3: ФИНАЛЬНЫЙ ОБРАЗ
# ============================================
FROM python:3.11-slim

WORKDIR /app

# Устанавливаем Nginx
RUN apt-get update && apt-get install -y nginx && rm -rf /var/lib/apt/lists/*

# КОПИРУЕМ ВЕСЬ PYTHON (включая site-packages) из стадии backend
COPY --from=backend /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=backend /usr/local/bin /usr/local/bin

# Копируем код бэкенда
COPY --from=backend /app /app

# Копируем собранный фронтенд
COPY --from=frontend /app/dist /app/frontend-build

# Копируем конфиг Nginx
COPY nginx/nginx.conf /etc/nginx/conf.d/app.conf

# Скрипт запуска
RUN echo '#!/bin/bash\n\
nginx -g "daemon off;" &\n\
cd /app\n\
uvicorn app.main:app --host 0.0.0.0 --port 8000\n\
wait' > /app/start.sh && chmod +x /app/start.sh

EXPOSE 80 8000

CMD ["/app/start.sh"]
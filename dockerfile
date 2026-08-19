FROM python:3.13-alpine

WORKDIR /app

RUN apk add --no-cache gcc musl-dev postgresql-dev libpq

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY ./backend ./backend

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
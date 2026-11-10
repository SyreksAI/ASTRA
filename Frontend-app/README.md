# Elara Mobile (Expo)

Мобильный клиент Elara на **Expo + React Native**. Backend общий с веб-версией (`backend/` + docker-compose).

## Требования

- Node.js 22+ (или совместимый)
- Docker Compose с поднятым стеком Elara (`nginx` на порту **8080**)
- Expo Go на телефоне **или** Android/iOS эмулятор

## Быстрый старт

```bash
# из корня репозитория
docker compose up -d

cd Frontend-app
cp .env.example .env
npm install
npx expo start
```

Отсканируйте QR в Expo Go или нажмите `a` / `i` для эмулятора.

## API URL (`EXPO_PUBLIC_API_URL`)

| Где запускаете приложение | Значение |
|---|---|
| iOS Simulator / веб | `http://127.0.0.1:8080` |
| Android Emulator | `http://10.0.2.2:8080` |
| Физический телефон (одна Wi‑Fi сеть) | `http://YOUR_LAN_IP:8080` |

Пример `.env`:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.42:8080
```

После смены `.env` перезапустите Expo (`npx expo start -c`).

## Что есть в v1

- Логин / регистрация (JWT → SecureStore)
- Табы: **Лента**, **Созвездия**, **Профиль**
- Экран логина в стиле космос-макета (glass fields, teal CTA)
- Соцкнопки Google / Apple / VK — пока UI-заглушки

## Структура

```
Frontend-app/
  app/(auth)/          # login, register
  app/(tabs)/          # home feed, constellations, profile
  src/api/             # client + base URL
  src/context/         # AuthContext
  src/theme/           # tokens
  assets/images/       # cosmos-bg, logos
```

## Заметки

- Веб-фронт в `frontend/` не трогаем — это отдельное приложение.
- Для Android emulator обязательно `10.0.2.2`, не `localhost`.
- Если запросы падают с network error — проверьте, что nginx слушает `8080` и телефон в той же сети.

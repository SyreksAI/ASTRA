# Linkster

Отдельный мессенджер Elara: чаты, группы, звонки, stories (часть UI — демо).

Проект перенесён из `Desktop\MyProject copy\mobile-chat-app` в каталог `Linkster/` этого репозитория.

## Запуск

```bash
cd Linkster
npm install
copy .env.example .env
# EXPO_PUBLIC_API_URL — IP ПК в Wi‑Fi (часто nginx :80), не :8000 если порт закрыт
npm start
```

- **Регистрация / вход** — backend Elara (`/api/auth/register`, `/api/auth/login`); чаты общие с вебом.
- **WebSocket** — `/api/chat/ws?token=…` (`src/config/api.ts`).

Компонент `TalkLogo` / `TalkWordmark` — `assets/logo-light.png` или `logo-dark.png`.

Нативная сборка с WebRTC: `npm run android` / `npm run ios` (нужен dev client / папка `android`).

## APK (Android)

Linkster **не собирается в Expo Go** — нужен native build (WebRTC, звонки).

**Release APK** (подпись debug-ключом — для установки себе на телефон):

```powershell
cd Linkster
.\scripts\build-apk.ps1
```

APK: `android\app\build\outputs\apk\release\app-release.apk`

Перед сборкой: в Android Studio → SDK Manager установи **NDK 27.1.12297006** и **Build-Tools 36**.  
В `.env` укажи `EXPO_PUBLIC_API_URL` — в release JS bundle зашивается при сборке Gradle.

Для Google Play нужен свой keystore (см. [React Native — signed APK](https://reactnative.dev/docs/signed-apk-android)).

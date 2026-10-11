import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],

    server: {
        // Слушаем все интерфейсы (0.0.0.0) — доступ с телефона по IP
        host: true,
        port: 3000,
        // Если порт занят — не убегать на другой, а явно упасть,
        // чтобы не искать потом, где реально крутится сервер
        strictPort: true,

        // Разрешаем обращение по IP и localhost (Vite 5+ блокирует чужие Host-заголовки)
        allowedHosts: [
            'localhost',
            '127.0.0.1',
            '192.168.1.104',
            '.local',
        ],

        // HMR по умолчанию работает по текущему хосту, но если что — укажем явно
        hmr: {
            host: '192.168.1.104',
        },

        // Проксирование запросов к бэкенду (FastAPI на :8000)
        proxy: {
            '/api': {
                target: 'http://127.0.0.1:8000',
                changeOrigin: true,
                secure: false,
                ws: true,
            },
            '/docs': {
                target: 'http://127.0.0.1:8000',
                changeOrigin: true,
                secure: false,
            },
            '/openapi.json': {
                target: 'http://127.0.0.1:8000',
                changeOrigin: true,
                secure: false,
            },
            // Если у тебя есть /redoc — добавь на всякий случай
            '/redoc': {
                target: 'http://127.0.0.1:8000',
                changeOrigin: true,
                secure: false,
            },
        },

        // Разрешаем CORS при разработке (на случай прямых запросов)
        cors: true,
    },

    build: {
        outDir: 'dist',
        // Чанки не разрастаются в один гигантский бандл
        chunkSizeWarningLimit: 1000,
        sourcemap: false,
    },

    // Ускоряем повторный запуск
    optimizeDeps: {
        include: ['react', 'react-dom'],
    },
})
// src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const readApiError = async (response, fallback) => {
    const body = await response.json().catch(() => null);
    if (Array.isArray(body?.detail)) {
        return body.detail.map((item) => item.msg).join('. ');
    }
    return body?.detail || fallback;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(localStorage.getItem('token'));

    // ===== ТЕМА =====
    const applyTheme = (theme) => {
        if (theme === 'dark') {
            document.body.classList.add('dark-theme');
            localStorage.setItem('theme', 'dark');
        } else {
            document.body.classList.remove('dark-theme');
            localStorage.setItem('theme', 'light');
        }
    };

    const applyThemeVisual = (theme) => {
        if (theme === 'dark') {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }
    };

    const restoreTheme = () => {
        const savedTheme = localStorage.getItem('theme');
        applyThemeVisual(savedTheme === 'dark' ? 'dark' : 'light');
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        applyThemeVisual('light');
    };

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') || 'light';
        const isAuthPage =
            window.location.pathname === '/login' ||
            window.location.pathname === '/register';
        if (isAuthPage) {
            applyThemeVisual('light');
        } else {
            applyTheme(savedTheme);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ===== ЗАГРУЗКА ПОЛЬЗОВАТЕЛЯ ПО ТОКЕНУ =====
    useEffect(() => {
        if (!token) {
            setLoading(false);
            return;
        }

        let cancelled = false;
        fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => {
                if (!res.ok) throw new Error('Token invalid');
                return res.json();
            })
            .then((data) => {
                if (cancelled) return;
                setUser(data);
                restoreTheme();
            })
            .catch(() => {
                if (cancelled) return;
                localStorage.removeItem('token');
                setToken(null);
                setUser(null);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    // ===== ПЕРЕЧИТАТЬ ПОЛЬЗОВАТЕЛЯ С СЕРВЕРА =====
    // Используется после загрузки фото, чтобы получить актуальный avatar/cover_image
    const refreshUser = async () => {
        const currentToken = localStorage.getItem('token');
        if (!currentToken) return null;

        const res = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${currentToken}` },
        });

        if (!res.ok) return null;

        const data = await res.json();
        setUser(data);
        return data;
    };

    // ===== ВХОД / РЕГИСТРАЦИЯ =====
    const login = async (email, password) => {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
            throw new Error(await readApiError(response, 'Ошибка входа'));
        }

        const data = await response.json();
        localStorage.setItem('token', data.access_token);
        setToken(data.access_token);
        setUser(data.user);

        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            applyTheme(savedTheme);
        } else {
            const serverTheme = data.user?.preferences?.theme || 'light';
            applyTheme(serverTheme);
        }

        return data;
    };

    const register = async (userData) => {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData),
        });

        if (!response.ok) {
            throw new Error(await readApiError(response, 'Ошибка регистрации'));
        }

        const data = await response.json();
        localStorage.setItem('token', data.access_token);
        setToken(data.access_token);
        setUser(data.user);
        applyTheme('light');

        return data;
    };

    // ===== ТЕМА НА СЕРВЕРЕ =====
    const updateTheme = async (theme) => {
        applyTheme(theme);

        const currentToken = localStorage.getItem('token');
        if (!currentToken) return;

        try {
            const response = await fetch('/api/theme', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${currentToken}`,
                },
                body: JSON.stringify({ theme }),
            });

            if (!response.ok) throw new Error('Ошибка сохранения темы');

            const data = await response.json();
            setUser((prev) => ({
                ...prev,
                preferences: { ...prev?.preferences, theme },
            }));
            return data;
        } catch (error) {
            const oldTheme = theme === 'dark' ? 'light' : 'dark';
            applyTheme(oldTheme);
            throw error;
        }
    };

    // ===== ПРОФИЛЬ (текстовые поля) =====
    const updateProfile = async (profile) => {
        const currentToken = localStorage.getItem('token');
        const response = await fetch('/api/auth/me', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${currentToken}`,
            },
            body: JSON.stringify(profile),
        });

        if (!response.ok) {
            throw new Error(await readApiError(response, 'Не удалось сохранить профиль'));
        }

        const updatedUser = await response.json();

        // Сливаем ответ с текущим user — чтобы не потерять поля,
        // которые бэк мог не вернуть (например, avatar)
        setUser((prev) => ({ ...prev, ...updatedUser }));
        return updatedUser;
    };

    // ===== ЗАГРУЗКА ФОТО (avatar / cover) =====
    // imageKind: 'avatar' | 'cover'
    // Эндпоинт: POST /api/auth/me/avatar  или  /api/auth/me/cover
    const uploadProfileImage = async (file, imageKind) => {
        if (!file) throw new Error('Файл не выбран');

        const currentToken = localStorage.getItem('token');
        if (!currentToken) throw new Error('Нет авторизации');

        const formData = new FormData();
        formData.append('file', file);

        console.log(`[upload] ${imageKind}:`, {
            name: file.name,
            type: file.type,
            size: file.size,
        });

        const response = await fetch(`/api/auth/me/${imageKind}`, {
            method: 'POST',
            headers: {
                // ❗ НЕ добавляем Content-Type — браузер сам выставит boundary
                Authorization: `Bearer ${currentToken}`,
            },
            body: formData,
        });

        if (!response.ok) {
            const msg = await readApiError(response, 'Не удалось обновить фото');
            console.error(`[upload] ${imageKind} failed:`, response.status, msg);
            throw new Error(msg);
        }

        const result = await response.json();
        console.log(`[upload] ${imageKind} ok:`, result);

        // После загрузки — перечитываем пользователя с сервера,
        // чтобы получить гарантированно актуальные поля (avatar, cover_image).
        await refreshUser();

        const fieldName = imageKind === 'cover' ? 'cover_image' : 'avatar';
        return result[fieldName] ?? result.url ?? null;
    };

    const value = {
        user,
        loading,
        token,
        login,
        register,
        logout,
        updateTheme,
        updateProfile,
        uploadProfileImage,
        refreshUser,
        isAuthenticated: !!user,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
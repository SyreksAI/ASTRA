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

    // 👇 Применяет тему И СОХРАНЯЕТ в localStorage
    const applyTheme = (theme) => {
        if (theme === 'dark') {
            document.body.classList.add('dark-theme');
            localStorage.setItem('theme', 'dark');
            console.log('🌙 Тёмная тема включена и сохранена');
        } else {
            document.body.classList.remove('dark-theme');
            localStorage.setItem('theme', 'light');
            console.log('☀️ Светлая тема включена и сохранена');
        }
    };

    // 👇 Применяет тему ТОЛЬКО ВИЗУАЛЬНО (НЕ сохраняет в localStorage)
    const applyThemeVisual = (theme) => {
        if (theme === 'dark') {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }
        console.log('🎨 Тема применена визуально:', theme);
    };

    const restoreTheme = () => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }
        console.log('🔄 Тема восстановлена из localStorage:', savedTheme);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        // 👇 ТОЛЬКО ВИЗУАЛЬНО — светлая для страницы логина
        applyThemeVisual('light');
        console.log('🚪 Выход выполнен');
    };

    // 👇 СТРАНИЦЫ АВТОРИЗАЦИИ — всегда светлые (визуально)
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') || 'light';
        const isAuthPage = window.location.pathname === '/login' || window.location.pathname === '/register';
        if (isAuthPage) {
            applyThemeVisual('light');
            console.log('📄 Страница авторизации — светлая тема');
        } else {
            applyTheme(savedTheme);
        }
    }, []);

    useEffect(() => {
        if (token) {
            fetch('/api/auth/me', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
                .then(res => {
                    if (!res.ok) throw new Error('Token invalid');
                    return res.json();
                })
                .then(data => {
                    setUser(data);
                    restoreTheme();
                    setLoading(false);
                })
                .catch(() => {
                    localStorage.removeItem('token');
                    setToken(null);
                    setLoading(false);
                });
        } else {
            setLoading(false);
        }
    }, [token]);

    const login = async (email, password) => {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
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
            console.log('🔑 Вход выполнен. Тема из localStorage:', savedTheme);
        } else {
            const serverTheme = data.user?.preferences?.theme || 'light';
            applyTheme(serverTheme);
            console.log('🔑 Вход выполнен. Тема из сервера (localStorage пуст):', serverTheme);
        }
        
        return data;
    };

    const register = async (userData) => {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });

        if (!response.ok) {
            throw new Error(await readApiError(response, 'Ошибка регистрации'));
        }

        const data = await response.json();
        localStorage.setItem('token', data.access_token);
        setToken(data.access_token);
        setUser(data.user);
        
        applyTheme('light');
        console.log('📝 Регистрация выполнена. Тема: светлая');
        
        return data;
    };

    const updateTheme = async (theme) => {
        applyTheme(theme);
        console.log('🔄 Тема изменена на:', theme);

        const token = localStorage.getItem('token');
        if (!token) {
            console.log('⚠️ Нет токена, тема сохранена только в localStorage');
            return;
        }

        try {
            const response = await fetch('/api/theme', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ theme })
            });

            if (!response.ok) throw new Error('Ошибка сохранения темы');

            const data = await response.json();
            console.log('✅ Тема сохранена на сервере:', data.theme);

            setUser(prev => ({
                ...prev,
                preferences: { ...prev?.preferences, theme: theme }
            }));

            applyTheme(theme);

            return data;
        } catch (error) {
            console.error('❌ Ошибка сохранения темы:', error);
            const oldTheme = theme === 'dark' ? 'light' : 'dark';
            applyTheme(oldTheme);
            throw error;
        }
    };

    const updateProfile = async (profile) => {
        const currentToken = localStorage.getItem('token');
        const response = await fetch('/api/auth/me', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentToken}`
            },
            body: JSON.stringify(profile)
        });

        if (!response.ok) {
            throw new Error(await readApiError(response, 'Не удалось сохранить профиль'));
        }

        const updatedUser = await response.json();
        setUser(updatedUser);
        return updatedUser;
    };

    const uploadProfileImage = async (file, imageKind) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await fetch(`/api/auth/me/${imageKind}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
            body: formData
        });

        if (!response.ok) {
            throw new Error(await readApiError(response, 'Не удалось обновить фото'));
        }

        const result = await response.json();
        const fieldName = imageKind === 'cover' ? 'cover_image' : 'avatar';
        setUser((currentUser) => ({ ...currentUser, [fieldName]: result[fieldName] }));
        return result[fieldName];
    };

    const value = {
        user,
        loading,
        login,
        register,
        logout,
        updateTheme,
        updateProfile,
        uploadProfileImage,
        isAuthenticated: !!user
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

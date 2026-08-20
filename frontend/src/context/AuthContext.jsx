// src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(localStorage.getItem('token'));

    // 👇 Функция применения темы
    const applyTheme = (theme) => {
        if (theme === 'dark') {
            document.body.classList.add('dark-theme');
            localStorage.setItem('theme', 'dark');
            console.log('🌙 Тёмная тема включена');
        } else {
            document.body.classList.remove('dark-theme');
            localStorage.setItem('theme', 'light');
            console.log('☀️ Светлая тема включена');
        }
    };

    // 👇 ЗАГРУЗКА ТЕМЫ ПРИ СТАРТЕ (из localStorage)
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') || 'light';
        // 👇 Проверяем, находимся ли мы на странице входа/регистрации
        const isAuthPage = window.location.pathname === '/login' || window.location.pathname === '/register';
        if (isAuthPage) {
            // 👇 Если на странице авторизации - ВСЕГДА СВЕТЛАЯ ТЕМА
            applyTheme('light');
        } else {
            applyTheme(savedTheme);
        }
    }, []);

    // 👇 Загрузка пользователя
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
                    // 👇 НЕ МЕНЯЕМ ТЕМУ! Оставляем из localStorage
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
            const error = await response.json();
            throw new Error(error.detail || 'Ошибка входа');
        }

        const data = await response.json();
        localStorage.setItem('token', data.access_token);
        setToken(data.access_token);
        setUser(data.user);
        
        // 👇 ПРИ ВХОДЕ ВСЕГДА СВЕТЛАЯ ТЕМА
        applyTheme('light');
        console.log('🔑 Вход выполнен. Тема: светлая');
        
        return data;
    };

    const register = async (userData) => {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Ошибка регистрации');
        }

        const data = await response.json();
        localStorage.setItem('token', data.access_token);
        setToken(data.access_token);
        setUser(data.user);
        
        // 👇 ПРИ РЕГИСТРАЦИИ ВСЕГДА СВЕТЛАЯ ТЕМА
        applyTheme('light');
        console.log('📝 Регистрация выполнена. Тема: светлая');
        
        return data;
    };

    // 👇 Функция для обновления темы (через "Более") - МЕНЯЕТ ТЕМУ
    const updateTheme = async (theme) => {
        // Сначала меняем UI и сохраняем в localStorage
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
                preferences: { ...prev?.preferences, theme: data.theme }
            }));

            return data;
        } catch (error) {
            console.error('❌ Ошибка сохранения темы:', error);
            // Откатываем при ошибке
            const oldTheme = theme === 'dark' ? 'light' : 'dark';
            applyTheme(oldTheme);
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        // 👇 ПРИ ВЫХОДЕ ВСЕГДА СВЕТЛАЯ ТЕМА
        applyTheme('light');
        console.log('🚪 Выход выполнен. Тема: светлая');
    };

    const value = {
        user,
        loading,
        login,
        register,
        logout,
        updateTheme,
        isAuthenticated: !!user
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
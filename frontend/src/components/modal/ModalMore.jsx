// src/components/modal/ModalMore.jsx
import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';  

export function ModalMore({ onClose, toggleTheme, isDarkTheme }) {
    const modalRef = useRef(null);
    const navigate = useNavigate();
    const { logout } = useAuth();  

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (modalRef.current && !modalRef.current.contains(e.target)) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);

    const handleSettingsClick = () => {
        onClose();
        navigate('/settings');
    };

    // 👇 ФУНКЦИЯ ВЫХОДА
    const handleLogout = () => {
        if (window.confirm('Вы уверены, что хотите выйти из аккаунта?')) {
            logout();  // 👈 ВЫЗЫВАЕМ logout из AuthContext
            onClose();
            navigate('/login');
        }
    };

    return (
        <div 
            className="modal-overlay settings-overlay"
            onClick={onClose}
        >
            <div 
                ref={modalRef}
                className="settings-modal"
                onClick={(e) => e.stopPropagation()}
                style={{
                    position: 'fixed',
                    bottom: '380px',
                    left: '130px',
                    maxWidth: '300px',
                    width: '100%',
                    margin: 0,
                }}
            >
                <div className="settings-modal-body">
                    <div 
                        className="settings-item"
                        onClick={handleSettingsClick}
                    >
                        <span>Настройки и конфиденциальность</span>
                    </div>
                    
                    <div 
                        className="settings-item"
                        onClick={toggleTheme}
                    >
                        <span>{isDarkTheme ? 'Светлая тема' : 'Тёмная тема'}</span>
                    </div>
                    
                    <div 
                        className="settings-item"
                        style={{ borderBottom: 'none' }}
                        onClick={handleLogout}  // 👈 ИСПОЛЬЗУЕМ НОВУЮ ФУНКЦИЮ
                    >
                        <span style={{ color: '#dc2626' }}>Выйти из аккаунта</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
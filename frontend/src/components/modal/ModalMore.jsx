import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export function ModalMore({ onClose, toggleTheme, isDarkTheme }) {
    const modalRef = useRef(null);
    const navigate = useNavigate();

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

    // 👇 Функция для перехода в настройки
    const handleSettingsClick = () => {
        onClose(); // Закрываем модалку
        navigate('/settings'); // Переходим на страницу настроек
    };

    return (
        <div className="modal-overlay settings-overlay">
            <div 
                ref={modalRef}
                className="modal-content settings-modal" 
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
                    {/* 👇 КЛИК ВЕДЁТ В НАСТРОЙКИ */}
                    <div className="settings-item" onClick={handleSettingsClick}>
                        <span>Настройки и конфиденциал...</span>
                    </div>
                    
                    <div className="settings-item" onClick={toggleTheme}>
                        <span>{isDarkTheme ? 'Светлая тема' : 'Тёмная тема'}</span>
                    </div>
                    
                    <div className="settings-item" onClick={() => {
                        if (window.confirm('Вы уверены, что хотите выйти из аккаунта?')) {
                            console.log('Выход...');
                            // Здесь можно добавить логику выхода
                        }
                    }}>
                        <span>Выйти из аккаунта</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
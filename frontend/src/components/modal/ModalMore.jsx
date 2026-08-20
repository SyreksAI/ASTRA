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

    const handleSettingsClick = () => {
        onClose();
        navigate('/settings');
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
                        <span>Настройки и конфиденциал...</span>
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
                        onClick={() => {
                            if (window.confirm('Вы уверены, что хотите выйти из аккаунта?')) {
                                console.log('Выход...');
                            }
                        }}
                    >
                        <span style={{ color: '#dc2626' }}>Выйти из аккаунта</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
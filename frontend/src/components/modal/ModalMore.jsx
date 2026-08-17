import React, { useEffect, useRef } from 'react';

export function ModalMore({ onClose, toggleTheme, isDarkTheme }) {
    const modalRef = useRef(null);

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
                    <div className="settings-item">
                        <span>Настройки и конфиденциал...</span>
                    </div>
                    <div className="settings-item" onClick={toggleTheme}>
                        <span>{isDarkTheme ? 'Светлая тема' : 'Тёмная тема'}</span>
                    </div>
                    <div className="settings-item">
                        <span>Выйти из аккаунта</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
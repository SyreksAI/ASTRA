// src/components/layout/Menu.jsx
import React from 'react';
import { Link } from 'react-router-dom';

export function Menu({ items, activeItem, onItemClick, onOpenModal, onOpenSettings }) {
    return (
        <nav className="menu-nav">
            {items.map(item => {
                // Если пункт меню "Более" — обрабатываем клик отдельно
                if (item.id === 'Более') {
                    return (
                        <div 
                            key={item.id}
                            className="menu-item menu-item-settings"
                            onClick={() => {
                                onItemClick(item);
                                onOpenSettings(); // Открываем модалку настроек
                            }}
                        >
                            <img src={item.icon} alt={item.label} className="menu-item-icon" />
                            <span className="menu-item-label">{item.label}</span>
                        </div>
                    );
                }

                // Остальные пункты — как обычно
                return (
                    <Link 
                        key={item.id}
                        to={item.path || '/'}
                        className={`menu-item ${activeItem === item.id ? 'menu-item-active' : ''}`}
                        onClick={() => onItemClick(item)}
                    >
                        <img src={item.icon} alt={item.label} className="menu-item-icon" />
                        <span className="menu-item-label">{item.label}</span>
                    </Link>
                );
            })}
            
            <div className="menu-item menu-item-create">
                <button className="menu-item-create-btn" onClick={onOpenModal}>
                    Создать
                </button>
            </div>
        </nav>
    );
}
// src/components/layout/Menu.jsx
import React from 'react';
import { Link } from 'react-router-dom';

export function Menu({ items, activeItem, onItemClick, onOpenModal }) {
    return (
        <nav className="menu-nav">
            {items.map(item => (
                <Link 
                    key={item.id}
                    to={item.path || '/'}
                    className={`menu-item ${activeItem === item.id ? 'menu-item-active' : ''}`}
                    onClick={() => onItemClick(item)}
                >
                    <img src={item.icon} alt={item.label} className="menu-item-icon" />
                    <span className="menu-item-label">{item.label}</span>
                </Link>
            ))}
            
            <div className="menu-item menu-item-create">
                <button className="menu-item-create-btn" onClick={onOpenModal}>
                    Создать
                </button>
            </div>
        </nav>
    );
}
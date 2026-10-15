// src/components/layout/Menu.jsx
import React, { Fragment } from 'react';
import { Link } from 'react-router-dom';

export function Menu({ items, activeItem, onItemClick, onOpenModal, onOpenSettings }) {
    // Разделители между группами: как только группа меняется — рисуем линию.
    let prevGroup = null;

    return (
        <nav className="menu-nav">
            {items.map((item) => {
                const showDivider = prevGroup !== null && item.group && item.group !== prevGroup;
                prevGroup = item.group || prevGroup;

                let node;

                // Пункт "Более" — открывает модалку настроек вместо перехода
                if (item.id === 'Более') {
                    node = (
                        <div
                            key={item.id}
                            className="menu-item menu-item-settings"
                            onClick={() => {
                                onItemClick(item);
                                onOpenSettings();
                            }}
                        >
                            <img src={item.icon} alt={item.label} className="menu-item-icon" />
                            <span className="menu-item-label">{item.label}</span>
                        </div>
                    );
                } else {
                    node = (
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
                }

                return (
                    <Fragment key={item.id}>
                        {showDivider && <div className="menu-divider" />}
                        {node}
                    </Fragment>
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
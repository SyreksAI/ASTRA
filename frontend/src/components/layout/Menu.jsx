import React, { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { MenuIcons } from './MenuIcons';

export function Menu({
    items,
    activeItem,
    onItemClick,
    onOpenModal,
    onOpenSettings,
    user,
}) {
    let prevGroup = null;

    return (
        <nav className="menu-nav menu-nav--orbit">
            {items.map((item) => {
                const showDivider = prevGroup !== null && item.group && item.group !== prevGroup;
                prevGroup = item.group || prevGroup;
                const icon = item.iconKey ? MenuIcons[item.iconKey] : null;
                const isMore = item.id === 'Ещё' || item.id === 'Более';

                const iconNode = (
                    <span className="menu-item-icon" aria-hidden="true">
                        {icon || (item.icon ? <img src={item.icon} alt="" /> : null)}
                    </span>
                );

                let node;

                if (isMore) {
                    node = (
                        <div
                            key={item.id}
                            className="menu-item menu-item-settings"
                            onClick={() => {
                                onItemClick(item);
                                onOpenSettings();
                            }}
                        >
                            {iconNode}
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
                            {iconNode}
                            <span className="menu-item-label">{item.label}</span>
                            {item.badge != null && item.badge !== 0 && (
                                <span className="menu-item-badge">{item.badge}</span>
                            )}
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

            <div className="menu-nav__spacer" aria-hidden />

            <div className="menu-orbit-visual">
                <img
                    src="/home/orbit-planet.png"
                    alt=""
                    className="menu-orbit-visual__planet"
                    aria-hidden
                />
                <svg
                    className="menu-orbit-visual__lines"
                    viewBox="0 0 320 420"
                    fill="none"
                    aria-hidden
                >
                    <ellipse cx="40" cy="280" rx="210" ry="118" stroke="currentColor" strokeWidth="1.1" />
                    <ellipse cx="28" cy="300" rx="250" ry="148" stroke="currentColor" strokeWidth="0.9" opacity="0.7" />
                    <ellipse cx="10" cy="255" rx="180" ry="96" stroke="currentColor" strokeWidth="0.85" opacity="0.55" />
                    <path
                        d="M120 95 C 190 130, 250 190, 285 270"
                        stroke="currentColor"
                        strokeWidth="1"
                        opacity="0.65"
                    />
                    <path
                        d="M95 70 C 175 110, 240 175, 270 250"
                        stroke="currentColor"
                        strokeWidth="0.8"
                        opacity="0.45"
                    />
                    <circle cx="198" cy="148" r="4.5" fill="currentColor" />
                    <circle cx="248" cy="205" r="3.2" fill="currentColor" opacity="0.85" />
                    <circle cx="268" cy="248" r="5.5" fill="currentColor" opacity="0.9" />
                    <circle cx="175" cy="118" r="2.4" fill="currentColor" opacity="0.7" />
                    <circle cx="220" cy="178" r="2" fill="currentColor" opacity="0.55" />
                </svg>
                <div className="menu-orbit-visual__labels" aria-hidden>
                    <span>люди</span>
                    <span>идеи</span>
                    <span>созвездия</span>
                    <span>ты</span>
                </div>
                <button
                    type="button"
                    className="menu-orbit-visual__create"
                    onClick={onOpenModal}
                >
                    Создать
                </button>
            </div>

            {user && (
                <Link
                    to="/profile"
                    className="menu-user-card menu-user-card--orbit"
                    onClick={() => onItemClick({ id: 'Профиль', path: '/profile' })}
                >
                    <span className="menu-user-card__avatar">
                        {user.avatar ? (
                            <img src={user.avatar} alt="" />
                        ) : (
                            <span>{(user.full_name || user.username || 'A')[0].toUpperCase()}</span>
                        )}
                    </span>
                    <span className="menu-user-card__text">
                        <span className="menu-user-card__name">
                            {user.full_name || user.username || 'Пользователь'}
                        </span>
                        <span className="menu-user-card__handle">
                            @{user.username || 'user'}
                        </span>
                    </span>
                </Link>
            )}
        </nav>
    );
}

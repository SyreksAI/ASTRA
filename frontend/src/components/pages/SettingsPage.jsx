import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function SettingsPage() {
    const navigate = useNavigate();
    const [searchSettings, setSearchSettings] = useState('');
    const [activeItem, setActiveItem] = useState(null);

    const menuItems = [
        { id: 'account', label: 'Ваш аккаунт' },
        { id: 'monetization', label: 'Монетизация' },
        { id: 'premium', label: 'Премиум' },
        { id: 'subscriptions', label: 'Подписки для авторов' },
        { id: 'security', label: 'Безопасность и доступ к учетной записи' },
        { id: 'privacy', label: 'Конфиденциальность и безопасность' },
        { id: 'notifications', label: 'Уведомления' },
        { id: 'accessibility', label: 'Доступность, отображение и языки' },
        { id: 'resources', label: 'Дополнительные ресурсы' },
        { id: 'support', label: 'Центр поддержки' },
    ];

    const handleItemClick = (id) => {
        setActiveItem(id);
        console.log(`Переход к: ${id}`);
        // Здесь можно добавить навигацию на подстраницы
        // Например: navigate(`/settings/${id}`)
    };

    return (
        <div className="settings-page-simple">
            {/* Шапка */}
            <div className="settings-header-simple">
                <h1 className="settings-title-simple">Настройки</h1>
            </div>

            <div className="settings-body-simple-full">
                {/* Поле поиска */}
                <div className="settings-search-wrapper-full">
                    <input
                        type="text"
                        className="settings-search-input-full"
                        placeholder="Настройки поиска"
                        value={searchSettings}
                        onChange={(e) => setSearchSettings(e.target.value)}
                    />
                </div>

                {/* Список пунктов */}
                <div className="settings-menu-list-full">
                    {menuItems.map((item) => (
                        <div
                            key={item.id}
                            className={`settings-menu-item-full ${activeItem === item.id ? 'settings-menu-item-active' : ''}`}
                            onClick={() => handleItemClick(item.id)}
                        >
                            <div className="settings-menu-item-left-full">
                                <span className="settings-menu-item-label-full">{item.label}</span>
                            </div>
                            <span className="settings-menu-item-arrow-full">›</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
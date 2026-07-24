import React, { useState } from "react";

export function NotificationsPage() {
    const notifications = [
        { id: 1, text: 'Павел Дуров ответил на ваш комментарий', time: '5 минут назад', read: false },
        { id: 2, text: 'Дмитрий Нагиев лайкнул ваш пост', time: '15 минут назад', read: false },
        { id: 3, text: 'Новый подписчик: Егор Крид', time: '2 часа назад', read: true },
        { id: 4, text: 'Сергей Жуков опубликовал новый пост', time: '3 часа назад', read: true },
    ];

    return (
        <div className="notifications-page">
            <div className="notifications-page-list">
                {notifications.map(notif => (
                    <div key={notif.id} className={`notifications-page-item ${notif.read ? 'notifications-page-read' : 'notifications-page-unread'}`}>
                        <div className="notifications-page-content">
                            <p className="notifications-page-text">{notif.text}</p>
                            <span className="notifications-page-time">{notif.time}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
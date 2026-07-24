// src/components/explore/ForYou.jsx
import React from 'react';

export function ForYou({ suggestedUsers }) {
    return (
        <div className="for-you-page">
            <h3 className="for-you-page-title">Новости дня</h3>

            <div className="for-you-news-list">
                <div className="for-you-news-item">
                    <p className="for-you-news-text">Екатерина Леонова — фигуристка взорвала интернет номером под «Лунную сонату»</p>
                    <span className="for-you-news-meta">2 часа назад • Спорт • 1253 постов</span>
                </div>
                <div className="for-you-news-item">
                    <p className="for-you-news-text">Кристина Орбакайте — дочь Пугачёвой отправилась в тур по США</p>
                    <span className="for-you-news-meta">3 часа назад • Музыка • 476 постов</span>
                </div>
                <div className="for-you-news-item">
                    <p className="for-you-news-text">Владимир Кехман — директор Театра имени Вахтангова и Михайловского театра неожиданно отменил гастроли в Китай</p>
                    <span className="for-you-news-meta">5 часа назад • Театр • 218 постов</span>
                </div>
                <button className="for-you-show-more-btn">Смотреть ещё</button>
            </div>

            <div className="for-you-suggestions">
                <div className="for-you-suggestions-header">
                    <h3 className="for-you-suggestions-title">За кем следовать</h3>
                </div>

                <div className="for-you-suggestions-list">
                    {suggestedUsers.map((person) => (
                        <div key={person.id} className="for-you-suggestion-item">
                            <img 
                                className="for-you-suggestion-avatar" 
                                src={person.img} 
                                alt={person.name}
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(person.name)}&background=1d9bf0&color=fff&size=150&bold=true`;
                                }}
                            />
                            <div className="for-you-suggestion-info">
                                <h3 className="for-you-suggestion-name">{person.name}</h3>
                                <p className="for-you-suggestion-role">{person.role}</p>
                            </div>
                            <div className="for-you-suggestion-btn-wrapper">
                                <button className="for-you-suggestion-follow-btn">Следовать</button>
                            </div>
                        </div>
                    ))}
                </div>

                <button className="for-you-show-more-btn">Смотреть ещё</button>
            </div>
        </div>
    );
}
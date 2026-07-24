import React from "react";

export function Trending({suggestedUsers}) {
    return (
        <div className="trending-page">
            <div className="trending-news-wrapper">
                <div className="trending-featured-image">
                    <img src="Test_img.png" alt="Featured" />
                </div>
                <div className="trending-news-list">
                    <h3 className="trending-news-title">Новости дня</h3>
                    <div className="trending-news-item">
                        <p className="trending-news-text">Екатерина Леонова — фигуристка взорвала интернет номером под «Лунную сонату»</p>
                        <span className="trending-news-meta">2 часа назад • Спорт • 1253 постов</span>
                    </div>
                    <div className="trending-news-item">
                        <p className="trending-news-text">Кристина Орбакайте — дочь Пугачёвой отправилась в тур по США</p>
                        <span className="trending-news-meta">3 часа назад • Музыка • 476 постов</span>
                    </div>
                    <div className="trending-news-item">
                        <p className="trending-news-text">Владимир Кехман — директор Театра имени Вахтангова и Михайловского театра неожиданно отменил гастроли в Китай</p>
                        <span className="trending-news-meta">5 часа назад • Театр • 218 постов</span>
                    </div>
                    <button className="trending-show-more-btn">Смотреть ещё</button>
                </div>
            </div>
        </div>
    )
}
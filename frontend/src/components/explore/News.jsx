import React from "react";

export function News({ suggestedUsers}) {
    return (
        <div className="News_Explore">
            <div className="News_Explore_block">
                <div className="new_news_explore">
                    <h4>Нейросеть анализирует ваш вкус и на лету пересобирает бит. 
                        Музыканты в шоке, диджеи в панике.
                    </h4>
                    <p>#Технологии #Музыка #ИИ</p>
                </div>

                <div className="new_news_explore">
                    <h4>Спустя 10 лет молчания Хаяо Миядзаки вернулся с проектом, 
                        который стирает грань между аниме и реальностью.
                    </h4>
                    <p>#Кино #Аниме #Ghibli</p>
                </div>

                <div className="new_news_explore">
                    <h4>Инди-исполнительница LUNNA, которую открыли через ASTRA, 
                        обогнала мировых поп-звезд по количеству прослушиваний.
                    </h4>
                    <p>#ASTRA #Конкурс #Музыка</p>
                </div>

                <div className="new_news_explore">
                    <h4>Нейросеть анализирует ваш вкус и на лету пересобирает бит. 
                        Музыканты в шоке, диджеи в панике.
                    </h4>
                    <p>#Технологии #Музыка #ИИ</p>
                </div>

                <div className="new_news_explore">
                    <h4>Инди-исполнительница LUNNA, которую открыли через ASTRA, 
                        обогнала мировых поп-звезд по количеству прослушиваний.
                    </h4>
                    <p>#ASTRA #Конкурс #Музыка</p>
                </div>

                <div className="new_news_explore">
                    <h4>Спустя 10 лет молчания Хаяо Миядзаки вернулся с проектом, 
                        который стирает грань между аниме и реальностью.
                    </h4>
                    <p>#Кино #Аниме #Ghibli</p>
                </div>
            </div>
            <button className="trending-show-more-btn">Смотреть ещё</button>
        </div>
    )
}
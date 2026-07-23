import React, { useState } from 'react';
import "./static/master.scss";

// КОМПОНЕНТ ПОСТА
function Post({ post }) {
    const [liked, setLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(post.likes);

    const handleLike = (e) => {
        e.stopPropagation();
        const newLiked = !liked
        setLiked(newLiked);
        setLikesCount(prev => newLiked ? prev - 1 : prev + 1);
    };

    return (
        <div className="post-item">
            <div className="post-item-header">
                <img src={post.avatar} alt={post.name} className="post-item-avatar" />
                <div className="post-item-user-info">
                    <div className="post-item-user-name">{post.name}</div>
                    <div className="post-item-user-handle">{post.handle}</div>
                </div>
                <div className="post-item-time">{post.time}</div>
            </div>
            
            <div className="post-item-content">{post.content}</div>
            {post.image && <img src={post.image} alt="Post" className="post-item-image" />}
            
            <div className="post-item-actions">
                <button className="post-item-action-btn">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.68-4.196 7.11l-8.054 4.46v-3.69h-.067c-4.49.1-8.183-3.51-8.183-8.01zm8.005-6c-3.317 0-6.005 2.69-6.005 6 0 3.37 2.77 6.08 6.138 6.01l.351-.01h1.761v2.3l5.087-2.81c1.951-1.08 3.163-3.13 3.163-5.36 0-3.39-2.744-6.13-6.129-6.13H9.756z"/>
                    </svg>
                    {post.comments}
                </button>
                
                <button className="post-item-action-btn">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.79 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14-4.432-4.14 1.364-1.46 2.068 1.93V8c0-1.1-.896-2-2-2z"/>
                    </svg>
                    {post.retweets}
                </button>
                
                <button className={`post-item-action-btn ${liked ? 'post-item-liked' : ''}`} onClick={handleLike}>
                    <svg viewBox="0 0 24 24" fill={liked ? '#f91880' : 'currentColor'}>
                        <path d={liked 
                            ? "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                            : "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                        }/>
                    </svg>
                    {likesCount}
                </button>
                
                <button className="post-item-action-btn">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 3C7.03 3 3 7.03 3 12c0 2.5 1.27 4.85 3.37 6.25l.65.37-.26.72c-.5 1.4-1.42 3.03-2.71 4.87l.12.12c1.5-.38 3.13-1.22 4.75-2.27l.5-.32c.94.2 1.91.3 2.9.3 4.97 0 9-4.03 9-9s-4.03-9-9-9z"/>
                    </svg>
                </button>
            </div>
        </div>
    );
}

// КОМПОНЕНТ ГЛАВНОЙ СТРАНИЦЫ
function HomePage({ posts, activeTab, setActiveTab }) {
    return (
        <div className="home-page">
            <div className="home-page-header">
                {['Для тебя', 'Следующий'].map(tab => (
                    <p key={tab} 
                       className={`home-page-header-link ${activeTab === tab ? 'home-page-header-link-active' : ''}`}
                       onClick={() => setActiveTab(tab)}>
                        {tab}
                    </p>
                ))}
            </div>
            <div className="home-page-feed">
                {posts.map(post => <Post key={post.id} post={post} />)}
            </div>
        </div>
    );
}

// КОМПОНЕНТ "ДЛЯ ТЕБЯ" (В EXPLORE)
function ForYou({suggestedUsers}) {
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
                                    // Fallback на генератор аватарок
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
    )
}

// КОМПОНЕНТ "В ТРЕНДЕ" (В EXPLORE)
function Trending({suggestedUsers}) {
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

// КОМПОНЕНТ "Новости" (В EXPLORE)
function News({ suggestedUsers}) {
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

// КОМПОНЕНТ "Спорт" (В EXPLORE)
function Sport({suggestedUsers}) {
    return (
        <div className="Sport">
            <div className="img_poster_sport">
                <img className='Sport_Poster' src="Sport_img.jpg" alt="" />
            </div>
            <div className="Sport_post">
                <div className="Post_Sport_info">
                    <h4>Твоё тело может всё, главное — убедить в этом свой мозг. 
                        Единственная плохая тренировка — это та, которая не состоялась!
                    </h4>
                    <p>#Интересное #Спорт</p>
                </div>
                <div className="Post_Sport_info">
                    <h4>Твоё тело может всё, главное — убедить в этом свой мозг. 
                        Единственная плохая тренировка — это та, которая не состоялась!
                    </h4>
                    <p>#Интересное #Спорт</p>
                </div>
                <div className="Post_Sport_info">
                    <h4>Твоё тело может всё, главное — убедить в этом свой мозг. 
                        Единственная плохая тренировка — это та, которая не состоялась!
                    </h4>
                    <p>#Интересное #Спорт</p>
                </div>
                <div className="Post_Sport_info">
                    <h4>Твоё тело может всё, главное — убедить в этом свой мозг. 
                        Единственная плохая тренировка — это та, которая не состоялась!
                    </h4>
                    <p>#Интересное #Спорт</p>
                </div>
                <button className="trending-show-more-btn">Смотреть ещё</button>

            </div>
        </div>
    )
}

// КОМПОНЕНТ "Видео" (В EXPLORE)
function Video({ suggestedUsers }) {
    return (
        <div className="Video_block">
            <div className="Video">
                <div className="Video_post">
                    <img src="Video.jpg" alt="" className='video'/>
                    <div className="User_info_video">
                        <img src="logo_post.jpg" alt="" className='logo_user_video'/>
                        <div className="info_video_user">
                            <p className='info_header_video'>Как понимает ИИ?</p>
                            <p className='info_video'>ИИ помогает в мидецине...</p>
                        </div>

                    </div>
                </div>

                <div className="Video_post">
                    <img src="Video.jpg" alt="" className='video'/>
                    <div className="User_info_video">
                        <img src="logo_post.jpg" alt="" className='logo_user_video'/>
                        <div className="info_video_user">
                            <p className='info_header_video'>Как понимает ИИ?</p>
                            <p className='info_video'>ИИ помогает в мидецине...</p>
                        </div>

                    </div>
                </div>

                <div className="Video_post">
                    <img src="Video.jpg" alt="" className='video'/>
                    <div className="User_info_video">
                        <img src="logo_post.jpg" alt="" className='logo_user_video'/>
                        <div className="info_video_user">
                            <p className='info_header_video'>Как понимает ИИ?</p>
                            <p className='info_video'>ИИ помогает в мидецине...</p>
                        </div>

                    </div>
                </div>
            </div>

            <div className="Video">
                <div className="Video_post">
                    <img src="Video.jpg" alt="" className='video'/>
                    <div className="User_info_video">
                        <img src="logo_post.jpg" alt="" className='logo_user_video'/>
                        <div className="info_video_user">
                            <p className='info_header_video'>Как понимает ИИ?</p>
                            <p className='info_video'>ИИ помогает в мидецине...</p>
                        </div>

                    </div>
                </div>

                <div className="Video_post">
                    <img src="Video.jpg" alt="" className='video'/>
                    <div className="User_info_video">
                        <img src="logo_post.jpg" alt="" className='logo_user_video'/>
                        <div className="info_video_user">
                            <p className='info_header_video'>Как понимает ИИ?</p>
                            <p className='info_video'>ИИ помогает в мидецине...</p>
                        </div>

                    </div>
                </div>

                <div className="Video_post">
                    <img src="Video.jpg" alt="" className='video'/>
                    <div className="User_info_video">
                        <img src="logo_post.jpg" alt="" className='logo_user_video'/>
                        <div className="info_video_user">
                            <p className='info_header_video'>Как понимает ИИ?</p>
                            <p className='info_video'>ИИ помогает в мидецине...</p>
                        </div>

                    </div>
                </div>
            </div>

            <div className="Video">
                <div className="Video_post">
                    <img src="Video.jpg" alt="" className='video'/>
                    <div className="User_info_video">
                        <img src="logo_post.jpg" alt="" className='logo_user_video'/>
                        <div className="info_video_user">
                            <p className='info_header_video'>Как понимает ИИ?</p>
                            <p className='info_video'>ИИ помогает в мидецине...</p>
                        </div>

                    </div>
                </div>

                <div className="Video_post">
                    <img src="Video.jpg" alt="" className='video'/>
                    <div className="User_info_video">
                        <img src="logo_post.jpg" alt="" className='logo_user_video'/>
                        <div className="info_video_user">
                            <p className='info_header_video'>Как понимает ИИ?</p>
                            <p className='info_video'>ИИ помогает в мидецине...</p>
                        </div>

                    </div>
                </div>

                <div className="Video_post">
                    <img src="Video.jpg" alt="" className='video'/>
                    <div className="User_info_video">
                        <img src="logo_post.jpg" alt="" className='logo_user_video'/>
                        <div className="info_video_user">
                            <p className='info_header_video'>Как понимает ИИ?</p>
                            <p className='info_video'>ИИ помогает в мидецине...</p>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    )
}

// КОМПОНЕНТ СТРАНИЦЫ ИССЛЕДОВАНИЯ
function ExplorePage({ suggestedUsers }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('Для тебя');

    const categories = [
        { id: 'Для тебя', label: 'Для тебя' },
        { id: 'В тренде', label: 'В тренде' },
        { id: 'Новости', label: 'Новости' },
        { id: 'Спорт', label: 'Спорт' },
        { id: 'Видео', label: 'Видео' },
    ];

    const renderContentSearch = () => {
        switch(activeCategory) {
            case 'Для тебя':
                return <ForYou suggestedUsers={suggestedUsers} />;
            case 'В тренде':
                return <Trending suggestedUsers={suggestedUsers} />;
            case 'Новости':
                return <News suggestedUsers={suggestedUsers} />;
            case 'Спорт':
                return <Sport suggestedUsers={suggestedUsers} />;
            case 'Видео':
                return <Video suggestedUsers={suggestedUsers} />;
        }
    }

    return (
        <div className="explore-page">
            <div className="explore-page-header">
                <input type="text" 
                       placeholder="Поиск..." 
                       value={searchQuery}
                       onChange={e => setSearchQuery(e.target.value)}
                       className="explore-page-search-input" />
                
                <div className="explore-page-categories">
                    {categories.map(category => (
                        <p key={category.id}
                           className={`explore-page-category-item ${activeCategory === category.id ? 'explore-page-category-active' : ''}`}
                           onClick={() => setActiveCategory(category.id)}>
                           {category.label}
                        </p>
                    ))}
                </div>
            </div>

            <div className="explore-page-content">
                <div className="explore-page-main">
                    {renderContentSearch()}
                </div>
            </div>
        </div>
    );
}

// КОМПОНЕНТ СТРАНИЦЫ УВЕДОМЛЕНИЙ
function NotificationsPage() {
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

// КОМПОНЕНТ СТРАНИЦЫ В РАЗРАБОТКЕ
function UnderDevelopmentPage({ pageName }) {
    return (
        <div className="under-development-page">
            <h2 className="under-development-page-title">{pageName}</h2>
            <p className="under-development-page-text">Страница "{pageName}" в разработке</p>
            <div className="under-development-page-icon">🚧</div>
        </div>
    );
}

// КОМПОНЕНТ МУЗЫКАЛЬНОГО ПЛЕЕРА
function MusicPlayer({ tracks, currentTrack, isPlaying, onPlayToggle, onNext, onPrev }) {
    return (
        <div className="music-player">
            <div className="music-player-header">
                <div className="music-player-title-wrapper">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                    </svg>
                    <span className="music-player-title">Музыка</span>
                </div>
                <div className="music-player-status">
                    {isPlaying ? '▶ Сейчас играет' : '⏸ На паузе'}
                </div>
            </div>

            <div className="music-player-current-track">
                <img src={tracks[currentTrack].cover} 
                     alt={tracks[currentTrack].title}
                     className="music-player-cover" />
                <div className="music-player-track-info">
                    <div className="music-player-track-title">{tracks[currentTrack].title}</div>
                    <div className="music-player-track-artist">{tracks[currentTrack].artist}</div>
                    <div className="music-player-track-album">{tracks[currentTrack].album}</div>
                </div>
            </div>

            <div className="music-player-progress">
                <div className="music-player-progress-bar">
                    <div className="music-player-progress-fill" style={{ width: '45%' }}></div>
                </div>
                <div className="music-player-time">
                    <span>1:23</span>
                    <span>{tracks[currentTrack].duration}</span>
                </div>
            </div>

            <div className="music-player-controls">
                <button className="music-player-control-btn" onClick={onPrev}>
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
                    </svg>
                </button>
                
                <button className={`music-player-play-btn ${isPlaying ? 'music-player-playing' : ''}`} onClick={onPlayToggle}>
                    {isPlaying ? (
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                        </svg>
                    ) : (
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z"/>
                        </svg>
                    )}
                </button>
                
                <button className="music-player-control-btn" onClick={onNext}>
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
                    </svg>
                </button>
            </div>
        </div>
    );
}


// КОМПОНЕНТ ЧАТА
function ChatPage() {
    const [messages, setMessages] = useState([
        { id: 1, text: 'Привет! Как дела?', sender: 'other', time: '10:30' },
        { id: 2, text: 'Всё отлично! А у тебя?', sender: 'me', time: '10:31' },
        { id: 3, text: 'Тоже хорошо 😊', sender: 'other', time: '10:32' },
    ]);
    const [newMessage, setNewMessage] = useState('');
    const [activeChat, setActiveChat] = useState(0);

    const chats = [
        { id: 0, name: 'Павел Дуров', avatar: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSBXjt3QBuQnsx3pKEV-UpT8XXychSKg9gij_WRs4OY1A&s=10', lastMessage: 'Тоже хорошо 😊', time: '10:32' },
        { id: 1, name: 'Дмитрий Нагиев', avatar: 'https://avatars.mds.yandex.net/i?id=a0629e3b84c2ddbeeb6ee3a0d606f558563ec106-5171197-images-thumbs&n=13', lastMessage: 'Скоро увидимся!', time: '09:15' },
        { id: 2, name: 'Егор Крид', avatar: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSox8V0ukDUsoxpzJtiA_nZj9wTmVal5asFAoN2u8PZTw&s=10', lastMessage: 'Новая песня выходит завтра', time: '08:45' },
        { id: 3, name: 'Сергей Жуков', avatar: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRd-8LIrbnf-SCygSHIM6pWBiLbpeQk05V0mDx1GuoMyw&s=10', lastMessage: 'Спасибо за поддержку!', time: 'Вчера' },
    ];

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (newMessage.trim() === '') return;
        
        const newMsg = {
            id: messages.length + 1,
            text: newMessage,
            sender: 'me',
            time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
        };
        
        setMessages([...messages, newMsg]);
        setNewMessage('');
    };

    return (
        <div className="chat-page">
            <div className="chat-page-container">
                {/* Список чатов */}
                <div className="chat-list">
                    <div className="search_chat">
                        <input type="text" className='Chat-search-input' placeholder='Поиск контактов...'/>
                    </div>
                    
                    {chats.map((chat, index) => (
                        <div 
                            key={chat.id}
                            className={`chat-list-item ${activeChat === index ? 'chat-list-item-active' : ''}`}
                            onClick={() => setActiveChat(index)}
                        >
                            <img src={chat.avatar} alt={chat.name} className="chat-list-avatar" />
                            <div className="chat-list-info">
                                <div className="chat-list-name">{chat.name}</div>
                                <div className="chat-list-last-message">{chat.lastMessage}</div>
                            </div>
                            <div className="chat-list-time">{chat.time}</div>
                        </div>
                    ))}
                </div>

                {/* Окно чата */}
                <div className="chat-window">
                    {chats.length > 0 && (
                        <>
                            {/* Заголовок чата */}
                            <div className="chat-window-header">
                                <img src={chats[activeChat].avatar} alt={chats[activeChat].name} className="chat-window-avatar" />
                                <div className="chat-window-user-info">
                                    <div className="chat-window-user-name">{chats[activeChat].name}</div>
                                    <div className="chat-window-user-status">В сети</div>
                                </div>
                            </div>

                            {/* Сообщения */}
                            <div className="chat-messages">
                                {messages.map(msg => (
                                    <div 
                                        key={msg.id} 
                                        className={`chat-message ${msg.sender === 'me' ? 'chat-message-me' : 'chat-message-other'}`}
                                    >
                                        <div className="chat-message-text">{msg.text}</div>
                                        <div className="chat-message-time">{msg.time}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Поле ввода */}
                            <form className="chat-input-form" onSubmit={handleSendMessage}>
                                <input
                                    type="text"
                                    className="chat-input"
                                    placeholder="Введите сообщение..."
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                />
                                <button type="submit" className="chat-send-btn">
                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                                    </svg>
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

// КОМПОНЕНТ МЕНЮ
function Menu({ items, activeItem, onItemClick }) {
    return (
        <nav className="menu-nav">
            {items.map(item => (
                <div key={item.id}
                     className={`menu-item ${activeItem === item.id ? 'menu-item-active' : ''}`}
                     onClick={() => onItemClick(item)}>
                    <img src={item.icon} alt={item.label} className="menu-item-icon" />
                    <span className="menu-item-label">{item.label}</span>
                </div>
            ))}
            <div className="menu-item menu-item-create">
                <button className="menu-item-create-btn" onClick={() => alert('Создание нового поста')}>
                    Создать
                </button>
            </div>
        </nav>
    );
}

// ProfilePage
function ProfilePage({ suggestedUsers }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('Для тебя');

    const categories = [
        { id: 'Посты', label: 'Посты' },
        { id: 'Избранное', label: 'Избранное' },
        { id: 'Плей лист', label: 'Плей лист' },
        { id: 'Лайк', label: 'Лайк' }
    ];

    const renderContentSearch = () => {
        switch(activeCategory) {
            case 'Посты':
                return <ForYou suggestedUsers={suggestedUsers} />;
            case 'В тренде':
                return <Trending suggestedUsers={suggestedUsers} />;
        }
    }

    return (
        <div className="Profile-Page">
            <>
                <img src="cover.png" alt="" className='cover'/>
                <div className="block_info_user">
                    <div className="User_profile_img">
                        <img className='Profile_img' src="Profile_img.png" alt="" />
                    </div>
                    <div className="Edit_profile_btn">
                        <button className='Btn_user_Edit_profile'>Edit Profile</button>
                    </div>
                </div>
            </>
            <div className="user_profile_info">
                <p className='puser_profile_name'>Василий Жукин</p>
                <p className='UserName_profile'>@Vasily</p>
                <p className='info_user'>Студент Московского IT колледжа, направление РПО</p>

                <div className="Activity_profile">
                    <div className="Following">
                        <label>1,253</label>
                        <p>Подписчики</p>
                    </div>
                    <div className="Like">
                        <label>1.5M</label>
                        <p>Лайки</p>
                    </div>
                </div>

                <div className="menu_profile_post">
                    <div className="explore-page-header profile-page-header">
                        <div className="profile-page-categories">
                            {categories.map(category => (
                                <p key={category.id}
                                className={`explore-page-category-item ${activeCategory === category.id ? 'explore-page-category-active' : ''}`}
                                onClick={() => setActiveCategory(category.id)}>
                                {category.label}
                                </p>
                            ))}
                        </div>
                    </div>
                {/* const [searchQuery, setSearchQuery] = useState('');
                const [activeCategory, setActiveCategory] = useState('Для тебя');

                const categories = [
                    { id: 'Для тебя', label: 'Для тебя' },
                    { id: 'В тренде', label: 'В тренде' },
                    { id: 'Новости', label: 'Новости' },
                    { id: 'Спорт', label: 'Спорт' },
                    { id: 'Видео', label: 'Видео' },
                ];

                const renderContentSearch = () => {
                    switch(activeCategory) {
                        case 'Для тебя':
                            return <ForYou suggestedUsers={suggestedUsers} />;
                        case 'В тренде':
                            return <Trending suggestedUsers={suggestedUsers} />;
                        case 'Новости':
                            return <News suggestedUsers={suggestedUsers} />;
                        case 'Спорт':
                            return <Sport suggestedUsers={suggestedUsers} />;
                        case 'Видео':
                            return <Video suggestedUsers={suggestedUsers} />;
                    }
                }

                return (
                    <div className="explore-page">
                        <div className="explore-page-header">
                            <input type="text" 
                                placeholder="Поиск..." 
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="explore-page-search-input" />
                            
                            <div className="explore-page-categories">
                                {categories.map(category => (
                                    <p key={category.id}
                                    className={`explore-page-category-item ${activeCategory === category.id ? 'explore-page-category-active' : ''}`}
                                    onClick={() => setActiveCategory(category.id)}>
                                    {category.label}
                                    </p>
                                ))}
                            </div>
                        </div>

                        <div className="explore-page-content">
                            <div className="explore-page-main">
                                {renderContentSearch()}
                            </div>
                        </div>
                    </div>
                ); */}
                </div>
            </div>
        </div>
    )
}




// ГЛАВНЫЙ КОМПОНЕНТ APP
function App() {
    const [activeItem, setActiveItem] = useState('Главная');
    const [activeTab, setActiveTab] = useState('Для тебя');
    const [currentPage, setCurrentPage] = useState('home');
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTrack, setCurrentTrack] = useState(0);

    const suggestedUsers = [
        { id: 1, name: 'Павел Дуров', role: 'CEO Telegram', img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSBXjt3QBuQnsx3pKEV-UpT8XXychSKg9gij_WRs4OY1A&s=10' },
        { id: 2, name: 'Дмитрий Нагиев', role: 'Актёр', img: 'https://avatars.mds.yandex.net/i?id=a0629e3b84c2ddbeeb6ee3a0d606f558563ec106-5171197-images-thumbs&n=13' },
        { id: 3, name: 'Егор Крид', role: 'Певец', img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSox8V0ukDUsoxpzJtiA_nZj9wTmVal5asFAoN2u8PZTw&s=10' },
        { id: 4, name: 'Сергей Жуков', role: 'Певец', img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRd-8LIrbnf-SCygSHIM6pWBiLbpeQk05V0mDx1GuoMyw&s=10' }
    ];

    const menuItems = [
        { id: 'Главная', icon: '/menu/home.png', label: 'Главная', page: 'home' },
        { id: 'Исследовать', icon: '/menu/search.png', label: 'Исследовать', page: 'explore' },
        { id: 'Уведомления', icon: '/menu/notifications.png', label: 'Уведомления', page: 'notifications' },
        { id: 'Чат', icon: '/menu/chat.png', label: 'Чат', page: 'chat' },
        { id: 'Stella', icon: '/menu/AI.png', label: 'Stella', page: 'stella' },
        { id: 'Закладки', icon: '/menu/bookmarks.png', label: 'Закладки', page: 'bookmarks' },
        { id: 'Студия создателей', icon: '/menu/project.png', label: 'Студия Создателей', page: 'studio' },
        { id: 'Команда', icon: '/menu/command.png', label: 'Команда', page: 'team' },
        { id: 'Премиум', icon: '/menu/premium.png', label: 'Премиум', page: 'premium' },
        { id: 'Профиль', icon: '/menu/profile.png', label: 'Профиль', page: 'profile' },
        { id: 'Более', icon: '/menu/better.png', label: 'Более', page: 'more' }
    ];

    const tracks = [
        {
            id: 1,
            title: 'Blinding Lights',
            artist: 'The Weeknd',
            album: 'After Hours',
            duration: '3:20',
            cover: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRiHcy_0l0iJEr9v7kqah11L4Y7aNmaxkLzV9Lxk-i27g&s=10'
        },
        {
            id: 2,
            title: 'Starboy',
            artist: 'The Weeknd',
            album: 'Starboy',
            duration: '4:16',
            cover: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTJUkqkUuLBuqBtKfsUwrdPKe3SW-5Worv4h1lF4cUa_g&s=10'
        },
        {
            id: 3,
            title: 'Save Your Tears',
            artist: 'The Weeknd',
            album: 'After Hours',
            duration: '3:35',
            cover: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQPvZDT7T5F71HOZrj5hlJUPJf_Qsg-q4NGN9ioK5vxrg&s=10'
        }
    ];

    const posts = [
        {
            id: 1,
            name: 'Павел Дуров',
            handle: '@durov',
            avatar: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSBXjt3QBuQnsx3pKEV-UpT8XXychSKg9gij_WRs4OY1A&s=10',
            time: '2 ч',
            content: 'Telegram достиг 900 миллионов активных пользователей! Спасибо всем, кто выбирает нашу платформу для общения. Мы продолжаем работать над улучшением безопасности и функциональности. Впереди много интересных обновлений! 🚀',
            image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSq8LU4scR56nOOivsXLOFFWlbx7UNEvvB8PF4qJqRVYA&s=10',
            likes: 1234,
            comments: 89,
            retweets: 234
        },
        {
            id: 2,
            name: 'Дмитрий Нагиев',
            handle: '@nagiev_official',
            avatar: 'https://avatars.mds.yandex.net/i?id=a0629e3b84c2ddbeeb6ee3a0d606f558563ec106-5171197-images-thumbs&n=13',
            time: '3 ч',
            content: 'Друзья, сегодня я хочу поделиться с вами одной историей. Многие спрашивают меня, как я остаюсь в форме и сохраняю позитивный настрой в любых ситуациях. Ответ прост - любовь к своему делу и уважение к зрителям! Когда ты выходишь на сцену и видишь горящие глаза людей, все проблемы уходят на второй план. Помните: жизнь - это не ожидание, а действие! 🎭✨',
            image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR8RR9PGSamrNwfPqAcEho4_T4K-O8F3h7gJdpRXJNIsQ&s=10',
            likes: 5678,
            comments: 345,
            retweets: 789
        },
        {
            id: 3,
            name: 'Сергей Жуков',
            handle: '@zhukov_official',
            avatar: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRd-8LIrbnf-SCygSHIM6pWBiLbpeQk05V0mDx1GuoMyw&s=10',
            time: '2 ч',
            content: 'Сегодня мы записали новую песню! Знаете, что самое удивительное? Прошло уже столько лет, а я до сих пор чувствую тот же трепет, что и в самом начале карьеры. Музыка - это магия, которая объединяет людей. Спасибо всем, кто остаётся с нами все эти годы! Скоро покажем вам что-то особенное! 🎵❤️',
            image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQl48WhTRo7M2KPyCbWMTh5P-7hPCM0D6m5cR4NjqBG_A&s=10',
            likes: 7890,
            comments: 456,
            retweets: 890
        }
    ];

    const handleMenuItemClick = (item) => {
        setActiveItem(item.id);
        setCurrentPage(item.page || 'home');
    };

    const renderContent = () => {
        switch(currentPage) {
            case 'home': 
                return <HomePage posts={posts} activeTab={activeTab} setActiveTab={setActiveTab} />;
            case 'explore': 
                return <ExplorePage suggestedUsers={suggestedUsers} />;
            case 'notifications': 
                return <NotificationsPage suggestedUsers={suggestedUsers} />;
            case 'profile': 
                return <ProfilePage suggestedUsers={suggestedUsers} />;
            case 'chat':  // 👈 Добавьте эту строку
                return <ChatPage />;
            default: 
                return <UnderDevelopmentPage pageName={activeItem} />;
        }
    };

    const handlePlayToggle = () => setIsPlaying(!isPlaying);
    const handleNextTrack = () => setCurrentTrack(prev => (prev + 1) % tracks.length);
    const handlePrevTrack = () => setCurrentTrack(prev => (prev - 1 + tracks.length) % tracks.length);

    return (
        <div className="app">
            <div className={`app-main-wrapper ${currentPage === 'chat' ? 'app-main-wrapper-chat' : ''}`}>
                <div className="app-left-sidebar">
                    <div className="app-left-sidebar-block">
                        <div className="app-logo-wrapper">
                            <img src="/logo.jpg" alt="Логотип" className="app-logo" />
                        </div>
                        
                        <Menu items={menuItems} activeItem={activeItem} onItemClick={handleMenuItemClick} />

                        <div className="app-user-profile">
                            <div className="app-user-avatar">A</div>
                            <div className="app-user-info">
                                <div className="app-user-name">Алексей</div>
                                <div className="app-user-handle">@alexey</div>
                            </div>
                            <div className="app-user-more">•••</div>
                        </div>
                    </div>
                </div>
                
                <div className={`app-center-content ${currentPage === 'chat' ? 'app-center-content-chat' : ''}`}>
                    {renderContent()}
                </div>
                
                <div className={`app-right-sidebar ${currentPage === 'explore' || currentPage === 'chat' ? 'app-right-sidebar-explore-mode' : ''} ${currentPage === 'chat' ? 'app-right-sidebar-hidden' : ''}`}>                    
                
                    {currentPage !== 'explore' && currentPage != 'chat' && (
                        <div className="app-search-wrapper">
                            <input type="search" className="app-search-input" placeholder="Поиск..." />
                        </div>
                    )}

                    {currentPage != 'chat' && (
                        <div className={`app-news-container ${currentPage === 'explore' ? 'app-news-container-explore' : ''}`}>
                            <div className="app-news-header">
                                <h3 className="app-news-title">Последние новости</h3>
                                <div className="app-news-divider">___________________</div>
                            </div>

                            <div className="app-news-list">
                                {[
                                    { title: 'Парень из Москвы собрал $1000000 инвестиций', date: '2 часа назад • IT • 356 постов' },
                                    { title: 'Девушка изобрела руку повар и приготовила ужин', date: '5 часов назад • DevOps • 106 постов' },
                                    { title: 'Парни из Краснодара разработали машину для сплава железа', date: '8 часов назад • DevOps • 582 постов' }
                                ].map((news, i) => (
                                    <div key={i} className="app-news-item">
                                        <h4 className="app-news-item-title">{news.title}</h4>
                                        <div className="app-news-item-meta">
                                            <p className="app-news-item-date">{news.date}</p>
                                        </div>
                                    </div>
                                ))}
                                <button className="app-news-more-btn">Ещё новости</button>
                            </div>
                        </div>
                    )}

                    {currentPage != 'chat' && (
                        <MusicPlayer 
                            tracks={tracks}
                            currentTrack={currentTrack}
                            isPlaying={isPlaying}
                            onPlayToggle={handlePlayToggle}
                            onNext={handleNextTrack}
                            onPrev={handlePrevTrack}
                        />
                    )}

                    {currentPage != 'chat' && (
                        <div className="app-suggestions-block">
                            <div className="app-suggestions-header">
                                <h3 className="app-suggestions-title">За кем следить</h3>
                                <div className="app-suggestions-divider">___________________</div>
                            </div>

                            <div className="app-suggestions-list">
                                {suggestedUsers.map((person) => (
                                    <div key={person.id} className="app-suggestion-item">
                                        <img className="app-suggestion-avatar" src={person.img} alt={person.name} />
                                        <div className="app-suggestion-info">
                                            <h3 className="app-suggestion-name">{person.name}</h3>
                                            <p className="app-suggestion-role">{person.role}</p>
                                        </div>
                                        <div className="app-suggestion-btn-wrapper">
                                            <button className="app-suggestion-follow-btn">Следовать</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button className="app-suggestions-more-btn">Показать ещё</button>
                        </div>
                    )}
                    {currentPage != 'chat' && (
                        <div className="app-terms-block">
                            <p className="app-terms-text">Условия · Конфиденциальность · Доступность · Информация о рекламе · Более <br/>© 2026 Astra · SyreksAI.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default App;
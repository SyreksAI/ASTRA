import React, { useState } from 'react';
import "./static/master.scss";

function Post({ post }) {
    const [liked, setLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(post.likes);

    const handleLike = (e) => {
        e.stopPropagation();
        setLiked(!liked);
        setLikesCount(prev => liked ? prev - 1 : prev + 1);
    };

    return (
        <div className="post">
            <div className="post-header">
                <img src={post.avatar} alt={post.name} className="post-avatar" />
                <div className="post-user-info">
                    <div className="post-user-name">{post.name}</div>
                    <div className="post-user-handle">{post.handle}</div>
                </div>
                <div className="post-time">{post.time}</div>
            </div>
            
            <div className="post-content">{post.content}</div>
            
            {post.image && <img src={post.image} alt="Post" className="post-image" />}
            
            <div className="post-actions">
                <button className="post-action-btn">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.68-4.196 7.11l-8.054 4.46v-3.69h-.067c-4.49.1-8.183-3.51-8.183-8.01zm8.005-6c-3.317 0-6.005 2.69-6.005 6 0 3.37 2.77 6.08 6.138 6.01l.351-.01h1.761v2.3l5.087-2.81c1.951-1.08 3.163-3.13 3.163-5.36 0-3.39-2.744-6.13-6.129-6.13H9.756z"/>
                    </svg>
                    {post.comments}
                </button>
                
                <button className="post-action-btn">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.79 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14-4.432-4.14 1.364-1.46 2.068 1.93V8c0-1.1-.896-2-2-2z"/>
                    </svg>
                    {post.retweets}
                </button>
                
                <button className={`post-action-btn ${liked ? 'liked' : ''}`} onClick={handleLike}>
                    <svg viewBox="0 0 24 24" fill={liked ? '#f91880' : 'currentColor'}>
                        <path d={liked 
                            ? "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                            : "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                        }/>
                    </svg>
                    {likesCount}
                </button>
                
                <button className="post-action-btn">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 3C7.03 3 3 7.03 3 12c0 2.5 1.27 4.85 3.37 6.25l.65.37-.26.72c-.5 1.4-1.42 3.03-2.71 4.87l.12.12c1.5-.38 3.13-1.22 4.75-2.27l.5-.32c.94.2 1.91.3 2.9.3 4.97 0 9-4.03 9-9s-4.03-9-9-9z"/>
                    </svg>
                </button>
            </div>
        </div>
    );
}

function HomePage({ posts, activeTab, setActiveTab }) {
    return (
        <div className="home">
            <div className="Header_block">
                {['Для тебя', 'Следующий'].map(tab => (
                    <p key={tab} 
                       className={`header_link ${activeTab === tab ? 'active' : ''}`}
                       onClick={() => setActiveTab(tab)}>
                        {tab}
                    </p>
                ))}
            </div>
            <div className="feed">
                {posts.map(post => <Post key={post.id} post={post} />)}
            </div>
        </div>
    );
}

function ExplorePage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('Для тебя');

    const categories = ['Для тебя', 'В тренде', 'Новости', 'Спорт', 'Видео'];

    return (
        <div className="explore">
            <div className="explore_header">
                <div className="explore_search">
                    <input type="text" 
                           placeholder="Поиск..." 
                           value={searchQuery}
                           onChange={e => setSearchQuery(e.target.value)}
                           className="search_explore" />
                </div>
                <div className="Menu_search_header">
                    {categories.map(category => (
                        <p 
                            key={category}
                            className={`item_search_header ${activeCategory === category ? 'active' : ''}`}
                            onClick={() => setActiveCategory(category)}
                        >
                            {category}
                        </p>
                    ))}
                </div>
            </div>
            <div className="Result_search">
                <div className="Search_explore_main">
                    <h3>Новости дня</h3>

                    <div className="Search_Result">
                        <div className="News_explore">
                            <p className='Info_News_explore'>Екатерина Леонова — фигуристка взорвала интернет номером под «Лунную сонату»</p>
                            2 часа назад • Спорт • 1253 постов
                        </div>
                        <div className="News_explore">
                            <p className='Info_News_explore'>Кристина Орбакайте — дочь Пугачёвой отправилась в тур по США</p>
                            3 часа назад • Музыка • 476 постов
                        </div>
                        <div className="News_explore">
                            <p className='Info_News_explore'>Владимир Кехман — директор Театра имени Вахтангова и Михайловского театра неожиданно отменил гастроли в Китай</p>
                            5 часа назад • Театр • 218 постов
                        </div>
                        <button className="Search_btn_btn">Смотреть ещё</button>
                    </div>

                    <div className="Search_block">
                        <div className="Search_name">
                            <h3>За кем следовать</h3>
                        </div>

                        <div className="Search_items">
                            {[
                            { name: 'Павел Дуров', role: 'CEO Telegram', img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSBXjt3QBuQnsx3pKEV-UpT8XXychSKg9gij_WRs4OY1A&s=10' },
                            { name: 'Дмитрий Нагиев', role: 'Актёр', img: 'https://avatars.mds.yandex.net/i?id=a0629e3b84c2ddbeeb6ee3a0d606f558563ec106-5171197-images-thumbs&n=13' },
                            { name: 'Егор Крид', role: 'Певец', img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSox8V0ukDUsoxpzJtiA_nZj9wTmVal5asFAoN2u8PZTw&s=10' },
                            { name: 'Сергей Жуков', role: 'Певец', img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRd-8LIrbnf-SCygSHIM6pWBiLbpeQk05V0mDx1GuoMyw&s=10' }
                            ].map((person, i) => (
                            <div key={i} className="Search_block_info">
                                <img className="Search_info_img" src={person.img} alt={person.name} />
                                <div className="Search_info">
                                <h3>{person.name}</h3>
                                <p>{person.role}</p>
                                </div>
                                <div className="Search_btn_block">
                                <button className="Search_btn">Следовать</button>
                                </div>
                            </div>
                            ))}
                        </div>

                        <button className="Search_btn_btn">Смотреть ещё</button>
                    </div>

                    <div className="Search_your_post">
                        
                    </div>
                </div>
            </div>
        </div>
    );
}

function UnderDevelopmentPage({ pageName }) {
    return (
        <div className="under_development">
            <h2>{pageName}</h2>
            <p>Страница "{pageName}" в разработке</p>
            <div className="development_icon">🚧</div>
        </div>
    );
}

function MusicPlayer({ tracks, currentTrack, isPlaying, onPlayToggle, onNext, onPrev }) {
    return (
        <div className="music_player">
            <div className="music_player_header">
                <div className="music_player_title">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                    </svg>
                    <span>Музыка</span>
                </div>
                <div className="music_player_status">
                    {isPlaying ? '▶ Сейчас играет' : '⏸ На паузе'}
                </div>
            </div>

            <div className="music_current_track">
                <img src={tracks[currentTrack].cover} 
                     alt={tracks[currentTrack].title}
                     className="music_cover" />
                <div className="music_track_info">
                    <div className="music_track_title">{tracks[currentTrack].title}</div>
                    <div className="music_track_artist">{tracks[currentTrack].artist}</div>
                    <div className="music_track_album">{tracks[currentTrack].album}</div>
                </div>
            </div>

            <div className="music_progress">
                <div className="music_progress_bar">
                    <div className="music_progress_fill" style={{ width: '45%' }}></div>
                </div>
                <div className="music_time">
                    <span>1:23</span>
                    <span>{tracks[currentTrack].duration}</span>
                </div>
            </div>

            <div className="music_controls">
                <button className="music_control_btn" onClick={onPrev}>
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
                    </svg>
                </button>
                
                <button className={`music_play_btn ${isPlaying ? 'playing' : ''}`} onClick={onPlayToggle}>
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
                
                <button className="music_control_btn" onClick={onNext}>
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
                    </svg>
                </button>
            </div>
        </div>
    );
}

function Menu({ items, activeItem, onItemClick }) {
    return (
        <nav className="Menu">
            {items.map(item => (
                <div key={item.id}
                     className={`Item ${activeItem === item.id ? 'active' : ''}`}
                     onClick={() => onItemClick(item)}>
                    <img src={item.icon} alt={item.label} className="Item_Img" />
                    <span className="Menu_Item">{item.label}</span>
                </div>
            ))}
            <div className="Item">
                <button className="Item_btm" onClick={() => alert('Создание нового поста')}>
                    Создать
                </button>
            </div>
        </nav>
    );
}

function App() {
    const [activeItem, setActiveItem] = useState('Главная');
    const [activeTab, setActiveTab] = useState('Для тебя');
    const [currentPage, setCurrentPage] = useState('home');
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTrack, setCurrentTrack] = useState(0);

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
        setCurrentPage(item.id === 'Главная' ? 'home' : item.id === 'Исследовать' ? 'explore' : 'other');
    };

    const renderContent = () => {
        switch(currentPage) {
            case 'home': return <HomePage posts={posts} activeTab={activeTab} setActiveTab={setActiveTab} />;
            case 'explore': return <ExplorePage />;
            case 'other': return <UnderDevelopmentPage pageName={activeItem} />;
            default: return <HomePage posts={posts} activeTab={activeTab} setActiveTab={setActiveTab} />;
        }
    };

    const handlePlayToggle = () => setIsPlaying(!isPlaying);
    const handleNextTrack = () => setCurrentTrack(prev => (prev + 1) % tracks.length);
    const handlePrevTrack = () => setCurrentTrack(prev => (prev - 1 + tracks.length) % tracks.length);

    return (
        <div className="app">
            <div className="main_block">
                <div className="left_container">
                    <div className="Block">
                        <div className="Logo_Block">
                            <img src="/logo.jpg" alt="Логотип" className="Logo" />
                        </div>
                        
                        <Menu items={menuItems} activeItem={activeItem} onItemClick={handleMenuItemClick} />

                        <div className="UserProfile">
                            <div className="UserAvatar">A</div>
                            <div className="UserInfo">
                                <div className="UserName">Алексей</div>
                                <div className="UserHandle">@alexey</div>
                            </div>
                            <div className="UserMore">•••</div>
                        </div>
                    </div>
                </div>
                
                <div className="center_container">
                    {renderContent()}
                </div>
                
                <div className={`right_container ${currentPage === 'explore' ? 'explore-mode' : ''}`}>
                    {currentPage !== 'explore' && (
                        <div className="search_block">
                            <input type="search" className="search" placeholder="Поиск..." />
                        </div>
                    )}

                    <div className={`news_container ${currentPage === 'explore' ? 'explore-active' : ''}`}>
                        <div className="news_name">
                            <h3>Последние новости</h3>
                            <div className="hr">___________________</div>
                        </div>

                        <div className="news_block">
                            {[
                                { title: 'Парень из Москвы собрал $1000000 инвестиций', date: '2 часа назад • IT • 356 постов' },
                                { title: 'Девушка изобрела руку повар и приготовила ужин', date: '5 часов назад • DevOps • 106 постов' },
                                { title: 'Парни из Краснодара разработали машину для сплава железа', date: '8 часов назад • DevOps • 582 постов' }
                            ].map((news, i) => (
                                <div key={i} className="news_block_info">
                                    <h4 className="news_block_info_name">{news.title}</h4>
                                    <div className="info_date_news">
                                        <p className="date">{news.date}</p>
                                    </div>
                                </div>
                            ))}
                            <button className="news_btn">Ещё новости</button>
                        </div>
                    </div>

                    <MusicPlayer 
                        tracks={tracks}
                        currentTrack={currentTrack}
                        isPlaying={isPlaying}
                        onPlayToggle={handlePlayToggle}
                        onNext={handleNextTrack}
                        onPrev={handlePrevTrack}
                    />

                    <div className="track_block">
                        <div className="track_name">
                            <h3>За кем следить</h3>
                            <div className="hr">___________________</div>
                        </div>

                        <div className="track_items">
                            {[
                                { name: 'Павел Дуров', role: 'CEO Telegram', img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSBXjt3QBuQnsx3pKEV-UpT8XXychSKg9gij_WRs4OY1A&s=10' },
                                { name: 'Дмитрий Нагиев', role: 'Актёр', img: 'https://avatars.mds.yandex.net/i?id=a0629e3b84c2ddbeeb6ee3a0d606f558563ec106-5171197-images-thumbs&n=13' },
                                { name: 'Егор Крид', role: 'Певец', img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSox8V0ukDUsoxpzJtiA_nZj9wTmVal5asFAoN2u8PZTw&s=10' },
                                { name: 'Сергей Жуков', role: 'Певец', img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRd-8LIrbnf-SCygSHIM6pWBiLbpeQk05V0mDx1GuoMyw&s=10' }
                            ].map((person, i) => (
                                <div key={i} className="track_block_info">
                                    <img className="track_info_img" src={person.img} alt={person.name} />
                                    <div className="track_info">
                                        <h3>{person.name}</h3>
                                        <p>{person.role}</p>
                                    </div>
                                    <div className="track_btn_block">
                                        <button className="track_btn">Следовать</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button className="news_btn">Показать ещё</button>
                    </div>

                    <div className="terms_block">
                        <p className="terms">Условия · Конфиденциальность · Доступность · Информация о рекламе · Более <br/>© 2026 Astra · SyreksAI.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App;
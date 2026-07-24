import React, { useState } from 'react';
import { ForYou } from '../explore/ForYou';
import { Trending } from '../explore/Trending';

export function ProfilePage({ suggestedUsers }) {
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
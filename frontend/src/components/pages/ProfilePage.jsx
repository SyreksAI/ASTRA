import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext'; // 👈 ДОБАВЛЯЕМ
import { ForYou } from '../explore/ForYou';
import { Trending } from '../explore/Trending';

export function ProfilePage({ suggestedUsers }) {
    const { user } = useAuth(); // 👈 ПОЛУЧАЕМ ДАННЫЕ ПОЛЬЗОВАТЕЛЯ
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('Посты'); // 👈 ИЗМЕНИЛ НА 'Посты'

    const categories = [
        { id: 'Посты', label: 'Посты' },
        { id: 'Избранное', label: 'Избранное' },
        { id: 'Плей лист', label: 'Плей лист' },
        { id: 'Лайк', label: 'Лайк' }
    ];

    // 👇 ЕСЛИ ПОЛЬЗОВАТЕЛЬ НЕ ЗАГРУЖЕН - ПОКАЗЫВАЕМ ЗАГРУЗКУ
    if (!user) {
        return (
            <div className="profile-page-loading" style={{ padding: '40px', textAlign: 'center' }}>
                <p>Загрузка профиля...</p>
            </div>
        );
    }

    const renderContentSearch = () => {
        switch(activeCategory) {
            case 'Посты':
                return <ForYou suggestedUsers={suggestedUsers} />;
            case 'Избранное':
                return <div style={{ padding: '20px', color: '#536471' }}>Избранные посты</div>;
            case 'Плей лист':
                return <div style={{ padding: '20px', color: '#536471' }}>Ваш плейлист</div>;
            case 'Лайк':
                return <div style={{ padding: '20px', color: '#536471' }}>Понравившиеся посты</div>;
            default:
                return <ForYou suggestedUsers={suggestedUsers} />;
        }
    }

    return (
        <div className="Profile-Page">
            <>
                <img src="cover.png" alt="" className='cover'/>
                <div className="block_info_user">
                    <div className="User_profile_img">
                        <img 
                            className='Profile_img' 
                            src={user?.avatar || '/default-avatar.png'}
                            alt={user?.username} 
                        />
                    </div>
                    <div className="Edit_profile_btn">
                        <button className='Btn_user_Edit_profile'>Edit Profile</button>
                    </div>
                </div>
            </>
            <div className="user_profile_info">
                <p className='puser_profile_name'>{user?.full_name || user?.username}</p>
                <p className='UserName_profile'>@{user?.username}</p>
                <p className='info_user'>{user?.bio || 'Привет! Я использую Astra 🚀'}</p>

                <div className="Activity_profile">
                    <div className="Following">
                        <label>0</label>
                        <p>Подписчики</p>
                    </div>
                    <div className="Like">
                        <label>0</label>
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
                    <div className="profile-page-content">
                    </div>
                </div>
            </div>
        </div>
    )
}
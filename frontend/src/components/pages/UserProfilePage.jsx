import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { PostCard } from '../post/PostCard';

export function UserProfilePage({ onCommentCountChange }) {
    const { username } = useParams();
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();

    const [profile, setProfile] = useState(null);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [avatarFailed, setAvatarFailed] = useState(false);
    const [coverFailed, setCoverFailed] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        setLoading(true);
        setError('');
        setAvatarFailed(false);
        setCoverFailed(false);

        Promise.all([
            fetch(`/api/users/${username}`, { headers }).then((r) => {
                if (!r.ok) throw new Error(r.status === 404 ? 'Пользователь не найден' : 'Ошибка загрузки');
                return r.json();
            }),
            fetch(`/api/users/${username}/posts`, { headers }).then((r) => {
                if (!r.ok) throw new Error('Ошибка загрузки постов');
                return r.json();
            }),
        ])
            .then(([profileData, postsData]) => {
                setProfile(profileData);
                setPosts(postsData);
            })
            .catch((err) => setError(err.message || 'Не удалось загрузить профиль'))
            .finally(() => setLoading(false));
    }, [username]);

    async function handleFollow() {
        if (!profile || followLoading) return;
        setFollowLoading(true);
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        try {
            if (profile.is_following) {
                await fetch(`/api/users/${username}/follow`, { method: 'DELETE', headers });
                setProfile({
                    ...profile,
                    is_following: false,
                    followers_count: Math.max(0, profile.followers_count - 1),
                });
            } else {
                await fetch(`/api/users/${username}/follow`, { method: 'POST', headers });
                setProfile({
                    ...profile,
                    is_following: true,
                    followers_count: profile.followers_count + 1,
                });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setFollowLoading(false);
        }
    }

    async function handleMessage() {
        try {
            const token = localStorage.getItem('token');
            const headers = {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            };
            const response = await fetch('/api/chat/conversations', {
                method: 'POST',
                headers,
                body: JSON.stringify({ user_id: profile.id }),
            });
            if (!response.ok) throw new Error('Не удалось открыть чат');
            const conv = await response.json();
            navigate(`/chat/${conv.id}`);
        } catch (err) {
            console.error(err);
            alert('Не удалось открыть чат');
        }
    }

    if (loading) return <div className="profile-page-loading">Загрузка профиля…</div>;
    if (error) return <div className="profile-page-loading">{error}</div>;
    if (!profile) return null;

    const joinedAt = profile.created_at
        ? new Date(profile.created_at).toLocaleDateString('ru-RU', { year: 'numeric', month: 'long' })
        : null;

    const isMe = profile.is_me || currentUser?.username === profile.username;

    return (
        <section className="Profile-Page">
            <div className="profile-cover" aria-hidden="true">
                {profile.cover_image && !coverFailed && (
                    <img src={profile.cover_image} alt="" onError={() => setCoverFailed(true)} />
                )}
            </div>

            <div className="block_info_user">
                <div className="User_profile_img">
                    <div className="Profile_img profile-avatar-fallback">
                        {(profile.full_name || profile.username || '?').charAt(0).toUpperCase()}
                        {profile.avatar && !avatarFailed && (
                            <img
                                className="profile-avatar-image"
                                src={profile.avatar}
                                alt={profile.username}
                                onError={() => setAvatarFailed(true)}
                            />
                        )}
                    </div>
                </div>

                <div className="Edit_profile_btn">
                    {isMe ? (
                        <button className="Btn_user_Edit_profile" onClick={() => navigate('/profile')}>
                            Редактировать
                        </button>
                    ) : (
                        <>
                            <button
                                className={`Btn_user_Edit_profile ${profile.is_following ? '' : 'Btn-follow'}`}
                                onClick={handleFollow}
                                disabled={followLoading}
                            >
                                {profile.is_following ? 'Отписаться' : 'Подписаться'}
                            </button>
                            <button className="Btn_user_Edit_profile" onClick={handleMessage}>
                                Написать
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="user_profile_info">
                <h1 className="puser_profile_name">{profile.full_name || profile.username}</h1>
                <p className="UserName_profile">@{profile.username}</p>
                {profile.bio && <p className="info_user">{profile.bio}</p>}
                {joinedAt && <p className="profile-joined-date">На Astra с {joinedAt}</p>}

                <div className="profile-stats" style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                    <span><b>{profile.following_count}</b> подписок</span>
                    <span><b>{profile.followers_count}</b> подписчиков</span>
                    <span><b>{profile.posts_count}</b> постов</span>
                </div>

                <div className="profile-page-content home-page-feed">
                    <h2 className="profile-posts-title">Публикации</h2>
                    {posts.length
                        ? posts.map((post) => (
                            <PostCard
                                key={post.id}
                                post={post}
                                onCommentCountChange={onCommentCountChange}
                            />
                        ))
                        : <div className="profile-empty-posts">Пока нет публикаций</div>}
                </div>
            </div>
        </section>
    );
}
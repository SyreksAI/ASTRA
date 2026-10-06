import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PostCard } from '../post/PostCard';

function CameraIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path fill="currentColor" d="M9 3 7.2 5H4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-3.2L15 3H9Zm3 14.5a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9Zm0-2a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
        </svg>
    );
}

export function ProfilePage({ posts = [], onCommentCountChange }) {
    const { user, updateProfile, uploadProfileImage } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [avatarFailed, setAvatarFailed] = useState(false);
    const [coverFailed, setCoverFailed] = useState(false);
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState('');
    const [coverFile, setCoverFile] = useState(null);
    const [coverPreview, setCoverPreview] = useState('');
    const avatarInputRef = useRef(null);
    const coverInputRef = useRef(null);
    const [form, setForm] = useState({ username: '', full_name: '', bio: '' });

    useEffect(() => {
        setAvatarFailed(false);
    }, [user?.avatar]);

    useEffect(() => {
        setCoverFailed(false);
    }, [user?.cover_image]);

    useEffect(() => () => {
        [avatarPreview, coverPreview].forEach((preview) => {
            if (preview.startsWith('blob:')) URL.revokeObjectURL(preview);
        });
    }, [avatarPreview, coverPreview]);

    useEffect(() => {
        if (!isEditing) return;
        setForm({
            username: user?.username || '',
            full_name: user?.full_name || '',
            bio: user?.bio || '',
        });
        setAvatarFile(null);
        setAvatarPreview(user?.avatar || '');
        setCoverFile(null);
        setCoverPreview(user?.cover_image || '');
        setError('');
    }, [isEditing]);

    if (!user) {
        return <div className="profile-page-loading">Загрузка профиля…</div>;
    }

    const displayedAvatar = avatarPreview || user.avatar || '';

    const ownPosts = posts.filter((post) => post.author?.username === user.username);
    const joinedAt = user.created_at
        ? new Date(user.created_at).toLocaleDateString('ru-RU', { year: 'numeric', month: 'long' })
        : null;

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setIsSaving(true);
        const selectedAvatar = avatarFile;
        const selectedCover = coverFile;
        try {
            if (selectedAvatar) await uploadProfileImage(selectedAvatar, 'avatar');
            if (selectedCover) await uploadProfileImage(selectedCover, 'cover');
            await updateProfile(form);
            setIsEditing(false);
        } catch (submitError) {
            setError(submitError.message || 'Не удалось сохранить профиль');
        } finally {
            setIsSaving(false);
        }
    };

    const handleImageChange = (event, imageKind) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            setError('Выберите файл JPG, PNG или WebP');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setError('Размер файла не должен превышать 5 МБ');
            return;
        }
        setError('');
        const preview = URL.createObjectURL(file);
        if (imageKind === 'avatar') {
            setAvatarFailed(false);
            setAvatarFile(file);
            setAvatarPreview(preview);
        } else {
            setCoverFailed(false);
            setCoverFile(file);
            setCoverPreview(preview);
        }
    };

    return (
        <section className="Profile-Page">
            <div className="profile-cover" aria-hidden="true">
                {user.cover_image && !coverFailed && <img src={user.cover_image} alt="" onError={() => setCoverFailed(true)} />}
            </div>
            <div className="block_info_user">
                <div className="User_profile_img">
                    <div className="Profile_img profile-avatar-fallback">
                        {(user.full_name || user.username || '?').charAt(0).toUpperCase()}
                        {displayedAvatar && !avatarFailed && (
                            <img
                                className="profile-avatar-image"
                                src={displayedAvatar}
                                alt={user.username}
                                onError={() => setAvatarFailed(true)}
                            />
                        )}
                    </div>
                </div>
                <div className="Edit_profile_btn">
                    <button className="Btn_user_Edit_profile" onClick={() => setIsEditing(true)}>
                        Редактировать профиль
                    </button>
                </div>
            </div>

            <div className="user_profile_info">
                <h1 className="puser_profile_name">{user.full_name || user.username}</h1>
                <p className="UserName_profile">@{user.username}</p>
                {user.bio ? <p className="info_user">{user.bio}</p> : <p className="profile-empty-bio">Добавьте описание о себе</p>}
                {joinedAt && <p className="profile-joined-date">На Astra с {joinedAt}</p>}

                <div className="profile-page-content home-page-feed">
                    <h2 className="profile-posts-title">Публикации</h2>
                    {ownPosts.length ? ownPosts.map((post) => <PostCard key={post.id} post={post} onCommentCountChange={onCommentCountChange} />) : (
                        <div className="profile-empty-posts">У вас пока нет публикаций</div>
                    )}
                </div>
            </div>

            {isEditing && (
                <div className="modal-overlay profile-edit-overlay" onMouseDown={(event) => {
                    if (event.target === event.currentTarget && !isSaving) setIsEditing(false);
                }}>
                    <form className="profile-edit-dialog" onSubmit={handleSubmit}>
                        <div className="profile-edit-header">
                            <button type="button" className="profile-edit-close" onClick={() => setIsEditing(false)} aria-label="Закрыть">×</button>
                            <h2>Редактировать профиль</h2>
                            <button type="submit" className="profile-edit-save" disabled={isSaving}>
                                {isSaving ? 'Сохранение…' : 'Сохранить'}
                            </button>
                        </div>

                        {error && <div className="profile-edit-error" role="alert">{error}</div>}

                        <div className="profile-edit-media-preview">
                            <div className="profile-edit-cover-preview">
                                {coverPreview && !coverFailed && <img src={coverPreview} alt="Предпросмотр обложки" onError={() => setCoverFailed(true)} />}
                                <button type="button" className="profile-camera-button profile-cover-camera" aria-label="Изменить обложку" onClick={() => coverInputRef.current?.click()}>
                                    <CameraIcon />
                                </button>
                            </div>
                            <div className="profile-edit-avatar-preview">
                                {(user.full_name || user.username || '?').charAt(0).toUpperCase()}
                                {avatarPreview && !avatarFailed && <img src={avatarPreview} alt="Предпросмотр фото профиля" onError={() => setAvatarFailed(true)} />}
                                <button type="button" className="profile-camera-button profile-avatar-camera" aria-label="Изменить фото профиля" onClick={() => avatarInputRef.current?.click()}>
                                    <CameraIcon />
                                </button>
                            </div>
                            <input ref={avatarInputRef} className="profile-edit-file-input" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => handleImageChange(event, 'avatar')} />
                            <input ref={coverInputRef} className="profile-edit-file-input" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => handleImageChange(event, 'cover')} />
                            <p className="profile-edit-media-hint">Нажмите на камеру, чтобы изменить фото или обложку. JPG, PNG или WebP, до 5 МБ.</p>
                        </div>

                        <label className="profile-edit-field">
                            Имя пользователя
                            <input
                                value={form.username}
                                onChange={(event) => setForm({ ...form, username: event.target.value })}
                                minLength={1}
                                maxLength={50}
                                required
                            />
                        </label>
                        <label className="profile-edit-field">
                            Отображаемое имя
                            <input
                                value={form.full_name}
                                onChange={(event) => setForm({ ...form, full_name: event.target.value })}
                                maxLength={100}
                            />
                        </label>
                        <label className="profile-edit-field">
                            О себе
                            <textarea
                                value={form.bio}
                                onChange={(event) => setForm({ ...form, bio: event.target.value })}
                                maxLength={500}
                                rows={4}
                            />
                            <span className="profile-edit-counter">{form.bio.length}/500</span>
                        </label>
                    </form>
                </div>
            )}
        </section>
    );
}

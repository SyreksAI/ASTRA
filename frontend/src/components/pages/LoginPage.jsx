import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AuthSplitShell } from '../auth/AuthSplitShell';
import '../../static/AuthPages.scss';

const MailIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M4 6h16v12H4V6Z" stroke="currentColor" strokeWidth="1.5" />
        <path d="m4 7 8 6 8-6" stroke="currentColor" strokeWidth="1.5" />
    </svg>
);

const LockIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 11V8a4 4 0 1 1 8 0v3" stroke="currentColor" strokeWidth="1.5" />
    </svg>
);

const EyeIcon = ({ off }) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
        {off && <path d="m4 4 16 16" stroke="currentColor" strokeWidth="1.5" />}
    </svg>
);

const GoogleIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
        <path fill="#EA4335" d="M12 10.2v3.6h5.1c-.2 1.2-.9 2.3-1.9 3l3.1 2.4c1.8-1.7 2.9-4.1 2.9-7 0-.7-.1-1.3-.2-1.9H12Z" />
        <path fill="#34A853" d="M6.6 14.3l-.9.7-2.6 2C4.7 19.7 8.1 22 12 22c2.4 0 4.4-.8 5.9-2.1l-3.1-2.4c-.8.6-1.9.9-2.8.9-2.2 0-4-1.5-4.7-3.5Z" />
        <path fill="#FBBC05" d="M3.1 7c-.6 1.1-.9 2.3-.9 3.6s.3 2.5.9 3.6c0 .1 3.5-2.7 3.5-2.7-.2-.6-.3-1.2-.3-1.9s.1-1.3.3-1.9L3.1 7Z" />
        <path fill="#4285F4" d="M12 4.6c1.3 0 2.5.5 3.4 1.3l2.6-2.6C16.4 1.8 14.4 1 12 1 8.1 1 4.7 3.3 3.1 7l3.5 2.7C7.9 6.7 9.8 4.6 12 4.6Z" />
    </svg>
);

const AppleIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M16.7 12.6c0-2.1 1.7-3.1 1.8-3.2-1-1.4-2.5-1.6-3-1.7-1.3-.1-2.5.8-3.1.8-.7 0-1.7-.7-2.8-.7-1.4 0-2.8.9-3.5 2.2-1.5 2.6-.4 6.5 1.1 8.6.7 1 1.6 2.2 2.8 2.1 1.1 0 1.5-.7 2.9-.7 1.3 0 1.7.7 2.8.7 1.2 0 1.9-1 2.6-2 .8-1.2 1.1-2.3 1.1-2.4-.02-.01-2.2-.8-2.2-3.7ZM14.6 6.3c.6-.8 1.1-1.8.9-2.9-1 .1-2.1.7-2.8 1.5-.6.7-1.2 1.8-1 2.8 1.1.1 2.2-.5 2.9-1.4Z" />
    </svg>
);

const VkIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M12.79 16.24s.29-.03.44-.19c.14-.15.13-.43.13-.43s-.02-1.3.59-1.5c.6-.19 1.36 1.26 2.17 1.82.61.42 1.08.33 1.08.33l2.16-.03s1.13-.07.6-.96c-.04-.07-.31-.66-1.61-1.86-1.36-1.26-1.17-1.05.46-3.23.99-1.32 1.39-2.13 1.26-2.48-.12-.33-.84-.24-.84-.24l-2.43.02s-.18-.03-.31.06c-.13.08-.21.26-.21.26s-.38 1.02-.89 1.89c-1.08 1.83-1.51 1.93-1.68 1.81-.41-.27-.31-1.06-.31-1.63 0-1.77.27-2.51-.52-2.7-.26-.06-.46-.11-1.13-.11-.86-.01-1.59 0-2 .25-.28.16-.49.52-.36.54.16.03.52.1.71.38.25.37.24 1.19.24 1.19s.14 2.27-.33 2.55c-.33.19-.77-.2-1.73-1.85-.49-.84-.86-1.77-.86-1.77s-.07-.17-.2-.27c-.15-.11-.37-.15-.37-.15l-2.31.02s-.35.01-.48.16c-.11.13-.01.41-.01.41s1.81 4.23 3.85 6.36c1.88 1.95 4 1.82 4 1.82h.97z" />
    </svg>
);

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(email, password);
            navigate('/');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthSplitShell>
            <header className="auth-landing__head">
                <h2>Твоя вселенная начинается здесь</h2>
                <p>Войдите, чтобы продолжить своё путешествие</p>
            </header>

            {error && <div className="auth-landing__error">{error}</div>}

            <form onSubmit={handleSubmit} className="auth-landing__form">
                <label className="auth-landing__field">
                    <span className="auth-landing__field-icon"><MailIcon /></span>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Введите email"
                        autoComplete="email"
                        required
                    />
                </label>

                <label className="auth-landing__field">
                    <span className="auth-landing__field-icon"><LockIcon /></span>
                    <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Введите пароль"
                        autoComplete="current-password"
                        required
                    />
                    <button
                        type="button"
                        className="auth-landing__field-toggle"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                    >
                        <EyeIcon off={showPassword} />
                    </button>
                </label>

                <div className="auth-landing__field-meta">
                    <Link to="/login" className="auth-landing__link-muted" onClick={(e) => e.preventDefault()}>
                        Забыли пароль?
                    </Link>
                </div>

                <button type="submit" disabled={loading} className="auth-landing__submit">
                    {loading ? 'Вход…' : 'Войти'}
                    <span aria-hidden>→</span>
                </button>
            </form>

            <div className="auth-landing__divider">
                <span>или войдите через</span>
            </div>

            <div className="auth-landing__oauth">
                <button type="button" className="auth-landing__oauth-btn" title="Google" aria-label="Войти через Google">
                    <GoogleIcon />
                </button>
                <button type="button" className="auth-landing__oauth-btn" title="Apple" aria-label="Войти через Apple">
                    <AppleIcon />
                </button>
                <button type="button" className="auth-landing__oauth-btn auth-landing__oauth-btn--vk" title="VK" aria-label="Войти через VK">
                    <VkIcon />
                </button>
            </div>

            <p className="auth-landing__switch">
                Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
            </p>
        </AuthSplitShell>
    );
};

export default LoginPage;

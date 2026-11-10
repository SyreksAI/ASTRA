import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AuthSplitShell } from '../auth/AuthSplitShell';
import '../../static/AuthPages.scss';

const RegisterPage = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        full_name: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await register(formData);
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
                <h2>Создайте аккаунт</h2>
                <p>Присоединяйтесь к сообществу Elara</p>
            </header>

            {error && <div className="auth-landing__error">{error}</div>}

            <form onSubmit={handleSubmit} className="auth-landing__form">
                <label className="auth-landing__field auth-landing__field--plain">
                    <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        placeholder="Имя пользователя"
                        autoComplete="username"
                        required
                    />
                </label>
                <label className="auth-landing__field auth-landing__field--plain">
                    <input
                        type="text"
                        name="full_name"
                        value={formData.full_name}
                        onChange={handleChange}
                        placeholder="Полное имя (необязательно)"
                        autoComplete="name"
                    />
                </label>
                <label className="auth-landing__field auth-landing__field--plain">
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Email"
                        autoComplete="email"
                        required
                    />
                </label>
                <label className="auth-landing__field auth-landing__field--plain">
                    <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Пароль"
                        autoComplete="new-password"
                        required
                    />
                </label>

                <button type="submit" disabled={loading} className="auth-landing__submit">
                    {loading ? 'Регистрация…' : 'Зарегистрироваться'}
                    <span aria-hidden>→</span>
                </button>
            </form>

            <p className="auth-landing__switch">
                Уже есть аккаунт? <Link to="/login">Войти</Link>
            </p>
        </AuthSplitShell>
    );
};

export default RegisterPage;

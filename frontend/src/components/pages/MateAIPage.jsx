import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const SIDE_LINKS = [
    {
        id: 'new',
        label: 'Новый чат',
        action: 'new',
        icon: (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
                <path d="M12 20h9" strokeLinecap="round" />
                <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5Z" strokeLinejoin="round" />
            </svg>
        ),
    },
    {
        id: 'imagine',
        label: 'Imagine',
        icon: (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
                <rect x="3.5" y="3.5" width="17" height="17" rx="4" />
                <circle cx="9" cy="9.5" r="1.4" />
                <path d="M4.2 17.2c2.2-2.6 4-3.8 5.6-3.8 1.8 0 3.1 1.6 5.2 3.8 1.5 1.6 3.2 1.6 4.8.2" strokeLinecap="round" />
            </svg>
        ),
    },
    {
        id: 'library',
        label: 'Библиотека',
        icon: (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
                <path d="M5 5.5A1.5 1.5 0 0 1 6.5 4H10v16H6.5A1.5 1.5 0 0 1 5 18.5v-13Z" strokeLinejoin="round" />
                <path d="M14 4h3.5A1.5 1.5 0 0 1 19 5.5v13a1.5 1.5 0 0 1-1.5 1.5H14V4Z" strokeLinejoin="round" />
                <path d="M10 4h4v16h-4V4Z" strokeLinejoin="round" />
            </svg>
        ),
    },
    {
        id: 'plugins',
        label: 'Плагины',
        icon: (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
                <rect x="3.5" y="3.5" width="7" height="7" rx="1.8" />
                <rect x="13.5" y="3.5" width="7" height="7" rx="1.8" />
                <rect x="3.5" y="13.5" width="7" height="7" rx="1.8" />
                <rect x="13.5" y="13.5" width="7" height="7" rx="1.8" />
            </svg>
        ),
    },
    {
        id: 'explore',
        label: 'Обзор',
        icon: (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
                <circle cx="6" cy="12" r="1.3" fill="currentColor" stroke="none" />
                <circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none" />
                <circle cx="18" cy="12" r="1.3" fill="currentColor" stroke="none" />
            </svg>
        ),
    },
];

const TOOLS = [
    {
        id: 'web',
        label: 'Поиск',
        hint: 'Найди в сети…',
        icon: (
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
                <circle cx="11" cy="11" r="6" /><path d="m16 16 3.5 3.5" strokeLinecap="round" />
            </svg>
        ),
    },
    {
        id: 'file',
        label: 'Файл',
        hint: 'Прикрепи файл…',
        icon: (
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
                <path d="M8 4.5h6l4 4V19a1.5 1.5 0 0 1-1.5 1.5H8A1.5 1.5 0 0 1 6.5 19V6A1.5 1.5 0 0 1 8 4.5Z" strokeLinejoin="round" />
                <path d="M14 4.5V9h4.5" />
            </svg>
        ),
    },
    {
        id: 'image',
        label: 'Фото',
        hint: 'Добавь изображение…',
        icon: (
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
                <rect x="3.5" y="5" width="17" height="14" rx="2.5" />
                <circle cx="9" cy="10" r="1.4" />
                <path d="m3.8 16.5 4.8-4.2 3 2.8 3.1-3.5 5.3 4.9" />
            </svg>
        ),
    },
    {
        id: 'code',
        label: 'Код',
        hint: 'Напиши или разбери код…',
        icon: (
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
                <path d="m8 7-5 5 5 5M16 7l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
    },
    {
        id: 'analysis',
        label: 'Анализ',
        hint: 'Проанализируй…',
        icon: (
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
                <path d="M5 19V9M10 19V5M15 19v-7M20 19V8" strokeLinecap="round" />
            </svg>
        ),
    },
    {
        id: 'idea',
        label: 'Идея',
        hint: 'Придумай идею…',
        icon: (
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
                <path d="M9 18h6M10 21h4" strokeLinecap="round" />
                <path d="M12 3a6 6 0 0 1 3.5 10.8c-.7.5-1.1 1.2-1.2 2H9.7c-.1-.8-.5-1.5-1.2-2A6 6 0 0 1 12 3Z" strokeLinejoin="round" />
            </svg>
        ),
    },
];

const MODELS = [
    { id: 'mate', name: 'Mate' },
    { id: 'grok', name: 'Grok' },
    { id: 'gpt', name: 'GPT' },
    { id: 'deepseek', name: 'DeepSeek' },
    { id: 'claude', name: 'Claude' },
    { id: 'gemini', name: 'Gemini' },
];

const SEED_CHATS = [
    {
        id: 'c1',
        title: 'Нарисовать главную страницу',
        preview: 'Макет главной Elara',
        time: 'сейчас',
    },
    {
        id: 'c2',
        title: 'Улучшения дизайна Elara',
        preview: 'Идеи по визуалу',
        time: 'вчера',
    },
    {
        id: 'c3',
        title: 'Нарисуй главную страницу',
        preview: 'Ещё один вариант героя',
        time: '18 окт',
    },
    {
        id: 'c4',
        title: 'Дизайн главной страницы',
        preview: 'Сетка и типографика',
        time: '17 окт',
    },
    {
        id: 'c5',
        title: 'Нарисуй главную страницу соцсети',
        preview: 'Лента и сайдбары',
        time: '12 окт',
    },
];

function replyFor(prompt) {
    const lower = prompt.toLowerCase();
    if (lower.includes('функц') || lower.includes('elara')) {
        return `Вот несколько направлений для Elara:

1. **Живые орбиты** — статусы созвездий в реальном времени  
2. **MateAI в контексте** — ответы прямо из ленты и чатов  
3. **Карта интересов** — визуальный граф общих созвездий  
4. **Сигналы недели** — подборка сильных постов без шума  

Могу развернуть любую идею в ТЗ или макет экрана.`;
    }
    if (lower.includes('код') || lower.includes('разраб')) {
        return `Могу набросать каркас модуля, API-контракт или пример компонента.

Уточни стек (React / FastAPI) и что важнее сейчас: структура, пример кода или ревью.`;
    }
    if (lower.includes('дизайн')) {
        return `Для Elara держим воздух, мягкий серый фон и бирюзовый акцент.

Могу предложить сетку экрана, иерархию текста и состояния кнопок — скажи, какой экран берём.`;
    }
    return `Принял. Могу помочь с кодом, дизайном, анализом, идеями и учёбой — в спокойном стиле Elara.

Уточни формат: кратко, списком или готовым текстом.`;
}

function renderText(text) {
    return text.split('\n').map((line, i) => {
        if (!line.trim()) return <br key={i} />;
        const parts = line.split(/(\*\*[^*]+\*\*)/g).map((chunk, j) => {
            if (chunk.startsWith('**') && chunk.endsWith('**')) {
                return <strong key={j}>{chunk.slice(2, -2)}</strong>;
            }
            return chunk;
        });
        return <p key={i}>{parts}</p>;
    });
}

export function MateAIPage() {
    const { user } = useAuth();
    const displayName = user?.full_name || user?.username || 'друг';
    const firstName = String(displayName).split(' ')[0];

    const [search, setSearch] = useState('');
    const [searchOpen, setSearchOpen] = useState(false);
    const [chats, setChats] = useState(SEED_CHATS);
    const [activeId, setActiveId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [draft, setDraft] = useState('');
    const [busy, setBusy] = useState(false);
    const [showWelcome, setShowWelcome] = useState(true);
    const [listOpen, setListOpen] = useState(true);
    const [toolsOpen, setToolsOpen] = useState(false);
    const [activeTool, setActiveTool] = useState(null);
    const [modelOpen, setModelOpen] = useState(false);
    const [model, setModel] = useState(MODELS[0]);
    const [modelAuto, setModelAuto] = useState(false);
    const [chatMenuId, setChatMenuId] = useState(null);
    const [chatMenuPos, setChatMenuPos] = useState({ top: 0, left: 0 });
    const stageRef = useRef(null);
    const inputRef = useRef(null);
    const toolsRef = useRef(null);
    const modelRef = useRef(null);
    const chatMenuRef = useRef(null);

    useEffect(() => {
        if (stageRef.current) {
            stageRef.current.scrollTop = stageRef.current.scrollHeight;
        }
    }, [messages, busy, showWelcome]);

    useEffect(() => {
        if (!toolsOpen && !modelOpen && !chatMenuId) return undefined;
        const onKey = (e) => {
            if (e.key === 'Escape') {
                setToolsOpen(false);
                setModelOpen(false);
                setChatMenuId(null);
            }
        };
        const onPointer = (e) => {
            if (toolsOpen && !toolsRef.current?.contains(e.target)) setToolsOpen(false);
            if (modelOpen && !modelRef.current?.contains(e.target)) setModelOpen(false);
            if (
                chatMenuId
                && !chatMenuRef.current?.contains(e.target)
                && !e.target.closest?.('.mateai__row-action[aria-label="Ещё"]')
            ) {
                setChatMenuId(null);
            }
        };
        document.addEventListener('keydown', onKey);
        document.addEventListener('mousedown', onPointer);
        return () => {
            document.removeEventListener('keydown', onKey);
            document.removeEventListener('mousedown', onPointer);
        };
    }, [toolsOpen, modelOpen, chatMenuId]);

    const togglePin = (chatId) => {
        setChats((prev) => prev.map((c) => (
            c.id === chatId ? { ...c, pinned: !c.pinned } : c
        )));
    };

    const renameChat = (chat) => {
        const next = window.prompt('Переименовать чат', chat.title);
        if (!next?.trim()) return;
        setChats((prev) => prev.map((c) => (
            c.id === chat.id ? { ...c, title: next.trim() } : c
        )));
    };

    const deleteChat = (chatId) => {
        setChats((prev) => prev.filter((c) => c.id !== chatId));
        if (activeId === chatId) {
            setActiveId(null);
            setMessages([]);
            setShowWelcome(true);
        }
    };

    const archiveChat = (chatId) => {
        setChats((prev) => prev.filter((c) => c.id !== chatId));
        if (activeId === chatId) {
            setActiveId(null);
            setMessages([]);
            setShowWelcome(true);
        }
    };

    const openChatMenu = (chatId, anchorEl) => {
        if (chatMenuId === chatId) {
            setChatMenuId(null);
            return;
        }
        const rect = anchorEl.getBoundingClientRect();
        const menuW = 232;
        const menuH = 280;
        let left = rect.right + 8;
        if (left + menuW > window.innerWidth - 8) {
            left = Math.max(8, rect.left - menuW - 8);
        }
        let top = rect.top - menuH + rect.height;
        if (top < 8) top = 8;
        if (top + menuH > window.innerHeight - 8) {
            top = Math.max(8, window.innerHeight - menuH - 8);
        }
        setChatMenuPos({ top, left });
        setChatMenuId(chatId);
    };

    const menuChat = chats.find((c) => c.id === chatMenuId) || null;

    const filteredChats = chats.filter((c) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return c.title.toLowerCase().includes(q) || c.preview.toLowerCase().includes(q);
    });

    const openChat = (chat) => {
        setActiveId(chat.id);
        if (chat.id.startsWith('new') || chat.title === 'Новый чат') {
            setShowWelcome(true);
            setMessages([]);
        } else {
            setShowWelcome(false);
            setMessages([
                { id: 'prev-u', role: 'user', content: chat.preview },
                { id: 'prev-a', role: 'assistant', content: replyFor(chat.preview) },
            ]);
        }
    };

    const startNewChat = () => {
        const id = `new-${Date.now()}`;
        setChats((prev) => [
            {
                id,
                title: 'Новый чат',
                preview: 'Начни с любого вопроса…',
                time: 'сейчас',
            },
            ...prev,
        ]);
        setActiveId(id);
        setMessages([]);
        setShowWelcome(true);
        setDraft('');
        inputRef.current?.focus();
    };

    const onSideLink = (link) => {
        if (link.action === 'new') startNewChat();
    };

    const send = async (text) => {
        const prompt = (text ?? draft).trim();
        if (!prompt || busy) return;

        let chatId = activeId;
        if (!chatId) {
            chatId = `new-${Date.now()}`;
            setActiveId(chatId);
            setChats((prev) => [
                {
                    id: chatId,
                    title: prompt.length > 28 ? `${prompt.slice(0, 28)}…` : prompt,
                    preview: prompt,
                    time: 'сейчас',
                },
                ...prev,
            ]);
        } else {
            setChats((prev) => prev.map((c) => (
                c.id === chatId
                    ? {
                        ...c,
                        title: c.title === 'Новый чат'
                            ? (prompt.length > 28 ? `${prompt.slice(0, 28)}…` : prompt)
                            : c.title,
                        preview: prompt,
                        time: 'сейчас',
                    }
                    : c
            )));
        }

        setShowWelcome(false);
        setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: 'user', content: prompt }]);
        setDraft('');
        setBusy(true);

        await new Promise((r) => setTimeout(r, 700));
        setMessages((prev) => [
            ...prev,
            { id: `a-${Date.now()}`, role: 'assistant', content: replyFor(prompt) },
        ]);
        setBusy(false);
        inputRef.current?.focus();
    };

    const onKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            send();
        }
    };

    return (
        <section className={`mateai${listOpen ? '' : ' mateai--list-collapsed'}`}>
            <div className="mateai__bg" aria-hidden>
                <div className="mateai__bg-wash" />
                <svg className="mateai__bg-orbits" viewBox="0 0 1200 800" preserveAspectRatio="xMaxYMin slice">
                    <ellipse cx="980" cy="120" rx="520" ry="210" transform="rotate(-18 980 120)" />
                    <ellipse cx="980" cy="120" rx="380" ry="150" transform="rotate(-18 980 120)" />
                    <ellipse cx="980" cy="120" rx="260" ry="100" transform="rotate(12 980 120)" />
                    <ellipse cx="980" cy="120" rx="700" ry="280" transform="rotate(-28 980 120)" strokeDasharray="2 10" />
                    <ellipse cx="1040" cy="40" rx="640" ry="360" transform="rotate(-22 1040 40)" opacity="0.55" />
                    <ellipse cx="1040" cy="40" rx="820" ry="460" transform="rotate(-8 1040 40)" strokeDasharray="1 12" opacity="0.4" />
                    <circle cx="620" cy="210" r="7" fill="currentColor" stroke="none" opacity="0.35" />
                    <circle cx="560" cy="320" r="12" fill="currentColor" stroke="none" opacity="0.28" />
                    <circle cx="700" cy="390" r="5" fill="currentColor" stroke="none" opacity="0.3" />
                    <circle cx="480" cy="260" r="3.5" fill="currentColor" stroke="none" opacity="0.25" />
                    <circle cx="760" cy="470" r="9" fill="currentColor" stroke="none" opacity="0.22" />
                    <circle cx="420" cy="400" r="2.5" fill="currentColor" stroke="none" opacity="0.2" />
                    <circle cx="880" cy="560" r="6" fill="currentColor" stroke="none" opacity="0.18" />
                    <circle cx="980" cy="620" r="3" fill="currentColor" stroke="none" opacity="0.16" />
                    <circle cx="720" cy="580" r="4" fill="currentColor" stroke="none" opacity="0.14" />
                </svg>
                <div className="mateai__bg-fade" />
            </div>

            <aside className="mateai__list" aria-hidden={!listOpen}>
                <div className="mateai__list-head">
                    <h1>MateAI</h1>
                    <div className="mateai__list-actions">
                        <button
                            type="button"
                            className={`mateai__icon-btn${searchOpen ? ' is-active' : ''}`}
                            onClick={() => setSearchOpen((v) => !v)}
                            aria-label="Поиск"
                            aria-pressed={searchOpen}
                        >
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
                                <circle cx="11" cy="11" r="6" />
                                <path d="m16 16 3.5 3.5" strokeLinecap="round" />
                            </svg>
                        </button>
                        <button
                            type="button"
                            className="mateai__icon-btn"
                            onClick={() => setListOpen(false)}
                            aria-label="Скрыть список чатов"
                        >
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
                                <rect x="3.5" y="4.5" width="17" height="15" rx="3.5" />
                                <path d="M9 4.5v15" strokeLinecap="round" />
                            </svg>
                        </button>
                    </div>
                </div>

                {searchOpen && (
                    <label className="mateai__search">
                        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                            <circle cx="11" cy="11" r="6" />
                            <path d="m16 16 3.5 3.5" strokeLinecap="round" />
                        </svg>
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Поиск чатов..."
                            autoFocus
                        />
                    </label>
                )}

                <nav className="mateai__side-nav" aria-label="Разделы MateAI">
                    {SIDE_LINKS.map((link) => (
                        <button
                            key={link.id}
                            type="button"
                            className="mateai__side-link"
                            onClick={() => onSideLink(link)}
                        >
                            <span className="mateai__side-link-icon">{link.icon}</span>
                            <span>{link.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="mateai__side-scroll">
                    <section className="mateai__side-section">
                        <div className="mateai__side-section-head">
                            <h2>Проекты</h2>
                            <button
                                type="button"
                                className="mateai__side-add"
                                aria-label="Новый проект"
                            >
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                                    <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                                </svg>
                            </button>
                        </div>
                        <p className="mateai__side-empty">Нет проектов</p>
                    </section>

                    <section className="mateai__side-section">
                        <h2>Недавние</h2>
                        <div className="mateai__rows">
                            {filteredChats.map((chat) => (
                                <div
                                    key={chat.id}
                                    className={`mateai__row${activeId === chat.id ? ' is-active' : ''}${chat.pinned ? ' is-pinned' : ''}${chatMenuId === chat.id ? ' is-menu-open' : ''}`}
                                >
                                    <button
                                        type="button"
                                        className="mateai__row-main"
                                        onClick={() => {
                                            setChatMenuId(null);
                                            openChat(chat);
                                        }}
                                    >
                                        <span className="mateai__row-title">{chat.title}</span>
                                    </button>
                                    <div className="mateai__row-actions">
                                        <button
                                            type="button"
                                            className={`mateai__row-action${chatMenuId === chat.id ? ' is-on' : ''}`}
                                            aria-label="Ещё"
                                            aria-expanded={chatMenuId === chat.id}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openChatMenu(chat.id, e.currentTarget);
                                            }}
                                        >
                                            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden>
                                                <circle cx="6" cy="12" r="1.5" />
                                                <circle cx="12" cy="12" r="1.5" />
                                                <circle cx="18" cy="12" r="1.5" />
                                            </svg>
                                        </button>
                                        <button
                                            type="button"
                                            className={`mateai__row-action${chat.pinned ? ' is-on' : ''}`}
                                            aria-label={chat.pinned ? 'Открепить' : 'Закрепить'}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                togglePin(chat.id);
                                            }}
                                        >
                                            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
                                                <path d="M15.5 4.5 19 8l-3.2 1.2-4.8 4.8-1.2 3.2-3.5-3.5 3.2-1.2 4.8-4.8L15.5 4.5Z" strokeLinejoin="round" />
                                                <path d="m9.2 14.8-4.7 4.7" strokeLinecap="round" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </aside>

            <div className="mateai__workspace">
                {!listOpen && (
                    <header className="mateai__chat-head">
                        <button
                            type="button"
                            className="mateai__list-toggle"
                            onClick={() => setListOpen(true)}
                            aria-label="Показать список чатов"
                            aria-expanded={false}
                        >
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
                                <rect x="3.5" y="4.5" width="17" height="15" rx="3.5" />
                                <path d="M9 4.5v15" strokeLinecap="round" />
                            </svg>
                        </button>
                    </header>
                )}

                <div className="mateai__stage" ref={stageRef}>
                    {showWelcome && messages.length === 0 && (
                        <div className="mateai__welcome">
                            <h2>Привет, {firstName}! Чем займёмся сегодня?</h2>
                            <p>
                                Код, дизайн, анализ, идеи и учёба — MateAI помогает думать и делать
                                в спокойном стиле Elara.
                            </p>
                        </div>
                    )}

                    <div className="mateai__thread">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`mateai__bubble-row${msg.role === 'user' ? ' is-mine' : ''}`}
                            >
                                <div className={`mateai__bubble mateai__bubble--${msg.role}`}>
                                    {renderText(msg.content)}
                                </div>
                            </div>
                        ))}
                        {busy && (
                            <div className="mateai__bubble-row">
                                <div className="mateai__bubble mateai__bubble--assistant">
                                    <span className="mateai__typing" aria-label="Печатает">
                                        <i /><i /><i />
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mateai__composer-wrap">
                    <div className="mateai__composer-shell" ref={toolsRef}>
                        {toolsOpen && (
                            <div
                                className="mateai__tools-pop"
                                role="menu"
                                aria-label="Инструменты MateAI"
                            >
                                {TOOLS.map((tool) => (
                                    <button
                                        key={tool.id}
                                        type="button"
                                        role="menuitem"
                                        className="mateai__tools-item"
                                        onClick={() => {
                                            setActiveTool(tool);
                                            setToolsOpen(false);
                                            if (!draft.trim()) setDraft(tool.hint);
                                            inputRef.current?.focus();
                                        }}
                                    >
                                        <span className="mateai__tools-item-icon">{tool.icon}</span>
                                        <span>{tool.label}</span>
                                    </button>
                                ))}
                            </div>
                        )}

                        <form
                            className="mateai__composer"
                            onSubmit={(e) => {
                                e.preventDefault();
                                send();
                            }}
                        >
                            <textarea
                                ref={inputRef}
                                value={draft}
                                onChange={(e) => setDraft(e.target.value)}
                                onKeyDown={onKeyDown}
                                placeholder="Напиши сообщение..."
                                rows={1}
                            />
                            <div className="mateai__composer-bar">
                                <div className="mateai__tools">
                                    <button
                                        type="button"
                                        className={`mateai__tool mateai__tool--plus${toolsOpen ? ' is-open' : ''}`}
                                        aria-label={toolsOpen ? 'Закрыть' : 'Добавить'}
                                        aria-expanded={toolsOpen}
                                        onClick={() => setToolsOpen((v) => !v)}
                                    >
                                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                                            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                                        </svg>
                                    </button>
                                    {activeTool && (
                                        <span className="mateai__active-tool">
                                            {activeTool.icon}
                                            {activeTool.label}
                                            <button
                                                type="button"
                                                aria-label="Сбросить"
                                                onClick={() => setActiveTool(null)}
                                            >
                                                ×
                                            </button>
                                        </span>
                                    )}
                                </div>
                                <div className="mateai__composer-end" ref={modelRef}>
                                    <button
                                        type="button"
                                        className={`mateai__model-btn${modelOpen ? ' is-open' : ''}`}
                                        aria-expanded={modelOpen}
                                        aria-haspopup="listbox"
                                        aria-label={modelAuto ? 'Auto' : model.name}
                                        onClick={() => {
                                            setModelOpen((v) => !v);
                                            setToolsOpen(false);
                                        }}
                                    >
                                        {modelAuto ? 'Auto' : model.name}
                                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                                            <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </button>

                                    {modelOpen && (
                                        <div className="mateai__model-pop" role="listbox" aria-label="Модель">
                                            <label className="mateai__model-auto">
                                                <span>Auto</span>
                                                <button
                                                    type="button"
                                                    className={`mateai__switch${modelAuto ? ' is-on' : ''}`}
                                                    role="switch"
                                                    aria-checked={modelAuto}
                                                    aria-label="Auto"
                                                    onClick={() => setModelAuto((v) => !v)}
                                                >
                                                    <i />
                                                </button>
                                            </label>
                                            <div className="mateai__model-sep" />
                                            {MODELS.map((item) => (
                                                <button
                                                    key={item.id}
                                                    type="button"
                                                    role="option"
                                                    aria-selected={!modelAuto && model.id === item.id}
                                                    className={`mateai__model-option${!modelAuto && model.id === item.id ? ' is-active' : ''}${modelAuto ? ' is-dimmed' : ''}`}
                                                    onClick={() => {
                                                        setModel(item);
                                                        setModelAuto(false);
                                                        setModelOpen(false);
                                                    }}
                                                >
                                                    {item.name}
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        className="mateai__send"
                                        disabled={!draft.trim() || busy}
                                        aria-label="Отправить"
                                    >
                                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                                            <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {menuChat && (
                <div
                    className="mateai__chat-menu"
                    role="menu"
                    aria-label="Действия с чатом"
                    ref={chatMenuRef}
                    style={{ top: chatMenuPos.top, left: chatMenuPos.left }}
                >
                    <button type="button" role="menuitem" className="mateai__chat-menu-item" onClick={() => { renameChat(menuChat); setChatMenuId(null); }}>
                        <span className="mateai__chat-menu-icon" aria-hidden>
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7">
                                <path d="M12 20h9" strokeLinecap="round" />
                                <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5Z" strokeLinejoin="round" />
                            </svg>
                        </span>
                        Переименовать
                    </button>
                    <button type="button" role="menuitem" className="mateai__chat-menu-item" onClick={() => { togglePin(menuChat.id); setChatMenuId(null); }}>
                        <span className="mateai__chat-menu-icon" aria-hidden>
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7">
                                <path d="M15.5 4.5 19 8l-3.2 1.2-4.8 4.8-1.2 3.2-3.5-3.5 3.2-1.2 4.8-4.8L15.5 4.5Z" strokeLinejoin="round" />
                                <path d="m9.2 14.8-4.7 4.7" strokeLinecap="round" />
                            </svg>
                        </span>
                        {menuChat.pinned ? 'Открепить' : 'Закрепить'}
                    </button>
                    <div className="mateai__chat-menu-sep" />
                    <button type="button" role="menuitem" className="mateai__chat-menu-item" onClick={() => setChatMenuId(null)}>
                        <span className="mateai__chat-menu-icon" aria-hidden>
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7">
                                <path d="M12 4v10" strokeLinecap="round" />
                                <path d="m8.5 7.5 3.5-3.5 3.5 3.5" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M5 14v4.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V14" strokeLinecap="round" />
                            </svg>
                        </span>
                        Поделиться
                    </button>
                    <div className="mateai__chat-menu-sep" />
                    <button type="button" role="menuitem" className="mateai__chat-menu-item" onClick={() => { archiveChat(menuChat.id); setChatMenuId(null); }}>
                        <span className="mateai__chat-menu-icon" aria-hidden>
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7">
                                <rect x="3.5" y="4.5" width="17" height="4" rx="1.2" />
                                <path d="M5 8.5v9A1.5 1.5 0 0 0 6.5 19h11a1.5 1.5 0 0 0 1.5-1.5v-9" />
                                <path d="M10 12h4" strokeLinecap="round" />
                            </svg>
                        </span>
                        Архивировать
                    </button>
                    <button type="button" role="menuitem" className="mateai__chat-menu-item is-danger" onClick={() => { deleteChat(menuChat.id); setChatMenuId(null); }}>
                        <span className="mateai__chat-menu-icon" aria-hidden>
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7">
                                <path d="M5 7h14" strokeLinecap="round" />
                                <path d="M9.5 7V5.5A1.5 1.5 0 0 1 11 4h2a1.5 1.5 0 0 1 1.5 1.5V7" />
                                <path d="M8 7l.7 11.2A1.5 1.5 0 0 0 10.2 19.5h3.6a1.5 1.5 0 0 0 1.5-1.3L16 7" />
                            </svg>
                        </span>
                        Удалить
                    </button>
                    <div className="mateai__chat-menu-sep" />
                    <button type="button" role="menuitem" className="mateai__chat-menu-item has-caret" onClick={() => setChatMenuId(null)}>
                        <span className="mateai__chat-menu-icon" aria-hidden>
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7">
                                <path d="M4.5 7.5A2 2 0 0 1 6.5 5.5H10l2 2h5.5A2 2 0 0 1 19.5 9.5v7A2 2 0 0 1 17.5 18.5h-11A2 2 0 0 1 4.5 16.5v-9Z" strokeLinejoin="round" />
                            </svg>
                        </span>
                        <span className="mateai__chat-menu-label">Переместить в проект</span>
                        <svg className="mateai__chat-menu-caret" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                            <path d="m9 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                </div>
            )}
        </section>
    );
}

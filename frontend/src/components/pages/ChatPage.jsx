import React, { useState } from 'react';

export function ChatPage() {
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
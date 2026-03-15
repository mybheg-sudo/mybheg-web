'use client';
import { useState, useRef, useEffect } from 'react';
import MessageBubble from './MessageBubble';

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

function groupMessagesByDate(messages) {
  const groups = [];
  let currentDate = '';
  
  messages.forEach(msg => {
    const d = new Date(msg.timestamp);
    const dateStr = d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
    if (dateStr !== currentDate) {
      currentDate = dateStr;
      groups.push({ type: 'date', date: dateStr });
    }
    groups.push({ type: 'message', data: msg });
  });

  return groups;
}

export default function ChatWindow({ contact, messages, onSendMessage, loading, onToggleProfile }) {
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '42px';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [input]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    const msg = input.trim();
    setInput('');
    setSending(true);
    try {
      await onSendMessage(msg);
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const grouped = groupMessagesByDate(messages || []);

  return (
    <div className="chat-panel">
      {/* Header */}
      <div className="chat-header">
        <div className="avatar">{getInitials(contact?.name || contact?.phone)}</div>
        <div className="chat-header-info">
          <div className="chat-header-name">{contact?.name || contact?.phone}</div>
          <div className="chat-header-status">
            {contact?.phone}
            {contact?.is_manual_mode && <span style={{ color: 'var(--accent-red)', marginLeft: '8px' }}>● Manuel Mod</span>}
          </div>
        </div>
        <div className="chat-header-actions">
          <button className="btn-icon btn-ghost" onClick={onToggleProfile} title="Profil">👤</button>
          <button className="btn-icon btn-ghost" title="Ara">🔍</button>
        </div>
      </div>

      {/* Messages */}
      <div className="messages-container">
        {loading ? (
          <div className="chat-empty">
            <div className="animate-pulse" style={{ color: 'var(--text-muted)' }}>Mesajlar yükleniyor...</div>
          </div>
        ) : grouped.length === 0 ? (
          <div className="chat-empty">
            <div style={{ fontSize: '48px', opacity: 0.3 }}>💬</div>
            <div style={{ color: 'var(--text-muted)' }}>Henüz mesaj yok</div>
          </div>
        ) : (
          grouped.map((item, i) => {
            if (item.type === 'date') {
              return (
                <div key={`date-${i}`} className="message-date-divider">
                  <span>{item.date}</span>
                </div>
              );
            }
            return <MessageBubble key={item.data.id || i} message={item.data} />;
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="message-input-area">
        <div className="message-input-row">
          <div className="message-input-wrapper">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Mesajınızı yazın..."
              rows={1}
              disabled={sending}
            />
          </div>
          <button
            className="send-btn"
            onClick={handleSend}
            disabled={!input.trim() || sending}
            title="Gönder"
          >
            {sending ? '⏳' : '➤'}
          </button>
        </div>
        <div className="message-input-tools">
          <button className="tool-btn">📝 Şablon</button>
          <button className="tool-btn">📎 Dosya</button>
          <button className={`tool-btn ${contact?.is_manual_mode ? 'active' : ''}`}>
            {contact?.is_manual_mode ? '🤖 AI Kapalı' : '🤖 AI Açık'}
          </button>
        </div>
      </div>
    </div>
  );
}

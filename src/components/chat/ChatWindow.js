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
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

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
    if ((!input.trim() && !selectedFile) || sending) return;
    const msg = input.trim();
    setInput('');
    setSending(true);
    try {
      if (selectedFile) {
        // Upload file
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('contact_id', contact.id);
        if (msg) formData.append('caption', msg);
        await fetch('/api/messages/upload', { method: 'POST', body: formData });
        setSelectedFile(null);
        setFilePreview(null);
      } else {
        await onSendMessage(msg);
      }
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => setFilePreview(ev.target.result);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
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
          <button
            className="btn-icon btn-ghost"
            title={contact?.is_manual_mode ? 'AI Moda Geç' : 'Manuel Moda Geç'}
            style={{
              fontSize: '11px', padding: '4px 10px', borderRadius: 'var(--radius-sm)',
              background: contact?.is_manual_mode ? 'rgba(239,68,68,0.12)' : 'rgba(34,197,94,0.12)',
              color: contact?.is_manual_mode ? '#fca5a5' : '#86efac',
              border: 'none', cursor: 'pointer', fontWeight: 600,
            }}
            onClick={async () => {
              const newMode = !contact?.is_manual_mode;
              try {
                await fetch(`/api/contacts/${contact.id}/manual`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ manual: newMode }),
                });
                // Force re-render by parent refetch
                if (onToggleProfile) onToggleProfile();
                setTimeout(() => onToggleProfile && onToggleProfile(), 100);
              } catch(e) { console.error(e); }
            }}
          >
            {contact?.is_manual_mode ? '🤖 AI Moda Geç' : '👤 Manuel Mod'}
          </button>
          <button className="btn-icon btn-ghost" onClick={onToggleProfile} title="Profil">👤</button>
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
            return <MessageBubble key={item.data.id || i} message={item.data} allMessages={messages} />;
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="message-input-area">
        {/* File preview */}
        {selectedFile && (
          <div style={{
            padding: '8px 16px', borderBottom: '1px solid var(--border-primary)',
            display: 'flex', alignItems: 'center', gap: '10px', fontSize: 'var(--text-xs)',
          }}>
            {filePreview ? (
              <img src={filePreview} alt="" style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: '24px' }}>📄</span>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="truncate" style={{ fontWeight: 500 }}>{selectedFile.name}</div>
              <div style={{ color: 'var(--text-muted)' }}>{(selectedFile.size / 1024).toFixed(0)} KB</div>
            </div>
            <button onClick={() => { setSelectedFile(null); setFilePreview(null); }}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '16px' }}>✕</button>
          </div>
        )}
        <div className="message-input-row">
          <div className="message-input-wrapper">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={selectedFile ? 'Açıklama ekleyin (opsiyonel)...' : 'Mesajınızı yazın...'}
              rows={1}
              disabled={sending}
            />
          </div>
          <button
            className="send-btn"
            onClick={handleSend}
            disabled={(!input.trim() && !selectedFile) || sending}
            title="Gönder"
          >
            {sending ? '⏳' : '➤'}
          </button>
        </div>
        <input type="file" ref={fileInputRef} style={{ display: 'none' }}
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx"
          onChange={handleFileSelect}
        />
        <div className="message-input-tools">
          <button className="tool-btn">📝 Şablon</button>
          <button className="tool-btn" onClick={() => fileInputRef.current?.click()}>📎 Dosya</button>
          <button className={`tool-btn ${contact?.is_manual_mode ? 'active' : ''}`}>
            {contact?.is_manual_mode ? '🤖 AI Kapalı' : '🤖 AI Açık'}
          </button>
        </div>
      </div>
    </div>
  );
}

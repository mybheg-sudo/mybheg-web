'use client';

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

function formatTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const now = new Date();
  const diff = now - d;
  const isToday = d.toDateString() === now.toDateString();
  const isYesterday = new Date(now - 86400000).toDateString() === d.toDateString();

  if (isToday) return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  if (isYesterday) return 'Dün';
  if (diff < 7 * 86400000) return d.toLocaleDateString('tr-TR', { weekday: 'short' });
  return d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' });
}

function getPreview(conv) {
  if (conv.last_msg_type === 'image') return '📷 Fotoğraf';
  if (conv.last_msg_type === 'video') return '🎥 Video';
  if (conv.last_msg_type === 'audio') return '🎵 Ses';
  if (conv.last_msg_type === 'document') return '📄 Belge';
  if (conv.last_msg_type === 'sticker') return '🏷️ Çıkartma';
  if (conv.last_msg_type === 'location') return '📍 Konum';
  if (conv.last_button_text) return `🔘 ${conv.last_button_text}`;
  return conv.last_message || '';
}

const filters = [
  { key: 'all', label: 'Tümü' },
  { key: 'unread', label: 'Okunmamış' },
  { key: 'ai', label: '🤖 AI' },
  { key: 'pending', label: '⏳ Bekleyen' },
  { key: 'manual', label: '👤 Manuel' },
];

export default function ConversationList({
  conversations, selectedId, onSelect, filter, onFilterChange, search, onSearchChange, loading
}) {
  return (
    <div className="conversation-list-panel">
      <div className="conversation-list-header">
        <div className="conversation-list-title">
          <h2>💬 Mesajlar</h2>
          <span className="badge badge-gray">{conversations.length}</span>
        </div>
        <div className="search-box">
          <span className="search-box-icon">🔍</span>
          <input
            type="text"
            placeholder="Kişi veya telefon ara..."
            value={search}
            onChange={e => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      <div className="conversation-filters">
        {filters.map(f => (
          <button
            key={f.key}
            className={`filter-btn ${filter === f.key ? 'active' : ''}`}
            onClick={() => onFilterChange(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="conversation-list">
        {loading ? (
          <div className="chat-empty" style={{ padding: '40px 0' }}>
            <div className="animate-pulse" style={{ color: 'var(--text-muted)' }}>Yükleniyor...</div>
          </div>
        ) : conversations.length === 0 ? (
          <div className="chat-empty" style={{ padding: '40px 0' }}>
            <div style={{ fontSize: '32px', opacity: 0.3 }}>📭</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>Sohbet bulunamadı</div>
          </div>
        ) : (
          conversations.map(conv => (
            <div
              key={conv.id}
              className={`conversation-item ${selectedId === conv.id ? 'active' : ''} ${conv.unread_count > 0 ? 'unread' : ''}`}
              onClick={() => onSelect(conv.id)}
            >
              <div className="conversation-avatar">
                <div className="avatar">{getInitials(conv.name || conv.phone)}</div>
              </div>

              <div className="conversation-info">
                <div className="conversation-info-top">
                  <span className="conversation-name">{conv.name || conv.phone}</span>
                  <span className="conversation-time">{formatTime(conv.message_timestamp || conv.updated_at)}</span>
                </div>

                <div className="conversation-preview">
                  <span className="conversation-last-msg">
                    {conv.last_direction === 'outgoing' && <span className="direction-icon">↪</span>}
                    {getPreview(conv).substring(0, 50)}
                  </span>
                  {conv.unread_count > 0 && (
                    <span className="unread-count">{conv.unread_count}</span>
                  )}
                </div>

                {(conv.tags?.length > 0 || conv.is_manual_mode) && (
                  <div className="conversation-tags">
                    {conv.is_manual_mode && <span className="conversation-tag" style={{ background: 'rgba(239,68,68,0.1)', color: '#fca5a5' }}>👤 Manuel</span>}
                    {conv.tags?.slice(0, 2).map((tag, i) => (
                      <span key={i} className="conversation-tag">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

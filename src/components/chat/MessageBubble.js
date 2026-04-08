'use client';

function formatTime(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

function StatusIcon({ status }) {
  switch (status) {
    case 'sent': return <span className="message-status sent">✓</span>;
    case 'delivered': return <span className="message-status delivered">✓✓</span>;
    case 'read': return <span className="message-status read">✓✓</span>;
    case 'failed': return <span className="message-status failed">✗</span>;
    default: return null;
  }
}

function SourceLabel({ source }) {
  switch (source) {
    case 'ai': return <div className="message-source ai">🤖 AI Yanıt</div>;
    case 'system': return <div className="message-source system">⚙️ Sistem</div>;
    case 'broadcast': return <div className="message-source system">📢 Kampanya</div>;
    default: return null;
  }
}

function AttachmentPreview({ message }) {
  const type = message.attachment_type;
  const url = message.attachment_url;
  const filename = message.attachment_filename;
  const caption = message.attachment_caption;

  if (!type) return null;

  if (type === 'image') {
    return (
      <div className="message-attachment">
        <img src={url} alt={caption || 'Resim'} loading="lazy" />
        {caption && <div style={{ padding: '4px 0', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{caption}</div>}
      </div>
    );
  }

  if (type === 'video') {
    return (
      <div className="message-attachment">
        <video src={url} controls style={{ width: '100%', borderRadius: 'var(--radius-md)' }} />
        {caption && <div style={{ padding: '4px 0', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{caption}</div>}
      </div>
    );
  }

  if (type === 'audio') {
    return (
      <div className="message-attachment" style={{ maxWidth: '240px' }}>
        <audio src={url} controls style={{ width: '100%' }} />
      </div>
    );
  }

  // Document / others
  return (
    <div className="message-attachment-file">
      <span className="message-attachment-file-icon">📄</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="truncate" style={{ fontWeight: 500 }}>{filename || 'Dosya'}</div>
        <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>{type}</div>
      </div>
      {url && <a href={url} target="_blank" rel="noopener" style={{ color: 'var(--text-link)', fontSize: 'var(--text-xs)' }}>İndir</a>}
    </div>
  );
}

export default function MessageBubble({ message, allMessages }) {
  const isOutgoing = message.direction === 'outgoing';
  const isButtonReply = message.button_text;
  const hasInteractive = message.interactive_type;

  // Find replied message
  const repliedMsg = message.reply_to_message_id && allMessages
    ? allMessages.find(m => m.whatsapp_message_id === message.reply_to_message_id)
    : null;

  return (
    <div className={`message-row ${isOutgoing ? 'outgoing' : 'incoming'}`}>
      <div className="message-bubble">
        {/* Reply context */}
        {repliedMsg && (
          <div style={{
            padding: '4px 8px', marginBottom: '6px', borderRadius: 'var(--radius-sm)',
            borderLeft: '3px solid var(--accent-purple)', background: 'rgba(167,139,250,0.08)',
            fontSize: 'var(--text-xs)', color: 'var(--text-muted)',
            maxHeight: '40px', overflow: 'hidden',
          }}>
            <div style={{ fontWeight: 600, fontSize: '10px', color: 'var(--accent-purple)', marginBottom: '1px' }}>
              {repliedMsg.direction === 'incoming' ? '↩ Müşteri' : '↩ Sen'}
            </div>
            <div className="truncate">{repliedMsg.content || '📎 Medya'}</div>
          </div>
        )}
        {/* Source label for AI/system messages */}
        {isOutgoing && <SourceLabel source={message.source} />}

        {/* Attachment */}
        <AttachmentPreview message={message} />

        {/* Button reply indicator */}
        {isButtonReply && (
          <div style={{ 
            fontSize: 'var(--text-xs)', 
            color: 'var(--accent-cyan)', 
            marginBottom: 4,
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            🔘 {message.button_text}
          </div>
        )}

        {/* Message content */}
        {message.content && (
          <div className="message-content">{message.content}</div>
        )}

        {/* Interactive buttons (for template messages) */}
        {hasInteractive && message.interactive_data && (
          <div className="message-buttons">
            {(typeof message.interactive_data === 'string' 
              ? JSON.parse(message.interactive_data) 
              : message.interactive_data
            )?.buttons?.map((btn, i) => (
              <div key={i} className="message-btn">{btn.title || btn.text || btn}</div>
            ))}
          </div>
        )}

        {/* Template buttons preview */}
        {message.template_name && message.template_name.includes('order_confirmation') && !hasInteractive && (
          <div className="message-buttons">
            <div className="message-btn">✅ Onayla</div>
            <div className="message-btn" style={{ background: 'rgba(239,68,68,0.1)', color: '#fca5a5' }}>❌ İptal Et</div>
          </div>
        )}

        {/* Meta */}
        <div className="message-meta">
          <span className="message-time">{formatTime(message.timestamp)}</span>
          {isOutgoing && <StatusIcon status={message.status} />}
        </div>

        {/* Reaction */}
        {message.reaction && (
          <span className="message-reaction">{message.reaction}</span>
        )}

        {/* Error */}
        {message.error_message && (
          <div style={{ 
            fontSize: '10px', 
            color: 'var(--accent-red)', 
            marginTop: '2px',
            padding: '2px 6px',
            background: 'rgba(239,68,68,0.08)',
            borderRadius: 'var(--radius-xs)'
          }}>
            ⚠️ {message.error_message}
          </div>
        )}
      </div>
    </div>
  );
}

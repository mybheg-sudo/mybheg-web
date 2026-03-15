'use client';

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

function formatCurrency(amount, currency = 'TRY') {
  if (!amount) return '0 ₺';
  return `${parseFloat(amount).toLocaleString('tr-TR')} ${currency === 'TRY' ? '₺' : currency}`;
}

function StatusBadge({ status }) {
  const map = {
    'PENDING': { cls: 'badge-orange', label: '⏳ Bekliyor' },
    'APPROVED': { cls: 'badge-green', label: '✅ Onaylandı' },
    'REJECTED': { cls: 'badge-red', label: '❌ Reddedildi' },
    'TIMEOUT': { cls: 'badge-gray', label: '⏰ Zaman Aşımı' },
    'ADDRESS_CHANGE': { cls: 'badge-blue', label: '📍 Adres Değişikliği' },
  };
  const badge = map[status] || { cls: 'badge-gray', label: status };
  return <span className={`badge ${badge.cls}`}>{badge.label}</span>;
}

function getSegment(contact) {
  const tags = contact?.tags || [];
  const meta = typeof contact?.metadata === 'string' ? JSON.parse(contact.metadata) : (contact?.metadata || {});
  const segment = meta?.segment;

  const segments = {
    'vip': { icon: '⭐', label: 'VIP Müşteri', cls: 'badge-orange' },
    'loyal': { icon: '💎', label: 'Sadık Müşteri', cls: 'badge-purple' },
    'returning': { icon: '🔄', label: 'Tekrarlayan', cls: 'badge-blue' },
    'engaged': { icon: '💬', label: 'İlgili', cls: 'badge-green' },
    'new': { icon: '🆕', label: 'Yeni', cls: 'badge-gray' },
  };

  if (segment && segments[segment]) return segments[segment];
  if (tags.includes('vip')) return segments['vip'];
  if (tags.includes('loyal')) return segments['loyal'];
  return segments['new'];
}

export default function ContactProfile({ contact, orders, notes, onClose }) {
  const segment = getSegment(contact);

  return (
    <div className="profile-panel">
      <div className="profile-header">
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn-icon btn-ghost" onClick={onClose} style={{ fontSize: '18px' }}>✕</button>
        </div>
        <div className="profile-avatar">{getInitials(contact?.name || contact?.phone)}</div>
        <div className="profile-name">{contact?.name || 'İsimsiz'}</div>
        <div className="profile-phone">{contact?.phone}</div>
        {contact?.email && <div className="profile-phone">{contact.email}</div>}
        <div className="profile-segment">
          <span>{segment.icon}</span> {segment.label}
        </div>
      </div>

      {/* Stats */}
      <div className="profile-section">
        <div className="profile-section-title">İstatistikler</div>
        <div className="profile-stats">
          <div className="profile-stat">
            <div className="profile-stat-value">{contact?.orders_count || orders?.length || 0}</div>
            <div className="profile-stat-label">Sipariş</div>
          </div>
          <div className="profile-stat">
            <div className="profile-stat-value">{formatCurrency(contact?.total_spent)}</div>
            <div className="profile-stat-label">Harcama</div>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      {orders?.length > 0 && (
        <div className="profile-section">
          <div className="profile-section-title">Son Siparişler</div>
          <div className="profile-orders">
            {orders.map(order => (
              <div key={order.id} className="profile-order-item">
                <div>
                  <div className="profile-order-name">{order.order_name || `#${order.id}`}</div>
                  <StatusBadge status={order.status} />
                </div>
                <div className="profile-order-amount">
                  {formatCurrency(order.total_price, order.currency)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tags */}
      {contact?.tags?.length > 0 && (
        <div className="profile-section">
          <div className="profile-section-title">Etiketler</div>
          <div className="profile-tags">
            {contact.tags.map((tag, i) => (
              <span key={i} className="profile-tag">{tag}</span>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      <div className="profile-section">
        <div className="profile-section-title">Operatör Notları</div>
        {notes?.length > 0 ? (
          <div className="profile-notes">
            {notes.map(note => (
              <div key={note.id} className="profile-note">
                <div>{note.note}</div>
                <div className="profile-note-author">— {note.author || 'Bilinmiyor'}</div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>Henüz not eklenmemiş</div>
        )}
      </div>
    </div>
  );
}

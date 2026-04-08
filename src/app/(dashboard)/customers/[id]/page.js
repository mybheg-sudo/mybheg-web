'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

function formatCurrency(amount, currency = 'TRY') {
  if (!amount) return '0 ₺';
  return `${parseFloat(amount).toLocaleString('tr-TR')} ${currency === 'TRY' ? '₺' : currency}`;
}

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateTime(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function StatusBadge({ status }) {
  const map = {
    'PENDING': { cls: 'badge-orange', label: '⏳ Bekliyor' },
    'APPROVED': { cls: 'badge-green', label: '✅ Onaylandı' },
    'REJECTED': { cls: 'badge-red', label: '❌ Reddedildi' },
    'TIMEOUT': { cls: 'badge-gray', label: '⏰ Zaman Aşımı' },
  };
  const b = map[status] || { cls: 'badge-gray', label: status };
  return <span className={`badge ${b.cls}`}>{b.label}</span>;
}

function getSegment(contact) {
  const spent = parseFloat(contact?.total_spent || 0);
  const orders = contact?.orders_count || 0;
  if (spent > 5000) return { icon: '⭐', label: 'VIP Müşteri', cls: 'badge-orange' };
  if (orders > 3) return { icon: '💎', label: 'Sadık', cls: 'badge-purple' };
  if (orders > 1) return { icon: '🔄', label: 'Tekrarlayan', cls: 'badge-blue' };
  return { icon: '🆕', label: 'Yeni', cls: 'badge-gray' };
}

export default function CustomerDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    fetch(`/api/customers/${id}`)
      .then(r => r.json())
      .then(res => { if (res.success) setData(res.data); })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  const addTag = async () => {
    if (!newTag.trim() || !data) return;
    const tags = [...(data.contact.tags || []), newTag.trim()];
    await fetch(`/api/customers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tags }),
    });
    setData(prev => ({ ...prev, contact: { ...prev.contact, tags } }));
    setNewTag('');
  };

  const removeTag = async (tag) => {
    if (!data) return;
    const tags = (data.contact.tags || []).filter(t => t !== tag);
    await fetch(`/api/customers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tags }),
    });
    setData(prev => ({ ...prev, contact: { ...prev.contact, tags } }));
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Yükleniyor...</div>;
  if (!data) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Müşteri bulunamadı</div>;

  const { contact, orders, messages } = data;
  const segment = getSegment(contact);
  const totalSpent = orders.reduce((sum, o) => sum + parseFloat(o.total_price || 0), 0);

  return (
    <>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        <Link href="/customers" style={{ color: 'var(--text-link)', textDecoration: 'none', fontSize: 'var(--text-sm)' }}>← Müşteriler</Link>
        <h1 className="page-title" style={{ margin: 0 }}>{contact.name || contact.phone}</h1>
        <span className={`badge ${segment.cls}`}>{segment.icon} {segment.label}</span>
      </div>

      <div className="page-body" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 'var(--space-4)' }}>
        {/* Left Column — Orders & Messages Timeline */}
        <div>
          {/* Orders */}
          <div style={{
            background: 'var(--surface-card)', borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-primary)', padding: 'var(--space-5)', marginBottom: 'var(--space-4)',
          }}>
            <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>
              📦 Siparişler ({orders.length})
            </h3>
            {orders.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>Henüz sipariş yok</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-primary)' }}>
                    {['Sipariş', 'Durum', 'Tutar', 'Kalem', 'Tarih'].map(h => (
                      <th key={h} style={{
                        padding: 'var(--space-2) var(--space-3)', fontSize: 'var(--text-xs)',
                        fontWeight: 600, color: 'var(--text-muted)', textAlign: 'left', textTransform: 'uppercase',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => (
                    <tr key={order.id} style={{ borderBottom: '1px solid var(--border-primary)' }}>
                      <td style={{ padding: 'var(--space-2) var(--space-3)' }}>
                        <Link href={`/orders/${order.id}`} style={{ color: 'var(--text-link)', textDecoration: 'none', fontWeight: 600 }}>
                          {order.order_name || `#${order.id}`}
                        </Link>
                      </td>
                      <td style={{ padding: 'var(--space-2) var(--space-3)' }}>
                        <StatusBadge status={order.status} />
                      </td>
                      <td style={{ padding: 'var(--space-2) var(--space-3)', fontWeight: 600, color: 'var(--accent-green-light)' }}>
                        {formatCurrency(order.total_price, order.currency)}
                      </td>
                      <td style={{ padding: 'var(--space-2) var(--space-3)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                        {order.item_count} kalem
                      </td>
                      <td style={{ padding: 'var(--space-2) var(--space-3)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                        {formatDate(order.created_at_shopify)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Recent Messages */}
          <div style={{
            background: 'var(--surface-card)', borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-primary)', padding: 'var(--space-5)',
          }}>
            <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>
              💬 Son Mesajlar ({messages.length})
            </h3>
            {messages.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>Henüz mesaj yok</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {messages.map(msg => (
                  <div key={msg.id} style={{
                    display: 'flex', alignItems: 'flex-start', gap: '12px',
                    padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)',
                    background: msg.direction === 'outgoing' ? 'rgba(52,211,153,0.05)' : 'rgba(139,92,246,0.05)',
                  }}>
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '50%', fontSize: '14px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      background: msg.direction === 'outgoing' ? 'rgba(52,211,153,0.15)' : 'rgba(139,92,246,0.15)',
                    }}>
                      {msg.direction === 'outgoing' ? '↗' : '↙'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 'var(--text-sm)', lineHeight: 1.4 }}>
                        {msg.content || (msg.template_name ? `📋 Şablon: ${msg.template_name}` : '(medya)')}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', gap: '8px' }}>
                        <span>{formatDateTime(msg.timestamp)}</span>
                        {msg.source && msg.source !== 'operator' && <span className={`badge badge-${msg.source === 'ai' ? 'purple' : 'gray'}`} style={{ fontSize: '9px', padding: '0 4px' }}>
                          {msg.source === 'ai' ? '🤖 AI' : msg.source}
                        </span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div style={{ marginTop: 'var(--space-3)', textAlign: 'center' }}>
              <Link href="/conversations" style={{ color: 'var(--text-link)', fontSize: 'var(--text-xs)', textDecoration: 'none' }}>
                💬 Sohbete Git →
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column — Contact Info & Tags */}
        <div>
          {/* Contact Card */}
          <div style={{
            background: 'var(--surface-card)', borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-primary)', padding: 'var(--space-5)', marginBottom: 'var(--space-4)',
            textAlign: 'center',
          }}>
            <div className="avatar" style={{ width: '64px', height: '64px', fontSize: '24px', margin: '0 auto var(--space-3)' }}>
              {(contact.name || contact.phone || '?')[0].toUpperCase()}
            </div>
            <div style={{ fontWeight: 700, fontSize: 'var(--text-lg)' }}>{contact.name || 'İsimsiz'}</div>
            <div style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>{contact.phone}</div>
            {contact.email && <div style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>{contact.email}</div>}

            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)',
              marginTop: 'var(--space-4)', paddingTop: 'var(--space-4)',
              borderTop: '1px solid var(--border-primary)',
            }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 'var(--text-lg)', color: 'var(--accent-blue)' }}>{orders.length}</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Sipariş</div>
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 'var(--text-lg)', color: 'var(--accent-green-light)' }}>{formatCurrency(totalSpent)}</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Harcama</div>
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 'var(--text-lg)', color: 'var(--accent-purple)' }}>{contact.message_count || 0}</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Mesaj</div>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div style={{
            background: 'var(--surface-card)', borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-primary)', padding: 'var(--space-5)', marginBottom: 'var(--space-4)',
          }}>
            <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 700, marginBottom: 'var(--space-3)' }}>🏷️ Etiketler</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: 'var(--space-3)' }}>
              {(contact.tags || []).map((tag, i) => (
                <span key={i} style={{
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                  padding: '2px 8px', borderRadius: '12px', fontSize: 'var(--text-xs)',
                  background: 'rgba(139,92,246,0.12)', color: 'var(--accent-purple)',
                }}>
                  {tag}
                  <button onClick={() => removeTag(tag)} style={{
                    background: 'none', border: 'none', color: 'var(--text-muted)',
                    cursor: 'pointer', fontSize: '12px', padding: 0,
                  }}>✕</button>
                </span>
              ))}
              {(contact.tags || []).length === 0 && (
                <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>Etiket yok</span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <input type="text" value={newTag} onChange={e => setNewTag(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addTag()}
                placeholder="Yeni etiket..." style={{ flex: 1, fontSize: 'var(--text-xs)' }} />
              <button className="btn btn-primary btn-sm" onClick={addTag} disabled={!newTag.trim()}>+</button>
            </div>
          </div>

          {/* Quick Info */}
          <div style={{
            background: 'var(--surface-card)', borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-primary)', padding: 'var(--space-5)',
          }}>
            <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 700, marginBottom: 'var(--space-3)' }}>📊 Bilgiler</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <InfoRow label="Kayıt Tarihi" value={formatDate(contact.created_at)} />
              <InfoRow label="Son Mesaj" value={formatDateTime(contact.last_message_at)} />
              <InfoRow label="E-posta Doğrulanmış" value={contact.verified_email ? '✅ Evet' : '❌ Hayır'} />
              <InfoRow label="Pazarlama İzni" value={contact.accepts_marketing ? '✅ Evet' : '❌ Hayır'} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', padding: '4px 0' }}>
      <span style={{ color: 'var(--text-tertiary)' }}>{label}</span>
      <span style={{ fontWeight: 500 }}>{value}</span>
    </div>
  );
}

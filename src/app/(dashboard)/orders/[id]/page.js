'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

const statusMap = {
  'PENDING': { cls: 'badge-orange', label: '⏳ Bekliyor', color: '#f59e0b' },
  'APPROVED': { cls: 'badge-green', label: '✅ Onaylandı', color: '#00d26a' },
  'REJECTED': { cls: 'badge-red', label: '❌ Reddedildi', color: '#ef4444' },
  'TIMEOUT': { cls: 'badge-gray', label: '⏰ Zaman Aşımı', color: '#6b7280' },
  'ADDRESS_CHANGE': { cls: 'badge-blue', label: '📍 Adres Değişikliği', color: '#3b82f6' },
  'IMPORTED': { cls: 'badge-purple', label: '📥 İçe Aktarıldı', color: '#8b5cf6' },
};

const fulfillmentMap = {
  'fulfilled': { cls: 'badge-green', label: '📦 Teslim Edildi' },
  'unfulfilled': { cls: 'badge-orange', label: '📦 Hazırlanıyor' },
  'partial': { cls: 'badge-blue', label: '📦 Kısmi Gönderim' },
  null: { cls: 'badge-gray', label: '📦 Bekliyor' },
};

function formatDate(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString('tr-TR', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatCurrency(val) {
  if (!val) return '—';
  return `${parseFloat(val).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺`;
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchOrder();
  }, [params.id]);

  async function fetchOrder() {
    try {
      const res = await fetch(`/api/orders/${params.id}`);
      const data = await res.json();
      if (data.success) setOrder(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(newStatus) {
    if (!confirm(`Sipariş durumu "${newStatus}" olarak güncellenecek. Onaylıyor musunuz?`)) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/orders/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        await fetchOrder();
      }
    } catch (err) {
      alert('Güncelleme başarısız');
    } finally {
      setUpdating(false);
    }
  }

  if (loading) return (
    <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
      <div className="animate-pulse">Yükleniyor...</div>
    </div>
  );

  if (!order) return (
    <div style={{ padding: '60px', textAlign: 'center' }}>
      <div style={{ fontSize: '48px', opacity: 0.3, marginBottom: '12px' }}>📦</div>
      <div style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>Sipariş bulunamadı</div>
      <Link href="/orders" className="btn btn-primary">← Siparişlere Dön</Link>
    </div>
  );

  const sBadge = statusMap[order.status] || { cls: 'badge-gray', label: order.status, color: '#6b7280' };
  const fBadge = fulfillmentMap[order.fulfillment_status] || fulfillmentMap[null];
  const lineItems = order.line_items || [];
  const fulfillments = order.fulfillments || [];
  const statusLogs = order.status_logs || [];

  // Parse line_items from JSONB if it's the legacy format
  let displayItems = lineItems;
  if (lineItems.length === 0 && order.line_items_json) {
    try { displayItems = JSON.parse(order.line_items_json); } catch(e) {}
  }

  const cardStyle = {
    background: 'var(--surface-card)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border-primary)',
    backdropFilter: 'blur(20px)',
    overflow: 'hidden',
  };

  const cardHeaderStyle = {
    padding: 'var(--space-4) var(--space-5)',
    borderBottom: '1px solid var(--border-primary)',
    fontWeight: 700,
    fontSize: 'var(--text-sm)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const cardBodyStyle = {
    padding: 'var(--space-4) var(--space-5)',
  };

  const infoRowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    padding: 'var(--space-2) 0',
    borderBottom: '1px solid var(--border-primary)',
    fontSize: 'var(--text-sm)',
  };

  return (
    <>
      {/* Header */}
      <div className="page-header">
        <Link href="/orders" style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', textDecoration: 'none', marginRight: '12px' }}>
          ← Siparişler
        </Link>
        <h1 className="page-title">{order.order_name || `Sipariş #${order.id}`}</h1>
        <span className={`badge ${sBadge.cls}`} style={{ marginLeft: '12px' }}>{sBadge.label}</span>
        <div style={{ flex: 1 }} />

        {/* Status Actions */}
        {order.status === 'PENDING' && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-primary" onClick={() => updateStatus('APPROVED')} disabled={updating}>
              ✅ Onayla
            </button>
            <button className="btn btn-ghost" onClick={() => updateStatus('REJECTED')} disabled={updating}
              style={{ color: 'var(--accent-red)' }}>
              ❌ Reddet
            </button>
          </div>
        )}
      </div>

      <div className="page-body">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 'var(--space-5)', alignItems: 'start' }}>
          {/* Left Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>

            {/* Order Items */}
            <div style={cardStyle}>
              <div style={cardHeaderStyle}>
                🛒 Ürün Kalemleri ({displayItems.length})
              </div>
              <div style={{ padding: 0 }}>
                {displayItems.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>Ürün kalemi bulunamadı</div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-primary)' }}>
                        {['Ürün', 'SKU', 'Adet', 'Fiyat', 'Toplam'].map(h => (
                          <th key={h} style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {displayItems.map((item, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid var(--border-primary)' }}>
                          <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              {item.image_url ? (
                                <img src={item.image_url} alt="" style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', objectFit: 'cover', flexShrink: 0 }} />
                              ) : (
                                <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', opacity: 0.3, flexShrink: 0 }}>🏷️</div>
                              )}
                              <div>
                                <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{item.title}</div>
                                {item.variant_title && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{item.variant_title}</div>}
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{item.sku || '—'}</td>
                          <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>{item.quantity}</td>
                          <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-sm)' }}>{formatCurrency(item.price)}</td>
                          <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600, color: 'var(--accent-green-light)' }}>
                            {formatCurrency((item.price || 0) * (item.quantity || 1))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Fulfillments */}
            {fulfillments.length > 0 && (
              <div style={cardStyle}>
                <div style={cardHeaderStyle}>🚚 Kargo Bilgileri</div>
                <div style={cardBodyStyle}>
                  {fulfillments.map((f, i) => (
                    <div key={i} style={{ padding: 'var(--space-3) 0', borderBottom: i < fulfillments.length - 1 ? '1px solid var(--border-primary)' : 'none' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{f.tracking_company || 'Kargo Firması'}</span>
                        <span className={`badge ${f.status === 'success' ? 'badge-green' : 'badge-orange'}`}>{f.status === 'success' ? 'Teslim Edildi' : f.status}</span>
                      </div>
                      {f.tracking_number && (
                        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                          Takip No: <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{f.tracking_number}</span>
                        </div>
                      )}
                      {f.tracking_url && (
                        <a href={f.tracking_url} target="_blank" rel="noopener noreferrer"
                          style={{ fontSize: 'var(--text-xs)', color: 'var(--text-link)', marginTop: '4px', display: 'inline-block' }}>
                          📍 Kargo Takip →
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Status Timeline */}
            {statusLogs.length > 0 && (
              <div style={cardStyle}>
                <div style={cardHeaderStyle}>📋 Durum Geçmişi</div>
                <div style={cardBodyStyle}>
                  {statusLogs.map((log, i) => {
                    const badge = statusMap[log.new_status] || { color: '#6b7280', label: log.new_status };
                    return (
                      <div key={i} style={{
                        display: 'flex', gap: '12px', padding: 'var(--space-2) 0',
                        borderBottom: i < statusLogs.length - 1 ? '1px solid var(--border-primary)' : 'none',
                      }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: badge.color, marginTop: '4px', flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                            {log.old_status ? `${log.old_status} → ` : ''}{log.new_status}
                          </div>
                          {log.note && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: '2px' }}>{log.note}</div>}
                          <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                            {formatDate(log.created_at)} • {log.changed_by || 'system'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right Column — Summary */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>

            {/* Order Summary */}
            <div style={cardStyle}>
              <div style={cardHeaderStyle}>💰 Sipariş Özeti</div>
              <div style={cardBodyStyle}>
                <div style={infoRowStyle}>
                  <span style={{ color: 'var(--text-secondary)' }}>Ara Toplam</span>
                  <span>{formatCurrency(order.subtotal_price)}</span>
                </div>
                {order.total_tax > 0 && (
                  <div style={infoRowStyle}>
                    <span style={{ color: 'var(--text-secondary)' }}>Vergi</span>
                    <span>{formatCurrency(order.total_tax)}</span>
                  </div>
                )}
                {order.total_shipping > 0 && (
                  <div style={infoRowStyle}>
                    <span style={{ color: 'var(--text-secondary)' }}>Kargo</span>
                    <span>{formatCurrency(order.total_shipping)}</span>
                  </div>
                )}
                {order.total_discounts > 0 && (
                  <div style={infoRowStyle}>
                    <span style={{ color: 'var(--text-secondary)' }}>İndirim</span>
                    <span style={{ color: 'var(--accent-red)' }}>-{formatCurrency(order.total_discounts)}</span>
                  </div>
                )}
                <div style={{ ...infoRowStyle, borderBottom: 'none', fontWeight: 700, fontSize: 'var(--text-md)', paddingTop: 'var(--space-3)' }}>
                  <span>Toplam</span>
                  <span style={{ color: 'var(--accent-green-light)' }}>{formatCurrency(order.total_price)}</span>
                </div>
              </div>
            </div>

            {/* Customer Info */}
            <div style={cardStyle}>
              <div style={cardHeaderStyle}>👤 Müşteri</div>
              <div style={cardBodyStyle}>
                <div style={{ fontWeight: 600, fontSize: 'var(--text-md)', marginBottom: '4px' }}>{order.customer_name || '—'}</div>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: '2px' }}>{order.phone_number}</div>
                {order.email && <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: '12px' }}>{order.email}</div>}
                <div style={{ display: 'flex', gap: '12px' }}>
                  <Link href={`/conversations`}
                    style={{ fontSize: 'var(--text-xs)', color: 'var(--text-link)', textDecoration: 'none' }}>
                    💬 Sohbete Git →
                  </Link>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            {order.shipping_address && (() => {
              try {
                const addr = typeof order.shipping_address === 'string' ? JSON.parse(order.shipping_address) : order.shipping_address;
                return (
                  <div style={cardStyle}>
                    <div style={cardHeaderStyle}>📍 Teslimat Adresi</div>
                    <div style={cardBodyStyle}>
                      {addr.name && <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', marginBottom: '4px' }}>{addr.name}</div>}
                      {addr.address1 && <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{addr.address1}</div>}
                      {addr.address2 && <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{addr.address2}</div>}
                      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {[addr.city, addr.province, addr.zip].filter(Boolean).join(', ')}
                      </div>
                      {addr.country && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '2px' }}>{addr.country}</div>}
                      {addr.phone && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: '4px' }}>📞 {addr.phone}</div>}
                    </div>
                  </div>
                );
              } catch { return null; }
            })()}

            {/* Payment & Status */}
            <div style={cardStyle}>
              <div style={cardHeaderStyle}>📊 Durum Bilgisi</div>
              <div style={cardBodyStyle}>
                <div style={infoRowStyle}>
                  <span style={{ color: 'var(--text-secondary)' }}>Sipariş Durumu</span>
                  <span className={`badge ${sBadge.cls}`}>{sBadge.label}</span>
                </div>
                <div style={infoRowStyle}>
                  <span style={{ color: 'var(--text-secondary)' }}>Ödeme</span>
                  <span style={{ fontSize: 'var(--text-sm)' }}>{order.financial_status || '—'}</span>
                </div>
                <div style={infoRowStyle}>
                  <span style={{ color: 'var(--text-secondary)' }}>Kargo</span>
                  <span className={`badge ${fBadge.cls}`}>{fBadge.label}</span>
                </div>
                <div style={infoRowStyle}>
                  <span style={{ color: 'var(--text-secondary)' }}>İlk Mesaj</span>
                  <span>{order.first_message_sent ? '✅ Gönderildi' : '❌ Gönderilmedi'}</span>
                </div>
                <div style={{ ...infoRowStyle, borderBottom: 'none' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Hatırlatma</span>
                  <span>{order.reminder_sent ? '✅ Gönderildi' : '—'}</span>
                </div>
              </div>
            </div>

            {/* Dates */}
            <div style={cardStyle}>
              <div style={cardHeaderStyle}>📅 Tarihler</div>
              <div style={cardBodyStyle}>
                <div style={infoRowStyle}>
                  <span style={{ color: 'var(--text-secondary)' }}>Oluşturulma</span>
                  <span style={{ fontSize: 'var(--text-xs)' }}>{formatDate(order.created_at_shopify || order.created_at)}</span>
                </div>
                <div style={{ ...infoRowStyle, borderBottom: 'none' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Güncelleme</span>
                  <span style={{ fontSize: 'var(--text-xs)' }}>{formatDate(order.updated_at)}</span>
                </div>
              </div>
            </div>

            {/* Internal Note */}
            <div style={cardStyle}>
              <div style={cardHeaderStyle}>📝 Sipariş Notu</div>
              <div style={cardBodyStyle}>
                <textarea
                  id="order-note"
                  defaultValue={order.note || ''}
                  placeholder="Dahili not ekleyin..."
                  rows={3}
                  style={{
                    width: '100%', resize: 'vertical', fontSize: 'var(--text-sm)',
                    background: 'var(--bg-hover)', border: '1px solid var(--border-primary)',
                    borderRadius: 'var(--radius-sm)', padding: 'var(--space-3)',
                    color: 'var(--text-primary)', outline: 'none',
                  }}
                />
                <button
                  className="btn btn-sm"
                  style={{ marginTop: 'var(--space-2)', background: 'var(--accent-purple)', color: '#fff', border: 'none', padding: '6px 16px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: 'var(--text-xs)' }}
                  onClick={async () => {
                    const note = document.getElementById('order-note').value;
                    try {
                      const res = await fetch(`/api/orders/${params.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ note }),
                      });
                      const d = await res.json();
                      if (d.success) alert('Not kaydedildi ✅');
                      else alert('Hata: ' + d.error);
                    } catch(e) { alert('Kaydetme hatası'); }
                  }}
                >💾 Kaydet</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

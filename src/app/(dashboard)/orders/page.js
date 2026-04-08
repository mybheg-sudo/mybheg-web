'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Pagination from '@/components/ui/Pagination';

const statusMap = {
  'PENDING': { cls: 'badge-orange', label: '⏳ Bekliyor' },
  'APPROVED': { cls: 'badge-green', label: '✅ Onaylandı' },
  'REJECTED': { cls: 'badge-red', label: '❌ Reddedildi' },
  'TIMEOUT': { cls: 'badge-gray', label: '⏰ Zaman Aşımı' },
  'ADDRESS_CHANGE': { cls: 'badge-blue', label: '📍 Adres' },
};

const fulfillmentMap = {
  'fulfilled': { cls: 'badge-green', label: '📦 Teslim' },
  'partial': { cls: 'badge-orange', label: '📦 Kısmi' },
  null: { cls: 'badge-gray', label: '📦 Bekliyor' },
  undefined: { cls: 'badge-gray', label: '📦 Bekliyor' },
};

function formatDate(ts) {
  if (!ts) return '-';
  return new Date(ts).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
}

const allStatuses = ['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'TIMEOUT'];

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ status, page: page.toString() });
        if (search) params.set('search', search);
        if (dateFrom) params.set('from', dateFrom);
        if (dateTo) params.set('to', dateTo);
        const res = await fetch(`/api/orders?${params}`);
        const data = await res.json();
        if (data.success) {
          setOrders(data.data);
          setTotal(data.pagination?.total || 0);
        }
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [status, search, page, dateFrom, dateTo]);

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">📦 Siparişler</h1>
        <span className="badge badge-gray" style={{ marginLeft: '8px' }}>{total} sipariş</span>
        <div style={{ flex: 1 }} />
        <div className="search-box" style={{ width: '240px' }}>
          <span className="search-box-icon">🔍</span>
          <input
            type="text"
            placeholder="Sipariş, müşteri, telefon..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <button className="btn btn-ghost btn-sm" style={{ marginLeft: '8px' }}
          onClick={() => {
            const params = new URLSearchParams({ status });
            if (dateFrom) params.set('from', dateFrom);
            if (dateTo) params.set('to', dateTo);
            window.open(`/api/orders/export?${params}`, '_blank');
          }}
        >📥 CSV</button>
      </div>

      <div style={{ padding: 'var(--space-3) var(--space-6)', display: 'flex', gap: 'var(--space-2)', borderBottom: '1px solid var(--border-primary)' }}>
        {allStatuses.map(s => (
          <button
            key={s}
            className={`filter-btn ${status === s ? 'active' : ''}`}
            onClick={() => { setStatus(s); setPage(1); }}
          >
            {s === 'ALL' ? 'Tümü' : statusMap[s]?.label || s}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>📅</span>
          <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }}
            style={{ fontSize: 'var(--text-xs)', padding: '4px 8px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-hover)', border: '1px solid var(--border-primary)', color: 'var(--text-secondary)' }} />
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>—</span>
          <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }}
            style={{ fontSize: 'var(--text-xs)', padding: '4px 8px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-hover)', border: '1px solid var(--border-primary)', color: 'var(--text-secondary)' }} />
          {(dateFrom || dateTo) && (
            <button className="btn btn-ghost btn-sm" onClick={() => { setDateFrom(''); setDateTo(''); setPage(1); }} style={{ fontSize: '10px', padding: '2px 6px' }}>✕</button>
          )}
        </div>
      </div>

      <div className="page-body" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div className="animate-pulse">Yükleniyor...</div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-primary)' }}>
                {['Sipariş', 'Müşteri', 'Telefon', 'Tutar', 'Durum', 'Ödeme', 'Kargo', 'Ürün', 'Tarih'].map(h => (
                  <th key={h} style={{
                    padding: 'var(--space-3) var(--space-4)',
                    textAlign: 'left',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Sipariş bulunamadı</td></tr>
              ) : (
                orders.map(order => {
                  const sBadge = statusMap[order.status] || { cls: 'badge-gray', label: order.status };
                  const fBadge = fulfillmentMap[order.fulfillment_status] || { cls: 'badge-gray', label: order.fulfillment_status || '—' };
                  return (
                    <tr key={order.id} style={{ borderBottom: '1px solid var(--border-primary)', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                      onMouseLeave={e => e.currentTarget.style.background = ''}>
                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                        <Link href={`/orders/${order.id}`} style={{ fontWeight: 600, color: 'var(--text-link)', textDecoration: 'none' }}>{order.order_name || `#${order.id}`}</Link>
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-sm)' }}>{order.customer_name || '—'}</td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{order.phone_number}</td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600, color: 'var(--accent-green-light)' }}>
                        {order.total_price ? `${parseFloat(order.total_price).toLocaleString('tr-TR')} ₺` : '—'}
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}><span className={`badge ${sBadge.cls}`}>{sBadge.label}</span></td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{order.financial_status || '—'}</td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}><span className={`badge ${fBadge.cls}`}>{fBadge.label}</span></td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-sm)', textAlign: 'center' }}>{order.item_count}</td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{formatDate(order.created_at_shopify)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
        <Pagination page={page} total={total} limit={30} onPageChange={setPage} />
      </div>
    </>
  );
}

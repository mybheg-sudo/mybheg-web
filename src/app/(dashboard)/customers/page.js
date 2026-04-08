'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Pagination from '@/components/ui/Pagination';

const segmentMap = {
  'vip': { icon: '⭐', label: 'VIP', cls: 'badge-orange' },
  'loyal': { icon: '💎', label: 'Sadık', cls: 'badge-purple' },
  'returning': { icon: '🔄', label: 'Tekrarlayan', cls: 'badge-blue' },
  'new': { icon: '🆕', label: 'Yeni', cls: 'badge-gray' },
};

const segmentFilters = [
  { key: 'all', label: 'Tümü' },
  { key: 'vip', label: '⭐ VIP' },
  { key: 'returning', label: '🔄 Tekrarlayan' },
  { key: 'new', label: '🆕 Yeni' },
];

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

function formatDate(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [segment, setSegment] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchCustomers = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ segment, page: page.toString() });
        if (search) params.set('search', search);
        const res = await fetch(`/api/customers?${params}`);
        const data = await res.json();
        if (data.success) {
          setCustomers(data.data);
          setTotal(data.pagination?.total || 0);
        }
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCustomers();
  }, [search, segment, page]);

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">👥 Müşteriler</h1>
        <span className="badge badge-gray" style={{ marginLeft: '8px' }}>{total} kişi</span>
        <div style={{ flex: 1 }} />
        <div className="search-box" style={{ width: '280px' }}>
          <span className="search-box-icon">🔍</span>
          <input
            type="text"
            placeholder="İsim, telefon, e-posta..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <button className="btn btn-ghost btn-sm" style={{ marginLeft: '8px' }}
          onClick={() => window.open('/api/customers/export', '_blank')}
        >📥 CSV</button>
      </div>

      <div style={{ padding: 'var(--space-3) var(--space-6)', display: 'flex', gap: 'var(--space-2)', borderBottom: '1px solid var(--border-primary)' }}>
        {segmentFilters.map(f => (
          <button
            key={f.key}
            className={`filter-btn ${segment === f.key ? 'active' : ''}`}
            onClick={() => setSegment(f.key)}
          >
            {f.label}
          </button>
        ))}
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
                {['Müşteri', 'Telefon', 'E-posta', 'Segment', 'Sipariş', 'Harcama', 'Mesaj', 'Son Mesaj', 'Pazarlama'].map(h => (
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
              {customers.length === 0 ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Müşteri bulunamadı</td></tr>
              ) : (
                customers.map(c => {
                  const seg = segmentMap[c.segment] || segmentMap['new'];
                  return (
                    <tr key={c.id} style={{ borderBottom: '1px solid var(--border-primary)', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                      onMouseLeave={e => e.currentTarget.style.background = ''}>
                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div className="avatar avatar-sm">{getInitials(c.name || c.phone)}</div>
                          <div>
                            <Link href={`/customers/${c.id}`} style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--text-link)', textDecoration: 'none' }}>
                              {c.name || c.first_name && `${c.first_name} ${c.last_name || ''}` || 'İsimsiz'}
                            </Link>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{c.phone}</td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{c.email || '—'}</td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}><span className={`badge ${seg.cls}`}>{seg.icon} {seg.label}</span></td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-sm)', textAlign: 'center', fontWeight: 600 }}>{c.orders_count || 0}</td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600, color: 'var(--accent-green-light)', fontSize: 'var(--text-sm)' }}>
                        {c.total_spent ? `${parseFloat(c.total_spent).toLocaleString('tr-TR')} ₺` : '—'}
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-sm)', textAlign: 'center' }}>{c.message_count || 0}</td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{formatDate(c.message_timestamp || c.updated_at)}</td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                        {c.accepts_marketing ? (
                          <span className="badge badge-green">✅ İzin</span>
                        ) : (
                          <span className="badge badge-gray">—</span>
                        )}
                      </td>
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

'use client';
import { useState, useEffect } from 'react';

function formatPrice(min, max) {
  if (!min && !max) return '—';
  const fmt = (v) => parseFloat(v).toLocaleString('tr-TR');
  if (min === max || !max) return `${fmt(min)} ₺`;
  return `${fmt(min)} — ${fmt(max)} ₺`;
}

function StockBadge({ stock }) {
  if (stock === null || stock === undefined) return <span className="badge badge-gray">—</span>;
  if (stock <= 0) return <span className="badge badge-red">Stokta Yok</span>;
  if (stock <= 5) return <span className="badge badge-orange">Az Stok ({stock})</span>;
  return <span className="badge badge-green">{stock} adet</span>;
}

const statusFilters = [
  { key: 'all', label: 'Tümü' },
  { key: 'active', label: '🟢 Aktif' },
  { key: 'draft', label: '📝 Taslak' },
  { key: 'archived', label: '📦 Arşiv' },
];

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ status });
        if (search) params.set('search', search);
        const res = await fetch(`/api/products?${params}`);
        const data = await res.json();
        if (data.success) {
          setProducts(data.data);
          setTotal(data.pagination?.total || 0);
        }
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [search, status]);

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">🏷️ Ürünler</h1>
        <span className="badge badge-gray" style={{ marginLeft: '8px' }}>{total} ürün</span>
        <div style={{ flex: 1 }} />
        <div className="search-box" style={{ width: '280px' }}>
          <span className="search-box-icon">🔍</span>
          <input
            type="text"
            placeholder="Ürün adı, marka, kategori..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div style={{ padding: 'var(--space-3) var(--space-6)', display: 'flex', gap: 'var(--space-2)', borderBottom: '1px solid var(--border-primary)' }}>
        {statusFilters.map(f => (
          <button
            key={f.key}
            className={`filter-btn ${status === f.key ? 'active' : ''}`}
            onClick={() => setStatus(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="page-body" style={{ padding: 'var(--space-4) var(--space-6)' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            <div className="animate-pulse">Yükleniyor...</div>
          </div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '48px', opacity: 0.3, marginBottom: '12px' }}>🏷️</div>
            Ürün bulunamadı
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 'var(--space-4)',
          }}>
            {products.map(product => (
              <div key={product.id} style={{
                background: 'var(--surface-card)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-primary)',
                overflow: 'hidden',
                transition: 'all var(--transition-fast)',
                cursor: 'pointer',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-secondary)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-primary)'; e.currentTarget.style.transform = ''; }}
              >
                {/* Image */}
                <div style={{
                  height: '160px',
                  background: 'var(--bg-tertiary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}>
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: '40px', opacity: 0.2 }}>🏷️</span>
                  )}
                </div>

                {/* Info */}
                <div style={{ padding: 'var(--space-4)' }}>
                  <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', gap: '8px', marginBottom: '6px' }}>
                    <h3 className="truncate" style={{ fontSize: 'var(--text-sm)', fontWeight: 600, flex: 1 }}>{product.title}</h3>
                    <span className={`badge ${product.status === 'active' ? 'badge-green' : product.status === 'draft' ? 'badge-orange' : 'badge-gray'}`} style={{ flexShrink: 0 }}>
                      {product.status === 'active' ? 'Aktif' : product.status === 'draft' ? 'Taslak' : product.status}
                    </span>
                  </div>

                  {product.vendor && (
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: '8px' }}>
                      {product.vendor} {product.product_type && `• ${product.product_type}`}
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--accent-green-light)' }}>
                      {formatPrice(product.min_price, product.max_price)}
                    </span>
                    <StockBadge stock={product.total_stock} />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                      {product.variant_count || 0} varyant
                    </span>
                    {product.tags && (
                      <div style={{ display: 'flex', gap: '3px' }}>
                        {product.tags.split(',').slice(0, 2).map((t, i) => (
                          <span key={i} className="badge badge-purple" style={{ fontSize: '9px' }}>{t.trim()}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

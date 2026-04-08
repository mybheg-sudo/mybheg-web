'use client';
import { useState, useEffect } from 'react';

const categoryIcons = {
  'MARKETING': '📢',
  'UTILITY': '⚙️',
  'AUTHENTICATION': '🔐',
};

const statusColors = {
  'APPROVED': 'badge-green',
  'PENDING': 'badge-orange',
  'REJECTED': 'badge-red',
};

export default function TemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await fetch('/api/templates');
        const data = await res.json();
        if (data.success) setTemplates(data.data);
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTemplates();
  }, []);

  const filtered = categoryFilter === 'ALL'
    ? templates
    : templates.filter(t => t.category === categoryFilter);

  const categories = ['ALL', ...new Set(templates.map(t => t.category).filter(Boolean))];

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">📝 Mesaj Şablonları</h1>
        <span className="badge badge-gray" style={{ marginLeft: '8px' }}>{templates.length} şablon</span>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          {categories.map(c => (
            <button key={c} className={`filter-btn ${categoryFilter === c ? 'active' : ''}`}
              onClick={() => setCategoryFilter(c)}>
              {c === 'ALL' ? 'Tümü' : `${categoryIcons[c] || '📋'} ${c}`}
            </button>
          ))}
        </div>
      </div>
      <div className="page-body">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            <div className="animate-pulse">Yükleniyor...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '48px', opacity: 0.3, marginBottom: '12px' }}>📝</div>
            Şablon bulunamadı
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: 'var(--space-4)',
          }}>
            {filtered.map(t => (
              <div key={t.id} style={{
                background: 'var(--surface-card)',
                borderRadius: 'var(--radius-lg)',
                border: selected === t.id ? '2px solid var(--accent-purple)' : '1px solid var(--border-primary)',
                padding: 'var(--space-5)',
                backdropFilter: 'blur(20px)',
                cursor: 'pointer',
                transition: 'border-color 0.15s, transform 0.1s',
              }}
                onClick={() => setSelected(selected === t.id ? null : t.id)}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{categoryIcons[t.category] || '📋'}</span>
                    <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{t.name}</span>
                  </div>
                  <span className={`badge ${statusColors[t.status] || 'badge-gray'}`}>
                    {t.status === 'APPROVED' ? '✅ Onaylı' : t.status === 'PENDING' ? '⏳ Bekliyor' : t.status}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
                  <span className="badge badge-gray">{t.language || 'tr'}</span>
                  <span className="badge badge-purple">{t.category || '—'}</span>
                  {t.header_type && <span className="badge badge-blue">{t.header_type}</span>}
                </div>

                {/* Body Preview */}
                {t.body_text && (
                  <div style={{
                    background: 'var(--msg-outgoing)',
                    border: '1px solid var(--msg-outgoing-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--space-3)',
                    fontSize: 'var(--text-xs)',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.5,
                    maxHeight: selected === t.id ? 'none' : '80px',
                    overflow: 'hidden',
                    whiteSpace: 'pre-wrap',
                  }}>
                    {t.body_text}
                  </div>
                )}

                {/* Footer */}
                {t.footer_text && (
                  <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '4px', fontStyle: 'italic' }}>
                    {t.footer_text}
                  </div>
                )}

                {/* Buttons */}
                {t.buttons && (() => {
                  try {
                    const btns = typeof t.buttons === 'string' ? JSON.parse(t.buttons) : t.buttons;
                    return btns?.length > 0 ? (
                      <div style={{ display: 'flex', gap: '4px', marginTop: 'var(--space-2)', flexWrap: 'wrap' }}>
                        {btns.map((btn, i) => (
                          <span key={i} className="badge badge-blue">{btn.text || btn.title || btn}</span>
                        ))}
                      </div>
                    ) : null;
                  } catch { return null; }
                })()}

                {/* Variables */}
                {selected === t.id && t.variables && (
                  <div style={{ marginTop: 'var(--space-3)', padding: 'var(--space-3)', background: 'var(--bg-hover)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)' }}>
                    <div style={{ fontWeight: 600, marginBottom: '4px', color: 'var(--text-muted)' }}>🔧 Değişkenler:</div>
                    <div style={{ color: 'var(--text-secondary)' }}>
                      {typeof t.variables === 'string' ? t.variables : JSON.stringify(t.variables)}
                    </div>
                  </div>
                )}

                {/* Meta info when expanded */}
                {selected === t.id && (
                  <div style={{ marginTop: 'var(--space-3)', fontSize: '10px', color: 'var(--text-tertiary)', display: 'flex', gap: 'var(--space-4)' }}>
                    <span>ID: {t.meta_template_id || t.id}</span>
                    <span>Güncelleme: {t.updated_at ? new Date(t.updated_at).toLocaleDateString('tr-TR') : '—'}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

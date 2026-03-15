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

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">📝 Mesaj Şablonları</h1>
        <span className="badge badge-gray" style={{ marginLeft: '8px' }}>{templates.length} şablon</span>
      </div>
      <div className="page-body">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            <div className="animate-pulse">Yükleniyor...</div>
          </div>
        ) : templates.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '48px', opacity: 0.3, marginBottom: '12px' }}>📝</div>
            Henüz şablon tanımlanmamış
            <div style={{ fontSize: 'var(--text-xs)', marginTop: '8px', color: 'var(--text-tertiary)' }}>
              WhatsApp Business Manager üzerinden şablon oluşturun
            </div>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: 'var(--space-4)',
          }}>
            {templates.map(t => {
              let components = t.components;
              if (typeof components === 'string') {
                try { components = JSON.parse(components); } catch { components = null; }
              }
              const bodyComp = Array.isArray(components) ? components.find(c => c.type === 'BODY') : null;
              const buttonsComp = Array.isArray(components) ? components.find(c => c.type === 'BUTTONS') : null;

              return (
                <div key={t.id} style={{
                  background: 'var(--surface-card)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-primary)',
                  padding: 'var(--space-5)',
                  backdropFilter: 'blur(20px)',
                }}>
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
                  </div>

                  {bodyComp?.text && (
                    <div style={{
                      background: 'var(--msg-outgoing)',
                      border: '1px solid var(--msg-outgoing-border)',
                      borderRadius: 'var(--radius-md)',
                      padding: 'var(--space-3)',
                      fontSize: 'var(--text-xs)',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.5,
                      maxHeight: '120px',
                      overflow: 'hidden',
                    }}>
                      {bodyComp.text}
                    </div>
                  )}

                  {buttonsComp?.buttons && (
                    <div style={{ display: 'flex', gap: '4px', marginTop: 'var(--space-2)' }}>
                      {buttonsComp.buttons.map((btn, i) => (
                        <span key={i} className="badge badge-blue">{btn.text || btn.title}</span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

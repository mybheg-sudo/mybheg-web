'use client';
import { useState } from 'react';

export default function CampaignsPage() {
  const [activeTab, setActiveTab] = useState('active');

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">📢 Kampanyalar</h1>
        <div style={{ flex: 1 }} />
        <button className="btn btn-primary">+ Yeni Kampanya</button>
      </div>

      <div style={{ padding: 'var(--space-3) var(--space-6)', display: 'flex', gap: 'var(--space-2)', borderBottom: '1px solid var(--border-primary)' }}>
        {[
          { key: 'active', label: '🟢 Aktif' },
          { key: 'scheduled', label: '📅 Planlanmış' },
          { key: 'completed', label: '✅ Tamamlanan' },
          { key: 'draft', label: '📝 Taslak' },
        ].map(t => (
          <button key={t.key} className={`filter-btn ${activeTab === t.key ? 'active' : ''}`} onClick={() => setActiveTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="page-body">
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '48px', opacity: 0.3, marginBottom: '12px' }}>📢</div>
          <div style={{ fontSize: 'var(--text-lg)', fontWeight: 500, marginBottom: '8px' }}>Kampanya Yönetimi</div>
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', maxWidth: '400px', margin: '0 auto', lineHeight: 1.7 }}>
            WhatsApp üzerinden toplu mesaj kampanyaları oluşturun. Müşteri segmentlerine göre hedefli mesajlar gönderin.
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 'var(--space-4)',
            maxWidth: '600px',
            margin: '32px auto 0',
          }}>
            <div style={{ background: 'var(--surface-card)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)', border: '1px solid var(--border-primary)' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>🎯</div>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>Segment Seçimi</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '4px' }}>VIP, yeni, tekrarlayan</div>
            </div>
            <div style={{ background: 'var(--surface-card)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)', border: '1px solid var(--border-primary)' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>📝</div>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>Şablon Kullan</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '4px' }}>Meta onaylı templates</div>
            </div>
            <div style={{ background: 'var(--surface-card)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)', border: '1px solid var(--border-primary)' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>📊</div>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>Performans</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '4px' }}>Gönderim+okunma oranı</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

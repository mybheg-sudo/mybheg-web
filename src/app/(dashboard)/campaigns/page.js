'use client';
import { useState } from 'react';

export default function CampaignsPage() {
  const [activeTab, setActiveTab] = useState('active');

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">📢 Kampanyalar</h1>
        <div style={{ flex: 1 }} />
        <button className="btn btn-primary" onClick={() => setActiveTab('new')}>+ Yeni Kampanya</button>
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
        {activeTab === 'new' ? (
          <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
            <h2 style={{ marginBottom: '20px' }}>Yeni Kampanya Oluştur</h2>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              try {
                const res = await fetch('/api/campaigns', {
                  method: 'POST',
                  body: JSON.stringify(Object.fromEntries(formData)),
                  headers: { 'Content-Type': 'application/json' }
                });
                if (res.ok) {
                  alert('Kampanya başarıyla n8n kuyruğuna gönderildi!');
                  setActiveTab('active');
                } else {
                  alert('Hata oluştu!');
                }
              } catch(err) {
                alert('Bağlantı hatası.');
              }
            }}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Hedef Segment</label>
                <select name="segment" style={{ width: '100%', padding: '10px', borderRadius: '5px' }} required>
                  <option value="vip">VIP Müşteriler (&gt;5000₺)</option>
                  <option value="returning">Tekrarlayan Müşteriler</option>
                  <option value="all">Tüm Müşteriler</option>
                </select>
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Mesaj İçeriği</label>
                <textarea name="message" style={{ width: '100%', padding: '10px', borderRadius: '5px', minHeight: '100px' }} required placeholder="Kampanya mesajınızı yazın..."></textarea>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Kampanyayı Başlat (n8n Webhook)</button>
            </form>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '48px', opacity: 0.3, marginBottom: '12px' }}>📢</div>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 500, marginBottom: '8px' }}>Kampanya Yönetimi</div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', maxWidth: '400px', margin: '0 auto', lineHeight: 1.7 }}>
              WhatsApp üzerinden toplu mesaj kampanyaları oluşturun. Müşteri segmentlerine göre hedefli mesajlar gönderin.
            </div>
          </div>
        )}
      </div>
    </>
  );
}

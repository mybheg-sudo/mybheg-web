'use client';
import { useState, useEffect } from 'react';

export default function CampaignsPage() {
  const [activeTab, setActiveTab] = useState('active');
  const [templates, setTemplates] = useState([]);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetch('/api/templates')
      .then(r => r.json())
      .then(d => { if (d.success) setTemplates(d.data.filter(t => t.status === 'APPROVED')); })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    const formData = new FormData(e.target);
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        body: JSON.stringify(Object.fromEntries(formData)),
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.success) {
        alert(`✅ Kampanya gönderildi! ${data.count || ''} kişiye ulaşılacak.`);
        setActiveTab('active');
        e.target.reset();
      } else {
        alert('❌ Hata: ' + (data.error || 'Bilinmeyen hata'));
      }
    } catch(err) {
      alert('Bağlantı hatası.');
    } finally {
      setSending(false);
    }
  };

  const formStyle = {
    background: 'var(--surface-card)', borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border-primary)', padding: 'var(--space-6)',
    maxWidth: '640px', margin: '0 auto',
  };

  const labelStyle = {
    display: 'block', marginBottom: '6px', fontWeight: 600,
    fontSize: 'var(--text-sm)', color: 'var(--text-secondary)',
  };

  const inputStyle = {
    width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)',
    background: 'var(--bg-hover)', border: '1px solid var(--border-primary)',
    color: 'var(--text-primary)', fontSize: 'var(--text-sm)', outline: 'none',
  };

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
          { key: 'completed', label: '✅ Tamamlanan' },
          { key: 'new', label: '📝 Yeni Oluştur' },
        ].map(t => (
          <button key={t.key} className={`filter-btn ${activeTab === t.key ? 'active' : ''}`} onClick={() => setActiveTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="page-body">
        {activeTab === 'new' ? (
          <form onSubmit={handleSubmit} style={formStyle}>
            <h2 style={{ marginBottom: 'var(--space-5)', fontSize: 'var(--text-lg)' }}>🚀 Yeni Kampanya Oluştur</h2>

            <div style={{ marginBottom: 'var(--space-4)' }}>
              <label style={labelStyle}>Kampanya Adı</label>
              <input name="name" style={inputStyle} required placeholder="Örn: Yaz indirimi 2026" />
            </div>

            <div style={{ marginBottom: 'var(--space-4)' }}>
              <label style={labelStyle}>Hedef Segment</label>
              <select name="segment" style={inputStyle} required>
                <option value="all">📋 Tüm Müşteriler</option>
                <option value="vip">⭐ VIP Müşteriler (&gt;5000₺)</option>
                <option value="returning">🔄 Tekrarlayan Müşteriler (2+ sipariş)</option>
                <option value="new">🆕 Yeni Müşteriler (son 30 gün)</option>
                <option value="inactive">😴 Pasif (60+ gün mesaj yok)</option>
              </select>
            </div>

            <div style={{ marginBottom: 'var(--space-4)' }}>
              <label style={labelStyle}>Mesaj Tipi</label>
              <select name="type" style={inputStyle} required>
                <option value="template">📝 Şablon Mesaj (WhatsApp onaylı)</option>
                <option value="text">💬 Serbest Metin</option>
              </select>
            </div>

            {templates.length > 0 && (
              <div style={{ marginBottom: 'var(--space-4)' }}>
                <label style={labelStyle}>Şablon Seçin (opsiyonel)</label>
                <select name="template_name" style={inputStyle}>
                  <option value="">— Şablon seçin —</option>
                  {templates.map(t => (
                    <option key={t.id} value={t.name}>
                      {t.name} ({t.category} / {t.language})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div style={{ marginBottom: 'var(--space-5)' }}>
              <label style={labelStyle}>Mesaj İçeriği</label>
              <textarea name="message" style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }} required placeholder="Kampanya mesajınızı yazın..." />
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={sending}>
                {sending ? '⏳ Gönderiliyor...' : '🚀 Kampanyayı Başlat'}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setActiveTab('active')}>İptal</button>
            </div>
          </form>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '48px', opacity: 0.3, marginBottom: '12px' }}>📢</div>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 500, marginBottom: '8px' }}>
              {activeTab === 'active' ? 'Aktif Kampanya Yok' : 'Tamamlanan Kampanya'}
            </div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', maxWidth: '400px', margin: '0 auto', lineHeight: 1.7 }}>
              Kampanya geçmişi, kampanya log tablosu oluşturulduktan sonra burada listelenecektir.
              Şimdilik "Yeni Kampanya" ile toplu mesaj gönderebilirsiniz.
            </div>
          </div>
        )}
      </div>
    </>
  );
}

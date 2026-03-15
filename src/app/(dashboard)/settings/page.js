'use client';
import { useState } from 'react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">⚙️ Ayarlar</h1>
      </div>
      <div style={{ display: 'flex', height: 'calc(100vh - var(--header-height))' }}>
        {/* Settings Sidebar */}
        <div style={{
          width: '220px',
          borderRight: '1px solid var(--border-primary)',
          padding: 'var(--space-4)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-1)',
          flexShrink: 0,
        }}>
          {[
            { key: 'general', icon: '🏢', label: 'Genel' },
            { key: 'whatsapp', icon: '💬', label: 'WhatsApp' },
            { key: 'users', icon: '👥', label: 'Kullanıcılar' },
            { key: 'notifications', icon: '🔔', label: 'Bildirimler' },
            { key: 'integrations', icon: '🔗', label: 'Entegrasyonlar' },
            { key: 'ai', icon: '🤖', label: 'AI Ayarları' },
          ].map(item => (
            <button
              key={item.key}
              className={`nav-item ${activeTab === item.key ? 'active' : ''}`}
              onClick={() => setActiveTab(item.key)}
            >
              <span className="nav-item-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        {/* Settings Content */}
        <div style={{ flex: 1, padding: 'var(--space-6)', overflowY: 'auto' }}>
          {activeTab === 'general' && <GeneralSettings />}
          {activeTab === 'whatsapp' && <WhatsAppSettings />}
          {activeTab === 'users' && <UserSettings />}
          {activeTab === 'notifications' && <NotificationSettings />}
          {activeTab === 'integrations' && <IntegrationSettings />}
          {activeTab === 'ai' && <AISettings />}
        </div>
      </div>
    </>
  );
}

function SettingSection({ title, description, children }) {
  return (
    <div style={{
      background: 'var(--surface-card)',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--border-primary)',
      padding: 'var(--space-5)',
      marginBottom: 'var(--space-4)',
    }}>
      <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 700, marginBottom: '4px' }}>{title}</h3>
      {description && <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 'var(--space-4)' }}>{description}</p>}
      {children}
    </div>
  );
}

function SettingRow({ label, description, children }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 'var(--space-3) 0',
      borderBottom: '1px solid var(--border-primary)',
    }}>
      <div>
        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>{label}</div>
        {description && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '2px' }}>{description}</div>}
      </div>
      {children}
    </div>
  );
}

function GeneralSettings() {
  return (
    <>
      <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>🏢 Genel Ayarlar</h2>
      <SettingSection title="Firma Bilgileri" description="Panelinizin görünüm ve ayarları">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Firma Adı</label>
            <input type="text" defaultValue="MYBHEG" style={{ width: '100%' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Zaman Dilimi</label>
            <select defaultValue="Europe/Istanbul" style={{ width: '100%' }}>
              <option value="Europe/Istanbul">Türkiye (GMT+3)</option>
              <option value="Europe/Berlin">Almanya (GMT+1)</option>
              <option value="America/New_York">New York (GMT-5)</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Dil</label>
            <select defaultValue="tr" style={{ width: '100%' }}>
              <option value="tr">Türkçe</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>
      </SettingSection>

      <SettingSection title="Sipariş Ayarları" description="WhatsApp onay sistemi zaman aşımı değerleri">
        <SettingRow label="İlk Mesaj Gecikmesi" description="Sipariş alındıktan sonra ilk WhatsApp mesajının gönderilme süresi">
          <input type="text" defaultValue="2 dk" style={{ width: '80px', textAlign: 'center' }} />
        </SettingRow>
        <SettingRow label="Hatırlatma Süresi" description="Yanıt alınamazsa hatırlatma mesajı">
          <input type="text" defaultValue="2 saat" style={{ width: '80px', textAlign: 'center' }} />
        </SettingRow>
        <SettingRow label="Zaman Aşımı" description="Otomatik zaman aşımı süresi">
          <input type="text" defaultValue="24 saat" style={{ width: '80px', textAlign: 'center' }} />
        </SettingRow>
      </SettingSection>
    </>
  );
}

function WhatsAppSettings() {
  return (
    <>
      <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>💬 WhatsApp Ayarları</h2>
      <SettingSection title="WhatsApp Business API" description="Meta Cloud API bağlantı bilgileri">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Phone Number ID</label>
            <input type="text" placeholder="Ör: 123456789012345" style={{ width: '100%' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Access Token</label>
            <input type="password" placeholder="Bearer token" style={{ width: '100%' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Webhook Verify Token</label>
            <input type="text" placeholder="Custom verify token" style={{ width: '100%' }} />
          </div>
        </div>
      </SettingSection>
      <SettingSection title="Mesaj Ayarları">
        <SettingRow label="AI Otomatik Yanıt" description="Gelen mesajlara AI yanıt versin mi?">
          <span className="badge badge-green">Aktif</span>
        </SettingRow>
        <SettingRow label="Operatör Devralma" description="Manuel listeye eklenince AI durup operatöre bırakır">
          <span className="badge badge-green">Aktif</span>
        </SettingRow>
      </SettingSection>
    </>
  );
}

function UserSettings() {
  return (
    <>
      <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>👥 Kullanıcı Yönetimi</h2>
      <SettingSection title="Kullanıcılar" description="Panel erişimi olan kullanıcılar">
        <div style={{ marginBottom: 'var(--space-3)' }}>
          <button className="btn btn-primary btn-sm">+ Yeni Kullanıcı</button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-primary)' }}>
              {['Kullanıcı', 'Rol', 'Durum', 'İşlem'].map(h => (
                <th key={h} style={{ padding: 'var(--space-2) var(--space-3)', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'left' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid var(--border-primary)' }}>
              <td style={{ padding: 'var(--space-2) var(--space-3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div className="avatar avatar-sm">A</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>Admin</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>admin</div>
                  </div>
                </div>
              </td>
              <td style={{ padding: 'var(--space-2) var(--space-3)' }}><span className="badge badge-purple">Admin</span></td>
              <td style={{ padding: 'var(--space-2) var(--space-3)' }}><span className="badge badge-green">Aktif</span></td>
              <td style={{ padding: 'var(--space-2) var(--space-3)' }}><button className="btn btn-ghost btn-sm">Düzenle</button></td>
            </tr>
          </tbody>
        </table>
      </SettingSection>
    </>
  );
}

function NotificationSettings() {
  return (
    <>
      <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>🔔 Bildirim Ayarları</h2>
      <SettingSection title="WhatsApp Bildirimleri" description="Admin telefonuna gönderilecek bildiriimler">
        <SettingRow label="Hata Bildirimi" description="Sistem hatalarında admin'e WhatsApp mesajı">
          <span className="badge badge-green">Aktif</span>
        </SettingRow>
        <SettingRow label="Stok Uyarısı" description="Stok düştüğünde bildirim">
          <span className="badge badge-green">Aktif</span>
        </SettingRow>
        <SettingRow label="Yeni Sipariş" description="Her yeni siparişte bildirim">
          <span className="badge badge-gray">Kapalı</span>
        </SettingRow>
      </SettingSection>
    </>
  );
}

function IntegrationSettings() {
  return (
    <>
      <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>🔗 Entegrasyonlar</h2>
      <SettingSection title="Shopify" description="Shopify mağaza bağlantısı">
        <SettingRow label="Mağaza URL" description="Shopify admin URL">
          <input type="text" placeholder="store.myshopify.com" style={{ width: '220px' }} />
        </SettingRow>
        <SettingRow label="API Token" description="Admin API erişim tokeni">
          <input type="password" placeholder="shpat_xxxxx" style={{ width: '220px' }} />
        </SettingRow>
        <SettingRow label="Webhook Durumu" description="Sipariş/ürün/müşteri webhook'ları">
          <span className="badge badge-green">4 Aktif</span>
        </SettingRow>
      </SettingSection>
      <SettingSection title="n8n" description="Otomasyon motoru bağlantısı">
        <SettingRow label="n8n URL" description="n8n instance adresi">
          <input type="text" placeholder="https://n8n.example.com" style={{ width: '280px' }} />
        </SettingRow>
        <SettingRow label="Aktif Workflow" description="Çalışan otomasyon sayısı">
          <span className="badge badge-blue">20 Workflow</span>
        </SettingRow>
      </SettingSection>
    </>
  );
}

function AISettings() {
  return (
    <>
      <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>🤖 AI Ayarları</h2>
      <SettingSection title="AI Agent Yapılandırması" description="WhatsApp müşteri hizmetleri AI asistanı">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>AI Model</label>
            <select defaultValue="gpt-4o-mini" style={{ width: '100%' }}>
              <option value="gpt-4o-mini">GPT-4o Mini</option>
              <option value="gpt-4o">GPT-4o</option>
              <option value="gpt-4-turbo">GPT-4 Turbo</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Sistem Prompt</label>
            <textarea rows={6} style={{ width: '100%', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}
              defaultValue={`Sen bir müşteri hizmetleri asistanısın. Firma: MYBHEG\n\nKurallar:\n- Türkçe yanıt ver\n- Kibar ve profesyonel ol\n- Sipariş durumu sorarsa veritabanından kontrol et\n- Emin değilsen operatöre yönlendir`}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Çalışma Saatleri</label>
            <input type="text" defaultValue="09:00 - 18:00" style={{ width: '200px' }} />
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginLeft: '8px' }}>Dışında sadece AI yanıt verir</span>
          </div>
        </div>
      </SettingSection>
    </>
  );
}

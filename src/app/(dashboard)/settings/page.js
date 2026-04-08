'use client';
import { useState, useEffect } from 'react';

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

/* ── Shared Components ────────────────────────────── */

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
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: 'var(--space-3) 0', borderBottom: '1px solid var(--border-primary)',
    }}>
      <div>
        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>{label}</div>
        {description && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '2px' }}>{description}</div>}
      </div>
      {children}
    </div>
  );
}

function SaveBar({ saving, onSave, message }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
      gap: '12px', marginTop: 'var(--space-4)',
    }}>
      {message && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--accent-green-light)' }}>{message}</span>}
      <button className="btn btn-primary" onClick={onSave} disabled={saving}>
        {saving ? '⏳ Kaydediliyor...' : '💾 Kaydet'}
      </button>
    </div>
  );
}

function ToggleButton({ active, onChange }) {
  return (
    <button
      onClick={() => onChange(!active)}
      className={`badge ${active ? 'badge-green' : 'badge-gray'}`}
      style={{ cursor: 'pointer', border: 'none', minWidth: '60px', textAlign: 'center' }}
    >
      {active ? 'Aktif' : 'Kapalı'}
    </button>
  );
}

/* ── Settings Hook ────────────────────────────── */

function useSettings(category) {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch(`/api/settings?category=${category}`)
      .then(r => r.json())
      .then(res => { if (res.success) setData(res.data); })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [category]);

  const save = async () => {
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, settings: data }),
      });
      const result = await res.json();
      if (result.success) setMessage('✅ Kaydedildi');
      else setMessage('❌ ' + result.error);
    } catch (err) {
      setMessage('❌ Bağlantı hatası');
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const update = (key, value) => setData(prev => ({ ...prev, [key]: value }));

  return { data, loading, saving, message, save, update, setData };
}

/* ── General Settings ────────────────────────────── */

function GeneralSettings() {
  const { data, loading, saving, message, save, update } = useSettings('general');

  if (loading) return <div style={{ color: 'var(--text-muted)', padding: '20px' }}>Yükleniyor...</div>;

  return (
    <>
      <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>🏢 Genel Ayarlar</h2>
      <SettingSection title="Firma Bilgileri" description="Panelinizin görünüm ve ayarları">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Firma Adı</label>
            <input type="text" value={data.company_name || ''} onChange={e => update('company_name', e.target.value)} style={{ width: '100%' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Zaman Dilimi</label>
            <select value={data.timezone || 'Europe/Istanbul'} onChange={e => update('timezone', e.target.value)} style={{ width: '100%' }}>
              <option value="Europe/Istanbul">Türkiye (GMT+3)</option>
              <option value="Europe/Berlin">Almanya (GMT+1)</option>
            </select>
          </div>
        </div>
      </SettingSection>
      <SettingSection title="Sipariş Ayarları" description="WhatsApp onay sistemi zaman aşımı değerleri">
        <SettingRow label="İlk Mesaj Gecikmesi" description="Sipariş alındıktan sonra ilk WhatsApp mesajının gönderilme süresi">
          <input type="text" value={data.first_message_delay || ''} onChange={e => update('first_message_delay', e.target.value)} style={{ width: '80px', textAlign: 'center' }} />
        </SettingRow>
        <SettingRow label="Hatırlatma Süresi" description="Yanıt alınamazsa hatırlatma mesajı">
          <input type="text" value={data.reminder_delay || ''} onChange={e => update('reminder_delay', e.target.value)} style={{ width: '80px', textAlign: 'center' }} />
        </SettingRow>
        <SettingRow label="Zaman Aşımı" description="Otomatik zaman aşımı süresi">
          <input type="text" value={data.timeout_delay || ''} onChange={e => update('timeout_delay', e.target.value)} style={{ width: '80px', textAlign: 'center' }} />
        </SettingRow>
      </SettingSection>
      <SaveBar saving={saving} onSave={save} message={message} />
    </>
  );
}

/* ── WhatsApp Settings ────────────────────────────── */

function WhatsAppSettings() {
  const { data, loading, saving, message, save, update } = useSettings('whatsapp');

  if (loading) return <div style={{ color: 'var(--text-muted)', padding: '20px' }}>Yükleniyor...</div>;

  return (
    <>
      <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>💬 WhatsApp Ayarları</h2>
      <SettingSection title="WhatsApp Business API" description="Meta Cloud API bağlantı bilgileri">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Phone Number ID</label>
            <input type="text" value={data.phone_number_id || ''} onChange={e => update('phone_number_id', e.target.value)} placeholder="Ör: 123456789012345" style={{ width: '100%' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Access Token</label>
            <input type="password" value={data.access_token || ''} onChange={e => update('access_token', e.target.value)} placeholder="Bearer token" style={{ width: '100%' }} />
          </div>
        </div>
      </SettingSection>
      <SettingSection title="Mesaj Ayarları">
        <SettingRow label="AI Otomatik Yanıt" description="Gelen mesajlara AI yanıt versin mi?">
          <ToggleButton active={data.ai_auto_reply !== false} onChange={v => update('ai_auto_reply', v)} />
        </SettingRow>
        <SettingRow label="Operatör Devralma" description="Manuel listeye eklenince AI durup operatöre bırakır">
          <ToggleButton active={data.operator_takeover !== false} onChange={v => update('operator_takeover', v)} />
        </SettingRow>
      </SettingSection>
      <SaveBar saving={saving} onSave={save} message={message} />
    </>
  );
}

/* ── User Settings (FROM DB) ────────────────────── */

function UserSettings() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ username: '', password: '', display_name: '', system_phone: '', role: 'operator' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchUsers(); }, []);

  async function fetchUsers() {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (data.success) setUsers(data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function createUser(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setShowForm(false);
        setForm({ username: '', password: '', display_name: '', system_phone: '', role: 'operator' });
        fetchUsers();
      } else {
        alert(data.error || 'Hata oluştu');
      }
    } catch (err) { alert('Bağlantı hatası'); }
    finally { setSaving(false); }
  }

  async function toggleActive(userId, currentActive) {
    await fetch(`/api/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !currentActive }),
    });
    fetchUsers();
  }

  async function changeRole(userId, newRole) {
    await fetch(`/api/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole }),
    });
    fetchUsers();
  }

  return (
    <>
      <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>👥 Kullanıcı Yönetimi</h2>
      <SettingSection title="Kullanıcılar" description="Panel erişimi olan kullanıcılar">
        <div style={{ marginBottom: 'var(--space-3)' }}>
          <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
            {showForm ? '✕ İptal' : '+ Yeni Kullanıcı'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={createUser} style={{
            padding: 'var(--space-4)', marginBottom: 'var(--space-4)',
            background: 'var(--bg-hover)', borderRadius: 'var(--radius-md)',
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)',
          }}>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: '4px' }}>Kullanıcı Adı *</label>
              <input type="text" required value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} style={{ width: '100%' }} placeholder="ornek123" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: '4px' }}>Şifre *</label>
              <input type="password" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} style={{ width: '100%' }} placeholder="••••••" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: '4px' }}>Ad Soyad *</label>
              <input type="text" required value={form.display_name} onChange={e => setForm({ ...form, display_name: e.target.value })} style={{ width: '100%' }} placeholder="Ahmet Yılmaz" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: '4px' }}>Telefon</label>
              <input type="text" value={form.system_phone} onChange={e => setForm({ ...form, system_phone: e.target.value })} style={{ width: '100%' }} placeholder="905xxxxxxxxx" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: '4px' }}>Rol</label>
              <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} style={{ width: '100%' }}>
                <option value="operator">Operatör</option>
                <option value="viewer">İzleyici</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button type="submit" className="btn btn-primary" disabled={saving} style={{ width: '100%' }}>
                {saving ? '⏳ Oluşturuluyor...' : '✅ Oluştur'}
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>Yükleniyor...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-primary)' }}>
                {['Kullanıcı', 'Rol', 'Durum', 'Oluşturulma', 'İşlem'].map(h => (
                  <th key={h} style={{ padding: 'var(--space-2) var(--space-3)', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} style={{ borderBottom: '1px solid var(--border-primary)' }}>
                  <td style={{ padding: 'var(--space-2) var(--space-3)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div className="avatar avatar-sm">{(user.display_name || user.username)[0].toUpperCase()}</div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{user.display_name}</div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{user.username}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: 'var(--space-2) var(--space-3)' }}>
                    <select value={user.role} onChange={e => changeRole(user.id, e.target.value)}
                      style={{ fontSize: 'var(--text-xs)', padding: '2px 6px', borderRadius: '4px', background: 'var(--bg-hover)', border: '1px solid var(--border-primary)' }}>
                      <option value="admin">Admin</option>
                      <option value="operator">Operatör</option>
                      <option value="viewer">İzleyici</option>
                    </select>
                  </td>
                  <td style={{ padding: 'var(--space-2) var(--space-3)' }}>
                    <button onClick={() => toggleActive(user.id, user.is_active)}
                      className={`badge ${user.is_active ? 'badge-green' : 'badge-red'}`}
                      style={{ cursor: 'pointer', border: 'none' }}>
                      {user.is_active ? 'Aktif' : 'Pasif'}
                    </button>
                  </td>
                  <td style={{ padding: 'var(--space-2) var(--space-3)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                    {user.created_at ? new Date(user.created_at).toLocaleDateString('tr-TR') : '—'}
                  </td>
                  <td style={{ padding: 'var(--space-2) var(--space-3)' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => {
                      const newPass = prompt('Yeni şifre girin:');
                      if (newPass) {
                        fetch(`/api/users/${user.id}`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ password: newPass }),
                        }).then(() => alert('Şifre güncellendi'));
                      }
                    }}>🔑 Şifre</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </SettingSection>
    </>
  );
}

/* ── Notification Settings ────────────────────────── */

function NotificationSettings() {
  const { data, loading, saving, message, save, update } = useSettings('notifications');

  if (loading) return <div style={{ color: 'var(--text-muted)', padding: '20px' }}>Yükleniyor...</div>;

  return (
    <>
      <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>🔔 Bildirim Ayarları</h2>
      <SettingSection title="WhatsApp Bildirimleri" description="Admin telefonuna gönderilecek bildirimler">
        <SettingRow label="Hata Bildirimi" description="Sistem hatalarında admin'e WhatsApp mesajı">
          <ToggleButton active={data.error_notification !== false} onChange={v => update('error_notification', v)} />
        </SettingRow>
        <SettingRow label="Stok Uyarısı" description="Stok düştüğünde bildirim">
          <ToggleButton active={data.stock_alert !== false} onChange={v => update('stock_alert', v)} />
        </SettingRow>
        <SettingRow label="Yeni Sipariş" description="Her yeni siparişte bildirim">
          <ToggleButton active={data.new_order === true} onChange={v => update('new_order', v)} />
        </SettingRow>
      </SettingSection>
      <SaveBar saving={saving} onSave={save} message={message} />
    </>
  );
}

/* ── Integration Settings ────────────────────────── */

function IntegrationSettings() {
  const { data, loading, saving, message, save, update } = useSettings('integrations');

  if (loading) return <div style={{ color: 'var(--text-muted)', padding: '20px' }}>Yükleniyor...</div>;

  return (
    <>
      <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>🔗 Entegrasyonlar</h2>
      <SettingSection title="Shopify" description="Shopify mağaza bağlantısı">
        <SettingRow label="Mağaza URL" description="Shopify admin URL">
          <input type="text" value={data.shopify_url || ''} onChange={e => update('shopify_url', e.target.value)} placeholder="store.myshopify.com" style={{ width: '220px' }} />
        </SettingRow>
        <SettingRow label="API Token" description="Admin API erişim tokeni">
          <input type="password" value={data.shopify_token || ''} onChange={e => update('shopify_token', e.target.value)} placeholder="shpat_xxxxx" style={{ width: '220px' }} />
        </SettingRow>
      </SettingSection>
      <SettingSection title="n8n" description="Otomasyon motoru bağlantısı">
        <SettingRow label="n8n URL" description="n8n instance adresi">
          <input type="text" value={data.n8n_url || ''} onChange={e => update('n8n_url', e.target.value)} placeholder="https://n8n.example.com" style={{ width: '280px' }} />
        </SettingRow>
      </SettingSection>
      <SaveBar saving={saving} onSave={save} message={message} />
    </>
  );
}

/* ── AI Settings ────────────────────────────────── */

function AISettings() {
  const { data, loading, saving, message, save, update } = useSettings('ai');

  if (loading) return <div style={{ color: 'var(--text-muted)', padding: '20px' }}>Yükleniyor...</div>;

  return (
    <>
      <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>🤖 AI Ayarları</h2>
      <SettingSection title="AI Agent Yapılandırması" description="WhatsApp müşteri hizmetleri AI asistanı">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>AI Model</label>
            <select value={data.model || 'gpt-4o-mini'} onChange={e => update('model', e.target.value)} style={{ width: '100%' }}>
              <option value="gpt-4o-mini">GPT-4o Mini</option>
              <option value="gpt-4o">GPT-4o</option>
              <option value="gpt-4-turbo">GPT-4 Turbo</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Sistem Prompt</label>
            <textarea rows={6} style={{ width: '100%', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}
              value={data.system_prompt || ''}
              onChange={e => update('system_prompt', e.target.value)}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Çalışma Saatleri</label>
            <input type="text" value={data.working_hours || ''} onChange={e => update('working_hours', e.target.value)} style={{ width: '200px' }} />
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginLeft: '8px' }}>Dışında sadece AI yanıt verir</span>
          </div>
        </div>
      </SettingSection>
      <SaveBar saving={saving} onSave={save} message={message} />
    </>
  );
}

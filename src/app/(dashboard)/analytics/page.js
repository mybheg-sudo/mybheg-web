'use client';
import { useState, useEffect } from 'react';

function formatCurrency(v) {
  return parseFloat(v || 0).toLocaleString('tr-TR') + ' ₺';
}

// ─── Pure CSS/SVG Bar Chart ───
function BarChart({ data, label, color = '#a78bfa', height = 160 }) {
  if (!data || data.length === 0) return <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>Veri yok</div>;
  const max = Math.max(...data.map(d => d.value), 1);

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height, padding: '0 4px' }}>
      {data.map((d, i) => {
        const h = Math.max((d.value / max) * (height - 28), 4);
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 600 }}>{d.value || ''}</span>
            <div style={{
              width: '100%', maxWidth: '36px', height: `${h}px`, borderRadius: '4px 4px 0 0',
              background: color,
              boxShadow: `0 0 8px ${color}66`,
              opacity: 0.6 + (d.value / max) * 0.4,
              transition: 'height 0.4s ease, opacity 0.3s ease',
            }} />
            <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Pure CSS Donut Chart ───
function DonutChart({ segments, size = 140 }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) return <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)', textAlign: 'center' }}>Veri yok</div>;

  let cumulative = 0;
  const radius = 50;
  const circumference = 2 * Math.PI * radius;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
      <svg width={size} height={size} viewBox="0 0 120 120">
        {segments.filter(s => s.value > 0).map((seg, i) => {
          const pct = seg.value / total;
          const dashLen = pct * circumference;
          const dashOffset = -cumulative * circumference;
          cumulative += pct;
          return (
            <circle key={i} cx="60" cy="60" r={radius} fill="none"
              stroke={seg.color} strokeWidth="18"
              strokeDasharray={`${dashLen} ${circumference - dashLen}`}
              strokeDashoffset={dashOffset}
              transform="rotate(-90 60 60)"
              style={{ transition: 'stroke-dasharray 0.5s ease' }}
            />
          );
        })}
        <text x="60" y="56" textAnchor="middle" fill="var(--text-primary)" fontSize="18" fontWeight="800">{total}</text>
        <text x="60" y="72" textAnchor="middle" fill="var(--text-muted)" fontSize="9">toplam</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {segments.filter(s => s.value > 0).map((seg, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--text-xs)' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: seg.color, flexShrink: 0 }} />
            <span style={{ color: 'var(--text-secondary)' }}>{seg.label}</span>
            <span style={{ fontWeight: 700, marginLeft: 'auto' }}>{seg.value}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>({(seg.value / total * 100).toFixed(0)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Stat Card ───
function MiniCard({ icon, value, label, trend }) {
  return (
    <div style={{
      background: 'var(--surface-card)', borderRadius: 'var(--radius-lg)',
      padding: 'var(--space-4)', border: '1px solid var(--border-primary)',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: '20px', marginBottom: '4px' }}>{icon}</div>
      <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800 }}>{value}</div>
      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{label}</div>
      {trend !== undefined && (
        <div style={{ fontSize: '10px', color: trend >= 0 ? 'var(--accent-green)' : 'var(--accent-red)', marginTop: '2px' }}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </div>
      )}
    </div>
  );
}

// ─── Main Analytics Page ───
export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(30);

  useEffect(() => {
    fetch(`/api/analytics?days=${period}`)
      .then(r => r.json())
      .then(res => { if (res.success) setData(res.data); })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [period]);

  if (loading) return <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Yükleniyor...</div>;
  if (!data) return <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Veri yüklenemedi</div>;

  const { msgStats, orderStats, customerStats, dailyOrders, dailyMessages } = data;
  const approvalRate = orderStats.total > 0 ? ((orderStats.approved / orderStats.total) * 100).toFixed(1) : 0;
  const aiRate = (msgStats.ai_responses + msgStats.operator_responses) > 0
    ? ((msgStats.ai_responses / (msgStats.ai_responses + msgStats.operator_responses)) * 100).toFixed(1) : 0;

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">📈 Analitik</h1>
        <div style={{ display: 'flex', gap: 'var(--space-2)', marginLeft: 'var(--space-3)' }}>
          {[7, 30, 90].map(d => (
            <button key={d} className={`filter-btn ${period === d ? 'active' : ''}`}
              onClick={() => { setPeriod(d); setLoading(true); }}>
              {d} gün
            </button>
          ))}
        </div>
      </div>

      <div className="page-body">
        {/* Overview Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
          <MiniCard icon="📦" value={orderStats.total} label="Toplam Sipariş" />
          <MiniCard icon="💰" value={formatCurrency(orderStats.total_revenue)} label="Toplam Gelir" />
          <MiniCard icon="📊" value={formatCurrency(orderStats.avg_order)} label="Ort. Sipariş" />
          <MiniCard icon="💬" value={(msgStats.incoming || 0) + (msgStats.outgoing || 0)} label="Toplam Mesaj" />
          <MiniCard icon="🤖" value={`${aiRate}%`} label="AI Otomasyon" />
          <MiniCard icon="✅" value={`${approvalRate}%`} label="Onay Oranı" />
        </div>

        {/* Charts Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-5)' }}>
          {/* Daily Orders Chart */}
          <div style={{ background: 'var(--surface-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-primary)', padding: 'var(--space-5)' }}>
            <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>📦 Günlük Siparişler</h3>
            <BarChart
              data={(dailyOrders || []).map(d => ({ value: d.count, label: d.day }))}
              color="#a78bfa"
            />
          </div>

          {/* Daily Messages Chart */}
          <div style={{ background: 'var(--surface-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-primary)', padding: 'var(--space-5)' }}>
            <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>💬 Günlük Mesajlar</h3>
            <BarChart
              data={(dailyMessages || []).map(d => ({ value: d.count, label: d.day }))}
              color="#22d3ee"
            />
          </div>
        </div>

        {/* Donut Charts Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-5)' }}>
          {/* Order Status Distribution */}
          <div style={{ background: 'var(--surface-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-primary)', padding: 'var(--space-5)' }}>
            <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>📦 Sipariş Durum Dağılımı</h3>
            <DonutChart segments={[
              { label: 'Onaylanan', value: orderStats.approved, color: '#34d399' },
              { label: 'Bekleyen', value: orderStats.pending, color: '#fb923c' },
              { label: 'Reddedilen', value: orderStats.rejected, color: '#f87171' },
              { label: 'Timeout', value: orderStats.timeout, color: '#6b7280' },
            ]} />
          </div>

          {/* Message Source Distribution */}
          <div style={{ background: 'var(--surface-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-primary)', padding: 'var(--space-5)' }}>
            <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>💬 Mesaj Kaynağı Dağılımı</h3>
            <DonutChart segments={[
              { label: '🤖 AI Yanıt', value: msgStats.ai_responses, color: '#a78bfa' },
              { label: '👤 Operatör', value: msgStats.operator_responses, color: '#60a5fa' },
              { label: '⚙️ Sistem', value: msgStats.system_messages, color: '#fb923c' },
              { label: '📨 Gelen', value: msgStats.incoming, color: '#34d399' },
            ]} />
          </div>
        </div>

        {/* Detail Tables */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
          {/* Message Detail */}
          <div style={{ background: 'var(--surface-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-primary)', padding: 'var(--space-5)' }}>
            <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>💬 Mesaj Detay</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <DetailRow label="Gelen Mesaj" value={msgStats.incoming} color="var(--accent-green)" />
              <DetailRow label="Giden Mesaj" value={msgStats.outgoing} color="var(--accent-blue)" />
              <DetailRow label="🤖 AI Yanıt" value={msgStats.ai_responses} color="var(--accent-purple)" />
              <DetailRow label="👤 Operatör" value={msgStats.operator_responses} color="var(--accent-cyan)" />
              <DetailRow label="⚙️ Sistem" value={msgStats.system_messages} color="var(--accent-orange)" />
              <DetailRow label="❌ Başarısız" value={msgStats.failed} color="var(--accent-red)" />
            </div>
          </div>

          {/* Order Detail */}
          <div style={{ background: 'var(--surface-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-primary)', padding: 'var(--space-5)' }}>
            <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>📦 Sipariş Detay</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <DetailRow label="Toplam Sipariş" value={orderStats.total} color="var(--accent-blue)" />
              <DetailRow label="✅ Onaylanan" value={orderStats.approved} color="var(--accent-green)" />
              <DetailRow label="❌ Reddedilen" value={orderStats.rejected} color="var(--accent-red)" />
              <DetailRow label="⏳ Bekleyen" value={orderStats.pending} color="var(--accent-orange)" />
              <DetailRow label="⏰ Timeout" value={orderStats.timeout} color="var(--text-muted)" />
              <div style={{ borderTop: '1px solid var(--border-primary)', paddingTop: 'var(--space-2)', marginTop: 'var(--space-1)' }}>
                <DetailRow label="Toplam Gelir" value={formatCurrency(orderStats.total_revenue)} color="var(--accent-green-light)" />
                <DetailRow label="Ortalama Sipariş" value={formatCurrency(orderStats.avg_order)} color="var(--text-primary)" />
              </div>
            </div>
          </div>
        </div>

        {/* Customer Stats */}
        <div style={{ marginTop: 'var(--space-4)', background: 'var(--surface-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-primary)', padding: 'var(--space-5)' }}>
          <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 700, marginBottom: 'var(--space-3)' }}>👥 Müşteri Özet</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-4)' }}>
            <MiniCard icon="👥" value={customerStats.total} label="Toplam Kişi" />
            <MiniCard icon="🆕" value={customerStats.new_contacts} label={`Yeni (${period}g)`} />
            <MiniCard icon="📈" value={customerStats.total > 0 ? ((customerStats.new_contacts / customerStats.total) * 100).toFixed(1) + '%' : '0%'} label="Büyüme" />
          </div>
        </div>
      </div>
    </>
  );
}

function DetailRow({ label, value, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2px 0' }}>
      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ fontWeight: 700, color, fontSize: 'var(--text-sm)' }}>{value}</span>
    </div>
  );
}

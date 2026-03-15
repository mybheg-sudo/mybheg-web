import { getOne } from '@/lib/db';

async function getAnalyticsData() {
  try {
    const [msgStats, orderStats, customerStats, weeklyMessages] = await Promise.all([
      getOne(`
        SELECT 
          COUNT(*) FILTER (WHERE direction = 'incoming')::int as incoming,
          COUNT(*) FILTER (WHERE direction = 'outgoing')::int as outgoing,
          COUNT(*) FILTER (WHERE source = 'ai')::int as ai_responses,
          COUNT(*) FILTER (WHERE source = 'operator')::int as operator_responses,
          COUNT(*) FILTER (WHERE source = 'system')::int as system_messages,
          COUNT(*) FILTER (WHERE status = 'failed')::int as failed
        FROM messages
        WHERE timestamp > NOW() - INTERVAL '30 days'
      `),
      getOne(`
        SELECT 
          COUNT(*)::int as total,
          COUNT(*) FILTER (WHERE status = 'APPROVED')::int as approved,
          COUNT(*) FILTER (WHERE status = 'REJECTED')::int as rejected,
          COUNT(*) FILTER (WHERE status = 'PENDING')::int as pending,
          COUNT(*) FILTER (WHERE status = 'TIMEOUT')::int as timeout,
          COALESCE(SUM(total_price), 0)::numeric as total_revenue,
          COALESCE(AVG(total_price), 0)::numeric as avg_order
        FROM orders
        WHERE created_at > NOW() - INTERVAL '30 days'
      `),
      getOne(`
        SELECT 
          COUNT(*)::int as total,
          COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days')::int as new_contacts
        FROM contacts WHERE user_id = 1
      `),
      getOne(`
        SELECT 
          COUNT(*) FILTER (WHERE timestamp > NOW() - INTERVAL '1 day')::int as today,
          COUNT(*) FILTER (WHERE timestamp > NOW() - INTERVAL '7 days')::int as week,
          COUNT(*) FILTER (WHERE timestamp > NOW() - INTERVAL '30 days')::int as month
        FROM messages
      `),
    ]);

    return { msgStats, orderStats, customerStats, weeklyMessages };
  } catch (error) {
    console.error('Analytics error:', error);
    return {
      msgStats: { incoming: 0, outgoing: 0, ai_responses: 0, operator_responses: 0, system_messages: 0, failed: 0 },
      orderStats: { total: 0, approved: 0, rejected: 0, pending: 0, timeout: 0, total_revenue: 0, avg_order: 0 },
      customerStats: { total: 0, new_contacts: 0 },
      weeklyMessages: { today: 0, week: 0, month: 0 },
    };
  }
}

export default async function AnalyticsPage() {
  const { msgStats, orderStats, customerStats, weeklyMessages } = await getAnalyticsData();

  const approvalRate = orderStats.total > 0 
    ? ((orderStats.approved / orderStats.total) * 100).toFixed(1) 
    : 0;
  const aiRate = (msgStats.incoming || 0) > 0
    ? ((msgStats.ai_responses / (msgStats.ai_responses + msgStats.operator_responses || 1)) * 100).toFixed(1)
    : 0;

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">📈 Analitik</h1>
        <span className="badge badge-gray">Son 30 gün</span>
      </div>
      <div className="page-body">
        {/* Overview Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
          <MiniCard icon="📨" value={weeklyMessages.today} label="Bugün Mesaj" />
          <MiniCard icon="📬" value={weeklyMessages.week} label="Bu Hafta" />
          <MiniCard icon="📊" value={weeklyMessages.month} label="Bu Ay" />
          <MiniCard icon="👥" value={customerStats.new_contacts} label="Yeni Kişi (30g)" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
          {/* Message Analytics */}
          <div style={{ background: 'var(--surface-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-primary)', padding: 'var(--space-5)' }}>
            <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>💬 Mesaj Analitik</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <AnalRow label="Gelen Mesaj" value={msgStats.incoming} color="var(--accent-blue)" />
              <AnalRow label="Giden Mesaj" value={msgStats.outgoing} color="var(--accent-green)" />
              <AnalRow label="🤖 AI Yanıt" value={msgStats.ai_responses} color="var(--accent-purple)" />
              <AnalRow label="👤 Operatör Yanıt" value={msgStats.operator_responses} color="var(--accent-cyan)" />
              <AnalRow label="⚙️ Sistem Mesajı" value={msgStats.system_messages} color="var(--accent-orange)" />
              <AnalRow label="❌ Başarısız" value={msgStats.failed} color="var(--accent-red)" />
              <div style={{ borderTop: '1px solid var(--border-primary)', paddingTop: 'var(--space-3)', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 600 }}>AI Otomasyon Oranı</span>
                <span style={{ fontWeight: 700, color: 'var(--accent-purple)' }}>{aiRate}%</span>
              </div>
            </div>
          </div>

          {/* Order Analytics */}
          <div style={{ background: 'var(--surface-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-primary)', padding: 'var(--space-5)' }}>
            <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>📦 Sipariş Analitik</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <AnalRow label="Toplam Sipariş" value={orderStats.total} color="var(--accent-blue)" />
              <AnalRow label="✅ Onaylanan" value={orderStats.approved} color="var(--accent-green)" />
              <AnalRow label="❌ Reddedilen" value={orderStats.rejected} color="var(--accent-red)" />
              <AnalRow label="⏳ Bekleyen" value={orderStats.pending} color="var(--accent-orange)" />
              <AnalRow label="⏰ Timeout" value={orderStats.timeout} color="var(--text-muted)" />
              <div style={{ borderTop: '1px solid var(--border-primary)', paddingTop: 'var(--space-3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 600 }}>Onay Oranı</span>
                  <span style={{ fontWeight: 700, color: 'var(--accent-green)' }}>{approvalRate}%</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 600 }}>Toplam Gelir</span>
                  <span style={{ fontWeight: 700, color: 'var(--accent-green-light)' }}>{parseFloat(orderStats.total_revenue).toLocaleString('tr-TR')} ₺</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 600 }}>Ort. Sipariş</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{parseFloat(orderStats.avg_order).toLocaleString('tr-TR')} ₺</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function MiniCard({ icon, value, label }) {
  return (
    <div style={{
      background: 'var(--surface-card)', borderRadius: 'var(--radius-lg)',
      padding: 'var(--space-4)', border: '1px solid var(--border-primary)',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: '20px', marginBottom: '4px' }}>{icon}</div>
      <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800 }}>{value}</div>
      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{label}</div>
    </div>
  );
}

function AnalRow({ label, value, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ fontWeight: 700, color, fontSize: 'var(--text-sm)' }}>{value}</span>
    </div>
  );
}

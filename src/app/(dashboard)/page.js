import { getMany, getOne } from '@/lib/db';
import { headers } from 'next/headers';

async function getDashboardData(userId) {
  try {
    const [todayOrders, pendingOrders, todayMessages, totalContacts, activeProducts, recentActivity] = await Promise.all([
      getOne(`
        SELECT COUNT(*) as count, COALESCE(SUM(total_price), 0)::numeric as revenue 
        FROM orders WHERE created_at > NOW() - INTERVAL '24 hours' AND user_id = $1
      `, [userId]),
      getOne(`SELECT COUNT(*) as count FROM orders WHERE status = 'PENDING' AND user_id = $1`, [userId]),
      getOne(`SELECT COUNT(*) as count FROM messages WHERE timestamp > NOW() - INTERVAL '24 hours' AND user_id = $1`, [userId]),
      getOne(`SELECT COUNT(*) as count FROM contacts WHERE user_id = $1`, [userId]),
      getOne(`SELECT COUNT(*) as count FROM shopify_products WHERE status = 'active'`),
      getMany(`
        SELECT * FROM (
          (SELECT 'order' as type, order_name as title, status, total_price as amount, created_at as ts
          FROM orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5)
          UNION ALL
          (SELECT 'message' as type, SUBSTRING(content, 1, 40) as title, source as status, NULL::numeric as amount, timestamp as ts
          FROM messages ORDER BY timestamp DESC LIMIT 5)
        ) combined
        ORDER BY ts DESC LIMIT 8
      `, [userId]),
    ]);

    return {
      todayOrders: parseInt(todayOrders?.count || 0),
      revenue: parseFloat(todayOrders?.revenue || 0),
      pendingOrders: parseInt(pendingOrders?.count || 0),
      todayMessages: parseInt(todayMessages?.count || 0),
      totalContacts: parseInt(totalContacts?.count || 0),
      activeProducts: parseInt(activeProducts?.count || 0),
      recentActivity: recentActivity || [],
    };
  } catch (error) {
    console.error('Dashboard data error:', error);
    return {
      todayOrders: 0, revenue: 0, pendingOrders: 0,
      todayMessages: 0, totalContacts: 0, activeProducts: 0,
      recentActivity: [],
    };
  }
}

export default async function DashboardPage() {
  const headersList = await headers();
  const userId = headersList.get('x-user-id') || 1;
  const data = await getDashboardData(parseInt(userId));

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">📊 Dashboard</h1>
      </div>
      <div className="page-body">
        {/* Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-6)',
        }}>
          <StatCard icon="📦" value={data.todayOrders} label="Bugünkü Sipariş" color="var(--accent-purple)" />
          <StatCard icon="💰" value={`${data.revenue.toLocaleString('tr-TR')} ₺`} label="Bugünkü Gelir" color="var(--accent-green)" />
          <StatCard icon="💬" value={data.todayMessages} label="Bugünkü Mesaj" color="var(--accent-blue)" />
          <StatCard icon="⏳" value={data.pendingOrders} label="Bekleyen Sipariş" color="var(--accent-orange)" highlight={data.pendingOrders > 0} />
          <StatCard icon="👥" value={data.totalContacts} label="Toplam Kişi" color="var(--accent-cyan)" />
          <StatCard icon="🏷️" value={data.activeProducts} label="Aktif Ürün" color="var(--accent-pink)" />
        </div>

        {/* Recent Activity */}
        <div style={{
          background: 'var(--surface-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-primary)',
          backdropFilter: 'blur(20px)',
        }}>
          <div style={{
            padding: 'var(--space-4) var(--space-5)',
            borderBottom: '1px solid var(--border-primary)',
            fontWeight: 600,
          }}>
            ⚡ Son Aktiviteler
          </div>
          <div style={{ padding: 'var(--space-3) var(--space-5)' }}>
            {data.recentActivity.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', padding: 'var(--space-4) 0', textAlign: 'center' }}>
                Henüz aktivite yok
              </div>
            ) : (
              data.recentActivity.map((item, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                  padding: 'var(--space-2) 0',
                  borderBottom: i < data.recentActivity.length - 1 ? '1px solid var(--border-primary)' : 'none',
                }}>
                  <span style={{ fontSize: '16px' }}>{item.type === 'order' ? '📦' : '💬'}</span>
                  <span style={{ flex: 1, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }} className="truncate">
                    {item.title}
                  </span>
                  {item.amount && (
                    <span style={{ color: 'var(--accent-green-light)', fontWeight: 600, fontSize: 'var(--text-sm)' }}>
                      {parseFloat(item.amount).toLocaleString('tr-TR')} ₺
                    </span>
                  )}
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                    {item.ts ? new Date(item.ts).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function StatCard({ icon, value, label, color, highlight }) {
  return (
    <div style={{
      background: 'var(--surface-card)',
      borderRadius: 'var(--radius-lg)',
      padding: 'var(--space-5)',
      border: `1px solid ${highlight ? 'rgba(245,158,11,0.3)' : 'var(--border-primary)'}`,
      backdropFilter: 'blur(20px)',
      transition: 'all var(--transition-fast)',
      cursor: 'default',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute',
        top: '-10px',
        right: '-10px',
        fontSize: '60px',
        opacity: 0.05,
      }}>{icon}</div>
      <div style={{ fontSize: '28px', marginBottom: '4px' }}>{icon}</div>
      <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: '2px' }}>{label}</div>
    </div>
  );
}

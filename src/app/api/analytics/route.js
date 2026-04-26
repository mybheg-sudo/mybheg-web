import { NextResponse } from 'next/server';
import { getOne, getMany } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    const interval = `${days} days`;

    // ── Try to use pre-computed analytics_reports from WF-11 (if available) ──
    let cachedReport = null;
    try {
      cachedReport = await getOne(`
        SELECT report_data, created_at FROM analytics_reports 
        WHERE report_date >= CURRENT_DATE - INTERVAL '1 day'
        ORDER BY created_at DESC LIMIT 1
      `);
    } catch (e) {
      // Table may not exist yet — fall through to live queries
    }

    if (cachedReport && cachedReport.report_data && days <= 7) {
      // Use cached data for 7-day view (matches WF-11's 7-day window)
      const report = typeof cachedReport.report_data === 'string' 
        ? JSON.parse(cachedReport.report_data) : cachedReport.report_data;

      return NextResponse.json({
        success: true,
        source: 'cached',
        cached_at: cachedReport.created_at,
        data: {
          msgStats: {
            incoming: report.message_stats?.reduce((s, d) => s + (d.incoming || 0), 0) || 0,
            outgoing: report.message_stats?.reduce((s, d) => s + (d.outgoing || 0), 0) || 0,
            ai_responses: report.message_stats?.reduce((s, d) => s + (d.ai_responses || 0), 0) || 0,
            operator_responses: 0,
            system_messages: report.message_stats?.reduce((s, d) => s + (d.system_messages || 0), 0) || 0,
            failed: 0,
          },
          orderStats: {
            total: report.order_stats?.reduce((s, d) => s + (d.total_orders || 0), 0) || 0,
            approved: report.order_stats?.reduce((s, d) => s + (d.approved || 0), 0) || 0,
            rejected: report.order_stats?.reduce((s, d) => s + (d.rejected || 0), 0) || 0,
            pending: report.order_stats?.reduce((s, d) => s + (d.pending || 0), 0) || 0,
            timeout: report.order_stats?.reduce((s, d) => s + (d.timeout || 0), 0) || 0,
            total_revenue: report.order_stats?.reduce((s, d) => s + parseFloat(d.revenue || 0), 0) || 0,
            avg_order: report.summary?.today_revenue || 0,
          },
          customerStats: { total: 0, new_contacts: 0 }, // Not in WF-11 cache
          dailyOrders: (report.order_stats || []).map(d => ({ day: d.day, count: d.total_orders })),
          dailyMessages: (report.message_stats || []).map(d => ({ day: d.day, count: d.total_messages })),
          topProducts: (report.top_products || []).slice(0, 5).map(p => ({
            title: p.title, order_count: p.order_count, total_qty: p.units_sold, total_revenue: p.total_revenue
          })),
          orderSources: [],
        },
      });
    }

    // ── Fallback: Live SQL queries ──
    const [msgStats, orderStats, customerStats, dailyOrders, dailyMessages] = await Promise.all([
      // Message statistics
      getOne(`
        SELECT 
          COUNT(*) FILTER (WHERE direction = 'incoming')::int as incoming,
          COUNT(*) FILTER (WHERE direction = 'outgoing')::int as outgoing,
          COUNT(*) FILTER (WHERE source = 'ai')::int as ai_responses,
          COUNT(*) FILTER (WHERE source = 'operator')::int as operator_responses,
          COUNT(*) FILTER (WHERE source = 'system')::int as system_messages,
          COUNT(*) FILTER (WHERE status = 'failed')::int as failed
        FROM messages
        WHERE timestamp > NOW() - INTERVAL '${interval}'
      `),

      // Order statistics
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
        WHERE created_at > NOW() - INTERVAL '${interval}'
      `),

      // Customer statistics
      getOne(`
        SELECT 
          COUNT(*)::int as total,
          COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '${interval}')::int as new_contacts
        FROM contacts WHERE user_id = 1
      `),

      // Daily orders (last N days, grouped by day)
      getMany(`
        SELECT 
          TO_CHAR(d.day, 'DD/MM') as day,
          COALESCE(COUNT(o.id), 0)::int as count
        FROM generate_series(
          (NOW() - INTERVAL '${Math.min(days, 14)} days')::date,
          NOW()::date,
          '1 day'
        ) AS d(day)
        LEFT JOIN orders o ON o.created_at::date = d.day::date
        GROUP BY d.day
        ORDER BY d.day
      `),

      // Daily messages (last N days, grouped by day)
      getMany(`
        SELECT 
          TO_CHAR(d.day, 'DD/MM') as day,
          COALESCE(COUNT(m.id), 0)::int as count
        FROM generate_series(
          (NOW() - INTERVAL '${Math.min(days, 14)} days')::date,
          NOW()::date,
          '1 day'
        ) AS d(day)
        LEFT JOIN messages m ON m.timestamp::date = d.day::date
        GROUP BY d.day
        ORDER BY d.day
      `),
    ]);

    // Top products by order count
    const topProducts = await getMany(`
      SELECT li.title, COUNT(*)::int as order_count, SUM(li.quantity)::int as total_qty,
        SUM(li.price * li.quantity)::numeric as total_revenue
      FROM order_line_items li
      JOIN orders o ON o.id = li.order_id
      WHERE o.created_at > NOW() - INTERVAL '${interval}'
      GROUP BY li.title
      ORDER BY order_count DESC
      LIMIT 5
    `);

    // Order sources
    const orderSources = await getMany(`
      SELECT COALESCE(source_name, 'unknown') as source, COUNT(*)::int as count
      FROM orders
      WHERE created_at > NOW() - INTERVAL '${interval}'
      GROUP BY source_name
      ORDER BY count DESC
      LIMIT 5
    `);

    return NextResponse.json({
      success: true,
      source: 'live',
      data: { msgStats, orderStats, customerStats, dailyOrders, dailyMessages, topProducts, orderSources },
    });
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

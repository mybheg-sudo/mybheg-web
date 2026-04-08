import { NextResponse } from 'next/server';
import { getOne, getMany } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    const interval = `${days} days`;

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

    return NextResponse.json({
      success: true,
      data: { msgStats, orderStats, customerStats, dailyOrders, dailyMessages },
    });
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

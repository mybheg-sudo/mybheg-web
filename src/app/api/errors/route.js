import { NextResponse } from 'next/server';
import { getMany, getOne } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 30;
    const offset = (page - 1) * limit;
    const workflow = searchParams.get('workflow') || '';
    const search = searchParams.get('search') || '';

    let whereClause = 'WHERE 1=1';
    const params = [limit, offset];

    if (workflow) {
      params.push(workflow);
      whereClause += ` AND workflow_name = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      whereClause += ` AND (error_message ILIKE $${params.length} OR node_name ILIKE $${params.length} OR workflow_name ILIKE $${params.length})`;
    }

    const [logs, total, workflows] = await Promise.all([
      getMany(`
        SELECT id, workflow_name, workflow_id, node_name, error_message, 
               execution_id, execution_mode, created_at
        FROM error_logs
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2
      `, params),

      getOne(`SELECT COUNT(*)::int as count FROM error_logs ${whereClause.replace(/\$1|\$2/g, (m) => `$${parseInt(m.slice(1)) - 2}`)}`, params.slice(2)),

      // Get distinct workflows for filter dropdown
      getMany(`SELECT DISTINCT workflow_name FROM error_logs WHERE workflow_name IS NOT NULL ORDER BY workflow_name`),
    ]);

    return NextResponse.json({
      success: true,
      data: logs,
      workflows: workflows.map(w => w.workflow_name),
      pagination: { page, limit, total: total?.count || 0 },
    });
  } catch (error) {
    // If table doesn't exist yet, return empty
    if (error.message?.includes('does not exist')) {
      return NextResponse.json({ success: true, data: [], workflows: [], pagination: { page: 1, limit: 30, total: 0 } });
    }
    console.error('Error logs API error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

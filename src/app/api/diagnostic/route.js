import { NextResponse } from 'next/server';
import { getMany } from '@/lib/db';

export async function GET() {
  try {
    // 1. Tüm tabloları listele
    const tables = await getMany(`
      SELECT table_name, 
        (SELECT COUNT(*)::int FROM information_schema.columns c WHERE c.table_name = t.table_name AND c.table_schema = 'public') as column_count
      FROM information_schema.tables t
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    // 2. Her tablonun satır sayısını al
    const tableCounts = {};
    for (const t of tables) {
      try {
        const result = await getMany(`SELECT COUNT(*)::int as count FROM "${t.table_name}"`);
        tableCounts[t.table_name] = result[0]?.count || 0;
      } catch (e) {
        tableCounts[t.table_name] = `ERROR: ${e.message}`;
      }
    }

    // 3. Tüm sütunları al
    const columns = await getMany(`
      SELECT table_name, column_name, data_type, is_nullable, column_default,
        character_maximum_length
      FROM information_schema.columns
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position
    `);

    // 4. İndeksleri al
    const indexes = await getMany(`
      SELECT tablename, indexname, indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname
    `);

    // 5. Foreign key'leri al
    const foreignKeys = await getMany(`
      SELECT
        tc.table_name, tc.constraint_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
      ORDER BY tc.table_name
    `);

    // 6. DB boyutu
    const dbSize = await getMany(`SELECT pg_database_size(current_database()) as size_bytes`);

    return NextResponse.json({
      success: true,
      database: {
        name: process.env.DB_NAME,
        host: process.env.DB_HOST,
        size_bytes: dbSize[0]?.size_bytes,
        size_mb: (dbSize[0]?.size_bytes / 1024 / 1024).toFixed(2) + ' MB',
      },
      tables: tables.map(t => ({
        name: t.table_name,
        columns: t.column_count,
        rows: tableCounts[t.table_name],
      })),
      columns_by_table: columns.reduce((acc, col) => {
        if (!acc[col.table_name]) acc[col.table_name] = [];
        acc[col.table_name].push({
          name: col.column_name,
          type: col.data_type,
          nullable: col.is_nullable === 'YES',
          default: col.column_default,
        });
        return acc;
      }, {}),
      indexes: indexes,
      foreign_keys: foreignKeys,
    });
  } catch (error) {
    console.error('DB Diagnostic error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

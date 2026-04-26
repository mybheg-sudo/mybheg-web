'use client';
import { useState, useEffect } from 'react';

function TimeAgo({ date }) {
  if (!date) return '-';
  const d = new Date(date);
  const now = new Date();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return `${diff}s önce`;
  if (diff < 3600) return `${Math.floor(diff / 60)}dk önce`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}sa önce`;
  return `${Math.floor(diff / 86400)}g önce`;
}

export default function ErrorLogsPage() {
  const [logs, setLogs] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(null);

  const fetchLogs = () => {
    setLoading(true);
    const params = new URLSearchParams({ page, ...(filter && { workflow: filter }), ...(search && { search }) });
    fetch(`/api/errors?${params}`)
      .then(r => r.json())
      .then(res => {
        if (res.success) {
          setLogs(res.data || []);
          setWorkflows(res.workflows || []);
          setTotal(res.pagination?.total || 0);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchLogs(); }, [page, filter]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const totalPages = Math.ceil(total / 30);

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">🚨 Sistem Hataları</h1>
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginLeft: 'var(--space-3)' }}>
          n8n WF-13 Error Handler
        </span>
      </div>

      <div className="page-body">
        {/* Filters */}
        <div style={{
          display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-4)',
          alignItems: 'center', flexWrap: 'wrap'
        }}>
          <select
            value={filter}
            onChange={e => { setFilter(e.target.value); setPage(1); }}
            style={{
              background: 'var(--surface-card)', border: '1px solid var(--border-primary)',
              borderRadius: 'var(--radius-md)', padding: 'var(--space-2) var(--space-3)',
              color: 'var(--text-primary)', fontSize: 'var(--text-sm)',
            }}
          >
            <option value="">Tüm Workflow&apos;lar</option>
            {workflows.map(w => <option key={w} value={w}>{w}</option>)}
          </select>

          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 'var(--space-2)', flex: 1, maxWidth: '400px' }}>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Hata mesajı ara..."
              style={{
                flex: 1, background: 'var(--surface-card)', border: '1px solid var(--border-primary)',
                borderRadius: 'var(--radius-md)', padding: 'var(--space-2) var(--space-3)',
                color: 'var(--text-primary)', fontSize: 'var(--text-sm)',
              }}
            />
            <button type="submit" className="filter-btn active">Ara</button>
          </form>

          <div style={{ marginLeft: 'auto', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
            {total} hata kaydı
          </div>
        </div>

        {/* Error List */}
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Yükleniyor...</div>
        ) : logs.length === 0 ? (
          <div style={{
            padding: '60px', textAlign: 'center', color: 'var(--text-muted)',
            background: 'var(--surface-card)', borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-primary)',
          }}>
            <div style={{ fontSize: '40px', marginBottom: 'var(--space-3)' }}>✅</div>
            <div style={{ fontWeight: 600 }}>Hata kaydı bulunamadı</div>
            <div style={{ fontSize: 'var(--text-sm)', marginTop: 'var(--space-1)' }}>Sistem sorunsuz çalışıyor</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {logs.map(log => (
              <div
                key={log.id}
                onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                style={{
                  background: 'var(--surface-card)', borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-primary)', padding: 'var(--space-3) var(--space-4)',
                  cursor: 'pointer', transition: 'border-color 0.2s ease',
                  borderLeft: '3px solid var(--accent-red)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <span style={{ fontSize: '16px' }}>⚠️</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: '2px' }}>
                      <span style={{
                        fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--accent-purple)',
                        background: 'rgba(167, 139, 250, 0.1)', padding: '1px 8px', borderRadius: '4px',
                      }}>
                        {log.workflow_name || 'Unknown'}
                      </span>
                      {log.node_name && (
                        <span style={{
                          fontSize: 'var(--text-xs)', color: 'var(--text-muted)',
                          background: 'var(--surface-elevated)', padding: '1px 6px', borderRadius: '4px',
                        }}>
                          → {log.node_name}
                        </span>
                      )}
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginLeft: 'auto', flexShrink: 0 }}>
                        <TimeAgo date={log.created_at} />
                      </span>
                    </div>
                    <div style={{
                      fontSize: 'var(--text-sm)', color: 'var(--text-primary)',
                      overflow: 'hidden', textOverflow: 'ellipsis',
                      whiteSpace: expanded === log.id ? 'pre-wrap' : 'nowrap',
                      wordBreak: 'break-word',
                    }}>
                      {log.error_message || 'Bilinmeyen hata'}
                    </div>
                  </div>
                </div>

                {expanded === log.id && (
                  <div style={{
                    marginTop: 'var(--space-3)', paddingTop: 'var(--space-3)',
                    borderTop: '1px solid var(--border-primary)',
                    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)',
                    fontSize: 'var(--text-xs)', color: 'var(--text-muted)',
                  }}>
                    <div><strong>Execution ID:</strong> {log.execution_id || '-'}</div>
                    <div><strong>Mode:</strong> {log.execution_mode || '-'}</div>
                    <div><strong>Workflow ID:</strong> {log.workflow_id || '-'}</div>
                    <div><strong>Tarih:</strong> {log.created_at ? new Date(log.created_at).toLocaleString('tr-TR') : '-'}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{
            display: 'flex', justifyContent: 'center', gap: 'var(--space-2)',
            marginTop: 'var(--space-4)',
          }}>
            <button
              className="filter-btn"
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
            >← Önceki</button>
            <span style={{ padding: 'var(--space-2)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
              {page} / {totalPages}
            </span>
            <button
              className="filter-btn"
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
            >Sonraki →</button>
          </div>
        )}
      </div>
    </>
  );
}

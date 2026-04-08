'use client';

export default function Pagination({ page, total, limit, onPageChange }) {
  const totalPages = Math.ceil(total / limit);
  if (totalPages <= 1) return null;

  const getPages = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);

    if (start > 1) { pages.push(1); if (start > 2) pages.push('...'); }
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages) { if (end < totalPages - 1) pages.push('...'); pages.push(totalPages); }
    return pages;
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: 'var(--space-1)', padding: 'var(--space-4) var(--space-6)',
      borderTop: '1px solid var(--border-primary)',
    }}>
      <button
        className="btn btn-sm"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        style={{ minWidth: '32px', opacity: page <= 1 ? 0.4 : 1 }}
      >‹</button>

      {getPages().map((p, i) =>
        p === '...' ? (
          <span key={`dots-${i}`} style={{ padding: '0 4px', color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>…</span>
        ) : (
          <button
            key={p}
            className="btn btn-sm"
            onClick={() => onPageChange(p)}
            style={{
              minWidth: '32px',
              background: p === page ? 'var(--accent-purple)' : 'transparent',
              color: p === page ? '#fff' : 'var(--text-secondary)',
              fontWeight: p === page ? 700 : 400,
              border: p === page ? 'none' : '1px solid var(--border-primary)',
            }}
          >{p}</button>
        )
      )}

      <button
        className="btn btn-sm"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        style={{ minWidth: '32px', opacity: page >= totalPages ? 0.4 : 1 }}
      >›</button>

      <span style={{
        marginLeft: 'var(--space-3)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)',
      }}>
        {total} kayıt • Sayfa {page}/{totalPages}
      </span>
    </div>
  );
}

'use client';

export function SkeletonCard() {
  return (
    <div className="skeleton-user-card">
      <div className="skeleton-user-card-header">
        <div style={{ flex: 1 }}>
          <div className="skeleton" style={{ height: '24px', width: '60%', marginBottom: '12px' }} />
          <div style={{ display: 'flex', gap: '8px' }}>
            <div className="skeleton" style={{ height: '24px', width: '80px' }} />
            <div className="skeleton" style={{ height: '24px', width: '100px' }} />
          </div>
        </div>
      </div>

      <div className="skeleton-user-card-body">
        <div className="skeleton" style={{ height: '16px', width: '100%' }} />
        <div className="skeleton" style={{ height: '16px', width: '80%' }} />
        <div className="skeleton" style={{ height: '16px', width: '90%' }} />
      </div>

      <div className="skeleton-user-card-actions">
        <div className="skeleton" style={{ height: '44px' }} />
        <div className="skeleton" style={{ height: '44px' }} />
        <div className="skeleton" style={{ height: '44px' }} />
        <div className="skeleton" style={{ height: '44px' }} />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }) {
  return (
    <div style={{ padding: '20px' }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton skeleton-table-row" />
      ))}
    </div>
  );
}

export function SkeletonStats() {
  return (
    <div className="stats">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="skeleton skeleton-stat" />
      ))}
    </div>
  );
}

export function SkeletonUserCards({ count = 3 }) {
  return (
    <div className="user-cards">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

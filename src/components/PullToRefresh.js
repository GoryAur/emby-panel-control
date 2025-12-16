'use client';

import usePullToRefresh from '@/hooks/usePullToRefresh';

export default function PullToRefresh({ onRefresh, children }) {
  const { containerRef, isPulling, isRefreshing, pullDistance } = usePullToRefresh(onRefresh);

  const getStatusText = () => {
    if (isRefreshing) return 'Actualizando...';
    if (isPulling) return 'Suelta para actualizar';
    return 'Desliza hacia abajo';
  };

  return (
    <div ref={containerRef} className="pull-to-refresh-container" style={{ overflow: 'auto', height: '100%' }}>
      {/* Indicador de pull to refresh (solo visible en mobile) */}
      <div
        className={`pull-to-refresh-indicator ${isPulling ? 'pulling' : ''} ${isRefreshing ? 'refreshing' : ''}`}
        style={{
          display: pullDistance > 0 || isRefreshing ? 'flex' : 'none',
          opacity: Math.min(pullDistance / 80, 1)
        }}
      >
        <div className="pull-to-refresh-icon" />
        <span className="pull-to-refresh-text">{getStatusText()}</span>
      </div>

      {/* Contenido */}
      <div style={{ transform: `translateY(${Math.min(pullDistance, 80)}px)`, transition: isRefreshing || pullDistance === 0 ? 'transform 0.3s ease' : 'none' }}>
        {children}
      </div>
    </div>
  );
}

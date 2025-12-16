'use client';

import { useState } from 'react';

export default function AutoDisable({ onRefresh }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handlePreview = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/emby/check-expired', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dryRun: true }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        alert(data.error || 'Error al obtener preview');
      }
    } catch (error) {
      alert('Error al obtener preview');
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async () => {
    if (!confirm(`¿Deshabilitar todos los usuarios con suscripción vencida?`)) {
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/emby/check-expired', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dryRun: false }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
        onRefresh();
      } else {
        alert(data.error || 'Error al deshabilitar usuarios');
      }
    } catch (error) {
      alert('Error al deshabilitar usuarios');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auto-disable-panel">
      <h2>Deshabilitación por Vencimiento</h2>
      <p>
        Deshabilita automáticamente usuarios cuya suscripción haya vencido.
        Los administradores nunca serán deshabilitados.
      </p>

      <div className="button-group">
        <button
          className="btn btn-info"
          onClick={handlePreview}
          disabled={loading}
        >
          {loading ? 'Cargando...' : 'Vista Previa'}
        </button>
        <button
          className="btn btn-danger"
          onClick={handleExecute}
          disabled={loading}
        >
          {loading ? 'Procesando...' : 'Ejecutar Deshabilitación'}
        </button>
      </div>

      {result && (
        <div className={`result ${result.dryRun ? 'result-preview' : 'result-executed'}`}>
          <h3>{result.message}</h3>
          {result.users.length > 0 ? (
            <div className="users-list">
              <p><strong>Usuarios afectados:</strong></p>
              <ul>
                {result.users.map(user => (
                  <li key={user.id}>
                    <strong>{user.name}</strong> - Vencida hace {user.daysExpired} días
                    <br />
                    <small>Fecha de vencimiento: {new Date(user.expirationDate).toLocaleDateString('es-ES')}</small>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p>No hay usuarios con suscripción vencida.</p>
          )}
        </div>
      )}
    </div>
  );
}

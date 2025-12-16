'use client';

import { useState, useEffect } from 'react';

export default function ServerManagement() {
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingServer, setEditingServer] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    url: '',
    apiKey: '',
    enabled: true,
  });

  useEffect(() => {
    loadServers();
  }, []);

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const loadServers = async () => {
    try {
      const response = await fetch('/api/servers');
      const data = await response.json();
      if (response.ok) {
        setServers(data.servers);
      } else {
        showMessage(data.error || 'Error al cargar servidores', 'error');
      }
    } catch (error) {
      showMessage('Error al cargar servidores', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = editingServer ? '/api/servers' : '/api/servers';
      const method = editingServer ? 'PUT' : 'POST';
      const body = editingServer
        ? { serverId: editingServer.id, ...formData }
        : formData;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        showMessage(
          editingServer
            ? 'Servidor actualizado exitosamente'
            : 'Servidor agregado exitosamente'
        );
        setShowForm(false);
        setEditingServer(null);
        setFormData({ name: '', url: '', apiKey: '', enabled: true });
        loadServers();
      } else {
        showMessage(data.error || 'Error al guardar servidor', 'error');
      }
    } catch (error) {
      showMessage('Error al guardar servidor', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (server) => {
    setEditingServer(server);
    setFormData({
      name: server.name,
      url: server.url,
      apiKey: '', // No mostrar API key por seguridad
      enabled: server.enabled,
    });
    setShowForm(true);
  };

  const handleDelete = async (serverId, serverName) => {
    if (!confirm(`¿Eliminar servidor "${serverName}"?\n\nEsta acción no se puede deshacer.`)) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/servers?serverId=${serverId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        showMessage('Servidor eliminado exitosamente');
        loadServers();
      } else {
        showMessage(data.error || 'Error al eliminar servidor', 'error');
      }
    } catch (error) {
      showMessage('Error al eliminar servidor', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEnabled = async (serverId, currentStatus) => {
    setLoading(true);
    try {
      const response = await fetch('/api/servers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serverId, enabled: !currentStatus }),
      });

      const data = await response.json();

      if (response.ok) {
        showMessage(`Servidor ${!currentStatus ? 'habilitado' : 'deshabilitado'}`);
        loadServers();
      } else {
        showMessage(data.error || 'Error al cambiar estado', 'error');
      }
    } catch (error) {
      showMessage('Error al cambiar estado', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingServer(null);
    setFormData({ name: '', url: '', apiKey: '', enabled: true });
  };

  return (
    <div className="server-management">
      {message && (
        <div className={`message message-${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="server-header">
        <h2>Gestión de Servidores</h2>
        {!showForm && (
          <button
            className="btn btn-primary"
            onClick={() => setShowForm(true)}
            disabled={loading}
          >
            + Agregar Servidor
          </button>
        )}
      </div>

      {showForm && (
        <div className="server-form-container">
          <h3>{editingServer ? 'Editar Servidor' : 'Nuevo Servidor'}</h3>
          <form onSubmit={handleSubmit} className="server-form">
            <div className="form-row">
              <div className="form-group">
                <label>Nombre del servidor *</label>
                <input
                  type="text"
                  className="input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Emby Principal"
                  required
                />
              </div>

              <div className="form-group">
                <label>URL del servidor *</label>
                <input
                  type="url"
                  className="input"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://emby.ejemplo.com"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>API Key *</label>
              <input
                type="password"
                className="input"
                value={formData.apiKey}
                onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                placeholder={editingServer ? 'Dejar vacío para no cambiar' : 'API Key de administrador'}
                required={!editingServer}
              />
              <small>Obtén la API Key desde el panel de Emby → Avanzado → API Keys</small>
            </div>

            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.enabled}
                  onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                />
                <span>Servidor habilitado</span>
              </label>
            </div>

            <div className="button-group">
              <button type="submit" className="btn btn-success" disabled={loading}>
                {loading ? 'Guardando...' : editingServer ? 'Actualizar' : 'Agregar'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCancel}
                disabled={loading}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="servers-list">
        {servers.length === 0 ? (
          <div className="no-servers">
            <p>No hay servidores configurados</p>
            <p>Agrega tu primer servidor para comenzar</p>
          </div>
        ) : (
          <div className="servers-grid">
            {servers.map((server) => (
              <div key={server.id} className={`server-card ${!server.enabled ? 'disabled' : ''}`}>
                <div className="server-card-header">
                  <h3>{server.name}</h3>
                  <span className={`badge ${server.enabled ? 'badge-online' : 'badge-disabled'}`}>
                    {server.enabled ? 'Activo' : 'Deshabilitado'}
                  </span>
                </div>

                <div className="server-card-body">
                  <div className="server-info">
                    <label>URL:</label>
                    <span>{server.url}</span>
                  </div>

                  <div className="server-info">
                    <label>API Key:</label>
                    <span>{server.apiKey}</span>
                  </div>

                  <div className="server-info">
                    <label>Creado:</label>
                    <span>{new Date(server.createdAt).toLocaleDateString('es-ES')}</span>
                  </div>
                </div>

                <div className="server-card-actions">
                  <button
                    className="btn btn-small btn-info"
                    onClick={() => handleEdit(server)}
                    disabled={loading}
                  >
                    Editar
                  </button>
                  <button
                    className={`btn btn-small ${server.enabled ? 'btn-warning' : 'btn-success'}`}
                    onClick={() => handleToggleEnabled(server.id, server.enabled)}
                    disabled={loading}
                  >
                    {server.enabled ? 'Deshabilitar' : 'Habilitar'}
                  </button>
                  <button
                    className="btn btn-small btn-danger"
                    onClick={() => handleDelete(server.id, server.name)}
                    disabled={loading}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

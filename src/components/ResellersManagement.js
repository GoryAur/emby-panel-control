'use client';

import { useState, useEffect } from 'react';
import './ResellersManagement.css';

export default function ResellersManagement() {
  const [resellers, setResellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingReseller, setEditingReseller] = useState(null);

  // Estados del formulario
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
  });

  useEffect(() => {
    fetchResellers();
  }, []);

  const fetchResellers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/panel/users');
      if (response.ok) {
        const data = await response.json();
        // Filtrar solo resellers
        setResellers(data.users.filter(u => u.role === 'reseller'));
      } else {
        showMessage('Error al cargar resellers', 'error');
      }
    } catch (err) {
      console.error('Error al cargar resellers:', err);
      showMessage('Error de conexión', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleCreateReseller = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/panel/create-reseller', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        showMessage('Reseller creado exitosamente');
        setShowCreateModal(false);
        setFormData({ username: '', password: '', name: '' });
        fetchResellers();
      } else {
        showMessage(data.error || 'Error al crear reseller', 'error');
      }
    } catch (err) {
      console.error('Error al crear reseller:', err);
      showMessage('Error de conexión', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditReseller = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/panel/edit-reseller', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: editingReseller.id,
          ...formData,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showMessage('Reseller actualizado exitosamente');
        setShowEditModal(false);
        setEditingReseller(null);
        setFormData({ username: '', password: '', name: '' });
        fetchResellers();
      } else {
        showMessage(data.error || 'Error al actualizar reseller', 'error');
      }
    } catch (err) {
      console.error('Error al actualizar reseller:', err);
      showMessage('Error de conexión', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReseller = async (reseller) => {
    if (!confirm(`¿Eliminar reseller "${reseller.name}"?\n\nNOTA: Los usuarios de Emby creados por este reseller NO se eliminarán, pero quedarán sin asignar.`)) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/panel/delete-reseller', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: reseller.id }),
      });

      const data = await response.json();

      if (response.ok) {
        showMessage('Reseller eliminado exitosamente');
        fetchResellers();
      } else {
        showMessage(data.error || 'Error al eliminar reseller', 'error');
      }
    } catch (err) {
      console.error('Error al eliminar reseller:', err);
      showMessage('Error de conexión', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (reseller) => {
    setEditingReseller(reseller);
    setFormData({
      username: reseller.username,
      password: '',
      name: reseller.name,
    });
    setShowEditModal(true);
  };

  const closeModals = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setEditingReseller(null);
    setFormData({ username: '', password: '', name: '' });
  };

  return (
    <div className="resellers-container">
      {message && (
        <div className={`message message-${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="resellers-header">
        <h2>Gestión de Resellers</h2>
        <button
          className="btn btn-primary"
          onClick={() => setShowCreateModal(true)}
          disabled={loading}
        >
          ➕ Crear Reseller
        </button>
      </div>

      <div className="resellers-info">
        <p>Los resellers pueden acceder al panel y crear/gestionar únicamente los usuarios de Emby que ellos crean.</p>
        <p>Como administrador, puedes ver todos los usuarios y qué reseller creó cada uno.</p>
      </div>

      {loading && !showCreateModal && !showEditModal ? (
        <div className="loading">Cargando resellers...</div>
      ) : resellers.length === 0 ? (
        <div className="no-results">
          <p>No hay resellers creados todavía</p>
          <button
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            Crear primer reseller
          </button>
        </div>
      ) : (
        <table className="resellers-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Usuario</th>
              <th>Fecha de creación</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {resellers.map(reseller => (
              <tr key={reseller.id}>
                <td><strong>{reseller.name}</strong></td>
                <td>@{reseller.username}</td>
                <td>{new Date(reseller.createdAt).toLocaleDateString('es-ES')}</td>
                <td className="actions-cell">
                  <button
                    className="btn btn-small btn-info"
                    onClick={() => openEditModal(reseller)}
                    disabled={loading}
                    title="Editar reseller"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    className="btn btn-small btn-danger"
                    onClick={() => handleDeleteReseller(reseller)}
                    disabled={loading}
                    title="Eliminar reseller"
                  >
                    🗑️ Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Modal para crear reseller */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={closeModals}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>➕ Crear Reseller</h2>
              <button className="modal-close" onClick={closeModals} type="button">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateReseller} className="modal-form">
              <div className="form-group">
                <label htmlFor="name">Nombre completo *</label>
                <input
                  id="name"
                  type="text"
                  className="input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="Ej: Juan Pérez"
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label htmlFor="username">Nombre de usuario *</label>
                <input
                  id="username"
                  type="text"
                  className="input"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                  placeholder="Ej: juanperez"
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Contraseña *</label>
                <input
                  id="password"
                  type="password"
                  className="input"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  placeholder="Contraseña segura"
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeModals}
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Creando...' : 'Crear Reseller'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para editar reseller */}
      {showEditModal && editingReseller && (
        <div className="modal-overlay" onClick={closeModals}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>✏️ Editar Reseller</h2>
              <button className="modal-close" onClick={closeModals} type="button">
                ✕
              </button>
            </div>

            <form onSubmit={handleEditReseller} className="modal-form">
              <div className="form-group">
                <label htmlFor="edit-name">Nombre completo *</label>
                <input
                  id="edit-name"
                  type="text"
                  className="input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="Ej: Juan Pérez"
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-username">Nombre de usuario</label>
                <input
                  id="edit-username"
                  type="text"
                  className="input"
                  value={formData.username}
                  disabled
                  title="El nombre de usuario no se puede cambiar"
                />
                <small className="help-text">
                  ℹ️ El nombre de usuario no se puede cambiar
                </small>
              </div>

              <div className="form-group">
                <label htmlFor="edit-password">Nueva contraseña (opcional)</label>
                <input
                  id="edit-password"
                  type="password"
                  className="input"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Dejar vacío para no cambiar"
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeModals}
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

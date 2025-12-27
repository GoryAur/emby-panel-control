'use client';

import { useState, useEffect } from 'react';
import useSwipeToClose from '@/hooks/useSwipeToClose';
import './UserModal.css';

export default function UserModal({
  isOpen,
  onClose,
  onSubmit,
  servers,
  mode = 'create', // 'create' o 'edit'
  user = null, // Usuario a editar (solo para modo edit)
  currentUser = null, // Usuario actual para verificar permisos
}) {
  const { modalRef, isSwiping, swipeDistance } = useSwipeToClose(onClose);
  const [formData, setFormData] = useState({
    name: '',
    password: '',
    embyConnectEmail: '',
    serverId: '',
    expirationDate: '',
    isAdmin: false,
    userType: 'Basico', // 'Basico' o '1 Pantalla'
    libraryAccess: 'all', // 'all' o 'select'
    selectedLibraries: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [passwordError, setPasswordError] = useState(null);
  const [libraries, setLibraries] = useState([]);
  const [loadingLibraries, setLoadingLibraries] = useState(false);

  // Cargar bibliotecas cuando cambia el servidor
  useEffect(() => {
    if (formData.serverId && mode === 'create') {
      loadLibraries(formData.serverId);
    }
  }, [formData.serverId, mode]);

  // Inicializar formulario
  useEffect(() => {
    if (mode === 'edit' && user) {
      setFormData({
        name: user.Name || user.name || '',
        password: '',
        embyConnectEmail: user.embyConnectEmail || '',
        serverId: user.serverId || '',
        expirationDate: '',
        isAdmin: false,
        libraryAccess: 'all',
        selectedLibraries: [],
      });
    } else if (mode === 'create') {
      const defaultServerId = servers[0]?.id || '';
      setFormData({
        name: '',
        password: '',
        embyConnectEmail: '',
        serverId: defaultServerId,
        expirationDate: '',
        isAdmin: false,
        userType: 'Basico',
        libraryAccess: 'all',
        selectedLibraries: [],
      });
      if (defaultServerId) {
        loadLibraries(defaultServerId);
      }
    }
  }, [mode, user, servers, isOpen]);

  const loadLibraries = async (serverId) => {
    if (!serverId) return;

    setLoadingLibraries(true);
    try {
      const response = await fetch('/api/emby/libraries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serverId }),
      });

      const data = await response.json();

      if (response.ok) {
        setLibraries(data.libraries || []);
      } else {
        console.error('Error al cargar bibliotecas:', data.error);
        setLibraries([]);
      }
    } catch (err) {
      console.error('Error al cargar bibliotecas:', err);
      setLibraries([]);
    } finally {
      setLoadingLibraries(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setPasswordError(null);
    setLoading(true);

    try {
      // Validar contraseña si se proporciona
      if (formData.password && formData.password.length < 6) {
        setPasswordError('La contraseña debe tener al menos 6 caracteres');
        setLoading(false);
        return;
      }

      // Preparar datos según el modo de acceso a bibliotecas
      const submitData = { ...formData };
      if (mode === 'create') {
        if (formData.libraryAccess === 'all') {
          submitData.enabledLibraries = 'all';
        } else {
          submitData.enabledLibraries = formData.selectedLibraries;
        }
      }

      await onSubmit(submitData);
      handleClose();
    } catch (err) {
      setError(err.message || 'Error al procesar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      password: '',
      embyConnectEmail: '',
      serverId: servers[0]?.id || '',
      expirationDate: '',
      isAdmin: false,
      userType: 'Basico',
      libraryAccess: 'all',
      selectedLibraries: [],
    });
    setError(null);
    setPasswordError(null);
    setLibraries([]);
    onClose();
  };

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setFormData({ ...formData, password: newPassword });

    // Validar en tiempo real si hay contenido
    if (newPassword && newPassword.length < 6) {
      setPasswordError('La contraseña debe tener al menos 6 caracteres');
    } else {
      setPasswordError(null);
    }
  };

  const toggleLibrary = (libraryId) => {
    setFormData(prev => ({
      ...prev,
      selectedLibraries: prev.selectedLibraries.includes(libraryId)
        ? prev.selectedLibraries.filter(id => id !== libraryId)
        : [...prev.selectedLibraries, libraryId]
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay swipeable-modal" onClick={handleClose}>
      <div
        ref={modalRef}
        className={`modal-content ${isSwiping ? 'swiping' : ''}`}
        onClick={(e) => e.stopPropagation()}
        style={{
          transform: isSwiping ? `translateY(${swipeDistance}px)` : 'translateY(0)',
        }}
      >
        <div className="modal-header">
          <h2>{mode === 'create' ? '➕ Crear Usuario' : '✏️ Editar Usuario'}</h2>
          <button className="modal-close" onClick={handleClose} type="button">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {error && (
            <div className="modal-error">
              ⚠️ {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="name">
              Nombre de usuario *
            </label>
            <input
              id="name"
              type="text"
              className="input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              disabled={mode === 'edit'}
              placeholder="Ej: juan_perez"
              autoFocus
            />
            {mode === 'edit' && (
              <small className="help-text">
                ℹ️ El nombre de usuario no se puede cambiar en Emby
              </small>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">
              {mode === 'create' ? 'Contraseña (opcional)' : 'Nueva contraseña'}
            </label>
            <input
              id="password"
              type="password"
              className={`input ${passwordError ? 'input-error' : ''}`}
              value={formData.password}
              onChange={handlePasswordChange}
              placeholder={mode === 'create' ? 'Sin contraseña' : 'Dejar vacío para no cambiar'}
            />
            {passwordError && (
              <small className="error-text">
                ⚠️ {passwordError}
              </small>
            )}
            {!passwordError && formData.password && (
              <small className="success-text">
                ✓ Contraseña válida
              </small>
            )}
            <small className="help-text">
              ℹ️ Mínimo 6 caracteres
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="embyConnectEmail">
              Email de Emby Connect (opcional)
            </label>
            <input
              id="embyConnectEmail"
              type="email"
              className="input"
              value={formData.embyConnectEmail}
              onChange={(e) => setFormData({ ...formData, embyConnectEmail: e.target.value })}
              placeholder="usuario@ejemplo.com"
            />
            <small className="help-text">
              ℹ️ Vincula el usuario con una cuenta de Emby Connect existente para acceso remoto
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="serverId">
              Servidor *
            </label>
            <select
              id="serverId"
              className="input-select"
              value={formData.serverId}
              onChange={(e) => setFormData({ ...formData, serverId: e.target.value })}
              required
              disabled={mode === 'edit'}
            >
              {servers.length === 0 ? (
                <option value="">No hay servidores disponibles</option>
              ) : (
                servers.map((server) => (
                  <option key={server.id} value={server.id}>
                    {server.name}
                  </option>
                ))
              )}
            </select>
            {mode === 'edit' && (
              <small className="help-text">
                ℹ️ Los usuarios no se pueden mover entre servidores
              </small>
            )}
          </div>

          {mode === 'create' && (
            <>
              <div className="form-group">
                <label htmlFor="expirationDate">
                  Fecha de vencimiento (opcional)
                </label>
                <input
                  id="expirationDate"
                  type="date"
                  className="input-date"
                  value={formData.expirationDate}
                  onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                />
                <small className="help-text">
                  ℹ️ Puedes establecer esto después desde la tabla de usuarios
                </small>
              </div>

              <div className="form-group">
                <label htmlFor="userType">
                  Tipo de usuario *
                </label>
                <select
                  id="userType"
                  className="input-select"
                  value={formData.userType}
                  onChange={(e) => setFormData({ ...formData, userType: e.target.value })}
                  required
                >
                  <option value="Basico">Básico</option>
                  <option value="1 Pantalla">1 Pantalla</option>
                </select>
                <small className="help-text">
                  ℹ️ Se copiará la configuración y políticas del usuario plantilla seleccionado
                </small>
              </div>

              {currentUser?.role === 'admin' && (
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.isAdmin}
                      onChange={(e) => setFormData({ ...formData, isAdmin: e.target.checked })}
                    />
                    <span>Administrador del servidor</span>
                  </label>
                  <small className="help-text">
                    ℹ️ Los administradores tienen acceso completo a la configuración del servidor
                  </small>
                </div>
              )}

              <div className="form-group">
                <label>Acceso a bibliotecas</label>
                <div className="radio-group">
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="libraryAccess"
                      value="all"
                      checked={formData.libraryAccess === 'all'}
                      onChange={(e) => setFormData({ ...formData, libraryAccess: e.target.value, selectedLibraries: [] })}
                    />
                    <span>Todas las bibliotecas</span>
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="libraryAccess"
                      value="select"
                      checked={formData.libraryAccess === 'select'}
                      onChange={(e) => setFormData({ ...formData, libraryAccess: e.target.value })}
                    />
                    <span>Seleccionar específicas</span>
                  </label>
                </div>

                {formData.libraryAccess === 'select' && (
                  <div className="libraries-list">
                    {loadingLibraries ? (
                      <p className="loading-text">Cargando bibliotecas...</p>
                    ) : libraries.length === 0 ? (
                      <p className="no-libraries">No hay bibliotecas disponibles</p>
                    ) : (
                      libraries.map(lib => (
                        <label key={lib.id} className="checkbox-label library-item">
                          <input
                            type="checkbox"
                            checked={formData.selectedLibraries.includes(lib.id)}
                            onChange={() => toggleLibrary(lib.id)}
                          />
                          <span>{lib.name}</span>
                          {lib.type && <span className="library-type">({lib.type})</span>}
                        </label>
                      ))
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleClose}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || servers.length === 0}
            >
              {loading ? 'Procesando...' : mode === 'create' ? 'Crear Usuario' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

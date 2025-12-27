'use client';

import { useState, useMemo, useEffect } from 'react';
import UserModal from './UserModal';

export default function UserTable({ users, subscriptions, servers, onRefresh }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [expirationDate, setExpirationDate] = useState('');

  // Estados para modales CRUD
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [userToEdit, setUserToEdit] = useState(null);

  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [subscriptionFilter, setSubscriptionFilter] = useState('all');
  const [serverFilter, setServerFilter] = useState('all');

  // Estados para sistema de resellers
  const [currentUser, setCurrentUser] = useState(null);
  const [panelUsers, setPanelUsers] = useState([]);

  // Cargar usuario actual y usuarios del panel
  useEffect(() => {
    fetchCurrentUser();
    fetchPanelUsers();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data.user);
      }
    } catch (err) {
      console.error('Error al cargar usuario actual:', err);
    }
  };

  const fetchPanelUsers = async () => {
    try {
      const response = await fetch('/api/panel/users');
      if (response.ok) {
        const data = await response.json();
        setPanelUsers(data.users || []);
      }
    } catch (err) {
      console.error('Error al cargar usuarios del panel:', err);
    }
  };

  const isAdmin = currentUser?.role === 'admin';

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  // Obtener clave de suscripción
  const getSubKey = (userId, serverId) => `${serverId}__${userId}`;

  // Obtener nombre del creador
  const getCreatorName = (userId, serverId) => {
    const subKey = getSubKey(userId, serverId);
    const subscription = subscriptions[subKey];

    if (!subscription?.createdBy) {
      return 'N/A';
    }

    const creator = panelUsers.find(u => u.id === subscription.createdBy);
    return creator?.name || 'Desconocido';
  };

  // Filtrado de usuarios
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      // Filtro de búsqueda por nombre
      const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase());

      // Filtro por servidor
      const matchesServer = serverFilter === 'all' || user.serverId === serverFilter;

      // Filtro por estado
      let matchesStatus = true;
      if (statusFilter === 'online') matchesStatus = user.isOnline && !user.isDisabled;
      else if (statusFilter === 'offline') matchesStatus = !user.isOnline && !user.isDisabled;
      else if (statusFilter === 'disabled') matchesStatus = user.isDisabled;

      // Filtro por suscripción
      let matchesSubscription = true;
      const subKey = getSubKey(user.id, user.serverId);

      // Los administradores de Emby no se filtran por suscripción
      if (!user.isAdministrator) {
        if (subscriptionFilter === 'active') {
          const sub = subscriptions[subKey];
          if (sub?.expirationDate) {
            const expDate = new Date(sub.expirationDate);
            const now = new Date();
            const daysLeft = Math.ceil((expDate - now) / (1000 * 60 * 60 * 24));
            matchesSubscription = daysLeft > 7;
          } else {
            matchesSubscription = false;
          }
        } else if (subscriptionFilter === 'expiring') {
          const sub = subscriptions[subKey];
          if (sub?.expirationDate) {
            const expDate = new Date(sub.expirationDate);
            const now = new Date();
            const daysLeft = Math.ceil((expDate - now) / (1000 * 60 * 60 * 24));
            matchesSubscription = daysLeft >= 0 && daysLeft <= 7;
          } else {
            matchesSubscription = false;
          }
        } else if (subscriptionFilter === 'expired') {
          const sub = subscriptions[subKey];
          if (sub?.expirationDate) {
            const expDate = new Date(sub.expirationDate);
            const now = new Date();
            matchesSubscription = expDate < now;
          } else {
            matchesSubscription = false;
          }
        } else if (subscriptionFilter === 'none') {
          matchesSubscription = !subscriptions[subKey]?.expirationDate;
        }
      }

      return matchesSearch && matchesServer && matchesStatus && matchesSubscription;
    });
  }, [users, subscriptions, searchTerm, statusFilter, subscriptionFilter, serverFilter]);

  const handleStopPlayback = async (sessionId, serverId, userName, deviceName) => {
    setLoading(true);
    try {
      const response = await fetch('/api/emby/stop-playback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, serverId }),
      });

      const data = await response.json();

      if (response.ok) {
        showMessage(`Reproducción detenida en ${deviceName}`);
        onRefresh();
      } else {
        showMessage(data.error || 'Error al detener reproducción', 'error');
      }
    } catch (error) {
      showMessage('Error al detener reproducción', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUser = async (userId, serverId, userName, enable) => {
    const action = enable ? 'habilitar' : 'deshabilitar';
    const message = enable
      ? `¿Habilitar a ${userName}?`
      : `¿Deshabilitar a ${userName}?\n\nEsto cerrará todas sus sesiones activas y no podrá iniciar sesión hasta que lo habilites nuevamente.`;
    if (!confirm(message)) return;

    setLoading(true);
    try {
      const response = await fetch('/api/emby/toggle-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, serverId, enable }),
      });

      const data = await response.json();

      if (response.ok) {
        const successMsg = enable
          ? `Usuario ${userName} habilitado exitosamente`
          : `Usuario ${userName} deshabilitado y desconectado de todos sus dispositivos`;
        showMessage(successMsg);
        onRefresh();
      } else {
        showMessage(data.error || 'Error al cambiar estado del usuario', 'error');
      }
    } catch (error) {
      showMessage('Error al cambiar estado del usuario', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditExpiration = (userId, serverId) => {
    const subKey = getSubKey(userId, serverId);
    const sub = subscriptions[subKey];
    setEditingUser({ userId, serverId });
    if (sub?.expirationDate) {
      const date = new Date(sub.expirationDate);
      setExpirationDate(date.toISOString().split('T')[0]);
    } else {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      setExpirationDate(futureDate.toISOString().split('T')[0]);
    }
  };

  const handleSaveExpiration = async (userId, serverId, userName) => {
    if (!expirationDate) {
      showMessage('Selecciona una fecha de vencimiento', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/emby/set-expiration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, serverId, expirationDate }),
      });

      const data = await response.json();

      if (response.ok) {
        showMessage(`Fecha de vencimiento actualizada para ${userName}`);
        setEditingUser(null);
        onRefresh();
      } else {
        showMessage(data.error || 'Error al actualizar fecha', 'error');
      }
    } catch (error) {
      showMessage('Error al actualizar fecha', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleExtendSubscription = async (userId, serverId, userName, months = 1) => {
    setLoading(true);
    try {
      const response = await fetch('/api/emby/extend-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, serverId, months }),
      });

      const data = await response.json();

      if (response.ok) {
        showMessage(`Suscripción de ${userName} extendida ${months} mes(es)`);
        onRefresh();
      } else {
        showMessage(data.error || 'Error al extender suscripción', 'error');
      }
    } catch (error) {
      showMessage('Error al extender suscripción', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Funciones CRUD de usuarios

  const handleCreateUser = async (formData) => {
    const response = await fetch('/api/emby/create-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Error al crear usuario');
    }

    showMessage(`Usuario ${formData.name} creado exitosamente`);
    onRefresh();
  };

  const handleOpenEditModal = (user) => {
    setUserToEdit(user);
    setShowEditModal(true);
  };

  const handleEditUser = async (formData) => {
    const response = await fetch('/api/emby/edit-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: userToEdit.id,
        serverId: userToEdit.serverId,
        name: formData.name,
        password: formData.password || undefined,
        embyConnectEmail: formData.embyConnectEmail,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Error al editar usuario');
    }

    showMessage(`Usuario ${userToEdit.name} actualizado exitosamente`);
    onRefresh();
  };

  const handleDeleteUser = async (userId, serverId, userName) => {
    const confirmed = confirm(`¿Estás seguro de eliminar al usuario "${userName}"?\n\nEsta acción no se puede deshacer.`);

    if (!confirmed) return;

    setLoading(true);
    try {
      const response = await fetch('/api/emby/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, serverId }),
      });

      const data = await response.json();

      if (response.ok) {
        showMessage(`Usuario ${userName} eliminado exitosamente`);
        onRefresh();
      } else {
        showMessage(data.error || 'Error al eliminar usuario', 'error');
      }
    } catch (error) {
      showMessage('Error al eliminar usuario', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setSubscriptionFilter('all');
    setServerFilter('all');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Sin fecha';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES');
  };

  const getStatusBadge = (user) => {
    if (user.isDisabled) {
      return <span className="badge badge-disabled">Deshabilitado</span>;
    }
    if (user.isOnline) {
      return <span className="badge badge-online">En línea</span>;
    }
    return <span className="badge badge-offline">Desconectado</span>;
  };

  const getExpirationStatus = (userId, serverId) => {
    const subKey = getSubKey(userId, serverId);
    const sub = subscriptions[subKey];
    if (!sub?.expirationDate) {
      return <span className="badge badge-warning">Sin suscripción</span>;
    }

    const now = new Date();
    const expDate = new Date(sub.expirationDate);
    const daysLeft = Math.ceil((expDate - now) / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) {
      return <span className="badge badge-expired">Vencida ({Math.abs(daysLeft)} días)</span>;
    } else if (daysLeft <= 7) {
      return <span className="badge badge-expiring">Vence en {daysLeft} días</span>;
    } else {
      return <span className="badge badge-active">Activa ({daysLeft} días)</span>;
    }
  };

  const hasActiveFilters = searchTerm || statusFilter !== 'all' || subscriptionFilter !== 'all' || serverFilter !== 'all';

  return (
    <>
      {message && (
        <div className={`message message-${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="filters-container">
        <div className="search-box">
          <input
            type="text"
            placeholder="🔍 Buscar por nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input input-search"
          />
          <button
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
            disabled={loading || servers.length === 0}
            title="Crear nuevo usuario en Emby"
          >
            ➕ Crear Usuario
          </button>
        </div>

        <div className="filters-group">
          {servers.length > 1 && (
            <div className="filter-item">
              <label>Servidor:</label>
              <select
                value={serverFilter}
                onChange={(e) => setServerFilter(e.target.value)}
                className="input input-select"
              >
                <option value="all">Todos</option>
                {servers.map(server => (
                  <option key={server.id} value={server.id}>{server.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="filter-item">
            <label>Estado:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input input-select"
            >
              <option value="all">Todos</option>
              <option value="online">En línea</option>
              <option value="offline">Desconectados</option>
              <option value="disabled">Deshabilitados</option>
            </select>
          </div>

          <div className="filter-item">
            <label>Suscripción:</label>
            <select
              value={subscriptionFilter}
              onChange={(e) => setSubscriptionFilter(e.target.value)}
              className="input input-select"
            >
              <option value="all">Todas</option>
              <option value="active">Activas</option>
              <option value="expiring">Por vencer</option>
              <option value="expired">Vencidas</option>
              <option value="none">Sin suscripción</option>
            </select>
          </div>

          {hasActiveFilters && (
            <button
              className="btn btn-secondary btn-clear-filters"
              onClick={handleClearFilters}
            >
              Limpiar filtros
            </button>
          )}
        </div>

        <div className="results-count">
          Mostrando <strong>{filteredUsers.length}</strong> de <strong>{users.length}</strong> usuarios
        </div>
      </div>

      {/* Vista Mobile: Cards */}
      <div className="user-cards mobile-only">
        {filteredUsers.length === 0 ? (
          <div className="no-results">
            <p>No se encontraron usuarios con los filtros seleccionados</p>
            {hasActiveFilters && (
              <button className="btn btn-primary" onClick={handleClearFilters}>
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          filteredUsers.map(user => (
            <div key={`${user.serverId}-${user.id}`} className={`user-card ${user.isDisabled ? 'disabled' : ''}`}>
              {/* Header */}
              <div className="user-card-header">
                <div className="user-card-title">
                  <div className="user-card-name">
                    {user.name}
                    {user.hasEmbyConnect && (
                      <span className="emby-connect-icon" title={`Vinculado a Emby Connect${user.embyConnectEmail ? `: ${user.embyConnectEmail}` : ''}`}>
                        ☁️
                      </span>
                    )}
                    {user.isAdministrator && (
                      <span className="badge badge-admin">Admin</span>
                    )}
                  </div>
                  <div className="user-card-status">
                    {getStatusBadge(user)}
                    {getExpirationStatus(user.id, user.serverId)}
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="user-card-body">
                {servers.length > 1 && (
                  <div className="user-card-row">
                    <span className="user-card-row-label">Servidor:</span>
                    <span className="user-card-row-value">
                      <span className="server-badge">{user.serverName}</span>
                    </span>
                  </div>
                )}

                <div className="user-card-row">
                  <span className="user-card-row-label">Vencimiento:</span>
                  <span className="user-card-row-value">
                    {editingUser && editingUser.userId === user.id && editingUser.serverId === user.serverId ? (
                      <div className="edit-expiration">
                        <input
                          type="date"
                          value={expirationDate}
                          onChange={(e) => setExpirationDate(e.target.value)}
                          className="input input-date"
                        />
                        <button
                          className="btn btn-small btn-success"
                          onClick={() => handleSaveExpiration(user.id, user.serverId, user.name)}
                          disabled={loading}
                        >
                          ✓
                        </button>
                        <button
                          className="btn btn-small btn-secondary"
                          onClick={() => setEditingUser(null)}
                          disabled={loading}
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <>
                        {formatDate(subscriptions[getSubKey(user.id, user.serverId)]?.expirationDate)}
                        {!user.isAdministrator && (
                          <button
                            className="btn btn-small btn-info"
                            onClick={() => handleEditExpiration(user.id, user.serverId)}
                            disabled={loading}
                            style={{ marginLeft: '8px' }}
                          >
                            📅
                          </button>
                        )}
                      </>
                    )}
                  </span>
                </div>

                {isAdmin && (
                  <div className="user-card-row">
                    <span className="user-card-row-label">Creado por:</span>
                    <span className="user-card-row-value">{getCreatorName(user.id, user.serverId)}</span>
                  </div>
                )}

                {user.activeSessions.length > 0 && (
                  <div className="user-card-sessions">
                    <div className="user-card-sessions-title">Sesiones Activas</div>
                    {user.activeSessions.map(session => (
                      <div key={session.id} className="user-card-session-item">
                        <div className="user-card-session-info">
                          <div>{session.deviceName}</div>
                          <div>{session.client}</div>
                        </div>
                        <button
                          className="btn btn-small btn-warning"
                          onClick={() => handleStopPlayback(session.id, user.serverId, user.name, session.deviceName)}
                          disabled={loading}
                          title="Detener reproducción"
                        >
                          ⏹
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              {!user.isAdministrator && (
                <div className="user-card-actions">
                  <button
                    className="btn btn-primary"
                    onClick={() => handleExtendSubscription(user.id, user.serverId, user.name, 1)}
                    disabled={loading}
                  >
                    +1 mes
                  </button>
                  <button
                    className="btn btn-info"
                    onClick={() => handleOpenEditModal(user)}
                    disabled={loading}
                  >
                    ✏️ Editar
                  </button>
                  <button
                    className={`btn ${user.isDisabled ? 'btn-success' : 'btn-warning'}`}
                    onClick={() => handleToggleUser(user.id, user.serverId, user.name, user.isDisabled)}
                    disabled={loading}
                  >
                    {user.isDisabled ? '✓ Habilitar' : '✕ Deshabilitar'}
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleDeleteUser(user.id, user.serverId, user.name)}
                    disabled={loading}
                  >
                    🗑️ Eliminar
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Vista Desktop: Tabla */}
      <div className="table-container desktop-only">
        {filteredUsers.length === 0 ? (
          <div className="no-results">
            <p>No se encontraron usuarios con los filtros seleccionados</p>
            {hasActiveFilters && (
              <button className="btn btn-primary" onClick={handleClearFilters}>
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <table className="user-table">
            <thead>
              <tr>
                <th>Usuario</th>
                {servers.length > 1 && <th>Servidor</th>}
                <th>Estado</th>
                <th>Suscripción</th>
                <th>Vencimiento</th>
                {isAdmin && <th>Creado por</th>}
                <th>Sesiones activas</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={`${user.serverId}-${user.id}`} className={user.isDisabled ? 'disabled-row' : ''}>
                  <td>
                    <div className="user-info">
                      <strong>{user.name}</strong>
                      {user.hasEmbyConnect && (
                        <span className="emby-connect-icon" title={`Vinculado a Emby Connect${user.embyConnectEmail ? `: ${user.embyConnectEmail}` : ''}`}>
                          ☁️
                        </span>
                      )}
                      {user.isAdministrator && (
                        <span className="badge badge-admin">Admin</span>
                      )}
                    </div>
                  </td>
                  {servers.length > 1 && (
                    <td>
                      <span className="server-badge">{user.serverName}</span>
                    </td>
                  )}
                  <td>{getStatusBadge(user)}</td>
                  <td>{getExpirationStatus(user.id, user.serverId)}</td>
                  <td>
                    {editingUser && editingUser.userId === user.id && editingUser.serverId === user.serverId ? (
                      <div className="edit-expiration">
                        <input
                          type="date"
                          value={expirationDate}
                          onChange={(e) => setExpirationDate(e.target.value)}
                          className="input input-date"
                        />
                        <button
                          className="btn btn-small btn-success"
                          onClick={() => handleSaveExpiration(user.id, user.serverId, user.name)}
                          disabled={loading}
                        >
                          ✓
                        </button>
                        <button
                          className="btn btn-small btn-secondary"
                          onClick={() => setEditingUser(null)}
                          disabled={loading}
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="expiration-display">
                        <span>{formatDate(subscriptions[getSubKey(user.id, user.serverId)]?.expirationDate)}</span>
                        {!user.isAdministrator && (
                          <button
                            className="btn btn-small btn-info"
                            onClick={() => handleEditExpiration(user.id, user.serverId)}
                            disabled={loading}
                            title="Editar fecha"
                          >
                            📅
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                  {isAdmin && (
                    <td>
                      <span className="creator-name">{getCreatorName(user.id, user.serverId)}</span>
                    </td>
                  )}
                  <td>
                    {user.activeSessions.length > 0 ? (
                      <div className="sessions">
                        {user.activeSessions.map(session => (
                          <div key={session.id} className="session-item">
                            <span>{session.deviceName} ({session.client})</span>
                            <button
                              className="btn btn-small btn-warning"
                              onClick={() => handleStopPlayback(session.id, user.serverId, user.name, session.deviceName)}
                              disabled={loading}
                              title="Detener reproducción actual"
                            >
                              ⏹
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="no-sessions">Sin sesiones</span>
                    )}
                  </td>
                  <td>
                    <div className="actions">
                      {!user.isAdministrator && (
                        <>
                          <button
                            className="btn btn-small btn-primary"
                            onClick={() => handleExtendSubscription(user.id, user.serverId, user.name, 1)}
                            disabled={loading}
                            title="Extender 1 mes"
                          >
                            +1 mes
                          </button>
                          <button
                            className="btn btn-small btn-info"
                            onClick={() => handleOpenEditModal(user)}
                            disabled={loading}
                            title="Editar usuario"
                          >
                            ✏️
                          </button>
                          <button
                            className={`btn btn-small ${user.isDisabled ? 'btn-success' : 'btn-warning'}`}
                            onClick={() => handleToggleUser(user.id, user.serverId, user.name, user.isDisabled)}
                            disabled={loading}
                            title={user.isDisabled ? 'Habilitar usuario' : 'Deshabilitar usuario'}
                          >
                            {user.isDisabled ? '✓' : '✕'}
                          </button>
                          <button
                            className="btn btn-small btn-danger"
                            onClick={() => handleDeleteUser(user.id, user.serverId, user.name)}
                            disabled={loading}
                            title="Eliminar usuario permanentemente"
                          >
                            🗑️
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal para crear usuario */}
      <UserModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateUser}
        servers={servers}
        mode="create"
        currentUser={currentUser}
      />

      {/* Modal para editar usuario */}
      <UserModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setUserToEdit(null);
        }}
        onSubmit={handleEditUser}
        servers={servers}
        mode="edit"
        user={userToEdit}
        currentUser={currentUser}
      />
    </>
  );
}

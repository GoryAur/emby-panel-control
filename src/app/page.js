'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import UserTable from '@/components/UserTable';
import AutoDisable from '@/components/AutoDisable';
import ServerManagement from '@/components/ServerManagement';
import ResellersManagement from '@/components/ResellersManagement';
import { SkeletonStats, SkeletonUserCards, SkeletonTable } from '@/components/SkeletonLoader';
import PullToRefresh from '@/components/PullToRefresh';

export default function Home() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [subscriptions, setSubscriptions] = useState({});
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('users');
  const [darkMode, setDarkMode] = useState(true); // Modo oscuro por defecto
  const [currentUser, setCurrentUser] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [usersRes, subsRes, serversRes] = await Promise.all([
        fetch('/api/emby/users'),
        fetch('/api/emby/subscriptions'),
        fetch('/api/servers'),
      ]);

      const usersData = await usersRes.json();
      const subsData = await subsRes.json();
      const serversData = await serversRes.json();

      if (usersRes.ok) {
        setUsers(usersData);
      } else {
        setError(usersData.error || 'Error al cargar usuarios');
      }

      if (subsRes.ok) {
        setSubscriptions(subsData);
      }

      if (serversRes.ok) {
        setServers(serversData.servers);
      }
    } catch (err) {
      setError('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data.user);
      }
    } catch (err) {
      console.error('Error al cargar usuario:', err);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
    }
  };

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserMenu && !event.target.closest('.user-menu-container')) {
        setShowUserMenu(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape' && showUserMenu) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showUserMenu]);

  // Cargar preferencia de modo oscuro (por defecto oscuro)
  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode === null || savedMode === 'true') {
      setDarkMode(true);
      document.documentElement.classList.add('dark-mode');
    } else {
      setDarkMode(false);
    }
  }, []);

  // Aplicar modo oscuro
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark-mode');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark-mode');
      localStorage.setItem('darkMode', 'false');
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const getExpiredCount = () => {
    const now = new Date();
    return users.filter(u => {
      if (u.isDisabled || u.isAdministrator) return false;
      const subKey = `${u.serverId}__${u.id}`;
      const sub = subscriptions[subKey];
      if (!sub?.expirationDate) return false;
      return new Date(sub.expirationDate) < now;
    }).length;
  };

  const stats = {
    total: users.length,
    online: users.filter(u => u.isOnline).length,
    disabled: users.filter(u => u.isDisabled).length,
    expired: getExpiredCount(),
  };

  return (
    <div className="container">
      <header className="header">
        <h1>Panel de Control - Emby</h1>
        <div className="header-actions">
          <button className="btn btn-icon" onClick={toggleDarkMode} title={darkMode ? 'Modo claro' : 'Modo oscuro'}>
            {darkMode ? '☀️' : '🌙'}
          </button>
          <button className="btn btn-primary" onClick={fetchData} disabled={loading}>
            {loading ? 'Cargando...' : 'Actualizar'}
          </button>
          {currentUser && (
            <div className="user-menu-container">
              <button
                className="btn btn-user"
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="18" height="18">
                  <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>{currentUser.name}</span>
              </button>
              {showUserMenu && (
                <div className="user-menu-dropdown">
                  <div className="user-menu-header">
                    <strong>{currentUser.name}</strong>
                    <span className="user-menu-username">@{currentUser.username}</span>
                  </div>
                  <button className="user-menu-item" onClick={handleLogout}>
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="18" height="18">
                      <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9M16 17L21 12M21 12L16 7M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Cerrar Sesión
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {loading && users.length === 0 ? (
        <SkeletonStats />
      ) : (
        <div className="stats">
          <div className="stat-card">
            <span className="stat-label">Total Usuarios</span>
            <span className="stat-value">{stats.total}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">En Línea</span>
            <span className="stat-value stat-online">{stats.online}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Deshabilitados</span>
            <span className="stat-value stat-disabled">{stats.disabled}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Suscripciones Vencidas</span>
            <span className="stat-value stat-warning">{stats.expired}</span>
          </div>
        </div>
      )}

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Gestión de Usuarios
        </button>
        {currentUser?.role === 'admin' && (
          <button
            className={`tab ${activeTab === 'servers' ? 'active' : ''}`}
            onClick={() => setActiveTab('servers')}
          >
            Servidores
          </button>
        )}
        {currentUser?.role === 'admin' && (
          <button
            className={`tab ${activeTab === 'resellers' ? 'active' : ''}`}
            onClick={() => setActiveTab('resellers')}
          >
            Resellers
          </button>
        )}
        {currentUser?.role === 'admin' && (
          <button
            className={`tab ${activeTab === 'auto' ? 'active' : ''}`}
            onClick={() => setActiveTab('auto')}
          >
            Deshabilitación Automática
          </button>
        )}
      </div>

      <div className="content">
        {error && activeTab === 'users' && (
          <div className="error-message">
            <p>⚠️ {error}</p>
            <p>Verifica que los servidores Emby estén corriendo y que la configuración sea correcta.</p>
          </div>
        )}

        {activeTab === 'users' && (
          <>
            {loading && users.length === 0 ? (
              <>
                {/* Skeleton móvil */}
                <div className="mobile-only">
                  <SkeletonUserCards count={3} />
                </div>
                {/* Skeleton desktop */}
                <div className="desktop-only">
                  <SkeletonTable rows={5} />
                </div>
              </>
            ) : error ? null : (
              <UserTable users={users} subscriptions={subscriptions} servers={servers} onRefresh={fetchData} />
            )}
          </>
        )}

        {activeTab === 'servers' && currentUser?.role === 'admin' && (
          <ServerManagement />
        )}

        {activeTab === 'resellers' && currentUser?.role === 'admin' && (
          <ResellersManagement />
        )}

        {activeTab === 'auto' && currentUser?.role === 'admin' && !error && (
          <AutoDisable onRefresh={fetchData} />
        )}
      </div>
    </div>
  );
}

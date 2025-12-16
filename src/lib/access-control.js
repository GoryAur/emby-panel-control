import { headers } from 'next/headers';
import { getAllSubscriptions } from './subscriptions';
import { verifySessionToken } from './auth';

/**
 * Obtiene el usuario actual desde los headers de la petición
 * (el middleware pasa el token en x-auth-token)
 */
export async function getCurrentUser() {
  const headersList = await headers();
  const token = headersList.get('x-auth-token');

  if (!token) {
    return null;
  }

  // Verificar y decodificar el token
  const user = verifySessionToken(token);

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    role: user.role || 'admin',
    name: user.name,
    username: user.username,
  };
}

/**
 * Verifica si el usuario actual es admin
 */
export async function isAdmin() {
  const user = await getCurrentUser();
  return user?.role === 'admin';
}

/**
 * Verifica si el usuario actual es reseller
 */
export async function isReseller() {
  const user = await getCurrentUser();
  return user?.role === 'reseller';
}

/**
 * Filtra usuarios de Emby según el rol del usuario actual
 * - Admin: ve todos los usuarios
 * - Reseller: solo ve usuarios que él creó
 */
export async function filterUsersByRole(embyUsers) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return [];
  }

  // Admin puede ver todos los usuarios
  if (currentUser.role === 'admin') {
    return embyUsers;
  }

  // Reseller solo ve usuarios que él creó
  if (currentUser.role === 'reseller') {
    const subscriptions = getAllSubscriptions();

    return embyUsers.filter(user => {
      const subKey = `${user.serverId}__${user.Id}`;
      const subscription = subscriptions[subKey];

      // Mostrar solo usuarios creados por este reseller
      return subscription?.createdBy === currentUser.id;
    });
  }

  return [];
}

/**
 * Verifica si el usuario actual puede gestionar un usuario de Emby específico
 * - Admin: puede gestionar cualquier usuario
 * - Reseller: solo puede gestionar usuarios que él creó
 */
export async function canManageUser(userId, serverId) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return false;
  }

  // Admin puede gestionar cualquier usuario
  if (currentUser.role === 'admin') {
    return true;
  }

  // Reseller solo puede gestionar usuarios que él creó
  if (currentUser.role === 'reseller') {
    const subscriptions = getAllSubscriptions();
    const subKey = `${serverId}__${userId}`;
    const subscription = subscriptions[subKey];

    return subscription?.createdBy === currentUser.id;
  }

  return false;
}

/**
 * Obtiene el nombre del creador de un usuario de Emby
 */
export function getCreatorName(userId, serverId, panelUsers) {
  const subscriptions = getAllSubscriptions();
  const subKey = `${serverId}__${userId}`;
  const subscription = subscriptions[subKey];

  if (!subscription?.createdBy) {
    return null;
  }

  const creator = panelUsers.find(u => u.id === subscription.createdBy);
  return creator?.name || 'Desconocido';
}

import { NextResponse } from 'next/server';
import { getAllUsersFromMultipleServers, getActiveSessionsFromMultipleServers, getDaysInactive } from '@/lib/emby';
import { getEnabledServers } from '@/lib/servers';
import { filterUsersByRole } from '@/lib/access-control';

export async function GET() {
  try {
    const servers = getEnabledServers();

    if (servers.length === 0) {
      return NextResponse.json(
        { error: 'No hay servidores configurados' },
        { status: 400 }
      );
    }

    const allUsers = await getAllUsersFromMultipleServers(servers);
    const sessions = await getActiveSessionsFromMultipleServers(servers);

    // Filtrar usuarios administradores de Emby (no se muestran en el panel)
    const nonAdminUsers = allUsers.filter(user => !user.Policy?.IsAdministrator);

    // Filtrar usuarios según el rol del usuario actual (admin ve todos, reseller solo los suyos)
    const users = await filterUsersByRole(nonAdminUsers);

    // Enriquecer información de usuarios con sesiones activas
    const enrichedUsers = users.map(user => {
      // Las sesiones deben coincidir por UserId Y serverId
      const userSessions = sessions.filter(
        s => s.UserId === user.Id && s.serverId === user.serverId
      );
      const isOnline = userSessions.length > 0;
      const daysInactive = getDaysInactive(user.LastActivityDate);

      return {
        id: user.Id,
        name: user.Name,
        serverId: user.serverId,
        serverName: user.serverName,
        lastActivityDate: user.LastActivityDate,
        lastLoginDate: user.LastLoginDate,
        isDisabled: user.Policy?.IsDisabled || false,
        isAdministrator: user.Policy?.IsAdministrator || false,
        isOnline,
        activeSessions: userSessions.map(s => ({
          id: s.Id,
          deviceName: s.DeviceName,
          client: s.Client,
          applicationVersion: s.ApplicationVersion,
          serverId: s.serverId,
        })),
        daysInactive,
      };
    });

    return NextResponse.json(enrichedUsers);
  } catch (error) {
    console.error('Error en /api/emby/users:', error);
    return NextResponse.json(
      { error: 'Error al obtener usuarios de Emby' },
      { status: 500 }
    );
  }
}

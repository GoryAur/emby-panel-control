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

      // Filtrar sesiones realmente activas (con actividad reciente o reproduciendo)
      const now = new Date();
      const activeSessions = userSessions.filter(session => {
        // Si está reproduciendo contenido, está definitivamente activo
        if (session.NowPlayingItem) {
          return true;
        }

        // Si tiene LastActivityDate, verificar si fue en los últimos 5 minutos
        if (session.LastActivityDate) {
          const lastActivity = new Date(session.LastActivityDate);
          const minutesSinceActivity = (now - lastActivity) / 1000 / 60;
          return minutesSinceActivity < 5; // Activo en los últimos 5 minutos
        }

        // Si no tiene LastActivityDate pero SupportsRemoteControl=true, considerarlo potencialmente activo
        // Esto puede incluir apps abiertas pero en idle
        return session.SupportsRemoteControl === true;
      });

      const isOnline = activeSessions.length > 0;
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
        activeSessions: activeSessions.map(s => ({
          id: s.Id,
          deviceName: s.DeviceName,
          client: s.Client,
          applicationVersion: s.ApplicationVersion,
          serverId: s.serverId,
          nowPlaying: s.NowPlayingItem ? {
            name: s.NowPlayingItem.Name,
            type: s.NowPlayingItem.Type,
          } : null,
          lastActivity: s.LastActivityDate,
        })),
        daysInactive,
        hasEmbyConnect: !!(user.ConnectUserId || user.ConnectUserName),
        embyConnectEmail: user.ConnectUserName || null,
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

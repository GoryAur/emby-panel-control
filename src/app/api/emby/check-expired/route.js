import { NextResponse } from 'next/server';
import { getAllUsersFromMultipleServers, disableUser } from '@/lib/emby';
import { getExpiredSubscriptions } from '@/lib/subscriptions';
import { getEnabledServers, getServerById } from '@/lib/servers';

export async function POST(request) {
  try {
    const { dryRun = false } = await request.json();

    const servers = getEnabledServers();
    if (servers.length === 0) {
      return NextResponse.json(
        { error: 'No hay servidores configurados' },
        { status: 400 }
      );
    }

    const users = await getAllUsersFromMultipleServers(servers);
    const expiredSubs = getExpiredSubscriptions();
    const usersToDisable = [];

    for (const expiredSub of expiredSubs) {
      // Buscar usuario por ID y serverId
      const user = users.find(
        u => u.Id === expiredSub.userId && u.serverId === expiredSub.serverId
      );

      if (!user) continue;

      // No deshabilitar administradores
      if (user.Policy?.IsAdministrator) {
        continue;
      }

      // Saltar usuarios ya deshabilitados
      if (user.Policy?.IsDisabled) {
        continue;
      }

      usersToDisable.push({
        id: user.Id,
        name: user.Name,
        serverId: user.serverId,
        serverName: user.serverName,
        expirationDate: expiredSub.expirationDate,
        daysExpired: expiredSub.daysExpired,
      });

      // Si no es dry run, deshabilitar usuario
      if (!dryRun) {
        const server = getServerById(user.serverId);
        if (server) {
          await disableUser(user.Id, server);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: dryRun
        ? `${usersToDisable.length} usuarios serían deshabilitados`
        : `${usersToDisable.length} usuarios deshabilitados`,
      users: usersToDisable,
      dryRun,
    });
  } catch (error) {
    console.error('Error en /api/emby/check-expired:', error);
    return NextResponse.json(
      { error: 'Error al procesar verificación de vencimientos' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { getAllUsers, disableUser, getDaysInactive } from '@/lib/emby';

export async function POST(request) {
  try {
    const { inactiveDays = 30, dryRun = false } = await request.json();

    const users = await getAllUsers();
    const usersToDisable = [];

    for (const user of users) {
      // No deshabilitar administradores
      if (user.Policy?.IsAdministrator) {
        continue;
      }

      // Saltar usuarios ya deshabilitados
      if (user.Policy?.IsDisabled) {
        continue;
      }

      const daysInactive = getDaysInactive(user.LastActivityDate);

      if (daysInactive !== null && daysInactive >= inactiveDays) {
        usersToDisable.push({
          id: user.Id,
          name: user.Name,
          daysInactive,
          lastActivityDate: user.LastActivityDate,
        });

        // Si no es dry run, deshabilitar usuario
        if (!dryRun) {
          await disableUser(user.Id);
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
    console.error('Error en /api/emby/auto-disable:', error);
    return NextResponse.json(
      { error: 'Error al procesar deshabilitación automática' },
      { status: 500 }
    );
  }
}

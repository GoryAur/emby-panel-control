import { NextResponse } from 'next/server';
import { getAllUsers, disableUser } from '@/lib/emby';
import { getExpiredSubscriptions } from '@/lib/subscriptions';

export async function GET(request) {
  try {
    // Verificar token de seguridad opcional
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const users = await getAllUsers();
    const expiredSubs = getExpiredSubscriptions();
    const usersDisabled = [];
    const errors = [];

    for (const expiredSub of expiredSubs) {
      const user = users.find(u => u.Id === expiredSub.userId);

      if (!user) {
        errors.push({
          userId: expiredSub.userId,
          error: 'Usuario no encontrado',
        });
        continue;
      }

      // No deshabilitar administradores
      if (user.Policy?.IsAdministrator) {
        continue;
      }

      // Saltar usuarios ya deshabilitados
      if (user.Policy?.IsDisabled) {
        continue;
      }

      try {
        await disableUser(user.Id);
        usersDisabled.push({
          id: user.Id,
          name: user.Name,
          expirationDate: expiredSub.expirationDate,
          daysExpired: expiredSub.daysExpired,
        });
      } catch (error) {
        errors.push({
          userId: user.Id,
          userName: user.Name,
          error: error.message,
        });
      }
    }

    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      usersDisabled: usersDisabled.length,
      users: usersDisabled,
      errors: errors.length > 0 ? errors : undefined,
    };

    console.log('[CRON] Disable expired users:', response);

    return NextResponse.json(response);
  } catch (error) {
    console.error('[CRON] Error en disable-expired:', error);
    return NextResponse.json(
      {
        error: 'Error al procesar deshabilitación automática',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  return GET(request);
}

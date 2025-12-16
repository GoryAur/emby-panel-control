import { NextResponse } from 'next/server';
import { extendSubscription } from '@/lib/subscriptions';
import { canManageUser } from '@/lib/access-control';

export async function POST(request) {
  try {
    const { userId, serverId, months = 1 } = await request.json();

    if (!userId || !serverId) {
      return NextResponse.json(
        { error: 'userId y serverId son requeridos' },
        { status: 400 }
      );
    }

    // Verificar permisos
    if (!(await canManageUser(userId, serverId))) {
      return NextResponse.json(
        { error: 'No tienes permisos para modificar este usuario' },
        { status: 403 }
      );
    }

    const subscription = extendSubscription(userId, serverId, months);

    return NextResponse.json({
      success: true,
      subscription,
      message: `Suscripción extendida ${months} mes(es)`,
    });
  } catch (error) {
    console.error('Error en /api/emby/extend-subscription:', error);
    return NextResponse.json(
      { error: 'Error al extender suscripción' },
      { status: 500 }
    );
  }
}

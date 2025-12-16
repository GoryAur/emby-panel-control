import { NextResponse } from 'next/server';
import { setExpiration } from '@/lib/subscriptions';
import { canManageUser, getCurrentUser } from '@/lib/access-control';

export async function POST(request) {
  try {
    const { userId, serverId, expirationDate } = await request.json();

    if (!userId || !serverId || !expirationDate) {
      return NextResponse.json(
        { error: 'userId, serverId y expirationDate son requeridos' },
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

    const currentUser = await getCurrentUser();
    const subscription = setExpiration(userId, serverId, expirationDate, currentUser?.id);

    return NextResponse.json({
      success: true,
      subscription,
      message: 'Fecha de vencimiento actualizada',
    });
  } catch (error) {
    console.error('Error en /api/emby/set-expiration:', error);
    return NextResponse.json(
      { error: 'Error al establecer fecha de vencimiento' },
      { status: 500 }
    );
  }
}

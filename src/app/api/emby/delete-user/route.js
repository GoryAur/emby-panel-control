import { NextResponse } from 'next/server';
import { deleteUser } from '@/lib/emby';
import { getServerById } from '@/lib/servers';
import { deleteSubscription } from '@/lib/subscriptions';
import { canManageUser } from '@/lib/access-control';

export async function POST(request) {
  try {
    const { userId, serverId } = await request.json();

    // Validaciones
    if (!userId || !serverId) {
      return NextResponse.json(
        { error: 'userId y serverId son requeridos' },
        { status: 400 }
      );
    }

    // Verificar permisos: el usuario puede gestionar este usuario de Emby?
    if (!(await canManageUser(userId, serverId))) {
      return NextResponse.json(
        { error: 'No tienes permisos para eliminar este usuario' },
        { status: 403 }
      );
    }

    // Obtener servidor
    const server = getServerById(serverId);
    if (!server) {
      return NextResponse.json(
        { error: 'Servidor no encontrado' },
        { status: 404 }
      );
    }

    // Eliminar usuario de Emby
    await deleteUser(userId, server);

    // Eliminar suscripción asociada (si existe)
    try {
      await deleteSubscription(userId, serverId);
    } catch (err) {
      console.error('Error al eliminar suscripción:', err);
      // No fallar la eliminación del usuario si falla la suscripción
    }

    return NextResponse.json({
      success: true,
      message: 'Usuario eliminado exitosamente',
    });
  } catch (error) {
    console.error('Error en /api/emby/delete-user:', error);

    // Si el error viene de Emby con un mensaje específico
    if (error.message && error.message !== 'Request failed with status code 500') {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error al eliminar usuario' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { enableUser, disableUser } from '@/lib/emby';
import { getServerById } from '@/lib/servers';
import { canManageUser } from '@/lib/access-control';

export async function POST(request) {
  try {
    const { userId, serverId, enable } = await request.json();

    if (!userId || !serverId) {
      return NextResponse.json(
        { error: 'userId y serverId son requeridos' },
        { status: 400 }
      );
    }

    // Verificar permisos: el usuario puede gestionar este usuario de Emby?
    if (!(await canManageUser(userId, serverId))) {
      return NextResponse.json(
        { error: 'No tienes permisos para cambiar el estado de este usuario' },
        { status: 403 }
      );
    }

    const server = getServerById(serverId);
    if (!server) {
      return NextResponse.json(
        { error: 'Servidor no encontrado' },
        { status: 404 }
      );
    }

    if (enable) {
      await enableUser(userId, server);
    } else {
      await disableUser(userId, server);
    }

    return NextResponse.json({
      success: true,
      message: enable ? 'Usuario habilitado exitosamente' : 'Usuario deshabilitado exitosamente',
    });
  } catch (error) {
    console.error('Error en /api/emby/toggle-user:', error);
    return NextResponse.json(
      { error: 'Error al cambiar estado del usuario' },
      { status: 500 }
    );
  }
}

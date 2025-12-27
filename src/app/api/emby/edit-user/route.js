import { NextResponse } from 'next/server';
import { updateUser, linkEmbyConnect, unlinkEmbyConnect } from '@/lib/emby';
import { getServerById } from '@/lib/servers';
import { canManageUser } from '@/lib/access-control';

export async function POST(request) {
  try {
    const { userId, serverId, name, password, embyConnectEmail } = await request.json();

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
        { error: 'No tienes permisos para editar este usuario' },
        { status: 403 }
      );
    }

    // Al menos uno de los campos debe estar presente para actualizar
    // embyConnectEmail puede ser string vacío para desvincular, así que solo verificamos si es undefined
    const hasFieldToUpdate = name || password || (embyConnectEmail !== undefined);

    if (!hasFieldToUpdate) {
      return NextResponse.json(
        { error: 'Debe proporcionar al menos un campo para actualizar' },
        { status: 400 }
      );
    }

    // Validar contraseña si se proporciona
    if (password && password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
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

    // Actualizar usuario en Emby
    const userData = {};
    if (name) userData.name = name.trim();
    if (password) userData.password = password;

    const updatedUser = await updateUser(userId, userData, server);

    // Manejar vinculación/desvinculación de Emby Connect
    if (embyConnectEmail !== undefined) {
      try {
        if (embyConnectEmail && embyConnectEmail.trim().length > 0) {
          // Vincular con Emby Connect
          await linkEmbyConnect(userId, embyConnectEmail.trim(), server);
          console.log(`Usuario ${userId} vinculado con Emby Connect: ${embyConnectEmail}`);
        } else {
          // Desvincular de Emby Connect (email vacío)
          await unlinkEmbyConnect(userId, server);
          console.log(`Usuario ${userId} desvinculado de Emby Connect`);
        }
      } catch (err) {
        console.error('Error al gestionar Emby Connect:', err);
        // No fallar la actualización si falla la vinculación
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Usuario actualizado exitosamente',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error en /api/emby/edit-user:', error);

    // Si el error viene de Emby con un mensaje específico
    if (error.message && error.message !== 'Request failed with status code 500') {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error al actualizar usuario' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { updateUser } from '@/lib/emby';
import { getServerById } from '@/lib/servers';
import { canManageUser } from '@/lib/access-control';

export async function POST(request) {
  try {
    const { userId, serverId, name, password } = await request.json();

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

    // Al menos uno de los campos debe estar presente
    if (!name && !password) {
      return NextResponse.json(
        { error: 'Debe proporcionar al menos el nombre o la contraseña' },
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

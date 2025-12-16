import { NextResponse } from 'next/server';
import { deleteUser, getUserById } from '@/lib/auth';
import { isAdmin } from '@/lib/access-control';

export async function POST(request) {
  try {
    // Solo los administradores pueden eliminar resellers
    if (!(await isAdmin())) {
      return NextResponse.json(
        { error: 'No tienes permisos para eliminar resellers' },
        { status: 403 }
      );
    }

    const { userId } = await request.json();

    // Validaciones
    if (!userId) {
      return NextResponse.json(
        { error: 'userId es requerido' },
        { status: 400 }
      );
    }

    const user = getUserById(userId);

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Verificar que es un reseller (no permitir eliminar admins por seguridad)
    if (user.role !== 'reseller') {
      return NextResponse.json(
        { error: 'Solo se pueden eliminar resellers' },
        { status: 400 }
      );
    }

    // Eliminar reseller
    deleteUser(userId);

    return NextResponse.json({
      success: true,
      message: 'Reseller eliminado exitosamente',
    });
  } catch (error) {
    console.error('Error en /api/panel/delete-reseller:', error);
    return NextResponse.json(
      { error: 'Error al eliminar reseller' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { getAllUsers } from '@/lib/auth';
import { isAdmin } from '@/lib/access-control';

export async function GET() {
  try {
    // Solo los administradores pueden ver la lista de usuarios del panel
    if (!(await isAdmin())) {
      return NextResponse.json(
        { error: 'No tienes permisos para ver los usuarios del panel' },
        { status: 403 }
      );
    }

    const users = getAllUsers();

    return NextResponse.json({
      success: true,
      users,
    });
  } catch (error) {
    console.error('Error en /api/panel/users:', error);
    return NextResponse.json(
      { error: 'Error al obtener usuarios del panel' },
      { status: 500 }
    );
  }
}

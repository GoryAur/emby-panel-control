import { NextResponse } from 'next/server';
import { createUser } from '@/lib/auth';
import { isAdmin } from '@/lib/access-control';

export async function POST(request) {
  try {
    // Solo los administradores pueden crear resellers
    if (!(await isAdmin())) {
      return NextResponse.json(
        { error: 'No tienes permisos para crear resellers' },
        { status: 403 }
      );
    }

    const { username, password, name } = await request.json();

    // Validaciones
    if (!username || !password || !name) {
      return NextResponse.json(
        { error: 'El nombre de usuario, contraseña y nombre completo son requeridos' },
        { status: 400 }
      );
    }

    if (username.trim().length === 0 || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Los campos no pueden estar vacíos' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      );
    }

    // Crear reseller (role='reseller' por defecto)
    const newReseller = createUser(username.trim(), password, name.trim(), 'reseller');

    return NextResponse.json({
      success: true,
      message: 'Reseller creado exitosamente',
      user: newReseller,
    });
  } catch (error) {
    console.error('Error en /api/panel/create-reseller:', error);

    // Manejar error de usuario duplicado
    if (error.message.includes('ya existe')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error al crear reseller' },
      { status: 500 }
    );
  }
}

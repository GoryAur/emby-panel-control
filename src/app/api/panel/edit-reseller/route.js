import { NextResponse } from 'next/server';
import { getUserById, changePassword } from '@/lib/auth';
import { isAdmin } from '@/lib/access-control';
import fs from 'fs';
import path from 'path';

const USERS_FILE = path.join(process.cwd(), 'data', 'users.json');

export async function POST(request) {
  try {
    // Solo los administradores pueden editar resellers
    if (!(await isAdmin())) {
      return NextResponse.json(
        { error: 'No tienes permisos para editar resellers' },
        { status: 403 }
      );
    }

    const { userId, name, password } = await request.json();

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

    // Verificar que es un reseller
    if (user.role !== 'reseller') {
      return NextResponse.json(
        { error: 'Solo se pueden editar resellers' },
        { status: 400 }
      );
    }

    // Actualizar nombre si se proporciona
    if (name && name.trim()) {
      const data = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
      const userIndex = data.users.findIndex(u => u.id === userId);

      if (userIndex !== -1) {
        data.users[userIndex].name = name.trim();
        fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2));
      }
    }

    // Actualizar contraseña si se proporciona
    if (password && password.length >= 6) {
      // Para cambiar la contraseña necesitamos la actual, pero como admin podemos forzar el cambio
      // Modificamos directamente el archivo
      const data = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
      const userIndex = data.users.findIndex(u => u.id === userId);

      if (userIndex !== -1) {
        const crypto = require('crypto');
        const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
        data.users[userIndex].passwordHash = passwordHash;
        fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2));
      }
    } else if (password && password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Reseller actualizado exitosamente',
    });
  } catch (error) {
    console.error('Error en /api/panel/edit-reseller:', error);
    return NextResponse.json(
      { error: 'Error al actualizar reseller' },
      { status: 500 }
    );
  }
}

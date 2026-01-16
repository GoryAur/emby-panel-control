import { NextResponse } from 'next/server';
import { createUser, linkEmbyConnect } from '@/lib/emby';
import { getServerById } from '@/lib/servers';
import { setExpiration, setUserCreator } from '@/lib/subscriptions';
import { getCurrentUser } from '@/lib/access-control';

export async function POST(request) {
  try {
    const { name, password, embyConnectEmail, serverId, expirationDate, isAdmin, enabledLibraries, userType } = await request.json();

    // Validaciones
    if (!name || !serverId) {
      return NextResponse.json(
        { error: 'El nombre de usuario y el servidor son requeridos' },
        { status: 400 }
      );
    }

    // Validar que el nombre no este vacio
    if (name.trim().length === 0) {
      return NextResponse.json(
        { error: 'El nombre de usuario no puede estar vacio' },
        { status: 400 }
      );
    }

    // Validar nombre minimo 3 caracteres
    if (name.trim().length < 3) {
      return NextResponse.json(
        { error: 'El nombre de usuario debe tener al menos 3 caracteres' },
        { status: 400 }
      );
    }

    // Validar contrasena si se proporciona
    if (password && password.length < 6) {
      return NextResponse.json(
        { error: 'La contrasena debe tener al menos 6 caracteres' },
        { status: 400 }
      );
    }

    // Validar fecha de vencimiento obligatoria
    if (!expirationDate) {
      return NextResponse.json(
        { error: 'La fecha de vencimiento es obligatoria' },
        { status: 400 }
      );
    }

    // Validar que la fecha sea futura
    const expDate = new Date(expirationDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (expDate < today) {
      return NextResponse.json(
        { error: 'La fecha de vencimiento debe ser futura' },
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

    // Crear usuario en Emby
    const userData = {
      name: name.trim(),
      password: password || '', // Password vacía si no se proporciona
      copyFromTemplate: userType || '1 Pantalla', // Copiar configuración del tipo de usuario seleccionado
      isAdmin: isAdmin || false,
      enabledLibraries: enabledLibraries || 'all', // Por defecto todas las bibliotecas
    };

    const newUser = await createUser(userData, server);

    // Vincular con Emby Connect si se proporcionó email
    if (embyConnectEmail && embyConnectEmail.trim().length > 0 && newUser.Id) {
      try {
        await linkEmbyConnect(newUser.Id, embyConnectEmail.trim(), server);
        console.log(`Usuario ${newUser.Id} vinculado con Emby Connect: ${embyConnectEmail}`);
      } catch (err) {
        console.error('Error al vincular Emby Connect:', err);
        // No fallar la creación si falla la vinculación
        // El usuario puede vincularse manualmente después
      }
    }

    // Obtener usuario actual (quien está creando el usuario)
    const currentUser = await getCurrentUser();

    // Registrar quién creó este usuario de Emby
    if (newUser.Id && currentUser) {
      try {
        setUserCreator(newUser.Id, serverId, currentUser.id);
      } catch (err) {
        console.error('Error al registrar creador:', err);
        // No fallar la creación si esto falla
      }
    }

    // Establecer fecha de vencimiento (obligatoria)
    if (newUser.Id) {
      try {
        await setExpiration(newUser.Id, serverId, expirationDate, currentUser?.id);
      } catch (err) {
        console.error('Error al establecer fecha de vencimiento:', err);
        // No fallar la creacion del usuario si falla la suscripcion
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Usuario creado exitosamente',
      user: newUser,
    });
  } catch (error) {
    console.error('Error en /api/emby/create-user:', error);

    // Si el error viene de Emby con un mensaje específico
    if (error.message && error.message !== 'Request failed with status code 500') {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error al crear usuario. Verifica que el nombre no exista ya.' },
      { status: 500 }
    );
  }
}

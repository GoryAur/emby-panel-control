import { NextResponse } from 'next/server';
import { getAllServers, addServer, updateServer, deleteServer, testServerConnection } from '@/lib/servers';

// GET - Obtener todos los servidores
export async function GET() {
  try {
    const servers = getAllServers();

    // No enviar las API keys al cliente (por seguridad)
    const sanitizedServers = servers.map(server => ({
      ...server,
      apiKey: server.apiKey ? '***HIDDEN***' : '',
    }));

    return NextResponse.json({ servers: sanitizedServers });
  } catch (error) {
    console.error('Error en GET /api/servers:', error);
    return NextResponse.json(
      { error: 'Error al obtener servidores' },
      { status: 500 }
    );
  }
}

// POST - Agregar nuevo servidor
export async function POST(request) {
  try {
    const body = await request.json();
    const { name, url, apiKey, enabled } = body;

    if (!name || !url || !apiKey) {
      return NextResponse.json(
        { error: 'Nombre, URL y API Key son requeridos' },
        { status: 400 }
      );
    }

    // Probar conexión antes de agregar
    const connectionTest = await testServerConnection(url, apiKey);

    if (!connectionTest.success) {
      return NextResponse.json(
        { error: `No se pudo conectar al servidor: ${connectionTest.error}` },
        { status: 400 }
      );
    }

    const newServer = addServer({ name, url, apiKey, enabled });

    return NextResponse.json({
      success: true,
      server: {
        ...newServer,
        apiKey: '***HIDDEN***',
      },
      connectionTest,
    });
  } catch (error) {
    console.error('Error en POST /api/servers:', error);
    return NextResponse.json(
      { error: error.message || 'Error al agregar servidor' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar servidor
export async function PUT(request) {
  try {
    const body = await request.json();
    const { serverId, ...updates } = body;

    if (!serverId) {
      return NextResponse.json(
        { error: 'ID de servidor requerido' },
        { status: 400 }
      );
    }

    // Si se actualizan URL o API Key, probar conexión
    if (updates.url || updates.apiKey) {
      const servers = getAllServers();
      const existingServer = servers.find(s => s.id === serverId);

      if (!existingServer) {
        return NextResponse.json(
          { error: 'Servidor no encontrado' },
          { status: 404 }
        );
      }

      const testUrl = updates.url || existingServer.url;
      const testApiKey = updates.apiKey || existingServer.apiKey;

      const connectionTest = await testServerConnection(testUrl, testApiKey);

      if (!connectionTest.success) {
        return NextResponse.json(
          { error: `No se pudo conectar al servidor: ${connectionTest.error}` },
          { status: 400 }
        );
      }
    }

    const updatedServer = updateServer(serverId, updates);

    return NextResponse.json({
      success: true,
      server: {
        ...updatedServer,
        apiKey: '***HIDDEN***',
      },
    });
  } catch (error) {
    console.error('Error en PUT /api/servers:', error);
    return NextResponse.json(
      { error: error.message || 'Error al actualizar servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar servidor
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const serverId = searchParams.get('serverId');

    if (!serverId) {
      return NextResponse.json(
        { error: 'ID de servidor requerido' },
        { status: 400 }
      );
    }

    deleteServer(serverId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error en DELETE /api/servers:', error);
    return NextResponse.json(
      { error: error.message || 'Error al eliminar servidor' },
      { status: 500 }
    );
  }
}

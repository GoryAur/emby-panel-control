import { NextResponse } from 'next/server';
import { getLibraries } from '@/lib/emby';
import { getServerById } from '@/lib/servers';

export async function POST(request) {
  try {
    const { serverId } = await request.json();

    if (!serverId) {
      return NextResponse.json(
        { error: 'serverId es requerido' },
        { status: 400 }
      );
    }

    const server = getServerById(serverId);
    if (!server) {
      return NextResponse.json(
        { error: 'Servidor no encontrado' },
        { status: 404 }
      );
    }

    const libraries = await getLibraries(server);

    return NextResponse.json({
      success: true,
      libraries: libraries.map(lib => ({
        id: lib.ItemId,
        name: lib.Name,
        type: lib.CollectionType,
      })),
    });
  } catch (error) {
    console.error('Error en /api/emby/libraries:', error);
    return NextResponse.json(
      { error: 'Error al obtener bibliotecas' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { stopPlayback } from '@/lib/emby';
import { getServerById } from '@/lib/servers';

export async function POST(request) {
  try {
    const { sessionId, serverId } = await request.json();

    if (!sessionId || !serverId) {
      return NextResponse.json(
        { error: 'sessionId y serverId son requeridos' },
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

    await stopPlayback(sessionId, server);

    return NextResponse.json({
      success: true,
      message: 'Reproducción detenida exitosamente',
    });
  } catch (error) {
    console.error('Error en /api/emby/stop-playback:', error);
    return NextResponse.json(
      { error: 'Error al detener reproducción' },
      { status: 500 }
    );
  }
}

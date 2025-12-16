import { NextResponse } from 'next/server';
import { getAllSubscriptions } from '@/lib/subscriptions';

export async function GET() {
  try {
    const subscriptions = getAllSubscriptions();
    return NextResponse.json(subscriptions);
  } catch (error) {
    console.error('Error en /api/emby/subscriptions:', error);
    return NextResponse.json(
      { error: 'Error al obtener suscripciones' },
      { status: 500 }
    );
  }
}

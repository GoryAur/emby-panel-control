#!/usr/bin/env node

/**
 * Script de automatización para deshabilitar usuarios con suscripciones vencidas
 *
 * Uso:
 *   node scripts/auto-disable.js
 *
 * Este script puede ser ejecutado por cron o un planificador de tareas
 */

// Cargar variables de entorno desde .env.local
const { config } = require('dotenv');
const path = require('path');

config({ path: path.join(__dirname, '..', '.env.local') });

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const CRON_SECRET = process.env.CRON_SECRET || '';

async function disableExpiredUsers() {
  try {
    console.log(`[${new Date().toISOString()}] Iniciando verificación de suscripciones vencidas...`);

    const headers = {
      'Content-Type': 'application/json',
    };

    if (CRON_SECRET) {
      headers['Authorization'] = `Bearer ${CRON_SECRET}`;
    }

    const response = await fetch(`${BASE_URL}/api/cron/disable-expired`, {
      method: 'POST',
      headers,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Error HTTP ${response.status}: ${error}`);
    }

    const data = await response.json();

    console.log(`✓ Verificación completada`);
    console.log(`  - Usuarios deshabilitados: ${data.usersDisabled}`);

    if (data.users && data.users.length > 0) {
      console.log(`  - Usuarios afectados:`);
      data.users.forEach(user => {
        console.log(`    • ${user.name} (vencida hace ${user.daysExpired} días)`);
      });
    }

    if (data.errors && data.errors.length > 0) {
      console.log(`  - Errores:`);
      data.errors.forEach(error => {
        console.log(`    • ${error.userName || error.userId}: ${error.error}`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error(`✗ Error al ejecutar auto-disable:`, error.message);
    process.exit(1);
  }
}

disableExpiredUsers();

import getDatabase from './db.js';

/**
 * Inicializa el servidor por defecto desde .env.local si no existe
 */
function ensureDefaultServer() {
  const db = getDatabase();
  const servers = db.prepare('SELECT id FROM servers').all();

  if (servers.length === 0 && process.env.EMBY_SERVER_URL) {
    const stmt = db.prepare(`
      INSERT INTO servers (id, name, url, api_key, enabled)
      VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run(
      'server-1',
      'Emby Principal',
      process.env.EMBY_SERVER_URL,
      process.env.EMBY_API_KEY || '',
      1
    );
  }
}

// Asegurar que existe el servidor por defecto
ensureDefaultServer();

/**
 * Obtiene todos los servidores
 */
export function getAllServers() {
  try {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT id, name, url, api_key, enabled, created_at, updated_at
      FROM servers
      ORDER BY created_at ASC
    `);

    const servers = stmt.all();

    return servers.map(server => ({
      id: server.id,
      name: server.name,
      url: server.url,
      apiKey: server.api_key,
      enabled: server.enabled === 1,
      createdAt: server.created_at,
      updatedAt: server.updated_at,
    }));
  } catch (error) {
    console.error('Error al leer servidores:', error);
    return [];
  }
}

/**
 * Obtiene servidores habilitados
 */
export function getEnabledServers() {
  try {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT id, name, url, api_key, enabled, created_at, updated_at
      FROM servers
      WHERE enabled = 1
      ORDER BY created_at ASC
    `);

    const servers = stmt.all();

    return servers.map(server => ({
      id: server.id,
      name: server.name,
      url: server.url,
      apiKey: server.api_key,
      enabled: true,
      createdAt: server.created_at,
      updatedAt: server.updated_at,
    }));
  } catch (error) {
    console.error('Error al obtener servidores habilitados:', error);
    return [];
  }
}

/**
 * Obtiene servidor por ID
 */
export function getServerById(serverId) {
  try {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT id, name, url, api_key, enabled, created_at, updated_at
      FROM servers
      WHERE id = ?
    `);

    const server = stmt.get(serverId);

    if (!server) {
      return null;
    }

    return {
      id: server.id,
      name: server.name,
      url: server.url,
      apiKey: server.api_key,
      enabled: server.enabled === 1,
      createdAt: server.created_at,
      updatedAt: server.updated_at,
    };
  } catch (error) {
    console.error('Error al obtener servidor:', error);
    return null;
  }
}

/**
 * Agrega un servidor
 */
export function addServer(serverData) {
  try {
    const db = getDatabase();
    const id = `server-${Date.now()}`;

    const stmt = db.prepare(`
      INSERT INTO servers (id, name, url, api_key, enabled)
      VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      serverData.name,
      serverData.url,
      serverData.apiKey,
      serverData.enabled !== false ? 1 : 0
    );

    return getServerById(id);
  } catch (error) {
    console.error('Error al agregar servidor:', error);
    throw error;
  }
}

/**
 * Actualiza un servidor
 */
export function updateServer(serverId, updates) {
  try {
    const db = getDatabase();

    // Verificar que el servidor existe
    const server = getServerById(serverId);
    if (!server) {
      throw new Error('Servidor no encontrado');
    }

    // Construir query dinámicamente según los campos que se actualicen
    const fields = [];
    const values = [];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.url !== undefined) {
      fields.push('url = ?');
      values.push(updates.url);
    }
    if (updates.apiKey !== undefined) {
      fields.push('api_key = ?');
      values.push(updates.apiKey);
    }
    if (updates.enabled !== undefined) {
      fields.push('enabled = ?');
      values.push(updates.enabled ? 1 : 0);
    }

    if (fields.length === 0) {
      return server;
    }

    fields.push("updated_at = datetime('now')");
    values.push(serverId);

    const query = `UPDATE servers SET ${fields.join(', ')} WHERE id = ?`;
    const stmt = db.prepare(query);
    stmt.run(...values);

    return getServerById(serverId);
  } catch (error) {
    console.error('Error al actualizar servidor:', error);
    throw error;
  }
}

/**
 * Elimina un servidor
 */
export function deleteServer(serverId) {
  try {
    const db = getDatabase();

    const stmt = db.prepare('DELETE FROM servers WHERE id = ?');
    const result = stmt.run(serverId);

    if (result.changes === 0) {
      throw new Error('Servidor no encontrado');
    }

    return true;
  } catch (error) {
    console.error('Error al eliminar servidor:', error);
    throw error;
  }
}

/**
 * Prueba conexión con servidor
 */
export async function testServerConnection(url, apiKey) {
  try {
    const axios = require('axios');
    const response = await axios.get(`${url}/System/Info`, {
      headers: {
        'X-Emby-Token': apiKey,
      },
      timeout: 10000,
    });

    return {
      success: true,
      serverName: response.data.ServerName,
      version: response.data.Version,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

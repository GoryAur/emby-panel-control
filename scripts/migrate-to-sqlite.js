import fs from 'fs';
import path from 'path';
import getDatabase from '../src/lib/db.js';

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SERVERS_FILE = path.join(DATA_DIR, 'servers.json');
const SUBSCRIPTIONS_FILE = path.join(DATA_DIR, 'subscriptions.json');

console.log('🔄 Iniciando migración de JSON a SQLite...\n');

const db = getDatabase();

// Migrar usuarios del panel
function migrateUsers() {
  if (!fs.existsSync(USERS_FILE)) {
    console.log('⚠️  No se encontró archivo de usuarios (users.json)');
    return 0;
  }

  const data = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
  const users = data.users || [];

  if (users.length === 0) {
    console.log('⚠️  No hay usuarios para migrar');
    return 0;
  }

  const stmt = db.prepare(`
    INSERT OR REPLACE INTO panel_users (id, username, password_hash, name, role, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  let count = 0;
  for (const user of users) {
    try {
      stmt.run(
        user.id,
        user.username,
        user.passwordHash,
        user.name,
        user.role,
        user.createdAt
      );
      count++;
      console.log(`✅ Usuario migrado: ${user.username} (${user.role})`);
    } catch (error) {
      console.error(`❌ Error migrando usuario ${user.username}:`, error.message);
    }
  }

  return count;
}

// Migrar servidores
function migrateServers() {
  if (!fs.existsSync(SERVERS_FILE)) {
    console.log('⚠️  No se encontró archivo de servidores (servers.json)');
    return 0;
  }

  const servers = JSON.parse(fs.readFileSync(SERVERS_FILE, 'utf-8'));

  if (servers.length === 0) {
    console.log('⚠️  No hay servidores para migrar');
    return 0;
  }

  const stmt = db.prepare(`
    INSERT OR REPLACE INTO servers (id, name, url, api_key, enabled, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  let count = 0;
  for (const server of servers) {
    try {
      stmt.run(
        server.id,
        server.name,
        server.url,
        server.apiKey,
        server.enabled ? 1 : 0,
        server.createdAt
      );
      count++;
      console.log(`✅ Servidor migrado: ${server.name}`);
    } catch (error) {
      console.error(`❌ Error migrando servidor ${server.name}:`, error.message);
    }
  }

  return count;
}

// Migrar suscripciones
function migrateSubscriptions() {
  if (!fs.existsSync(SUBSCRIPTIONS_FILE)) {
    console.log('⚠️  No se encontró archivo de suscripciones (subscriptions.json)');
    return 0;
  }

  const subscriptions = JSON.parse(fs.readFileSync(SUBSCRIPTIONS_FILE, 'utf-8'));
  const keys = Object.keys(subscriptions);

  if (keys.length === 0) {
    console.log('⚠️  No hay suscripciones para migrar');
    return 0;
  }

  const stmt = db.prepare(`
    INSERT OR REPLACE INTO subscriptions (user_id, server_id, created_by, expiration_date, updated_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  let count = 0;
  for (const key of keys) {
    const sub = subscriptions[key];

    // Parsear la clave para extraer server_id y user_id
    let serverId, userId;
    if (key.includes('__')) {
      [serverId, userId] = key.split('__');
    } else {
      // Formato antiguo sin servidor
      userId = key;
      serverId = sub.serverId || 'server-1';
    }

    try {
      stmt.run(
        userId,
        serverId,
        sub.createdBy || null,
        sub.expirationDate || null,
        sub.updatedAt || new Date().toISOString()
      );
      count++;
      console.log(`✅ Suscripción migrada: ${userId} en ${serverId}`);
    } catch (error) {
      console.error(`❌ Error migrando suscripción ${key}:`, error.message);
    }
  }

  return count;
}

// Ejecutar migraciones
try {
  console.log('📊 Migrando usuarios del panel...');
  const usersCount = migrateUsers();
  console.log(`\n✅ ${usersCount} usuarios migrados\n`);

  console.log('🖥️  Migrando servidores...');
  const serversCount = migrateServers();
  console.log(`\n✅ ${serversCount} servidores migrados\n`);

  console.log('📅 Migrando suscripciones...');
  const subscriptionsCount = migrateSubscriptions();
  console.log(`\n✅ ${subscriptionsCount} suscripciones migradas\n`);

  console.log('✨ Migración completada exitosamente!');
  console.log(`\nResumen:`);
  console.log(`  - Usuarios: ${usersCount}`);
  console.log(`  - Servidores: ${serversCount}`);
  console.log(`  - Suscripciones: ${subscriptionsCount}`);

  console.log('\n💡 Puedes hacer backup de los archivos JSON originales:');
  console.log('   - data/users.json');
  console.log('   - data/servers.json');
  console.log('   - data/subscriptions.json');

  process.exit(0);
} catch (error) {
  console.error('\n❌ Error en la migración:', error);
  process.exit(1);
}

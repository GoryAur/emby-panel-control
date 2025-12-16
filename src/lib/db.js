import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(process.cwd(), 'data', 'emby-panel.db');
let db = null;

// Asegurar que el directorio data existe
function ensureDataDir() {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

/**
 * Obtiene la instancia de la base de datos (singleton)
 */
export function getDatabase() {
  if (db) {
    return db;
  }

  ensureDataDir();
  db = new Database(DB_PATH);

  // Habilitar claves foráneas
  db.pragma('foreign_keys = ON');

  // Inicializar tablas si no existen
  initializeTables();

  return db;
}

/**
 * Inicializa las tablas de la base de datos
 */
function initializeTables() {
  const db = getDatabase();

  // Tabla de usuarios del panel (admin y resellers)
  db.exec(`
    CREATE TABLE IF NOT EXISTS panel_users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'reseller')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // Tabla de servidores Emby
  db.exec(`
    CREATE TABLE IF NOT EXISTS servers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      url TEXT NOT NULL,
      api_key TEXT NOT NULL,
      enabled INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // Tabla de suscripciones (relación entre usuarios de Emby y resellers)
  db.exec(`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      server_id TEXT NOT NULL,
      created_by TEXT,
      expiration_date TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, server_id),
      FOREIGN KEY (created_by) REFERENCES panel_users(id) ON DELETE SET NULL,
      FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE
    )
  `);

  // Índices para mejorar el rendimiento
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_subscriptions_user_server
    ON subscriptions(user_id, server_id)
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_subscriptions_created_by
    ON subscriptions(created_by)
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_subscriptions_expiration
    ON subscriptions(expiration_date)
  `);
}

/**
 * Cierra la conexión a la base de datos
 */
export function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}

/**
 * Ejecuta una transacción
 */
export function transaction(fn) {
  const db = getDatabase();
  const txn = db.transaction(fn);
  return txn();
}

// Asegurar que la base de datos se cierre al terminar el proceso
if (typeof process !== 'undefined') {
  process.on('exit', () => closeDatabase());
  process.on('SIGINT', () => {
    closeDatabase();
    process.exit(0);
  });
  process.on('SIGTERM', () => {
    closeDatabase();
    process.exit(0);
  });
}

export default getDatabase;

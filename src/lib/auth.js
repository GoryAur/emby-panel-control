import crypto from 'crypto';
import getDatabase from './db.js';

// Generar ID único
function generateId() {
  return crypto.randomBytes(16).toString('hex');
}

// Hash de contraseña usando SHA-256
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * Inicializa el usuario admin por defecto si no existe
 */
function ensureDefaultAdmin() {
  try {
    const db = getDatabase();

    // Leer credenciales desde variables de entorno
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    const admin = db.prepare('SELECT id FROM panel_users WHERE username = ?').get(adminUsername);

    if (!admin) {
      const id = generateId();
      const stmt = db.prepare(`
        INSERT INTO panel_users (id, username, password_hash, name, role)
        VALUES (?, ?, ?, ?, ?)
      `);

      stmt.run(id, adminUsername, hashPassword(adminPassword), 'Administrador', 'admin');

      console.log(`[Auth] Usuario admin creado: ${adminUsername}`);
    }
  } catch (error) {
    // Ignorar error de UNIQUE constraint durante build paralelo
    if (error.code !== 'SQLITE_CONSTRAINT_UNIQUE') {
      console.error('[Auth] Error al crear usuario admin:', error);
    }
  }
}

// Asegurar que existe el admin por defecto
// Solo ejecutar en runtime, no durante build
if (process.env.NODE_ENV !== 'test' && typeof window === 'undefined') {
  ensureDefaultAdmin();
}

/**
 * Verifica las credenciales del usuario
 */
export function verifyCredentials(username, password) {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT id, username, name, role, created_at
    FROM panel_users
    WHERE username = ? AND password_hash = ?
  `);

  const passwordHash = hashPassword(password);
  const user = stmt.get(username, passwordHash);

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    createdAt: user.created_at,
  };
}

/**
 * Crea un token de sesión (no guardado en BD, solo generado)
 */
export function createSessionToken(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // Token válido por 7 días

  return {
    token,
    userId,
    expiresAt: expiresAt.toISOString(),
  };
}

/**
 * Verifica un token de sesión
 */
export function verifySessionToken(token) {
  if (!token) {
    return null;
  }

  // El token tiene el formato: userId.randomToken
  const [userId, tokenPart] = token.split('.');

  if (!userId || !tokenPart || tokenPart.length !== 64) {
    return null;
  }

  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT id, username, name, role, created_at
    FROM panel_users
    WHERE id = ?
  `);

  const user = stmt.get(userId);

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    createdAt: user.created_at,
  };
}

/**
 * Crea un token completo con userId
 */
export function createFullToken(userId) {
  const randomToken = crypto.randomBytes(32).toString('hex');
  return `${userId}.${randomToken}`;
}

/**
 * Obtiene todos los usuarios (sin contraseñas)
 */
export function getAllUsers() {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT id, username, name, role, created_at
    FROM panel_users
    ORDER BY created_at DESC
  `);

  const users = stmt.all();

  return users.map(user => ({
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    createdAt: user.created_at,
  }));
}

/**
 * Obtiene un usuario por ID (sin contraseña)
 */
export function getUserById(userId) {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT id, username, name, role, created_at
    FROM panel_users
    WHERE id = ?
  `);

  const user = stmt.get(userId);

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    createdAt: user.created_at,
  };
}

/**
 * Crea un nuevo usuario
 */
export function createUser(username, password, name, role = 'reseller') {
  const db = getDatabase();

  // Verificar si el usuario ya existe
  const existingUser = db.prepare('SELECT id FROM panel_users WHERE username = ?').get(username);
  if (existingUser) {
    throw new Error('El nombre de usuario ya existe');
  }

  // Validar rol
  if (role !== 'admin' && role !== 'reseller') {
    throw new Error('El rol debe ser "admin" o "reseller"');
  }

  const id = generateId();
  const passwordHash = hashPassword(password);

  const stmt = db.prepare(`
    INSERT INTO panel_users (id, username, password_hash, name, role)
    VALUES (?, ?, ?, ?, ?)
  `);

  stmt.run(id, username, passwordHash, name, role);

  return getUserById(id);
}

/**
 * Cambia la contraseña de un usuario
 */
export function changePassword(userId, oldPassword, newPassword) {
  const db = getDatabase();

  // Verificar que la contraseña actual es correcta
  const oldPasswordHash = hashPassword(oldPassword);
  const user = db.prepare(`
    SELECT id FROM panel_users
    WHERE id = ? AND password_hash = ?
  `).get(userId, oldPasswordHash);

  if (!user) {
    throw new Error('Contraseña actual incorrecta');
  }

  // Actualizar contraseña
  const newPasswordHash = hashPassword(newPassword);
  const stmt = db.prepare(`
    UPDATE panel_users
    SET password_hash = ?, updated_at = datetime('now')
    WHERE id = ?
  `);

  stmt.run(newPasswordHash, userId);

  return true;
}

/**
 * Elimina un usuario
 */
export function deleteUser(userId) {
  const db = getDatabase();

  const stmt = db.prepare('DELETE FROM panel_users WHERE id = ?');
  const result = stmt.run(userId);

  if (result.changes === 0) {
    throw new Error('Usuario no encontrado');
  }

  return true;
}

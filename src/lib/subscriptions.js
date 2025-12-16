import getDatabase from './db.js';

/**
 * Crea una clave única para usuario + servidor
 */
function createUserKey(userId, serverId) {
  return `${serverId}__${userId}`;
}

/**
 * Obtiene todas las suscripciones (formato compatible con código existente)
 */
export function getAllSubscriptions() {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT user_id, server_id, created_by, expiration_date, updated_at
    FROM subscriptions
  `);

  const subscriptions = stmt.all();

  // Convertir a formato clave-valor para compatibilidad
  const result = {};
  for (const sub of subscriptions) {
    const key = createUserKey(sub.user_id, sub.server_id);
    result[key] = {
      userId: sub.user_id,
      serverId: sub.server_id,
      createdBy: sub.created_by,
      expirationDate: sub.expiration_date,
      updatedAt: sub.updated_at,
    };
  }

  return result;
}

/**
 * Obtiene suscripción de un usuario específico
 */
export function getSubscription(userId, serverId) {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT user_id, server_id, created_by, expiration_date, updated_at
    FROM subscriptions
    WHERE user_id = ? AND server_id = ?
  `);

  const sub = stmt.get(userId, serverId);

  if (!sub) {
    return null;
  }

  return {
    userId: sub.user_id,
    serverId: sub.server_id,
    createdBy: sub.created_by,
    expirationDate: sub.expiration_date,
    updatedAt: sub.updated_at,
  };
}

/**
 * Registra quién creó un usuario de Emby (para sistema de resellers)
 */
export function setUserCreator(userId, serverId, createdBy) {
  const db = getDatabase();

  // Verificar si ya existe la suscripción
  const existing = db.prepare(`
    SELECT id FROM subscriptions
    WHERE user_id = ? AND server_id = ?
  `).get(userId, serverId);

  if (existing) {
    // Actualizar createdBy si ya existe
    const stmt = db.prepare(`
      UPDATE subscriptions
      SET created_by = ?, updated_at = datetime('now')
      WHERE user_id = ? AND server_id = ?
    `);
    stmt.run(createdBy, userId, serverId);
  } else {
    // Crear nueva suscripción
    const stmt = db.prepare(`
      INSERT INTO subscriptions (user_id, server_id, created_by)
      VALUES (?, ?, ?)
    `);
    stmt.run(userId, serverId, createdBy);
  }

  return getSubscription(userId, serverId);
}

/**
 * Establece o actualiza la fecha de vencimiento de un usuario
 */
export function setExpiration(userId, serverId, expirationDate, createdBy = null) {
  const db = getDatabase();

  // Verificar si ya existe la suscripción
  const existing = db.prepare(`
    SELECT created_by FROM subscriptions
    WHERE user_id = ? AND server_id = ?
  `).get(userId, serverId);

  if (existing) {
    // Actualizar fecha de vencimiento
    const stmt = db.prepare(`
      UPDATE subscriptions
      SET expiration_date = ?, updated_at = datetime('now')
      WHERE user_id = ? AND server_id = ?
    `);
    stmt.run(new Date(expirationDate).toISOString(), userId, serverId);
  } else {
    // Crear nueva suscripción con fecha de vencimiento
    const stmt = db.prepare(`
      INSERT INTO subscriptions (user_id, server_id, expiration_date, created_by)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(userId, serverId, new Date(expirationDate).toISOString(), createdBy);
  }

  return getSubscription(userId, serverId);
}

/**
 * Extiende la suscripción de un usuario por X meses
 */
export function extendSubscription(userId, serverId, months = 1) {
  const db = getDatabase();

  const currentSub = getSubscription(userId, serverId);

  let newExpDate;
  if (currentSub?.expirationDate) {
    // Si ya tiene fecha, extender desde esa fecha
    const currentExp = new Date(currentSub.expirationDate);
    newExpDate = new Date(currentExp);
    newExpDate.setMonth(newExpDate.getMonth() + months);
  } else {
    // Si no tiene fecha, crear desde hoy
    newExpDate = new Date();
    newExpDate.setMonth(newExpDate.getMonth() + months);
  }

  if (currentSub) {
    // Actualizar suscripción existente
    const stmt = db.prepare(`
      UPDATE subscriptions
      SET expiration_date = ?, updated_at = datetime('now')
      WHERE user_id = ? AND server_id = ?
    `);
    stmt.run(newExpDate.toISOString(), userId, serverId);
  } else {
    // Crear nueva suscripción
    const stmt = db.prepare(`
      INSERT INTO subscriptions (user_id, server_id, expiration_date)
      VALUES (?, ?, ?)
    `);
    stmt.run(userId, serverId, newExpDate.toISOString());
  }

  return getSubscription(userId, serverId);
}

/**
 * Obtiene usuarios con suscripción vencida
 */
export function getExpiredSubscriptions() {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT user_id, server_id, expiration_date
    FROM subscriptions
    WHERE expiration_date IS NOT NULL
      AND datetime(expiration_date) < datetime('now')
  `);

  const expired = stmt.all();

  return expired.map(sub => {
    const expDate = new Date(sub.expiration_date);
    const now = new Date();
    const daysExpired = Math.floor((now - expDate) / (1000 * 60 * 60 * 24));

    return {
      userId: sub.user_id,
      serverId: sub.server_id,
      expirationDate: sub.expiration_date,
      daysExpired,
    };
  });
}

/**
 * Elimina suscripción de un usuario
 */
export function deleteSubscription(userId, serverId) {
  const db = getDatabase();

  const stmt = db.prepare(`
    DELETE FROM subscriptions
    WHERE user_id = ? AND server_id = ?
  `);

  stmt.run(userId, serverId);

  return true;
}

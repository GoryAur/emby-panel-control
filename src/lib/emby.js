import axios from 'axios';

const EMBY_SERVER_URL = process.env.EMBY_SERVER_URL;
const EMBY_API_KEY = process.env.EMBY_API_KEY;

// Cliente Axios configurado para Emby (compatibilidad con código antiguo)
const embyClient = axios.create({
  baseURL: EMBY_SERVER_URL,
  headers: {
    'X-Emby-Token': EMBY_API_KEY,
  },
});

/**
 * Crea un cliente de Emby para un servidor específico
 */
export function createEmbyClient(server) {
  return axios.create({
    baseURL: server.url,
    headers: {
      'X-Emby-Token': server.apiKey,
    },
    timeout: 10000,
  });
}

/**
 * Obtiene todos los usuarios de Emby (compatibilidad)
 */
export async function getAllUsers() {
  try {
    const response = await embyClient.get('/Users');
    return response.data;
  } catch (error) {
    console.error('Error al obtener usuarios:', error.message);
    throw error;
  }
}

/**
 * Obtiene todos los usuarios de un servidor específico
 */
export async function getAllUsersFromServer(server) {
  try {
    const client = createEmbyClient(server);
    const response = await client.get('/Users');
    return response.data.map(user => ({
      ...user,
      serverId: server.id,
      serverName: server.name,
    }));
  } catch (error) {
    console.error(`Error al obtener usuarios de ${server.name}:`, error.message);
    throw error;
  }
}

/**
 * Obtiene usuarios de múltiples servidores
 */
export async function getAllUsersFromMultipleServers(servers) {
  try {
    const promises = servers.map(server =>
      getAllUsersFromServer(server).catch(err => {
        console.error(`Error en servidor ${server.name}:`, err.message);
        return []; // Devolver array vacío si un servidor falla
      })
    );

    const results = await Promise.all(promises);
    return results.flat();
  } catch (error) {
    console.error('Error al obtener usuarios de múltiples servidores:', error);
    throw error;
  }
}

/**
 * Obtiene información de un usuario específico
 */
export async function getUser(userId, server = null) {
  try {
    const client = server ? createEmbyClient(server) : embyClient;
    const response = await client.get(`/Users/${userId}`);
    return response.data;
  } catch (error) {
    console.error(`Error al obtener usuario ${userId}:`, error.message);
    throw error;
  }
}

/**
 * Obtiene las sesiones activas
 */
export async function getActiveSessions(server = null) {
  try {
    const client = server ? createEmbyClient(server) : embyClient;
    const response = await client.get('/Sessions');
    return response.data;
  } catch (error) {
    console.error('Error al obtener sesiones:', error.message);
    throw error;
  }
}

/**
 * Obtiene sesiones activas de un servidor específico
 */
export async function getActiveSessionsFromServer(server) {
  try {
    const client = createEmbyClient(server);
    const response = await client.get('/Sessions');
    return response.data.map(session => ({
      ...session,
      serverId: server.id,
      serverName: server.name,
    }));
  } catch (error) {
    console.error(`Error al obtener sesiones de ${server.name}:`, error.message);
    return [];
  }
}

/**
 * Obtiene sesiones de múltiples servidores
 */
export async function getActiveSessionsFromMultipleServers(servers) {
  try {
    const promises = servers.map(server =>
      getActiveSessionsFromServer(server).catch(err => {
        console.error(`Error en servidor ${server.name}:`, err.message);
        return [];
      })
    );

    const results = await Promise.all(promises);
    return results.flat();
  } catch (error) {
    console.error('Error al obtener sesiones de múltiples servidores:', error);
    return [];
  }
}

/**
 * Detiene la reproducción activa en una sesión
 */
export async function stopPlayback(sessionId, server = null) {
  try {
    const client = server ? createEmbyClient(server) : embyClient;
    const response = await client.post(
      `/Sessions/${sessionId}/Playing/Stop`
    );
    return response.data;
  } catch (error) {
    if (error.response && (error.response.status === 404 || error.response.status === 400)) {
      console.log(`Sesión ${sessionId} no tiene reproducción activa`);
      return null;
    }
    console.error(`Error al detener reproducción ${sessionId}:`, error.message);
    throw error;
  }
}

/**
 * Cierra sesión de un usuario específico usando múltiples métodos
 */
export async function logoutSession(sessionId, server = null) {
  try {
    const client = server ? createEmbyClient(server) : embyClient;

    // 1. Detener cualquier reproducción activa
    await stopPlayback(sessionId, server);

    // 2. Enviar mensaje de logout al dispositivo
    try {
      await client.post(
        `/Sessions/${sessionId}/Message`,
        {
          Header: 'Sesión Cerrada',
          Text: 'Tu sesión ha sido cerrada por el administrador',
          TimeoutMs: 5000
        }
      );
    } catch (err) {
      console.log('No se pudo enviar mensaje:', err.message);
    }

    // 3. Intentar cerrar la aplicación
    try {
      await client.post(
        `/Sessions/${sessionId}/Command`,
        {
          Name: 'CloseApp'
        }
      );
    } catch (err) {
      console.log('CloseApp no soportado');
    }

    // 4. Logout directo
    try {
      await client.delete(`/Sessions/Logout?sessionId=${sessionId}`);
    } catch (err) {
      console.log('Logout directo falló:', err.message);
    }

    return { success: true, message: 'Comandos de cierre enviados' };
  } catch (error) {
    console.error(`Error al cerrar sesión ${sessionId}:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Cierra todas las sesiones activas de un usuario
 */
export async function logoutAllUserSessions(userId, server = null) {
  try {
    const sessions = await getActiveSessions(server);
    const userSessions = sessions.filter(s => s.UserId === userId);

    const logoutPromises = userSessions.map(session =>
      logoutSession(session.Id, server).catch(err => {
        console.error(`Error al cerrar sesión ${session.Id}:`, err.message);
        return null;
      })
    );

    await Promise.all(logoutPromises);
    return { closed: userSessions.length };
  } catch (error) {
    console.error(`Error al cerrar sesiones del usuario ${userId}:`, error.message);
    throw error;
  }
}

/**
 * Deshabilita un usuario y cierra todas sus sesiones activas
 */
export async function disableUser(userId, server = null) {
  try {
    const client = server ? createEmbyClient(server) : embyClient;

    // Primero cerrar todas las sesiones activas
    await logoutAllUserSessions(userId, server);

    // Luego deshabilitar el usuario
    const user = await getUser(userId, server);
    user.Policy.IsDisabled = true;

    const response = await client.post(`/Users/${userId}/Policy`, user.Policy);
    return response.data;
  } catch (error) {
    console.error(`Error al deshabilitar usuario ${userId}:`, error.message);
    throw error;
  }
}

/**
 * Habilita un usuario
 */
export async function enableUser(userId, server = null) {
  try {
    const client = server ? createEmbyClient(server) : embyClient;
    const user = await getUser(userId, server);
    user.Policy.IsDisabled = false;

    const response = await client.post(`/Users/${userId}/Policy`, user.Policy);
    return response.data;
  } catch (error) {
    console.error(`Error al habilitar usuario ${userId}:`, error.message);
    throw error;
  }
}

/**
 * Obtiene la última actividad de un usuario
 */
export async function getUserActivity(userId, server = null) {
  try {
    const client = server ? createEmbyClient(server) : embyClient;
    const response = await client.get(`/Users/${userId}/Items/Latest`);
    return response.data;
  } catch (error) {
    console.error(`Error al obtener actividad del usuario ${userId}:`, error.message);
    throw error;
  }
}

/**
 * Calcula días de inactividad basado en la última fecha de acceso
 */
export function getDaysInactive(lastActivityDate) {
  if (!lastActivityDate) return null;

  const lastDate = new Date(lastActivityDate);
  const now = new Date();
  const diffTime = Math.abs(now - lastDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * Obtiene todas las bibliotecas disponibles en el servidor
 */
export async function getLibraries(server = null) {
  try {
    const client = server ? createEmbyClient(server) : embyClient;
    const response = await client.get('/Library/VirtualFolders');
    return response.data;
  } catch (error) {
    console.error('Error al obtener bibliotecas:', error.message);
    throw error;
  }
}

/**
 * Obtiene un usuario por nombre
 */
export async function getUserByName(userName, server = null) {
  try {
    const client = server ? createEmbyClient(server) : embyClient;
    const response = await client.get('/Users');
    const users = response.data;
    return users.find(u => u.Name.toLowerCase() === userName.toLowerCase());
  } catch (error) {
    console.error(`Error al buscar usuario ${userName}:`, error.message);
    throw error;
  }
}

/**
 * Copia la configuración de un usuario plantilla a un nuevo usuario
 */
export async function copyUserConfiguration(newUserId, templateUserId, server = null) {
  try {
    const client = server ? createEmbyClient(server) : embyClient;

    // Obtener TODA la información del usuario plantilla de una vez
    const templateUser = await getUser(templateUserId, server);
    if (!templateUser) {
      console.error('No se pudo obtener el usuario plantilla');
      return;
    }

    console.log(`Copiando configuración completa del usuario plantilla "${templateUser.Name}"...`);

    // 1. Copiar Política de Usuario (Policy) - Permisos, restricciones, límites
    if (templateUser.Policy) {
      try {
        const policy = JSON.parse(JSON.stringify(templateUser.Policy)); // Deep copy
        // Mantener el ID del nuevo usuario
        delete policy.UserId;
        await client.post(`/Users/${newUserId}/Policy`, policy);
        console.log('✓ Política de usuario copiada (permisos, restricciones, acceso a bibliotecas)');
      } catch (err) {
        console.error('✗ Error al copiar política:', err.message);
      }
    }

    // 2. Copiar Configuración de Usuario (Configuration) - Preferencias de reproducción, subtítulos, etc.
    if (templateUser.Configuration) {
      try {
        const config = JSON.parse(JSON.stringify(templateUser.Configuration)); // Deep copy
        // Limpiar campos que no deben copiarse
        delete config.UserId;
        delete config.IsAdministrator;
        await client.post(`/Users/${newUserId}/Configuration`, config);
        console.log('✓ Configuración de usuario copiada (preferencias de reproducción, subtítulos, audio)');
      } catch (err) {
        console.error('✗ Error al copiar configuración:', err.message);
      }
    }

    // 3. Copiar DisplayPreferences (PREFERENCIAS DE PANTALLA)
    // Estos son los ajustes de interfaz del usuario (logos, límites, secciones home, etc.)
    console.log('\n--- Copiando DisplayPreferences (preferencias de pantalla) ---');
    const clientsToCheck = ['emby', 'webclient', 'android', 'web', 'ios', 'roku', 'kodi'];

    for (const clientName of clientsToCheck) {
      try {
        // Obtener las preferencias del usuario plantilla para este cliente
        const templatePrefs = await client.get(`/DisplayPreferences/usersettings?userId=${templateUserId}&client=${clientName}`);

        // Si tiene CustomPrefs configuradas, copiarlas al nuevo usuario
        if (templatePrefs.data && Object.keys(templatePrefs.data.CustomPrefs || {}).length > 0) {
          const prefsToSet = {
            UserId: newUserId,
            Client: clientName,
            CustomPrefs: templatePrefs.data.CustomPrefs,
            SortOrder: templatePrefs.data.SortOrder || 'Ascending'
          };

          await client.post('/DisplayPreferences/usersettings', prefsToSet);
          console.log(`✓ DisplayPreferences copiadas para client="${clientName}" (${Object.keys(templatePrefs.data.CustomPrefs).length} preferencias)`);
        }
      } catch (err) {
        // No mostrar error si simplemente no hay preferencias para ese cliente
        if (err.response?.status !== 404) {
          console.error(`✗ Error al copiar DisplayPreferences para client="${clientName}":`, err.message);
        }
      }
    }

    // 4. Verificar y reportar lo que se copió
    const newUser = await getUser(newUserId, server);
    console.log(`\n✅ COPIA COMPLETA FINALIZADA para usuario "${newUser.Name}"`);
    console.log(`  - Acceso a bibliotecas: ${newUser.Policy.EnableAllFolders ? 'Todas' : newUser.Policy.EnabledFolders.length + ' específicas'}`);
    console.log(`  - Puede reproducir: ${!newUser.Policy.EnablePlaybackRemuxing ? 'No' : 'Sí'}`);
    console.log(`  - Políticas de contraseña heredadas: ${newUser.Policy.PasswordResetProviderId || 'Ninguna'}`);
    console.log(`  - DisplayPreferences: Copiadas de plantilla "${templateUser.Name}"`);

  } catch (error) {
    console.error('Error al copiar configuración completa:', error);
    throw error;
  }
}

/**
 * Crea un nuevo usuario en Emby
 */
export async function createUser(userData, server = null) {
  try {
    const client = server ? createEmbyClient(server) : embyClient;

    // Obtener usuario plantilla si se especificó
    let templateUser = null;
    if (userData.copyFromTemplate) {
      try {
        templateUser = await getUserByName(userData.copyFromTemplate, server);
        if (templateUser) {
          console.log(`Usuario plantilla "${userData.copyFromTemplate}" encontrado (ID: ${templateUser.Id})`);
        } else {
          console.warn(`Usuario plantilla "${userData.copyFromTemplate}" no encontrado`);
        }
      } catch (err) {
        console.error('Error al obtener usuario plantilla:', err);
      }
    }

    // Emby API requiere el formato específico
    const payload = {
      Name: userData.name,
    };

    // Solo agregar password si se proporciona
    if (userData.password) {
      payload.Password = userData.password;
    }

    // Crear usuario básico
    const response = await client.post('/Users/New', payload);
    const newUser = response.data;
    console.log(`Usuario "${userData.name}" creado con ID: ${newUser.Id}`);

    // Si hay usuario plantilla, copiar su configuración completa PRIMERO
    if (templateUser) {
      console.log('Copiando configuración completa del usuario plantilla...');
      await copyUserConfiguration(newUser.Id, templateUser.Id, server);
      console.log('✓ Configuración de plantilla aplicada');
    }

    // Obtener usuario actualizado después de copiar configuración
    const currentUser = await getUser(newUser.Id, server);
    const policy = { ...currentUser.Policy };
    let needsUpdate = false;

    // SOLO aplicar configuraciones personalizadas si se especifican explícitamente
    // Esto permite sobrescribir selectivamente la configuración de la plantilla

    if (userData.isAdmin !== undefined && userData.isAdmin !== null) {
      policy.IsAdministrator = userData.isAdmin;
      needsUpdate = true;
      console.log(`⚙ Sobrescribiendo isAdmin de plantilla: ${userData.isAdmin}`);
    }

    // Configurar acceso a bibliotecas SOLO si se especifica explícitamente
    // Si no se especifica, se mantiene lo copiado de la plantilla
    if (userData.enabledLibraries && userData.enabledLibraries !== 'template') {
      if (userData.enabledLibraries === 'all') {
        policy.EnableAllFolders = true;
        policy.EnabledFolders = [];
        needsUpdate = true;
        console.log('⚙ Sobrescribiendo acceso de plantilla: Todas las bibliotecas');
      } else if (Array.isArray(userData.enabledLibraries) && userData.enabledLibraries.length > 0) {
        policy.EnableAllFolders = false;
        policy.EnabledFolders = userData.enabledLibraries;
        needsUpdate = true;
        console.log(`⚙ Sobrescribiendo acceso de plantilla: ${userData.enabledLibraries.length} bibliotecas específicas`);
      }
    } else if (templateUser) {
      console.log('✓ Acceso a bibliotecas heredado de plantilla (sin cambios)');
    }

    // Actualizar policy si hay cambios personalizados
    if (needsUpdate) {
      await client.post(`/Users/${newUser.Id}/Policy`, policy);
      console.log('✓ Configuraciones personalizadas aplicadas sobre la plantilla');
    }

    // Retornar usuario final actualizado
    return await getUser(newUser.Id, server);
  } catch (error) {
    console.error('Error al crear usuario:', error.message);
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw error;
  }
}

/**
 * Actualiza información de un usuario en Emby
 */
export async function updateUser(userId, userData, server = null) {
  try {
    const client = server ? createEmbyClient(server) : embyClient;

    // Obtener usuario actual
    const currentUser = await getUser(userId, server);

    // Actualizar campos proporcionados
    const updatedUser = {
      ...currentUser,
      Name: userData.name || currentUser.Name,
    };

    // Actualizar usuario
    const response = await client.post(`/Users/${userId}`, updatedUser);

    // Si se proporciona nueva contraseña, cambiarla
    if (userData.password) {
      await updateUserPassword(userId, userData.password, server);
    }

    return response.data;
  } catch (error) {
    console.error(`Error al actualizar usuario ${userId}:`, error.message);
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw error;
  }
}

/**
 * Cambia la contraseña de un usuario
 */
export async function updateUserPassword(userId, newPassword, server = null) {
  try {
    const client = server ? createEmbyClient(server) : embyClient;

    const payload = {
      Id: userId,
      NewPw: newPassword,
      ResetPassword: false,
    };

    const response = await client.post(`/Users/${userId}/Password`, payload);
    return response.data;
  } catch (error) {
    console.error(`Error al cambiar contraseña del usuario ${userId}:`, error.message);
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw error;
  }
}

/**
 * Elimina un usuario de Emby
 */
export async function deleteUser(userId, server = null) {
  try {
    const client = server ? createEmbyClient(server) : embyClient;

    // Primero cerrar todas las sesiones activas
    await logoutAllUserSessions(userId, server);

    // Eliminar usuario
    const response = await client.delete(`/Users/${userId}`);
    return response.data;
  } catch (error) {
    console.error(`Error al eliminar usuario ${userId}:`, error.message);
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw error;
  }
}

/**
 * Vincula un usuario de Emby con Emby Connect usando su email
 */
export async function linkEmbyConnect(userId, email, server = null) {
  try {
    const client = server ? createEmbyClient(server) : embyClient;
    const apiKey = server?.apiKey || process.env.EMBY_API_KEY;

    console.log(`Vinculando usuario ${userId} con Emby Connect: ${email}`);

    const response = await client.post(
      `/Users/${userId}/Connect/Link`,
      null,
      {
        params: {
          ConnectUsername: email,
          api_key: apiKey,
        }
      }
    );

    console.log(`✓ Usuario vinculado con Emby Connect`);
    return response.data;
  } catch (error) {
    console.error(`Error al vincular usuario ${userId} con Emby Connect:`, error.message);
    if (error.response?.status === 400) {
      throw new Error('Email de Emby Connect inválido o ya está en uso');
    }
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw error;
  }
}

/**
 * Desvincula un usuario de Emby Connect
 */
export async function unlinkEmbyConnect(userId, server = null) {
  try {
    const client = server ? createEmbyClient(server) : embyClient;
    const apiKey = server?.apiKey || process.env.EMBY_API_KEY;

    console.log(`Desvinculando usuario ${userId} de Emby Connect`);

    const response = await client.delete(
      `/Users/${userId}/Connect/Link`,
      {
        params: {
          api_key: apiKey,
        }
      }
    );

    console.log(`✓ Usuario desvinculado de Emby Connect`);
    return response.data;
  } catch (error) {
    console.error(`Error al desvincular usuario ${userId} de Emby Connect:`, error.message);
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw error;
  }
}

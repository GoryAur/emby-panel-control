const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const USERS_FILE = path.join(__dirname, '..', 'data', 'users.json');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function changePassword() {
  console.log('\n=== Cambiar contraseña de usuario ===\n');

  try {
    // Leer archivo de usuarios
    const data = fs.readFileSync(USERS_FILE, 'utf-8');
    const usersData = JSON.parse(data);

    // Mostrar usuarios disponibles
    console.log('Usuarios disponibles:');
    usersData.users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (@${user.username})`);
    });

    // Seleccionar usuario
    const userIndex = await question('\nSelecciona el número de usuario: ');
    const selectedUser = usersData.users[parseInt(userIndex) - 1];

    if (!selectedUser) {
      console.log('❌ Usuario no encontrado');
      rl.close();
      return;
    }

    console.log(`\nCambiando contraseña para: ${selectedUser.name} (@${selectedUser.username})`);

    // Pedir nueva contraseña
    const newPassword = await question('Nueva contraseña: ');

    if (!newPassword || newPassword.length < 4) {
      console.log('❌ La contraseña debe tener al menos 4 caracteres');
      rl.close();
      return;
    }

    const confirmPassword = await question('Confirmar contraseña: ');

    if (newPassword !== confirmPassword) {
      console.log('❌ Las contraseñas no coinciden');
      rl.close();
      return;
    }

    // Actualizar contraseña
    selectedUser.passwordHash = hashPassword(newPassword);

    // Guardar cambios
    fs.writeFileSync(USERS_FILE, JSON.stringify(usersData, null, 2));

    console.log('\n✅ Contraseña actualizada exitosamente!');
    console.log(`\nNuevas credenciales:`);
    console.log(`Usuario: ${selectedUser.username}`);
    console.log(`Contraseña: ${newPassword}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    rl.close();
  }
}

changePassword();

# Emby Panel Control

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.1.0-green.svg)
![Docker](https://img.shields.io/badge/docker-ready-brightgreen.svg)
![Next.js](https://img.shields.io/badge/Next.js-16-black.svg)

Panel de administración web moderno y completo para gestionar usuarios de Emby Server con soporte multi-servidor, control de suscripciones, integración con Emby Connect y copias de configuración de usuarios plantilla.

## 🌟 Características Destacadas

- ✅ **Gestión completa de usuarios** con plantillas de configuración
- ☁️ **Integración con Emby Connect** para acceso remoto
- 🖥️ **Multi-servidor**: Gestiona varios servidores Emby desde un solo panel
- 👥 **Sistema de roles**: Admin y Reseller con permisos jerárquicos
- 📅 **Control de suscripciones** con vencimientos automáticos
- 🎨 **Interfaz responsive** con modo oscuro y optimización móvil
- 🔒 **Seguro**: Autenticación bcrypt, cookies httpOnly, validación de permisos
- 🐳 **Docker ready**: Imagen optimizada y lista para producción

## 📑 Tabla de Contenidos

- [🌟 Características Destacadas](#-características-destacadas)
- [🚀 Inicio Rápido](#-inicio-rápido)
- [📋 Requisitos](#-requisitos)
- [Instalación](#instalación)
- [Variables de Entorno](#variables-de-entorno)
- [Configuración](#configuración)
- [Uso](#uso)
  - [Crear Usuario](#crear-usuario)
  - [Emby Connect](#emby-connect)
  - [Gestionar Sesiones](#gestionar-sesiones)
  - [Extender Suscripción](#extender-suscripción)
- [API Endpoints](#api-endpoints)
- [🔒 Seguridad](#-seguridad)
- [Docker Build](#docker-build)
- [❓ Preguntas Frecuentes (FAQ)](#-preguntas-frecuentes-faq)
- [🔧 Solución de Problemas](#-solución-de-problemas)
- [Contribución](#contribución)
- [Changelog](#changelog)

## Características

### Gestión de Usuarios
- Crear, editar y eliminar usuarios de Emby
- Copia completa de configuración desde usuarios plantilla (Policy, Configuration, DisplayPreferences)
- Soporte para tipos de usuario personalizados ("Basico", "1 Pantalla", etc.)
- Validación de contraseñas (mínimo 6 caracteres, opcional)
- Control de acceso a bibliotecas específicas o todas
- **Integración con Emby Connect**: Vincular usuarios con cuentas de Emby Connect para acceso remoto
- Indicador visual (☁️) para usuarios con Emby Connect vinculado

### Control de Sesiones
- Visualización de sesiones activas en tiempo real
- Detener reproducción de contenido
- Cerrar sesiones de usuarios
- Deshabilitar/habilitar usuarios

### Sistema de Suscripciones
- Establecer fechas de vencimiento para usuarios
- Deshabilitación automática de usuarios vencidos (via cron)
- Extensión de suscripciones
- Historial de creadores de usuarios

### Multi-Servidor
- Soporte para múltiples servidores Emby
- Gestión centralizada desde un solo panel
- Asignación de usuarios a servidores específicos

### Roles y Permisos
- **Admin**: Control total del panel y todos los usuarios
- **Reseller**: Puede crear y gestionar usuarios (configurado por admin)
- Sistema de jerarquía: cada usuario puede gestionar solo los usuarios que creó

### Interfaz Responsive
- Diseño adaptable para móviles, tablets y escritorio
- Modo oscuro/claro
- Gestures en móvil (swipe para cerrar modales)
- Skeleton screens para mejores estados de carga

## 🚀 Inicio Rápido

```bash
# 1. Crear directorio para datos
mkdir -p ./emby-panel-data

# 2. Crear archivo docker-compose.yml (ver ejemplo abajo)

# 3. Configurar variables de entorno en el archivo

# 4. Iniciar el panel
docker compose up -d

# 5. Acceder al panel
# http://localhost:44444
# Usuario: admin (o el configurado en ADMIN_USERNAME)
# Contraseña: admin123 (o la configurada en ADMIN_PASSWORD)
```

## 📋 Requisitos

- Docker y Docker Compose (recomendado)
- O Node.js 24+ para desarrollo local
- Emby Server 4.9+
- Un servidor Emby con API Key (obtener desde Dashboard > Advanced > API Keys)

## Instalación

### Con Docker (Recomendado)

1. Crear directorio para datos:
```bash
mkdir -p /path/to/emby-panel-data
```

2. Crear archivo `docker-compose.yml`:
```yaml
---
services:
  emby-panel:
    image: goryaur4/emby-panel-control:latest
    container_name: emby-panel
    environment:
      - TZ=America/Mexico_City
      - EMBY_SERVER_URL=http://emby-server:8096
      - EMBY_API_KEY=your_api_key_here
      - CRON_SECRET=your_secret_here
      - ADMIN_USERNAME=admin
      - ADMIN_PASSWORD=admin123
      - BASE_URL=http://localhost:44444
    volumes:
      - /path/to/emby-panel-data:/app/data
    ports:
      - 44444:44444
    restart: unless-stopped
```

3. Iniciar el contenedor:
```bash
docker compose up -d
```

4. Acceder al panel:
```
http://localhost:44444
```

### Desarrollo Local

1. Clonar el repositorio:
```bash
git clone https://github.com/tu-usuario/emby-panel-control.git
cd emby-panel-control
```

2. Instalar dependencias:
```bash
npm install
```

3. Crear archivo `.env.local`:
```env
EMBY_SERVER_URL=http://localhost:8096
EMBY_API_KEY=your_api_key_here
CRON_SECRET=your_secret_here
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
BASE_URL=http://localhost:44444
```

4. Ejecutar en modo desarrollo:
```bash
npm run dev
```

5. Build para producción:
```bash
npm run build
npm start
```

## Variables de Entorno

### Obligatorias

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `EMBY_SERVER_URL` | URL del servidor Emby principal | `http://emby:8096` |
| `EMBY_API_KEY` | API Key del servidor Emby | `abc123def456` |
| `CRON_SECRET` | Secret para proteger endpoints de cron | `mi-secret-seguro` |

### Opcionales

| Variable | Descripción | Default | Ejemplo |
|----------|-------------|---------|---------|
| `ADMIN_USERNAME` | Usuario admin del panel | `admin` | `administrator` |
| `ADMIN_PASSWORD` | Contraseña admin del panel | `admin123` | `MiPass123` |
| `BASE_URL` | URL base del panel | `http://localhost:44444` | `https://panel.example.com` |
| `TZ` | Zona horaria | `Etc/UTC` | `America/Mexico_City` |
| `PORT` | Puerto del servidor | `44444` | `3000` |

## Configuración

### Multi-Servidor

Para agregar servidores adicionales de Emby:

1. Acceder al panel como admin
2. Ir a la sección de servidores
3. Agregar nuevo servidor con:
   - Nombre identificador
   - URL del servidor
   - API Key

### Usuarios Plantilla

Para configurar tipos de usuarios (Basico, 1 Pantalla, etc.):

1. En Emby Server, crear usuarios con los nombres exactos:
   - `Basico`
   - `1 Pantalla`

2. Configurar cada usuario plantilla con:
   - Políticas de acceso deseadas
   - Preferencias de reproducción
   - Restricciones
   - DisplayPreferences (ajustes de interfaz)

3. Al crear usuarios desde el panel, seleccionar el tipo deseado para copiar toda la configuración

### Deshabilitación Automática

Configurar un cron job para deshabilitar usuarios vencidos:

```bash
# Ejecutar cada hora
0 * * * * curl -X POST http://localhost:44444/api/cron/disable-expired?secret=your_secret_here
```

O usar el endpoint desde cualquier sistema de cron.

## Uso

### Crear Usuario

1. Acceder al panel
2. Click en "Crear Usuario"
3. Completar el formulario:
   - **Nombre de usuario** (requerido)
   - **Contraseña** (opcional, mínimo 6 caracteres)
   - **Email de Emby Connect** (opcional): Vincula el usuario con una cuenta de Emby Connect existente para acceso remoto
   - **Servidor** (requerido)
   - **Tipo de usuario** (Basico, 1 Pantalla, etc.)
   - **Fecha de vencimiento** (opcional)
   - **Acceso a bibliotecas** (todas o selección específica)
4. Confirmar creación

El usuario se creará con una copia exacta de las configuraciones del usuario plantilla seleccionado, incluyendo:
- Políticas de acceso (Policy)
- Configuraciones de reproducción (Configuration)
- Preferencias de pantalla (DisplayPreferences)

**Nota sobre contraseñas**: Si no se proporciona contraseña y se vincula con Emby Connect, el usuario podrá iniciar sesión usando su cuenta de Emby Connect.

### Emby Connect

#### Vincular Cuenta de Emby Connect

1. Editar usuario existente
2. Agregar el email de la cuenta de Emby Connect en el campo correspondiente
3. Guardar cambios
4. El usuario ahora podrá acceder al servidor usando su cuenta de Emby Connect

Los usuarios con Emby Connect vinculado mostrarán un icono de nube ☁️ junto a su nombre.

#### Desvincular Cuenta de Emby Connect

1. Editar usuario
2. Borrar el contenido del campo "Email de Emby Connect"
3. Guardar cambios

**Importante**: La cuenta de Emby Connect debe existir previamente. El panel no crea cuentas de Emby Connect, solo las vincula con usuarios de Emby Server.

### Gestionar Sesiones

1. Ver usuarios activos en el dashboard
2. Click en usuario para ver detalles
3. Acciones disponibles:
   - Detener reproducción actual
   - Cerrar sesión
   - Deshabilitar usuario

### Extender Suscripción

1. Buscar usuario
2. Click en "Extender Suscripción"
3. Seleccionar nueva fecha de vencimiento
4. Confirmar

## API Endpoints

### Autenticación

- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/logout` - Cerrar sesión
- `GET /api/auth/me` - Obtener usuario actual

### Usuarios Emby

- `GET /api/emby/users` - Listar usuarios (incluye información de Emby Connect)
- `POST /api/emby/create-user` - Crear usuario (soporta vinculación con Emby Connect)
- `POST /api/emby/edit-user` - Editar usuario (soporta vincular/desvincular Emby Connect)
- `POST /api/emby/delete-user` - Eliminar usuario
- `POST /api/emby/toggle-user` - Habilitar/deshabilitar usuario

### Sesiones

- `POST /api/emby/logout` - Cerrar sesión de usuario
- `POST /api/emby/stop-playback` - Detener reproducción

### Suscripciones

- `GET /api/emby/subscriptions` - Listar suscripciones
- `POST /api/emby/set-expiration` - Establecer vencimiento
- `POST /api/emby/extend-subscription` - Extender suscripción
- `POST /api/cron/disable-expired` - Deshabilitar vencidos (requiere secret)

### Panel

- `GET /api/panel/users` - Listar usuarios del panel
- `POST /api/panel/create-reseller` - Crear reseller
- `POST /api/panel/edit-reseller` - Editar reseller
- `POST /api/panel/delete-reseller` - Eliminar reseller

## Estructura del Proyecto

```
emby-panel-control/
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── api/          # API Routes
│   │   ├── login/        # Página de login
│   │   └── page.js       # Dashboard principal
│   ├── components/       # Componentes React
│   │   ├── DashboardLayout.js
│   │   ├── UserModal.js
│   │   └── ...
│   ├── lib/              # Lógica de negocio
│   │   ├── auth.js       # Autenticación
│   │   ├── emby.js       # Cliente Emby API
│   │   ├── database.js   # SQLite
│   │   ├── servers.js    # Multi-servidor
│   │   └── subscriptions.js
│   └── hooks/            # React hooks
├── public/               # Archivos estáticos
├── data/                 # Base de datos SQLite (gitignored)
├── Dockerfile            # Imagen Docker
├── docker-compose.yml    # Compose para desarrollo
├── package.json
└── README.md
```

## Tecnologías

- **Frontend**: Next.js 16, React 19
- **Backend**: Next.js API Routes
- **Base de datos**: SQLite (better-sqlite3)
- **Autenticación**: bcryptjs + cookies httpOnly
- **Cliente HTTP**: axios
- **Estilos**: CSS modules
- **Contenedor**: Docker (Alpine Linux)

## Desarrollo

### Scripts disponibles

```bash
npm run dev          # Desarrollo con hot reload
npm run build        # Build para producción
npm start            # Ejecutar build de producción
npm run lint         # Linter
```

### Estructura de Base de Datos

**Tabla: panel_users**
- Usuarios del panel (admin, resellers)
- Autenticación con bcrypt

**Tabla: servers**
- Servidores Emby configurados
- Almacena URL y API Keys

**Tabla: subscriptions**
- Control de fechas de vencimiento
- Relación userId-serverId

**Tabla: user_creators**
- Registro de quién creó cada usuario
- Para control de permisos jerárquico

## 🔒 Seguridad

- **Contraseñas hasheadas** con bcrypt (salt rounds: 10)
- **Cookies httpOnly** para sesiones (no accesibles desde JavaScript)
- **Validación de permisos** en cada endpoint API
- **Secret para endpoints de cron** (CRON_SECRET)
- **Variables de entorno** para todas las credenciales sensibles
- **CORS configurado** correctamente
- **Sanitización de inputs** en formularios y API
- **Protección de datos sensibles**:
  - `.gitignore` configurado para excluir archivos de configuración local
  - Base de datos SQLite excluida del repositorio
  - API Keys y secrets nunca se commitean
  - Archivos de log y backups excluidos

### Archivos Protegidos

El `.gitignore` está configurado para proteger:
- Variables de entorno (`.env*`, `.env.local`, `.env.docker`)
- Base de datos (`/data/`, `*.db`, `*.sqlite`)
- Archivos de log (`*.log`)
- Archivos temporales y backups (`*.tmp`, `*.backup`, `*.bak`)
- Dependencias (`node_modules/`, `.next/`)

## Docker Build

Para construir la imagen:

```bash
docker build -t goryaur4/emby-panel-control:latest .
```

Para publicar en DockerHub:

```bash
docker push goryaur4/emby-panel-control:latest
```

La imagen usa:
- Multi-stage build para optimización
- Usuario no-root (abc:1001)
- Alpine Linux para tamaño reducido (~700MB)
- Node.js 24

## Configuración con Traefik

Ejemplo de configuración con Traefik como reverse proxy:

```yaml
services:
  emby-panel:
    image: goryaur4/emby-panel-control:latest
    container_name: emby-panel
    networks:
      - web
    environment:
      - TZ=America/Mexico_City
      - EMBY_SERVER_URL=http://emby:8096
      - EMBY_API_KEY=${EMBY_API_KEY}
      - CRON_SECRET=${CRON_SECRET}
      - ADMIN_USERNAME=${ADMIN_USERNAME}
      - ADMIN_PASSWORD=${ADMIN_PASSWORD}
      - BASE_URL=https://panel.example.com
    volumes:
      - ./emby-panel-data:/app/data
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.emby-panel.rule=Host(`panel.example.com`)"
      - "traefik.http.routers.emby-panel.entrypoints=websecure"
      - "traefik.http.routers.emby-panel.tls.certresolver=cloudflare"
      - "traefik.http.services.emby-panel.loadbalancer.server.port=44444"
    restart: unless-stopped

networks:
  web:
    external: true
```

## ❓ Preguntas Frecuentes (FAQ)

### ¿Puedo crear usuarios sin contraseña?

Sí, desde la versión 1.1.0 la contraseña es opcional. Esto es útil cuando vinculas el usuario con Emby Connect, ya que el usuario podrá iniciar sesión usando su cuenta de Emby Connect.

### ¿Cómo funciona Emby Connect?

Emby Connect es un servicio de Emby que permite a los usuarios acceder a sus servidores de forma remota sin necesidad de configurar port forwarding o VPN. Al vincular un usuario de Emby Server con una cuenta de Emby Connect, el usuario puede:
- Acceder desde cualquier lugar usando su email de Emby Connect
- No necesita recordar la URL del servidor
- Se sincroniza automáticamente con la cuenta de Emby Connect

### ¿El panel crea cuentas de Emby Connect?

No. El panel solo **vincula** usuarios de Emby Server con cuentas de Emby Connect **existentes**. Los usuarios deben crear primero su cuenta de Emby Connect en [emby.media](https://emby.media/community/index.php?/register/).

### ¿Puedo usar Emby Connect y contraseña local al mismo tiempo?

Sí, un usuario puede tener tanto una contraseña local como estar vinculado a Emby Connect. El usuario podrá iniciar sesión usando cualquiera de los dos métodos.

### ¿Qué significa el icono de nube ☁️?

El icono de nube aparece junto al nombre de los usuarios que tienen una cuenta de Emby Connect vinculada. Al pasar el cursor sobre el icono, se muestra el email de la cuenta vinculada.

### ¿Los usuarios plantilla deben tener algún nombre específico?

Sí, los usuarios plantilla en Emby Server deben tener exactamente los nombres configurados en el panel, por ejemplo: "Basico", "1 Pantalla", etc. El sistema los busca por nombre exacto para copiar su configuración.

## 🔧 Solución de Problemas

### Error: "unable to open database file"

Permisos incorrectos en el directorio de datos:

```bash
sudo chown -R 1001:1001 /path/to/emby-panel-data
```

### La copia de plantilla no funciona completa

Verificar que los usuarios plantilla existan en Emby con los nombres exactos:
- "Basico"
- "1 Pantalla"

### No se pueden crear usuarios

1. Verificar que EMBY_API_KEY es válido
2. Verificar conectividad con EMBY_SERVER_URL
3. Ver logs: `docker compose logs -f emby-panel`

### Error al vincular Emby Connect

**Error: "Email de Emby Connect inválido o ya está en uso"**

Posibles causas:
1. La cuenta de Emby Connect no existe - el usuario debe crearla primero en emby.media
2. El email ya está vinculado a otro usuario en el servidor
3. El formato del email es incorrecto

**Solución**: Verificar que la cuenta existe y no está vinculada a otro usuario.

### El icono de nube ☁️ no aparece

1. Verificar que el campo "Email de Emby Connect" se guardó correctamente
2. Refrescar la página (el icono se muestra al cargar la lista de usuarios)
3. Verificar en Emby Server que la vinculación fue exitosa (Dashboard > Users > usuario > Connect)

## Contribución

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/NuevaCaracteristica`)
3. Commit tus cambios (`git commit -m 'Agregar nueva característica'`)
4. Push a la rama (`git push origin feature/NuevaCaracteristica`)
5. Abrir un Pull Request

## Licencia

MIT License

Copyright (c) 2025

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Soporte

Para reportar bugs o solicitar features, por favor abrir un issue en GitHub.

## Autor

Desarrollado con Claude Code

## Changelog

### v1.1.0 (2025-12-27)
- **Integración con Emby Connect**: Vincular/desvincular usuarios con cuentas de Emby Connect
- Indicador visual (☁️) para usuarios con Emby Connect vinculado
- Contraseña ahora opcional al crear usuarios (útil con Emby Connect)
- Mejoras en proporción del logo del panel
- Optimización de vista móvil para todos los formularios
- Mejoras en responsive design para tablets y móviles pequeños

### v1.0.0 (2025-12-16)
- Copia completa de configuración de usuarios plantilla (Policy, Configuration, DisplayPreferences)
- Validación de contraseñas (mínimo 6 caracteres)
- Soporte multi-servidor
- Sistema de roles (Admin, Reseller)
- Control de suscripciones y vencimientos
- Interfaz responsive con modo oscuro
- Gestures y mejoras mobile
- Deshabilitación automática de usuarios vencidos

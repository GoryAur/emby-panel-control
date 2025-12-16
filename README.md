# Emby Panel Control

Panel de administración web para gestionar usuarios de Emby Server con soporte multi-servidor, control de suscripciones y copias de configuración de usuarios plantilla.

## Características

### Gestión de Usuarios
- Crear, editar y eliminar usuarios de Emby
- Copia completa de configuración desde usuarios plantilla (Policy, Configuration, DisplayPreferences)
- Soporte para tipos de usuario personalizados ("Basico", "1 Pantalla", etc.)
- Validación de contraseñas (mínimo 6 caracteres)
- Control de acceso a bibliotecas específicas o todas

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

## Requisitos

- Docker y Docker Compose (recomendado)
- O Node.js 24+ para desarrollo local
- Emby Server 4.9+
- Un servidor Emby con API Key

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
3. Seleccionar:
   - Nombre de usuario
   - Contraseña (mínimo 6 caracteres)
   - Servidor
   - Tipo de usuario (Basico, 1 Pantalla, etc.)
   - Fecha de vencimiento (opcional)
4. Confirmar creación

El usuario se creará con una copia exacta de las configuraciones del usuario plantilla seleccionado, incluyendo:
- Políticas de acceso (Policy)
- Configuraciones de reproducción (Configuration)
- Preferencias de pantalla (DisplayPreferences)

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

- `GET /api/emby/users` - Listar usuarios
- `POST /api/emby/create-user` - Crear usuario
- `POST /api/emby/edit-user` - Editar usuario
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

## Seguridad

- Contraseñas hasheadas con bcrypt
- Cookies httpOnly para sesiones
- Validación de permisos en cada endpoint
- Secret para proteger endpoints de cron
- Variables de entorno para credenciales sensibles
- CORS configurado
- Sanitización de inputs

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

## Solución de Problemas

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

### v1.0.0 (2025-12-16)
- Copia completa de configuración de usuarios plantilla (Policy, Configuration, DisplayPreferences)
- Validación de contraseñas (mínimo 6 caracteres)
- Soporte multi-servidor
- Sistema de roles (Admin, Reseller)
- Control de suscripciones y vencimientos
- Interfaz responsive con modo oscuro
- Gestures y mejoras mobile
- Deshabilitación automática de usuarios vencidos

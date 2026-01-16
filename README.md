# Emby Panel Control - v2.0 CyberGreen

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-2.0.0-green.svg)
![Docker](https://img.shields.io/badge/docker-ready-brightgreen.svg)
![Next.js](https://img.shields.io/badge/Next.js-16-black.svg)

Panel de administración web moderno y completo para gestionar usuarios de Emby Server. La versión 2.0 presenta una renovación total de la interfaz con una estética "Cyber Green", modularización completa del código y traducción total al español.

## 🌟 Novedades v2.0

- **🎨 Nueva Interfaz Cyber Green**: Tema oscuro Carbono/Negro con acentos en verde neón vibrante.
- **🇪🇸 100% en Español**: Toda la interfaz, mensajes y errores han sido traducidos.
- **🛠️ Arquitectura Modular**: Refactorización del código frontend utilizando una capa de servicios (`src/services/`) para mejor mantenimiento y escalabilidad.
- **⚡ Rendimiento Mejorado**: Carga de datos en paralelo para un dashboard más rápido.

## 🌟 Características Destacadas

- **Gestión completa de usuarios** con plantillas de configuración.
- **Integración con Emby Connect** para fácil acceso remoto (Icono ☁️).
- **Multi-servidor**: Gestiona varios servidores Emby desde un solo panel.
- **Sistema de roles**: Administrador y Revendedor con permisos jerárquicos.
- **Control de suscripciones** con vencimientos automáticos y alertas visuales.
- **Interfaz Moderna**: Diseño responsive, animaciones fluidas y estética profesional.
- **Seguridad**: Autenticación robusta, cookies httpOnly y protección de rutas.
- **Docker ready**: Optimizado para despliegue en contenedores.

## 📑 Tabla de Contenidos

- [🚀 Inicio Rápido](#-inicio-rápido)
- [📋 Requisitos](#-requisitos)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Uso](#uso)
- [API Endpoints](#api-endpoints)
- [🐳 Docker Build](#-docker-build)
- [Contribución](#contribución)
- [Changelog](#changelog)

## 🚀 Inicio Rápido

```bash
# 1. Crear directorio para datos
mkdir -p ./emby-panel-data

# 2. Iniciar con Docker Compose
docker compose up -d

# 3. Acceder al panel
# URL: http://localhost:44444
# Usuario: admin
# Contraseña: admin123
```

## 📋 Requisitos

- **Docker** y **Docker Compose** (recomendado).
- O **Node.js 24+** para desarrollo local.
- Un servidor **Emby 4.9+**.
- **API Key** de Emby (Dashboard > Advanced > API Keys).

## Instalación

### Con Docker (Producción)

1. Crea un archivo `docker-compose.yml`:

```yaml
services:
  emby-panel:
    image: goryaur4/emby-panel-control:latest
    container_name: emby-panel
    environment:
      - TZ=America/Mexico_City
      - EMBY_SERVER_URL=http://tu-emby:8096
      - EMBY_API_KEY=tu_api_key
      - CRON_SECRET=secreto_seguro
      - ADMIN_USERNAME=admin
      - ADMIN_PASSWORD=admin123
      - BASE_URL=https://panel.tudominio.com
    volumes:
      - ./data:/app/data
    ports:
      - 44444:44444
    restart: unless-stopped
```

2. Ejecuta: `docker compose up -d`

### Desarrollo Local

1. Clonar repositorio e instalar dependencias:
```bash
git clone https://github.com/tu-repo/emby-panel-control.git
cd emby-panel-control
npm install
```

2. Configurar `.env.local`:
```env
EMBY_SERVER_URL=http://localhost:8096
EMBY_API_KEY=tu_api_key
CRON_SECRET=dev_secret
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

3. Iniciar entorno dev:
```bash
npm run dev
```

## Configuración

### Multi-Servidor
Accede como **Admin**, ve a la pestaña **Servidores** y añade nuevos servidores con su URL y API Key.

### Plantillas de Usuario
Para que la copia de configuración funcione, crea en tu Emby Server usuarios con estos nombres exactos (respetando mayúsculas):
- `1 Pantalla`
- `3 Pantallas`
- `5 Pantallas`

Configura en ellos límites de streaming, acceso a librerías y preferencias visuales. El panel copiará todo de estos usuarios al crear nuevos clientes.

### Deshabilitación Automática
Configura un CRON externo para ejecutar la limpieza de usuarios vencidos:
```bash
# Cada hora
0 * * * * curl -X POST "http://localhost:44444/api/cron/disable-expired?secret=tu_cron_secret"
```

## Uso

### Crear Usuario
1. Click en **"CREAR USUARIO"**.
2. Llena los datos. Si usas **Emby Connect**, no es obligatoria la contraseña.
3. Selecciona el **Tipo** (1, 3 o 5 pantallas) para aplicar la plantilla correspondiente.

### Estados de Usuario
- **ONLINE**: Usuario activo y conectado.
- **OFFLINE**: Usuario habilitado pero desconectado.
- **DESHABILITADO**: Usuario bloqueado manualmente o por vencimiento.
- **VENCIDO**: La fecha de suscripción ha pasado (se marca en rojo).

### Gestión
Desde la tabla de usuarios puedes:
- **Editar**: Cambiar datos, servidor o vincular Emby Connect.
- **Habilitar/Deshabilitar**: Bloquear acceso rápidamente.
- **Eliminar**: Borrar usuario del panel y de Emby.
- **Detener Reproducción**: Si el usuario está viendo algo, puedes cortarlo remotamente.

## API Endpoints

### Autenticación
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Emby & Usuarios
- `GET /api/emby/users`
- `POST /api/emby/create-user`
- `POST /api/emby/edit-user`
- `POST /api/emby/delete-user`
- `POST /api/emby/toggle-user`

### Suscripciones
- `GET /api/emby/subscriptions`
- `POST /api/emby/extend-subscription`
- `POST /api/emby/check-expired`

## 🐳 Docker Build

Para construir tu propia imagen:

```bash
docker build -t mi-panel:v2 .
```

## Estructura del Proyecto

```
emby-panel-control/
├── src/
│   ├── app/              # Rutas y páginas (Next.js App Router)
│   ├── components/       # Componentes UI (React)
│   ├── lib/              # Utilidades y lógica de backend
│   └── services/         # Capa de servicios frontend (NUEVO en v2.0)
│       ├── api.js        # Cliente HTTP base
│       ├── auth.js       # Servicios de autenticación
│       ├── emby.js       # Servicios de Emby
│       └── servers.js    # Servicios de Servidores
├── public/               # Assets estáticos
├── data/                 # DB SQLite (Persistencia)
└── Dockerfile            # Configuración de imagen
```

## Tecnologías

- **Frontend**: Next.js 16, React 19, TailwindCSS 4.
- **Backend**: Next.js API Routes (Serverless functions).
- **Base de Datos**: SQLite (rápida y ligera).
- **UI**: Shadcn/ui + Lucide Icons + Framer Motion.

## Contribución

1. Fork el repositorio.
2. Crea tu rama: `git checkout -b feature/AmazingFeature`.
3. Commit tus cambios: `git commit -m 'Add some AmazingFeature'`.
4. Push a la rama: `git push origin feature/AmazingFeature`.
5. Abre un Pull Request.

## Changelog

### v2.0.0 (2026-01-24)
- **Tema CyberGreen**: Nueva identidad visual completa.
- **Modularización**: Implementación de Service Layer en frontend.
- **Traducción**: Soporte completo de idioma Español.
- **UX**: Mejoras en tabla de usuarios y visualización de fechas.
- **Performance**: Optimización de llamadas API en dashboard.

### v1.1.0
- Integración Emby Connect.
- Mejoras responsive.

### v1.0.0
- Lanzamiento inicial.
- Gestión básica y multi-servidor.

---
Desarrollado con ❤️ para la comunidad de Emby.

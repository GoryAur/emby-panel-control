# ==================================
# Dockerfile para Panel de Control Emby
# Multi-stage build optimizado para producción
# ==================================

# ------------------------------
# ETAPA 1: Builder
# ------------------------------
FROM node:24-alpine AS builder

# Instalar dependencias del sistema para compilar
RUN apk add --no-cache python3 make g++ libc6-compat

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
COPY jsconfig.json ./

# Copiar código fuente
COPY . .

# Instalar todas las dependencias y construir
RUN npm ci && \
    npm run build && \
    npm prune --production

# ------------------------------
# ETAPA 2: Runner (Producción)
# ------------------------------
FROM node:24-alpine

# Crear usuario abc
RUN adduser -D abc

# Instalar dependencias necesarias para runtime
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copiar SOLO lo necesario desde builder
# En modo standalone, copiar desde .next/standalone
COPY --from=builder --chown=abc:abc /app/.next/standalone ./
# Copiar archivos estáticos que standalone no incluye
COPY --from=builder --chown=abc:abc /app/.next/static ./.next/static
COPY --from=builder --chown=abc:abc /app/public ./public

# Crear directorio de datos
RUN mkdir -p /app/data && chown -R abc:abc /app/data

# Cambiar a usuario abc
USER abc

# Exponer puerto
EXPOSE 44444

# Variables de entorno
ENV NODE_ENV=production \
    PORT=44444 \
    HOSTNAME="0.0.0.0" \
    NEXT_TELEMETRY_DISABLED=1

# Iniciar aplicación en modo standalone
CMD ["node", "server.js"]

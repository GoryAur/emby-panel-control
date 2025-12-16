# Guía de Contribución

¡Gracias por tu interés en contribuir a Emby Panel Control! Este documento proporciona directrices para contribuir al proyecto.

## Código de Conducta

- Sé respetuoso y profesional
- Acepta críticas constructivas
- Enfócate en lo mejor para el proyecto
- Muestra empatía hacia otros colaboradores

## Cómo Contribuir

### Reportar Bugs

1. Verifica que el bug no haya sido reportado previamente
2. Usa el template de issue para bugs
3. Incluye:
   - Descripción clara del problema
   - Pasos para reproducir
   - Comportamiento esperado vs actual
   - Versión de Emby Server
   - Logs relevantes

### Solicitar Features

1. Verifica que no exista una solicitud similar
2. Describe claramente el caso de uso
3. Explica por qué beneficiaría al proyecto

### Pull Requests

#### Antes de Empezar

1. Fork el repositorio
2. Crea una rama desde `main`:
   ```bash
   git checkout -b feature/nombre-descriptivo
   ```

#### Durante el Desarrollo

1. Sigue las convenciones de código existentes
2. Escribe código limpio y bien documentado
3. Agrega comentarios para lógica compleja
4. Mantén los commits atómicos y con mensajes descriptivos

#### Antes de Enviar

1. Prueba tu código localmente
2. Asegúrate de que el build funciona:
   ```bash
   npm run build
   ```
3. Verifica que no haya errores de lint
4. Actualiza documentación si es necesario

#### Proceso de PR

1. Envía el PR a la rama `main`
2. Incluye:
   - Descripción clara de los cambios
   - Issue relacionado (si aplica)
   - Screenshots (para cambios UI)
   - Checklist de testing
3. Espera review y feedback
4. Realiza cambios solicitados si es necesario

## Convenciones de Código

### JavaScript/React

```javascript
// Usar const/let, no var
const userName = 'admin';

// Nombres descriptivos
const getUserById = (userId) => { ... };

// Componentes con PascalCase
function UserModal({ isOpen, onClose }) { ... }

// Hooks personalizados con prefijo 'use'
function useSwipeToClose(onClose) { ... }
```

### Commits

Formato: `tipo: descripción breve`

Tipos:
- `feat`: Nueva característica
- `fix`: Corrección de bug
- `docs`: Cambios en documentación
- `style`: Formato, espacios, etc.
- `refactor`: Refactorización de código
- `test`: Agregar o modificar tests
- `chore`: Tareas de mantenimiento

Ejemplos:
```
feat: agregar validación de contraseñas
fix: corregir copia de DisplayPreferences
docs: actualizar README con nuevas variables de entorno
```

## Estructura del Proyecto

```
src/
├── app/              # Next.js App Router
│   ├── api/          # API endpoints
│   └── page.js       # Páginas
├── components/       # Componentes reutilizables
├── lib/              # Lógica de negocio
├── hooks/            # Hooks personalizados
└── styles/           # Estilos globales
```

## Testing

Actualmente el proyecto no tiene tests automatizados, pero esto es algo que buscamos mejorar. Si quieres contribuir con tests, ¡adelante!

## Documentación

- Actualiza README.md si agregas features
- Documenta funciones complejas con JSDoc
- Actualiza .env.example si agregas variables

## Preguntas

Si tienes dudas, abre un issue con la etiqueta `question`.

¡Gracias por contribuir!

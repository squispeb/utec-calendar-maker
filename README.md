# UTEC Calendar Maker

Aplicación web para convertir el PDF oficial de matrícula de UTEC en un horario más claro y fácil de revisar.

## Qué hace

La app permite:

- subir el PDF de matrícula
- extraer cursos, secciones, docentes y horarios
- comparar opciones de cursos
- detectar cruces de horario
- ver el horario semanal
- exportar las selecciones en `JSON` o `CSV`

## Stack

### Frontend
- React
- TypeScript
- Vite
- Zustand

### Backend
- Bun
- Hono

## Instalación

```bash
bun install
```

## Desarrollo

```bash
bun run dev
```

## Scripts

```bash
bun run dev
bun run dev:web
bun run dev:api
bun run build
bun run lint
bun run preview
```

## API básica

### `GET /api/health`
Devuelve el estado del servidor.

### `POST /api/parse-pdf`
Recibe un archivo PDF y devuelve:

- el markdown procesado
- la información parseada del horario

## Licencia

Este proyecto está publicado bajo la licencia `MIT`.

Puedes usar, copiar, modificar y distribuir el código, siempre que mantengas el aviso de copyright y el texto de la licencia correspondiente.

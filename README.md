# UTEC Calendar Maker

Aplicacion web para convertir el PDF oficial de matricula de UTEC en un horario mas claro y facil de revisar.

## Que hace

La app permite:

- subir el PDF de matricula
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
- MarkItDown para convertir PDF a markdown antes del parseo

## Instalacion

```bash
bun install
```

La API tambien necesita MarkItDown disponible en el entorno.

Opcion recomendada con `uvx`:

```bash
pip install uv
```

Opcion alternativa con el CLI instalado directamente:

```bash
pip install 'markitdown[pdf]'
```

## Desarrollo

```bash
bun run dev
```

Esto levanta:

- frontend Vite en `http://localhost:7654`
- API Bun/Hono en `http://localhost:8787`

El frontend usa proxy de Vite para enviar `/api/*` a la API local.

## Scripts

```bash
bun run dev
bun run dev:web
bun run dev:api
bun run build
bun run lint
bun run preview
bun run start
```

## Variables de entorno

- `PORT`: puerto del servidor Bun/Hono en produccion. Default: `8787`
- `CORS_ORIGIN`: origen permitido para `/api/*`. Default: `*`
- `MAX_UPLOAD_MB`: tamano maximo del PDF subido. Default: `20`

## API basica

### `GET /api/health`
Devuelve el estado del servidor.

### `POST /api/parse-pdf`
Recibe un archivo PDF y devuelve:

- el markdown procesado
- la informacion parseada del horario
- metadatos basicos del motor usado para la conversion

## Deploy recomendado

La opcion mas estable ahora es desplegar un solo servicio que sirva:

- el frontend compilado en `dist/`
- la API en `/api/*`
- la ejecucion local de MarkItDown dentro del mismo contenedor

Eso evita problemas de CORS, reduce latencia y simplifica la gestion del runtime de conversion.

### Docker

El repositorio ya incluye `Dockerfile` y `.dockerignore`.

Build local:

```bash
docker build -t utec-calendar-maker .
```

Run local:

```bash
docker run --rm -p 8787:8787 utec-calendar-maker
```

Luego abre `http://localhost:8787`.

### Render / Railway / Fly.io

Usa despliegue via Docker y define al menos:

- `PORT=8787` si la plataforma no lo inyecta automaticamente
- `CORS_ORIGIN=https://tu-dominio` si separas frontend y API

Si mantienes frontend y API en el mismo servicio, normalmente no necesitas cambiar `CORS_ORIGIN`.

## Arquitectura actual

- `server/index.ts`: API Hono + servidor estatico de `dist/`
- `src/components/PDFUploader.tsx`: sube el PDF a `/api/parse-pdf`
- `src/parser/pdfParser.ts`: convierte el markdown de MarkItDown en datos estructurados

## Notas de produccion

- En produccion el servidor intenta usar primero el binario `markitdown` y luego hace fallback a `uvx`
- Si no existe `dist/index.html`, `bun run start` devolvera un error hasta que ejecutes `bun run build`
- La conversion de PDFs ocurre del lado del servidor, pero es iniciada directamente por la subida del usuario

## Licencia

Este proyecto esta publicado bajo la licencia `MIT`.

Puedes usar, copiar, modificar y distribuir el codigo, siempre que mantengas el aviso de copyright y el texto de la licencia correspondiente.

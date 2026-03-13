import { randomUUID } from 'node:crypto'
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { extname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { parseScheduleMarkdown } from '../src/parser/pdfParser'

const port = Number(process.env.PORT ?? 8787)
const allowOrigin = process.env.CORS_ORIGIN
const maxUploadSizeBytes = Number(process.env.MAX_UPLOAD_MB ?? 20) * 1024 * 1024
const distDir = resolve(fileURLToPath(new URL('../dist/', import.meta.url)))
const indexPath = join(distDir, 'index.html')

const MIME_TYPES: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

const app = new Hono()

type CommandResult = {
  stdout: string
  stderr: string
  exitCode: number
}

function runCommand(command: string, args: string[]) {
  return new Promise<CommandResult>((resolvePromise, rejectPromise) => {
    const child = spawn(command, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    let stdout = ''
    let stderr = ''

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString()
    })

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString()
    })

    child.on('error', rejectPromise)
    child.on('close', (exitCode) => {
      resolvePromise({ stdout, stderr, exitCode: exitCode ?? 1 })
    })
  })
}

function isMissingCommand(error: unknown) {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT'
}

async function convertPdfToMarkdown(tempPath: string) {
  try {
    const localResult = await runCommand('markitdown', [tempPath])

    if (localResult.exitCode === 0) {
      return {
        markdown: localResult.stdout.trim(),
        runner: 'markitdown',
      }
    }

    throw new Error(localResult.stderr || localResult.stdout || 'markitdown failed')
  } catch (error) {
    if (!isMissingCommand(error)) {
      throw error
    }
  }

  try {
    const uvxResult = await runCommand('uvx', [
      '--from',
      'markitdown[pdf]',
      'markitdown',
      tempPath,
    ])

    if (uvxResult.exitCode === 0) {
      return {
        markdown: uvxResult.stdout.trim(),
        runner: 'uvx markitdown[pdf]',
      }
    }

    throw new Error(uvxResult.stderr || uvxResult.stdout || 'uvx markitdown failed')
  } catch (error) {
    if (isMissingCommand(error)) {
      throw new Error(
        'markitdown is not installed. Install the CLI or make sure uvx is available in PATH.',
      )
    }

    throw error
  }
}

function resolveStaticAsset(requestPath: string) {
  const decodedPath = decodeURIComponent(requestPath)
  const relativePath = decodedPath === '/' ? 'index.html' : decodedPath.replace(/^\/+/, '')
  const absolutePath = resolve(distDir, relativePath)
  const assetRelativePath = relative(distDir, absolutePath)

  if (assetRelativePath.startsWith('..') || assetRelativePath === '') {
    return null
  }

  return absolutePath
}

async function serveFile(filePath: string) {
  const body = await readFile(filePath)
  const contentType = MIME_TYPES[extname(filePath).toLowerCase()] ?? 'application/octet-stream'

  return new Response(body, {
    headers: {
      'Content-Type': contentType,
    },
  })
}

app.use(
  '/api/*',
  cors({
    origin: allowOrigin ?? '*',
  }),
)

app.get('/api/health', (c) => {
  return c.json({ ok: true })
})

app.post('/api/parse-pdf', async (c) => {
  const formData = await c.req.formData()
  const file = formData.get('file')

  if (!(file instanceof File)) {
    return c.json({ error: 'Missing PDF file' }, 400)
  }

  if (!file.name.toLowerCase().endsWith('.pdf')) {
    return c.json({ error: 'Only PDF files are supported' }, 400)
  }

  if (file.size > maxUploadSizeBytes) {
    return c.json(
      {
        error: `PDF exceeds the ${Math.round(maxUploadSizeBytes / 1024 / 1024)} MB upload limit`,
      },
      413,
    )
  }

  const tempPath = join(tmpdir(), `utec-schedule-${randomUUID()}.pdf`)

  try {
    await writeFile(tempPath, Buffer.from(await file.arrayBuffer()))

    const { markdown, runner } = await convertPdfToMarkdown(tempPath)
    const parsed = parseScheduleMarkdown(markdown)

    return c.json({
      markdown,
      parsed,
      meta: {
        runner,
      },
    })
  } catch (error) {
    return c.json(
      {
        error: 'Unexpected PDF processing error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500,
    )
  } finally {
    await rm(tempPath, { force: true }).catch(() => undefined)
  }
})

app.get('*', async (c) => {
  const assetPath = resolveStaticAsset(c.req.path)

  if (assetPath && existsSync(assetPath)) {
    return serveFile(assetPath)
  }

  if (existsSync(indexPath)) {
    return serveFile(indexPath)
  }

  return c.text('Frontend build not found. Run `bun run build` before starting the server.', 404)
})

serve(
  {
    fetch: app.fetch,
    port,
  },
  (info) => {
    console.log(`API listening on http://localhost:${info.port}`)
  },
)

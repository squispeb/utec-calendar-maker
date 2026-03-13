import { randomUUID } from 'node:crypto'
import { rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { parseScheduleMarkdown } from '../src/parser/pdfParser'

const app = new Hono()

app.use('/api/*', cors())

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

  const tempPath = join(tmpdir(), `utec-schedule-${randomUUID()}.pdf`)

  try {
    await Bun.write(tempPath, await file.arrayBuffer())

    const process = Bun.spawn([
      'uvx',
      '--from',
      'markitdown[pdf]',
      'markitdown',
      tempPath,
    ], {
      stdout: 'pipe',
      stderr: 'pipe',
    })

    const [stdout, stderr, exitCode] = await Promise.all([
      new Response(process.stdout).text(),
      new Response(process.stderr).text(),
      process.exited,
    ])

    if (exitCode !== 0) {
      return c.json(
        {
          error: 'Failed to convert PDF with markitdown',
          details: stderr || stdout,
        },
        500,
      )
    }

    const markdown = stdout.trim()
    const parsed = parseScheduleMarkdown(markdown)

    return c.json({
      markdown,
      parsed,
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

serve(
  {
    fetch: app.fetch,
    port: 8787,
  },
  (info) => {
    console.log(`API listening on http://localhost:${info.port}`)
  },
)

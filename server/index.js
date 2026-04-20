import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import http from 'http'
import express from 'express'

import jobfitHandler from '../api/jobfit.js'
import newsHandler from '../api/news.js'
import parseresumeHandler from '../api/parseresume.js'
import personHandler from '../api/person.js'
import profileHandler from '../api/profile.js'
import redditHandler from '../api/reddit.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: resolve(__dirname, '../.env') })

console.log(
  '[server] ANTHROPIC_API_KEY:',
  process.env.ANTHROPIC_API_KEY ? `SET ✓ (${process.env.ANTHROPIC_API_KEY.slice(0, 15)}...)` : 'MISSING ✗'
)

process.on('uncaughtException', (err) => {
  console.error('[server] Uncaught exception:', err)
})
process.on('unhandledRejection', (reason) => {
  console.error('[server] Unhandled rejection:', reason)
})

const app = express()

// ── Body parsing — both lines, before any routes ──────────────────────────────
// NOTE: router package (v2.2.0) was inspected — it has no body size limit of its
// own. The limit must be set here on the body-parser layer.
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ limit: '10mb', extended: true }))

// ── Pre-parse diagnostic — logs Content-Length before body is consumed ────────
app.use((req, _res, next) => {
  const cl = req.headers['content-length']
  if (cl) {
    console.log(
      `[server] ${req.method} ${req.path}` +
      ` — Content-Length: ${cl} bytes (${(cl / 1024).toFixed(1)} KB)`
    )
  }
  next()
})

// ── Routes ────────────────────────────────────────────────────────────────────
app.post('/api/jobfit',      jobfitHandler)
app.post('/api/news',        newsHandler)
app.post('/api/parseresume', parseresumeHandler)
app.post('/api/person',      personHandler)
app.post('/api/profile',     profileHandler)
app.get( '/api/reddit',      redditHandler)

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.API_PORT || 3001
http.createServer(app).listen(PORT, () => {
  console.log(`[server] API server running on http://localhost:${PORT}`)

  // Express 5 stores the middleware stack at app.router.stack (not app._router)
  console.log('[server] middleware stack:')
  app.router.stack.forEach((layer, i) => {
    const name = layer.handle?.name ?? layer.name ?? '(anonymous)'
    const route = layer.route?.path ?? null
    console.log(`  [${i}] ${name}${route ? `  →  ${route}` : ''}`)
  })
})

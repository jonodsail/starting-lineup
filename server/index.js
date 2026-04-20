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

// Load .env from the project root (one level above server/)
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
app.use(express.json())

app.post('/api/jobfit', jobfitHandler)
app.post('/api/news', newsHandler)
app.post('/api/parseresume', parseresumeHandler)
app.post('/api/person', personHandler)
app.post('/api/profile', profileHandler)
app.get('/api/reddit', redditHandler)

const PORT = process.env.API_PORT || 3001
http.createServer(app).listen(PORT, () => {
  console.log(`[server] API server running on http://localhost:${PORT}`)
})

import Anthropic from '@anthropic-ai/sdk'

// Fields in schema order — used to close a truncated object gracefully
const STRING_FIELDS = ['overview', 'current_role', 'background', 'why_they_matter']

function recoverPartialProfile(extracted) {
  const result = {}

  for (const field of STRING_FIELDS) {
    const keyPattern = new RegExp(`"${field}"\\s*:\\s*"`)
    const keyMatch = keyPattern.exec(extracted)
    if (!keyMatch) continue

    const valueStart = keyMatch.index + keyMatch[0].length
    let i = valueStart
    let closed = false
    while (i < extracted.length) {
      if (extracted[i] === '\\') { i += 2; continue }
      if (extracted[i] === '"') { closed = true; break }
      i++
    }

    if (closed) result[field] = extracted.slice(valueStart, i)
  }

  // Recover recent_moves array — collect every complete quoted string before truncation
  const movesKey = extracted.indexOf('"recent_moves"')
  if (movesKey !== -1) {
    const bracketPos = extracted.indexOf('[', movesKey)
    if (bracketPos !== -1) {
      const moves = []
      let i = bracketPos + 1
      outer: while (i < extracted.length) {
        const ch = extracted[i]
        if (ch === ' ' || ch === '\n' || ch === '\r' || ch === '\t' || ch === ',') { i++; continue }
        if (ch === ']') break
        if (ch === '"') {
          let j = i + 1
          while (j < extracted.length) {
            if (extracted[j] === '\\') { j += 2; continue }
            if (extracted[j] === '"') { moves.push(extracted.slice(i + 1, j)); i = j + 1; continue outer }
            j++
          }
          break // truncated string — stop
        }
        break
      }
      if (moves.length > 0) result.recent_moves = moves
    }
  }

  return Object.keys(result).length > 0 ? result : null
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' })
    }

    const { name, title, company } = req.body
    if (!name) return res.status(400).json({ error: 'name is required' })

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const systemPrompt = `You are a sports business expert. Using your training knowledge, return ONLY valid JSON for the person described — no markdown, no code fences. Use exactly these 5 fields:
{"overview":"1 sentence on who they are","current_role":"1 sentence on their current position","background":"1 sentence on career path","why_they_matter":"1 sentence on their significance to the industry","recent_moves":["short phrase 1","short phrase 2"]}`

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Generate a profile for ${name}, ${title} at ${company}.`,
        },
      ],
    })

    const textBlocks = response.content.filter((b) => b.type === 'text')
    if (!textBlocks.length) return res.status(500).json({ error: 'No text response generated' })

    const rawText = textBlocks[textBlocks.length - 1].text

    let cleaned = rawText
      .replace(/^```(?:json)?\s*/im, '')
      .replace(/```\s*$/m, '')
      .trim()
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')

    const first = cleaned.indexOf('{')
    if (first === -1) {
      console.error('[api/person] No JSON object found in response:', cleaned)
      return res.status(500).json({ error: 'No JSON object found in response' })
    }

    const last = cleaned.lastIndexOf('}')
    const extracted = last !== -1 && last > first
      ? cleaned.slice(first, last + 1)
      : cleaned.slice(first)

    let profile
    try {
      profile = JSON.parse(extracted)
    } catch (parseErr) {
      console.error('[api/person] JSON.parse failed, attempting truncation recovery:', parseErr.message)
      const recovered = recoverPartialProfile(extracted)
      if (recovered) {
        console.log(`[api/person] Recovered ${Object.keys(recovered).length} field(s):`, Object.keys(recovered))
        profile = recovered
      } else {
        console.error('[api/person] Recovery failed — no complete fields found')
        return res.status(500).json({ error: 'JSON parse failed: ' + parseErr.message })
      }
    }

    if (!Array.isArray(profile.recent_moves)) profile.recent_moves = []
    res.json(profile)
  } catch (err) {
    console.error('[api/person] Unhandled error:', err)
    return res.status(500).json({ error: err.message })
  }
}

import Anthropic from '@anthropic-ai/sdk'

// Fields in schema order — used to close a truncated object gracefully
const FIELD_ORDER = ['overview', 'headquarters', 'why_notable']

// Given a truncated JSON string, find the last fully-written string value and
// close the object with only the fields that made it in before the cutoff.
function recoverPartialProfile(extracted) {
  const result = {}

  for (const field of FIELD_ORDER) {
    const keyPattern = new RegExp(`"${field}"\\s*:\\s*"`)
    const keyMatch = keyPattern.exec(extracted)
    if (!keyMatch) continue

    // Walk forward from the opening quote of the value to find the closing quote,
    // respecting backslash escapes.
    const valueStart = keyMatch.index + keyMatch[0].length
    let i = valueStart
    let closed = false
    while (i < extracted.length) {
      if (extracted[i] === '\\') { i += 2; continue }
      if (extracted[i] === '"') { closed = true; break }
      i++
    }

    if (closed) {
      result[field] = extracted.slice(valueStart, i)
    }
  }

  return Object.keys(result).length > 0 ? result : null
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' })
    }

    const { company, sector } = req.body
    if (!company) return res.status(400).json({ error: 'company is required' })

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const systemPrompt = `You are a sports business analyst. Return ONLY valid JSON — no markdown, no code fences, no extra text. The JSON must have exactly these 3 fields:
{
  "overview": "1 sentence on what they do and their market position",
  "headquarters": "city, state/country",
  "why_notable": "1 sentence on why this company matters in sports business"
}`

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 400,
      tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Generate a profile for "${company}" in the ${sector} sector of the sports industry.`,
        },
      ],
    })

    const textBlocks = response.content.filter((b) => b.type === 'text')
    if (!textBlocks.length) {
      return res.status(500).json({ error: 'No text response generated' })
    }

    const rawText = textBlocks[textBlocks.length - 1].text

    let cleaned = rawText
      .replace(/^```(?:json)?\s*/im, '')
      .replace(/```\s*$/m, '')
      .trim()
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')

    const first = cleaned.indexOf('{')
    if (first === -1) {
      console.error('[api/profile] No JSON object found in response:', cleaned)
      return res.status(500).json({ error: 'No JSON object found in response' })
    }

    // Use last `}` if present; if missing the object was truncated
    const last = cleaned.lastIndexOf('}')
    const extracted = last !== -1 && last > first
      ? cleaned.slice(first, last + 1)
      : cleaned.slice(first)

    let profile
    try {
      profile = JSON.parse(extracted)
    } catch (parseErr) {
      console.error('[api/profile] JSON.parse failed, attempting truncation recovery:', parseErr.message)
      const recovered = recoverPartialProfile(extracted)
      if (recovered) {
        console.log(`[api/profile] Recovered ${Object.keys(recovered).length} field(s) from truncated response:`, Object.keys(recovered))
        profile = recovered
      } else {
        console.error('[api/profile] Recovery failed — no complete fields found')
        return res.status(500).json({ error: 'JSON parse failed: ' + parseErr.message })
      }
    }

    res.json(profile)
  } catch (err) {
    console.error('[api/profile] Unhandled error:', err)
    return res.status(500).json({ error: err.message })
  }
}

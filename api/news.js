import Anthropic from '@anthropic-ai/sdk'

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ articles: [], error: 'Method not allowed' })
    }

    const { company } = req.body
    if (!company) return res.status(400).json({ articles: [], error: 'company is required' })

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const systemPrompt = `You are a news lookup tool. Return only a raw JSON object with one key: articles, containing an array of at most 2 recent news items about the given company from the last 6 months. Be brief. No summaries.
Schema: {"articles":[{"headline":"string (8 words max)","source":"string","date":"string","url":"string|null"}]}
Use null for url if uncertain. Return {"articles":[]} if none found.`

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Find recent news articles about "${company}" in the sports industry.`,
        },
      ],
    })

    const textBlocks = response.content.filter((b) => b.type === 'text')
    if (!textBlocks.length) {
      return res.status(500).json({ articles: [], error: 'No text response generated' })
    }

    const rawText = textBlocks[textBlocks.length - 1].text

    let cleaned = rawText
      .replace(/^```(?:json)?\s*/im, '')
      .replace(/```\s*$/m, '')
      .trim()
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')

    const first = cleaned.indexOf('{')
    const last = cleaned.lastIndexOf('}')
    if (first === -1 || last === -1 || last < first) {
      console.error('[api/news] No JSON object found in response:', cleaned)
      return res.status(500).json({ articles: [], error: 'No JSON object found in response' })
    }

    const extracted = cleaned.slice(first, last + 1)
    let result
    try {
      result = JSON.parse(extracted)
    } catch (parseErr) {
      console.error('[api/news] JSON.parse failed:', parseErr)
      // Walk the articles array to recover complete objects from truncated response
      const arrStart = extracted.indexOf('"articles"')
      const bracketPos = arrStart !== -1 ? extracted.indexOf('[', arrStart) : -1
      const recovered = []

      if (bracketPos !== -1) {
        let depth = 0
        let objStart = -1
        for (let i = bracketPos + 1; i < extracted.length; i++) {
          const ch = extracted[i]
          if (ch === '{') {
            if (depth === 0) objStart = i
            depth++
          } else if (ch === '}') {
            depth--
            if (depth === 0 && objStart !== -1) {
              try {
                recovered.push(JSON.parse(extracted.slice(objStart, i + 1)))
              } catch { /* skip malformed object */ }
              objStart = -1
            }
          }
        }
      }

      if (recovered.length > 0) {
        result = { articles: recovered }
      } else {
        return res.status(500).json({ articles: [], error: 'JSON parse failed: ' + parseErr.message })
      }
    }

    if (!Array.isArray(result.articles)) result.articles = []

    res.json(result)
  } catch (err) {
    console.error('[api/news] Unhandled error:', err)
    return res.status(500).json({ articles: [], error: err.message })
  }
}

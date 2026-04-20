import Anthropic from '@anthropic-ai/sdk'

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' })
    }

    const { base64data, fileName, fileType } = req.body

    console.log('[api/parseresume] base64data received:', !!base64data)
    console.log('[api/parseresume] base64data length:', base64data?.length ?? 0)
    console.log('[api/parseresume] inferred file size (bytes):', Math.round((base64data?.length ?? 0) * 0.75))
    console.log('[api/parseresume] fileName:', fileName ?? 'unknown')
    console.log('[api/parseresume] fileType:', fileType ?? 'unknown')

    if (!base64data) {
      return res.status(400).json({ error: 'base64data is required' })
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const systemPrompt = `You are a resume parser. Extract the candidate's information and return ONLY valid JSON — no markdown, no code fences. Use this exact schema:
{
  "name": "Full Name",
  "current_role": "Most recent job title",
  "years_experience": 4,
  "education": "Highest degree and institution",
  "skills": ["skill1", "skill2", "skill3", "skill4", "skill5"],
  "experience": [
    { "company": "Company Name", "role": "Job Title", "duration": "2022–2024" }
  ],
  "summary": "Two sentence professional overview of the candidate."
}
Skills should be concrete and specific (e.g. 'Financial Modeling', 'Salesforce CRM', 'SQL', 'Partnership Activation'). Include up to 10 skills. Experience should list the 3 most recent roles. years_experience should be an integer.`

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'document',
            source: {
              type: 'base64',
              media_type: 'application/pdf',
              data: base64data,
            },
          },
          {
            type: 'text',
            text: 'Parse this resume and return the structured JSON.',
          },
        ],
      }],
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
    const last = cleaned.lastIndexOf('}')
    if (first === -1 || last === -1 || last < first) {
      console.error('[api/parseresume] No JSON object found:', cleaned)
      return res.status(500).json({ error: 'No JSON object found in response' })
    }

    let parsed
    try {
      parsed = JSON.parse(cleaned.slice(first, last + 1))
    } catch (parseErr) {
      console.error('[api/parseresume] JSON.parse failed:', parseErr)
      return res.status(500).json({ error: 'JSON parse failed: ' + parseErr.message })
    }

    if (!Array.isArray(parsed.skills)) parsed.skills = []
    if (!Array.isArray(parsed.experience)) parsed.experience = []

    res.json(parsed)
  } catch (err) {
    console.error('[api/parseresume] Unhandled error:', err)
    return res.status(500).json({ error: err.message })
  }
}

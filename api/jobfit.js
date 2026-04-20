import Anthropic from '@anthropic-ai/sdk'

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' })
    }

    const { title, company, sector, level, description, trackerContext, resume } = req.body
    if (!title || !company) {
      return res.status(400).json({ error: 'title and company are required' })
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    if (resume) {
      // Enhanced mode: resume present — use Sonnet for specific, personalized analysis
      const resumeSummary = [
        resume.name ? `Name: ${resume.name}` : '',
        resume.current_role ? `Current role: ${resume.current_role}` : '',
        resume.years_experience != null ? `Years of experience: ${resume.years_experience}` : '',
        resume.education ? `Education: ${resume.education}` : '',
        resume.skills?.length ? `Skills: ${resume.skills.join(', ')}` : '',
        resume.experience?.length
          ? `Experience:\n${resume.experience.map((e) => `  - ${e.role} at ${e.company} (${e.duration})`).join('\n')}`
          : '',
        resume.summary ? `Summary: ${resume.summary}` : '',
      ]
        .filter(Boolean)
        .join('\n')

      const systemPrompt = `You are a sports business career advisor performing a precise resume-to-job match. Analyze the candidate's actual background against the role and return ONLY valid JSON — no markdown, no code fences:
{
  "score": 78,
  "reasoning": "First sentence references specific resume experience. Second sentence notes key strengths for this role. Third sentence explains the main gap or concern.",
  "matched_skills": ["skill from resume that matches job", "another matched skill"],
  "gap_skills": ["skill the job needs that resume lacks", "another gap"],
  "talking_point": "One sentence a candidate could use as a cover letter hook connecting their background to this role."
}
score is 0-100. matched_skills and gap_skills are each 2-4 items. Be specific — cite actual job titles, companies, or skills from the resume.`

      const userContent = `Job: ${title} at ${company} (${sector}, ${level} level)
${description ? `Description: ${description}` : ''}

Candidate's resume:
${resumeSummary}

Candidate's research interests from their tracker:
${trackerContext || 'No companies saved yet.'}

Score this candidate's fit for the role.`

      const response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 600,
        system: systemPrompt,
        messages: [{ role: 'user', content: userContent }],
      })

      const textBlocks = response.content.filter((b) => b.type === 'text')
      if (!textBlocks.length) {
        return res.status(500).json({ error: 'No response generated' })
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
        console.error('[api/jobfit] No JSON object found (enhanced):', cleaned)
        return res.status(500).json({ error: 'No JSON in response' })
      }

      let result
      try {
        result = JSON.parse(cleaned.slice(first, last + 1))
      } catch (parseErr) {
        console.error('[api/jobfit] JSON.parse failed (enhanced):', parseErr)
        return res.status(500).json({ error: 'JSON parse failed: ' + parseErr.message })
      }

      if (typeof result.score !== 'number') result.score = 50
      if (!Array.isArray(result.matched_skills)) result.matched_skills = []
      if (!Array.isArray(result.gap_skills)) result.gap_skills = []
      if (typeof result.talking_point !== 'string') result.talking_point = ''

      return res.json(result)
    }

    // Basic mode: no resume — Haiku, tracker context only
    const systemPrompt = `You are a sports business career advisor. Score how well a candidate fits a job based on the companies and sectors they've been researching. Return ONLY valid JSON with no markdown or code fences:
{"score":75,"reasoning":"Two sentence explanation of the fit score.","skills":["skill1","skill2","skill3"]}`

    const userContent = `Job: ${title} at ${company} (${sector}, ${level} level)
${description ? `Description: ${description}` : ''}

Candidate's research interests from their company tracker:
${trackerContext || 'No companies saved yet — score based on the role and sector alone, giving a moderate baseline score.'}

Return a fit score 0-100 and 3 key skills this role requires.`

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      system: systemPrompt,
      messages: [{ role: 'user', content: userContent }],
    })

    const textBlocks = response.content.filter((b) => b.type === 'text')
    if (!textBlocks.length) {
      return res.status(500).json({ error: 'No response generated' })
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
      console.error('[api/jobfit] No JSON object found:', cleaned)
      return res.status(500).json({ error: 'No JSON in response' })
    }

    let result
    try {
      result = JSON.parse(cleaned.slice(first, last + 1))
    } catch (parseErr) {
      console.error('[api/jobfit] JSON.parse failed:', parseErr)
      return res.status(500).json({ error: 'JSON parse failed: ' + parseErr.message })
    }

    if (typeof result.score !== 'number') result.score = 50
    if (!Array.isArray(result.skills)) result.skills = []

    res.json(result)
  } catch (err) {
    console.error('[api/jobfit] Unhandled error:', err)
    return res.status(500).json({ error: err.message })
  }
}

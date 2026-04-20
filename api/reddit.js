export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { team, subreddit } = req.query
  if (!team || !subreddit) return res.status(400).json({ error: 'team and subreddit are required' })

  const q = encodeURIComponent(team)
  const url = `https://www.reddit.com/r/${subreddit}/search.json?q=${q}&restrict_sr=1&sort=top&t=month&limit=5`

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'sports-ecosystem-explorer/1.0 (vercel serverless)' },
    })
    if (!response.ok) throw new Error(`Reddit returned ${response.status}`)
    const json = await response.json()
    const threads = (json.data?.children || []).map((c) => c.data)
    res.json({ threads })
  } catch (err) {
    console.error('Reddit proxy error:', err.message)
    res.status(500).json({ error: err.message })
  }
}

import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { jobs } from '../data/jobs'
import { people } from '../data/people'
import { companies } from '../data/companies'

// ── Fit score ─────────────────────────────────────────────────────────────────
//
// Component breakdown (max 90):
//   Role keyword match  — 40 pts  (title contains keyword for a selected role)
//   Sector match        — 30 pts  (job sector is in user's targetSectors)
//   Level proximity     — 20 pts  (exact match), 10 pts (one level off), 0 (two+)
//   Tech exclusion cap  — if job title has a hard-tech term AND user didn't pick
//                         'Technology', total score is capped at 40.
//
// Only jobs scoring > 40 appear in the feed.

const ROLE_KEYWORDS = {
  Strategy:    ['strategy', 'strategic', 'business development', 'chief of staff'],
  Operations:  ['operations', 'ops', 'operational', 'logistics', 'coordinator'],
  Marketing:   ['marketing', 'brand', 'content', 'social media', 'communications', 'pr'],
  Sales:       ['sales', 'revenue', 'account executive', 'business development'],
  Analytics:   ['analytics', 'analyst', 'insights', 'research', 'intelligence'],
  Media:       ['media', 'broadcasting', 'production', 'broadcast', 'journalism'],
  Finance:     ['finance', 'financial', 'accounting', 'cfo', 'budget', 'investment'],
  Legal:       ['legal', 'counsel', 'compliance', 'contracts', 'attorney'],
  Technology:  ['technology', 'tech', 'software', 'developer', 'engineer', 'engineering',
                'devops', 'qa', 'data scientist', 'machine learning', 'it '],
  Sponsorship: ['sponsorship', 'sponsor', 'partnership', 'activation', 'partnerships'],
}

// Hard-tech terms: if present in the title and user didn't pick Technology, cap at 40
const TECH_EXCLUSION_RE = /\bengineer\b|\bengineering\b|\bdeveloper\b|\bsoftware\b|\bdevops\b|\bqa\b|data scientist|machine learning|\bit\b/i

const LEVEL_ORDER = { Entry: 0, Mid: 1, Senior: 2, Executive: 3 }

const LEVEL_MAP = {
  Student:       'Entry',
  'Entry Level': 'Entry',
  'Mid Level':   'Mid',
  Senior:        'Senior',
}

// Sectors to exclude from news — prioritise business-side companies
const NEWS_EXCLUDED_SECTORS = new Set(['teams-franchises', 'leagues'])

function calcFitScore(job, profile) {
  const titleLower    = job.title.toLowerCase()
  const targetRoles   = profile.targetRoles   || []
  const targetSectors = profile.targetSectors || []
  const wantsTech     = targetRoles.includes('Technology')

  // ── 1. Role keyword match (40 pts) ──────────────────────────────────────────
  let rolePoints = 0
  for (const role of targetRoles) {
    const keywords = ROLE_KEYWORDS[role] || [role.toLowerCase()]
    if (keywords.some(kw => titleLower.includes(kw))) {
      rolePoints = 40
      break
    }
  }

  // ── 2. Sector match (30 pts) ─────────────────────────────────────────────────
  const sectorPoints = targetSectors.includes(job.sector) ? 30 : 0

  // ── 3. Level proximity (20 / 10 / 0 pts) ────────────────────────────────────
  let levelPoints = 0
  const expectedLevel = LEVEL_MAP[profile.experienceLevel]
  if (expectedLevel && job.level) {
    const userIdx = LEVEL_ORDER[expectedLevel] ?? -1
    const jobIdx  = LEVEL_ORDER[job.level]    ?? -1
    if (userIdx >= 0 && jobIdx >= 0) {
      const dist = Math.abs(userIdx - jobIdx)
      if (dist === 0)      levelPoints = 20
      else if (dist === 1) levelPoints = 10
    }
  }

  let score = rolePoints + sectorPoints + levelPoints

  // ── 4. Tech exclusion cap ────────────────────────────────────────────────────
  if (!wantsTech && TECH_EXCLUSION_RE.test(job.title)) {
    score = Math.min(score, 40)
  }

  return score
}

// ── Tracker helpers ───────────────────────────────────────────────────────────

function readTracker() {
  try { return JSON.parse(localStorage.getItem('sports_ecosystem_jobs_tracker') || '[]') }
  catch { return [] }
}

function writeTracker(jobs) {
  localStorage.setItem('sports_ecosystem_jobs_tracker', JSON.stringify(jobs))
}

// ── Misc helpers ──────────────────────────────────────────────────────────────

function daysAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return '1d ago'
  return `${diff}d ago`
}

function scoreColor(score) {
  if (score >= 70) return 'text-accent'
  if (score >= 50) return 'text-yellow-400'
  return 'text-muted'
}

function formatVisit(date) {
  return date.toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// ── Main component ────────────────────────────────────────────────────────────

export default function Dashboard() {
  const navigate = useNavigate()
  const profile = JSON.parse(localStorage.getItem('sl_user_profile') || '{}')

  // ── Pipeline tracker ──────────────────────────────────────────────────────
  const [tracker, setTracker] = useState(readTracker)

  const savedIds = new Set(tracker.map(j => j.id))

  const saveJob = (job) => {
    if (savedIds.has(job.id)) return
    const entry = {
      id:      job.id,
      title:   job.title,
      company: job.company,
      sector:  job.sector,
      location: job.location,
      type:    job.type,
      level:   job.level,
      url:     job.url,
      status:  'saved',
      savedAt: new Date().toISOString(),
    }
    const updated = [...tracker, entry]
    setTracker(updated)
    writeTracker(updated)
  }

  const unsaveJob = (jobId) => {
    const updated = tracker.filter(j => j.id !== jobId)
    setTracker(updated)
    writeTracker(updated)
  }

  const pipeline = {
    saved:        tracker.filter(j => j.status === 'saved').length,
    applied:      tracker.filter(j => j.status === 'applied').length,
    interviewing: tracker.filter(j => j.status === 'interviewing').length,
    offered:      tracker.filter(j => j.status === 'offered').length,
  }

  // ── News ──────────────────────────────────────────────────────────────────
  // Each item: { companyName, headline, source, date, url }
  const [newsItems, setNewsItems]     = useState([])
  const [newsLoading, setNewsLoading] = useState(true)

  useEffect(() => {
    const fetchNews = async () => {
      const sectors = profile.targetSectors || []

      // Pick up to 2 business-side companies (exclude teams & leagues)
      const candidates = companies.filter(
        c => !NEWS_EXCLUDED_SECTORS.has(c.sector) &&
             (sectors.length === 0 || sectors.includes(c.sector))
      )

      // Fall back to any non-excluded company if none match target sectors
      const pool = candidates.length > 0
        ? candidates
        : companies.filter(c => !NEWS_EXCLUDED_SECTORS.has(c.sector))

      const picks = pool.slice(0, 2)

      const results = await Promise.all(
        picks.map(async (co) => {
          try {
            const res = await fetch('/api/news', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ company: co.name }),
            })
            if (!res.ok) return []
            const data = await res.json()
            return (data.articles || []).slice(0, 2).map(a => ({ ...a, companyName: co.name }))
          } catch { return [] }
        })
      )

      setNewsItems(results.flat())
      setNewsLoading(false)
    }
    fetchNews()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Last visit ────────────────────────────────────────────────────────────
  const [lastVisit, setLastVisit] = useState(null)

  useEffect(() => {
    const prev = localStorage.getItem('sl_last_visit')
    if (prev) setLastVisit(new Date(prev))
    localStorage.setItem('sl_last_visit', new Date().toISOString())
  }, [])

  // ── Derived data ──────────────────────────────────────────────────────────
  const sectors = profile.targetSectors || []

  const scoredJobs = jobs
    .map(job => ({ ...job, fitScore: calcFitScore(job, profile) }))
    .filter(job => job.fitScore > 40 && !savedIds.has(job.id))
    .sort((a, b) => b.fitScore - a.fitScore)

  const topJobs = scoredJobs.slice(0, 3)
  const topJob  = scoredJobs[0]

  const relevantPeople = people
    .filter(p => sectors.length === 0 || sectors.includes(p.sector))
    .slice(0, 3)

  const featuredCompanies = companies
    .filter(c => sectors.length === 0 || sectors.includes(c.sector))
    .slice(0, 6)

  const featuredAlumni = relevantPeople[0] || people[0]
  const firstName = profile.name?.split(' ')[0] || 'Recruit'

  return (
    <div className="field-bg min-h-screen">

      {/* ── Header ── */}
      <header className="border-b border-border px-8 py-4 flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur-sm z-10">
        <span className="font-display text-2xl tracking-widest text-accent">STARTING LINEUP</span>
        <nav className="flex items-center gap-6">
          <Link to="/jobs" className="text-muted text-sm hover:text-subtle transition-colors">
            My Pipeline
          </Link>
          <span className="text-muted text-sm">{profile.name}</span>
          <button
            type="button"
            onClick={() => { localStorage.removeItem('sl_user_profile'); navigate('/onboarding') }}
            className="text-xs text-muted hover:text-subtle transition-colors border border-border px-3 py-1.5 rounded cursor-pointer"
          >
            Sign out
          </button>
        </nav>
      </header>

      <div className="max-w-7xl mx-auto px-8 py-10">

        {/* ── Welcome ── */}
        <div className="mb-10">
          <h1 className="font-display text-6xl tracking-widest text-secondary leading-none">
            WELCOME BACK, {firstName.toUpperCase()}.
          </h1>
          <p className="text-muted text-sm mt-2">
            {lastVisit
              ? `Last visit: ${formatVisit(lastVisit)}`
              : 'Your sports career command center.'}
          </p>
        </div>

        {/* ── Two-column layout ── */}
        <div className="flex gap-6 items-start">

          {/* Left column */}
          <div className="flex-1 min-w-0 space-y-10">

            {/* NEW JOBS FOR YOU */}
            <section>
              <h2 className="font-display text-xl tracking-widest text-accent mb-4">
                NEW JOBS FOR YOU
              </h2>

              {topJobs.length === 0 && (
                <div className="bg-surface border border-border rounded-lg p-8 text-center">
                  <p className="text-muted text-sm">
                    No strong matches yet. Complete your profile with target roles and sectors to see personalized picks.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate('/onboarding')}
                    className="mt-4 text-xs text-accent/70 hover:text-accent transition-colors cursor-pointer"
                  >
                    Update profile →
                  </button>
                </div>
              )}

              <div className="space-y-3">
                {topJobs.map(job => {
                  const isSaved = savedIds.has(job.id)
                  return (
                    <div
                      key={job.id}
                      className="bg-surface border border-border rounded-lg p-5 hover:border-subtle/40 transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-1 min-w-0">
                          {/* Title row */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <a
                                href={job.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-secondary text-sm font-medium leading-snug hover:text-accent transition-colors"
                              >
                                {job.title}
                              </a>
                              <p className="text-muted text-xs mt-0.5">
                                {job.company} · {job.location}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <span className={`font-display text-3xl tracking-wider leading-none ${scoreColor(job.fitScore)}`}>
                                {job.fitScore}
                              </span>
                              <p className="text-muted text-xs tracking-widest">FIT</p>
                            </div>
                          </div>

                          {/* Tag row */}
                          <div className="flex items-center gap-2 mt-3 flex-wrap">
                            {job.isReal && (
                              <span className="text-xs bg-accent/15 border border-accent/40 text-accent rounded px-2 py-0.5 font-medium">
                                Real Opening
                              </span>
                            )}
                            <span className="text-xs border border-border text-muted rounded px-2 py-0.5">
                              {job.type}
                            </span>
                            <span className="text-xs border border-border text-muted rounded px-2 py-0.5">
                              {job.level}
                            </span>
                            <span className="text-muted text-xs">{daysAgo(job.posted)}</span>

                            {/* Save button */}
                            <button
                              type="button"
                              onClick={() => isSaved ? unsaveJob(job.id) : saveJob(job)}
                              className={`ml-auto text-xs px-3 py-1 rounded border transition-colors cursor-pointer ${
                                isSaved
                                  ? 'border-accent/40 text-accent bg-accent/10 hover:bg-transparent'
                                  : 'border-border text-muted hover:border-accent hover:text-accent'
                              }`}
                            >
                              {isSaved ? '✓ Saved' : '+ Save'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>

            {/* IN THE NEWS */}
            <section>
              <h2 className="font-display text-xl tracking-widest text-accent mb-4">IN THE NEWS</h2>
              {newsLoading ? (
                <div className="bg-surface border border-border rounded-lg p-8 flex items-center gap-3">
                  <div className="flex gap-1.5">
                    {[0, 1, 2].map(i => (
                      <span
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"
                        style={{ animationDelay: `${i * 150}ms` }}
                      />
                    ))}
                  </div>
                  <span className="text-muted text-sm">Fetching latest news…</span>
                </div>
              ) : newsItems.length === 0 ? (
                <div className="bg-surface border border-border rounded-lg p-6">
                  <p className="text-muted text-sm">No recent articles found.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {newsItems.map((article, i) => (
                    <div key={i} className="bg-surface border border-border rounded-lg p-5">
                      <p className="text-muted text-xs tracking-wider uppercase mb-1">
                        {article.companyName}
                      </p>
                      <p className="text-subtle text-sm font-medium leading-snug">
                        {article.headline}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-muted text-xs">{article.source}</span>
                        {article.date && (
                          <>
                            <span className="text-border text-xs">·</span>
                            <span className="text-muted text-xs">{article.date}</span>
                          </>
                        )}
                        {article.url && (
                          <a
                            href={article.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-accent/70 hover:text-accent ml-auto transition-colors"
                          >
                            Read →
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* PEOPLE TO KNOW */}
            <section>
              <h2 className="font-display text-xl tracking-widest text-accent mb-4">
                PEOPLE TO KNOW
              </h2>
              <div className="space-y-3">
                {relevantPeople.map(person => (
                  <div key={person.id} className="bg-surface border border-border rounded-lg p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-secondary text-sm font-medium">{person.name}</p>
                        <p className="text-muted text-xs mt-0.5">
                          {person.title} · {person.company}
                        </p>
                      </div>
                      {person.linkedin && (
                        <a
                          href={person.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-muted hover:text-accent transition-colors shrink-0"
                        >
                          LinkedIn →
                        </a>
                      )}
                    </div>
                    <p className="text-muted text-xs mt-3 leading-relaxed line-clamp-2">
                      {person.bio}
                    </p>
                  </div>
                ))}
              </div>
            </section>

          </div>

          {/* Right column */}
          <div className="w-80 shrink-0 space-y-5">

            {/* YOUR PIPELINE — stat cards link to /jobs?status=... */}
            <section className="bg-surface border border-border rounded-lg p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-xl tracking-widest text-accent">YOUR PIPELINE</h2>
                <Link to="/jobs" className="text-xs text-muted hover:text-accent transition-colors">
                  View all →
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'SAVED',      value: pipeline.saved,        status: 'saved',        color: 'text-subtle' },
                  { label: 'APPLIED',    value: pipeline.applied,      status: 'applied',      color: 'text-yellow-400' },
                  { label: 'INTERVIEWS', value: pipeline.interviewing,  status: 'interviewing', color: 'text-blue-400' },
                  { label: 'OFFERS',     value: pipeline.offered,      status: 'offered',      color: 'text-accent' },
                ].map(stat => (
                  <Link
                    key={stat.label}
                    to={`/jobs?status=${stat.status}`}
                    className="border border-border rounded p-3 text-center hover:border-subtle/40 transition-colors block"
                  >
                    <p className={`font-display text-4xl tracking-wider leading-none ${stat.color}`}>
                      {stat.value}
                    </p>
                    <p className="text-muted text-xs tracking-widest mt-1.5">{stat.label}</p>
                  </Link>
                ))}
              </div>
              {tracker.length === 0 && (
                <p className="text-muted text-xs mt-4 text-center">
                  Save jobs to start tracking.
                </p>
              )}
            </section>

            {/* RESUME */}
            <section className="bg-surface border border-border rounded-lg p-5">
              <h2 className="font-display text-xl tracking-widest text-accent mb-3">RESUME</h2>
              {profile.resume ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-accent text-sm">✓</span>
                    <span className="text-subtle text-sm">Parsed &amp; ready</span>
                  </div>
                  {profile.resume.current_role && (
                    <p className="text-muted text-xs">{profile.resume.current_role}</p>
                  )}
                  {profile.resume.skills?.length > 0 && (
                    <div className="flex gap-1.5 flex-wrap">
                      {profile.resume.skills.slice(0, 5).map(skill => (
                        <span
                          key={skill}
                          className="text-xs border border-border text-muted rounded px-2 py-0.5"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <p className="text-muted text-xs">No resume uploaded.</p>
                  <button
                    type="button"
                    onClick={() => navigate('/onboarding')}
                    className="mt-3 text-xs text-accent/70 hover:text-accent transition-colors cursor-pointer"
                  >
                    Add resume →
                  </button>
                </div>
              )}
            </section>

            {/* TOP MATCH */}
            {topJob && (
              <section className="bg-surface border border-border rounded-lg p-5">
                <h2 className="font-display text-xl tracking-widest text-accent mb-3">TOP MATCH</h2>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="min-w-0">
                    <p className="text-secondary text-sm font-medium leading-snug">{topJob.title}</p>
                    <p className="text-muted text-xs mt-0.5">{topJob.company}</p>
                  </div>
                  <span className={`font-display text-4xl tracking-wider leading-none shrink-0 ${scoreColor(topJob.fitScore)}`}>
                    {topJob.fitScore}
                  </span>
                </div>
                <div className="flex gap-2 flex-wrap mb-4">
                  <span className="text-xs border border-border text-muted rounded px-2 py-0.5">
                    {topJob.level}
                  </span>
                  <span className="text-xs border border-border text-muted rounded px-2 py-0.5">
                    {topJob.location}
                  </span>
                </div>
                {topJob.url && (
                  <a
                    href={topJob.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-center py-2 rounded border border-accent/50 text-accent text-xs tracking-wider hover:bg-accent/10 transition-colors"
                  >
                    VIEW JOB →
                  </a>
                )}
              </section>
            )}

            {/* FEATURED LEADER */}
            {featuredAlumni && (
              <section className="bg-surface border border-border rounded-lg p-5">
                <h2 className="font-display text-xl tracking-widest text-accent mb-3">
                  FEATURED LEADER
                </h2>
                <p className="text-secondary text-sm font-medium">{featuredAlumni.name}</p>
                <p className="text-muted text-xs mt-0.5 mb-3">
                  {featuredAlumni.title} · {featuredAlumni.company}
                </p>
                <p className="text-muted text-xs leading-relaxed line-clamp-3">
                  {featuredAlumni.bio}
                </p>
                {featuredAlumni.linkedin && (
                  <a
                    href={featuredAlumni.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 block text-xs text-muted hover:text-accent transition-colors"
                  >
                    Connect on LinkedIn →
                  </a>
                )}
              </section>
            )}

          </div>
        </div>

        {/* ── Explore Companies ── */}
        <section className="mt-14">
          <h2 className="font-display text-xl tracking-widest text-accent mb-5">EXPLORE COMPANIES</h2>
          <div className="grid grid-cols-3 gap-4">
            {featuredCompanies.map(company => (
              <div
                key={company.id}
                className="bg-surface border border-border rounded-lg p-5 hover:border-subtle/40 transition-colors"
              >
                <p className="text-secondary text-sm font-medium">{company.name}</p>
                <p className="text-muted text-xs mt-0.5 mb-3">{company.type}</p>
                <p className="text-muted text-xs leading-relaxed">{company.tagline}</p>
                <div className="mt-4 pt-3 border-t border-border">
                  <span className="text-xs text-muted tracking-wider uppercase">
                    {company.sector.replace(/-/g, ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="mt-14 pt-6 border-t border-border flex items-center justify-between">
          <span className="font-display text-sm tracking-widest text-muted">STARTING LINEUP</span>
          <span className="text-muted text-xs">
            Last updated:{' '}
            {new Date().toLocaleDateString('en-US', {
              month: 'short', day: 'numeric', year: 'numeric',
              hour: '2-digit', minute: '2-digit',
            })}
          </span>
        </footer>

      </div>
    </div>
  )
}

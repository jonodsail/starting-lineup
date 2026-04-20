import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { jobs as allJobs } from '../data/jobs'

// ── Constants ─────────────────────────────────────────────────────────────────

const PIPELINE_STATUSES = ['saved', 'applied', 'interviewing', 'offered', 'passed']

const STATUS_META = {
  saved:        { label: 'Saved',        color: 'text-subtle',     border: 'border-subtle/40' },
  applied:      { label: 'Applied',      color: 'text-yellow-400', border: 'border-yellow-400/40' },
  interviewing: { label: 'Interviewing', color: 'text-blue-400',   border: 'border-blue-400/40' },
  offered:      { label: 'Offered',      color: 'text-accent',     border: 'border-accent/40' },
  passed:       { label: 'Pass',         color: 'text-muted',      border: 'border-border' },
}

const realJobs = allJobs.filter(j => j.isReal)

// ── Tracker helpers ───────────────────────────────────────────────────────────

function readTracker() {
  try { return JSON.parse(localStorage.getItem('sports_ecosystem_jobs_tracker') || '[]') }
  catch { return [] }
}

function writeTracker(jobs) {
  localStorage.setItem('sports_ecosystem_jobs_tracker', JSON.stringify(jobs))
}

// ── Sub-views ─────────────────────────────────────────────────────────────────

/**
 * Real Jobs browsing view — shows all 100 scraped Teamwork Online listings.
 * Users can save any of them to their pipeline.
 */
function RealJobsView({ tracker, onSave, onUnsave }) {
  const [search, setSearch] = useState('')
  const savedIds = new Set(tracker.map(j => j.id))

  const filtered = search.trim()
    ? realJobs.filter(j =>
        j.title.toLowerCase().includes(search.toLowerCase()) ||
        j.company.toLowerCase().includes(search.toLowerCase()) ||
        j.location.toLowerCase().includes(search.toLowerCase())
      )
    : realJobs

  return (
    <div>
      {/* Search bar */}
      <div className="mb-5">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by title, company, or location…"
          className="w-full bg-surface border border-border text-subtle rounded px-4 py-3 text-sm placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
        />
      </div>

      <p className="text-muted text-xs mb-4">
        {filtered.length} listing{filtered.length !== 1 ? 's' : ''} from Teamwork Online
        {search && ` matching "${search}"`}
      </p>

      {filtered.length === 0 ? (
        <div className="bg-surface border border-border rounded-lg p-10 text-center">
          <p className="text-muted text-sm">No listings match your search.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(job => {
            const isSaved = savedIds.has(job.id)
            return (
              <div
                key={job.id}
                className="bg-surface border border-border rounded-lg p-5 hover:border-subtle/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs bg-accent/15 border border-accent/40 text-accent rounded px-2 py-0.5 font-medium">
                        Real Opening
                      </span>
                    </div>
                    <a
                      href={job.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-secondary text-sm font-medium leading-snug hover:text-accent transition-colors"
                    >
                      {job.title}
                    </a>
                    <p className="text-muted text-xs mt-0.5">
                      {job.company}{job.location ? ` · ${job.location}` : ''}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => isSaved ? onUnsave(job.id) : onSave(job)}
                    className={`shrink-0 text-xs px-3 py-1.5 rounded border transition-colors cursor-pointer whitespace-nowrap ${
                      isSaved
                        ? 'border-accent/40 text-accent bg-accent/10 hover:bg-transparent'
                        : 'border-border text-muted hover:border-accent hover:text-accent'
                    }`}
                  >
                    {isSaved ? '✓ Saved' : '+ Save'}
                  </button>
                </div>

                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <span className="text-xs border border-border text-muted rounded px-2 py-0.5">{job.type}</span>
                  <span className="text-xs border border-border text-muted rounded px-2 py-0.5">{job.level}</span>
                  {job.location && (
                    <span className="text-muted text-xs">{job.location}</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/**
 * Pipeline management view — tracked jobs with status dropdowns.
 */
function PipelineView({ tracker, filter, onUpdateStatus }) {
  const counts = {
    all:          tracker.length,
    saved:        tracker.filter(j => j.status === 'saved').length,
    applied:      tracker.filter(j => j.status === 'applied').length,
    interviewing: tracker.filter(j => j.status === 'interviewing').length,
    offered:      tracker.filter(j => j.status === 'offered').length,
    passed:       tracker.filter(j => j.status === 'passed').length,
  }

  const filtered = filter === 'all' ? tracker : tracker.filter(j => j.status === filter)

  return (
    <div>
      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="bg-surface border border-border rounded-lg p-12 text-center">
          {tracker.length === 0 ? (
            <>
              <p className="text-muted text-sm">No jobs saved yet.</p>
              <p className="text-muted text-xs mt-2">
                Browse <span className="text-accent">Real Jobs</span> above or save jobs from the Dashboard.
              </p>
            </>
          ) : (
            <p className="text-muted text-sm">
              No jobs with status &ldquo;{STATUS_META[filter]?.label ?? filter}&rdquo;.
            </p>
          )}
        </div>
      )}

      {filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map(job => {
            const meta = STATUS_META[job.status] || STATUS_META.saved
            return (
              <div
                key={job.id}
                className="bg-surface border border-border rounded-lg p-5 hover:border-subtle/30 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Top row */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        {job.isReal && (
                          <span className="inline-block text-xs bg-accent/15 border border-accent/40 text-accent rounded px-2 py-0.5 font-medium mb-1">
                            Real Opening
                          </span>
                        )}
                        <p className="text-secondary text-sm font-medium leading-snug">{job.title}</p>
                        <p className="text-muted text-xs mt-0.5">
                          {job.company}{job.location ? ` · ${job.location}` : ''}
                        </p>
                      </div>

                      {/* Status selector */}
                      <div className={`relative shrink-0 border rounded px-3 py-1.5 ${meta.border}`}>
                        <select
                          value={job.status}
                          onChange={e => onUpdateStatus(job.id, e.target.value)}
                          className={`appearance-none bg-transparent text-xs cursor-pointer focus:outline-none pr-4 ${meta.color}`}
                        >
                          {PIPELINE_STATUSES.map(s => (
                            <option key={s} value={s} className="bg-surface text-subtle">
                              {STATUS_META[s].label}
                            </option>
                          ))}
                        </select>
                        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted text-xs">▾</span>
                      </div>
                    </div>

                    {/* Bottom row */}
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      {job.type && (
                        <span className="text-xs border border-border text-muted rounded px-2 py-0.5">{job.type}</span>
                      )}
                      {job.level && (
                        <span className="text-xs border border-border text-muted rounded px-2 py-0.5">{job.level}</span>
                      )}
                      {job.savedAt && (
                        <span className="text-muted text-xs">
                          Saved {new Date(job.savedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                      <div className="ml-auto flex items-center gap-4">
                        {job.url && (
                          <a
                            href={job.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-muted hover:text-accent transition-colors"
                          >
                            View →
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => onUpdateStatus(job.id, 'remove')}
                          className="text-xs text-muted hover:text-red-400 transition-colors cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function Jobs() {
  const [searchParams, setSearchParams] = useSearchParams()

  // 'real' is a special tab; pipeline status tabs are the rest
  const initialTab = searchParams.get('status') || 'all'
  const [activeTab, setActiveTab] = useState(initialTab)

  const [tracker, setTracker] = useState(readTracker)

  const setTab = (key) => {
    setActiveTab(key)
    key === 'all' ? setSearchParams({}) : setSearchParams({ status: key })
  }

  // Pipeline mutations
  const saveJob = (job) => {
    const savedIds = new Set(tracker.map(j => j.id))
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
      isReal:  !!job.isReal,
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

  const updateStatus = (jobId, newStatus) => {
    const updated = newStatus === 'remove'
      ? tracker.filter(j => j.id !== jobId)
      : tracker.map(j => j.id === jobId ? { ...j, status: newStatus } : j)
    setTracker(updated)
    writeTracker(updated)
  }

  const counts = {
    all:          tracker.length,
    saved:        tracker.filter(j => j.status === 'saved').length,
    applied:      tracker.filter(j => j.status === 'applied').length,
    interviewing: tracker.filter(j => j.status === 'interviewing').length,
    offered:      tracker.filter(j => j.status === 'offered').length,
    passed:       tracker.filter(j => j.status === 'passed').length,
  }

  const isRealTab   = activeTab === 'real'
  const isPipeline  = !isRealTab

  const tabs = [
    { key: 'real', label: 'Real Jobs', count: realJobs.length, accent: true },
    { key: 'all',          label: 'Pipeline',      count: counts.all },
    { key: 'saved',        label: 'Saved',         count: counts.saved },
    { key: 'applied',      label: 'Applied',       count: counts.applied },
    { key: 'interviewing', label: 'Interviewing',  count: counts.interviewing },
    { key: 'offered',      label: 'Offers',        count: counts.offered },
    { key: 'passed',       label: 'Passed',        count: counts.passed },
  ]

  return (
    <div className="field-bg min-h-screen">

      {/* Header */}
      <header className="border-b border-border px-8 py-4 flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur-sm z-10">
        <span className="font-display text-2xl tracking-widest text-accent">STARTING LINEUP</span>
        <nav className="flex items-center gap-6">
          <Link to="/dashboard" className="text-muted text-sm hover:text-subtle transition-colors">
            Dashboard
          </Link>
          <Link to="/jobs" className="text-subtle text-sm font-medium">
            My Pipeline
          </Link>
        </nav>
      </header>

      <div className="max-w-4xl mx-auto px-8 py-10">

        {/* Heading */}
        <div className="mb-8">
          <h1 className="font-display text-5xl tracking-widest text-secondary leading-none">
            {isRealTab ? 'REAL JOBS' : 'MY PIPELINE'}
          </h1>
          <p className="text-muted text-sm mt-2">
            {isRealTab
              ? `${realJobs.length} live listings from Teamwork Online`
              : `${tracker.length} job${tracker.length !== 1 ? 's' : ''} tracked`}
          </p>
        </div>

        {/* Tab bar */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {tabs.map(({ key, label, count, accent }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`px-4 py-1.5 rounded text-sm border transition-colors select-none cursor-pointer ${
                activeTab === key
                  ? accent
                    ? 'border-accent text-accent bg-accent/15 font-medium'
                    : 'border-accent text-accent bg-accent/10'
                  : accent
                    ? 'border-accent/30 text-accent/70 hover:border-accent hover:text-accent'
                    : 'border-border text-muted hover:border-subtle hover:text-subtle'
              }`}
            >
              {label}
              {count != null && count > 0 && (
                <span className={`ml-1.5 text-xs ${
                  activeTab === key ? (accent ? 'text-accent/80' : 'text-accent/70') : 'text-border'
                }`}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* View content */}
        {isRealTab ? (
          <RealJobsView tracker={tracker} onSave={saveJob} onUnsave={unsaveJob} />
        ) : (
          <PipelineView
            tracker={tracker}
            filter={activeTab}
            onUpdateStatus={updateStatus}
          />
        )}
      </div>
    </div>
  )
}

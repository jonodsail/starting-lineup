import { useEffect, useState } from 'react'
import { Check, ExternalLink, Inbox, Users, X } from 'lucide-react'
import { EmptyState, PageHeader, Stat } from '../components/ui'
import {
  approveAlumniSubmission,
  loadOfficerQueue,
  rejectAlumniSubmission,
  setOpportunityStatus,
} from '../lib/db'
import { isSupabaseConfigured } from '../lib/supabase'

function formatSubmitted(value) {
  if (!value) return ''
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return ''
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function Admin() {
  const [queue, setQueue] = useState({ alumni: [], opportunities: [], publishedCount: 0 })
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState('')

  const [refreshToken, setRefreshToken] = useState(0)

  useEffect(() => {
    if (!isSupabaseConfigured) return undefined
    let active = true
    loadOfficerQueue()
      .then(next => { if (active) { setQueue(next); setError('') } })
      .catch(() => { if (active) setError('Confirm your officer access and try again.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [refreshToken])

  const act = async (id, action) => {
    setBusyId(id)
    try {
      await action()
      setRefreshToken(token => token + 1)
    } catch {
      setError('That action could not be completed. Try again in a moment.')
    } finally {
      setBusyId('')
    }
  }

  const pendingCount = queue.alumni.length + queue.opportunities.length

  return <div className="page-wrap">
    <PageHeader eyebrow="Club officers only" title="Officer desk" description="Review member submissions, protect the quality bar, and publish only verified records." />

    {!isSupabaseConfigured && <div className="mb-5 rounded-xl border border-line bg-cream px-4 py-3 text-sm text-ink-muted">Connect the project environment values to use it.</div>}
    {error && <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-crimson">{error}</div>}

    <div className="grid gap-4 sm:grid-cols-3">
      <Stat value={loading ? '—' : pendingCount} label="Awaiting review" note="Member submissions" />
      <Stat value={loading ? '—' : queue.publishedCount} label="Published roles" note="Live on the board" />
      <Stat value={loading ? '—' : queue.alumni.length} label="Alumni pending" note="Verify before publishing" />
    </div>

    <section className="mt-10">
      <div className="flex items-center gap-2"><Users size={18} className="text-crimson" /><h2 className="font-display text-2xl font-bold text-night">Alumni submissions</h2></div>
      <p className="mt-1 text-sm text-ink-muted">Approving publishes the record to the member directory and marks it verified.</p>
      {loading && <div className="panel mt-4 px-6 py-10 text-center text-sm text-ink-muted">Loading the queue…</div>}
      {!loading && queue.alumni.length === 0 && <div className="mt-4"><EmptyState title="No alumni awaiting review">Member submissions from the alumni page arrive here.</EmptyState></div>}
      {!loading && queue.alumni.length > 0 && <div className="mt-4 grid gap-3 lg:grid-cols-2">{queue.alumni.map(person => <article key={person.id} className="panel p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0"><h3 className="font-bold text-night">{person.name}</h3><p className="mt-1 text-sm text-ink-muted">{person.title}</p><p className="mt-2 text-sm font-semibold text-ink">{person.company}{person.classYear && ` · HBS ’${person.classYear.slice(-2)}`}</p></div>
          <span className="tag shrink-0">{formatSubmitted(person.submittedAt)}</span>
        </div>
        {person.notes && <p className="mt-3 rounded-lg bg-canvas px-3 py-2 text-xs leading-5 text-ink-muted">{person.notes}</p>}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
          <a href={person.linkedinUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold text-[#0a66c2] hover:underline">Verify on LinkedIn <ExternalLink size={14} /></a>
          <div className="flex gap-2">
            <button disabled={busyId === person.id} onClick={() => act(person.id, () => rejectAlumniSubmission(person.id))} className="inline-flex items-center gap-1 rounded-lg border border-line px-3 py-2 text-sm font-semibold text-ink-muted hover:border-crimson hover:text-crimson disabled:opacity-50"><X size={15} />Reject</button>
            <button disabled={busyId === person.id} onClick={() => act(person.id, () => approveAlumniSubmission(person))} className="inline-flex items-center gap-1 rounded-lg bg-night px-3 py-2 text-sm font-semibold text-white hover:bg-crimson disabled:opacity-50"><Check size={15} />{busyId === person.id ? 'Working…' : 'Approve'}</button>
          </div>
        </div>
      </article>)}</div>}
    </section>

    <section className="mt-12">
      <div className="flex items-center gap-2"><Inbox size={18} className="text-crimson" /><h2 className="font-display text-2xl font-bold text-night">Role submissions</h2></div>
      <p className="mt-1 text-sm text-ink-muted">Confirm the posting is live, role-specific, and MBA-relevant before approving.</p>
      {loading && <div className="panel mt-4 px-6 py-10 text-center text-sm text-ink-muted">Loading the queue…</div>}
      {!loading && queue.opportunities.length === 0 && <div className="mt-4"><EmptyState title="No roles awaiting review">Member submissions from the opportunity board arrive here as drafts.</EmptyState></div>}
      {!loading && queue.opportunities.length > 0 && <div className="mt-4 grid gap-3 lg:grid-cols-2">{queue.opportunities.map(role => <article key={role.id} className="panel p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-crimson">{role.company}</p>
        <h3 className="mt-2 font-bold text-night">{role.title}</h3>
        <div className="mt-3 flex flex-wrap gap-2"><span className="tag">{role.type}</span><span className="tag">{role.function}</span><span className="tag">{role.sector}</span></div>
        <p className="mt-3 text-xs leading-5 text-ink"><span className="text-ink-muted">Member’s case:</span> {role.mbaSignal}</p>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
          <a href={role.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold text-night hover:text-crimson">Open posting <ExternalLink size={14} /></a>
          <div className="flex gap-2">
            <button disabled={busyId === role.id} onClick={() => act(role.id, () => setOpportunityStatus(role.id, 'rejected'))} className="inline-flex items-center gap-1 rounded-lg border border-line px-3 py-2 text-sm font-semibold text-ink-muted hover:border-crimson hover:text-crimson disabled:opacity-50"><X size={15} />Reject</button>
            <button disabled={busyId === role.id} onClick={() => act(role.id, () => setOpportunityStatus(role.id, 'approved'))} className="inline-flex items-center gap-1 rounded-lg bg-night px-3 py-2 text-sm font-semibold text-white hover:bg-crimson disabled:opacity-50"><Check size={15} />{busyId === role.id ? 'Working…' : 'Publish'}</button>
          </div>
        </div>
      </article>)}</div>}
    </section>
  </div>
}

import { useEffect, useState } from 'react'
import { Check, ExternalLink, FileText, Inbox, KeyRound, Plus, Trash2, Users, X } from 'lucide-react'
import { EmptyState, ErrorNotice, PageHeader, Stat } from '../components/ui'
import {
  addAllowedDomain,
  approveAlumniSubmission,
  loadAllowedDomains,
  loadMemberRoster,
  loadOfficerQueue,
  resumeDownloadUrl,
  rejectAlumniSubmission,
  removeAllowedDomain,
  setOpportunityStatus,
} from '../lib/db'
import { isSupabaseConfigured } from '../lib/supabase'

function formatSubmitted(value) {
  if (!value) return ''
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return ''
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// Membership is a list officers maintain, not a constant in the source. The
// September class rollover is an entry here rather than a code change, and an
// officer whose own class has graduated can keep their access.
function MemberAccess() {
  const [domains, setDomains] = useState([])
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState('')
  const [token, setToken] = useState(0)

  useEffect(() => {
    if (!isSupabaseConfigured) return undefined
    let active = true
    loadAllowedDomains()
      .then(rows => { if (active) { setDomains(rows || []); setError('') } })
      .catch(() => { if (active) setError('The domain list could not load.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [token])

  const add = async (event) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const domain = String(form.get('domain') || '').trim().toLowerCase().replace(/^@/, '')
    if (!domain) return
    setBusy(domain)
    try {
      await addAllowedDomain(domain, String(form.get('note') || ''))
      event.currentTarget.reset()
      setToken(value => value + 1)
    } catch {
      setError('That domain could not be added. It may already be on the list.')
    } finally {
      setBusy('')
    }
  }

  const remove = async (domain) => {
    setBusy(domain)
    try {
      await removeAllowedDomain(domain)
      setToken(value => value + 1)
    } catch {
      setError('That domain could not be removed.')
    } finally {
      setBusy('')
    }
  }

  return <section className="mt-12">
    <div className="flex items-center gap-2"><KeyRound size={18} className="text-crimson" /><h2 className="font-display text-2xl font-bold text-night">Member access</h2></div>
    <p className="mt-1 text-sm text-ink-muted">Anyone with an email on this list can sign in. Add the incoming class each September, and remove a class once it should no longer have access.</p>

    {error && <div className="mt-4"><ErrorNotice onRetry={() => setToken(value => value + 1)}>{error}</ErrorNotice></div>}
    {loading && <div className="panel mt-4 px-6 py-10 text-center text-sm text-ink-muted">Loading the domain list…</div>}

    {!loading && <div className="panel mt-4 divide-y divide-line">
      {domains.length === 0 && <p className="px-5 py-6 text-center text-sm text-ink-muted">No domains on the list. Nobody can sign in until one is added.</p>}
      {domains.map(entry => <div key={entry.domain} className="flex items-center justify-between gap-4 px-5 py-3.5">
        <div className="min-w-0">
          <p className="font-mono text-sm font-semibold text-night">@{entry.domain}</p>
          {entry.note && <p className="mt-0.5 text-xs text-ink-muted">{entry.note}</p>}
        </div>
        <button
          onClick={() => remove(entry.domain)}
          disabled={busy === entry.domain || domains.length === 1}
          title={domains.length === 1 ? 'The last domain cannot be removed: nobody would be able to sign in.' : undefined}
          className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-line px-3 py-2 text-xs font-semibold text-ink-muted hover:border-crimson hover:text-crimson disabled:cursor-not-allowed disabled:opacity-40"
        ><Trash2 size={14} />Remove</button>
      </div>)}
    </div>}

    <form onSubmit={add} className="panel mt-4 p-5">
      <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <label><span className="label">Domain</span><input name="domain" className="input" placeholder="mba2029.hbs.edu" required /></label>
        <label><span className="label">Note <span className="font-normal text-ink-muted">(optional)</span></span><input name="note" className="input" placeholder="Class of 2029" /></label>
        <button type="submit" disabled={Boolean(busy)} className="btn-primary disabled:cursor-wait disabled:opacity-70"><Plus size={16} />Add domain</button>
      </div>
    </form>
  </section>
}

// Officers can read member profiles and resumes so they can match people to
// roles by hand. Onboarding tells members this in plain words. Storage is
// private, so each resume link is signed and short-lived rather than a URL
// that would keep working if it were passed on.
const RESUME_LINK_SECONDS = 900

function MemberRoster() {
  const [members, setMembers] = useState([])
  const [links, setLinks] = useState({})
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isSupabaseConfigured) return undefined
    let active = true
    loadMemberRoster()
      .then(async rows => {
        if (!active) return
        setMembers(rows)
        setError('')
        const withResumes = rows.filter(row => row.resumePath)
        const signed = await Promise.all(withResumes.map(row =>
          resumeDownloadUrl(row.resumePath, RESUME_LINK_SECONDS).catch(() => null)))
        if (!active) return
        setLinks(Object.fromEntries(withResumes.map((row, index) => [row.id, signed[index]]).filter(pair => pair[1])))
      })
      .catch(() => { if (active) setError('The member list could not load.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  return <section className="mt-12">
    <div className="flex items-center gap-2"><Users size={18} className="text-crimson" /><h2 className="font-display text-2xl font-bold text-night">Members</h2></div>
    <p className="mt-1 text-sm text-ink-muted">Everyone who has completed orientation, with what they are looking for. Resume links expire after fifteen minutes; reload this page for a fresh one.</p>

    {error && <div className="mt-4"><ErrorNotice>{error}</ErrorNotice></div>}
    {loading && <div className="panel mt-4 px-6 py-10 text-center text-sm text-ink-muted">Loading the member list…</div>}
    {!loading && members.length === 0 && <div className="mt-4"><EmptyState title="No members yet">Members appear here once they finish orientation.</EmptyState></div>}

    {!loading && members.length > 0 && <div className="panel mt-4 divide-y divide-line">
      {members.map(member => <div key={member.id} className="flex flex-wrap items-start justify-between gap-3 px-5 py-4">
        <div className="min-w-0">
          <p className="font-semibold text-night">{member.name} <span className="ml-1 text-xs font-normal text-ink-muted">{member.classYear}</span></p>
          <p className="mt-0.5 text-xs text-ink-muted">{member.email}</p>
          {member.careerStage && <p className="mt-1 text-xs font-medium text-ink">{member.careerStage}</p>}
          {(member.functions.length > 0 || member.sectors.length > 0) && <div className="mt-2 flex flex-wrap gap-1.5">
            {[...member.functions, ...member.sectors].map(tag => <span key={tag} className="tag">{tag}</span>)}
          </div>}
        </div>
        {member.resumePath
          ? (links[member.id]
            ? <a href={links[member.id]} target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-xs font-semibold text-night hover:border-night"><FileText size={14} />Open resume <ExternalLink size={12} /></a>
            : <span className="shrink-0 text-xs text-ink-muted">Resume link unavailable</span>)
          : <span className="shrink-0 text-xs text-ink-muted">No resume</span>}
      </div>)}
    </div>}
  </section>
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
    {error && <div className="mb-5"><ErrorNotice onRetry={() => { setLoading(true); setRefreshToken(value => value + 1) }} retrying={loading}>{error}</ErrorNotice></div>}

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

    <MemberRoster />

    <MemberAccess />
  </div>
}

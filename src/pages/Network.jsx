import { useState } from 'react'
import { ArrowUpRight, Building2, Link as LinkIcon, Search, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { EmptyState, ErrorNotice, PageHeader } from '../components/ui'
import { useNetwork } from '../lib/hooks'

// Notes are held locally while typing and committed on blur, so a note costs
// one write rather than one per keystroke.
function NoteField({ person, onCommit }) {
  const persisted = person.note || ''
  const [draft, setDraft] = useState(persisted)
  const [lastPersisted, setLastPersisted] = useState(persisted)
  if (lastPersisted !== persisted) {
    setLastPersisted(persisted)
    setDraft(persisted)
  }
  const commit = () => { if (draft !== persisted) onCommit(person.id, { note: draft }) }
  return <label>
    <span className="sr-only">Notes on {person.name}</span>
    <textarea
      className="input min-h-20 resize-y"
      value={draft}
      onChange={event => setDraft(event.target.value)}
      onBlur={commit}
      placeholder="How you know them, what you want to ask, when you last spoke…"
    />
  </label>
}

export default function Network() {
  const { items, loading, error, retry, update, remove } = useNetwork()
  const [query, setQuery] = useState('')

  const results = items.filter(person => {
    if (!query) return true
    const haystack = `${person.name} ${person.company} ${person.title}`.toLowerCase()
    return haystack.includes(query.toLowerCase())
  })

  return <div className="page-wrap">
    <PageHeader
      eyebrow="Workspace"
      title="The people in your search"
      description="Alumni you have saved from the alumni search, with your own notes. Private to you."
    />

    {error && <div className="mb-5"><ErrorNotice onRetry={retry} retrying={loading}>{error}</ErrorNotice></div>}

    {loading && <div className="panel px-6 py-12 text-center text-sm text-ink-muted">Loading your network…</div>}

    {!loading && items.length === 0 && <EmptyState title="You have not saved anyone yet">
      Find a company in <Link to="/alumni" className="font-semibold text-crimson hover:underline">alumni search</Link> and save the people worth knowing.
    </EmptyState>}

    {!loading && items.length > 0 && <>
      <div className="panel p-4">
        <label className="relative block">
          <span className="sr-only">Search your network</span>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" size={17} />
          <input value={query} onChange={event => setQuery(event.target.value)} className="input pl-10" placeholder="Search by name, company, or role" />
        </label>
      </div>

      <p className="mt-5 text-sm text-ink-muted"><strong className="text-night">{results.length}</strong> {results.length === 1 ? 'person' : 'people'} saved</p>

      <div className="mt-4 space-y-3">{results.map(person => <article key={person.id} className="panel p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-night text-xs font-bold text-white">{person.name.split(' ').map(part => part[0]).join('').slice(0, 2)}</span>
            <div className="min-w-0">
              <h2 className="font-bold text-night">{person.name}{person.classYear && <span className="ml-2 text-xs font-normal text-ink-muted">HBS ’{person.classYear.slice(-2)}</span>}</h2>
              <p className="mt-0.5 text-sm leading-5 text-ink-muted">{person.title}</p>
              <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-ink"><Building2 size={15} className="text-crimson" />{person.company}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-4">
            <Link to={`/alumni?company=${encodeURIComponent(person.company)}`} className="text-sm font-semibold text-crimson hover:underline">Others there</Link>
            {person.linkedinUrl && <a href={person.linkedinUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0a66c2] hover:underline"><LinkIcon size={15} />LinkedIn <ArrowUpRight size={13} /></a>}
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
          <NoteField person={person} onCommit={update} />
          <div className="flex items-center md:flex-col md:items-end md:justify-start">
            <button onClick={() => remove(person.id)} className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-crimson"><Trash2 size={14} />Remove</button>
          </div>
        </div>
      </article>)}</div>

      {results.length === 0 && <div className="mt-4"><EmptyState title="Nobody matches that search">Clear the search to see everyone you have saved.</EmptyState></div>}
    </>}

    <p className="mt-6 text-xs leading-5 text-ink-muted">Your network and notes are private to you. Confirm current roles before outreach and respect each alumnus’s time and privacy.</p>
  </div>
}

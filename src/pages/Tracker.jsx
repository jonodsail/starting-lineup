import { useState } from 'react'
import { ExternalLink, Trash2 } from 'lucide-react'
import { EmptyState, PageHeader } from '../components/ui'
import { useTracker } from '../lib/hooks'
import { isSupabaseConfigured } from '../lib/supabase'

const STAGES = ['Saved', 'Applied', 'Interviewing', 'Offer', 'Passed']

// Notes are held locally while typing and committed on blur. Writing on every
// keystroke would send one database round trip per character.
function NoteField({ item, onCommit }) {
  const persisted = item.notes || ''
  const [draft, setDraft] = useState(persisted)
  const [lastPersisted, setLastPersisted] = useState(persisted)
  // Adjusting state during render is React's documented pattern for resyncing
  // when a prop changes, and avoids an effect that would cascade renders.
  if (lastPersisted !== persisted) {
    setLastPersisted(persisted)
    setDraft(persisted)
  }
  const commit = () => { if (draft !== persisted) onCommit(item.id, { notes: draft }) }
  return <label>
    <span className="sr-only">Notes for {item.title}</span>
    <textarea className="input min-h-20 resize-y" value={draft} onChange={event => setDraft(event.target.value)} onBlur={commit} placeholder="Add a contact, next step, or interview note…" />
  </label>
}

export default function Tracker() {
  const { items, loading, error, update, remove } = useTracker()

  return <div className="page-wrap">
    <PageHeader
      eyebrow="Personal workspace"
      title="Keep your search moving"
      description={isSupabaseConfigured
        ? 'Track each role from first interest through final decision. Your tracker is private to you and follows you across devices.'
        : 'Track each role from first interest through final decision. This local preview keeps your notes in this browser only.'}
    />

    {error && <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-crimson">{error}</div>}

    <div className="mb-5 flex gap-2 overflow-x-auto pb-1">{STAGES.map(stage => <span key={stage} className="tag whitespace-nowrap">{stage} · {items.filter(item => item.stage === stage).length}</span>)}</div>

    {loading && <div className="panel px-6 py-12 text-center text-sm text-ink-muted">Loading your tracker…</div>}

    {!loading && items.length === 0 && <EmptyState title="Your tracker is empty">Save a role from the opportunity board and it will appear here.</EmptyState>}

    {!loading && items.length > 0 && <div className="space-y-3">{items.map(item => <article key={item.id} className="panel p-5">
      <div className="grid gap-4 md:grid-cols-[1fr_180px] md:items-start">
        <div><p className="text-xs font-semibold uppercase tracking-wider text-crimson">{item.company}</p><h2 className="mt-1 font-bold text-night">{item.title}</h2><p className="mt-1 text-sm text-ink-muted">{[item.location, item.type].filter(Boolean).join(' · ')}</p></div>
        <label><span className="sr-only">Stage for {item.title}</span><select value={item.stage} onChange={event => update(item.id, { stage: event.target.value })} className="input">{STAGES.map(stage => <option key={stage}>{stage}</option>)}</select></label>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
        <NoteField item={item} onCommit={update} />
        <div className="flex items-center gap-4 md:flex-col md:items-end">
          <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold text-night hover:text-crimson">Source <ExternalLink size={14} /></a>
          <button onClick={() => remove(item.id)} className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-crimson"><Trash2 size={14} />Remove</button>
        </div>
      </div>
    </article>)}</div>}
  </div>
}

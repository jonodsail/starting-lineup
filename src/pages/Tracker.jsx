import { useState } from 'react'
import { ExternalLink, Trash2 } from 'lucide-react'
import { EmptyState, PageHeader } from '../components/ui'
import { readTracker, writeTracker } from '../lib/tracker'

const STAGES = ['Saved', 'Applied', 'Interviewing', 'Offer', 'Passed']

export default function Tracker() {
  const [items, setItems] = useState(readTracker)
  const update = (id, patch) => { const next = items.map(item => item.id === id ? { ...item, ...patch } : item); setItems(next); writeTracker(next) }
  const remove = (id) => { const next = items.filter(item => item.id !== id); setItems(next); writeTracker(next) }
  return <div className="page-wrap"><PageHeader eyebrow="Personal workspace" title="Keep your search moving" description="Track each role from first interest through final decision. Your notes stay private to your browser in this pilot build." />
    <div className="mb-5 flex gap-2 overflow-x-auto pb-1">{STAGES.map(stage => <span key={stage} className="tag whitespace-nowrap">{stage} · {items.filter(item => item.stage === stage).length}</span>)}</div>
    {items.length === 0 ? <EmptyState title="Your tracker is empty">Save a role from the opportunity board and it will appear here.</EmptyState> : <div className="space-y-3">{items.map(item => <article key={item.id} className="panel p-5"><div className="grid gap-4 md:grid-cols-[1fr_180px] md:items-start"><div><p className="text-xs font-semibold uppercase tracking-wider text-crimson">{item.company}</p><h2 className="mt-1 font-bold text-night">{item.title}</h2><p className="mt-1 text-sm text-ink-muted">{item.location} · {item.type}</p></div><select value={item.stage} onChange={event => update(item.id, { stage: event.target.value })} className="input"><option disabled>Stage</option>{STAGES.map(stage => <option key={stage}>{stage}</option>)}</select></div><div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]"><textarea className="input min-h-20 resize-y" value={item.notes || ''} onChange={event => update(item.id, { notes: event.target.value })} placeholder="Add a contact, next step, or interview note…" /><div className="flex items-center gap-4 md:flex-col md:items-end"><a href={item.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold text-night hover:text-crimson">Source <ExternalLink size={14} /></a><button onClick={() => remove(item.id)} className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-crimson"><Trash2 size={14} />Remove</button></div></div></article>)}</div>}
  </div>
}

import { useMemo, useState } from 'react'
import { CheckCircle2, Search, Send, X } from 'lucide-react'
import { EmptyState, OpportunityCard, PageHeader } from '../components/ui'
import { FUNCTIONS, opportunities, SECTORS } from '../data/opportunities'
import { makeTrackedOpportunity, readTracker, writeTracker } from '../lib/tracker'
import { addSubmission } from '../lib/submissions'

export default function Opportunities() {
  const [query, setQuery] = useState('')
  const [type, setType] = useState('All')
  const [jobFunction, setJobFunction] = useState('All')
  const [sector, setSector] = useState('All')
  const [tracker, setTracker] = useState(readTracker)
  const [showSubmit, setShowSubmit] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const savedIds = new Set(tracker.map(item => item.id))
  const results = useMemo(() => opportunities.filter(item => {
    const haystack = `${item.title} ${item.company} ${item.location}`.toLowerCase()
    return (!query || haystack.includes(query.toLowerCase())) && (type === 'All' || item.type === type) && (jobFunction === 'All' || item.function === jobFunction) && (sector === 'All' || item.sector === sector)
  }), [query, type, jobFunction, sector])
  const save = (item) => { if (savedIds.has(item.id)) return; const next = [...tracker, makeTrackedOpportunity(item)]; setTracker(next); writeTracker(next) }
  const submitRole = event => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    addSubmission({ id: `submission-${Date.now()}`, company: form.get('company'), title: form.get('title'), url: form.get('url'), mbaSignal: form.get('mbaSignal'), submitted: 'Just now', submittedBy: 'Member', status: 'Pending review' })
    setShowSubmit(false); setSubmitted(true)
  }
  return <div className="page-wrap"><PageHeader eyebrow="Officer-curated board" title="MBA opportunities in sports" description="Internships and full-time roles selected for HBS candidates. Each listing includes the signal that made it relevant." action={<button onClick={() => setShowSubmit(value => !value)} className="btn-secondary">{showSubmit ? <X size={15} /> : <Send size={15} />}{showSubmit ? 'Close' : 'Submit a role'}</button>} />
    {submitted && <div className="mb-4 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-forest"><CheckCircle2 size={17} />Submitted for officer review. It will not publish automatically.</div>}
    {showSubmit && <form onSubmit={submitRole} className="panel mb-5 p-5"><div className="flex items-start justify-between gap-4"><div><p className="font-semibold text-night">Suggest an opportunity</p><p className="mt-1 text-sm text-ink-muted">Club officers verify every submission before members see it.</p></div><span className="tag">Officer approval required</span></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><label><span className="label">Company</span><input name="company" className="input" required /></label><label><span className="label">Role title</span><input name="title" className="input" required /></label><label className="sm:col-span-2"><span className="label">Source URL</span><input name="url" type="url" className="input" placeholder="https://…" required /></label><label className="sm:col-span-2"><span className="label">Why is it right for an HBS MBA?</span><textarea name="mbaSignal" className="input min-h-20" required /></label></div><div className="mt-4 flex justify-end"><button className="btn-primary" type="submit">Send to officers <Send size={15} /></button></div></form>}
    <div className="panel p-4"><label className="relative block"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" size={17} /><input value={query} onChange={event => setQuery(event.target.value)} className="input pl-10" placeholder="Search role, company, or location" /></label><div className="mt-3 grid gap-3 sm:grid-cols-3"><select className="input" value={type} onChange={event => setType(event.target.value)}><option>All</option><option>MBA Internship</option><option>Full-Time</option></select><select className="input" value={jobFunction} onChange={event => setJobFunction(event.target.value)}><option>All</option>{FUNCTIONS.map(item => <option key={item}>{item}</option>)}</select><select className="input" value={sector} onChange={event => setSector(event.target.value)}><option>All</option>{SECTORS.map(item => <option key={item}>{item}</option>)}</select></div></div>
    <div className="mt-5 flex items-center justify-between"><p className="text-sm text-ink-muted"><strong className="text-night">{results.length}</strong> opportunities</p><p className="text-xs text-ink-muted">Most recently reviewed first</p></div>
    <div className="mt-4 grid gap-4 xl:grid-cols-2">{results.map(item => <OpportunityCard key={item.id} opportunity={item} saved={savedIds.has(item.id)} onSave={save} />)}</div>{results.length === 0 && <div className="mt-4"><EmptyState title="No roles match those filters">Try widening one filter. Tight curation means the board will stay intentionally smaller than a general job site.</EmptyState></div>}
  </div>
}

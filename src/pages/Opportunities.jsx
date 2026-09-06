import { useMemo, useState } from 'react'
import { CheckCircle2, Search, Send, X } from 'lucide-react'
import { EmptyState, OpportunityCard, PageHeader } from '../components/ui'
import { FUNCTIONS, SECTORS } from '../data/opportunities'
import { useOpportunities, useTracker } from '../lib/hooks'
import { submitOpportunity } from '../lib/db'

const TYPES = ['MBA Internship', 'Full-Time']

export default function Opportunities() {
  const { opportunities, loading, error } = useOpportunities()
  const { items: tracker, save, error: trackerError } = useTracker()
  const [query, setQuery] = useState('')
  const [type, setType] = useState('All')
  const [jobFunction, setJobFunction] = useState('All')
  const [sector, setSector] = useState('All')
  const [showSubmit, setShowSubmit] = useState(false)
  const [submitStatus, setSubmitStatus] = useState('idle')

  const savedIds = new Set(tracker.map(item => item.id))

  const results = useMemo(() => opportunities.filter(item => {
    const haystack = `${item.title} ${item.company} ${item.location}`.toLowerCase()
    return (!query || haystack.includes(query.toLowerCase()))
      && (type === 'All' || item.type === type)
      && (jobFunction === 'All' || item.function === jobFunction)
      && (sector === 'All' || item.sector === sector)
  }), [opportunities, query, type, jobFunction, sector])

  const submitRole = async (event) => {
    event.preventDefault()
    setSubmitStatus('submitting')
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    try {
      await submitOpportunity({
        company: form.get('company'),
        title: form.get('title'),
        type: form.get('type'),
        function: form.get('function'),
        sector: form.get('sector'),
        sourceUrl: form.get('url'),
        mbaSignal: form.get('mbaSignal'),
      })
      formElement.reset()
      setShowSubmit(false)
      setSubmitStatus('submitted')
    } catch {
      setSubmitStatus('error')
    }
  }

  return <div className="page-wrap">
    <PageHeader eyebrow="Officer-curated board" title="MBA opportunities in sports" description="Internships and full-time roles selected for HBS candidates." action={<button onClick={() => { setShowSubmit(value => !value); setSubmitStatus('idle') }} className="btn-secondary">{showSubmit ? <X size={15} /> : <Send size={15} />}{showSubmit ? 'Close' : 'Submit a role'}</button>} />

    {submitStatus === 'submitted' && <div className="mb-4 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-forest"><CheckCircle2 size={17} />Sent to the officer desk. It will not publish until an officer approves it.</div>}
    {submitStatus === 'error' && <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-crimson">The submission could not be sent. Please try again in a moment.</div>}
    {(error || trackerError) && <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-crimson">{error || trackerError}</div>}

    {showSubmit && <form onSubmit={submitRole} className="panel mb-5 p-5">
      <p className="font-semibold text-night">Suggest an opportunity</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label><span className="label">Company</span><input name="company" className="input" required /></label>
        <label><span className="label">Role title</span><input name="title" className="input" required /></label>
        <label><span className="label">Type</span><select name="type" className="input" required defaultValue={TYPES[0]}>{TYPES.map(item => <option key={item}>{item}</option>)}</select></label>
        <label><span className="label">Function</span><select name="function" className="input" required defaultValue={FUNCTIONS[0]}>{FUNCTIONS.map(item => <option key={item}>{item}</option>)}</select></label>
        <label className="sm:col-span-2"><span className="label">Sector</span><select name="sector" className="input" required defaultValue={SECTORS[0]}>{SECTORS.map(item => <option key={item}>{item}</option>)}</select></label>
        <label className="sm:col-span-2"><span className="label">Link to the specific posting</span><input name="url" type="url" className="input" placeholder="https://…" required /><span className="mt-1 block text-xs text-ink-muted">Role-specific links</span></label>
        <label className="sm:col-span-2"><span className="label">Fit</span><textarea name="mbaSignal" className="input min-h-20" required /></label>
      </div>
      <div className="mt-4 flex justify-end"><button className="btn-primary disabled:cursor-wait disabled:opacity-70" type="submit" disabled={submitStatus === 'submitting'}>{submitStatus === 'submitting' ? 'Sending…' : 'Send to officers'} <Send size={15} /></button></div>
    </form>}

    <div className="panel p-4">
      <label className="relative block"><span className="sr-only">Search opportunities</span><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" size={17} /><input value={query} onChange={event => setQuery(event.target.value)} className="input pl-10" placeholder="Search role, company, or location" /></label>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <select className="input" value={type} onChange={event => setType(event.target.value)}><option>All</option>{TYPES.map(item => <option key={item}>{item}</option>)}</select>
        <select className="input" value={jobFunction} onChange={event => setJobFunction(event.target.value)}><option>All</option>{FUNCTIONS.map(item => <option key={item}>{item}</option>)}</select>
        <select className="input" value={sector} onChange={event => setSector(event.target.value)}><option>All</option>{SECTORS.map(item => <option key={item}>{item}</option>)}</select>
      </div>
    </div>

    <div className="mt-5 flex items-center justify-between"><p className="text-sm text-ink-muted"><strong className="text-night">{loading ? '—' : results.length}</strong> opportunities</p><p className="text-xs text-ink-muted">Most recently verified results first</p></div>

    {loading
      ? <div className="panel mt-4 px-6 py-12 text-center text-sm text-ink-muted">Loading the officer-curated board…</div>
      : <>
        <div className="mt-4 grid gap-4 xl:grid-cols-2">{results.map(item => <OpportunityCard key={item.id} opportunity={item} saved={savedIds.has(item.id)} onSave={save} />)}</div>
        {results.length === 0 && <div className="mt-4"><EmptyState title={opportunities.length ? 'No roles match these filters' : 'No roles published yet'} /></div>}
      </>}
  </div>
}

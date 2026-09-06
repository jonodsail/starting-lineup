import { useEffect, useId, useMemo, useState } from 'react'
import { ArrowUpRight, Building2, Check, CheckCircle2, Link as LinkIcon, Search, Send, Users, X } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { EmptyState, PageHeader } from '../components/ui'
import { ecosystemCompanyNames } from '../data/ecosystemCompanyNames'
import { opportunities } from '../data/opportunities'
import { alumniSeed } from '../data/alumniSeed'
import { canonicalizeOrganization, majorLeagueOrganizations, organizationSearchText, organizationsMatch } from '../data/organizationCatalog'
import { loadAlumniDirectory, submitAlumniCandidate } from '../lib/auth'

const baseCompanyNames = [...new Set([
  ...ecosystemCompanyNames,
  ...opportunities.map(opportunity => opportunity.company),
  ...majorLeagueOrganizations,
].map(canonicalizeOrganization))].sort((a, b) => a.localeCompare(b))

function CompanyCombobox({ value, onChange, companyNames }) {
  const listboxId = useId()
  const [input, setInput] = useState(value)
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  const matches = useMemo(() => {
    const needle = input.trim().toLowerCase()
    if (!needle) return companyNames
    return companyNames
      .filter(name => organizationSearchText(name).includes(needle))
      .sort((a, b) => Number(!organizationSearchText(a).startsWith(needle)) - Number(!organizationSearchText(b).startsWith(needle)) || a.localeCompare(b))
  }, [companyNames, input])

  const selectCompany = (name) => {
    setInput(name)
    setOpen(false)
    setActiveIndex(0)
    onChange(name)
  }

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setOpen(true)
      if (matches.length) setActiveIndex(index => Math.min(index + 1, matches.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex(index => Math.max(index - 1, 0))
    } else if (event.key === 'Enter' && open && matches[activeIndex]) {
      event.preventDefault()
      selectCompany(matches[activeIndex])
    } else if (event.key === 'Escape') {
      setOpen(false)
    }
  }

  return <div className="relative">
    <label htmlFor={`${listboxId}-input`} className="mb-2 block text-sm font-semibold text-night">Company</label>
    <div className="relative">
      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" size={18} />
      <input
        id={`${listboxId}-input`}
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-activedescendant={open && matches[activeIndex] ? `${listboxId}-${activeIndex}` : undefined}
        className="input pl-10 pr-10"
        value={input}
        onChange={(event) => {
          setInput(event.target.value)
          setOpen(true)
          setActiveIndex(0)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={handleKeyDown}
        placeholder="Start typing a company, team, or league"
        autoComplete="off"
      />
      {(input || value) && <button type="button" aria-label="Clear company" onMouseDown={event => event.preventDefault()} onClick={() => { setInput(''); setOpen(true); onChange('') }} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-night"><X size={17} /></button>}
    </div>
    {open && <div id={listboxId} role="listbox" className="absolute z-20 mt-2 max-h-72 w-full overflow-auto rounded-xl border border-line bg-white p-1.5 shadow-xl shadow-night/10">
      {matches.length > 0 ? matches.map((name, index) => <button
        id={`${listboxId}-${index}`}
        key={name}
        type="button"
        role="option"
        aria-selected={name === value}
        onMouseDown={event => event.preventDefault()}
        onMouseEnter={() => setActiveIndex(index)}
        onClick={() => selectCompany(name)}
        className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm ${index === activeIndex ? 'bg-crimson-soft text-crimson' : 'text-ink hover:bg-canvas'}`}
      ><span>{name}</span>{name === value && <Check size={15} />}</button>) : <p className="px-3 py-3 text-sm text-ink-muted">No company matches that search.</p>}
    </div>}
    <p className="mt-2 text-xs text-ink-muted">Search {companyNames.length} organizations across major leagues, the sports ecosystem, and current opportunities.</p>
  </div>
}

export default function Alumni() {
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedCompany = searchParams.get('company') || ''
  const [peopleQuery, setPeopleQuery] = useState('')
  const [alumni, setAlumni] = useState(alumniSeed)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [showSubmission, setShowSubmission] = useState(false)
  const [submissionStatus, setSubmissionStatus] = useState('idle')

  const companyNames = useMemo(() => [...new Set([
    ...baseCompanyNames,
    ...alumni.map(person => person.company),
  ].filter(Boolean).map(canonicalizeOrganization))].sort((a, b) => a.localeCompare(b)), [alumni])

  useEffect(() => {
    let active = true
    loadAlumniDirectory()
      .then(records => { if (active) setAlumni(records.length ? records : alumniSeed) })
      .catch(() => { if (active) setLoadError('The alumni directory could not load. Try again in a moment.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const selectCompany = (company) => {
    setSearchParams(company ? { company } : {}, { replace: true })
  }

  const submitCandidate = async (event) => {
    event.preventDefault()
    setSubmissionStatus('submitting')
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    try {
      await submitAlumniCandidate({
        fullName: form.get('fullName'),
        classYear: form.get('classYear') ? Number(form.get('classYear')) : null,
        company: form.get('company'),
        title: form.get('title'),
        linkedinUrl: form.get('linkedinUrl'),
        notes: form.get('notes'),
      })
      formElement.reset()
      setSubmissionStatus('submitted')
      setShowSubmission(false)
    } catch {
      setSubmissionStatus('error')
    }
  }

  const results = useMemo(() => alumni.filter(person => {
    if (!selectedCompany || !organizationsMatch(person.company, selectedCompany)) return false
    const haystack = `${person.name} ${person.title}`.toLowerCase()
    return !peopleQuery || haystack.includes(peopleQuery.toLowerCase())
  }).sort((left, right) => {
    const leftYear = Number(left.classYear) || 0
    const rightYear = Number(right.classYear) || 0
    return rightYear - leftYear || left.name.localeCompare(right.name)
  }), [alumni, peopleQuery, selectedCompany])

  const linkedInUrl = selectedCompany
    ? `https://www.linkedin.com/school/harvard-business-school/people/?keywords=${encodeURIComponent(selectedCompany)}`
    : 'https://www.linkedin.com/school/harvard-business-school/people/'

  return <div className="page-wrap">
    <PageHeader eyebrow="HBS network" title="Who do we know there?" description="Choose any organization in the sports ecosystem. Starting Lineup will show relevant HBS alumni and a broader LinkedIn search when the club directory has gaps." action={<button type="button" onClick={() => { setShowSubmission(value => !value); setSubmissionStatus('idle') }} className="btn-secondary">{showSubmission ? <X size={15} /> : <Send size={15} />}{showSubmission ? 'Close' : 'Submit an alum'}</button>} />

    {submissionStatus === 'submitted' && <div className="mb-5 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-forest"><CheckCircle2 size={17} />Submitted for officer verification. The record will not appear until approved.</div>}
    {submissionStatus === 'error' && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-crimson">The submission could not be sent. Please try again in a moment.</div>}
    {showSubmission && <form key={selectedCompany} onSubmit={submitCandidate} className="panel mb-5 p-5"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start"><div><p className="font-semibold text-night">Know an HBS alum we should include?</p><p className="mt-1 text-sm leading-6 text-ink-muted">Share their public professional information. Club officers verify HBS affiliation, company, and title before publishing.</p></div><span className="tag shrink-0">Officer approval required</span></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><label><span className="label">Full name</span><input name="fullName" className="input" required /></label><label><span className="label">Company</span><input name="company" className="input" defaultValue={selectedCompany} required /></label><label><span className="label">Current title</span><input name="title" className="input" required /></label><label><span className="label">HBS graduation year <span className="font-normal text-ink-muted">(optional)</span></span><input name="classYear" type="number" min="1908" max="2035" className="input" /></label><label className="sm:col-span-2"><span className="label">LinkedIn profile</span><input name="linkedinUrl" type="url" className="input" placeholder="https://www.linkedin.com/in/…" required /></label><label className="sm:col-span-2"><span className="label">Context for officers <span className="font-normal text-ink-muted">(optional)</span></span><textarea name="notes" className="input min-h-20" placeholder="How you found them or anything officers should confirm" /></label></div><div className="mt-4 flex justify-end"><button type="submit" disabled={submissionStatus === 'submitting'} className="btn-primary disabled:cursor-wait disabled:opacity-70">{submissionStatus === 'submitting' ? 'Sending…' : 'Send for verification'} <Send size={15} /></button></div></form>}

    <section className="panel relative z-10 p-5 md:p-6">
      <CompanyCombobox key={selectedCompany} value={selectedCompany} onChange={selectCompany} companyNames={companyNames} />
      {selectedCompany && <label className="relative mt-4 block"><span className="sr-only">Filter alumni by name or role</span><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" size={17} /><input className="input pl-10" value={peopleQuery} onChange={event => setPeopleQuery(event.target.value)} placeholder={`Filter people at ${selectedCompany} by name or role`} /></label>}
    </section>

    {selectedCompany && <div className="mt-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><p className="text-sm text-ink-muted"><strong className="text-night">{loading ? '—' : results.length}</strong> verified {results.length === 1 ? 'alumnus' : 'alumni'} at or related to <strong className="text-night">{selectedCompany}</strong></p>{loadError && <p className="mt-1 text-xs font-medium text-crimson">{loadError}</p>}</div><a href={linkedInUrl} target="_blank" rel="noreferrer" className="btn-secondary shrink-0">Search HBS alumni on LinkedIn <ArrowUpRight size={16} /></a></div>}

    {loading && selectedCompany && <div className="mt-4 panel px-6 py-12 text-center text-sm text-ink-muted">Searching the private HBS alumni directory…</div>}

    {!loading && selectedCompany && results.length > 0 && <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{results.map(person => {
      const linkedInUrl = person.linkedinUrl || `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(`${person.name} ${person.company}`)}`
      return <article key={person.id} className="panel p-5"><div className="flex items-start justify-between gap-3"><span className="grid h-10 w-10 place-items-center rounded-full bg-night text-xs font-bold text-white">{person.name.split(' ').map(part => part[0]).join('').slice(0, 2)}</span>{person.classYear && <span className="tag">HBS ’{person.classYear.slice(-2)}</span>}</div><h2 className="mt-4 font-bold text-night">{person.name}</h2><p className="mt-1 text-sm leading-5 text-ink-muted">{person.title}</p><p className="mt-3 flex items-center gap-2 text-sm font-semibold text-ink"><Building2 size={15} className="text-crimson" />{person.company}</p><a href={linkedInUrl} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#0a66c2] hover:underline"><LinkIcon size={16} />{person.linkedinUrl ? 'View LinkedIn' : 'Search LinkedIn'} <ArrowUpRight size={14} /></a></article>
    })}</div>}

    {!loading && selectedCompany && results.length === 0 && <div className="mt-4"><EmptyState title={`No verified alumni at ${selectedCompany} yet`}>Use the LinkedIn search above to find HBS alumni, then flag strong matches for the club’s verified directory.</EmptyState></div>}

    {!selectedCompany && <div className="mt-4"><EmptyState title="Choose a company to begin"><span className="inline-flex items-center gap-2"><Users size={16} />Start typing above. Matching organizations will appear as you type.</span></EmptyState></div>}

    <p className="mt-6 text-xs leading-5 text-ink-muted">Directory information is for HBS member networking. Confirm current roles before outreach and respect each alumnus’s time and privacy.</p>
  </div>
}

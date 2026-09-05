import { useEffect, useId, useMemo, useState } from 'react'
import { ArrowUpRight, Building2, Check, Link as LinkIcon, Search, Users, X } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { EmptyState, PageHeader } from '../components/ui'
import { companies as ecosystemCompanies } from '../data/companies'
import { opportunities } from '../data/opportunities'
import { alumniSeed } from '../data/alumniSeed'
import { loadAlumniDirectory } from '../lib/auth'

const companyNames = [...new Set([
  ...ecosystemCompanies.map(company => company.name),
  ...opportunities.map(opportunity => opportunity.company),
])].sort((a, b) => a.localeCompare(b))

function normalizeCompany(value = '') {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function isSameCompany(left, right) {
  const a = normalizeCompany(left)
  const b = normalizeCompany(right)
  return a === b || (Math.min(a.length, b.length) > 5 && (a.includes(b) || b.includes(a)))
}

function CompanyCombobox({ value, onChange }) {
  const listboxId = useId()
  const [input, setInput] = useState(value)
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  const matches = useMemo(() => {
    const needle = input.trim().toLowerCase()
    if (!needle) return companyNames.slice(0, 8)
    return companyNames
      .filter(name => name.toLowerCase().includes(needle))
      .sort((a, b) => Number(!a.toLowerCase().startsWith(needle)) - Number(!b.toLowerCase().startsWith(needle)) || a.localeCompare(b))
      .slice(0, 8)
  }, [input])

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
    <p className="mt-2 text-xs text-ink-muted">Search {companyNames.length} organizations from Sports Ecosystem Explorer and current opportunities.</p>
  </div>
}

export default function Alumni() {
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedCompany = searchParams.get('company') || ''
  const [peopleQuery, setPeopleQuery] = useState('')
  const [alumni, setAlumni] = useState(alumniSeed)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

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

  const results = useMemo(() => alumni.filter(person => {
    if (!selectedCompany || !isSameCompany(person.company, selectedCompany)) return false
    const haystack = `${person.name} ${person.title}`.toLowerCase()
    return !peopleQuery || haystack.includes(peopleQuery.toLowerCase())
  }), [alumni, peopleQuery, selectedCompany])

  const linkedInUrl = selectedCompany
    ? `https://www.linkedin.com/school/harvard-business-school/people/?keywords=${encodeURIComponent(selectedCompany)}`
    : 'https://www.linkedin.com/school/harvard-business-school/people/'

  return <div className="page-wrap">
    <PageHeader eyebrow="HBS network" title="Who do we know there?" description="Choose any organization in the sports ecosystem. Starting Lineup will show relevant HBS alumni and a broader LinkedIn search when the club directory has gaps." />

    <section className="panel relative z-10 p-5 md:p-6">
      <CompanyCombobox key={selectedCompany} value={selectedCompany} onChange={selectCompany} />
      {selectedCompany && <label className="relative mt-4 block"><span className="sr-only">Filter alumni by name or role</span><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" size={17} /><input className="input pl-10" value={peopleQuery} onChange={event => setPeopleQuery(event.target.value)} placeholder={`Filter people at ${selectedCompany} by name or role`} /></label>}
    </section>

    {selectedCompany && <div className="mt-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><p className="text-sm text-ink-muted"><strong className="text-night">{loading ? '—' : results.length}</strong> verified {results.length === 1 ? 'alumnus' : 'alumni'} at or related to <strong className="text-night">{selectedCompany}</strong></p>{loadError && <p className="mt-1 text-xs font-medium text-crimson">{loadError}</p>}</div><a href={linkedInUrl} target="_blank" rel="noreferrer" className="btn-secondary shrink-0">Search HBS alumni on LinkedIn <ArrowUpRight size={16} /></a></div>}

    {loading && selectedCompany && <div className="mt-4 panel px-6 py-12 text-center text-sm text-ink-muted">Searching the private HBS alumni directory…</div>}

    {!loading && selectedCompany && results.length > 0 && <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{results.map(person => <article key={person.id} className="panel p-5"><div className="flex items-start justify-between gap-3"><span className="grid h-10 w-10 place-items-center rounded-full bg-night text-xs font-bold text-white">{person.name.split(' ').map(part => part[0]).join('').slice(0, 2)}</span>{person.classYear && <span className="tag">HBS ’{person.classYear.slice(-2)}</span>}</div><h2 className="mt-4 font-bold text-night">{person.name}</h2><p className="mt-1 text-sm leading-5 text-ink-muted">{person.title}</p><p className="mt-3 flex items-center gap-2 text-sm font-semibold text-ink"><Building2 size={15} className="text-crimson" />{person.company}</p><a href={person.linkedinUrl} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#0a66c2] hover:underline"><LinkIcon size={16} />View LinkedIn <ArrowUpRight size={14} /></a></article>)}</div>}

    {!loading && selectedCompany && results.length === 0 && <div className="mt-4"><EmptyState title={`No verified alumni at ${selectedCompany} yet`}>Use the LinkedIn search above to find HBS alumni, then flag strong matches for the club’s verified directory.</EmptyState></div>}

    {!selectedCompany && <div className="mt-4"><EmptyState title="Choose a company to begin"><span className="inline-flex items-center gap-2"><Users size={16} />Start typing above. Matching organizations will appear as you type.</span></EmptyState></div>}

    <p className="mt-6 text-xs leading-5 text-ink-muted">Directory information is for HBS member networking. Confirm current roles before outreach and respect each alumnus’s time and privacy.</p>
  </div>
}

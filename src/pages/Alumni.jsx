import { useMemo, useState } from 'react'
import { ArrowUpRight, Building2, Link as LinkIcon, Search } from 'lucide-react'
import { alumniSeed as alumni } from '../data/alumniSeed'
import { EmptyState, PageHeader } from '../components/ui'

export default function Alumni() {
  const [query, setQuery] = useState('')
  const [company, setCompany] = useState('All companies')
  const companies = useMemo(() => [...new Set(alumni.map(item => item.company).filter(Boolean))].sort(), [])
  const results = useMemo(() => alumni.filter(item => {
    const haystack = `${item.name} ${item.title} ${item.company}`.toLowerCase()
    return (!query || haystack.includes(query.toLowerCase())) && (company === 'All companies' || item.company === company)
  }), [query, company])
  return <div className="page-wrap"><PageHeader eyebrow="HBS network" title="Find alumni by company" description="Start with the club’s verified alumni list, then use the LinkedIn profile to confirm current context before reaching out." />
    <div className="grid gap-3 sm:grid-cols-[1fr_260px]"><label className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" size={17} /><input className="input pl-10" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search name, role, or company" /></label><select className="input" value={company} onChange={event => setCompany(event.target.value)}><option>All companies</option>{companies.map(item => <option key={item}>{item}</option>)}</select></div>
    <div className="mt-5 flex items-center justify-between"><p className="text-sm text-ink-muted"><strong className="text-night">{results.length}</strong> alumni profiles</p><p className="text-xs text-ink-muted">{companies.length} companies in the starting set</p></div>
    <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{results.map(person => <article key={person.id} className="panel p-5"><div className="flex items-start justify-between gap-3"><span className="grid h-10 w-10 place-items-center rounded-full bg-night text-xs font-bold text-white">{person.name.split(' ').map(part => part[0]).join('').slice(0, 2)}</span>{person.classYear && <span className="tag">HBS ’{person.classYear.slice(-2)}</span>}</div><h2 className="mt-4 font-bold text-night">{person.name}</h2><p className="mt-1 text-sm leading-5 text-ink-muted">{person.title}</p><p className="mt-3 flex items-center gap-2 text-sm font-semibold text-ink"><Building2 size={15} className="text-crimson" />{person.company}</p><a href={person.linkedinUrl} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#0a66c2] hover:underline"><LinkIcon size={16} />View LinkedIn <ArrowUpRight size={14} /></a></article>)}</div>
    {results.length === 0 && <div className="mt-4"><EmptyState title="No alumni match yet">This is where the club’s LinkedIn gap research will expand the directory. Try a company or a broader keyword.</EmptyState></div>}
    <p className="mt-6 text-xs leading-5 text-ink-muted">Directory information is for HBS member networking. Confirm current roles before outreach and respect each alumnus’s time and privacy.</p>
  </div>
}

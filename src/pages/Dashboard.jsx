import { useEffect, useState } from 'react'
import { ArrowRight, BriefcaseBusiness, CalendarDays, Network, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { OpportunityCard, Stat } from '../components/ui'
import { useAuth } from '../lib/auth'
import { useOpportunities, useTracker } from '../lib/hooks'
import { countAlumni } from '../lib/db'
import { isSupabaseConfigured } from '../lib/supabase'

function useAlumniCount() {
  const [count, setCount] = useState(null)
  useEffect(() => {
    if (!isSupabaseConfigured) return undefined
    let active = true
    countAlumni()
      .then(value => { if (active) setCount(value) })
      .catch(() => { if (active) setCount(null) })
    return () => { active = false }
  }, [])
  return count
}

export default function Dashboard() {
  const { profile } = useAuth()
  const { opportunities, loading, error } = useOpportunities()
  const { items: tracker, save } = useTracker()
  const alumniCount = useAlumniCount()

  const savedIds = new Set(tracker.map(item => item.id))
  const preferred = opportunities.filter(item => profile?.functions?.includes(item.function) || profile?.sectors?.includes(item.sector))
  const featured = (preferred.length ? preferred : opportunities).slice(0, 3)
  const firstName = profile?.name?.split(' ')[0] || 'there'

  return <div className="page-wrap">
    <section className="relative overflow-hidden rounded-3xl bg-night px-6 py-8 text-white md:px-10 md:py-10"><div className="field-lines absolute inset-0 opacity-20" /><div className="relative flex flex-col justify-between gap-8 md:flex-row md:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.24em] text-crimson-light">Your club career desk</p><h1 className="mt-3 font-display text-4xl font-bold tracking-tight md:text-6xl">Good morning, {firstName}.</h1><p className="mt-3 max-w-xl text-sm leading-6 text-white/55">A focused view of the opportunities and people that can move your sports search forward.</p></div><Link to="/opportunities" className="btn-light">Explore all roles <ArrowRight size={16} /></Link></div></section>

    <div className="mt-6 grid gap-4 sm:grid-cols-3">
      <Stat value={loading ? '—' : opportunities.length} label="Curated opportunities" note="MBA-relevant roles only" />
      <Stat value={alumniCount === null ? '—' : alumniCount} label="Alumni profiles" note={isSupabaseConfigured ? (alumniCount === null ? 'Directory unavailable' : 'Verified by club officers') : 'Local preview — directory not connected'} />
      <Stat value={tracker.length} label="Roles in your tracker" note="Saved through offer" />
    </div>

    {error && <div role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-crimson">{error}</div>}

    <section className="mt-10"><div className="flex items-end justify-between gap-4"><div><p className="eyebrow">Matched to your orientation</p><h2 className="mt-2 font-display text-3xl font-bold text-night">Start with these roles</h2></div><Link to="/opportunities" className="hidden items-center gap-1 text-sm font-semibold text-night hover:text-crimson sm:flex">See all <ArrowRight size={15} /></Link></div>
      {loading
        ? <div className="panel mt-5 px-6 py-12 text-center text-sm text-ink-muted">Loading the board…</div>
        : <div className="mt-5 grid gap-4 xl:grid-cols-3">{featured.map(item => <OpportunityCard key={item.id} opportunity={item} saved={savedIds.has(item.id)} onSave={save} />)}</div>}
    </section>

    <section className="mt-10 grid gap-4 lg:grid-cols-2"><Link to="/alumni" className="panel group flex items-start gap-4 p-6 hover:border-crimson/30"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-crimson-soft text-crimson"><Network size={21} /></span><div><p className="font-semibold text-night">Find someone who knows the company</p><p className="mt-1 text-sm leading-6 text-ink-muted">Search the club’s starting set of HBS alumni by company and role.</p><span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-crimson">Open alumni search <ArrowRight size={14} /></span></div></Link><div className="panel flex items-start gap-4 p-6"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gold-soft text-gold"><CalendarDays size={21} /></span><div><p className="font-semibold text-night">This week’s move</p><p className="mt-1 text-sm leading-6 text-ink-muted">Save three target roles, then identify one alum at each company before outreach.</p><span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-gold"><Sparkles size={14} /> Built for the HBS sports search</span></div></div></section>

    <div className="mt-10 flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-3 text-xs text-ink-muted"><BriefcaseBusiness size={15} />Opportunity listings are reviewed by club officers. Always confirm role status on the employer’s site.</div>
  </div>
}

import { ArrowUpRight, Bookmark, Check } from 'lucide-react'

export function PageHeader({ eyebrow, title, description, action }) {
  return <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><p className="eyebrow">{eyebrow}</p><h1 className="mt-2 font-display text-4xl font-bold leading-tight tracking-tight text-night md:text-5xl">{title}</h1>{description && <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-muted">{description}</p>}</div>{action}</div>
}

export function Stat({ value, label, note }) {
  return <div className="panel p-5"><p className="font-display text-3xl font-bold text-night">{value}</p><p className="mt-1 text-sm font-semibold text-ink">{label}</p>{note && <p className="mt-1 text-xs text-ink-muted">{note}</p>}</div>
}

export function OpportunityCard({ opportunity, saved, onSave }) {
  return <article className="panel group p-5 transition hover:-translate-y-0.5 hover:border-ink/20 hover:shadow-lg hover:shadow-night/5">
    <div className="flex items-start justify-between gap-4"><div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-wider text-crimson">{opportunity.company}</p><h3 className="mt-2 text-lg font-bold leading-snug text-night">{opportunity.title}</h3></div>{opportunity.featured && <span className="tag bg-crimson-soft text-crimson">Club pick</span>}</div>
    <p className="mt-3 text-sm leading-6 text-ink-muted">{opportunity.description}</p>
    <div className="mt-4 flex flex-wrap gap-2"><span className="tag">{opportunity.type}</span><span className="tag">{opportunity.function}</span><span className="tag">{opportunity.location}</span><span className="tag">{opportunity.workMode}</span></div>
    <div className="mt-5 border-t border-line pt-4"><p className="text-xs font-medium text-ink"><span className="text-ink-muted">Why it made the cut:</span> {opportunity.mbaSignal}</p><div className="mt-4 flex items-center justify-between"><button onClick={() => onSave(opportunity)} className={`inline-flex items-center gap-2 text-sm font-semibold ${saved ? 'text-forest' : 'text-ink hover:text-crimson'}`}>{saved ? <Check size={16} /> : <Bookmark size={16} />}{saved ? 'Saved' : 'Save role'}</button><a href={opportunity.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold text-night hover:text-crimson">View source <ArrowUpRight size={15} /></a></div></div>
  </article>
}

export function EmptyState({ title, children }) {
  return <div className="panel border-dashed px-6 py-12 text-center"><p className="font-semibold text-night">{title}</p><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-muted">{children}</p></div>
}

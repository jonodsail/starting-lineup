import { useState } from 'react'
import { Check, Clock3, ExternalLink, Plus, Users } from 'lucide-react'
import { PageHeader, Stat } from '../components/ui'
import { readSubmissions } from '../lib/submissions'

const initialQueue = [
  { id: 1, company: 'Boston Legacy FC', title: 'MBA Strategy Project Intern', submittedBy: 'RC member', submitted: 'Today', url: 'https://www.bostonlegacyfc.com/', status: 'Pending review' },
  { id: 2, company: 'Kraft Analytics Group', title: 'Senior Manager, Client Strategy', submittedBy: 'EC member', submitted: 'Yesterday', url: 'https://www.kraftanalyticsgroup.com/', status: 'Pending review' },
]

export default function Admin() {
  const [queue, setQueue] = useState(() => [...readSubmissions(), ...initialQueue])
  const approve = id => setQueue(items => items.map(item => item.id === id ? { ...item, status: 'Approved' } : item))
  return <div className="page-wrap"><PageHeader eyebrow="Club officers only" title="Officer desk" description="Review member submissions, protect the quality bar, and maintain the alumni starting set." action={<button className="btn-primary"><Plus size={16} />Add opportunity</button>} />
    <div className="grid gap-4 sm:grid-cols-3"><Stat value={queue.filter(item => item.status === 'Pending review').length} label="Awaiting review" note="Member submissions" /><Stat value="8" label="Published roles" note="In the pilot dataset" /><Stat value="Ready" label="Alumni import" note="Private database required" /></div>
    <section className="mt-10"><div className="flex items-center justify-between"><div><p className="eyebrow">Approval queue</p><h2 className="mt-2 font-display text-3xl font-bold text-night">Member submissions</h2></div><span className="tag"><Clock3 size={13} />Review within 48 hours</span></div><div className="mt-5 space-y-3">{queue.map(item => <article key={item.id} className="panel flex flex-col justify-between gap-5 p-5 md:flex-row md:items-center"><div><div className="flex items-center gap-2"><span className={`tag ${item.status === 'Approved' ? 'bg-green-50 text-forest' : 'bg-gold-soft text-gold'}`}>{item.status}</span><span className="text-xs text-ink-muted">Submitted {item.submitted} by {item.submittedBy}</span></div><h3 className="mt-3 font-bold text-night">{item.title}</h3><p className="mt-1 text-sm text-ink-muted">{item.company}</p></div><div className="flex items-center gap-3"><a href={item.url} target="_blank" rel="noreferrer" className="btn-secondary">Check source <ExternalLink size={14} /></a>{item.status !== 'Approved' && <button onClick={() => approve(item.id)} className="btn-primary">Approve <Check size={15} /></button>}</div></article>)}</div></section>
    <section className="mt-10 grid gap-4 lg:grid-cols-2"><div className="panel p-6"><span className="grid h-10 w-10 place-items-center rounded-xl bg-crimson-soft text-crimson"><Users size={19} /></span><h3 className="mt-4 font-bold text-night">Alumni research queue</h3><p className="mt-2 text-sm leading-6 text-ink-muted">Use company-by-company public research to fill gaps. Officers verify title, class year, and LinkedIn before publishing.</p><button className="mt-4 text-sm font-semibold text-crimson">Review missing companies →</button></div><div className="rounded-2xl bg-night p-6 text-white"><p className="text-xs font-bold uppercase tracking-[0.2em] text-crimson-light">Quality bar</p><h3 className="mt-3 font-display text-2xl font-bold">Would a strong HBS MBA plausibly pursue this?</h3><p className="mt-2 text-sm leading-6 text-white/55">Approve roles with meaningful scope, a clear business function, credible source, and current application path. Reject generic entry-level volume listings.</p></div></section>
  </div>
}

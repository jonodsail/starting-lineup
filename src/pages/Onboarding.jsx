import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { useAuth } from '../lib/auth'

const FUNCTIONS = ['Strategy', 'Business Development', 'Partnerships', 'Finance', 'Investing', 'Marketing', 'Operations', 'Media Strategy', 'Product & Technology']
const SECTORS = ['Teams & Venues', 'Leagues & Governing Bodies', 'Media & Content', 'Commerce & Consumer', 'Finance & Investing', 'Gaming & Interactive', 'Agencies & Talent']
const LOCATIONS = ['Boston', 'New York', 'Los Angeles', 'San Francisco', 'Chicago', 'Remote', 'Open to relocate']
const steps = ['About you', 'Career direction', 'Preferences']

function MultiSelect({ options, selected, onChange }) {
  return <div className="flex flex-wrap gap-2">{options.map(option => <button type="button" key={option} onClick={() => onChange(selected.includes(option) ? selected.filter(item => item !== option) : [...selected, option])} className={`rounded-full border px-3.5 py-2 text-sm transition ${selected.includes(option) ? 'border-night bg-night text-white' : 'border-line bg-white text-ink-muted hover:border-ink/40'}`}>{selected.includes(option) && <Check size={13} className="mr-1 inline" />}{option}</button>)}</div>
}

export default function Onboarding() {
  const { member, profile, saveProfile } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState(profile || { name: member?.name || '', classYear: '', careerStage: '', functions: [], sectors: [], locations: [] })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const update = (key, value) => setForm(current => ({ ...current, [key]: value }))
  const canContinue = step === 0 ? form.name?.trim() && form.classYear : step === 1 ? form.functions?.length && form.sectors?.length : form.locations?.length
  const finish = async () => {
    setSaving(true)
    setSaveError('')
    try {
      await saveProfile(form)
      navigate('/dashboard', { replace: true })
    } catch {
      setSaveError('Your orientation could not be saved. Please try again in a moment.')
      setSaving(false)
    }
  }
  return <div className="min-h-screen bg-canvas px-5 py-8 md:px-10 lg:px-14"><div className="mx-auto max-w-3xl">
    <div className="flex items-center justify-between"><div><p className="eyebrow">Member orientation</p><p className="mt-1 text-sm text-ink-muted">A three-minute setup for a sharper search.</p></div><p className="text-xs font-semibold text-ink-muted">{step + 1} / {steps.length}</p></div>
    <div className="mt-6 grid grid-cols-3 gap-2">{steps.map((label, index) => <div key={label}><div className={`h-1 rounded-full ${index <= step ? 'bg-crimson' : 'bg-line'}`} /><p className={`mt-2 text-xs ${index === step ? 'font-semibold text-night' : 'text-ink-muted'}`}>{label}</p></div>)}</div>
    <section className="panel mt-8 p-6 md:p-10">
      {step === 0 && <div><h1 className="font-display text-4xl font-bold text-night">Welcome to your starting lineup.</h1><p className="mt-3 text-sm leading-6 text-ink-muted">Tell us where you are at HBS so we can prioritize the right opportunities.</p><div className="mt-8 grid gap-5 sm:grid-cols-2"><label className="sm:col-span-2"><span className="label">Full name</span><input className="input" value={form.name} onChange={event => update('name', event.target.value)} placeholder="Your name" /></label><label><span className="label">HBS class</span><select className="input" value={form.classYear} onChange={event => update('classYear', event.target.value)}><option value="">Select RC or EC</option><option>RC</option><option>EC</option></select></label><label><span className="label">Search stage</span><select className="input" value={form.careerStage} onChange={event => update('careerStage', event.target.value)}><option value="">Select one</option><option>Exploring sports</option><option>Actively recruiting</option><option>Networking first</option><option>Committed, staying connected</option></select></label></div></div>}
      {step === 1 && <div><h1 className="font-display text-4xl font-bold text-night">What work pulls you in?</h1><p className="mt-3 text-sm leading-6 text-ink-muted">Pick the functions and corners of the ecosystem you want us to prioritize.</p><div className="mt-8"><p className="label">Target functions</p><MultiSelect options={FUNCTIONS} selected={form.functions || []} onChange={value => update('functions', value)} /></div><div className="mt-7"><p className="label">Target sectors</p><MultiSelect options={SECTORS} selected={form.sectors || []} onChange={value => update('sectors', value)} /></div></div>}
      {step === 2 && <div><h1 className="font-display text-4xl font-bold text-night">Where can the search take you?</h1><p className="mt-3 text-sm leading-6 text-ink-muted">Choose all that apply. You can update this at any time.</p><div className="mt-8"><p className="label">Preferred locations</p><MultiSelect options={LOCATIONS} selected={form.locations || []} onChange={value => update('locations', value)} /></div><div className="mt-8 rounded-xl bg-cream p-5"><p className="text-sm font-semibold text-night">Your orientation is the first filter.</p><p className="mt-1 text-sm leading-6 text-ink-muted">Club officers still verify every role for MBA relevance. Your choices simply bring the best-fit subset to the top.</p></div></div>}
      <div className="mt-10 flex justify-between border-t border-line pt-6"><button disabled={step === 0} onClick={() => setStep(value => value - 1)} className="inline-flex items-center gap-2 text-sm font-semibold text-ink-muted disabled:invisible"><ArrowLeft size={16} />Back</button><button disabled={!canContinue || saving} onClick={() => step === steps.length - 1 ? finish() : setStep(value => value + 1)} className="btn-primary disabled:cursor-not-allowed disabled:opacity-35">{step === steps.length - 1 ? (saving ? 'Saving…' : 'Enter Starting Lineup') : 'Continue'}<ArrowRight size={16} /></button></div>
      {saveError && <p role="alert" className="mt-4 rounded-lg bg-crimson-soft px-4 py-3 text-sm text-crimson">{saveError}</p>}
    </section>
  </div></div>
}

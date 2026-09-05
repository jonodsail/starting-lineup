import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { LoaderCircle, LockKeyhole, Mail } from 'lucide-react'
import { useAuth } from '../lib/auth'

export default function Login() {
  const { member, authError, authNotice, signIn, enterPreview, isConfigured } = useAuth()
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSending(true)
    try {
      await signIn(email)
    } finally {
      setSending(false)
    }
  }

  if (member) return <Navigate to="/dashboard" replace />
  return <div className="min-h-screen bg-night text-white lg:grid lg:grid-cols-[1.1fr_0.9fr]">
    <section className="relative flex min-h-[46vh] flex-col justify-between overflow-hidden px-7 py-8 lg:min-h-screen lg:px-14 lg:py-12">
      <div className="field-lines absolute inset-0 opacity-30" />
      <div className="relative w-fit rounded-lg bg-white p-2"><img src="/brand/business-of-sports-horizontal.png" alt="HBS Business of Sports Club" className="h-16 w-56 object-contain" /></div>
      <div className="relative max-w-2xl py-14"><p className="text-xs font-bold uppercase tracking-[0.28em] text-crimson-light">Starting Lineup</p><h1 className="mt-5 font-display text-5xl font-bold leading-[0.98] tracking-tight md:text-7xl">Your path into the business of sports starts here.</h1><p className="mt-6 max-w-xl text-base leading-7 text-white/60">MBA-caliber opportunities, trusted alumni context, and one clear place to manage your search.</p></div>
      <p className="relative max-w-lg text-xs leading-5 text-white/35">An independent student project for members of the HBS Business of Sports Club. Not an official Harvard Business School product.</p>
    </section>
    <section className="flex items-center bg-canvas px-7 py-14 text-ink lg:px-16"><div className="mx-auto w-full max-w-md"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-crimson-soft text-crimson"><LockKeyhole size={22} /></div><h2 className="mt-6 font-display text-4xl font-bold text-night">Member access</h2><p className="mt-3 text-sm leading-6 text-ink-muted">Use your RC or EC HBS email. We’ll send a secure sign-in link to your Microsoft-managed inbox.</p>
      <form className="mt-8" onSubmit={handleSubmit}>
        <label className="label" htmlFor="hbs-email">HBS email address</label>
        <input id="hbs-email" className="input" type="email" autoComplete="email" inputMode="email" placeholder="yourname@mba2027.hbs.edu" value={email} onChange={(event) => setEmail(event.target.value)} disabled={sending} required />
        <p className="mt-2 text-xs leading-5 text-ink-muted">Access is limited to <strong className="font-semibold text-ink">@mba2027.hbs.edu</strong> and <strong className="font-semibold text-ink">@mba2028.hbs.edu</strong>.</p>
        <button type="submit" disabled={sending} className="btn-primary mt-5 w-full shadow-lg shadow-night/10 disabled:cursor-wait disabled:opacity-70">
          {sending ? <LoaderCircle aria-hidden="true" className="animate-spin" size={18} /> : <Mail aria-hidden="true" size={18} />}
          {sending ? 'Sending sign-in link…' : 'Email me a sign-in link'}
        </button>
      </form>
      {import.meta.env.DEV && <button onClick={enterPreview} className="mt-3 w-full rounded-xl border border-line bg-white px-5 py-3 text-sm font-semibold text-night hover:border-night">Preview the pilot locally</button>}
      {authError && <p role="alert" className="mt-4 rounded-lg bg-crimson-soft px-4 py-3 text-sm text-crimson">{authError}</p>}
      {authNotice && <p role="status" className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{authNotice} You can close this tab after the email arrives.</p>}
      {!isConfigured && <p className="mt-5 text-xs leading-5 text-ink-muted">The visual pilot is ready. Email sign-in activates after the club’s separate Supabase project is connected.</p>}
    </div></section>
  </div>
}

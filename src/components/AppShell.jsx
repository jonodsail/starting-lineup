import { BriefcaseBusiness, LayoutDashboard, Network, ShieldCheck, Target } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../lib/auth'

const navItems = [
  { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { to: '/opportunities', label: 'Opportunities', icon: BriefcaseBusiness },
  { to: '/alumni', label: 'Alumni', icon: Network },
  { to: '/tracker', label: 'My tracker', icon: Target },
]

export default function AppShell() {
  const { member, profile, isOfficer, signOut } = useAuth()
  const initials = (profile?.name || member?.name || 'HBS Member').split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div className="min-h-screen bg-canvas text-ink">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-line bg-night px-5 py-6 text-white lg:flex">
        <NavLink to="/dashboard" className="block rounded-lg bg-white p-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-crimson">
          <img src="/brand/business-of-sports-horizontal.png" alt="HBS Business of Sports Club" className="h-14 w-full object-contain" />
        </NavLink>
        <div className="mt-7 border-t border-white/10 pt-5">
          <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/45">Starting Lineup</p>
          <nav className="mt-3 space-y-1" aria-label="Primary navigation">
            {navItems.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${isActive ? 'bg-white text-night' : 'text-white/65 hover:bg-white/10 hover:text-white'}`}><Icon size={17} aria-hidden="true" />{label}</NavLink>)}
            {isOfficer && <NavLink to="/admin" className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${isActive ? 'bg-white text-night' : 'text-white/65 hover:bg-white/10 hover:text-white'}`}><ShieldCheck size={17} aria-hidden="true" />Officer desk</NavLink>}
          </nav>
        </div>
        <div className="mt-auto border-t border-white/10 pt-5">
          <div className="flex items-center gap-3 px-2"><span className="grid h-9 w-9 place-items-center rounded-full bg-crimson text-xs font-bold">{initials}</span><div className="min-w-0"><p className="truncate text-sm font-medium">{profile?.name || member?.name}</p><p className="truncate text-xs text-white/45">{profile?.classYear || 'HBS member'}</p></div></div>
          <button onClick={signOut} className="mt-4 px-2 text-xs text-white/45 hover:text-white">Sign out</button>
        </div>
      </aside>
      <header className="sticky top-0 z-10 border-b border-line bg-canvas/95 px-5 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between"><span className="font-display text-xl font-bold">STARTING LINEUP</span><span className="rounded-full bg-crimson px-3 py-1 text-xs font-bold text-white">{initials}</span></div>
        <nav className="mt-3 flex gap-1 overflow-x-auto" aria-label="Mobile navigation">{[...navItems, ...(isOfficer ? [{ to: '/admin', label: 'Officer' }] : [])].map(({ to, label }) => <NavLink key={to} to={to} className={({ isActive }) => `whitespace-nowrap rounded-full px-3 py-1.5 text-xs ${isActive ? 'bg-night text-white' : 'text-ink-muted'}`}>{label}</NavLink>)}</nav>
      </header>
      <main className="lg:pl-64"><Outlet /></main>
    </div>
  )
}

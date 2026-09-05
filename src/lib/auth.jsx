import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const ALLOWED_DOMAINS = new Set(['mba2027.hbs.edu', 'mba2028.hbs.edu'])
const STORAGE_KEY = 'starting_lineup_profile_v1'
const PREVIEW_MEMBER = { email: 'preview@mba2027.hbs.edu', name: 'Pilot Member', preview: true }

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null

const AuthContext = createContext(null)

function readPreviewMember() {
  return !supabase && import.meta.env.DEV && localStorage.getItem('starting_lineup_preview') === 'true' ? PREVIEW_MEMBER : null
}

function isAllowedHbsEmail(email = '') {
  const [, domain = ''] = email.trim().toLowerCase().split('@')
  return ALLOWED_DOMAINS.has(domain)
}

function readProfile() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') }
  catch { return null }
}

export function AuthProvider({ children }) {
  const [member, setMember] = useState(readPreviewMember)
  const [loading, setLoading] = useState(() => Boolean(supabase))
  const [profile, setProfile] = useState(readProfile)
  const [authError, setAuthError] = useState('')
  const [isOfficer, setIsOfficer] = useState(() => Boolean(readPreviewMember()))

  useEffect(() => {
    if (!supabase) return undefined
    const acceptSession = async (session) => {
      const email = session?.user?.email || ''
      if (session && !isAllowedHbsEmail(email)) {
        await supabase.auth.signOut()
        setMember(null)
        setAuthError('Starting Lineup is currently limited to RC and EC HBS email accounts.')
      } else {
        setMember(session ? { email, name: session.user.user_metadata?.full_name || email.split('@')[0] } : null)
        if (session) {
          const { data: officerAccess } = await supabase.rpc('is_club_officer')
          setIsOfficer(Boolean(officerAccess))
        } else {
          setIsOfficer(false)
        }
      }
      setLoading(false)
    }
    supabase.auth.getSession().then(({ data }) => acceptSession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => acceptSession(session))
    return () => listener.subscription.unsubscribe()
  }, [])

  const signIn = async () => {
    setAuthError('')
    if (!supabase) {
      setAuthError('Authentication is not configured yet. Add the Supabase environment values to enable HBS sign-in.')
      return
    }
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/dashboard`, queryParams: { hd: 'hbs.edu' } } })
  }
  const enterPreview = () => { if (import.meta.env.DEV) { localStorage.setItem('starting_lineup_preview', 'true'); setMember(PREVIEW_MEMBER); setIsOfficer(true); setAuthError('') } }
  const signOut = async () => {
    if (supabase) await supabase.auth.signOut()
    setMember(null); setProfile(null); setIsOfficer(false); localStorage.removeItem('starting_lineup_preview'); localStorage.removeItem(STORAGE_KEY)
  }
  const saveProfile = (nextProfile) => {
    const saved = { ...nextProfile, onboardingComplete: true, updatedAt: new Date().toISOString() }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved)); setProfile(saved)
  }
  return <AuthContext.Provider value={{ loading, member, profile, authError, isOfficer, isConfigured: Boolean(supabase), signIn, signOut, enterPreview, saveProfile }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside AuthProvider')
  return value
}

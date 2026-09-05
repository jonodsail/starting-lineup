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
  const parts = email.trim().toLowerCase().split('@')
  return parts.length === 2 && Boolean(parts[0]) && ALLOWED_DOMAINS.has(parts[1])
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
  const [authNotice, setAuthNotice] = useState('')
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

  const signIn = async (email) => {
    setAuthError('')
    setAuthNotice('')
    const normalizedEmail = email.trim().toLowerCase()
    if (!isAllowedHbsEmail(normalizedEmail)) {
      setAuthError('Use an @mba2027.hbs.edu or @mba2028.hbs.edu email address.')
      return false
    }
    if (!supabase) {
      setAuthError('Authentication is not configured yet. Add the Supabase environment values to enable HBS sign-in.')
      return false
    }
    const { error } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        shouldCreateUser: true,
      },
    })
    if (error) {
      setAuthError('We could not send the sign-in link. Please wait a moment and try again.')
      return false
    }
    setAuthNotice(`Check ${normalizedEmail} for your secure sign-in link.`)
    return true
  }
  const enterPreview = () => { if (import.meta.env.DEV) { localStorage.setItem('starting_lineup_preview', 'true'); setMember(PREVIEW_MEMBER); setIsOfficer(true); setAuthError(''); setAuthNotice('') } }
  const signOut = async () => {
    if (supabase) await supabase.auth.signOut()
    setMember(null); setProfile(null); setIsOfficer(false); setAuthNotice(''); localStorage.removeItem('starting_lineup_preview'); localStorage.removeItem(STORAGE_KEY)
  }
  const saveProfile = (nextProfile) => {
    const saved = { ...nextProfile, onboardingComplete: true, updatedAt: new Date().toISOString() }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved)); setProfile(saved)
  }
  return <AuthContext.Provider value={{ loading, member, profile, authError, authNotice, isOfficer, isConfigured: Boolean(supabase), signIn, signOut, enterPreview, saveProfile }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside AuthProvider')
  return value
}

export async function loadAlumniDirectory() {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('alumni')
    .select('id, full_name, hbs_class_year, company, title, linkedin_url, verified_at')
    .eq('is_current_role', true)
    .order('company')
    .order('full_name')

  if (error) throw error

  return data.map(person => ({
    id: person.id,
    name: person.full_name,
    classYear: person.hbs_class_year ? String(person.hbs_class_year) : '',
    company: person.company,
    title: person.title,
    linkedinUrl: person.linkedin_url,
    verifiedAt: person.verified_at,
  }))
}

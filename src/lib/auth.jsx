import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { formatAllowedDomains, isAllowedHbsEmail } from './config'
import { supabase } from './supabase'
import { loadMemberProfile, saveMemberProfile } from './db'

const PREVIEW_PROFILE_KEY = 'starting_lineup_preview_profile_v1'
const PREVIEW_FLAG_KEY = 'starting_lineup_preview'
const PREVIEW_MEMBER = { email: 'preview@mba2027.hbs.edu', name: 'Pilot Member', preview: true }

const AuthContext = createContext(null)

function isPreviewMode() {
  return !supabase && import.meta.env.DEV
}

function readPreviewMember() {
  return isPreviewMode() && localStorage.getItem(PREVIEW_FLAG_KEY) === 'true' ? PREVIEW_MEMBER : null
}

function readPreviewProfile() {
  if (!isPreviewMode()) return null
  try { return JSON.parse(localStorage.getItem(PREVIEW_PROFILE_KEY) || 'null') }
  catch { return null }
}

export function AuthProvider({ children }) {
  const [member, setMember] = useState(readPreviewMember)
  const [loading, setLoading] = useState(() => Boolean(supabase))
  const [profile, setProfile] = useState(readPreviewProfile)
  const [profileLoading, setProfileLoading] = useState(() => Boolean(supabase))
  const [authError, setAuthError] = useState('')
  const [authNotice, setAuthNotice] = useState('')
  const [isOfficer, setIsOfficer] = useState(() => Boolean(readPreviewMember()))

  useEffect(() => {
    if (!supabase) return undefined
    let active = true

    const acceptSession = async (session) => {
      const email = session?.user?.email || ''
      if (session && !isAllowedHbsEmail(email)) {
        await supabase.auth.signOut()
        if (!active) return
        setMember(null)
        setProfile(null)
        setProfileLoading(false)
        setAuthError('Starting Lineup is currently limited to RC and EC HBS email accounts.')
        setLoading(false)
        return
      }

      if (!active) return
      setMember(session ? { email, name: session.user.user_metadata?.full_name || email.split('@')[0] } : null)
      setLoading(false)

      if (!session) {
        setIsOfficer(false)
        setProfile(null)
        setProfileLoading(false)
        return
      }

      setProfileLoading(true)
      const [officerResult, memberProfile] = await Promise.all([
        supabase.rpc('is_club_officer'),
        loadMemberProfile().catch(() => null),
      ])
      if (!active) return
      setIsOfficer(Boolean(officerResult.data))
      setProfile(memberProfile)
      setProfileLoading(false)
    }

    supabase.auth.getSession().then(({ data }) => acceptSession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => acceptSession(session))
    return () => { active = false; listener.subscription.unsubscribe() }
  }, [])

  const signIn = async (email) => {
    setAuthError('')
    setAuthNotice('')
    const normalizedEmail = email.trim().toLowerCase()
    if (!isAllowedHbsEmail(normalizedEmail)) {
      setAuthError(`Use ${formatAllowedDomains('or')} email address.`)
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

  const enterPreview = () => {
    if (!isPreviewMode()) return
    localStorage.setItem(PREVIEW_FLAG_KEY, 'true')
    setMember(PREVIEW_MEMBER)
    setIsOfficer(true)
    setProfileLoading(false)
    setAuthError('')
    setAuthNotice('')
  }

  const signOut = async () => {
    if (supabase) await supabase.auth.signOut()
    setMember(null)
    setProfile(null)
    setIsOfficer(false)
    setAuthNotice('')
    localStorage.removeItem(PREVIEW_FLAG_KEY)
    localStorage.removeItem(PREVIEW_PROFILE_KEY)
  }

  const saveProfile = useCallback(async (nextProfile) => {
    if (!supabase) {
      const saved = { ...nextProfile, onboardingComplete: true, updatedAt: new Date().toISOString() }
      localStorage.setItem(PREVIEW_PROFILE_KEY, JSON.stringify(saved))
      setProfile(saved)
      return saved
    }
    const saved = await saveMemberProfile(nextProfile, member?.email)
    setProfile(saved)
    return saved
  }, [member?.email])

  const value = {
    loading,
    member,
    profile,
    profileLoading,
    authError,
    authNotice,
    isOfficer,
    isConfigured: Boolean(supabase),
    signIn,
    signOut,
    enterPreview,
    saveProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside AuthProvider')
  return value
}

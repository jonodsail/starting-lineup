import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabase'
import { opportunities as bundledOpportunities } from '../data/opportunities'
import { readNetwork, readTracker, writeNetwork, writeTracker } from './tracker'
import {
  loadNetwork,
  loadOpportunities,
  loadOpportunityInterest,
  removeFromNetwork,
  saveAlumnus,
  updateNetworkNote,
  loadTracker,
  removeTrackedOpportunity,
  saveTrackedOpportunity,
  updateTrackedOpportunity,
} from './db'

// Two modes, deliberately not mixed. With Supabase configured the database is
// the only source of truth. Without it (local preview) the bundled file and
// localStorage stand in. Blending them would let a browser-only record point at
// an opportunity the database has never heard of.

export function useOpportunities() {
  const [opportunities, setOpportunities] = useState(() => (supabase ? [] : bundledOpportunities))
  const [interest, setInterest] = useState({})
  const [loading, setLoading] = useState(() => Boolean(supabase))
  const [error, setError] = useState('')
  const [token, setToken] = useState(0)

  useEffect(() => {
    if (!supabase) return undefined
    let active = true
    loadOpportunities()
      .then(rows => { if (active) { setOpportunities(rows || []); setError('') } })
      .catch(() => { if (active) setError('The opportunity board could not load.') })
      .finally(() => { if (active) setLoading(false) })
    // Interest is decoration, not content: a failure here leaves the board
    // fully usable, so it never sets the page error.
    loadOpportunityInterest()
      .then(counts => { if (active) setInterest(counts) })
      .catch(() => {})
    return () => { active = false }
  }, [token])

  const retry = useCallback(() => {
    if (!supabase) return
    setLoading(true)
    setToken(value => value + 1)
  }, [])

  return { opportunities, interest, loading, error, retry }
}

export function useTracker() {
  const [items, setItems] = useState(() => (supabase ? [] : readTracker()))
  const [loading, setLoading] = useState(() => Boolean(supabase))
  const [error, setError] = useState('')
  const [token, setToken] = useState(0)

  useEffect(() => {
    if (!supabase) return undefined
    let active = true
    loadTracker()
      .then(rows => { if (active) { setItems(rows || []); setError('') } })
      .catch(() => { if (active) setError('Your tracker could not load.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [token])

  const retry = useCallback(() => {
    if (!supabase) return
    setLoading(true)
    setToken(value => value + 1)
  }, [])

  const save = useCallback(async (opportunity) => {
    const entry = { ...opportunity, stage: 'Saved', savedAt: new Date().toISOString(), notes: '' }
    let previous
    setItems(current => {
      previous = current
      return current.some(item => item.id === opportunity.id) ? current : [entry, ...current]
    })
    if (!supabase) { writeTracker([entry, ...readTracker().filter(item => item.id !== opportunity.id)]); return }
    try {
      await saveTrackedOpportunity(opportunity.id)
    } catch {
      setItems(previous)
      setError('That role could not be saved. Try again in a moment.')
    }
  }, [])

  const update = useCallback(async (id, patch) => {
    let previous
    setItems(current => {
      previous = current
      return current.map(item => (item.id === id ? { ...item, ...patch } : item))
    })
    if (!supabase) { writeTracker(readTracker().map(item => (item.id === id ? { ...item, ...patch } : item))); return }
    try {
      await updateTrackedOpportunity(id, patch)
    } catch {
      setItems(previous)
      setError('That change could not be saved. Try again in a moment.')
    }
  }, [])

  const remove = useCallback(async (id) => {
    let previous
    setItems(current => {
      previous = current
      return current.filter(item => item.id !== id)
    })
    if (!supabase) { writeTracker(readTracker().filter(item => item.id !== id)); return }
    try {
      await removeTrackedOpportunity(id)
    } catch {
      setItems(previous)
      setError('That role could not be removed. Try again in a moment.')
    }
  }, [])

  return { items, loading, error, retry, save, update, remove }
}

// The people half of the personal workspace. Deliberately a plain saved list:
// no stages, so there is no half-updated pipeline to maintain.
export function useNetwork() {
  const [items, setItems] = useState(() => (supabase ? [] : readNetwork()))
  const [loading, setLoading] = useState(() => Boolean(supabase))
  const [error, setError] = useState('')
  const [token, setToken] = useState(0)

  useEffect(() => {
    if (!supabase) return undefined
    let active = true
    loadNetwork()
      .then(rows => { if (active) { setItems(rows || []); setError('') } })
      .catch(() => { if (active) setError('Your network could not load.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [token])

  const retry = useCallback(() => {
    if (!supabase) return
    setLoading(true)
    setToken(value => value + 1)
  }, [])

  const save = useCallback(async (alumnus) => {
    const entry = { ...alumnus, note: '', savedAt: new Date().toISOString() }
    let previous
    setItems(current => {
      previous = current
      return current.some(item => item.id === alumnus.id) ? current : [entry, ...current]
    })
    if (!supabase) { writeNetwork([entry, ...readNetwork().filter(item => item.id !== alumnus.id)]); return }
    try {
      await saveAlumnus(alumnus.id)
    } catch {
      setItems(previous)
      setError('That person could not be saved. Try again in a moment.')
    }
  }, [])

  const update = useCallback(async (id, patch) => {
    let previous
    setItems(current => {
      previous = current
      return current.map(item => (item.id === id ? { ...item, ...patch } : item))
    })
    if (!supabase) { writeNetwork(readNetwork().map(item => (item.id === id ? { ...item, ...patch } : item))); return }
    try {
      await updateNetworkNote(id, patch.note ?? '')
    } catch {
      setItems(previous)
      setError('That note could not be saved. Try again in a moment.')
    }
  }, [])

  const remove = useCallback(async (id) => {
    let previous
    setItems(current => {
      previous = current
      return current.filter(item => item.id !== id)
    })
    if (!supabase) { writeNetwork(readNetwork().filter(item => item.id !== id)); return }
    try {
      await removeFromNetwork(id)
    } catch {
      setItems(previous)
      setError('That person could not be removed. Try again in a moment.')
    }
  }, [])

  return { items, loading, error, retry, save, update, remove }
}

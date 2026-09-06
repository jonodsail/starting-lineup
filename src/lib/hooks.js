import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabase'
import { opportunities as bundledOpportunities } from '../data/opportunities'
import { readTracker, writeTracker } from './tracker'
import {
  loadOpportunities,
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
  const [loading, setLoading] = useState(() => Boolean(supabase))
  const [error, setError] = useState('')

  useEffect(() => {
    if (!supabase) return undefined
    let active = true
    loadOpportunities()
      .then(rows => { if (active) setOpportunities(rows || []) })
      .catch(() => { if (active) setError('The opportunity board could not load. Reload the page to try again.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  return { opportunities, loading, error }
}

export function useTracker() {
  const [items, setItems] = useState(() => (supabase ? [] : readTracker()))
  const [loading, setLoading] = useState(() => Boolean(supabase))
  const [error, setError] = useState('')

  useEffect(() => {
    if (!supabase) return undefined
    let active = true
    loadTracker()
      .then(rows => { if (active) setItems(rows || []) })
      .catch(() => { if (active) setError('Your tracker could not load. Reload the page to try again.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
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

  return { items, loading, error, save, update, remove }
}

const KEY = 'starting_lineup_tracker_v1'
export function readTracker() { try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] } }
export function writeTracker(items) { localStorage.setItem(KEY, JSON.stringify(items)) }
export function makeTrackedOpportunity(opportunity) { return { ...opportunity, stage: 'Saved', savedAt: new Date().toISOString(), notes: '' } }

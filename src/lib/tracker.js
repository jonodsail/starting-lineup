// Local-preview tracker storage. Signed-in members use the saved_opportunities
// table instead; see src/lib/db.js.
const KEY = 'starting_lineup_tracker_v1'

export function readTracker() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') }
  catch { return [] }
}

export function writeTracker(items) {
  localStorage.setItem(KEY, JSON.stringify(items))
}

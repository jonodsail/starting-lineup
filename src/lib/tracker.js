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

// The local-preview equivalent for saved alumni. Signed-in members use the
// saved_alumni table instead.
const NETWORK_KEY = 'starting_lineup_network_v1'

export function readNetwork() {
  try { return JSON.parse(localStorage.getItem(NETWORK_KEY) || '[]') }
  catch { return [] }
}

export function writeNetwork(items) {
  localStorage.setItem(NETWORK_KEY, JSON.stringify(items))
}

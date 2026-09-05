const KEY = 'starting_lineup_submissions_v1'

export function readSubmissions() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') }
  catch { return [] }
}

export function addSubmission(submission) {
  const next = [submission, ...readSubmissions()]
  localStorage.setItem(KEY, JSON.stringify(next))
  return next
}

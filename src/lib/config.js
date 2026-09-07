// Who may sign in is data, not code: the list lives in the allowed_email_domains
// table and officers edit it from the officer desk. These values are only a
// fallback for the moment before the list loads, or if the request fails — the
// database enforces the real rule regardless of what the browser believes.
export const FALLBACK_EMAIL_DOMAINS = ['mba2027.hbs.edu', 'mba2028.hbs.edu']

export function emailDomain(email = '') {
  const parts = email.trim().toLowerCase().split('@')
  return parts.length === 2 && parts[0] ? parts[1] : ''
}

export function isAllowedEmail(email, domains = FALLBACK_EMAIL_DOMAINS) {
  const domain = emailDomain(email)
  return Boolean(domain) && domains.includes(domain)
}

export function formatDomains(domains = FALLBACK_EMAIL_DOMAINS, conjunction = 'and') {
  const labels = domains.map(domain => `@${domain}`)
  if (labels.length === 0) return ''
  if (labels.length === 1) return labels[0]
  return `${labels.slice(0, -1).join(', ')} ${conjunction} ${labels[labels.length - 1]}`
}

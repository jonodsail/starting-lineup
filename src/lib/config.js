// Membership is scoped to the two current HBS MBA class domains. When a new
// class arrives, update this list and the matching regex in supabase/schema.sql
// (public.is_allowed_hbs_member). Those are the only two places that decide access.
export const ALLOWED_EMAIL_DOMAINS = ['mba2027.hbs.edu', 'mba2028.hbs.edu']

const allowedDomainSet = new Set(ALLOWED_EMAIL_DOMAINS)

export function isAllowedHbsEmail(email = '') {
  const parts = email.trim().toLowerCase().split('@')
  return parts.length === 2 && Boolean(parts[0]) && allowedDomainSet.has(parts[1])
}

export function formatAllowedDomains(conjunction = 'and') {
  const labels = ALLOWED_EMAIL_DOMAINS.map(domain => `@${domain}`)
  if (labels.length < 2) return labels[0] || ''
  return `${labels.slice(0, -1).join(', ')} ${conjunction} ${labels[labels.length - 1]}`
}

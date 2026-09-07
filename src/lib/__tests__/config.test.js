import { describe, expect, it } from 'vitest'
import { emailDomain, formatDomains, isAllowedEmail } from '../config'

const DOMAINS = ['mba2027.hbs.edu', 'mba2028.hbs.edu']

describe('emailDomain', () => {
  it('lowercases and trims', () => {
    expect(emailDomain('  Someone@MBA2027.hbs.edu ')).toBe('mba2027.hbs.edu')
  })

  it('rejects anything that is not one local part and one domain', () => {
    expect(emailDomain('nobody')).toBe('')
    expect(emailDomain('@mba2027.hbs.edu')).toBe('')
    expect(emailDomain('a@b@c')).toBe('')
    expect(emailDomain('')).toBe('')
  })
})

describe('isAllowedEmail', () => {
  it('accepts a listed domain in any case', () => {
    expect(isAllowedEmail('Someone@MBA2027.hbs.edu', DOMAINS)).toBe(true)
  })

  it('rejects an unlisted domain', () => {
    expect(isAllowedEmail('someone@gmail.com', DOMAINS)).toBe(false)
    expect(isAllowedEmail('someone@hbs.edu', DOMAINS)).toBe(false)
  })

  it('rejects a domain that merely ends with a listed one', () => {
    expect(isAllowedEmail('someone@evil-mba2027.hbs.edu', DOMAINS)).toBe(false)
    expect(isAllowedEmail('someone@mba2027.hbs.edu.example.com', DOMAINS)).toBe(false)
  })

  it('rejects everyone when the list is empty', () => {
    expect(isAllowedEmail('someone@mba2027.hbs.edu', [])).toBe(false)
  })
})

describe('formatDomains', () => {
  it('joins two domains with the given conjunction', () => {
    expect(formatDomains(DOMAINS)).toBe('@mba2027.hbs.edu and @mba2028.hbs.edu')
    expect(formatDomains(DOMAINS, 'or')).toBe('@mba2027.hbs.edu or @mba2028.hbs.edu')
  })

  it('handles one, three and none', () => {
    expect(formatDomains(['a.edu'])).toBe('@a.edu')
    expect(formatDomains(['a.edu', 'b.edu', 'c.edu'])).toBe('@a.edu, @b.edu and @c.edu')
    expect(formatDomains([])).toBe('')
  })
})

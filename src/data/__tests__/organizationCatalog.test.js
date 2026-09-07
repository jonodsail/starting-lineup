import { describe, expect, it } from 'vitest'
import {
  canonicalizeOrganization,
  majorLeagueOrganizations,
  organizationSearchText,
  organizationsMatch,
} from '../organizationCatalog'

describe('organizationsMatch', () => {
  it('matches a name to itself', () => {
    expect(organizationsMatch('Athletics', 'Athletics')).toBe(true)
    expect(organizationsMatch('NBA', 'NBA')).toBe(true)
  })

  it('ignores case, punctuation and accents', () => {
    expect(organizationsMatch('St. Louis CITY SC', 'St Louis City SC')).toBe(true)
    expect(organizationsMatch('Montreal Canadiens', 'Montréal Canadiens')).toBe(true)
  })

  it('treats a name that extends another from the front as the same employer', () => {
    expect(organizationsMatch('Los Angeles Lakers', 'Los Angeles Lakers Foundation')).toBe(true)
  })

  it('does not match on a shared ending', () => {
    // The bug this replaced: free-text company names on alumni records meant
    // any name ending in a club's name absorbed it.
    expect(organizationsMatch('Athletics', 'Stanford Athletics')).toBe(false)
    expect(organizationsMatch('New York Yankees', 'Yankees Entertainment and Sports Network')).toBe(false)
  })

  it('does not let a single word absorb a longer name', () => {
    expect(organizationsMatch('Boston Red Sox', 'Red Sox')).toBe(false)
    expect(organizationsMatch('Fanatics', 'Fanatics Betting & Gaming')).toBe(false)
    expect(organizationsMatch('Legends', 'Legends Global Partnerships')).toBe(false)
  })

  it('keeps distinct organizations apart', () => {
    expect(organizationsMatch('Los Angeles Lakers', 'Los Angeles Dodgers')).toBe(false)
    expect(organizationsMatch('Kraft Analytics Group', 'Kraft Sports & Entertainment')).toBe(false)
  })

  it('ignores legal entity endings but not meaningful words', () => {
    expect(organizationsMatch('Nike', 'Nike, Inc.')).toBe(true)
    expect(organizationsMatch('Kraft Analytics Group', 'Kraft Analytics Group LLC')).toBe(true)
    expect(organizationsMatch('Endeavor', 'Endeavor Group Holdings')).toBe(false)
  })

  it('matches through the alias groups', () => {
    expect(organizationsMatch('LAFC', 'Los Angeles Football Club')).toBe(true)
    expect(organizationsMatch('Prime Video', 'Amazon Prime Video Sports')).toBe(true)
    expect(organizationsMatch('Prime Video', 'Prime Video Sports')).toBe(true)
  })

  it('never matches an empty name', () => {
    expect(organizationsMatch('', 'Nike')).toBe(false)
    expect(organizationsMatch('Nike', '')).toBe(false)
  })

  it('is symmetric', () => {
    const pairs = [
      ['Athletics', 'Stanford Athletics'],
      ['Los Angeles Lakers', 'Los Angeles Lakers Foundation'],
      ['Nike', 'Nike, Inc.'],
      ['Fanatics', 'Fanatics Collectibles'],
    ]
    for (const [left, right] of pairs) {
      expect(organizationsMatch(left, right)).toBe(organizationsMatch(right, left))
    }
  })
})

describe('canonicalizeOrganization', () => {
  it('resolves aliases to one canonical name', () => {
    expect(canonicalizeOrganization('LAFC')).toBe('Los Angeles Football Club')
    expect(canonicalizeOrganization('Amazon Prime Video')).toBe('Prime Video & Amazon MGM Studios')
  })

  it('leaves an unknown name alone, trimmed', () => {
    expect(canonicalizeOrganization('  Some New Team  ')).toBe('Some New Team')
  })
})

describe('the league catalogue', () => {
  it('covers the seven leagues without duplicates', () => {
    expect(majorLeagueOrganizations.length).toBeGreaterThan(150)
    expect(new Set(majorLeagueOrganizations).size).toBe(majorLeagueOrganizations.length)
  })

  it('includes clubs the old editorial list missed', () => {
    expect(majorLeagueOrganizations).toContain('Los Angeles Dodgers')
    expect(majorLeagueOrganizations).toContain('Boston Red Sox')
  })

  it('makes aliases searchable from the canonical name', () => {
    expect(organizationSearchText('Los Angeles Football Club')).toContain('lafc')
  })
})

/**
 * scripts/scrapeJobs.js
 *
 * Scrapes real job listings from Teamwork Online's public job board
 * and writes them to src/data/realJobs.json.
 *
 * Usage:
 *   npm run scrape:jobs
 *   npm run scrape:jobs -- --debug   (saves raw HTML to scripts/debug.html)
 *
 * Requirements: node-fetch, cheerio (both in devDependencies)
 */

import fetch from 'node-fetch'
import * as cheerio from 'cheerio'
import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT      = join(__dirname, '..')
const OUT_PATH  = join(ROOT, 'src', 'data', 'realJobs.json')
const DEBUG     = process.argv.includes('--debug')

const BASE_URL = 'https://www.teamworkonline.com'
const JOBS_URL = `${BASE_URL}/jobs`

// ── Fetch helpers ─────────────────────────────────────────────────────────────

async function fetchPage(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
        '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    timeout: 20000,
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`)
  return res.text()
}

// ── Parsing logic ─────────────────────────────────────────────────────────────

/**
 * Given a Cheerio node that may contain location text,
 * returns a cleaned location string.
 */
function cleanText(str) {
  return (str || '').replace(/\s+/g, ' ').trim()
}

/**
 * Attempt to extract job listings from Teamwork Online's HTML.
 *
 * Teamwork Online uses a React-rendered job list. Jobs appear in elements
 * matching selectors like:
 *   .views-row             — Drupal view row (legacy)
 *   .job-listing           — generic job card
 *   article                — newer card-based layouts
 *   [data-job-id]          — custom attribute
 *   .position-listing-item — common Teamwork pattern
 *
 * We try selectors in priority order and return the first that yields results.
 */
function parseJobs(html) {
  const $ = cheerio.load(html)

  const strategies = [
    // Strategy A: Teamwork Online card layout (confirmed via HTML inspection)
    // The <a> element IS .browse-jobs-card__content--title (not a child of it).
    () => {
      const jobs = []
      $('.browse-jobs-card').each((_, el) => {
        const $el = $(el)

        // Title link: <a class="browse-jobs-card__content--title" href="...">
        const titleLink = $el.find('a.browse-jobs-card__content--title').first()
        const title     = cleanText(titleLink.find('div').first().text() || titleLink.text())
        const href      = titleLink.attr('href')
        if (!title || title.length < 3 || !href) return

        const url = href.startsWith('http') ? href : `${BASE_URL}${href}`

        // Company name from org element, fall back to image alt
        const company = cleanText(
          $el.find('.browse-jobs-card__content--organization').first().text() ||
          $el.find('.browse-jobs-card__image img').first().attr('alt') || ''
        )

        // Location: first .trending__content--small, clean "City · ST" → "City, ST"
        const rawLoc   = $el.find('.trending__content--small').first().text()
        const location = cleanText(rawLoc).replace(/\s*·\s*/g, ', ')

        // Employment type from the badge (Full Time / Part Time / Intern)
        const type = cleanText($el.find('.browse-jobs-card__content--small').first().text()) || 'Full Time'

        jobs.push({ title, company, location, type, url })
      })
      return jobs
    },

    // Strategy B: .position-listing-item rows
    () => {
      const jobs = []
      $('.position-listing-item, .TeamworkJobs__item, .job-item').each((_, el) => {
        const $el     = $(el)
        const titleEl = $el.find('a[href*="/job"], a[href*="/position"], h2 a, h3 a, .position-title, .job-title').first()
        const title   = cleanText(titleEl.text())
        const href    = titleEl.attr('href')
        if (!title || !href) return

        const url      = href.startsWith('http') ? href : `${BASE_URL}${href}`
        const company  = cleanText($el.find('.company, .organization, .employer, .team-name, [class*="company"]').first().text())
        const location = cleanText($el.find('.location, .city, [class*="location"], [class*="city"]').first().text())

        jobs.push({ title, company, location, type: 'Full Time', url })
      })
      return jobs
    },

    // Strategy C: generic <article> or .views-row containers
    () => {
      const jobs = []
      $('article, .views-row, .job-listing, .job-row').each((_, el) => {
        const $el     = $(el)
        const titleEl = $el.find('a').filter((_, a) => {
          const href = $(a).attr('href') || ''
          return href.includes('/job') || href.includes('/position') || href.includes('/employment')
        }).first()
        const title = cleanText(titleEl.text())
        const href  = titleEl.attr('href')
        if (!title || title.length < 3 || !href) return

        const url      = href.startsWith('http') ? href : `${BASE_URL}${href}`
        const company  = cleanText($el.find('.company, .organization, .employer').first().text())
        const location = cleanText($el.find('.location, .city, .state').first().text())

        jobs.push({ title, company, location, type: 'Full Time', url })
      })
      return jobs
    },

    // Strategy D: table rows (older Teamwork Online layouts)
    () => {
      const jobs = []
      $('table tr').each((_, row) => {
        const $row    = $(row)
        const titleEl = $row.find('a[href*="/job"], a[href*="/position"]').first()
        const title   = cleanText(titleEl.text())
        const href    = titleEl.attr('href')
        if (!title || !href) return

        const url      = href.startsWith('http') ? href : `${BASE_URL}${href}`
        const cells    = $row.find('td').map((_, td) => cleanText($(td).text())).get()
        const company  = cells[1] || ''
        const location = cells[2] || ''

        jobs.push({ title, company, location, type: 'Full Time', url })
      })
      return jobs
    },

    // Strategy E: real job detail URLs as last resort
    // Teamwork Online job detail URLs end with a numeric ID: /{cat}-jobs/{org}/{org}/{slug}-{id}
    () => {
      const seen = new Set()
      const jobs = []
      $('a[href*="-jobs/"]').each((_, a) => {
        const $a   = $(a)
        const href = $a.attr('href') || ''
        // Job detail pages have 4+ path segments AND end with a digit (the job ID)
        const parts = href.split('/').filter(Boolean)
        if (parts.length < 4 || !/\d+$/.test(href)) return
        if (seen.has(href)) return
        seen.add(href)

        const title = cleanText($a.text())
        if (!title || title.length < 3) return

        const url = href.startsWith('http') ? href : `${BASE_URL}${href}`
        jobs.push({ title, company: '', location: '', type: 'Full Time', url })
      })
      return jobs
    },
  ]

  for (const [i, strategy] of strategies.entries()) {
    const jobs = strategy()
    if (jobs.length > 0) {
      console.log(`  Strategy ${String.fromCharCode(65 + i)} matched: ${jobs.length} listings`)
      return jobs
    }
  }
  return []
}

// ── Dedup and normalize ───────────────────────────────────────────────────────

function dedupe(jobs) {
  const seen = new Set()
  return jobs.filter(job => {
    const key = `${job.title.toLowerCase()}|${job.url}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`Fetching ${JOBS_URL} …`)
  const html = await fetchPage(JOBS_URL)
  console.log(`  Received ${(html.length / 1024).toFixed(1)} KB`)

  if (DEBUG) {
    const debugPath = join(__dirname, 'debug.html')
    writeFileSync(debugPath, html, 'utf8')
    console.log(`  Debug HTML saved to ${debugPath}`)
  }

  const raw  = parseJobs(html)
  const jobs = dedupe(raw)

  if (jobs.length === 0) {
    console.warn(
      '\n⚠  No job listings extracted.\n' +
      '   Teamwork Online may render jobs via JavaScript (client-side).\n' +
      '   Run with --debug to inspect the raw HTML and adjust the selectors.\n' +
      '   You may need a headless browser (e.g. Puppeteer) for JS-rendered content.\n'
    )
    // Write an empty file with a metadata note so the app can gracefully handle it
    const output = { scrapedAt: new Date().toISOString(), source: JOBS_URL, jobs: [] }
    writeFileSync(OUT_PATH, JSON.stringify(output, null, 2), 'utf8')
    process.exit(0)
  }

  console.log(`\nExtracted ${jobs.length} unique listings.`)
  console.log('Sample:')
  jobs.slice(0, 3).forEach((j, i) =>
    console.log(`  [${i + 1}] "${j.title}" — ${j.company || '(company n/a)'} — ${j.location || '(location n/a)'}`)
  )

  const output = {
    scrapedAt: new Date().toISOString(),
    source: JOBS_URL,
    jobs,
  }

  mkdirSync(join(ROOT, 'src', 'data'), { recursive: true })
  writeFileSync(OUT_PATH, JSON.stringify(output, null, 2), 'utf8')
  console.log(`\n✓ Saved ${jobs.length} jobs to src/data/realJobs.json`)
}

main().catch(err => {
  console.error('Scrape failed:', err.message)
  process.exit(1)
})

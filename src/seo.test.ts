import { describe, expect, it } from 'vitest'
import { llmsFullTxt, llmsTxt, markdownPages, sitemapXml } from './llms'
import { allRoutes, headFor, headHtml } from './seo'
import { SITE_URL } from './site'
import { SEARCH_GUIDE } from './topics/searching/guide'
import { SEARCHES } from './topics/searching/registry'
import { GUIDE } from './topics/sorting/guide'
import { GRAPHS } from './topics/graphs/registry'
import { TREES } from './topics/trees/registry'
import { ALGORITHMS } from './topics/sorting/registry'

const indexable = allRoutes().filter((r) => r.priority != null)

describe('seo', () => {
  it('gives every indexable page a unique title, description and self canonical', () => {
    const titles = new Set<string>()
    const descriptions = new Set<string>()
    for (const { path } of indexable) {
      const h = headFor(path)
      expect(h.noindex, path).toBeFalsy()
      expect(h.canonical, path).toBe(path === '/' ? `${SITE_URL}/` : SITE_URL + path)
      expect(h.title.length, path).toBeLessThanOrEqual(75)
      expect(h.description.length, path).toBeGreaterThan(80)
      titles.add(h.title)
      descriptions.add(h.description)
    }
    expect(titles.size).toBe(indexable.length)
    expect(descriptions.size).toBe(indexable.length)
  })

  it('keeps placeholders and unknown paths out of the index', () => {
    for (const { path } of allRoutes().filter((r) => r.priority == null)) expect(headFor(path).noindex, path).toBe(true)
    expect(headFor('/sorting/nope').noindex).toBe(true)
    expect(headFor('/searching/nope').noindex).toBe(true)
    expect(headFor('/trees/nope').noindex).toBe(true)
    expect(headFor('/graphs/nope').noindex).toBe(true)
    expect(headHtml(headFor('/nope'))).not.toContain('rel="canonical"')
  })

  it('has guide text for every algorithm', () => {
    for (const a of ALGORITHMS) expect(GUIDE[a.id]?.use, a.id).toBeTruthy()
    for (const a of SEARCHES) expect(SEARCH_GUIDE[a.id]?.use, a.id).toBeTruthy()
  })

  it('lists every indexable page in the sitemap and every algorithm in llms.txt', () => {
    const xml = sitemapXml('2026-01-01')
    for (const { path } of indexable) expect(xml).toContain(`<loc>${path === '/' ? `${SITE_URL}/` : SITE_URL + path}</loc>`)
    const txt = llmsTxt()
    for (const a of ALGORITHMS) expect(txt).toContain(`${SITE_URL}/sorting/${a.id}`)
    for (const a of SEARCHES) expect(txt).toContain(`${SITE_URL}/searching/${a.id}`)
    for (const a of SEARCHES) expect(llmsFullTxt()).toContain(`## ${a.name}`)
    for (const t of TREES) expect(txt).toContain(`${SITE_URL}/trees/${t.id}`)
    for (const t of TREES) expect(llmsFullTxt()).toContain(`## ${t.name}`)
    for (const a of GRAPHS) expect(txt).toContain(`${SITE_URL}/graphs/${a.id}`)
    for (const a of GRAPHS) expect(llmsFullTxt()).toContain(`## ${a.name}`)
  })

  it('writes a Markdown copy of every algorithm page', () => {
    const paths = markdownPages().map(([p]) => p)
    for (const a of ALGORITHMS) expect(paths).toContain(`sorting/${a.id}.md`)
    for (const a of SEARCHES) expect(paths).toContain(`searching/${a.id}.md`)
    for (const t of TREES) expect(paths).toContain(`trees/${t.id}.md`)
    for (const a of GRAPHS) expect(paths).toContain(`graphs/${a.id}.md`)
    expect(new Set(paths).size).toBe(paths.length)
  })
})

import type { Listing } from './types'

export interface ParsedListing {
  lines: string[]
  /** label -> zero-based line numbers */
  labels: Map<string, number[]>
}

const MARKER = {
  js: /\s*\/\/\s*((?:@[\w-]+\s*)+)$/,
  py: /\s*#\s*((?:@[\w-]+\s*)+)$/,
  cpp: /\s*\/\/\s*((?:@[\w-]+\s*)+)$/,
}

const cache = new WeakMap<Listing, ParsedListing>()

/** Strip the `@label` markers out of a listing and index them by line. */
export function parseListing(listing: Listing): ParsedListing {
  const hit = cache.get(listing)
  if (hit) return hit
  const labels = new Map<string, number[]>()
  const raw = listing.source.replace(/^\n+|\s+$/g, '').split('\n')
  const lines = raw.map((line, i) => {
    const m = line.match(MARKER[listing.lang])
    if (!m) return line
    for (const tag of m[1].trim().split(/\s+/)) {
      const name = tag.slice(1)
      labels.set(name, [...(labels.get(name) ?? []), i])
    }
    return line.slice(0, m.index).replace(/\s+$/, '')
  })
  const parsed = { lines, labels }
  cache.set(listing, parsed)
  return parsed
}

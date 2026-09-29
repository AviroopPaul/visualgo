/**
 * Per-route <head>: title, description, canonical, social tags and JSON-LD.
 * Used by the prerenderer (static HTML for crawlers) and by the client on
 * every navigation, so both always agree.
 */
import { TOPICS, topicById } from './catalog'
import { abs, AUTHOR, OG_IMAGE, REPO_URL, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from './site'
import { guideFor } from './topics/sorting/guide'
import { ALGORITHMS, byId } from './topics/sorting/registry'
import type { SortAlgorithm } from './topics/sorting/types'

export interface Head {
  title: string
  description: string
  /** Absolute canonical URL. Omitted for pages that should not be indexed. */
  canonical?: string
  noindex?: boolean
  jsonLd: object[]
}

export interface RouteEntry {
  path: string
  /** Listed in sitemap.xml (indexable pages only). */
  priority?: number
}

/** Every URL the prerenderer writes. */
export function allRoutes(): RouteEntry[] {
  return [
    { path: '/', priority: 1 },
    { path: '/sorting', priority: 0.9 },
    ...ALGORITHMS.map((a) => ({ path: `/sorting/${a.id}`, priority: 0.8 })),
    { path: '/sorting/race', priority: 0.7 },
    // Planned topics render a placeholder; kept out of the index until they ship.
    ...TOPICS.filter((t) => t.status === 'soon').map((t) => ({ path: `/${t.id}` })),
  ]
}

const titleCase = (name: string) => name.replace(/\b[a-z]/g, (c) => c.toUpperCase())

const author = { '@type': 'Person', name: AUTHOR.name, url: AUTHOR.url }
const website = { '@type': 'WebSite', '@id': `${SITE_URL}/#website`, name: SITE_NAME, url: abs('/') }

function breadcrumbs(items: [string, string][]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: abs(path) })),
  }
}

export function algoDescription(a: SortAlgorithm) {
  return `${a.name} visualization: ${a.tagline.charAt(0).toLowerCase() + a.tagline.slice(1).replace(/\.$/, '')}. Watch every compare and swap animated step by step, with Python, JavaScript and C++ code. ${a.complexity.average} average.`
}

function algoHead(a: SortAlgorithm): Head {
  const g = guideFor(a)
  const url = abs(`/sorting/${a.id}`)
  return {
    title: `${titleCase(a.name)} Visualization: Step-by-Step Animation | ${SITE_NAME}`,
    description: algoDescription(a),
    canonical: url,
    jsonLd: [
      {
        '@type': 'LearningResource',
        name: `${a.name} visualization`,
        headline: `${a.name}, animated step by step`,
        description: algoDescription(a),
        url,
        image: OG_IMAGE,
        inLanguage: 'en',
        isAccessibleForFree: true,
        learningResourceType: ['Interactive visualization', 'Simulation'],
        educationalUse: 'Self-study',
        teaches: `How ${a.name.toLowerCase()} works, its time and space complexity, and how to implement it`,
        about: { '@type': 'Thing', name: a.name, alternateName: g.aka, sameAs: g.wikipedia },
        programmingLanguage: ['Python', 'JavaScript', 'C++'],
        isPartOf: { '@id': `${SITE_URL}/#website` },
        author,
      },
      breadcrumbs([
        [SITE_NAME, '/'],
        ['Sorting', '/sorting'],
        [a.name, `/sorting/${a.id}`],
      ]),
    ],
  }
}

export function headFor(pathname: string): Head {
  const path = pathname.replace(/\/+$/, '') || '/'

  if (path === '/') {
    return {
      title: `Algorithm Visualizer: See Algorithms Animated Step by Step | ${SITE_NAME}`,
      description: `${SITE_NAME} is a free, interactive algorithm visualizer. Watch ${ALGORITHMS.length} sorting algorithms animate step by step, race them side by side, and follow Python, JavaScript and C++ code line by line.`,
      canonical: abs('/'),
      jsonLd: [
        { ...website, description: SITE_DESCRIPTION, inLanguage: 'en', publisher: author },
        {
          '@type': 'WebApplication',
          name: SITE_NAME,
          url: abs('/'),
          description: SITE_DESCRIPTION,
          image: OG_IMAGE,
          applicationCategory: 'EducationalApplication',
          operatingSystem: 'Any (runs in the browser)',
          browserRequirements: 'Requires JavaScript',
          isAccessibleForFree: true,
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          featureList: [
            `${ALGORITHMS.length} animated sorting algorithms`,
            'Step forward and backward through every compare, swap and write',
            'Race mode: run several sorting algorithms on the same input',
            'Python, JavaScript and C++ code synced to the animation',
            'Custom input, input presets and sound',
          ],
          author,
          sameAs: [REPO_URL],
        },
      ],
    }
  }

  if (path === '/sorting') {
    return {
      title: `Sorting Algorithm Visualizer: ${ALGORITHMS.length} Algorithms Animated | ${SITE_NAME}`,
      description: `Visualize ${ALGORITHMS.length} sorting algorithms: bubble, insertion, selection, merge, quick, heap, radix, counting, shell, TimSort and more. Animated step by step, with a time complexity comparison table.`,
      canonical: abs('/sorting'),
      jsonLd: [
        {
          '@type': 'CollectionPage',
          name: 'Sorting algorithm visualizer',
          url: abs('/sorting'),
          isPartOf: { '@id': `${SITE_URL}/#website` },
          mainEntity: {
            '@type': 'ItemList',
            numberOfItems: ALGORITHMS.length,
            itemListElement: ALGORITHMS.map((a, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              name: a.name,
              url: abs(`/sorting/${a.id}`),
            })),
          },
        },
        breadcrumbs([
          [SITE_NAME, '/'],
          ['Sorting', '/sorting'],
        ]),
      ],
    }
  }

  if (path === '/sorting/race') {
    return {
      title: `Sorting Algorithm Race: Compare Sorts Side by Side | ${SITE_NAME}`,
      description:
        'Race up to 9 sorting algorithms on the same input and watch which finishes first. Compare bubble, insertion, merge, quick, heap sort and more on random, nearly sorted, reversed or few-unique data.',
      canonical: abs('/sorting/race'),
      jsonLd: [
        {
          '@type': 'LearningResource',
          name: 'Sorting algorithm race',
          url: abs('/sorting/race'),
          learningResourceType: 'Interactive visualization',
          isAccessibleForFree: true,
          isPartOf: { '@id': `${SITE_URL}/#website` },
          author,
        },
        breadcrumbs([
          [SITE_NAME, '/'],
          ['Sorting', '/sorting'],
          ['Race', '/sorting/race'],
        ]),
      ],
    }
  }

  const algo = path.startsWith('/sorting/') ? byId(path.slice('/sorting/'.length)) : undefined
  if (algo) return algoHead(algo)

  const topic = topicById(path.slice(1))
  if (topic) {
    return {
      title: `${topic.title} Visualizer (coming soon) | ${SITE_NAME}`,
      description: topic.blurb,
      noindex: true,
      jsonLd: [],
    }
  }

  return { title: `Page not found | ${SITE_NAME}`, description: SITE_DESCRIPTION, noindex: true, jsonLd: [] }
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** JSON-LD as a single @graph, safe to inline in a <script> tag. */
export const jsonLdString = (items: object[]) =>
  JSON.stringify({ '@context': 'https://schema.org', '@graph': items }).replace(/</g, '\\u003c')

/** The route-specific part of <head>, as HTML (for the prerenderer). */
export function headHtml(h: Head): string {
  const url = h.canonical
  return [
    `<title>${esc(h.title)}</title>`,
    `<meta name="description" content="${esc(h.description)}" />`,
    h.noindex ? `<meta name="robots" content="noindex, follow" />` : `<meta name="robots" content="index, follow, max-image-preview:large" />`,
    url ? `<link rel="canonical" href="${url}" />` : '',
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    `<meta property="og:title" content="${esc(h.title)}" />`,
    `<meta property="og:description" content="${esc(h.description)}" />`,
    url ? `<meta property="og:url" content="${url}" />` : '',
    `<meta property="og:image" content="${OG_IMAGE}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="${SITE_NAME}: sorting algorithms animated as bars" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(h.title)}" />`,
    `<meta name="twitter:description" content="${esc(h.description)}" />`,
    `<meta name="twitter:image" content="${OG_IMAGE}" />`,
    h.jsonLd.length ? `<script type="application/ld+json" id="ld-json">${jsonLdString(h.jsonLd)}</script>` : '',
  ]
    .filter(Boolean)
    .join('\n    ')
}

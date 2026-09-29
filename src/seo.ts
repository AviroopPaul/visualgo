/**
 * Per-route <head>: title, description, canonical, social tags and JSON-LD.
 * Used by the prerenderer (static HTML for crawlers) and by the client on
 * every navigation, so both always agree.
 */
import { TOPICS, topicById } from './catalog'
import { abs, AUTHOR, OG_IMAGE, REPO_URL, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from './site'
import { searchGuideFor } from './topics/searching/guide'
import { searchById, SEARCHES } from './topics/searching/registry'
import type { SearchAlgorithm } from './topics/searching/types'
import { guideFor } from './topics/sorting/guide'
import { TREES, treeById } from './topics/trees/registry'
import type { TreeItem } from './topics/trees/types'
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
    { path: '/searching', priority: 0.9 },
    ...SEARCHES.map((a) => ({ path: `/searching/${a.id}`, priority: 0.8 })),
    { path: '/searching/race', priority: 0.7 },
    { path: '/trees', priority: 0.9 },
    ...TREES.map((t) => ({ path: `/trees/${t.id}`, priority: 0.8 })),
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

const sentence = (tagline: string) => tagline.charAt(0).toLowerCase() + tagline.slice(1).replace(/\.$/, '')

export function algoDescription(a: SortAlgorithm) {
  return `${a.name} visualization: ${sentence(a.tagline)}. Watch every compare and swap animated step by step, with Python, JavaScript and C++ code. ${a.complexity.average} average.`
}

export function searchDescription(a: SearchAlgorithm) {
  return `${a.name} visualization: ${sentence(a.tagline)}. Watch every probe animated step by step on a sorted array, with Python, JavaScript and C++ code. ${a.complexity.average} average.`
}

interface LearningPage {
  path: string
  name: string
  description: string
  aka?: string[]
  wikipedia: string
  /** Topic breadcrumb, e.g. ["Sorting", "/sorting"]. */
  topic: [string, string]
}

/** Head for one algorithm page (any topic). */
function learningHead(p: LearningPage): Head {
  const url = abs(p.path)
  return {
    title: `${titleCase(p.name)} Visualization: Step-by-Step Animation | ${SITE_NAME}`,
    description: p.description,
    canonical: url,
    jsonLd: [
      {
        '@type': 'LearningResource',
        name: `${p.name} visualization`,
        headline: `${p.name}, animated step by step`,
        description: p.description,
        url,
        image: OG_IMAGE,
        inLanguage: 'en',
        isAccessibleForFree: true,
        learningResourceType: ['Interactive visualization', 'Simulation'],
        educationalUse: 'Self-study',
        teaches: `How ${p.name.toLowerCase()} works, its time and space complexity, and how to implement it`,
        about: { '@type': 'Thing', name: p.name, alternateName: p.aka, sameAs: p.wikipedia },
        programmingLanguage: ['Python', 'JavaScript', 'C++'],
        isPartOf: { '@id': `${SITE_URL}/#website` },
        author,
      },
      breadcrumbs([[SITE_NAME, '/'], p.topic, [p.name, p.path]]),
    ],
  }
}

export function treeDescription(t: TreeItem<unknown>) {
  return `${t.name} visualization: ${sentence(t.tagline)}. Insert, search and delete your own values and watch every step animated, with Python, JavaScript and C++ code.`
}

const treeHead = (t: TreeItem<unknown>) =>
  learningHead({ path: `/trees/${t.id}`, name: t.name, description: treeDescription(t), aka: t.guide.aka, wikipedia: t.guide.wikipedia, topic: ['Trees', '/trees'] })

const algoHead = (a: SortAlgorithm) => {
  const g = guideFor(a)
  return learningHead({ path: `/sorting/${a.id}`, name: a.name, description: algoDescription(a), aka: g.aka, wikipedia: g.wikipedia, topic: ['Sorting', '/sorting'] })
}

const searchHead = (a: SearchAlgorithm) => {
  const g = searchGuideFor(a)
  return learningHead({ path: `/searching/${a.id}`, name: a.name, description: searchDescription(a), aka: g.aka, wikipedia: g.wikipedia, topic: ['Searching', '/searching'] })
}

/** A topic overview page listing its algorithms. */
function hubHead(o: { path: string; title: string; description: string; name: string; items: { name: string; path: string }[]; topic: string }): Head {
  return {
    title: o.title,
    description: o.description,
    canonical: abs(o.path),
    jsonLd: [
      {
        '@type': 'CollectionPage',
        name: o.name,
        url: abs(o.path),
        isPartOf: { '@id': `${SITE_URL}/#website` },
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: o.items.length,
          itemListElement: o.items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, url: abs(it.path) })),
        },
      },
      breadcrumbs([
        [SITE_NAME, '/'],
        [o.topic, o.path],
      ]),
    ],
  }
}

/** A race page. */
function raceHead(o: { path: string; title: string; description: string; name: string; topic: [string, string] }): Head {
  return {
    title: o.title,
    description: o.description,
    canonical: abs(o.path),
    jsonLd: [
      {
        '@type': 'LearningResource',
        name: o.name,
        url: abs(o.path),
        learningResourceType: 'Interactive visualization',
        isAccessibleForFree: true,
        isPartOf: { '@id': `${SITE_URL}/#website` },
        author,
      },
      breadcrumbs([[SITE_NAME, '/'], o.topic, ['Race', o.path]]),
    ],
  }
}

export function headFor(pathname: string): Head {
  const path = pathname.replace(/\/+$/, '') || '/'

  if (path === '/') {
    return {
      title: `Algorithm Visualizer: See Algorithms Animated Step by Step | ${SITE_NAME}`,
      description: `${SITE_NAME} is a free, interactive algorithm visualizer. Watch ${ALGORITHMS.length} sorting and ${SEARCHES.length} searching algorithms and ${TREES.length} tree structures animate step by step, race them side by side, and follow Python, JavaScript and C++ code line by line.`,
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
            `${SEARCHES.length} animated searching algorithms, including binary and interpolation search`,
            'Interactive binary search tree, AVL tree, trie and segment tree with your own values',
            'Step forward and backward through every compare, swap and write',
            'Race mode: run several sorting or searching algorithms on the same input',
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
    return hubHead({
      path,
      title: `Sorting Algorithm Visualizer: ${ALGORITHMS.length} Algorithms Animated | ${SITE_NAME}`,
      description: `Visualize ${ALGORITHMS.length} sorting algorithms: bubble, insertion, selection, merge, quick, heap, radix, counting, shell, TimSort and more. Animated step by step, with a time complexity comparison table.`,
      name: 'Sorting algorithm visualizer',
      items: ALGORITHMS.map((a) => ({ name: a.name, path: `/sorting/${a.id}` })),
      topic: 'Sorting',
    })
  }

  if (path === '/sorting/race') {
    return raceHead({
      path,
      title: `Sorting Algorithm Race: Compare Sorts Side by Side | ${SITE_NAME}`,
      description:
        'Race up to 9 sorting algorithms on the same input and watch which finishes first. Compare bubble, insertion, merge, quick, heap sort and more on random, nearly sorted, reversed or few-unique data.',
      name: 'Sorting algorithm race',
      topic: ['Sorting', '/sorting'],
    })
  }

  if (path === '/searching') {
    return hubHead({
      path,
      title: `Searching Algorithm Visualizer: Binary Search and More | ${SITE_NAME}`,
      description: `Visualize ${SEARCHES.length} searching algorithms: linear, binary, jump, ternary, exponential and interpolation search. Watch every probe on a sorted array, with a complexity comparison table.`,
      name: 'Searching algorithm visualizer',
      items: SEARCHES.map((a) => ({ name: a.name, path: `/searching/${a.id}` })),
      topic: 'Searching',
    })
  }

  if (path === '/searching/race') {
    return raceHead({
      path,
      title: `Search Algorithm Race: Binary vs Linear vs Interpolation | ${SITE_NAME}`,
      description:
        'Race linear, jump, binary, ternary, exponential and interpolation search for the same target in the same sorted array. Fewest probes wins; try skewed data to see interpolation search struggle.',
      name: 'Searching algorithm race',
      topic: ['Searching', '/searching'],
    })
  }

  if (path === '/trees') {
    return hubHead({
      path,
      title: `Tree Visualizer: BST, AVL, Trie and Segment Tree Animated | ${SITE_NAME}`,
      description: `Visualize binary search trees, AVL tree rotations, in-order / pre-order / post-order / level-order traversal, tries and segment trees. Insert and delete your own values, step by step.`,
      name: 'Tree data structure visualizer',
      items: TREES.map((t) => ({ name: t.name, path: `/trees/${t.id}` })),
      topic: 'Trees',
    })
  }

  const tree = path.startsWith('/trees/') ? treeById(path.slice('/trees/'.length)) : undefined
  if (tree) return treeHead(tree)

  const search = path.startsWith('/searching/') ? searchById(path.slice('/searching/'.length)) : undefined
  if (search) return searchHead(search)

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

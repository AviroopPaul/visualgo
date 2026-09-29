import type { Faq } from '../../components/Guide'
import type { SearchAlgorithm } from './types'

/** Reference text for each search's guide section, FAQ and machine-readable copies. */
export interface SearchGuide {
  aka?: string[]
  use: string
  wikipedia: string
}

const wiki = (page: string) => `https://en.wikipedia.org/wiki/${page}`

export const SEARCH_GUIDE: Record<string, SearchGuide> = {
  linear: {
    aka: ['sequential search'],
    use: 'When the data is unsorted, tiny, or searched only once, since sorting first would cost more than scanning. It is also the only choice for linked lists and streams you can read only once.',
    wikipedia: wiki('Linear_search'),
  },
  jump: {
    aka: ['block search'],
    use: 'On sorted data where jumping backwards is expensive, such as tape or some linked structures, because it only ever steps back once. On an in-memory array, binary search is faster.',
    wikipedia: wiki('Jump_search'),
  },
  binary: {
    aka: ['half-interval search', 'logarithmic search', 'binary chop', 'bisection'],
    use: 'The default way to search sorted data: a sorted array, a database index, or a monotonic function ("find the first x where f(x) is true"). Python bisect, C++ lower_bound and Java Arrays.binarySearch are all binary search.',
    wikipedia: wiki('Binary_search'),
  },
  ternary: {
    use: 'Rarely for searching a sorted array, where binary search does fewer probes. Its real use is finding the maximum or minimum of a unimodal function, where two probes tell you which third to drop.',
    wikipedia: wiki('Ternary_search'),
  },
  exponential: {
    aka: ['doubling search', 'galloping search', 'Struzik search'],
    use: 'When the array is huge or unbounded and the target is likely near the start. TimSort uses galloping (the same idea) to merge runs quickly.',
    wikipedia: wiki('Exponential_search'),
  },
  interpolation: {
    use: 'On large sorted arrays whose values are spread roughly evenly, like uniformly distributed keys or timestamps. On skewed or clustered data it can degrade to linear time, so binary search is the safer default.',
    wikipedia: wiki('Interpolation_search'),
  },
}

export const searchGuideFor = (a: SearchAlgorithm) => SEARCH_GUIDE[a.id]

const lower = (name: string) => name.charAt(0).toLowerCase() + name.slice(1)

export function searchFaqFor(a: SearchAlgorithm): Faq[] {
  const c = a.complexity
  const name = a.name
  return [
    { q: `How does ${lower(name)} work?`, a: a.about.join(' ') },
    {
      q: `What is the time complexity of ${lower(name)}?`,
      a: `${name} takes ${c.best} time in the best case, ${c.average} on average and ${c.worst} in the worst case, using ${c.space} extra space.`,
    },
    {
      q: `Does ${lower(name)} need a sorted array?`,
      a: a.sorted
        ? `Yes. ${name} decides where to look next by comparing with the target, which only works when the array is sorted.`
        : `No. ${name} checks every element in turn, so it works on unsorted data too.`,
    },
    { q: `When should you use ${lower(name)}?`, a: searchGuideFor(a).use },
  ]
}

/** Searches worth comparing with this one: the classics first. */
export function relatedSearches(a: SearchAlgorithm, all: SearchAlgorithm[]): SearchAlgorithm[] {
  const order = ['binary', 'linear', 'interpolation', 'jump', 'exponential', 'ternary']
  return order.map((id) => all.find((x) => x.id === id)!).filter((x) => x.id !== a.id)
}

/** Questions answered on the /searching overview page. */
export const SEARCHING_FAQ: Faq[] = [
  {
    q: 'What is the fastest searching algorithm?',
    a: 'For a sorted array, binary search is the reliable choice at O(log n). Interpolation search can be faster (O(log log n)) when values are spread evenly, but it falls to O(n) on skewed data. For unsorted data you need linear search, or a hash table if you will search many times.',
  },
  {
    q: 'What is the difference between linear search and binary search?',
    a: 'Linear search checks elements one by one and works on any array, taking O(n) time. Binary search needs a sorted array, but it halves the remaining range with every probe, taking O(log n) time: about 20 probes for a million elements instead of up to a million.',
  },
  {
    q: 'Why is ternary search not faster than binary search?',
    a: 'Ternary search shrinks the range to a third per step instead of a half, but each step costs two probes. Two binary steps shrink the range to a quarter with the same two probes, so binary search does fewer probes overall. Race them to see it.',
  },
  {
    q: 'How do I use this searching visualizer?',
    a: 'Pick an algorithm and press play (Space). Click any bar to search for its value, type a target, or press Present / Missing for a random value in or not in the array. Change the input shape to see how the data affects each search, and press C for the code.',
  },
]

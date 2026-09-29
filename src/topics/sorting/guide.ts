import type { SortAlgorithm } from './types'

/**
 * Reference text for each algorithm's guide section (below the animation),
 * its FAQ, and the machine-readable copies (llms.txt, .md pages).
 */
export interface AlgoGuide {
  /** Other names people search for. */
  aka?: string[]
  /** When you would (or would not) reach for it. */
  use: string
  wikipedia: string
}

const wiki = (page: string) => `https://en.wikipedia.org/wiki/${page}`

export const GUIDE: Record<string, AlgoGuide> = {
  bubble: {
    aka: ['sinking sort'],
    use: 'Mostly a teaching tool. It is simple to write and detects an already sorted array in one pass, but its O(n²) swaps make it far slower than insertion sort on real data.',
    wikipedia: wiki('Bubble_sort'),
  },
  cocktail: {
    aka: ['cocktail sort', 'bidirectional bubble sort', 'shaker sort', 'ripple sort'],
    use: 'A small improvement on bubble sort when a few small values sit near the end. Still O(n²), so it is for learning rather than production.',
    wikipedia: wiki('Cocktail_shaker_sort'),
  },
  'odd-even': {
    aka: ['brick sort', 'odd–even transposition sort', 'parity sort'],
    use: 'Useful on parallel hardware where each processor holds one element and talks only to its neighbours. On one CPU core it is no better than bubble sort.',
    wikipedia: wiki('Odd%E2%80%93even_sort'),
  },
  comb: {
    use: 'A quick fix for bubble sort when you need something tiny and in place. It is usually much faster than bubble sort, but merge sort, heap sort or quick sort are better general choices.',
    wikipedia: wiki('Comb_sort'),
  },
  gnome: {
    aka: ['stupid sort'],
    use: 'A curiosity: the whole algorithm is one loop with one position. It behaves like insertion sort but does more swaps, so insertion sort is the practical choice.',
    wikipedia: wiki('Gnome_sort'),
  },
  selection: {
    use: 'Good when writing to memory is expensive and n is small, because it never makes more than n − 1 swaps. It always does about n²/2 comparisons, even on sorted input.',
    wikipedia: wiki('Selection_sort'),
  },
  heap: {
    aka: ['heapsort'],
    use: 'When you need a guaranteed O(n log n) worst case with O(1) extra memory, for example in embedded systems or as the fallback inside introsort. It is not stable and has poor cache locality.',
    wikipedia: wiki('Heapsort'),
  },
  cycle: {
    use: 'When writes are very costly (flash memory, EEPROM), because every element is written at most once. The O(n²) comparisons make it slow otherwise.',
    wikipedia: wiki('Cycle_sort'),
  },
  pancake: {
    aka: ['pancake sorting', 'prefix reversal sort'],
    use: 'A puzzle more than a practical sort: the only allowed operation is reversing a prefix. It shows up in interview questions and in genome rearrangement research.',
    wikipedia: wiki('Pancake_sorting'),
  },
  insertion: {
    use: 'The best choice for small arrays (roughly under 20 to 50 elements) and for data that is already nearly sorted. TimSort and introsort use it to finish short runs.',
    wikipedia: wiki('Insertion_sort'),
  },
  shell: {
    aka: ['Shellsort', "Shell's method"],
    use: 'A good in-place sort for medium-sized arrays when you want something short to write and faster than insertion sort. Its speed depends on the gap sequence.',
    wikipedia: wiki('Shellsort'),
  },
  merge: {
    aka: ['mergesort'],
    use: 'When you need a stable sort with a guaranteed O(n log n) worst case, when sorting linked lists, or for external sorting of data that does not fit in memory. It needs O(n) extra space for arrays.',
    wikipedia: wiki('Merge_sort'),
  },
  quick: {
    aka: ['quicksort', 'partition-exchange sort', 'Lomuto partition'],
    use: 'Usually the fastest general-purpose in-place sort in practice thanks to good cache behaviour. Pick pivots carefully (random or median-of-three) to avoid the O(n²) worst case, and use merge sort if you need stability.',
    wikipedia: wiki('Quicksort'),
  },
  'quick-hoare': {
    aka: ['Hoare partition scheme', "Hoare's quicksort"],
    use: 'The same use cases as quick sort. Hoare partitioning does fewer swaps than Lomuto and copes better with many equal keys, which is why most library quicksorts use a variant of it.',
    wikipedia: wiki('Quicksort'),
  },
  counting: {
    use: 'When keys are small integers in a known, narrow range (ages, grades, bytes). It runs in linear time, but memory grows with the range k. It is also the stable pass inside radix sort.',
    wikipedia: wiki('Counting_sort'),
  },
  radix: {
    aka: ['LSD radix sort', 'digital sort'],
    use: 'For integers or fixed-length strings with a bounded number of digits, where it beats comparison sorts on large inputs. It needs extra memory and does not work directly on arbitrary comparable objects.',
    wikipedia: wiki('Radix_sort'),
  },
  bucket: {
    aka: ['bin sort'],
    use: 'When values are spread roughly evenly over a known range, such as floating-point numbers in [0, 1). If everything lands in one bucket it degrades to that bucket’s sort, O(n²) with insertion sort.',
    wikipedia: wiki('Bucket_sort'),
  },
  tim: {
    aka: ['Timsort'],
    use: 'The default sort in Python (list.sort, sorted), Java for objects, Android, V8 and Swift. It is stable and very fast on real data that already contains sorted runs.',
    wikipedia: wiki('Timsort'),
  },
  bitonic: {
    aka: ['bitonic sorter', 'bitonic merge sort', 'Batcher’s bitonic sort'],
    use: 'On GPUs and other parallel hardware, where its fixed, data-independent comparison pattern lets every compare in a stage run at once. On a single core, O(n log² n) loses to merge or quick sort.',
    wikipedia: wiki('Bitonic_sorter'),
  },
}

export const guideFor = (algo: SortAlgorithm): AlgoGuide => GUIDE[algo.id]

export interface Faq {
  q: string
  a: string
}

/** Lower-case name for use mid-sentence ("Quick sort (Hoare)" stays readable). */
const lower = (name: string) => name.charAt(0).toLowerCase() + name.slice(1)

export function faqFor(algo: SortAlgorithm): Faq[] {
  const c = algo.complexity
  const g = guideFor(algo)
  const name = algo.name
  return [
    {
      q: `How does ${lower(name)} work?`,
      a: algo.about.join(' '),
    },
    {
      q: `What is the time complexity of ${lower(name)}?`,
      a: `${name} runs in ${c.best} time in the best case, ${c.average} on average and ${c.worst} in the worst case, using ${c.space} extra space.`,
    },
    {
      q: `Is ${lower(name)} stable?`,
      a: algo.stable
        ? `Yes. ${name} is stable: equal values keep the order they had in the input.`
        : `No. ${name} is not stable: equal values can end up in a different order than they started.`,
    },
    {
      q: `Is ${lower(name)} an in-place sorting algorithm?`,
      a: algo.inPlace
        ? `Yes. ${name} sorts within the original array, using ${c.space} extra memory.`
        : `No. ${name} needs ${c.space} extra memory for its buffer or buckets.`,
    },
    { q: `When should you use ${lower(name)}?`, a: g.use },
  ]
}

/** Algorithms worth comparing with this one: same family first, then a few classics. */
export function relatedTo(algo: SortAlgorithm, all: SortAlgorithm[]): SortAlgorithm[] {
  const classics = ['quick', 'merge', 'heap', 'insertion', 'bubble']
  const same = all.filter((a) => a.family === algo.family && a.id !== algo.id)
  const extra = classics.map((id) => all.find((a) => a.id === id)!).filter((a) => a.id !== algo.id && !same.includes(a))
  return [...same, ...extra].slice(0, 6)
}

/** Questions answered on the /sorting overview page. */
export function sortingFaq(all: SortAlgorithm[]): Faq[] {
  const names = (xs: SortAlgorithm[]) => xs.map((a) => lower(a.name)).join(', ')
  return [
    {
      q: 'What is the fastest sorting algorithm?',
      a: 'There is no single fastest one. For general data, quick sort, merge sort, heap sort and TimSort all run in O(n log n) on average; quick sort is usually fastest in practice and TimSort wins on data that is already partly sorted. When keys are small integers, counting sort and radix sort can run in linear time. For tiny arrays, insertion sort beats them all.',
    },
    {
      q: 'Which sorting algorithms are stable?',
      a: `Stable (equal values keep their input order): ${names(all.filter((a) => a.stable))}. Not stable: ${names(all.filter((a) => !a.stable))}.`,
    },
    {
      q: 'What is the difference between comparison and non-comparison sorts?',
      a: 'Comparison sorts (bubble, insertion, merge, quick, heap and the rest) only learn about the data by comparing two elements, and no comparison sort can beat O(n log n) in the worst case. Counting, radix and bucket sort instead use the values themselves as positions, which lets them run in linear time on suitable keys.',
    },
    {
      q: 'Which sorting algorithm does Python use?',
      a: "Python's list.sort() and sorted() use TimSort, a stable hybrid of insertion sort and merge sort (since Python 3.11 with the Powersort merge policy). Java uses TimSort for objects and a dual-pivot quicksort for primitives.",
    },
    {
      q: 'How do I use this sorting visualizer?',
      a: 'Pick an algorithm and press play (Space). Step with the arrow keys, drag the scrubber to go back in time, change the speed with [ and ], press R for a new random input, or type your own numbers with Custom. Press C to show the Python, JavaScript or C++ code, with the running line highlighted.',
    },
  ]
}

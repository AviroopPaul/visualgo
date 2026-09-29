import type { Complexity, Listing } from '../../engine/types'
import type { Tracer } from './tracer'

export type Family = 'Exchange' | 'Selection' | 'Insertion' | 'Divide & conquer' | 'Distribution' | 'Hybrid & networks'

export interface SortAlgorithm {
  id: string
  name: string
  family: Family
  /** One short line shown under the title. */
  tagline: string
  /** A few plain sentences, shown behind the "How it works" toggle. */
  about: string[]
  complexity: Complexity
  stable: boolean
  inPlace: boolean
  /** Input length must be a power of two. */
  pow2?: boolean
  run(t: Tracer): void
  code: { py: Listing; js: Listing; cpp: Listing }
}

export const js = (source: string): Listing => ({ lang: 'js', source })
export const py = (source: string): Listing => ({ lang: 'py', source })

const CPP_HEADER = '#include <algorithm>\n#include <vector>\nusing namespace std;\n'
export const cpp = (source: string): Listing => ({ lang: 'cpp', source: CPP_HEADER + source })

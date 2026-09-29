import type { Complexity, Listing } from '../../engine/types'
import type { SearchTracer } from './tracer'

export type SearchGroup = 'Scan' | 'Halving' | 'Estimate'

export interface SearchAlgorithm {
  id: string
  name: string
  group: SearchGroup
  tagline: string
  about: string[]
  complexity: Complexity
  /** Needs sorted input (everything except linear search). */
  sorted: boolean
  run(t: SearchTracer): void
  code: { py: Listing; js: Listing; cpp: Listing }
}

export const py = (source: string): Listing => ({ lang: 'py', source })
export const js = (source: string): Listing => ({ lang: 'js', source })
const CPP_HEADER = '#include <algorithm>\n#include <cmath>\n#include <vector>\nusing namespace std;\n'
export const cpp = (source: string): Listing => ({ lang: 'cpp', source: CPP_HEADER + source })

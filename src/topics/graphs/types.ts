import type { Complexity, Listing } from '../../engine/types'
import type { Graph, Preset } from './model'
import type { GraphFrame } from './recorder'

export type GraphGroup = 'Traversal' | 'Ordering' | 'Structure'

export interface GraphRun<R = unknown> {
  frames: GraphFrame[]
  result: R
}

export interface GraphAlgorithm<R = unknown> {
  id: string
  name: string
  group: GraphGroup
  tagline: string
  about: string[]
  complexity: Complexity
  directed: boolean
  presets: Preset[]
  /** Click a node to choose where the search starts. */
  needsStart: boolean
  /** Also runs on a grid you can draw walls on. */
  grid: boolean
  run(g: Graph, start: number): GraphRun<R>
  code: { py: Listing; js: Listing; cpp: Listing }
  guide: { aka?: string[]; use: string; wikipedia: string }
}

export const py = (source: string): Listing => ({ lang: 'py', source })
export const js = (source: string): Listing => ({ lang: 'js', source })
export const cpp = (source: string, headers = '#include <vector>\nusing namespace std;\n'): Listing => ({ lang: 'cpp', source: headers + source })

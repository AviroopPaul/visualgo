import type { Listing } from '../../engine/types'
import type { TreeFrame } from './recorder'

export type TreeGroup = 'Search trees' | 'Traversal' | 'Special trees'

/** What an operation button asks for. */
export type OpInput = 'value' | 'word' | 'range' | 'update' | 'none'

export interface OpSpec {
  id: string
  label: string
  input: OpInput
}

export interface Op {
  kind: string
  a?: number
  b?: number
  word?: string
  keys?: number[]
  words?: string[]
}

export interface TreeResult<S> {
  frames: TreeFrame[]
  state: S
}

export interface TreeItem<S = unknown> {
  id: string
  name: string
  group: TreeGroup
  tagline: string
  about: string[]
  /** Header chips and guide table rows, e.g. ["search", "O(log n)"]. */
  facts: [string, string][]
  /** Chips shown in the header (subset of facts). */
  chips: [string, string][]
  ops: OpSpec[]
  /** Traversal orders; the chosen one is passed to run() and code(). */
  variants?: { id: string; label: string }[]
  initial(seed: number): S
  /** Operation animated when the page opens (e.g. building the tree). */
  demo(seed: number, variant?: string): Op
  run(state: S, op: Op, variant?: string): TreeResult<S>
  code(variant?: string): { py: Listing; js: Listing; cpp: Listing }
  /** Random operand for the "surprise me" button. */
  suggest?(state: S, op: string, seed: number): Op
  guide: { aka?: string[]; use: string; wikipedia: string }
}

export const py = (source: string): Listing => ({ lang: 'py', source })
export const js = (source: string): Listing => ({ lang: 'js', source })
export const cpp = (source: string, headers = '#include <algorithm>\n#include <vector>\nusing namespace std;\n'): Listing => ({
  lang: 'cpp',
  source: headers + source,
})

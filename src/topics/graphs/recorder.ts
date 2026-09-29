import type { Frame } from '../../engine/types'
import { edgeIndex, type Graph } from './model'

/** Node states. */
export const GN = {
  idle: 0,
  /** The node being processed right now. */
  active: 1,
  /** Waiting in the queue / on the stack. */
  frontier: 2,
  /** Finished. */
  done: 3,
  /** Part of a conflict or cycle. */
  bad: 4,
  /** Output / result. */
  good: 5,
  /** DFS: entered but not finished (on the recursion stack). */
  open: 6,
} as const

/** Edge states. */
export const GE = {
  idle: 0,
  /** Being looked at. */
  scan: 1,
  /** Discovered a node through it (BFS / DFS tree). */
  tree: 2,
  /** Back edge, odd cycle, conflict. */
  bad: 3,
  /** Removed (Kahn’s algorithm). */
  gone: 4,
} as const

export interface GList {
  title: string
  kind: 'queue' | 'stack' | 'output'
  items: { key: string; label: string; mark?: number }[]
}

export interface GraphFrame extends Frame {
  node: Uint8Array
  edge: Uint8Array
  /** Small tag per node: distance, in-degree, … */
  badge: (string | null)[]
  /** Colour group per node (component / side), -1 = none. */
  group: Int8Array
  /** Edges just traversed (from, to), drawn with a moving pulse. */
  pulse: [number, number][]
  ptrs: { label: string; node: number }[]
  lists: GList[]
  stat: string
}

export class GraphRecorder {
  readonly frames: GraphFrame[] = []
  steps = 0
  private node: Uint8Array
  private edge: Uint8Array
  private badge: (string | null)[]
  private group: Int8Array
  private ptrs = new Map<string, number>()
  private lists = new Map<string, GList>()
  constructor(
    readonly g: Graph,
    private statText: (steps: number) => string,
  ) {
    this.node = new Uint8Array(g.n)
    this.edge = new Uint8Array(g.edges.length)
    this.badge = new Array(g.n).fill(null)
    this.group = new Int8Array(g.n).fill(-1)
  }

  show(line: string, note: string, opts: { nodes?: Array<[number, number]>; edges?: Array<[number, number, number]>; pulse?: Array<[number, number]> } = {}) {
    if (this.frames.length > 30_000) throw new Error('Too many frames')
    const node = this.node.slice()
    for (const [u, m] of opts.nodes ?? []) node[u] = m
    const edge = this.edge.slice()
    for (const [u, v, m] of opts.edges ?? []) {
      const i = edgeIndex(this.g, u, v)
      if (i >= 0) edge[i] = m
    }
    this.frames.push({
      line,
      note,
      node,
      edge,
      badge: [...this.badge],
      group: this.group.slice(),
      pulse: opts.pulse ?? [],
      ptrs: [...this.ptrs].map(([label, n]) => ({ label, node: n })),
      lists: [...this.lists.values()].map((l) => ({ ...l, items: [...l.items] })),
      stat: this.statText(this.steps),
    })
  }

  mark(u: number, m: number) {
    this.node[u] = m
  }
  markEdge(u: number, v: number, m: number) {
    const i = edgeIndex(this.g, u, v)
    if (i >= 0) this.edge[i] = m
  }
  setBadge(u: number, b: string | null) {
    this.badge[u] = b
  }
  setGroup(u: number, k: number) {
    this.group[u] = k
  }
  ptr(label: string, u: number | null) {
    if (u == null) this.ptrs.delete(label)
    else this.ptrs.set(label, u)
  }
  list(title: string, kind: GList['kind'], nodes: number[], mark?: (u: number) => number | undefined) {
    // Nodes appear at most once in any list here, so they key their chip.
    this.lists.set(title, { title, kind, items: nodes.map((u) => ({ key: String(u), label: String(u), mark: mark?.(u) })) })
  }
}

import type { Frame } from '../../engine/types'

/** Visual state of a node (or edge). */
export const TM = {
  idle: 0,
  /** Being compared / looked at right now. */
  active: 1,
  /** Found, placed, or answer. */
  good: 2,
  /** On the path walked so far. */
  path: 3,
  /** Out of balance, being deleted, or a miss. */
  bad: 4,
  /** Just created. */
  fresh: 5,
  /** Already visited / finished. */
  done: 6,
  /** Pivot of a rotation, or partially covered segment. */
  pivot: 7,
  /** Ruled out (segment fully outside the query). */
  faded: 8,
} as const

export interface TNode {
  id: number
  label: string
  /** Layout x in abstract units; the stage fits the range to its width. */
  x: number
  /** Depth (0 = root). */
  y: number
  mark: number
  /** Small tag at the top right, e.g. a balance factor. */
  badge?: string
  badgeBad?: boolean
  /** Second line under the node, e.g. a segment range. */
  sub?: string
  /** Trie: a word ends here. */
  end?: boolean
}

export interface TEdge {
  /** Stable key: usually the child id, so an edge follows its child during rotations. */
  key: string
  from: number
  to: number
  mark: number
}

export interface TList {
  title: string
  kind: 'stack' | 'queue' | 'output' | 'words'
  items: { key: string; label: string; mark?: number }[]
}

export interface TCells {
  values: number[]
  marks: number[]
}

export interface TreeFrame extends Frame {
  nodes: TNode[]
  edges: TEdge[]
  ptrs: { label: string; node: number }[]
  lists: TList[]
  cells?: TCells
  /** Fix the x range (segment trees align with their array); otherwise fitted to the nodes. */
  xDomain?: [number, number]
  /** Short running counter, e.g. "3 comparisons". */
  stat: string
}

export interface TreeView {
  nodes: Omit<TNode, 'mark'>[]
  edges: Omit<TEdge, 'mark'>[]
  cells?: number[]
  xDomain?: [number, number]
}

/**
 * Records frames for any tree-shaped structure. The item supplies `view`,
 * which lays out its current state; the recorder adds marks, pointers,
 * side lists and a running counter on top.
 */
export class TreeRecorder {
  readonly frames: TreeFrame[] = []
  steps = 0
  private marks = new Map<number, number>()
  private edgeMarks = new Map<string, number>()
  private cellMarks = new Map<number, number>()
  private ptrs = new Map<string, number>()
  private lists = new Map<string, TList>()
  constructor(
    private view: () => TreeView,
    private statText: (steps: number) => string = (s) => `${s} step${s === 1 ? '' : 's'}`,
  ) {}

  show(line: string, note: string, transient: Array<[number, number]> = []) {
    if (this.frames.length > 20_000) throw new Error('Too many frames')
    const v = this.view()
    const extra = new Map(transient)
    const ids = new Set(v.nodes.map((n) => n.id))
    for (const [label, node] of this.ptrs) if (!ids.has(node)) this.ptrs.delete(label)
    this.frames.push({
      line,
      note,
      nodes: v.nodes.map((n) => ({ ...n, mark: extra.get(n.id) ?? this.marks.get(n.id) ?? 0 })),
      edges: v.edges.map((e) => ({ ...e, mark: this.edgeMarks.get(e.key) ?? 0 })),
      ptrs: [...this.ptrs].map(([label, node]) => ({ label, node })),
      lists: [...this.lists.values()].map((l) => ({ ...l, items: [...l.items] })),
      cells: v.cells ? { values: [...v.cells], marks: v.cells.map((_, i) => this.cellMarks.get(i) ?? 0) } : undefined,
      xDomain: v.xDomain,
      stat: this.statText(this.steps),
    })
  }

  mark(id: number, m: number) {
    this.marks.set(id, m)
  }
  unmark(id: number) {
    this.marks.delete(id)
  }
  clearMarks() {
    this.marks.clear()
    this.edgeMarks.clear()
    this.cellMarks.clear()
  }
  markEdge(key: string, m: number) {
    this.edgeMarks.set(key, m)
  }
  markCells(from: number, to: number, m: number) {
    for (let i = from; i <= to; i++) this.cellMarks.set(i, m)
  }
  ptr(label: string, node: number | null | undefined) {
    if (node == null) this.ptrs.delete(label)
    else this.ptrs.set(label, node)
  }
  unptr(...labels: string[]) {
    for (const l of labels) this.ptrs.delete(l)
  }
  list(title: string, kind: TList['kind'], items: TList['items']) {
    this.lists.set(title, { title, kind, items })
  }
  unlist(title: string) {
    this.lists.delete(title)
  }
}

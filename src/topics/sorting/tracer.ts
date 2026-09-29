import type { Frame } from '../../engine/types'

/** Visual state of a single element in a frame. */
export const M = {
  idle: 0,
  compare: 1,
  swap: 2,
  pivot: 3,
  key: 4,
  focus: 5,
  sorted: 6,
  write: 7,
} as const
export type Mark = (typeof M)[keyof typeof M]

export const MARK_LABEL: Record<number, string> = {
  [M.compare]: 'comparing',
  [M.swap]: 'swapping',
  [M.pivot]: 'pivot',
  [M.key]: 'held',
  [M.focus]: 'current min / max',
  [M.sorted]: 'in final place',
  [M.write]: 'written',
}

/** Where an element lives: the main array, the scratch row, or a bucket. */
export const Z = { main: 0, aux: 1, bucket: 2 } as const

export interface Pointer {
  label: string
  i: number
  zone: 0 | 1
}

/**
 * A full snapshot of the stage. Arrays are indexed by element id (ids are the
 * original positions and never change), so the stage can key DOM nodes by id
 * and let CSS transitions animate every move.
 */
export interface SortFrame extends Frame {
  zone: Uint8Array
  /** main/aux: slot index. bucket: bucket * 256 + position in bucket. */
  slot: Uint16Array
  mark: Uint8Array
  ptrs: Pointer[]
  range: [number, number] | null
  /** What the scratch row stands for right now (the code's temp variable). */
  auxLabel: string
  /** Heap sort only: how many leading slots belong to the heap. */
  heap: number
  cmp: number
  swaps: number
  writes: number
}

export interface SortRun {
  n: number
  values: number[]
  maxValue: number
  frames: SortFrame[]
  usesAux: boolean
  bucketLabels: string[] | null
  maxBucket: number
  usesHeap: boolean
  marks: number[]
}

const MAX_FRAMES = 80_000

export class Tracer {
  readonly n: number
  readonly values: number[]
  main: number[]
  aux: number[]
  buckets: number[][] = []
  bucketLabels: string[] | null = null
  heap = 0
  cmp = 0
  swaps = 0
  writes = 0
  private usesAux = false
  private usesHeap = false
  private maxBucket = 1
  private sorted: Uint8Array
  private tags = new Map<number, number>()
  private ptrs = new Map<string, Pointer>()
  private rangeLoHi: [number, number] | null = null
  private auxLabel = 'scratch'
  private seenMarks = new Set<number>()
  readonly frames: SortFrame[] = []

  constructor(values: number[]) {
    this.values = values
    this.n = values.length
    this.main = values.map((_, i) => i)
    this.aux = new Array(this.n).fill(-1)
    this.sorted = new Uint8Array(this.n)
    this.show('', `${this.n} values, unsorted. Press play.`)
  }

  // ── reading ────────────────────────────────────────────────────────────
  id(i: number) {
    return this.main[i]
  }
  val(i: number) {
    return this.values[this.main[i]]
  }
  v(id: number) {
    return this.values[id]
  }

  // ── snapshot ───────────────────────────────────────────────────────────
  show(line: string, note: string, marks: Array<[number, number]> = []) {
    if (this.frames.length >= MAX_FRAMES) throw new Error('Too many frames')
    const { n } = this
    const zone = new Uint8Array(n)
    const slot = new Uint16Array(n)
    const mark = new Uint8Array(n)
    this.main.forEach((id, i) => {
      if (id >= 0) slot[id] = i
    })
    this.aux.forEach((id, i) => {
      if (id >= 0) {
        zone[id] = Z.aux
        slot[id] = i
      }
    })
    this.buckets.forEach((b, bi) =>
      b.forEach((id, k) => {
        zone[id] = Z.bucket
        slot[id] = bi * 256 + k
      }),
    )
    for (let id = 0; id < n; id++) if (this.sorted[id]) mark[id] = M.sorted
    for (const [id, m] of this.tags) mark[id] = m
    for (const [id, m] of marks) if (id >= 0) mark[id] = m
    for (let id = 0; id < n; id++) if (mark[id]) this.seenMarks.add(mark[id])
    this.frames.push({
      line,
      note,
      zone,
      slot,
      mark,
      ptrs: [...this.ptrs.values()],
      range: this.rangeLoHi,
      auxLabel: this.auxLabel,
      heap: this.heap,
      cmp: this.cmp,
      swaps: this.swaps,
      writes: this.writes,
    })
  }

  // ── comparisons (each records a frame) ─────────────────────────────────
  /** Compare two element ids. Returns a.value - b.value. */
  cmpIds(a: number, b: number, line: string, note?: string, extra: Array<[number, number]> = []) {
    this.cmp++
    const va = this.v(a)
    const vb = this.v(b)
    const op = va < vb ? '<' : va > vb ? '>' : '='
    this.show(line, note ?? `${va} ${op} ${vb}`, [...extra, [a, M.compare], [b, M.compare]])
    return va - vb
  }
  compare(i: number, j: number, line: string, note?: string) {
    return this.cmpIds(this.main[i], this.main[j], line, note)
  }

  // ── moves on the main array ────────────────────────────────────────────
  swap(i: number, j: number, line: string, note?: string) {
    const a = this.main[i]
    const b = this.main[j]
    this.main[i] = b
    this.main[j] = a
    this.swaps++
    this.writes += 2
    this.show(line, note ?? `Swap ${this.v(a)} ↔ ${this.v(b)}`, [
      [a, M.swap],
      [b, M.swap],
    ])
  }
  /** Reverse main[lo..hi] in one frame (pancake flips). */
  reverse(lo: number, hi: number, line: string, note: string) {
    const seg = this.main.slice(lo, hi + 1).reverse()
    const moved = seg.map((id) => [id, M.swap] as [number, number])
    this.main.splice(lo, seg.length, ...seg)
    this.swaps += seg.length >> 1
    this.writes += seg.length
    this.show(line, note, moved)
  }
  /** Move main[from] into the empty main[to]. */
  shift(from: number, to: number) {
    this.main[to] = this.main[from]
    this.main[from] = -1
    this.writes++
  }

  // ── scratch row ────────────────────────────────────────────────────────
  toAux(i: number, k = i) {
    this.usesAux = true
    this.aux[k] = this.main[i]
    this.main[i] = -1
  }
  fromAux(k: number, i: number) {
    this.main[i] = this.aux[k]
    this.aux[k] = -1
    this.writes++
  }
  auxMove(from: number, to: number) {
    if (from === to) return
    this.aux[to] = this.aux[from]
    this.aux[from] = -1
  }

  // ── buckets ────────────────────────────────────────────────────────────
  setBuckets(labels: string[]) {
    this.bucketLabels = labels
    this.buckets = labels.map(() => [])
  }
  toBucket(i: number, b: number) {
    this.buckets[b].push(this.main[i])
    this.main[i] = -1
    this.maxBucket = Math.max(this.maxBucket, this.buckets[b].length)
  }
  fromBucket(b: number, i: number) {
    this.main[i] = this.buckets[b].shift()!
    this.writes++
  }
  bucketSwap(b: number, x: number, y: number) {
    const bk = this.buckets[b]
    ;[bk[x], bk[y]] = [bk[y], bk[x]]
    this.swaps++
  }

  // ── decorations ────────────────────────────────────────────────────────
  setHeap(size: number) {
    this.usesHeap = true
    this.heap = size
  }
  markSorted(i: number) {
    if (this.main[i] >= 0) this.sorted[this.main[i]] = 1
  }
  tag(id: number, m: number) {
    this.tags.set(id, m)
  }
  untag(id: number) {
    this.tags.delete(id)
  }
  ptr(label: string, i: number, zone: 0 | 1 = 0) {
    this.ptrs.set(label, { label, i, zone })
  }
  unptr(...labels: string[]) {
    for (const l of labels) this.ptrs.delete(l)
  }
  range(lo: number, hi: number) {
    this.rangeLoHi = [lo, hi]
  }
  setAuxLabel(label: string) {
    this.auxLabel = label
  }
  clearRange() {
    this.rangeLoHi = null
  }

  finish(): SortRun {
    this.tags.clear()
    this.ptrs.clear()
    this.rangeLoHi = null
    this.heap = 0
    this.sorted.fill(1)
    this.show('', `Sorted — ${this.cmp} comparisons, ${this.swaps ? `${this.swaps} swaps` : `${this.writes} writes`}.`)
    return {
      n: this.n,
      values: this.values,
      maxValue: Math.max(...this.values),
      frames: this.frames,
      usesAux: this.usesAux,
      bucketLabels: this.bucketLabels,
      maxBucket: this.maxBucket,
      usesHeap: this.usesHeap,
      marks: [...this.seenMarks].sort((a, b) => a - b),
    }
  }
}

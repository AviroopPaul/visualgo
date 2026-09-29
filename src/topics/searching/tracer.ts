import type { Frame } from '../../engine/types'

/** Visual state of one array cell. */
export const SM = {
  idle: 0,
  probe: 1,
  found: 2,
  /** A second probe in the same step (ternary's m2). */
  probe2: 3,
} as const

export interface SearchPointer {
  label: string
  i: number
}

export interface SearchFrame extends Frame {
  mark: Uint8Array
  /** 1 = ruled out: the target cannot be here any more. */
  dead: Uint8Array
  /** Live search window, if the algorithm keeps one. */
  win: [number, number] | null
  ptrs: SearchPointer[]
  /** Jump search: block size, drawn as dividers. 0 = none. */
  block: number
  probes: number
  status: 'searching' | 'found' | 'missing'
}

export interface SearchRun {
  n: number
  values: number[]
  maxValue: number
  target: number
  frames: SearchFrame[]
  /** Index returned by the algorithm, or -1. */
  result: number
}

const MAX_FRAMES = 20_000

/**
 * Records a search as frames. Algorithms read values only through `probe`,
 * so every array access the code makes shows up on screen and in the count.
 */
export class SearchTracer {
  readonly n: number
  readonly a: number[]
  readonly target: number
  probes = 0
  readonly frames: SearchFrame[] = []
  private dead: Uint8Array
  private win: [number, number] | null = null
  private ptrs = new Map<string, SearchPointer>()
  private block = 0
  private status: SearchFrame['status'] = 'searching'
  private result = -1

  constructor(values: number[], target: number) {
    this.a = values
    this.n = values.length
    this.target = target
    this.dead = new Uint8Array(this.n)
    this.show('', `Looking for ${target} in ${this.n} sorted values.`)
  }

  show(line: string, note: string, marks: Array<[number, number]> = []) {
    if (this.frames.length >= MAX_FRAMES) throw new Error('Too many frames')
    const mark = new Uint8Array(this.n)
    for (const [i, m] of marks) if (i >= 0 && i < this.n) mark[i] = m
    if (this.status === 'found') mark[this.result] = SM.found
    this.frames.push({
      line,
      note,
      mark,
      dead: this.dead.slice(),
      win: this.win,
      ptrs: [...this.ptrs.values()],
      block: this.block,
      probes: this.probes,
      status: this.status,
    })
  }

  /** Read a[i] and compare with the target. Returns a[i] − target. */
  probe(i: number, line: string, note?: string, mark: number = SM.probe, extra: Array<[number, number]> = []) {
    this.probes++
    const v = this.a[i]
    const op = v < this.target ? '<' : v > this.target ? '>' : '='
    this.show(line, note ?? `a[${i}] = ${v} ${op} ${this.target}`, [...extra, [i, mark]])
    return v - this.target
  }

  /** Narrow the live window; everything outside it is ruled out. */
  window(lo: number, hi: number) {
    this.win = [lo, hi]
    for (let i = 0; i < this.n; i++) if (i < lo || i > hi) this.dead[i] = 1
  }
  kill(from: number, to = from) {
    for (let i = Math.max(0, from); i <= Math.min(this.n - 1, to); i++) this.dead[i] = 1
  }
  setBlock(size: number) {
    this.block = size
  }
  ptr(label: string, i: number) {
    this.ptrs.set(label, { label, i })
  }
  unptr(...labels: string[]) {
    for (const l of labels) this.ptrs.delete(l)
  }

  found(i: number, line: string) {
    this.result = i
    this.status = 'found'
    this.ptrs.clear()
    this.show(line, `Found ${this.target} at index ${i} after ${this.probes} probe${this.probes === 1 ? '' : 's'}.`)
  }
  missing(line: string, why = '') {
    this.result = -1
    this.status = 'missing'
    this.ptrs.clear()
    this.kill(0, this.n - 1)
    this.show(line, `${this.target} is not in the array${why ? `: ${why}` : ''}. ${this.probes} probes.`)
  }

  finish(): SearchRun {
    return {
      n: this.n,
      values: this.a,
      maxValue: Math.max(...this.a, this.target, 1),
      target: this.target,
      frames: this.frames,
      result: this.result,
    }
  }
}

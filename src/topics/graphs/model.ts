import { mulberry32 } from '../../engine/rng'

/** Nodes are 0..n-1. Positions are in [0, 1] and only matter for drawing. */
export interface Graph {
  n: number
  directed: boolean
  pos: { x: number; y: number }[]
  edges: [number, number][]
  /** Sorted adjacency lists (the order every algorithm and listing scans in). */
  adj: number[][]
}

export function makeGraph(pos: [number, number][], edges: [number, number][], directed: boolean): Graph {
  const n = pos.length
  const adj: number[][] = Array.from({ length: n }, () => [])
  const seen = new Set<string>()
  const clean: [number, number][] = []
  for (const [u, v] of edges) {
    if (u === v) continue
    const key = directed ? `${u}>${v}` : `${Math.min(u, v)}-${Math.max(u, v)}`
    if (seen.has(key)) continue
    seen.add(key)
    clean.push([u, v])
    adj[u].push(v)
    if (!directed) adj[v].push(u)
  }
  for (const a of adj) a.sort((x, y) => x - y)
  return { n, directed, pos: pos.map(([x, y]) => ({ x, y })), edges: clean, adj }
}

/** Index of edge u–v (either direction when undirected), or -1. */
export function edgeIndex(g: Graph, u: number, v: number) {
  return g.edges.findIndex(([a, b]) => (a === u && b === v) || (!g.directed && a === v && b === u))
}

export interface Preset {
  id: string
  label: string
  make(seed: number): Graph
}

// ── hand-made graphs ─────────────────────────────────────────────────────
const campus = () =>
  makeGraph(
    [[0.06, 0.5], [0.24, 0.18], [0.24, 0.82], [0.44, 0.36], [0.44, 0.72], [0.62, 0.12], [0.64, 0.56], [0.8, 0.3], [0.8, 0.86], [0.95, 0.56]],
    [[0, 1], [0, 2], [1, 3], [2, 4], [3, 4], [1, 5], [3, 6], [4, 6], [5, 7], [6, 7], [6, 8], [7, 9], [8, 9]],
    false,
  )

const islands = () =>
  makeGraph(
    [[0.08, 0.28], [0.24, 0.1], [0.28, 0.42], [0.1, 0.62], [0.48, 0.18], [0.68, 0.12], [0.6, 0.44], [0.42, 0.84], [0.62, 0.74], [0.84, 0.6], [0.92, 0.9], [0.9, 0.26]],
    [[0, 1], [1, 2], [2, 0], [0, 3], [4, 5], [5, 6], [7, 8], [8, 9], [9, 10], [8, 10]],
    false,
  )

const gridGraph = () => {
  const pos: [number, number][] = []
  const edges: [number, number][] = []
  const R = 3
  const C = 4
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) pos.push([0.1 + (c * 0.8) / (C - 1), 0.12 + (r * 0.76) / (R - 1)])
  for (let r = 0; r < R; r++)
    for (let c = 0; c < C; c++) {
      const i = r * C + c
      if (c + 1 < C) edges.push([i, i + 1])
      if (r + 1 < R) edges.push([i, i + C])
    }
  return makeGraph(pos, edges, false)
}

const oddRing = () => {
  const pos: [number, number][] = []
  const k = 7
  for (let i = 0; i < k; i++) pos.push([0.5 + 0.38 * Math.cos((2 * Math.PI * i) / k - Math.PI / 2), 0.5 + 0.4 * Math.sin((2 * Math.PI * i) / k - Math.PI / 2)])
  pos.push([0.5, 0.5])
  const edges: [number, number][] = Array.from({ length: k }, (_, i) => [i, (i + 1) % k])
  edges.push([7, 0], [7, 3])
  return makeGraph(pos, edges, false)
}

const coursePlan = (loop: boolean) =>
  makeGraph(
    [[0.06, 0.2], [0.06, 0.75], [0.28, 0.35], [0.28, 0.85], [0.5, 0.2], [0.52, 0.66], [0.72, 0.42], [0.94, 0.25], [0.9, 0.82]],
    [[0, 2], [1, 2], [1, 3], [2, 4], [3, 5], [2, 5], [4, 6], [5, 6], [6, 7], [5, 8], ...(loop ? ([[6, 2]] as [number, number][]) : [])],
    true,
  )

// ── random graphs ────────────────────────────────────────────────────────
function scatter(n: number, rand: () => number): [number, number][] {
  const cols = Math.ceil(Math.sqrt(n * 1.7))
  const rows = Math.ceil(n / cols)
  const cells = Array.from({ length: cols * rows }, (_, i) => i)
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[cells[i], cells[j]] = [cells[j], cells[i]]
  }
  return cells.slice(0, n).map((c) => {
    const cx = c % cols
    const cy = Math.floor(c / cols)
    return [(cx + 0.2 + rand() * 0.6) / cols, (cy + 0.2 + rand() * 0.6) / rows]
  })
}

const dist2 = (a: [number, number], b: [number, number]) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2

/** Each node links to its nearest neighbours: planar-ish and readable. */
export function randomGraph(seed: number, kind: 'undirected' | 'dag' | 'cyclic', n = 11): Graph {
  const rand = mulberry32(seed)
  let pos = scatter(n, rand)
  if (kind !== 'undirected') pos = [...pos].sort((a, b) => a[0] - b[0])
  const edges: [number, number][] = []
  for (let i = 0; i < n; i++) {
    const near = pos
      .map((p, j) => [j, dist2(pos[i], p)] as const)
      .filter(([j]) => j !== i)
      .sort((a, b) => a[1] - b[1])
      .slice(0, kind === 'undirected' ? 2 : 3)
    for (const [j] of near) {
      if (kind === 'undirected') edges.push([i, j])
      else if (j > i && rand() < 0.8) edges.push([i, j])
    }
  }
  if (kind === 'cyclic') {
    // One edge pointing back to an earlier node closes a loop.
    const from = Math.floor(n * 0.7)
    const to = Math.floor(n * 0.3)
    edges.push([from, to])
    edges.push([to, from - 1 > to ? to + 1 : from])
  }
  return makeGraph(pos, edges, kind !== 'undirected')
}

export const PRESETS = {
  undirected: [
    { id: 'campus', label: 'Campus', make: campus },
    { id: 'grid', label: 'Grid', make: gridGraph },
    { id: 'islands', label: 'Islands', make: islands },
    { id: 'random', label: 'Random', make: (s: number) => randomGraph(s, 'undirected') },
  ],
  components: [
    { id: 'islands', label: 'Islands', make: islands },
    { id: 'campus', label: 'Campus', make: campus },
    { id: 'random', label: 'Random', make: (s: number) => randomGraph(s, 'undirected', 12) },
  ],
  bipartite: [
    { id: 'grid', label: 'Grid (bipartite)', make: gridGraph },
    { id: 'odd', label: 'Odd ring (not)', make: oddRing },
    { id: 'campus', label: 'Campus', make: campus },
    { id: 'random', label: 'Random', make: (s: number) => randomGraph(s, 'undirected') },
  ],
  dag: [
    { id: 'courses', label: 'Course plan', make: () => coursePlan(false) },
    { id: 'random', label: 'Random DAG', make: (s: number) => randomGraph(s, 'dag') },
  ],
  cycle: [
    { id: 'loop', label: 'Dependency loop', make: () => coursePlan(true) },
    { id: 'courses', label: 'No loop', make: () => coursePlan(false) },
    { id: 'random', label: 'Random', make: (s: number) => randomGraph(s, 'cyclic') },
  ],
} satisfies Record<string, Preset[]>

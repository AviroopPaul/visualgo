import { describe, expect, it } from 'vitest'
import { parseListing } from '../../engine/code'
import { CPP_PRELUDE, cppBody, HAS_CPP, HAS_PYTHON, runCpp, runPython, shown } from '../../test/runners'
import { bfs } from './algorithms/bfs'
import { bipartite } from './algorithms/bipartite'
import { components } from './algorithms/components'
import { cycle } from './algorithms/cycle'
import { dfs } from './algorithms/dfs'
import { topo } from './algorithms/topo'
import { GRID_CODE, makeGrid, runGrid, toMatrix, type GridState } from './grid'
import { PRESETS, type Graph } from './model'
import { GRAPHS } from './registry'

const SEEDS = Array.from({ length: 30 }, (_, i) => i + 1)
const undirected = [...PRESETS.undirected, ...PRESETS.components, ...PRESETS.bipartite].flatMap((p) => (p.id === 'random' ? SEEDS.map((s) => p.make(s)) : [p.make(0)]))
const directed = [...PRESETS.dag, ...PRESETS.cycle].flatMap((p) => (p.id.startsWith('random') ? SEEDS.map((s) => p.make(s)) : [p.make(0)]))

// ── independent reference answers ────────────────────────────────────────
function refComponents(g: Graph) {
  const parent = Array.from({ length: g.n }, (_, i) => i)
  const find = (x: number): number => (parent[x] === x ? x : (parent[x] = find(parent[x])))
  for (const [u, v] of g.edges) parent[find(u)] = find(v)
  return new Set(parent.map((_, i) => find(i))).size
}
function refHasCycle(g: Graph) {
  // A directed graph is acyclic iff repeatedly deleting sinks empties it.
  const alive = new Set(Array.from({ length: g.n }, (_, i) => i))
  let changed = true
  while (changed) {
    changed = false
    for (const u of alive) if (!g.adj[u].some((v) => alive.has(v))) alive.delete(u), (changed = true)
  }
  return alive.size > 0
}
function refBipartite(g: Graph) {
  // Bipartite iff there is no odd cycle: brute-force 2-colouring per component.
  const side = new Array(g.n).fill(-1)
  const assign = (u: number, s: number): boolean => {
    if (side[u] !== -1) return side[u] === s
    side[u] = s
    return g.adj[u].every((v) => assign(v, 1 - s))
  }
  return Array.from({ length: g.n }, (_, u) => u).every((u) => side[u] !== -1 || assign(u, 0))
}
function refDistances(g: Graph, s: number) {
  const d = new Array(g.n).fill(-1)
  d[s] = 0
  for (let k = 0; k < g.n; k++) for (const [u, v] of g.edges) for (const [a, b] of [[u, v], [v, u]]) if (d[a] >= 0 && (d[b] < 0 || d[b] > d[a] + 1)) d[b] = d[a] + 1
  return d
}

const jsFn = (src: string, name: string) => new Function(`${src}\nreturn ${name};`)()

describe('graph algorithms agree with reference answers and their JS listings', () => {
  it('BFS: distances are shortest, order matches the listing', () => {
    const listing = jsFn(shown(bfs.code.js), 'bfs')
    for (const g of undirected)
      for (const s of [0, g.n - 1]) {
        const r = bfs.run(g, s).result
        expect(r.dist).toEqual(refDistances(g, s))
        expect(listing(g.adj, s)).toEqual(r)
      }
  })
  it('DFS: visits every reachable node, order matches the listing', () => {
    const listing = jsFn(shown(dfs.code.js), 'dfs')
    for (const g of undirected)
      for (const s of [0, g.n - 1]) {
        const r = dfs.run(g, s).result
        const reach = refDistances(g, s).filter((d) => d >= 0).length
        expect(r.order.length).toBe(reach)
        const visited = new Array(g.n).fill(false)
        const order: number[] = []
        listing(g.adj, s, visited, order)
        expect(order).toEqual(r.order)
      }
  })
  it('Topological sort: valid order on DAGs, null on cycles, same as the listing', () => {
    const listing = jsFn(shown(topo.code.js), 'topoSort')
    for (const g of directed) {
      const r = topo.run(g, 0).result
      expect(r === null).toBe(refHasCycle(g))
      if (r) {
        const at = new Map(r.map((u, i) => [u, i]))
        for (const [u, v] of g.edges) expect(at.get(u)!).toBeLessThan(at.get(v)!)
      }
      expect(listing(g.adj)).toEqual(r)
    }
  })
  it('Connected components: count matches union-find, labels match the listing', () => {
    const listing = jsFn(shown(components.code.js), 'components')
    for (const g of undirected) {
      const r = components.run(g, 0).result
      expect(r.count).toBe(refComponents(g))
      for (const [u, v] of g.edges) expect(r.comp[u]).toBe(r.comp[v])
      expect(listing(g.adj)).toEqual(r)
    }
  })
  it('Cycle detection: matches sink-peeling and the listing', () => {
    const listing = jsFn(shown(cycle.code.js), 'hasCycle')
    for (const g of directed) {
      const r = cycle.run(g, 0).result
      expect(r).toBe(refHasCycle(g))
      expect(listing(g.adj)).toBe(r)
    }
    expect(directed.some((g) => refHasCycle(g))).toBe(true)
    expect(directed.some((g) => !refHasCycle(g))).toBe(true)
  })
  it('Bipartite check: matches brute-force two-colouring and the listing', () => {
    const listing = jsFn(shown(bipartite.code.js), 'isBipartite')
    for (const g of undirected) {
      const r = bipartite.run(g, 0).result
      expect(r).toBe(refBipartite(g))
      expect(listing(g.adj)).toBe(r)
    }
    expect(undirected.some((g) => refBipartite(g))).toBe(true)
    expect(undirected.some((g) => !refBipartite(g))).toBe(true)
  })

  it.each(GRAPHS.map((a) => [a.name, a] as const))('%s only highlights lines that exist in every listing', (_, algo) => {
    const used = new Set<string>()
    for (const g of algo.directed ? directed : undirected) for (const f of algo.run(g, 0).frames) if (f.line) used.add(f.line)
    for (const l of Object.values(algo.code)) {
      for (const label of used) expect(parseListing(l).labels.has(label), `${l.lang} @${label}`).toBe(true)
      expect(parseListing(l).lines.join('\n')).not.toMatch(/@\w/)
    }
  })
})

// ── Python and C++ listings return the same answers as the JS ones ────────
const pyGraphs = (gs: Graph[]) => JSON.stringify(gs.map((g) => g.adj))
const cppGraph = (g: Graph) => `vector<vector<int>>{${g.adj.map((a) => `{${a.join(',')}}`).join(',')}}`
const U = undirected.filter((_, i) => i % 3 === 0)
const D = directed.filter((_, i) => i % 3 === 0)

describe.skipIf(!HAS_PYTHON)('Python graph listings', () => {
  it('match the traced results', () => {
    const program = `
import json
exec(${JSON.stringify(shown(bfs.code.py))})
exec(${JSON.stringify(shown(dfs.code.py))})
exec(${JSON.stringify(shown(topo.code.py))})
exec(${JSON.stringify(shown(components.code.py))})
exec(${JSON.stringify(shown(cycle.code.py))})
exec(${JSON.stringify(shown(bipartite.code.py))})
out = []
for g in ${pyGraphs(U)}:
    order, dist = bfs(g, 0)
    visited, dorder = [False] * len(g), []
    dfs(g, 0, visited, dorder)
    count, comp = components(g)
    out.append([order, dist, dorder, count, comp, is_bipartite(g)])
for g in ${pyGraphs(D)}:
    out.append([topo_sort(g), has_cycle(g)])
print(json.dumps(out))
`
    const expected = [
      ...U.map((g) => {
        const b = bfs.run(g, 0).result
        const c = components.run(g, 0).result
        return [b.order, b.dist, dfs.run(g, 0).result.order, c.count, c.comp, bipartite.run(g, 0).result]
      }),
      ...D.map((g) => [topo.run(g, 0).result, cycle.run(g, 0).result]),
    ]
    expect(JSON.parse(runPython(program))).toEqual(expected)
  })
})

describe.skipIf(!HAS_CPP)('C++ graph listings', () => {
  it('compile cleanly and match the traced results', () => {
    const units = [bfs, dfs, topo, components, cycle, bipartite].map((a) => `namespace g_${a.id.replace(/-/g, '_')} {\n${cppBody(a.code.cpp)}\n}`)
    const vec = 'auto pv = [](const vector<int>& v) { printf("["); for (size_t i = 0; i < v.size(); i++) printf(i ? ",%d" : "%d", v[i]); printf("]"); };'
    const program = `${CPP_PRELUDE}#include <deque>\n${units.join('\n')}
int main() {
  ${vec}
${U.map(
  (g) => `  { auto g = ${cppGraph(g)};
    auto [order, dist] = g_bfs::bfs(g, 0); pv(order); printf(" "); pv(dist); printf(" ");
    vector<bool> vis(g.size()); vector<int> dorder; g_dfs::dfs(g, 0, vis, dorder); pv(dorder); printf(" ");
    vector<int> comp; int count = g_connected_components::components(g, comp); printf("%d ", count); pv(comp);
    printf(" %s\\n", g_bipartite::isBipartite(g) ? "true" : "false"); }`,
).join('\n')}
${D.map((g) => `  { auto g = ${cppGraph(g)}; pv(g_topological_sort::topoSort(g)); printf(" %s\\n", g_cycle_detection::hasCycle(g) ? "true" : "false"); }`).join('\n')}
}
`
    const lines = runCpp(program).trim().split('\n')
    const j = (x: unknown) => JSON.stringify(x)
    const expected = [
      ...U.map((g) => {
        const b = bfs.run(g, 0).result
        const c = components.run(g, 0).result
        return `${j(b.order)} ${j(b.dist)} ${j(dfs.run(g, 0).result.order)} ${c.count} ${j(c.comp)} ${bipartite.run(g, 0).result}`
      }),
      ...D.map((g) => `${j(topo.run(g, 0).result ?? [])} ${cycle.run(g, 0).result}`),
    ]
    expect(lines).toEqual(expected)
  }, 120_000)
})

// ── grid mode ────────────────────────────────────────────────────────────
const GRIDS: GridState[] = (['maze', 'random', 'empty'] as const).flatMap((style) => [1, 2, 3, 4, 5, 6].map((s) => makeGrid(style, s)))
function refGridDist(g: GridState) {
  const d = new Array(g.walls.length).fill(-1)
  d[g.start] = 0
  const q = [g.start]
  while (q.length) {
    const u = q.shift()!
    const r = Math.floor(u / g.cols)
    const c = u % g.cols
    for (const [nr, nc] of [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]]) {
      const v = nr * g.cols + nc
      if (nr >= 0 && nr < g.rows && nc >= 0 && nc < g.cols && !g.walls[v] && d[v] < 0) (d[v] = d[u] + 1), q.push(v)
    }
  }
  return d[g.goal]
}
const toRc = (g: GridState, path: number[] | null) => (path ? path.map((i) => [Math.floor(i / g.cols), i % g.cols]) : null)

describe('grid BFS / DFS', () => {
  it('BFS finds a shortest path, DFS a valid one, both matching their JS listings', () => {
    for (const kind of ['bfs', 'dfs'] as const) {
      const listing = jsFn(shown(GRID_CODE[kind].js), `${kind}Grid`)
      for (const g of GRIDS) {
        const { path } = runGrid(g, kind)
        const best = refGridDist(g)
        expect(path === null).toBe(best < 0)
        if (path) {
          if (kind === 'bfs') expect(path.length - 1).toBe(best)
          expect(path[0]).toBe(g.start)
          expect(path[path.length - 1]).toBe(g.goal)
          for (let i = 1; i < path.length; i++) {
            const [a, b] = [path[i - 1], path[i]]
            expect(Math.abs(Math.floor(a / g.cols) - Math.floor(b / g.cols)) + Math.abs((a % g.cols) - (b % g.cols))).toBe(1)
            expect(g.walls[b]).toBe(0)
          }
        }
        const rc = (i: number) => [Math.floor(i / g.cols), i % g.cols]
        expect(listing(toMatrix(g), rc(g.start), rc(g.goal))).toEqual(toRc(g, path))
      }
      const used = new Set(GRIDS.flatMap((g) => runGrid(g, kind).frames.map((f) => f.line)).filter(Boolean))
      for (const l of Object.values(GRID_CODE[kind])) for (const label of used) expect(parseListing(l).labels.has(label), `${kind} ${l.lang} @${label}`).toBe(true)
    }
    expect(GRIDS.some((g) => refGridDist(g) < 0)).toBe(true)
  })

  it.skipIf(!HAS_PYTHON)('Python grid listings match', () => {
    const program = `
import json
exec(${JSON.stringify(shown(GRID_CODE.bfs.py))})
exec(${JSON.stringify(shown(GRID_CODE.dfs.py))})
out = []
for grid, s, t in ${JSON.stringify(GRIDS.map((g) => [toMatrix(g), [Math.floor(g.start / g.cols), g.start % g.cols], [Math.floor(g.goal / g.cols), g.goal % g.cols]]))}:
    for f in (bfs_grid, dfs_grid):
        p = f(grid, tuple(s), tuple(t))
        out.append(None if p is None else [list(c) for c in p])
print(json.dumps(out))
`
    const expected = GRIDS.flatMap((g) => (['bfs', 'dfs'] as const).map((k) => toRc(g, runGrid(g, k).path)))
    expect(JSON.parse(runPython(program))).toEqual(expected)
  })

  it.skipIf(!HAS_CPP)('C++ grid listings compile cleanly and match', () => {
    const program = `${CPP_PRELUDE}#include <deque>
${cppBody(GRID_CODE.bfs.cpp)}
${cppBody(GRID_CODE.dfs.cpp)}
int main() {
${GRIDS.map((g) => {
  const m = toMatrix(g)
  const s = `{${Math.floor(g.start / g.cols)}, ${g.start % g.cols}}`
  const t = `{${Math.floor(g.goal / g.cols)}, ${g.goal % g.cols}}`
  return `  { vector<vector<int>> grid = {${m.map((row) => `{${row.join(',')}}`).join(',')}};
    for (auto p : {bfsGrid(grid, ${s}, ${t}), dfsGrid(grid, ${s}, ${t})}) { printf("%d", (int)p.size()); for (auto [r, c] : p) printf(" %d,%d", r, c); printf("\\n"); } }`
}).join('\n')}
}
`
    const expected = GRIDS.flatMap((g) =>
      (['bfs', 'dfs'] as const).map((k) => {
        const p = toRc(g, runGrid(g, k).path) ?? []
        return [String(p.length), ...p.map(([r, c]) => `${r},${c}`)].join(' ')
      }),
    )
    expect(runCpp(program).trim().split('\n')).toEqual(expected)
  }, 120_000)
})

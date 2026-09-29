import { PRESETS } from '../model'
import { GE, GN, GraphRecorder } from '../recorder'
import { cpp, js, py, type GraphAlgorithm } from '../types'

const WHITE = 0
const GRAY = 1
const BLACK = 2

export const cycle: GraphAlgorithm<boolean> = {
  id: 'cycle-detection',
  name: 'Cycle detection',
  group: 'Structure',
  tagline: 'An arrow back to a node still in progress means a loop.',
  about: [
    'Run DFS and give every node one of three colours: white (not seen), gray (entered, still exploring its arrows) and black (finished).',
    'The gray nodes are exactly the current path from the start. An arrow into a gray node leads back into that path: a cycle.',
    'An arrow into a black node is harmless; that node was fully explored and cannot reach back.',
  ],
  complexity: { best: 'O(V + E)', average: 'O(V + E)', worst: 'O(V + E)', space: 'O(V)' },
  directed: true,
  presets: PRESETS.cycle,
  needsStart: false,
  grid: false,
  run(g) {
    const rec = new GraphRecorder(g, (s) => `${s} entered`)
    const color = new Array(g.n).fill(WHITE)
    const path: number[] = []
    const lists = () => rec.list('Gray path', 'stack', path)
    let found = false

    const visit = (u: number, from: number | null): boolean => {
      color[u] = GRAY
      path.push(u)
      rec.steps++
      rec.mark(u, GN.open)
      rec.ptr('u', u)
      lists()
      rec.show('enter', `Enter ${u}: gray while its arrows are explored`, { pulse: from == null ? [] : [[from, u]], nodes: [[u, GN.active]] })
      for (const v of g.adj[u]) {
        rec.ptr('v', v)
        if (color[v] === GRAY) {
          const loop = path.slice(path.indexOf(v))
          for (const x of loop) rec.mark(x, GN.bad)
          for (let i = 0; i < loop.length; i++) rec.markEdge(loop[i], loop[(i + 1) % loop.length], GE.bad)
          rec.show('back', `${u} → ${v} points back to ${v}, which is still gray: cycle ${[...loop, v].join(' → ')}`)
          return true
        }
        if (color[v] === WHITE) {
          rec.markEdge(u, v, GE.tree)
          rec.show('recurse', `${v} is white: go deeper`, { nodes: [[u, GN.active]] })
          if (visit(v, u)) return true
          rec.ptr('u', u)
        } else rec.show('recurse', `${v} is black (finished): no loop through it`, { edges: [[u, v, GE.scan]], nodes: [[u, GN.active]] })
      }
      rec.ptr('v', null)
      color[u] = BLACK
      rec.mark(u, GN.done)
      path.pop()
      lists()
      rec.show('finish', `${u} is finished: black`)
      return false
    }

    rec.show('', 'Look for an arrow that leads back into the current path')
    for (let s = 0; s < g.n && !found; s++) {
      if (color[s] !== WHITE) continue
      rec.show('start', `${s} is still white: search from it`, { nodes: [[s, GN.active]] })
      found = visit(s, null)
    }
    rec.ptr('u', null)
    rec.ptr('v', null)
    if (!found) rec.show('acyclic', 'Every node finished without meeting a gray node: no cycles')
    return { frames: rec.frames, result: found }
  },
  guide: {
    aka: ['three-colour DFS', 'back edge detection'],
    use: 'Catching circular dependencies before they cause trouble: import cycles, deadlocks in a wait-for graph, spreadsheet formulas that refer to themselves, or checking that a task graph really is a DAG before topologically sorting it.',
    wikipedia: 'https://en.wikipedia.org/wiki/Cycle_(graph_theory)#Cycle_detection',
  },
  code: {
    py: py(`
WHITE, GRAY, BLACK = 0, 1, 2

def has_cycle(graph):
    color = [WHITE] * len(graph)

    def visit(u):
        color[u] = GRAY                              # @enter
        for v in graph[u]:
            if color[v] == GRAY:
                return True                          # @back
            if color[v] == WHITE and visit(v):       # @recurse
                return True
        color[u] = BLACK                             # @finish
        return False

    for u in range(len(graph)):
        if color[u] == WHITE and visit(u):           # @start
            return True
    return False                                     # @acyclic`),
    js: js(`
const WHITE = 0, GRAY = 1, BLACK = 2;

function hasCycle(graph) {
  const color = new Array(graph.length).fill(WHITE);

  function visit(u) {
    color[u] = GRAY;                               // @enter
    for (const v of graph[u]) {
      if (color[v] === GRAY) return true;          // @back
      if (color[v] === WHITE && visit(v)) return true;   // @recurse
    }
    color[u] = BLACK;                              // @finish
    return false;
  }

  for (let u = 0; u < graph.length; u++)
    if (color[u] === WHITE && visit(u)) return true;     // @start
  return false;                                    // @acyclic
}`),
    cpp: cpp(`
enum Color { WHITE, GRAY, BLACK };

bool visit(const vector<vector<int>>& graph, int u, vector<Color>& color) {
    color[u] = GRAY;                               // @enter
    for (int v : graph[u]) {
        if (color[v] == GRAY) return true;         // @back
        if (color[v] == WHITE && visit(graph, v, color)) return true;   // @recurse
    }
    color[u] = BLACK;                              // @finish
    return false;
}

bool hasCycle(const vector<vector<int>>& graph) {
    vector<Color> color(graph.size(), WHITE);
    for (int u = 0; u < (int)graph.size(); u++)
        if (color[u] == WHITE && visit(graph, u, color)) return true;   // @start
    return false;                                  // @acyclic
}`),
  },
}

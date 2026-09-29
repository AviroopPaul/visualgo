import { PRESETS } from '../model'
import { GE, GN, GraphRecorder } from '../recorder'
import { cpp, js, py, type GraphAlgorithm } from '../types'

export const dfs: GraphAlgorithm<{ order: number[] }> = {
  id: 'dfs',
  name: 'Depth-first search',
  group: 'Traversal',
  tagline: 'Go as deep as you can, then back up and try the next branch.',
  about: [
    'From the current node, step to the first unvisited neighbour and keep going until you hit a dead end.',
    'Then back up to the most recent node that still has an unexplored neighbour. Recursion (the call stack below the graph) does the bookkeeping.',
    'The edges DFS walks down form a tree. DFS is the engine behind cycle detection, topological sorting, maze generation and finding connected pieces.',
  ],
  complexity: { best: 'O(V + E)', average: 'O(V + E)', worst: 'O(V + E)', space: 'O(V)' },
  directed: false,
  presets: PRESETS.undirected,
  needsStart: true,
  grid: true,
  run(g, start) {
    const rec = new GraphRecorder(g, (s) => `${s} visited`)
    const visited = new Array(g.n).fill(false)
    const order: number[] = []
    const stack: number[] = []
    const lists = () => {
      rec.list('Call stack', 'stack', stack)
      rec.list('Visited', 'output', order)
    }
    const visit = (u: number, from: number | null) => {
      visited[u] = true
      order.push(u)
      stack.push(u)
      rec.steps++
      rec.mark(u, GN.open)
      rec.setBadge(u, String(order.length))
      rec.ptr('u', u)
      lists()
      rec.show('visit', from == null ? `Start at ${u}` : `Visit ${u}`, { pulse: from == null ? [] : [[from, u]], nodes: [[u, GN.active]] })
      for (const v of g.adj[u]) {
        rec.ptr('v', v)
        if (!visited[v]) {
          rec.markEdge(u, v, GE.tree)
          rec.show('recurse', `${v} is unvisited: go deeper`, { nodes: [[u, GN.active]] })
          visit(v, u)
          rec.ptr('u', u)
        } else rec.show('check', `${v} is already visited`, { edges: [[u, v, GE.scan]], nodes: [[u, GN.active]] })
      }
      rec.ptr('v', null)
      rec.mark(u, GN.done)
      stack.pop()
      lists()
      rec.show('done', `Every neighbour of ${u} is explored: back up${stack.length ? ` to ${stack[stack.length - 1]}` : ''}`)
    }
    rec.show('', `Depth-first search from ${start}. Badges show the order nodes are first reached.`)
    visit(start, null)
    rec.ptr('u', null)
    rec.show('', `Done: reached ${order.length} of ${g.n} nodes in the order ${order.join(', ')}`)
    return { frames: rec.frames, result: { order } }
  },
  guide: {
    aka: ['DFS', 'backtracking search'],
    use: 'Exploring every node or path: detecting cycles, topological sorting, finding connected components and bridges, solving puzzles and mazes by backtracking. It does not find shortest paths; use BFS for that.',
    wikipedia: 'https://en.wikipedia.org/wiki/Depth-first_search',
  },
  code: {
    py: py(`
def dfs(graph, u, visited, order):
    visited[u] = True
    order.append(u)                              # @visit
    for v in graph[u]:
        if not visited[v]:                       # @check
            dfs(graph, v, visited, order)        # @recurse
    # every neighbour of u is explored          # @done

# visited = [False] * len(graph); order = []
# dfs(graph, start, visited, order)`),
    js: js(`
function dfs(graph, u, visited, order) {
  visited[u] = true;
  order.push(u);                                 // @visit
  for (const v of graph[u]) {
    if (!visited[v]) {                           // @check
      dfs(graph, v, visited, order);             // @recurse
    }
  }
  // every neighbour of u is explored            // @done
}

// const visited = new Array(graph.length).fill(false), order = [];
// dfs(graph, start, visited, order);`),
    cpp: cpp(`
void dfs(const vector<vector<int>>& graph, int u, vector<bool>& visited, vector<int>& order) {
    visited[u] = true;
    order.push_back(u);                          // @visit
    for (int v : graph[u]) {
        if (!visited[v]) {                       // @check
            dfs(graph, v, visited, order);       // @recurse
        }
    }
    // every neighbour of u is explored          // @done
}

// vector<bool> visited(graph.size()); vector<int> order;
// dfs(graph, start, visited, order);`),
  },
}

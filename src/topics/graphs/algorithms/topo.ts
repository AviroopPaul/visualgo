import { PRESETS } from '../model'
import { GE, GN, GraphRecorder } from '../recorder'
import { cpp, js, py, type GraphAlgorithm } from '../types'

export const topo: GraphAlgorithm<number[] | null> = {
  id: 'topological-sort',
  name: 'Topological sort',
  group: 'Ordering',
  tagline: 'Line up tasks so every arrow points forward (Kahn’s algorithm).',
  about: [
    'Arrows are dependencies: u → v means u must come before v. Count each node’s incoming arrows (its in-degree, the badge).',
    'Nodes with in-degree 0 depend on nothing, so they can go first. Put them in a queue.',
    'Take a node from the queue, add it to the order and delete its outgoing arrows. Any node whose in-degree drops to 0 joins the queue.',
    'If some nodes never reach 0, they sit on a cycle and no valid order exists.',
  ],
  complexity: { best: 'O(V + E)', average: 'O(V + E)', worst: 'O(V + E)', space: 'O(V)' },
  directed: true,
  presets: [...PRESETS.dag, PRESETS.cycle[0]],
  needsStart: false,
  grid: false,
  run(g) {
    const rec = new GraphRecorder(g, (s) => `${s} placed`)
    const indeg = new Array(g.n).fill(0)
    for (let u = 0; u < g.n; u++) rec.setBadge(u, '0')
    rec.show('', 'Count incoming arrows for every node')
    for (let u = 0; u < g.n; u++)
      for (const v of g.adj[u]) {
        indeg[v]++
        rec.setBadge(v, String(indeg[v]))
        rec.show('count', `${u} → ${v}: ${v} now has ${indeg[v]} incoming`, { edges: [[u, v, GE.scan]] })
      }
    const queue: number[] = []
    const order: number[] = []
    const lists = () => {
      rec.list('Queue', 'queue', queue)
      rec.list('Order', 'output', order)
    }
    for (let u = 0; u < g.n; u++) if (indeg[u] === 0) queue.push(u)
    for (const u of queue) rec.mark(u, GN.frontier)
    lists()
    rec.show('seed', queue.length ? `Nothing points into ${queue.join(', ')}: they can go first` : 'Every node has an incoming arrow: there is nowhere to start')
    while (queue.length) {
      const u = queue.shift()!
      rec.ptr('u', u)
      lists()
      rec.show('pop', `Take ${u} from the queue`, { nodes: [[u, GN.active]] })
      order.push(u)
      rec.steps++
      rec.mark(u, GN.good)
      lists()
      rec.show('emit', `${u} is next in the order`)
      for (const v of g.adj[u]) {
        indeg[v]--
        rec.setBadge(v, String(indeg[v]))
        rec.markEdge(u, v, GE.gone)
        rec.show('relax', `Remove ${u} → ${v}: ${v} has ${indeg[v]} incoming left`, { pulse: [[u, v]] })
        if (indeg[v] === 0) {
          queue.push(v)
          rec.mark(v, GN.frontier)
          lists()
          rec.show('ready', `${v} has no incoming arrows left: queue it`)
        }
      }
    }
    rec.ptr('u', null)
    const ok = order.length === g.n
    if (!ok) for (let u = 0; u < g.n; u++) if (indeg[u] > 0) rec.mark(u, GN.bad)
    lists()
    rec.show(
      'check',
      ok ? `Valid order: ${order.join(' → ')}` : `Stuck: ${g.n - order.length} nodes are waiting on each other in a cycle, so no order exists`,
    )
    return { frames: rec.frames, result: ok ? order : null }
  },
  guide: {
    aka: ['topological ordering', "Kahn's algorithm", 'dependency resolution'],
    use: 'Ordering anything with dependencies: build systems and package managers (install a library before what needs it), course prerequisites, spreadsheet recalculation, task scheduling. It also tells you if the dependencies contain a cycle.',
    wikipedia: 'https://en.wikipedia.org/wiki/Topological_sorting',
  },
  code: {
    py: py(`
from collections import deque

def topo_sort(graph):
    n = len(graph)
    indeg = [0] * n
    for u in range(n):
        for v in graph[u]:
            indeg[v] += 1                            # @count
    queue = deque(u for u in range(n) if indeg[u] == 0)   # @seed
    order = []
    while queue:
        u = queue.popleft()                          # @pop
        order.append(u)                              # @emit
        for v in graph[u]:
            indeg[v] -= 1                            # @relax
            if indeg[v] == 0:
                queue.append(v)                      # @ready
    return order if len(order) == n else None        # @check`),
    js: js(`
function topoSort(graph) {
  const n = graph.length;
  const indeg = new Array(n).fill(0);
  for (let u = 0; u < n; u++)
    for (const v of graph[u]) indeg[v]++;          // @count
  const queue = [];
  for (let u = 0; u < n; u++) if (indeg[u] === 0) queue.push(u);   // @seed
  const order = [];
  while (queue.length > 0) {
    const u = queue.shift();                       // @pop
    order.push(u);                                 // @emit
    for (const v of graph[u]) {
      indeg[v]--;                                  // @relax
      if (indeg[v] === 0) queue.push(v);           // @ready
    }
  }
  return order.length === n ? order : null;        // @check
}`),
    cpp: cpp(
      `
// Returns an empty vector if the graph has a cycle.
vector<int> topoSort(const vector<vector<int>>& graph) {
    int n = graph.size();
    vector<int> indeg(n, 0), order;
    for (int u = 0; u < n; u++)
        for (int v : graph[u]) indeg[v]++;         // @count
    queue<int> q;
    for (int u = 0; u < n; u++) if (indeg[u] == 0) q.push(u);   // @seed
    while (!q.empty()) {
        int u = q.front(); q.pop();                // @pop
        order.push_back(u);                        // @emit
        for (int v : graph[u]) {
            indeg[v]--;                            // @relax
            if (indeg[v] == 0) q.push(v);          // @ready
        }
    }
    if ((int)order.size() != n) order.clear();     // @check
    return order;
}`,
      '#include <queue>\n#include <vector>\nusing namespace std;\n',
    ),
  },
}

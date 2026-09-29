import { PRESETS } from '../model'
import { GE, GN, GraphRecorder } from '../recorder'
import { cpp, js, py, type GraphAlgorithm } from '../types'

export const bfs: GraphAlgorithm<{ order: number[]; dist: number[] }> = {
  id: 'bfs',
  name: 'Breadth-first search',
  group: 'Traversal',
  tagline: 'Explore in rings: every node one edge away, then two, then three.',
  about: [
    'Put the start node in a queue. Repeatedly take the node at the front and add its unvisited neighbours to the back.',
    'Because the queue is first-in first-out, nodes are visited in order of distance from the start (the badge on each node).',
    'That makes BFS the way to find shortest paths when every edge costs the same, like fewest moves on a grid.',
  ],
  complexity: { best: 'O(V + E)', average: 'O(V + E)', worst: 'O(V + E)', space: 'O(V)' },
  directed: false,
  presets: PRESETS.undirected,
  needsStart: true,
  grid: true,
  run(g, start) {
    const rec = new GraphRecorder(g, (s) => `${s} visited`)
    const dist = new Array(g.n).fill(-1)
    const queue = [start]
    const order: number[] = []
    const lists = () => {
      rec.list('Queue', 'queue', queue)
      rec.list('Visited', 'output', order)
    }
    dist[start] = 0
    rec.setBadge(start, '0')
    rec.mark(start, GN.frontier)
    lists()
    rec.show('init', `Start at ${start}: distance 0, first in the queue`)
    while (queue.length) {
      const u = queue.shift()!
      rec.ptr('u', u)
      rec.mark(u, GN.active)
      lists()
      rec.show('pop', `Take ${u} from the front of the queue`)
      order.push(u)
      rec.steps++
      lists()
      rec.show('visit', `Visit ${u} (distance ${dist[u]})`)
      for (const v of g.adj[u]) {
        rec.ptr('v', v)
        if (dist[v] === -1) {
          dist[v] = dist[u] + 1
          queue.push(v)
          rec.setBadge(v, String(dist[v]))
          rec.mark(v, GN.frontier)
          rec.markEdge(u, v, GE.tree)
          lists()
          rec.show('discover', `${v} is new: distance ${dist[v]}, join the back of the queue`, { pulse: [[u, v]] })
        } else rec.show('check', `${v} was already seen`, { edges: [[u, v, GE.scan]] })
      }
      rec.ptr('v', null)
      rec.mark(u, GN.done)
    }
    rec.ptr('u', null)
    lists()
    const reached = order.length
    rec.show('', `Done: reached ${reached} of ${g.n} nodes. Each badge is the fewest edges from ${start}.`)
    return { frames: rec.frames, result: { order, dist } }
  },
  guide: {
    aka: ['BFS', 'level-order search'],
    use: 'Shortest paths in unweighted graphs and grids (mazes, fewest moves, degrees of separation), finding everything within k steps, testing bipartiteness, and web crawling. Use Dijkstra instead when edges have different weights.',
    wikipedia: 'https://en.wikipedia.org/wiki/Breadth-first_search',
  },
  code: {
    py: py(`
from collections import deque

def bfs(graph, start):
    dist = [-1] * len(graph)
    dist[start] = 0                              # @init
    queue = deque([start])
    order = []
    while queue:
        u = queue.popleft()                      # @pop
        order.append(u)                          # @visit
        for v in graph[u]:
            if dist[v] == -1:                    # @check
                dist[v] = dist[u] + 1            # @discover
                queue.append(v)
    return order, dist`),
    js: js(`
function bfs(graph, start) {
  const dist = new Array(graph.length).fill(-1);
  dist[start] = 0;                               // @init
  const queue = [start];
  const order = [];
  while (queue.length > 0) {
    const u = queue.shift();                     // @pop
    order.push(u);                               // @visit
    for (const v of graph[u]) {
      if (dist[v] === -1) {                      // @check
        dist[v] = dist[u] + 1;                   // @discover
        queue.push(v);
      }
    }
  }
  return { order, dist };
}`),
    cpp: cpp(
      `
pair<vector<int>, vector<int>> bfs(const vector<vector<int>>& graph, int start) {
    vector<int> dist(graph.size(), -1), order;
    dist[start] = 0;                             // @init
    queue<int> q;
    q.push(start);
    while (!q.empty()) {
        int u = q.front(); q.pop();              // @pop
        order.push_back(u);                      // @visit
        for (int v : graph[u]) {
            if (dist[v] == -1) {                 // @check
                dist[v] = dist[u] + 1;           // @discover
                q.push(v);
            }
        }
    }
    return {order, dist};
}`,
      '#include <queue>\n#include <vector>\nusing namespace std;\n',
    ),
  },
}

import { PRESETS } from '../model'
import { GE, GN, GraphRecorder } from '../recorder'
import { cpp, js, py, type GraphAlgorithm } from '../types'

const SIDE = ['A', 'B']

export const bipartite: GraphAlgorithm<boolean> = {
  id: 'bipartite',
  name: 'Bipartite check',
  group: 'Structure',
  tagline: 'Can you colour it with two colours so no edge joins the same colour?',
  about: [
    'Pick an uncoloured node and put it on side A. Run BFS: every neighbour must go on the other side.',
    'If you ever find an edge whose two ends are already on the same side, the graph is not bipartite.',
    'That happens exactly when the graph contains a cycle of odd length, like a triangle. Try the "Odd ring" graph.',
  ],
  complexity: { best: 'O(V + E)', average: 'O(V + E)', worst: 'O(V + E)', space: 'O(V)' },
  directed: false,
  presets: PRESETS.bipartite,
  needsStart: false,
  grid: false,
  run(g) {
    const rec = new GraphRecorder(g, (s) => `${s} coloured`)
    const side = new Array(g.n).fill(-1)
    const queue: number[] = []
    const lists = () => rec.list('Queue', 'queue', queue)
    const paint = (u: number, s: number) => {
      side[u] = s
      rec.setGroup(u, s)
      rec.setBadge(u, SIDE[s])
      rec.steps++
    }
    rec.show('', 'Try to split the nodes into two sides, A and B, so every edge crosses between them')
    for (let s = 0; s < g.n; s++) {
      if (side[s] !== -1) continue
      paint(s, 0)
      queue.push(s)
      rec.mark(s, GN.frontier)
      lists()
      rec.show('start', `${s} is uncoloured: put it on side A`)
      while (queue.length) {
        const u = queue.shift()!
        rec.ptr('u', u)
        lists()
        rec.show('pop', `Take ${u} (side ${SIDE[side[u]]}) from the queue`, { nodes: [[u, GN.active]] })
        for (const v of g.adj[u]) {
          if (side[v] === -1) {
            paint(v, 1 - side[u])
            queue.push(v)
            rec.mark(v, GN.frontier)
            rec.markEdge(u, v, GE.tree)
            lists()
            rec.show('color', `${v} goes on the opposite side, ${SIDE[side[v]]}`, { pulse: [[u, v]], nodes: [[u, GN.active]] })
          } else if (side[v] === side[u]) {
            rec.mark(u, GN.bad)
            rec.mark(v, GN.bad)
            rec.markEdge(u, v, GE.bad)
            rec.ptr('u', null)
            rec.show('conflict', `${u} and ${v} are neighbours but both on side ${SIDE[side[u]]}: not bipartite`)
            return { frames: rec.frames, result: false }
          } else rec.show('check', `${v} is on the other side already: fine`, { edges: [[u, v, GE.scan]], nodes: [[u, GN.active]] })
        }
        rec.mark(u, GN.done)
      }
    }
    rec.ptr('u', null)
    rec.show('ok', 'Every edge joins side A to side B: the graph is bipartite')
    return { frames: rec.frames, result: true }
  },
  guide: {
    aka: ['two-colouring', 'bipartite graph test'],
    use: 'Whenever things split into two kinds that only connect across: matching jobs to applicants, students to projects, scheduling two shifts, or checking a conflict graph can be split into two teams. Bipartite graphs also unlock fast matching algorithms.',
    wikipedia: 'https://en.wikipedia.org/wiki/Bipartite_graph',
  },
  code: {
    py: py(`
from collections import deque

def is_bipartite(graph):
    side = [-1] * len(graph)
    for s in range(len(graph)):
        if side[s] != -1:
            continue
        side[s] = 0                                  # @start
        queue = deque([s])
        while queue:
            u = queue.popleft()                      # @pop
            for v in graph[u]:
                if side[v] == -1:                    # @check
                    side[v] = 1 - side[u]            # @color
                    queue.append(v)
                elif side[v] == side[u]:
                    return False                     # @conflict
    return True                                      # @ok`),
    js: js(`
function isBipartite(graph) {
  const side = new Array(graph.length).fill(-1);
  for (let s = 0; s < graph.length; s++) {
    if (side[s] !== -1) continue;
    side[s] = 0;                                   // @start
    const queue = [s];
    while (queue.length > 0) {
      const u = queue.shift();                     // @pop
      for (const v of graph[u]) {
        if (side[v] === -1) {                      // @check
          side[v] = 1 - side[u];                   // @color
          queue.push(v);
        } else if (side[v] === side[u]) {
          return false;                            // @conflict
        }
      }
    }
  }
  return true;                                     // @ok
}`),
    cpp: cpp(
      `
bool isBipartite(const vector<vector<int>>& graph) {
    vector<int> side(graph.size(), -1);
    for (int s = 0; s < (int)graph.size(); s++) {
        if (side[s] != -1) continue;
        side[s] = 0;                               // @start
        queue<int> q;
        q.push(s);
        while (!q.empty()) {
            int u = q.front(); q.pop();            // @pop
            for (int v : graph[u]) {
                if (side[v] == -1) {               // @check
                    side[v] = 1 - side[u];         // @color
                    q.push(v);
                } else if (side[v] == side[u]) {
                    return false;                  // @conflict
                }
            }
        }
    }
    return true;                                   // @ok
}`,
      '#include <queue>\n#include <vector>\nusing namespace std;\n',
    ),
  },
}

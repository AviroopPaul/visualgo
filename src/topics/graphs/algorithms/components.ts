import { PRESETS } from '../model'
import { GE, GN, GraphRecorder } from '../recorder'
import { cpp, js, py, type GraphAlgorithm } from '../types'

export const components: GraphAlgorithm<{ count: number; comp: number[] }> = {
  id: 'connected-components',
  name: 'Connected components',
  group: 'Structure',
  tagline: 'Flood each unclaimed island with a new colour.',
  about: [
    'Walk the nodes in order. The first node that has no colour yet starts a new component.',
    'Flood outward from it with a stack (depth-first): every neighbour you can reach gets the same colour.',
    'When the stack runs dry, that island is complete; move on to the next uncoloured node.',
    'The number of colours used is the number of connected components.',
  ],
  complexity: { best: 'O(V + E)', average: 'O(V + E)', worst: 'O(V + E)', space: 'O(V)' },
  directed: false,
  presets: PRESETS.components,
  needsStart: false,
  grid: false,
  run(g) {
    const rec = new GraphRecorder(g, (s) => `${s} claimed`)
    const comp = new Array(g.n).fill(-1)
    let count = 0
    const stack: number[] = []
    const lists = () => rec.list('Stack', 'stack', stack)
    rec.show('', `Find the separate pieces of a ${g.n}-node graph`)
    for (let s = 0; s < g.n; s++) {
      if (comp[s] !== -1) {
        rec.show('skip', `${s} already belongs to component ${comp[s] + 1}`, { nodes: [[s, GN.active]] })
        continue
      }
      comp[s] = count
      rec.setGroup(s, count)
      rec.setBadge(s, String(count + 1))
      rec.steps++
      stack.push(s)
      rec.mark(s, GN.frontier)
      lists()
      rec.show('start', `${s} has no colour yet: start component ${count + 1}`)
      let size = 1
      while (stack.length) {
        const u = stack.pop()!
        rec.ptr('u', u)
        lists()
        rec.show('pop', `Take ${u} off the stack`, { nodes: [[u, GN.active]] })
        for (const v of g.adj[u]) {
          if (comp[v] === -1) {
            comp[v] = count
            size++
            rec.steps++
            rec.setGroup(v, count)
            rec.setBadge(v, String(count + 1))
            rec.markEdge(u, v, GE.tree)
            rec.mark(v, GN.frontier)
            stack.push(v)
            lists()
            rec.show('claim', `${v} is reachable: it joins component ${count + 1}`, { pulse: [[u, v]], nodes: [[u, GN.active]] })
          } else rec.show('check', `${v} is already coloured`, { edges: [[u, v, GE.scan]], nodes: [[u, GN.active]] })
        }
        rec.mark(u, GN.done)
      }
      rec.ptr('u', null)
      count++
      rec.show('next', `Component ${count} is complete: ${size} node${size === 1 ? '' : 's'}`)
    }
    rec.show('', `${count} connected component${count === 1 ? '' : 's'}`)
    return { frames: rec.frames, result: { count, comp } }
  },
  guide: {
    aka: ['connected components', 'flood fill', 'islands'],
    use: 'Grouping anything that is linked: friend circles in a social network, islands in a map, regions in an image (flood fill), or checking whether a network is fully connected. Union–find answers the same question when edges arrive one at a time.',
    wikipedia: 'https://en.wikipedia.org/wiki/Component_(graph_theory)',
  },
  code: {
    py: py(`
def components(graph):
    comp = [-1] * len(graph)
    count = 0
    for s in range(len(graph)):
        if comp[s] != -1:
            continue                                 # @skip
        comp[s] = count                              # @start
        stack = [s]
        while stack:
            u = stack.pop()                          # @pop
            for v in graph[u]:
                if comp[v] == -1:                    # @check
                    comp[v] = count                  # @claim
                    stack.append(v)
        count += 1                                   # @next
    return count, comp`),
    js: js(`
function components(graph) {
  const comp = new Array(graph.length).fill(-1);
  let count = 0;
  for (let s = 0; s < graph.length; s++) {
    if (comp[s] !== -1) continue;                  // @skip
    comp[s] = count;                               // @start
    const stack = [s];
    while (stack.length > 0) {
      const u = stack.pop();                       // @pop
      for (const v of graph[u]) {
        if (comp[v] === -1) {                      // @check
          comp[v] = count;                         // @claim
          stack.push(v);
        }
      }
    }
    count++;                                       // @next
  }
  return { count, comp };
}`),
    cpp: cpp(`
int components(const vector<vector<int>>& graph, vector<int>& comp) {
    comp.assign(graph.size(), -1);
    int count = 0;
    for (int s = 0; s < (int)graph.size(); s++) {
        if (comp[s] != -1) continue;               // @skip
        comp[s] = count;                           // @start
        vector<int> stack = {s};
        while (!stack.empty()) {
            int u = stack.back(); stack.pop_back();   // @pop
            for (int v : graph[u]) {
                if (comp[v] == -1) {               // @check
                    comp[v] = count;               // @claim
                    stack.push_back(v);
                }
            }
        }
        count++;                                   // @next
    }
    return count;
}`),
  },
}

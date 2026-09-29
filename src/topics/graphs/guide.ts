import type { Faq } from '../../components/Guide'
import type { GraphAlgorithm } from './types'

const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1)

export function graphFaqFor(a: GraphAlgorithm): Faq[] {
  const c = a.complexity
  const name = a.name
  const faq: Faq[] = [
    { q: `How does ${lower(name)} work?`, a: a.about.join(' ') },
    {
      q: `What is the time complexity of ${lower(name)}?`,
      a: `${name} runs in ${c.average} time, where V is the number of nodes (vertices) and E the number of edges: every node and every edge is handled a constant number of times. It uses ${c.space} extra memory.`,
    },
    { q: `When should you use ${lower(name)}?`, a: a.guide.use },
  ]
  if (a.id === 'bfs')
    faq.push({
      q: 'What is the difference between BFS and DFS?',
      a: 'BFS uses a queue and explores in rings of increasing distance, so it finds shortest paths in unweighted graphs. DFS uses a stack (or recursion) and follows one branch to the end before backtracking; it uses less memory on wide graphs and is the basis of cycle detection and topological sorting. Switch to the Grid view to watch the difference.',
    })
  if (a.id === 'dfs')
    faq.push({
      q: 'Does DFS find the shortest path?',
      a: 'No. DFS finds a path if one exists, but it follows whichever branch it meets first, so the path can be much longer than necessary. On the grid view, compare its path with BFS on the same walls.',
    })
  return faq
}

export const GRAPHS_FAQ: Faq[] = [
  {
    q: 'What is the difference between BFS and DFS?',
    a: 'Breadth-first search uses a queue and visits nodes in order of distance from the start, which makes it the tool for shortest paths in unweighted graphs. Depth-first search uses a stack or recursion and goes as deep as possible before backtracking; it underpins cycle detection, topological sorting and finding components.',
  },
  {
    q: 'What is topological sorting used for?',
    a: 'Putting tasks in an order that respects their dependencies: build systems, package installs, course prerequisites, spreadsheet recalculation. It only exists for directed acyclic graphs (DAGs); if there is a cycle, Kahn’s algorithm gets stuck and reports it.',
  },
  {
    q: 'How do you detect a cycle in a directed graph?',
    a: 'Run DFS with three colours: white (unvisited), gray (in progress) and black (done). The gray nodes form the current path, so an edge into a gray node means you have found a loop. Kahn’s topological sort also detects cycles: it cannot place every node.',
  },
  {
    q: 'What makes a graph bipartite?',
    a: 'Its nodes can be split into two groups so that every edge goes between the groups. Equivalently, it has no cycle of odd length. A BFS that alternates colours level by level either succeeds or finds an edge inside one group.',
  },
  {
    q: 'How do I use this graph visualizer?',
    a: 'Pick an algorithm and a graph (or a random one), click a node to start from it, and press play. For BFS and DFS switch to the Grid view and drag to draw walls; move S and G to change the start and goal. Press C to see the Python, JavaScript or C++ code with the running line highlighted.',
  },
]

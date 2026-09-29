import { bfs } from './algorithms/bfs'
import { bipartite } from './algorithms/bipartite'
import { components } from './algorithms/components'
import { cycle } from './algorithms/cycle'
import { dfs } from './algorithms/dfs'
import { topo } from './algorithms/topo'
import type { GraphAlgorithm, GraphGroup } from './types'

/** Add a graph algorithm by writing its file and listing it here. */
export const GRAPHS: GraphAlgorithm<any>[] = [bfs, dfs, topo, components, cycle, bipartite] // eslint-disable-line @typescript-eslint/no-explicit-any
export const GRAPH_GROUPS: GraphGroup[] = ['Traversal', 'Ordering', 'Structure']
export const graphById = (id: string) => GRAPHS.find((a) => a.id === id)

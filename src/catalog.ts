/**
 * Every topic visualgo covers, live or planned. To ship a new topic:
 *   1. build it under src/topics/<id>/ (reuse src/engine for frames, player, code panel)
 *   2. flip its status to 'live' and list its items
 *   3. register its routes in App.tsx
 */
export interface TopicItem {
  id: string
  name: string
}

export interface Topic {
  id: string
  title: string
  blurb: string
  status: 'live' | 'soon'
  /** CSS color used for the topic's accent. */
  accent: string
  items: TopicItem[]
}

import { GRAPHS } from './topics/graphs/registry'
import { SEARCHES } from './topics/searching/registry'
import { ALGORITHMS } from './topics/sorting/registry'
import { TREES } from './topics/trees/registry'

export const TOPICS: Topic[] = [
  {
    id: 'sorting',
    title: 'Sorting',
    blurb: 'Nineteen ways to put things in order, from bubble sort to bitonic networks.',
    status: 'live',
    accent: '#ffc145',
    items: ALGORITHMS.map((a) => ({ id: a.id, name: a.name })),
  },
  {
    id: 'searching',
    title: 'Searching',
    blurb: 'Hunting for one value: linear, jump, binary, ternary, exponential and interpolation search.',
    status: 'live',
    accent: '#3fc6ff',
    items: SEARCHES.map((a) => ({ id: a.id, name: a.name })),
  },
  {
    id: 'trees',
    title: 'Trees',
    blurb: 'Binary search trees, AVL rotations, every traversal order, tries and segment trees.',
    status: 'live',
    accent: '#35e0a1',
    items: TREES.map((t) => ({ id: t.id, name: t.name })),
  },
  {
    id: 'heaps',
    title: 'Heaps',
    blurb: 'Priority queues as trees and arrays at the same time.',
    status: 'soon',
    accent: '#ff5470',
    items: ['Binary heap', 'Heapify', 'Priority queue', 'Min-max heap'].map(item),
  },
  {
    id: 'graphs',
    title: 'Graphs',
    blurb: 'BFS and DFS (also on a grid you draw), topological sort, components, cycle detection and bipartite checks.',
    status: 'live',
    accent: '#9b8cff',
    items: GRAPHS.map((a) => ({ id: a.id, name: a.name })),
  },
  {
    id: 'paths',
    title: 'Shortest paths & MST',
    blurb: 'Dijkstra, A*, Bellman–Ford, Prim and Kruskal on a live grid.',
    status: 'soon',
    accent: '#ff8a3d',
    items: ['Dijkstra', 'A* search', 'Bellman–Ford', 'Floyd–Warshall', "Prim's MST", "Kruskal's MST"].map(item),
  },
  {
    id: 'linear',
    title: 'Linear structures',
    blurb: 'Arrays, linked lists, stacks, queues and deques, pointer by pointer.',
    status: 'soon',
    accent: '#7ee0ff',
    items: ['Linked list', 'Doubly linked list', 'Stack', 'Queue', 'Deque', 'Circular buffer'].map(item),
  },
  {
    id: 'hashing',
    title: 'Hashing',
    blurb: 'Hash tables, collisions, chaining and open addressing.',
    status: 'soon',
    accent: '#ffd98a',
    items: ['Separate chaining', 'Linear probing', 'Quadratic probing', 'Cuckoo hashing', 'Bloom filter'].map(item),
  },
  {
    id: 'dp',
    title: 'Dynamic programming',
    blurb: 'Tables filling themselves in: knapsack, LCS, edit distance.',
    status: 'soon',
    accent: '#c7a4ff',
    items: ['Fibonacci', '0/1 knapsack', 'Longest common subsequence', 'Edit distance', 'Coin change'].map(item),
  },
]

function item(name: string): TopicItem {
  return { id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''), name }
}

export const topicById = (id: string) => TOPICS.find((t) => t.id === id)

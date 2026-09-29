import { mulberry32 } from '../../engine/rng'
import type { TreeView } from './recorder'

/** A binary tree node. `id` is stable for the node's lifetime so the stage can animate it. */
export interface BNode {
  id: number
  key: number
  left: BNode | null
  right: BNode | null
  /** Height, maintained by AVL (1 for a leaf). */
  h: number
}

export interface BTree {
  root: BNode | null
  nextId: number
}

export const emptyTree = (): BTree => ({ root: null, nextId: 1 })

export function cloneTree(t: BTree): BTree {
  const copy = (n: BNode | null): BNode | null => (n ? { ...n, left: copy(n.left), right: copy(n.right) } : null)
  return { root: copy(t.root), nextId: t.nextId }
}

export const height = (n: BNode | null) => (n ? n.h : 0)
export const updateHeight = (n: BNode) => (n.h = 1 + Math.max(height(n.left), height(n.right)))
export const balanceOf = (n: BNode) => height(n.left) - height(n.right)

export function inorderKeys(n: BNode | null, out: number[] = []): number[] {
  if (!n) return out
  inorderKeys(n.left, out)
  out.push(n.key)
  inorderKeys(n.right, out)
  return out
}

/** Pre-order with nulls: a canonical string for comparing tree shapes. */
export function shape(n: BNode | null): string {
  return n ? `(${n.key} ${shape(n.left)} ${shape(n.right)})` : '.'
}

export function size(n: BNode | null): number {
  return n ? 1 + size(n.left) + size(n.right) : 0
}

/**
 * Lay the tree out: x is the in-order position (so a BST reads sorted left to
 * right), y the depth. Edges are keyed by child id so they follow rotations.
 */
export function binaryView(t: BTree, badge?: (n: BNode) => { text: string; bad?: boolean }): TreeView {
  const nodes: TreeView['nodes'] = []
  const edges: TreeView['edges'] = []
  let x = 0
  const walk = (n: BNode | null, depth: number, parent: BNode | null) => {
    if (!n) return
    walk(n.left, depth + 1, n)
    const b = badge?.(n)
    nodes.push({ id: n.id, label: String(n.key), x: x++, y: depth, badge: b?.text, badgeBad: b?.bad })
    if (parent) edges.push({ key: `e${n.id}`, from: parent.id, to: n.id })
    walk(n.right, depth + 1, n)
  }
  walk(t.root, 0, null)
  return { nodes, edges }
}

/** Distinct random keys in 1..99. */
export function randomKeys(count: number, seed: number): number[] {
  const rand = mulberry32(seed)
  const keys = new Set<number>()
  while (keys.size < count) keys.add(1 + Math.floor(rand() * 99))
  return [...keys]
}

/** Plain BST insert, no animation (for building starting trees). */
export function bstInsertQuiet(t: BTree, key: number) {
  const make = (): BNode => ({ id: t.nextId++, key, left: null, right: null, h: 1 })
  if (!t.root) return void (t.root = make())
  let n = t.root
  while (true) {
    if (key === n.key) return
    const side = key < n.key ? 'left' : 'right'
    if (!n[side]) return void (n[side] = make())
    n = n[side]!
  }
}

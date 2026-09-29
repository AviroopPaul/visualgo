import { balanceOf, binaryView, bstInsertQuiet, cloneTree, emptyTree, randomKeys, updateHeight, type BNode, type BTree } from '../binary'
import { TM, TreeRecorder } from '../recorder'
import type { Op, TreeResult } from '../types'

/**
 * Traced BST / AVL operations. The recursion mirrors the listings exactly;
 * `attach` writes a new subtree root into its parent immediately, so every
 * frame shows the real current tree (including mid-rotation).
 */
export function runSearchTree(state: BTree, op: Op, avl: boolean): TreeResult<BTree> {
  const t = cloneTree(state)
  const bf = (n: BNode) => {
    const b = balanceOf(n)
    return { text: b > 0 ? `+${b}` : String(b), bad: Math.abs(b) > 1 }
  }
  const rec = new TreeRecorder(
    () => binaryView(t, avl ? bf : undefined),
    (s) => `${s} comparison${s === 1 ? '' : 's'}`,
  )
  const setRoot = (n: BNode | null) => (t.root = n)

  const rotR = (y: BNode, attach: (n: BNode) => void) => {
    const x = y.left!
    y.left = x.right
    x.right = y
    updateHeight(y)
    updateHeight(x)
    attach(x)
    return x
  }
  const rotL = (x: BNode, attach: (n: BNode) => void) => {
    const y = x.right!
    x.right = y.left
    y.left = x
    updateHeight(x)
    updateHeight(y)
    attach(y)
    return y
  }

  const rebalance = (n: BNode, attach: (n: BNode) => void): BNode => {
    if (!avl) return n
    updateHeight(n)
    const b = balanceOf(n)
    rec.ptr('node', n.id)
    rec.show('update', `Back at ${n.key}: height ${n.h}, balance ${b > 0 ? '+' : ''}${b}`, [[n.id, TM.active]])
    if (b > 1) {
      rec.show('leftHeavy', `${n.key} is left-heavy (balance +${b}): rotate`, [[n.id, TM.bad]])
      if (balanceOf(n.left!) < 0) {
        const pivot = rotL(n.left!, (c) => (n.left = c))
        rec.show('lr', `Left-right case: first rotate ${n.left!.left!.key}'s subtree left around ${pivot.key}`, [[pivot.id, TM.pivot]])
      }
      const top = rotR(n, attach)
      rec.show('ll', `Rotate right: ${top.key} moves up, ${n.key} moves down to its right`, [[top.id, TM.pivot]])
      return top
    }
    if (b < -1) {
      rec.show('rightHeavy', `${n.key} is right-heavy (balance ${b}): rotate`, [[n.id, TM.bad]])
      if (balanceOf(n.right!) > 0) {
        const pivot = rotR(n.right!, (c) => (n.right = c))
        rec.show('rl', `Right-left case: first rotate the right subtree right around ${pivot.key}`, [[pivot.id, TM.pivot]])
      }
      const top = rotL(n, attach)
      rec.show('rr', `Rotate left: ${top.key} moves up, ${n.key} moves down to its left`, [[top.id, TM.pivot]])
      return top
    }
    return n
  }

  const insert = (n: BNode | null, key: number, attach: (n: BNode) => void): BNode => {
    if (!n) {
      const node: BNode = { id: t.nextId++, key, left: null, right: null, h: 1 }
      attach(node)
      rec.mark(node.id, TM.fresh)
      rec.ptr('node', node.id)
      rec.show('place', t.root === node ? `The tree is empty: ${key} becomes the root` : `Empty spot: ${key} goes here`)
      return node
    }
    rec.ptr('node', n.id)
    rec.steps++
    rec.show('cmp', `${key} vs ${n.key}`, [[n.id, TM.active]])
    if (key === n.key) {
      rec.show('dup', `${key} is already in the tree`, [[n.id, TM.good]])
      return n
    }
    rec.mark(n.id, TM.path)
    if (key < n.key) {
      rec.show('goLeft', `${key} < ${n.key}: go left`)
      insert(n.left, key, (c) => (n.left = c))
    } else {
      rec.show('goRight', `${key} > ${n.key}: go right`)
      insert(n.right, key, (c) => (n.right = c))
    }
    return rebalance(n, attach)
  }

  const remove = (n: BNode | null, key: number, attach: (n: BNode | null) => void): BNode | null => {
    if (!n) {
      rec.show('dMissing', `${key} is not in the tree`)
      return null
    }
    rec.ptr('node', n.id)
    rec.steps++
    rec.show('dCmp', `${key} vs ${n.key}`, [[n.id, TM.active]])
    if (key < n.key) {
      rec.mark(n.id, TM.path)
      if (!avl) rec.show('dLeft', `${key} < ${n.key}: go left`)
      remove(n.left, key, (c) => (n.left = c))
    } else if (key > n.key) {
      rec.mark(n.id, TM.path)
      if (!avl) rec.show('dRight', `${key} > ${n.key}: go right`)
      remove(n.right, key, (c) => (n.right = c))
    } else {
      rec.mark(n.id, TM.bad)
      if (!n.left || !n.right) {
        const child = n.left ?? n.right
        rec.show('dFound', `Found ${key}. It has ${child ? 'one child' : 'no children'}`)
        attach(child)
        rec.unptr('node')
        if (child) rec.mark(child.id, TM.good)
        const line = avl ? 'dSplice' : n.left ? 'dSplice2' : 'dSplice'
        rec.show(line, child ? `Remove ${key}: its child ${child.key} takes its place` : `Remove leaf ${key}`)
        return child
      }
      rec.show('dFound', `Found ${key}. It has two children, so find its successor`)
      let succ = n.right
      rec.ptr('succ', succ.id)
      rec.show('dSucc', `The successor is the smallest key in the right subtree: start at ${succ.key}`, [[succ.id, TM.active]])
      while (succ.left) {
        succ = succ.left
        rec.ptr('succ', succ.id)
        rec.show('dSuccStep', `Keep going left: ${succ.key}`, [[succ.id, TM.active]])
      }
      n.key = succ.key
      rec.unptr('succ')
      rec.mark(n.id, TM.good)
      rec.show('dCopy', `Copy the successor ${succ.key} into this node`)
      if (!avl) rec.show('dRemoveSucc', `Now delete the old ${succ.key} from the right subtree`)
      remove(n.right, succ.key, (c) => (n.right = c))
    }
    return avl ? rebalance(n, attach) : n
  }

  const search = (key: number) => {
    let n = t.root
    while (n) {
      rec.ptr('node', n.id)
      rec.steps++
      rec.show('sCmp', `${key} vs ${n.key}`, [[n.id, TM.active]])
      if (key === n.key) {
        rec.mark(n.id, TM.good)
        rec.show('found', `Found ${key} after ${rec.steps} comparison${rec.steps === 1 ? '' : 's'}`)
        return
      }
      rec.mark(n.id, TM.path)
      const next: BNode | null = key < n.key ? n.left : n.right
      rec.show('sStep', `${key} ${key < n.key ? '<' : '>'} ${n.key}: go ${key < n.key ? 'left' : 'right'}${next ? '' : ', but there is nothing there'}`)
      n = next
    }
    rec.unptr('node')
    rec.show('notFound', `${key} is not in the tree`)
  }

  const finish = () => {
    rec.clearMarks()
    rec.unptr('node', 'succ')
  }

  rec.show('', opIntro(op))
  if (op.kind === 'build') {
    for (const k of op.keys ?? []) {
      rec.steps = 0
      insert(t.root, k, setRoot)
      finish()
    }
    rec.show('', `Built a tree of ${op.keys?.length ?? 0} keys${avl ? ', balanced after every insert' : ''}`)
  } else if (op.kind === 'insert') {
    insert(t.root, op.a!, setRoot)
    finish()
    rec.show('', `Inserted ${op.a} with ${rec.steps} comparison${rec.steps === 1 ? '' : 's'}`)
  } else if (op.kind === 'delete') {
    remove(t.root, op.a!, setRoot)
    finish()
    rec.show('', `Done: ${rec.steps} comparison${rec.steps === 1 ? '' : 's'}`)
  } else if (op.kind === 'search') {
    search(op.a!)
  }
  return { frames: rec.frames, state: t }
}

function opIntro(op: Op) {
  switch (op.kind) {
    case 'build':
      return `Insert ${op.keys?.join(', ')} one by one`
    case 'insert':
      return `Insert ${op.a}`
    case 'delete':
      return `Delete ${op.a}`
    default:
      return `Search for ${op.a}`
  }
}

/** Starting keys for a random tree. */
export const demoKeys = (seed: number, count = 9) => randomKeys(count, seed)

/** Quick BST (no animation) from keys, for tests and traversals. */
export function bstFrom(keys: number[]): BTree {
  const t = emptyTree()
  for (const k of keys) bstInsertQuiet(t, k)
  return t
}

/** Suggest a sensible operand: a new key for insert, an existing one otherwise. */
export function suggestKey(t: BTree, op: string, seed: number): Op {
  const existing: number[] = []
  const walk = (n: BNode | null) => {
    if (!n) return
    existing.push(n.key)
    walk(n.left)
    walk(n.right)
  }
  walk(t.root)
  const pick = (xs: number[]) => xs[Math.abs(seed) % xs.length]
  if (op === 'insert' || !existing.length) {
    const fresh = randomKeys(40, seed).filter((k) => !existing.includes(k))
    return { kind: op, a: fresh[0] ?? 50 }
  }
  return { kind: op, a: pick(existing) }
}

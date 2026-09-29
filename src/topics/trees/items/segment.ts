import { mulberry32 } from '../../../engine/rng'
import { TM, TreeRecorder, type TreeView } from '../recorder'
import { cpp, js, py, type Op, type TreeItem } from '../types'

/** Sum segment tree over `a`, stored 1-based: node k has children 2k and 2k+1. */
export interface SegTree {
  a: number[]
  tree: number[]
  /** Which nodes hold a computed sum (false until build reaches them). */
  ready: boolean[]
}

export function makeSeg(a: number[]): SegTree {
  return { a: [...a], tree: new Array(4 * a.length).fill(0), ready: new Array(4 * a.length).fill(false) }
}

const cloneSeg = (s: SegTree): SegTree => ({ a: [...s.a], tree: [...s.tree], ready: [...s.ready] })

export function randomArray(seed: number, n = 8) {
  const rand = mulberry32(seed)
  return Array.from({ length: n }, () => 1 + Math.floor(rand() * 9))
}

/** Every node of the tree for n leaves, with its range, depth and position over the array. */
function segView(s: SegTree): TreeView {
  const nodes: TreeView['nodes'] = []
  const edges: TreeView['edges'] = []
  const walk = (k: number, l: number, r: number, depth: number, parent: number | null) => {
    nodes.push({
      id: k,
      label: s.ready[k] ? String(s.tree[k]) : '·',
      x: (l + r + 1) / 2,
      y: depth,
      sub: l === r ? `${l}` : `${l}–${r}`,
    })
    if (parent != null) edges.push({ key: `e${k}`, from: parent, to: k })
    if (l === r) return
    const mid = (l + r) >> 1
    walk(2 * k, l, mid, depth + 1, k)
    walk(2 * k + 1, mid + 1, r, depth + 1, k)
  }
  walk(1, 0, s.a.length - 1, 0, null)
  return { nodes, edges, cells: s.a, xDomain: [0, s.a.length] }
}

export function runSegment(state: SegTree, op: Op) {
  const s = op.kind === 'build' ? makeSeg(op.keys ?? state.a) : cloneSeg(state)
  const n = s.a.length
  const rec = new TreeRecorder(() => segView(s), (v) => `${v} node${v === 1 ? '' : 's'} visited`)
  let answer: number | null = null

  const build = (k: number, l: number, r: number) => {
    rec.ptr('node', k)
    rec.steps++
    if (l === r) {
      s.tree[k] = s.a[l]
      s.ready[k] = true
      rec.markCells(l, l, TM.active)
      rec.show('leaf', `Leaf [${l}]: copy a[${l}] = ${s.a[l]}`, [[k, TM.fresh]])
      rec.markCells(l, l, TM.idle)
      return
    }
    const mid = (l + r) >> 1
    build(2 * k, l, mid)
    build(2 * k + 1, mid + 1, r)
    s.tree[k] = s.tree[2 * k] + s.tree[2 * k + 1]
    s.ready[k] = true
    rec.ptr('node', k)
    rec.show('combine', `[${l}–${r}] = ${s.tree[2 * k]} + ${s.tree[2 * k + 1]} = ${s.tree[k]}`, [
      [k, TM.fresh],
      [2 * k, TM.active],
      [2 * k + 1, TM.active],
    ])
  }

  let running = 0
  const query = (k: number, l: number, r: number, ql: number, qr: number): number => {
    rec.ptr('node', k)
    rec.steps++
    if (qr < l || r < ql) {
      rec.mark(k, TM.faded)
      rec.show('outside', `[${l}–${r}] is outside the query: contributes 0`)
      return 0
    }
    if (ql <= l && r <= qr) {
      running += s.tree[k]
      rec.mark(k, TM.good)
      rec.show('inside', `[${l}–${r}] is fully inside: take its sum ${s.tree[k]} (running total ${running})`)
      return s.tree[k]
    }
    rec.mark(k, TM.pivot)
    rec.show('split', `[${l}–${r}] only partly overlaps: ask both children`)
    const mid = (l + r) >> 1
    return query(2 * k, l, mid, ql, qr) + query(2 * k + 1, mid + 1, r, ql, qr)
  }

  const update = (k: number, l: number, r: number, i: number, v: number) => {
    rec.ptr('node', k)
    rec.steps++
    if (l === r) {
      s.a[i] = v
      s.tree[k] = v
      rec.markCells(i, i, TM.good)
      rec.show('uLeaf', `Leaf [${i}] becomes ${v}`, [[k, TM.fresh]])
      return
    }
    rec.mark(k, TM.path)
    const mid = (l + r) >> 1
    if (i <= mid) {
      rec.show('uLeft', `${i} is in the left half [${l}–${mid}]`, [[k, TM.active]])
      update(2 * k, l, mid, i, v)
    } else {
      rec.show('uRight', `${i} is in the right half [${mid + 1}–${r}]`, [[k, TM.active]])
      update(2 * k + 1, mid + 1, r, i, v)
    }
    s.tree[k] = s.tree[2 * k] + s.tree[2 * k + 1]
    rec.ptr('node', k)
    rec.show('uCombine', `Recompute [${l}–${r}] = ${s.tree[2 * k]} + ${s.tree[2 * k + 1]} = ${s.tree[k]}`, [[k, TM.fresh]])
  }

  const clamp = (x: number) => Math.max(0, Math.min(n - 1, Math.round(x)))
  if (op.kind === 'build') {
    rec.show('', `Build a sum segment tree over ${n} values`)
    build(1, 0, n - 1)
    rec.unptr('node')
    rec.show('', `Built: the root holds the total, ${s.tree[1]}`)
  } else if (op.kind === 'query') {
    const ql = clamp(Math.min(op.a ?? 0, op.b ?? 0))
    const qr = clamp(Math.max(op.a ?? 0, op.b ?? 0))
    rec.markCells(ql, qr, TM.pivot)
    rec.show('', `Sum of a[${ql}..${qr}]`)
    answer = query(1, 0, n - 1, ql, qr)
    rec.unptr('node')
    rec.markCells(ql, qr, TM.good)
    rec.show('', `Sum of a[${ql}..${qr}] = ${answer}, from ${rec.steps} nodes instead of ${qr - ql + 1} values`)
  } else if (op.kind === 'update') {
    const i = clamp(op.a ?? 0)
    const v = Math.max(-99, Math.min(99, Math.round(op.b ?? 0)))
    rec.show('', `Set a[${i}] = ${v}`)
    update(1, 0, n - 1, i, v)
    rec.unptr('node')
    rec.clearMarks()
    rec.show('', `Updated a[${i}]: only the ${rec.steps} nodes on its path changed`)
  }
  return { frames: rec.frames, state: s, answer }
}

export const segment: TreeItem<SegTree> = {
  id: 'segment-tree',
  name: 'Segment tree',
  group: 'Special trees',
  tagline: 'Precomputed sums over halves, quarters, eighths… for instant range queries.',
  about: [
    'Each node stores the sum of one range of the array: the root covers everything, its children each half, and so on down to single elements.',
    'Build fills it bottom up: every node is the sum of its two children.',
    'A range query only touches nodes that partly overlap the range. A node fully inside contributes its stored sum at once; one fully outside contributes nothing.',
    'Updating one value changes just the nodes on its path to the root.',
  ],
  facts: [
    ['Build', 'O(n)'],
    ['Range query', 'O(log n)'],
    ['Point update', 'O(log n)'],
    ['Space', 'O(n)'],
  ],
  chips: [
    ['build', 'O(n)'],
    ['query', 'O(log n)'],
    ['update', 'O(log n)'],
  ],
  ops: [
    { id: 'query', label: 'Range sum', input: 'range' },
    { id: 'update', label: 'Set value', input: 'update' },
  ],
  initial: (seed) => makeSeg(randomArray(seed)),
  demo: (seed) => ({ kind: 'build', keys: randomArray(seed) }),
  run: (state, op) => {
    const r = runSegment(state, op)
    return { frames: r.frames, state: r.state }
  },
  suggest: (state, op, seed) => {
    const rand = mulberry32(seed)
    const n = state.a.length
    if (op === 'update') return { kind: op, a: Math.floor(rand() * n), b: 1 + Math.floor(rand() * 9) }
    const l = Math.floor(rand() * (n - 1))
    return { kind: op, a: l, b: l + 1 + Math.floor(rand() * (n - l - 1)) }
  },
  guide: {
    aka: ['range tree', 'statistic tree'],
    use: 'When an array changes and you keep asking about ranges of it: range sums, minimums or maximums with point updates, in competitive programming, databases and games. For sums only, a Fenwick (binary indexed) tree is smaller and simpler.',
    wikipedia: 'https://en.wikipedia.org/wiki/Segment_tree',
  },
  code: () => CODE,
}

const CODE = {
  py: py(`
def build(a, tree, node, l, r):
    if l == r:
        tree[node] = a[l]                                  # @leaf
        return
    mid = (l + r) // 2
    build(a, tree, 2 * node, l, mid)
    build(a, tree, 2 * node + 1, mid + 1, r)
    tree[node] = tree[2 * node] + tree[2 * node + 1]       # @combine

def query(tree, node, l, r, ql, qr):
    if qr < l or r < ql:
        return 0                                           # @outside
    if ql <= l and r <= qr:
        return tree[node]                                  # @inside
    mid = (l + r) // 2                                     # @split
    return (query(tree, 2 * node, l, mid, ql, qr) +
            query(tree, 2 * node + 1, mid + 1, r, ql, qr))

def update(tree, node, l, r, i, value):
    if l == r:
        tree[node] = value                                 # @uLeaf
        return
    mid = (l + r) // 2
    if i <= mid:
        update(tree, 2 * node, l, mid, i, value)           # @uLeft
    else:
        update(tree, 2 * node + 1, mid + 1, r, i, value)   # @uRight
    tree[node] = tree[2 * node] + tree[2 * node + 1]       # @uCombine

# tree = [0] * (4 * len(a)); build(a, tree, 1, 0, len(a) - 1)`),
  js: js(`
function build(a, tree, node, l, r) {
  if (l === r) {
    tree[node] = a[l];                                     // @leaf
    return;
  }
  const mid = (l + r) >> 1;
  build(a, tree, 2 * node, l, mid);
  build(a, tree, 2 * node + 1, mid + 1, r);
  tree[node] = tree[2 * node] + tree[2 * node + 1];        // @combine
}

function query(tree, node, l, r, ql, qr) {
  if (qr < l || r < ql) return 0;                          // @outside
  if (ql <= l && r <= qr) return tree[node];               // @inside
  const mid = (l + r) >> 1;                                // @split
  return query(tree, 2 * node, l, mid, ql, qr) +
         query(tree, 2 * node + 1, mid + 1, r, ql, qr);
}

function update(tree, node, l, r, i, value) {
  if (l === r) {
    tree[node] = value;                                    // @uLeaf
    return;
  }
  const mid = (l + r) >> 1;
  if (i <= mid) update(tree, 2 * node, l, mid, i, value);  // @uLeft
  else update(tree, 2 * node + 1, mid + 1, r, i, value);   // @uRight
  tree[node] = tree[2 * node] + tree[2 * node + 1];        // @uCombine
}

// const tree = new Array(4 * a.length).fill(0); build(a, tree, 1, 0, a.length - 1);`),
  cpp: cpp(`
void build(const vector<int>& a, vector<int>& tree, int node, int l, int r) {
    if (l == r) {
        tree[node] = a[l];                                 // @leaf
        return;
    }
    int mid = (l + r) / 2;
    build(a, tree, 2 * node, l, mid);
    build(a, tree, 2 * node + 1, mid + 1, r);
    tree[node] = tree[2 * node] + tree[2 * node + 1];      // @combine
}

int query(const vector<int>& tree, int node, int l, int r, int ql, int qr) {
    if (qr < l || r < ql) return 0;                        // @outside
    if (ql <= l && r <= qr) return tree[node];             // @inside
    int mid = (l + r) / 2;                                 // @split
    return query(tree, 2 * node, l, mid, ql, qr) +
           query(tree, 2 * node + 1, mid + 1, r, ql, qr);
}

void update(vector<int>& tree, int node, int l, int r, int i, int value) {
    if (l == r) {
        tree[node] = value;                                // @uLeaf
        return;
    }
    int mid = (l + r) / 2;
    if (i <= mid) update(tree, 2 * node, l, mid, i, value);    // @uLeft
    else update(tree, 2 * node + 1, mid + 1, r, i, value);     // @uRight
    tree[node] = tree[2 * node] + tree[2 * node + 1];      // @uCombine
}

// vector<int> tree(4 * a.size()); build(a, tree, 1, 0, a.size() - 1);`),
}

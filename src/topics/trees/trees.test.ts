import { describe, expect, it } from 'vitest'
import { parseListing } from '../../engine/code'
import { mulberry32 } from '../../engine/rng'
import { CPP_PRELUDE, cppBody, HAS_CPP, HAS_PYTHON, runCpp, runPython, shown } from '../../test/runners'
import { balanceOf, height, inorderKeys, shape, type BNode, type BTree } from './binary'
import { avl } from './items/avl'
import { bst } from './items/bst'
import { randomArray, runSegment, segment, type SegTree } from './items/segment'
import { runTraversal, traversalTree, traversals } from './items/traversals'
import { emptyTrie, runTrie, trie, trieWords, type Trie } from './items/trie'
import { TREES } from './registry'

// ── operation scripts ────────────────────────────────────────────────────
type TOp = ['i' | 'd' | 's', number]
function script(seed: number, len = 70): TOp[] {
  const rand = mulberry32(seed)
  const keys: number[] = []
  const out: TOp[] = []
  for (let k = 0; k < len; k++) {
    const r = rand()
    const existing = keys.length && rand() < 0.7 ? keys[Math.floor(rand() * keys.length)] : 1 + Math.floor(rand() * 60)
    if (r < 0.55 || keys.length < 3) {
      const key = rand() < 0.2 ? (seed % 2 ? k + 1 : 70 - k) : 1 + Math.floor(rand() * 60) // runs of sorted keys, too
      out.push(['i', key])
      keys.push(key)
    } else if (r < 0.8) {
      out.push(['d', existing])
      keys.splice(keys.indexOf(existing), keys.includes(existing) ? 1 : 0)
    } else out.push(['s', existing])
  }
  return out
}
const SCRIPTS = [1, 2, 3, 4, 5, 6, 7, 8].map((s) => script(s))

function traceScript(item: typeof bst, ops: TOp[]) {
  let state = item.initial(0)
  const found: boolean[] = []
  const labels = new Set<string>()
  for (const [k, key] of ops) {
    const r = item.run(state, { kind: k === 'i' ? 'insert' : k === 'd' ? 'delete' : 'search', a: key })
    for (const f of r.frames) if (f.line) labels.add(f.line)
    if (k === 's') found.push(r.frames.some((f) => f.line === 'found'))
    state = r.state
  }
  return { tree: state as BTree, found, labels }
}

function checkAvl(n: BNode | null): number {
  if (!n) return 0
  const hl = checkAvl(n.left)
  const hr = checkAvl(n.right)
  expect(n.h).toBe(1 + Math.max(hl, hr))
  expect(Math.abs(balanceOf(n))).toBeLessThanOrEqual(1)
  return n.h
}

describe.each([
  ['BST', bst],
  ['AVL', avl],
] as const)('%s', (name, item) => {
  it('keeps the search-tree order through random inserts, deletes and searches', () => {
    for (const ops of SCRIPTS) {
      const ref = new Set<number>()
      let state = item.initial(0) as BTree
      for (const [k, key] of ops) {
        const r = item.run(state, { kind: k === 'i' ? 'insert' : k === 'd' ? 'delete' : 'search', a: key })
        state = r.state as BTree
        if (k === 'i') ref.add(key)
        if (k === 'd') ref.delete(key)
        if (k === 's') expect(r.frames.some((f) => f.line === 'found')).toBe(ref.has(key))
        expect(inorderKeys(state.root)).toEqual([...ref].sort((a, b) => a - b))
        if (name === 'AVL') checkAvl(state.root)
      }
      if (name === 'AVL') expect(height(state.root)).toBeLessThanOrEqual(Math.ceil(1.45 * Math.log2(ref.size + 2)))
    }
  })

  const jsApi = () => {
    const src = shown(item.code().js)
    return new Function(`${src}\nreturn { insert, search, remove };`)() as Record<'insert' | 'search' | 'remove', (n: unknown, k: number) => unknown>
  }
  const jsShape = (n: { key: number; left: unknown; right: unknown } | null): string =>
    n ? `(${n.key} ${jsShape(n.left as never)} ${jsShape(n.right as never)})` : '.'
  const runJs = (ops: TOp[]) => {
    const api = jsApi()
    let root: unknown = null
    const found: boolean[] = []
    for (const [k, key] of ops) {
      if (k === 'i') root = api.insert(root, key)
      else if (k === 'd') root = api.remove(root, key)
      else found.push(api.search(root, key) !== null)
    }
    return { shape: jsShape(root as never), found }
  }

  it('builds exactly the same tree as its JavaScript listing', () => {
    for (const ops of SCRIPTS) {
      const traced = traceScript(item, ops)
      const listing = runJs(ops)
      expect(shape(traced.tree.root)).toBe(listing.shape)
      expect(traced.found).toEqual(listing.found)
    }
  })

  it('only highlights labels that exist in every listing', () => {
    const used = new Set<string>()
    for (const ops of SCRIPTS) for (const l of traceScript(item, ops).labels) used.add(l)
    for (const l of Object.values(item.code())) {
      for (const label of used) expect(parseListing(l).labels.has(label), `${l.lang} missing @${label}`).toBe(true)
    }
  })

  it.skipIf(!HAS_PYTHON)('Python listing matches', () => {
    const program = `${shown(item.code().py)}
import json
def shape(n):
    return '.' if n is None else f"({n.key} {shape(n.left)} {shape(n.right)})"
for ops in ${JSON.stringify(SCRIPTS)}:
    root, found = None, []
    for k, key in ops:
        if k == 'i': root = insert(root, key)
        elif k == 'd': root = remove(root, key)
        else: found.append(search(root, key) is not None)
    print(shape(root) + '|' + json.dumps(found).replace(' ', ''))
`
    const lines = runPython(program).trim().split('\n')
    SCRIPTS.forEach((ops, i) => {
      const r = runJs(ops)
      expect(lines[i]).toBe(`${r.shape}|${JSON.stringify(r.found)}`)
    })
  })

  it.skipIf(!HAS_CPP)('C++ listing compiles cleanly and matches', () => {
    const program = `${CPP_PRELUDE}${cppBody(item.code().cpp)}
string shape(Node* n) { return n ? "(" + to_string(n->key) + " " + shape(n->left) + " " + shape(n->right) + ")" : "."; }
int main() {
${SCRIPTS.map(
  (ops) => `  { Node* root = nullptr; string found = "[";
${ops.map(([k, key]) => (k === 'i' ? `    root = insert(root, ${key});` : k === 'd' ? `    root = remove(root, ${key});` : `    found += string(found.size() > 1 ? "," : "") + (search(root, ${key}) ? "true" : "false");`)).join('\n')}
    printf("%s|%s]\\n", shape(root).c_str(), found.c_str()); }`,
).join('\n')}
}
`
    const lines = runCpp(program).trim().split('\n')
    SCRIPTS.forEach((ops, i) => {
      const r = runJs(ops)
      expect(lines[i]).toBe(`${r.shape}|${JSON.stringify(r.found)}`)
    })
  }, 120_000)
})

// ── traversals ───────────────────────────────────────────────────────────
const ORDERS = ['inorder', 'preorder', 'postorder', 'levelorder'] as const
const TREES_FOR_TRAVERSAL = [1, 2, 3, 4, 5].map((s) => traversalTree(s, 5 + s * 2))

const pyTree = (n: BNode | null): string => (n ? `Node(${n.key}, ${pyTree(n.left)}, ${pyTree(n.right)})` : 'None')
const cppTree = (n: BNode | null): string => (n ? `new Node{${n.key}, ${cppTree(n.left)}, ${cppTree(n.right)}}` : 'nullptr')

describe('Tree traversals', () => {
  it.each(ORDERS)('%s visits nodes in the order its JavaScript listing does', (order) => {
    const src = shown(traversals.code(order).js)
    const fn = new Function(`${src}\nreturn { Node, ${order} };`)() as { Node: new (k: number, l: unknown, r: unknown) => unknown; [k: string]: unknown }
    const build = (n: BNode | null): unknown => (n ? new fn.Node(n.key, build(n.left), build(n.right)) : null)
    for (const t of TREES_FOR_TRAVERSAL) {
      const out: number[] = []
      ;(fn[order] as (n: unknown, o: number[]) => void)(build(t.root), out)
      const traced = runTraversal(t, order)
      expect(traced.order).toEqual(out)
      if (order === 'inorder') expect(out).toEqual(inorderKeys(t.root))
      const labels = new Set(traced.frames.map((f) => f.line).filter(Boolean))
      for (const l of Object.values(traversals.code(order)))
        for (const label of labels) expect(parseListing(l).labels.has(label), `${order} ${l.lang} @${label}`).toBe(true)
    }
  })

  it.skipIf(!HAS_PYTHON)('Python listings match', () => {
    const program = ORDERS.map(
      (o) => `
exec(${JSON.stringify(shown(traversals.code(o).py))})
for t in [${TREES_FOR_TRAVERSAL.map((t) => pyTree(t.root)).join(', ')}]:
    out = []
    ${o}(t, out)
    print(${JSON.stringify(o)}, out)`,
    ).join('\n')
    const lines = runPython(program).trim().split('\n')
    let k = 0
    for (const o of ORDERS)
      for (const t of TREES_FOR_TRAVERSAL) expect(lines[k++]).toBe(`${o} [${runTraversal(t, o).order.join(', ')}]`)
  })

  it.skipIf(!HAS_CPP)('C++ listings compile cleanly and match', () => {
    const node = 'struct Node {\n    int key;\n    Node *left = nullptr, *right = nullptr;\n};'
    const bodies = ORDERS.map((o) => cppBody(traversals.code(o).cpp).replace(node, ''))
    const program = `${CPP_PRELUDE}${node}\n${bodies.join('\n')}
int main() {
${ORDERS.map((o) =>
  TREES_FOR_TRAVERSAL.map((t) => `  { vector<int> out; ${o}(${cppTree(t.root)}, out); printf("${o}"); for (int x : out) printf(" %d", x); printf("\\n"); }`).join('\n'),
).join('\n')}
}
`
    const lines = runCpp(program).trim().split('\n')
    let k = 0
    for (const o of ORDERS) for (const t of TREES_FOR_TRAVERSAL) expect(lines[k++]).toBe(`${o} ${runTraversal(t, o).order.join(' ')}`)
  }, 120_000)
})

// ── trie ─────────────────────────────────────────────────────────────────
const TRIE_WORDS = ['car', 'card', 'care', 'cart', 'cat', 'do', 'dog', 'dot', 'a', 'an', 'ant']
const TRIE_QUERIES = ['car', 'ca', 'c', 'cards', 'do', 'd', 'dots', 'x', 'an', 'a', 'ants', 'zebra', 'cart', 'dog']

describe('Trie', () => {
  it('answers search and prefix queries like a set of words would', () => {
    let t: Trie = emptyTrie()
    for (const w of TRIE_WORDS) t = runTrie(t, { kind: 'insert', word: w }).state
    expect(trieWords(t)).toEqual([...TRIE_WORDS].sort())
    for (const q of TRIE_QUERIES) {
      expect(runTrie(t, { kind: 'search', word: q }).result).toBe(TRIE_WORDS.includes(q))
      expect(runTrie(t, { kind: 'prefix', word: q }).result).toBe(TRIE_WORDS.some((w) => w.startsWith(q)))
    }
  })

  it('matches its JavaScript listing and only highlights real lines', () => {
    const src = shown(trie.code().js)
    const api = new Function(`${src}\nreturn { TrieNode, insert, search, startsWith };`)()
    const root = new api.TrieNode()
    let t: Trie = emptyTrie()
    const labels = new Set<string>()
    for (const w of TRIE_WORDS) {
      api.insert(root, w)
      const r = runTrie(t, { kind: 'insert', word: w })
      r.frames.forEach((f) => f.line && labels.add(f.line))
      t = r.state
    }
    for (const q of TRIE_QUERIES) {
      const s = runTrie(t, { kind: 'search', word: q })
      const p = runTrie(t, { kind: 'prefix', word: q })
      ;[...s.frames, ...p.frames].forEach((f) => f.line && labels.add(f.line))
      expect(s.result).toBe(api.search(root, q))
      expect(p.result).toBe(api.startsWith(root, q))
    }
    for (const l of Object.values(trie.code())) for (const label of labels) expect(parseListing(l).labels.has(label), `${l.lang} @${label}`).toBe(true)
  })

  const expected = TRIE_QUERIES.map((q) => `${TRIE_WORDS.includes(q)} ${TRIE_WORDS.some((w) => w.startsWith(q))}`)

  it.skipIf(!HAS_PYTHON)('Python listing matches', () => {
    const out = runPython(`${shown(trie.code().py)}
root = TrieNode()
for w in ${JSON.stringify(TRIE_WORDS)}:
    insert(root, w)
for q in ${JSON.stringify(TRIE_QUERIES)}:
    print(str(search(root, q)).lower(), str(starts_with(root, q)).lower())
`)
    expect(out.trim().split('\n')).toEqual(expected)
  })

  it.skipIf(!HAS_CPP)('C++ listing compiles cleanly and matches', () => {
    const out = runCpp(`${CPP_PRELUDE}${cppBody(trie.code().cpp)}
int main() {
  TrieNode* root = new TrieNode();
  for (string w : {${TRIE_WORDS.map((w) => `"${w}"`).join(', ')}}) insert(root, w);
  for (string q : {${TRIE_QUERIES.map((w) => `"${w}"`).join(', ')}}) printf("%s %s\\n", search(root, q) ? "true" : "false", startsWith(root, q) ? "true" : "false");
}
`)
    expect(out.trim().split('\n')).toEqual(expected)
  }, 120_000)
})

// ── segment tree ─────────────────────────────────────────────────────────
type SOp = ['q', number, number] | ['u', number, number]
function segScript(seed: number, n: number): SOp[] {
  const rand = mulberry32(seed)
  return Array.from({ length: 40 }, () => {
    const a = Math.floor(rand() * n)
    const b = Math.floor(rand() * n)
    return rand() < 0.65 ? (['q', Math.min(a, b), Math.max(a, b)] as SOp) : (['u', a, Math.floor(rand() * 19) - 9] as SOp)
  })
}
const SEG_CASES = [5, 8, 11, 16].map((n, i) => ({ a: randomArray(i + 3, n), ops: segScript(i + 9, n) }))

const bruteSeg = (a0: number[], ops: SOp[]) => {
  const a = [...a0]
  const out: number[] = []
  for (const [k, x, y] of ops) {
    if (k === 'q') out.push(a.slice(x, y + 1).reduce((s, v) => s + v, 0))
    else a[x] = y
  }
  return out
}

describe('Segment tree', () => {
  it('answers range sums like brute force, through updates, and matches its JavaScript listing', () => {
    const src = shown(segment.code().js)
    const api = new Function(`${src}\nreturn { build, query, update };`)()
    const labels = new Set<string>()
    for (const c of SEG_CASES) {
      let s: SegTree = runSegment(segment.initial(0), { kind: 'build', keys: c.a }).state
      const tree = new Array(4 * c.a.length).fill(0)
      api.build(c.a, tree, 1, 0, c.a.length - 1)
      const got: number[] = []
      const listing: number[] = []
      for (const [k, x, y] of c.ops) {
        const r = runSegment(s, k === 'q' ? { kind: 'query', a: x, b: y } : { kind: 'update', a: x, b: y })
        r.frames.forEach((f) => f.line && labels.add(f.line))
        s = r.state
        if (k === 'q') {
          got.push(r.answer!)
          listing.push(api.query(tree, 1, 0, c.a.length - 1, x, y))
        } else api.update(tree, 1, 0, c.a.length - 1, x, y)
      }
      expect(got).toEqual(bruteSeg(c.a, c.ops))
      expect(listing).toEqual(got)
    }
    runSegment(segment.initial(0), { kind: 'build', keys: [1, 2, 3] }).frames.forEach((f) => f.line && labels.add(f.line))
    for (const l of Object.values(segment.code())) for (const label of labels) expect(parseListing(l).labels.has(label), `${l.lang} @${label}`).toBe(true)
  })

  it.skipIf(!HAS_PYTHON)('Python listing matches', () => {
    const program = `${shown(segment.code().py)}
for a, ops in ${JSON.stringify(SEG_CASES.map((c) => [c.a, c.ops]))}:
    tree = [0] * (4 * len(a))
    build(a, tree, 1, 0, len(a) - 1)
    out = []
    for k, x, y in ops:
        if k == 'q': out.append(query(tree, 1, 0, len(a) - 1, x, y))
        else: update(tree, 1, 0, len(a) - 1, x, y)
    print(out)
`
    expect(runPython(program).trim().split('\n')).toEqual(SEG_CASES.map((c) => `[${bruteSeg(c.a, c.ops).join(', ')}]`))
  })

  it.skipIf(!HAS_CPP)('C++ listing compiles cleanly and matches', () => {
    const program = `${CPP_PRELUDE}${cppBody(segment.code().cpp)}
int main() {
${SEG_CASES.map(
  (c) => `  { vector<int> a = {${c.a.join(',')}}; int n = a.size(); vector<int> tree(4 * n); build(a, tree, 1, 0, n - 1);
${c.ops.map(([k, x, y]) => (k === 'q' ? `    printf("%d ", query(tree, 1, 0, n - 1, ${x}, ${y}));` : `    update(tree, 1, 0, n - 1, ${x}, ${y});`)).join('\n')}
    printf("\\n"); }`,
).join('\n')}
}
`
    expect(runCpp(program).trim().split('\n').map((l) => l.trim())).toEqual(SEG_CASES.map((c) => bruteSeg(c.a, c.ops).join(' ')))
  }, 120_000)
})

describe('every tree item', () => {
  it.each(TREES.map((t) => [t.name, t] as const))('%s demo runs and ends cleanly', (_, item) => {
    for (const v of item.variants?.map((x) => x.id) ?? [undefined]) {
      const r = item.run(item.initial(3), item.demo(3, v), v)
      expect(r.frames.length).toBeGreaterThan(2)
      for (const l of Object.values(item.code(v))) expect(parseListing(l).lines.join('\n')).not.toMatch(/@\w/)
    }
  })
})

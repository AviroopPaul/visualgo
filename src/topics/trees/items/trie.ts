import { mulberry32 } from '../../../engine/rng'
import { TM, TreeRecorder, type TreeView } from '../recorder'
import { cpp, js, py, type Op, type TreeItem } from '../types'

export interface TrieNode {
  id: number
  ch: string
  children: Map<string, TrieNode>
  end: boolean
}

export interface Trie {
  root: TrieNode
  nextId: number
}

const WORD_POOL = ['car', 'card', 'care', 'cart', 'cat', 'do', 'dog', 'dot', 'deal', 'tea', 'ten', 'to', 'toy', 'tree', 'trie', 'try', 'ant', 'and', 'an']

export function emptyTrie(): Trie {
  return { root: { id: 0, ch: '', children: new Map(), end: false }, nextId: 1 }
}

export function cloneTrie(t: Trie): Trie {
  const copy = (n: TrieNode): TrieNode => ({ ...n, children: new Map([...n.children].map(([c, k]) => [c, copy(k)])) })
  return { root: copy(t.root), nextId: t.nextId }
}

export function trieWords(t: Trie): string[] {
  const out: string[] = []
  const walk = (n: TrieNode, prefix: string) => {
    if (n.end) out.push(prefix)
    for (const [c, k] of [...n.children].sort(([a], [b]) => a.localeCompare(b))) walk(k, prefix + c)
  }
  walk(t.root, '')
  return out
}

/** Leaves take consecutive x slots; a parent sits over the middle of its children. */
function trieView(t: Trie): TreeView {
  const nodes: TreeView['nodes'] = []
  const edges: TreeView['edges'] = []
  let slot = 0
  const walk = (n: TrieNode, depth: number): number => {
    const kids = [...n.children.values()].sort((a, b) => a.ch.localeCompare(b.ch))
    let x: number
    if (!kids.length) x = slot++
    else {
      const xs = kids.map((k) => {
        edges.push({ key: `e${k.id}`, from: n.id, to: k.id })
        return walk(k, depth + 1)
      })
      x = (xs[0] + xs[xs.length - 1]) / 2
    }
    nodes.push({ id: n.id, label: n.ch || '•', x, y: depth, end: n.end })
    return x
  }
  walk(t.root, 0)
  return { nodes, edges }
}

export function demoWords(seed: number, count = 8): string[] {
  const rand = mulberry32(seed)
  const pool = [...WORD_POOL]
  const out: string[] = []
  while (out.length < count && pool.length) out.push(pool.splice(Math.floor(rand() * pool.length), 1)[0])
  return out
}

export function runTrie(state: Trie, op: Op) {
  const t = cloneTrie(state)
  const rec = new TreeRecorder(() => trieView(t), (s) => `${s} character${s === 1 ? '' : 's'} checked`)
  const words = (hits: string[] = []) =>
    rec.list(
      'Words',
      'words',
      trieWords(t).map((w) => ({ key: w, label: w, mark: hits.includes(w) ? TM.good : undefined })),
    )
  words()
  let result: boolean | null = null

  const insert = (word: string) => {
    let node = t.root
    rec.ptr('node', node.id)
    for (const ch of word) {
      rec.steps++
      rec.show('iStep', `Next letter: '${ch}'`, [[node.id, TM.active]])
      let next = node.children.get(ch)
      if (!next) {
        next = { id: t.nextId++, ch, children: new Map(), end: false }
        node.children.set(ch, next)
        rec.mark(next.id, TM.fresh)
        rec.show('iNew', `No '${ch}' below yet: create it`)
      } else rec.mark(next.id, TM.path)
      node = next
      rec.ptr('node', node.id)
      rec.show('iMove', `Move down to '${ch}'`)
    }
    node.end = true
    rec.mark(node.id, TM.good)
    words([word])
    rec.show('iEnd', `Mark the end of "${word}"`)
  }

  const walk = (text: string, prefix: boolean) => {
    const L = prefix ? { check: 'pCheck', miss: 'pMiss', move: 'pMove' } : { check: 'sCheck', miss: 'sMiss', move: 'sMove' }
    let node = t.root
    rec.ptr('node', node.id)
    for (const ch of text) {
      rec.steps++
      rec.show(L.check, `Is there a '${ch}' below?`, [[node.id, TM.active]])
      const next = node.children.get(ch)
      if (!next) {
        rec.show(L.miss, `No '${ch}': "${text}" is not ${prefix ? 'a prefix of any word' : 'in the trie'}`, [[node.id, TM.bad]])
        return (result = false)
      }
      rec.mark(next.id, TM.path)
      node = next
      rec.ptr('node', node.id)
      rec.show(L.move, `Move down to '${ch}'`)
    }
    if (prefix) {
      const hits = trieWords(t).filter((w) => w.startsWith(text))
      const mark = (n: TrieNode) => {
        rec.mark(n.id, TM.good)
        n.children.forEach(mark)
      }
      mark(node)
      words(hits)
      rec.show('pHit', `"${text}" is a prefix of ${hits.length} word${hits.length === 1 ? '' : 's'}: ${hits.join(', ')}`)
      return (result = true)
    }
    rec.mark(node.id, node.end ? TM.good : TM.bad)
    if (node.end) words([text])
    rec.show('sEnd', node.end ? `"${text}" is in the trie` : `The path exists but no word ends here: "${text}" is only a prefix`)
    return (result = node.end)
  }

  const word = (op.word ?? '').toLowerCase().replace(/[^a-z]/g, '')
  if (op.kind === 'build') {
    rec.show('', `Insert ${op.words?.map((w) => `"${w}"`).join(', ')}`)
    for (const w of op.words ?? []) {
      insert(w)
      rec.clearMarks()
    }
    words()
    rec.unptr('node')
    rec.show('', `The trie holds ${trieWords(t).length} words in ${t.nextId - 1} letter nodes`)
  } else if (!word) {
    rec.show('', 'Type a word first (letters a–z)')
  } else if (op.kind === 'insert') {
    rec.show('', `Insert "${word}"`)
    insert(word)
    rec.clearMarks()
    rec.unptr('node')
    rec.show('', `Inserted "${word}"`)
  } else {
    rec.show('', `${op.kind === 'prefix' ? 'Any words starting with' : 'Search for'} "${word}"`)
    walk(word, op.kind === 'prefix')
  }
  return { frames: rec.frames, state: t, result }
}

export const trie: TreeItem<Trie> = {
  id: 'trie',
  name: 'Trie',
  group: 'Special trees',
  tagline: 'A tree of letters: words that share a prefix share a path.',
  about: [
    'Each edge is one letter. A word is the path from the root down to a node marked as a word ending (the ringed nodes).',
    'Insert walks down letter by letter, creating nodes only for letters that are not there yet.',
    'Search and prefix search cost one step per letter of the query, no matter how many words are stored.',
    'A prefix search ends at a node; every word below that node starts with the prefix. That is how autocomplete works.',
  ],
  facts: [
    ['Insert / search / prefix', 'O(L), L = word length'],
    ['Space', 'O(total letters)'],
  ],
  chips: [
    ['ops', 'O(L)'],
    ['space', 'O(Σ letters)'],
  ],
  ops: [
    { id: 'insert', label: 'Insert', input: 'word' },
    { id: 'search', label: 'Search', input: 'word' },
    { id: 'prefix', label: 'Starts with', input: 'word' },
  ],
  initial: () => emptyTrie(),
  demo: (seed) => ({ kind: 'build', words: demoWords(seed) }),
  run: (state, op) => {
    const r = runTrie(state, op)
    return { frames: r.frames, state: r.state }
  },
  suggest: (state, op, seed) => {
    const words = trieWords(state)
    const rand = mulberry32(seed)
    if (op === 'insert') {
      const fresh = WORD_POOL.filter((w) => !words.includes(w))
      return { kind: op, word: fresh[Math.floor(rand() * fresh.length)] ?? 'trie' }
    }
    const w = words[Math.floor(rand() * words.length)] ?? 'car'
    return { kind: op, word: op === 'prefix' ? w.slice(0, Math.max(1, w.length - 2)) : w }
  },
  guide: {
    aka: ['prefix tree', 'digital tree'],
    use: 'Autocomplete, spell checking, IP routing (longest prefix match) and word games, anywhere you ask "which stored strings start with this?". A hash set is simpler if you only need exact lookups.',
    wikipedia: 'https://en.wikipedia.org/wiki/Trie',
  },
  code: () => CODE,
}

const CODE = {
  py: py(`
class TrieNode:
    def __init__(self):
        self.children = {}
        self.end = False

def insert(root, word):
    node = root
    for ch in word:                                   # @iStep
        if ch not in node.children:
            node.children[ch] = TrieNode()            # @iNew
        node = node.children[ch]                      # @iMove
    node.end = True                                   # @iEnd

def search(root, word):
    node = root
    for ch in word:
        if ch not in node.children:                   # @sCheck
            return False                              # @sMiss
        node = node.children[ch]                      # @sMove
    return node.end                                   # @sEnd

def starts_with(root, prefix):
    node = root
    for ch in prefix:
        if ch not in node.children:                   # @pCheck
            return False                              # @pMiss
        node = node.children[ch]                      # @pMove
    return True                                       # @pHit`),
  js: js(`
class TrieNode {
  constructor() {
    this.children = new Map();
    this.end = false;
  }
}

function insert(root, word) {
  let node = root;
  for (const ch of word) {                            // @iStep
    if (!node.children.has(ch))
      node.children.set(ch, new TrieNode());          // @iNew
    node = node.children.get(ch);                     // @iMove
  }
  node.end = true;                                    // @iEnd
}

function search(root, word) {
  let node = root;
  for (const ch of word) {
    if (!node.children.has(ch)) return false;         // @sCheck @sMiss
    node = node.children.get(ch);                     // @sMove
  }
  return node.end;                                    // @sEnd
}

function startsWith(root, prefix) {
  let node = root;
  for (const ch of prefix) {
    if (!node.children.has(ch)) return false;         // @pCheck @pMiss
    node = node.children.get(ch);                     // @pMove
  }
  return true;                                        // @pHit
}`),
  cpp: cpp(
    `
struct TrieNode {
    map<char, TrieNode*> children;
    bool end = false;
};

void insert(TrieNode* root, const string& word) {
    TrieNode* node = root;
    for (char ch : word) {                            // @iStep
        if (!node->children.count(ch))
            node->children[ch] = new TrieNode();      // @iNew
        node = node->children[ch];                    // @iMove
    }
    node->end = true;                                 // @iEnd
}

bool search(TrieNode* root, const string& word) {
    TrieNode* node = root;
    for (char ch : word) {
        if (!node->children.count(ch)) return false;  // @sCheck @sMiss
        node = node->children[ch];                    // @sMove
    }
    return node->end;                                 // @sEnd
}

bool startsWith(TrieNode* root, const string& prefix) {
    TrieNode* node = root;
    for (char ch : prefix) {
        if (!node->children.count(ch)) return false;  // @pCheck @pMiss
        node = node->children[ch];                    // @pMove
    }
    return true;                                      // @pHit
}`,
    '#include <map>\n#include <string>\nusing namespace std;\n',
  ),
}

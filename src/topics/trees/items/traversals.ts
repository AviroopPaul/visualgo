import { binaryView, cloneTree, randomKeys, type BNode, type BTree } from '../binary'
import { TM, TreeRecorder } from '../recorder'
import { cpp, js, py, type TreeItem } from '../types'
import { bstFrom } from './searchTree'

type Order = 'inorder' | 'preorder' | 'postorder' | 'levelorder'

const ORDER_NAME: Record<Order, string> = {
  inorder: 'In-order',
  preorder: 'Pre-order',
  postorder: 'Post-order',
  levelorder: 'Level-order',
}

/** A reasonably bushy random BST: the median-ish key first. */
export function traversalTree(seed: number, count = 11): BTree {
  const keys = randomKeys(count, seed)
  const sorted = [...keys].sort((a, b) => a - b)
  const mid = sorted[sorted.length >> 1]
  return bstFrom([mid, ...keys.filter((k) => k !== mid)])
}

export function runTraversal(state: BTree, order: Order) {
  const t = cloneTree(state)
  const rec = new TreeRecorder(() => binaryView(t), (s) => `${s} visited`)
  const out: BNode[] = []
  const stack: BNode[] = []
  const lists = () => {
    const chips = (xs: BNode[]) => xs.map((n) => ({ key: `n${n.id}`, label: String(n.key) }))
    rec.list('Visited', 'output', chips(out))
    if (order === 'levelorder') rec.list('Queue', 'queue', chips(stack))
    else rec.list('Call stack', 'stack', chips(stack))
  }
  const visit = (n: BNode) => {
    out.push(n)
    rec.steps++
    rec.mark(n.id, TM.done)
    lists()
    rec.show('visit', `Visit ${n.key}`, [[n.id, TM.good]])
  }

  const dfs = (n: BNode) => {
    stack.push(n)
    rec.ptr('node', n.id)
    rec.mark(n.id, TM.path)
    lists()
    if (order === 'preorder') visit(n)
    if (n.left) {
      rec.ptr('node', n.id)
      rec.show('left', `At ${n.key}: go down the left subtree`, [[n.id, TM.active]])
      dfs(n.left)
      rec.ptr('node', n.id)
    }
    if (order === 'inorder') visit(n)
    if (n.right) {
      rec.ptr('node', n.id)
      rec.show('right', `At ${n.key}: go down the right subtree`, [[n.id, TM.active]])
      dfs(n.right)
      rec.ptr('node', n.id)
    }
    if (order === 'postorder') visit(n)
    stack.pop()
    lists()
  }

  rec.show('', `${ORDER_NAME[order]} traversal of ${countNodes(t.root)} nodes`)
  if (order === 'levelorder') {
    if (t.root) stack.push(t.root)
    lists()
    rec.show('init', 'Start with the root in the queue')
    while (stack.length) {
      const n = stack.shift()!
      rec.ptr('node', n.id)
      lists()
      rec.show('pop', `Take ${n.key} from the front of the queue`, [[n.id, TM.active]])
      visit(n)
      if (n.left) {
        stack.push(n.left)
        rec.mark(n.left.id, TM.path)
        lists()
        rec.show('pushL', `Queue its left child ${n.left.key}`)
      }
      if (n.right) {
        stack.push(n.right)
        rec.mark(n.right.id, TM.path)
        lists()
        rec.show('pushR', `Queue its right child ${n.right.key}`)
      }
    }
  } else if (t.root) dfs(t.root)
  rec.unptr('node')
  rec.show('', `${ORDER_NAME[order]}: ${out.map((n) => n.key).join(', ')}`)
  return { frames: rec.frames, state: t, order: out.map((n) => n.key) }
}

const countNodes = (n: BNode | null): number => (n ? 1 + countNodes(n.left) + countNodes(n.right) : 0)

const LISTINGS: Record<Order, { py: string; js: string; cpp: string }> = {
  inorder: {
    py: `
def inorder(node, out):
    if node is None:
        return
    inorder(node.left, out)                       # @left
    out.append(node.key)                          # @visit
    inorder(node.right, out)                      # @right`,
    js: `
function inorder(node, out) {
  if (node === null) return;
  inorder(node.left, out);                        // @left
  out.push(node.key);                             // @visit
  inorder(node.right, out);                       // @right
}`,
    cpp: `
void inorder(Node* node, vector<int>& out) {
    if (!node) return;
    inorder(node->left, out);                     // @left
    out.push_back(node->key);                     // @visit
    inorder(node->right, out);                    // @right
}`,
  },
  preorder: {
    py: `
def preorder(node, out):
    if node is None:
        return
    out.append(node.key)                          # @visit
    preorder(node.left, out)                      # @left
    preorder(node.right, out)                     # @right`,
    js: `
function preorder(node, out) {
  if (node === null) return;
  out.push(node.key);                             // @visit
  preorder(node.left, out);                       // @left
  preorder(node.right, out);                      // @right
}`,
    cpp: `
void preorder(Node* node, vector<int>& out) {
    if (!node) return;
    out.push_back(node->key);                     // @visit
    preorder(node->left, out);                    // @left
    preorder(node->right, out);                   // @right
}`,
  },
  postorder: {
    py: `
def postorder(node, out):
    if node is None:
        return
    postorder(node.left, out)                     # @left
    postorder(node.right, out)                    # @right
    out.append(node.key)                          # @visit`,
    js: `
function postorder(node, out) {
  if (node === null) return;
  postorder(node.left, out);                      // @left
  postorder(node.right, out);                     // @right
  out.push(node.key);                             // @visit
}`,
    cpp: `
void postorder(Node* node, vector<int>& out) {
    if (!node) return;
    postorder(node->left, out);                   // @left
    postorder(node->right, out);                  // @right
    out.push_back(node->key);                     // @visit
}`,
  },
  levelorder: {
    py: `
from collections import deque

def levelorder(root, out):
    queue = deque([root] if root else [])         # @init
    while queue:
        node = queue.popleft()                    # @pop
        out.append(node.key)                      # @visit
        if node.left:
            queue.append(node.left)               # @pushL
        if node.right:
            queue.append(node.right)              # @pushR`,
    js: `
function levelorder(root, out) {
  const queue = root ? [root] : [];               // @init
  while (queue.length > 0) {
    const node = queue.shift();                   // @pop
    out.push(node.key);                           // @visit
    if (node.left) queue.push(node.left);         // @pushL
    if (node.right) queue.push(node.right);       // @pushR
  }
}`,
    cpp: `
void levelorder(Node* root, vector<int>& out) {
    queue<Node*> q;                               // @init
    if (root) q.push(root);
    while (!q.empty()) {
        Node* node = q.front(); q.pop();          // @pop
        out.push_back(node->key);                 // @visit
        if (node->left) q.push(node->left);       // @pushL
        if (node->right) q.push(node->right);     // @pushR
    }
}`,
  },
}

const NODE = {
  py: `
class Node:
    def __init__(self, key, left=None, right=None):
        self.key, self.left, self.right = key, left, right
`,
  js: `
class Node {
  constructor(key, left = null, right = null) {
    this.key = key;
    this.left = left;
    this.right = right;
  }
}
`,
  cpp: `
struct Node {
    int key;
    Node *left = nullptr, *right = nullptr;
};
`,
}

const CODE = Object.fromEntries(
  (Object.keys(LISTINGS) as Order[]).map((o) => [
    o,
    {
      py: py(NODE.py + LISTINGS[o].py),
      js: js(NODE.js + LISTINGS[o].js),
      cpp: cpp(NODE.cpp + LISTINGS[o].cpp, '#include <queue>\n#include <vector>\nusing namespace std;\n'),
    },
  ]),
) as Record<Order, ReturnType<TreeItem['code']>>

export const traversals: TreeItem<BTree> = {
  id: 'traversals',
  name: 'Tree traversals',
  group: 'Traversal',
  tagline: 'Four ways to visit every node: in-, pre-, post- and level-order.',
  about: [
    'In-order visits left subtree, node, right subtree. On a BST that lists the keys in sorted order.',
    'Pre-order visits the node before its subtrees (good for copying a tree); post-order visits it after them (good for deleting or evaluating one).',
    'These three are depth-first and use recursion, so the call stack (shown below the tree) grows as deep as the tree.',
    'Level-order is breadth-first: a queue hands out nodes row by row, top to bottom.',
  ],
  facts: [
    ['Time', 'O(n)'],
    ['Extra space, depth-first', 'O(h), h = height'],
    ['Extra space, level-order', 'O(w), w = widest level'],
  ],
  chips: [
    ['time', 'O(n)'],
    ['space', 'O(h)'],
  ],
  ops: [{ id: 'run', label: 'Traverse', input: 'none' }],
  variants: (Object.keys(ORDER_NAME) as Order[]).map((id) => ({ id, label: ORDER_NAME[id] })),
  initial: (seed) => traversalTree(seed),
  demo: () => ({ kind: 'run' }),
  run: (state, _op, variant = 'inorder') => {
    const r = runTraversal(state, variant as Order)
    return { frames: r.frames, state: r.state }
  },
  guide: {
    aka: ['tree walk', 'depth-first traversal', 'breadth-first traversal'],
    use: 'In-order to read a BST in sorted order or validate it; pre-order to copy or serialize a tree; post-order to free memory or evaluate expression trees bottom up; level-order to find the shortest path from the root or print a tree row by row.',
    wikipedia: 'https://en.wikipedia.org/wiki/Tree_traversal',
  },
  code: (variant = 'inorder') => CODE[variant as Order],
}

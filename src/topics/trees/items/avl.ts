import { emptyTree, type BTree } from '../binary'
import { cpp, js, py, type TreeItem } from '../types'
import { demoKeys, runSearchTree, suggestKey } from './searchTree'

export const avl: TreeItem<BTree> = {
  id: 'avl',
  name: 'AVL tree',
  group: 'Search trees',
  tagline: 'A BST that rotates itself back into balance after every change.',
  about: [
    'Every node tracks its height. Its balance factor is the height of its left subtree minus the height of its right one (the badge on each node).',
    'Insert and delete work like a normal BST, then walk back up the path updating heights.',
    'If a node’s balance reaches +2 or −2, one or two rotations fix it: left-left and right-right need a single rotation, left-right and right-left need two.',
    'Because balance is always within ±1, the height stays about 1.44 log₂ n, so every operation is O(log n), even on sorted input.',
  ],
  facts: [
    ['Search / insert / delete', 'O(log n)'],
    ['Rotations per insert', 'at most 2'],
    ['Height', '≤ 1.44 log₂ n'],
    ['Space', 'O(n)'],
  ],
  chips: [
    ['all ops', 'O(log n)'],
    ['height', '≤ 1.44 log n'],
    ['space', 'O(n)'],
  ],
  ops: [
    { id: 'insert', label: 'Insert', input: 'value' },
    { id: 'search', label: 'Search', input: 'value' },
    { id: 'delete', label: 'Delete', input: 'value' },
  ],
  initial: () => emptyTree(),
  // Sorted keys would make a plain BST a stick; watch AVL rotate instead.
  demo: (seed) => ({ kind: 'build', keys: [...demoKeys(seed, 7)].sort((a, b) => a - b) }),
  run: (state, op) => runSearchTree(state, op, true),
  suggest: suggestKey,
  guide: {
    aka: ['Adelson-Velsky and Landis tree', 'height-balanced binary search tree'],
    use: 'When lookups dominate and you want a strict O(log n) guarantee: AVL trees are more tightly balanced than red–black trees, so searches are slightly faster, at the cost of more rotations on insert and delete. Used in databases and in-memory indexes.',
    wikipedia: 'https://en.wikipedia.org/wiki/AVL_tree',
  },
  code: () => ({
    py: py(`
class Node:
    def __init__(self, key):
        self.key, self.left, self.right, self.height = key, None, None, 1

def height(n):
    return n.height if n else 0

def update(n):
    n.height = 1 + max(height(n.left), height(n.right))

def balance(n):
    return height(n.left) - height(n.right)

def rotate_right(y):
    x = y.left
    y.left, x.right = x.right, y
    update(y); update(x)
    return x

def rotate_left(x):
    y = x.right
    x.right, y.left = y.left, x
    update(x); update(y)
    return y

def rebalance(n):
    update(n)                                         # @update
    if balance(n) > 1:                                # @leftHeavy
        if balance(n.left) < 0:
            n.left = rotate_left(n.left)              # @lr
        return rotate_right(n)                        # @ll
    if balance(n) < -1:                               # @rightHeavy
        if balance(n.right) > 0:
            n.right = rotate_right(n.right)           # @rl
        return rotate_left(n)                         # @rr
    return n

def insert(n, key):
    if n is None:
        return Node(key)                              # @place
    if key == n.key:                                  # @cmp
        return n                                      # @dup
    if key < n.key:
        n.left = insert(n.left, key)                  # @goLeft
    else:
        n.right = insert(n.right, key)                # @goRight
    return rebalance(n)

def search(n, key):
    while n is not None:
        if key == n.key:                              # @sCmp
            return n                                  # @found
        n = n.left if key < n.key else n.right        # @sStep
    return None                                       # @notFound

def remove(n, key):
    if n is None:
        return None                                   # @dMissing
    if key < n.key:                                   # @dCmp
        n.left = remove(n.left, key)
    elif key > n.key:
        n.right = remove(n.right, key)
    else:
        if n.left is None or n.right is None:         # @dFound
            return n.left or n.right                  # @dSplice
        succ = n.right                                # @dSucc
        while succ.left is not None:
            succ = succ.left                          # @dSuccStep
        n.key = succ.key                              # @dCopy
        n.right = remove(n.right, succ.key)
    return rebalance(n)`),
    js: js(`
class Node {
  constructor(key) {
    this.key = key;
    this.left = null;
    this.right = null;
    this.height = 1;
  }
}

const height = (n) => (n ? n.height : 0);
const update = (n) => { n.height = 1 + Math.max(height(n.left), height(n.right)); };
const balance = (n) => height(n.left) - height(n.right);

function rotateRight(y) {
  const x = y.left;
  y.left = x.right;
  x.right = y;
  update(y); update(x);
  return x;
}

function rotateLeft(x) {
  const y = x.right;
  x.right = y.left;
  y.left = x;
  update(x); update(y);
  return y;
}

function rebalance(n) {
  update(n);                                              // @update
  if (balance(n) > 1) {                                   // @leftHeavy
    if (balance(n.left) < 0) n.left = rotateLeft(n.left); // @lr
    return rotateRight(n);                                // @ll
  }
  if (balance(n) < -1) {                                  // @rightHeavy
    if (balance(n.right) > 0) n.right = rotateRight(n.right); // @rl
    return rotateLeft(n);                                 // @rr
  }
  return n;
}

function insert(n, key) {
  if (n === null) return new Node(key);                   // @place
  if (key === n.key) return n;                            // @cmp @dup
  if (key < n.key) n.left = insert(n.left, key);          // @goLeft
  else n.right = insert(n.right, key);                    // @goRight
  return rebalance(n);
}

function search(n, key) {
  while (n !== null) {
    if (key === n.key) return n;                          // @sCmp @found
    n = key < n.key ? n.left : n.right;                   // @sStep
  }
  return null;                                            // @notFound
}

function remove(n, key) {
  if (n === null) return null;                            // @dMissing
  if (key < n.key) n.left = remove(n.left, key);          // @dCmp
  else if (key > n.key) n.right = remove(n.right, key);
  else {
    if (n.left === null || n.right === null)              // @dFound
      return n.left ?? n.right;                           // @dSplice
    let succ = n.right;                                   // @dSucc
    while (succ.left !== null) succ = succ.left;          // @dSuccStep
    n.key = succ.key;                                     // @dCopy
    n.right = remove(n.right, succ.key);
  }
  return rebalance(n);
}`),
    cpp: cpp(`
struct Node {
    int key, height = 1;
    Node *left = nullptr, *right = nullptr;
    Node(int k) : key(k) {}
};

int height(Node* n) { return n ? n->height : 0; }
void update(Node* n) { n->height = 1 + max(height(n->left), height(n->right)); }
int balance(Node* n) { return height(n->left) - height(n->right); }

Node* rotateRight(Node* y) {
    Node* x = y->left;
    y->left = x->right;
    x->right = y;
    update(y); update(x);
    return x;
}

Node* rotateLeft(Node* x) {
    Node* y = x->right;
    x->right = y->left;
    y->left = x;
    update(x); update(y);
    return y;
}

Node* rebalance(Node* n) {
    update(n);                                            // @update
    if (balance(n) > 1) {                                 // @leftHeavy
        if (balance(n->left) < 0) n->left = rotateLeft(n->left);   // @lr
        return rotateRight(n);                            // @ll
    }
    if (balance(n) < -1) {                                // @rightHeavy
        if (balance(n->right) > 0) n->right = rotateRight(n->right);  // @rl
        return rotateLeft(n);                             // @rr
    }
    return n;
}

Node* insert(Node* n, int key) {
    if (!n) return new Node(key);                         // @place
    if (key == n->key) return n;                          // @cmp @dup
    if (key < n->key) n->left = insert(n->left, key);     // @goLeft
    else n->right = insert(n->right, key);                // @goRight
    return rebalance(n);
}

Node* search(Node* n, int key) {
    while (n) {
        if (key == n->key) return n;                      // @sCmp @found
        n = key < n->key ? n->left : n->right;            // @sStep
    }
    return nullptr;                                       // @notFound
}

Node* remove(Node* n, int key) {
    if (!n) return nullptr;                               // @dMissing
    if (key < n->key) n->left = remove(n->left, key);     // @dCmp
    else if (key > n->key) n->right = remove(n->right, key);
    else {
        if (!n->left || !n->right) {                      // @dFound
            Node* child = n->left ? n->left : n->right;   // @dSplice
            delete n;
            return child;
        }
        Node* succ = n->right;                            // @dSucc
        while (succ->left) succ = succ->left;             // @dSuccStep
        n->key = succ->key;                               // @dCopy
        n->right = remove(n->right, succ->key);
    }
    return rebalance(n);
}`),
  }),
}

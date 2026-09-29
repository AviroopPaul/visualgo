import { emptyTree, type BTree } from '../binary'
import { cpp, js, py, type TreeItem } from '../types'
import { demoKeys, runSearchTree, suggestKey } from './searchTree'

export const bst: TreeItem<BTree> = {
  id: 'bst',
  name: 'Binary search tree',
  group: 'Search trees',
  tagline: 'Smaller keys to the left, larger to the right, at every node.',
  about: [
    'Every node has at most two children. Everything in its left subtree is smaller, everything in its right subtree is larger.',
    'Search, insert and delete all walk down from the root, going left or right at each node, so they cost one step per level.',
    'Deleting a node with two children copies in its successor (the smallest key on its right) and deletes that instead.',
    'The catch: insert keys in sorted order and the tree becomes a linked list. Self-balancing trees like AVL fix that.',
  ],
  facts: [
    ['Search / insert / delete (average)', 'O(log n)'],
    ['Search / insert / delete (worst)', 'O(n)'],
    ['Space', 'O(n)'],
  ],
  chips: [
    ['avg', 'O(log n)'],
    ['worst', 'O(n)'],
    ['space', 'O(n)'],
  ],
  ops: [
    { id: 'insert', label: 'Insert', input: 'value' },
    { id: 'search', label: 'Search', input: 'value' },
    { id: 'delete', label: 'Delete', input: 'value' },
  ],
  initial: () => emptyTree(),
  demo: (seed) => ({ kind: 'build', keys: demoKeys(seed) }),
  run: (state, op) => runSearchTree(state, op, false),
  suggest: suggestKey,
  guide: {
    aka: ['BST', 'ordered binary tree', 'sorted binary tree'],
    use: 'When you need a sorted collection that supports fast insert, delete and lookup, plus in-order iteration and range queries. In practice use a balanced variant (AVL, red–black, B-tree) so sorted input cannot degrade it to O(n); Java TreeMap and C++ std::map are balanced BSTs.',
    wikipedia: 'https://en.wikipedia.org/wiki/Binary_search_tree',
  },
  code: () => ({
    py: py(`
class Node:
    def __init__(self, key):
        self.key, self.left, self.right = key, None, None

def insert(node, key):
    if node is None:
        return Node(key)                              # @place
    if key == node.key:                               # @cmp
        return node                                   # @dup
    if key < node.key:
        node.left = insert(node.left, key)            # @goLeft
    else:
        node.right = insert(node.right, key)          # @goRight
    return node

def search(node, key):
    while node is not None:
        if key == node.key:                           # @sCmp
            return node                               # @found
        node = node.left if key < node.key else node.right   # @sStep
    return None                                       # @notFound

def remove(node, key):
    if node is None:
        return None                                   # @dMissing
    if key < node.key:                                # @dCmp
        node.left = remove(node.left, key)            # @dLeft
    elif key > node.key:
        node.right = remove(node.right, key)          # @dRight
    else:
        if node.left is None:                         # @dFound
            return node.right                         # @dSplice
        if node.right is None:
            return node.left                          # @dSplice2
        succ = node.right                             # @dSucc
        while succ.left is not None:
            succ = succ.left                          # @dSuccStep
        node.key = succ.key                           # @dCopy
        node.right = remove(node.right, succ.key)     # @dRemoveSucc
    return node`),
    js: js(`
class Node {
  constructor(key) {
    this.key = key;
    this.left = null;
    this.right = null;
  }
}

function insert(node, key) {
  if (node === null) return new Node(key);                // @place
  if (key === node.key) return node;                      // @cmp @dup
  if (key < node.key) node.left = insert(node.left, key); // @goLeft
  else node.right = insert(node.right, key);              // @goRight
  return node;
}

function search(node, key) {
  while (node !== null) {
    if (key === node.key) return node;                    // @sCmp @found
    node = key < node.key ? node.left : node.right;       // @sStep
  }
  return null;                                            // @notFound
}

function remove(node, key) {
  if (node === null) return null;                         // @dMissing
  if (key < node.key) {                                   // @dCmp
    node.left = remove(node.left, key);                   // @dLeft
  } else if (key > node.key) {
    node.right = remove(node.right, key);                 // @dRight
  } else {
    if (node.left === null) return node.right;            // @dFound @dSplice
    if (node.right === null) return node.left;            // @dSplice2
    let succ = node.right;                                // @dSucc
    while (succ.left !== null) succ = succ.left;          // @dSuccStep
    node.key = succ.key;                                  // @dCopy
    node.right = remove(node.right, succ.key);            // @dRemoveSucc
  }
  return node;
}`),
    cpp: cpp(`
struct Node {
    int key;
    Node *left = nullptr, *right = nullptr;
    Node(int k) : key(k) {}
};

Node* insert(Node* node, int key) {
    if (!node) return new Node(key);                      // @place
    if (key == node->key) return node;                    // @cmp @dup
    if (key < node->key) node->left = insert(node->left, key);  // @goLeft
    else node->right = insert(node->right, key);          // @goRight
    return node;
}

Node* search(Node* node, int key) {
    while (node) {
        if (key == node->key) return node;                // @sCmp @found
        node = key < node->key ? node->left : node->right;   // @sStep
    }
    return nullptr;                                       // @notFound
}

Node* remove(Node* node, int key) {
    if (!node) return nullptr;                            // @dMissing
    if (key < node->key) {                                // @dCmp
        node->left = remove(node->left, key);             // @dLeft
    } else if (key > node->key) {
        node->right = remove(node->right, key);           // @dRight
    } else {
        if (!node->left || !node->right) {                // @dFound
            Node* child = node->left ? node->left : node->right;   // @dSplice @dSplice2
            delete node;
            return child;
        }
        Node* succ = node->right;                         // @dSucc
        while (succ->left) succ = succ->left;             // @dSuccStep
        node->key = succ->key;                            // @dCopy
        node->right = remove(node->right, succ->key);     // @dRemoveSucc
    }
    return node;
}`),
  }),
}

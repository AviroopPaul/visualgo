import type { Faq } from '../../components/Guide'
import type { TreeItem } from './types'

/** "a binary search tree", "an AVL tree", "a trie": keeps acronyms, picks the article. */
function withArticle(name: string) {
  const shown = /^[A-Z]{2}/.test(name) ? name : name.charAt(0).toLowerCase() + name.slice(1)
  return `${/^[aeiou]/i.test(shown) ? 'an' : 'a'} ${shown}`
}

export function treeFaqFor(t: TreeItem<unknown>): Faq[] {
  const subject = t.id === 'traversals' ? 'tree traversal' : withArticle(t.name)
  return [
    { q: `How does ${subject} work?`, a: t.about.join(' ') },
    { q: `What is the time complexity of ${subject}?`, a: t.facts.map(([k, v]) => `${k}: ${v}.`).join(' ') },
    { q: `When should you use ${t.id === 'traversals' ? 'each traversal' : withArticle(t.name)}?`, a: t.guide.use },
  ]
}

/** Questions answered on the /trees overview page. */
export const TREES_FAQ: Faq[] = [
  {
    q: 'What is the difference between a binary search tree and an AVL tree?',
    a: 'Both keep smaller keys on the left and larger on the right. A plain BST can become a long chain if keys arrive in sorted order, making operations O(n). An AVL tree checks balance after every insert and delete and rotates nodes to keep both sides within one level of each other, so every operation stays O(log n).',
  },
  {
    q: 'What are the four ways to traverse a binary tree?',
    a: 'In-order (left, node, right), pre-order (node, left, right) and post-order (left, right, node) are depth-first and use recursion or a stack. Level-order visits nodes row by row using a queue. On a binary search tree, in-order gives the keys in sorted order.',
  },
  {
    q: 'When should I use a trie instead of a hash table?',
    a: 'Use a trie when you need prefix queries: autocomplete, "all words starting with", longest prefix match. A hash table is simpler and usually faster for exact lookups only, but it cannot answer prefix questions without scanning every key.',
  },
  {
    q: 'What is a segment tree used for?',
    a: 'Answering range queries (sum, minimum, maximum over a[l..r]) on an array that also changes. Both the query and a point update take O(log n), where recomputing from scratch would take O(n) each time.',
  },
  {
    q: 'How do I use this tree visualizer?',
    a: 'Pick a tree, type a value and press Insert, Search or Delete (or press Suggest for a sensible value). Every operation is animated step by step: play, pause, step with the arrow keys, and press C to follow the Python, JavaScript or C++ code line by line.',
  },
]

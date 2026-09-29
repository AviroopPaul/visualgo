import { avl } from './items/avl'
import { bst } from './items/bst'
import { segment } from './items/segment'
import { traversals } from './items/traversals'
import { trie } from './items/trie'
import type { TreeGroup, TreeItem } from './types'

/** Add a tree by writing its item file and listing it here. */
export const TREES: TreeItem<any>[] = [bst, traversals, avl, trie, segment] // eslint-disable-line @typescript-eslint/no-explicit-any
export const TREE_GROUPS: TreeGroup[] = ['Search trees', 'Traversal', 'Special trees']
export const treeById = (id: string) => TREES.find((t) => t.id === id)

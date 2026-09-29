import type { TopicModule } from '../types'
import { TreesShelf } from './Shelf'
import { TreePage } from './TreePage'
import { TreesHub } from './TreesHub'

export const treesTopic: TopicModule = {
  id: 'trees',
  routes: [
    { path: '/trees', element: <TreesHub /> },
    { path: '/trees/:item', element: <TreePage /> },
  ],
  Shelf: TreesShelf,
}

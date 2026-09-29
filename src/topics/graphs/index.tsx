import type { TopicModule } from '../types'
import { GraphPage } from './GraphPage'
import { GraphsHub } from './GraphsHub'
import { GraphsShelf } from './Shelf'

export const graphsTopic: TopicModule = {
  id: 'graphs',
  routes: [
    { path: '/graphs', element: <GraphsHub /> },
    { path: '/graphs/:algo', element: <GraphPage /> },
  ],
  Shelf: GraphsShelf,
}

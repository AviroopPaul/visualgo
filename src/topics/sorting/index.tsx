import type { TopicModule } from '../types'
import { RacePage } from './RacePage'
import { SortingShelf } from './Shelf'
import { SortingHub } from './SortingHub'
import { SortPage } from './SortPage'

export const sortingTopic: TopicModule = {
  id: 'sorting',
  routes: [
    { path: '/sorting', element: <SortingHub /> },
    { path: '/sorting/race', element: <RacePage /> },
    { path: '/sorting/:algo', element: <SortPage /> },
  ],
  Shelf: SortingShelf,
}

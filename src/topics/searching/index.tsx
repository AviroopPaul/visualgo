import type { TopicModule } from '../types'
import { SearchPage } from './SearchPage'
import { SearchRace } from './SearchRace'
import { SearchingHub } from './SearchingHub'
import { SearchingShelf } from './Shelf'

export const searchingTopic: TopicModule = {
  id: 'searching',
  routes: [
    { path: '/searching', element: <SearchingHub /> },
    { path: '/searching/race', element: <SearchRace /> },
    { path: '/searching/:algo', element: <SearchPage /> },
  ],
  Shelf: SearchingShelf,
}

import type { ComponentType, ReactElement } from 'react'

/**
 * What a live topic plugs into the app. App.tsx mounts `routes`, the home
 * page renders `Shelf`, and the top bar links to `/<id>`.
 * Planned topics live only in catalog.ts until they ship.
 */
export interface TopicModule {
  id: string
  routes: Array<{ path: string; element: ReactElement }>
  /** Home-page section listing the topic's items. */
  Shelf: ComponentType
}

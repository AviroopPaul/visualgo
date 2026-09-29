import { graphsTopic } from './graphs'
import { searchingTopic } from './searching'
import { sortingTopic } from './sorting'
import { treesTopic } from './trees'
import type { TopicModule } from './types'

/** Live topics, in the order they appear on the home page and top bar. */
export const MODULES: TopicModule[] = [sortingTopic, searchingTopic, treesTopic, graphsTopic]

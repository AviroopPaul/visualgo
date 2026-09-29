import { Guide } from '../../components/Guide'
import { relatedSearches, searchFaqFor, searchGuideFor } from './guide'
import { SEARCHES } from './registry'
import type { SearchAlgorithm } from './types'

export function SearchGuide({ algo }: { algo: SearchAlgorithm }) {
  const g = searchGuideFor(algo)
  const c = algo.complexity
  return (
    <Guide
      crumbs={[
        ['Searching', '/searching'],
        [algo.name, `/searching/${algo.id}`],
      ]}
      name={algo.name}
      tagline={algo.tagline}
      aka={g.aka}
      steps={algo.about}
      facts={[
        ['Best case', c.best, true],
        ['Average case', c.average, true],
        ['Worst case', c.worst, true],
        ['Extra space', c.space, true],
        ['Needs sorted input', algo.sorted ? 'Yes' : 'No'],
      ]}
      use={g.use}
      listings={[algo.code.py, algo.code.js, algo.code.cpp]}
      faq={searchFaqFor(algo)}
      related={[
        ...relatedSearches(algo, SEARCHES).map((a) => ({ to: `/searching/${a.id}`, name: a.name, hint: a.complexity.average })),
        { to: '/searching/race', name: 'Race them', hint: 'same target, fewest probes wins' },
      ]}
      wikipedia={g.wikipedia}
    />
  )
}

import { Guide } from '../../components/Guide'
import { faqFor, guideFor, relatedTo } from './guide'
import { ALGORITHMS } from './registry'
import type { SortAlgorithm } from './types'

/** Plain reference text under the animation: steps, complexity, code, FAQ, related algorithms. */
export function AlgoGuide({ algo }: { algo: SortAlgorithm }) {
  const g = guideFor(algo)
  const c = algo.complexity
  return (
    <Guide
      crumbs={[
        ['Sorting', '/sorting'],
        [algo.name, `/sorting/${algo.id}`],
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
        ['Stable', algo.stable ? 'Yes' : 'No'],
        ['In place', algo.inPlace ? 'Yes' : 'No'],
      ]}
      use={g.use}
      listings={[algo.code.py, algo.code.js, algo.code.cpp]}
      faq={faqFor(algo)}
      related={[
        ...relatedTo(algo, ALGORITHMS).map((a) => ({ to: `/sorting/${a.id}`, name: a.name, hint: a.complexity.average })),
        { to: '/sorting/race', name: 'Race them', hint: 'same input, side by side' },
      ]}
      wikipedia={g.wikipedia}
    />
  )
}

import { Guide } from '../../components/Guide'
import { graphFaqFor } from './guide'
import { GRAPHS } from './registry'
import type { GraphAlgorithm } from './types'

export function GraphGuide({ algo }: { algo: GraphAlgorithm }) {
  const c = algo.complexity
  return (
    <Guide
      crumbs={[
        ['Graphs', '/graphs'],
        [algo.name, `/graphs/${algo.id}`],
      ]}
      name={algo.name}
      tagline={algo.tagline}
      aka={algo.guide.aka}
      steps={algo.about}
      facts={[
        ['Time', c.average, true],
        ['Extra space', c.space, true],
        ['Graph type', algo.directed ? 'Directed' : 'Undirected'],
      ]}
      use={algo.guide.use}
      listings={[algo.code.py, algo.code.js, algo.code.cpp]}
      faq={graphFaqFor(algo)}
      related={GRAPHS.filter((a) => a.id !== algo.id).map((a) => ({ to: `/graphs/${a.id}`, name: a.name, hint: a.group }))}
      wikipedia={algo.guide.wikipedia}
    />
  )
}

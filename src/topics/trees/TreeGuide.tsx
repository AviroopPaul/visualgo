import { Guide } from '../../components/Guide'
import { treeFaqFor } from './guide'
import { TREES } from './registry'
import type { TreeItem } from './types'

export function TreeGuide({ item, variant }: { item: TreeItem<unknown>; variant?: string }) {
  const code = item.code(variant)
  return (
    <Guide
      crumbs={[
        ['Trees', '/trees'],
        [item.name, `/trees/${item.id}`],
      ]}
      name={item.name}
      tagline={item.tagline}
      aka={item.guide.aka}
      steps={item.about}
      facts={item.facts.map(([k, v]) => [k, v, v.startsWith('O(')])}
      use={item.guide.use}
      listings={[code.py, code.js, code.cpp]}
      faq={treeFaqFor(item)}
      related={TREES.filter((t) => t.id !== item.id).map((t) => ({ to: `/trees/${t.id}`, name: t.name, hint: t.chips[0][1] }))}
      wikipedia={item.guide.wikipedia}
    />
  )
}

import { binary } from './algorithms/binary'
import { exponential } from './algorithms/exponential'
import { interpolation } from './algorithms/interpolation'
import { jump } from './algorithms/jump'
import { linear } from './algorithms/linear'
import { ternary } from './algorithms/ternary'
import { SearchTracer, type SearchRun } from './tracer'
import type { SearchAlgorithm, SearchGroup } from './types'

/** Add a search algorithm by writing its file and listing it here. */
export const SEARCHES: SearchAlgorithm[] = [linear, jump, binary, ternary, exponential, interpolation]
export const GROUPS: SearchGroup[] = ['Scan', 'Halving', 'Estimate']
export const searchById = (id: string) => SEARCHES.find((a) => a.id === id)

const cache = new Map<string, SearchRun>()

export function traceSearch(algo: SearchAlgorithm, values: number[], target: number): SearchRun {
  const key = `${algo.id}:${target}:${values.join(',')}`
  const hit = cache.get(key)
  if (hit) return hit
  const t = new SearchTracer(values, target)
  algo.run(t)
  const run = t.finish()
  if (cache.size > 60) cache.delete(cache.keys().next().value!)
  cache.set(key, run)
  return run
}

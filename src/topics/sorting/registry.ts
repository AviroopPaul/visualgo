import { Tracer, type SortRun } from './tracer'
import type { Family, SortAlgorithm } from './types'
import { bubble } from './algorithms/bubble'
import { cocktail } from './algorithms/cocktail'
import { oddEven } from './algorithms/oddEven'
import { comb } from './algorithms/comb'
import { gnome } from './algorithms/gnome'
import { selection } from './algorithms/selection'
import { heap } from './algorithms/heap'
import { cycle } from './algorithms/cycle'
import { pancake } from './algorithms/pancake'
import { insertion } from './algorithms/insertion'
import { shell } from './algorithms/shell'
import { merge } from './algorithms/merge'
import { quick } from './algorithms/quick'
import { quickHoare } from './algorithms/quickHoare'
import { counting } from './algorithms/counting'
import { radix } from './algorithms/radix'
import { bucket } from './algorithms/bucket'
import { tim } from './algorithms/tim'
import { bitonic } from './algorithms/bitonic'

/** Add a new sorting algorithm by writing its file and listing it here. */
export const ALGORITHMS: SortAlgorithm[] = [
  bubble, cocktail, oddEven, comb, gnome,
  selection, heap, cycle, pancake,
  insertion, shell,
  merge, quick, quickHoare,
  counting, radix, bucket,
  tim, bitonic,
]

export const FAMILIES: Family[] = ['Exchange', 'Selection', 'Insertion', 'Divide & conquer', 'Distribution', 'Hybrid & networks']

export const byId = (id: string) => ALGORITHMS.find((a) => a.id === id)

/** Largest power of two ≤ n (bitonic needs it). */
export const floorPow2 = (n: number) => 2 ** Math.floor(Math.log2(Math.max(2, n)))

export function fitInput(algo: SortAlgorithm, values: number[]) {
  return algo.pow2 ? values.slice(0, floorPow2(values.length)) : values
}

const runCache = new Map<string, SortRun>()

export function trace(algo: SortAlgorithm, values: number[]): SortRun {
  const input = fitInput(algo, values)
  const key = `${algo.id}:${input.join(',')}`
  const hit = runCache.get(key)
  if (hit) return hit
  const t = new Tracer(input)
  algo.run(t)
  const run = t.finish()
  if (runCache.size > 40) runCache.delete(runCache.keys().next().value!)
  runCache.set(key, run)
  return run
}

import { mulberry32 } from '../../engine/rng'

export const DISTS = [
  { id: 'uniform', label: 'Evenly spread' },
  { id: 'random', label: 'Random' },
  { id: 'skewed', label: 'Skewed' },
  { id: 'few', label: 'Few unique' },
] as const
export type Dist = (typeof DISTS)[number]['id']

export const MIN_N = 8
export const MAX_N = 128

/** Largest value for an array of length n (keeps heights readable). */
export const maxValueFor = (n: number) => Math.max(99, n * 3)

/** A sorted array of n values in 1..maxValueFor(n). */
export function makeArray(n: number, dist: Dist, seed: number): number[] {
  const rand = mulberry32(seed)
  const max = maxValueFor(n)
  let a: number[]
  switch (dist) {
    case 'uniform':
      a = Array.from({ length: n }, (_, i) => Math.round(1 + ((max - 1) * i) / (n - 1) + (rand() - 0.5) * 2))
      break
    case 'skewed':
      a = Array.from({ length: n }, (_, i) => Math.round(1 + (max - 1) * (i / (n - 1)) ** 4))
      break
    case 'few': {
      const levels = [0.15, 0.35, 0.55, 0.75, 0.95].map((f) => Math.round(f * max))
      a = Array.from({ length: n }, () => levels[Math.floor(rand() * levels.length)])
      break
    }
    default:
      a = Array.from({ length: n }, () => 1 + Math.floor(rand() * max))
  }
  return a.map((v) => Math.max(1, Math.min(max, v))).sort((x, y) => x - y)
}

/** A value that is in the array (hit) or definitely not (miss). */
export function pickTarget(values: number[], seed: number, miss = false): number {
  const rand = mulberry32(seed ^ 0x5bd1e995)
  if (!miss) return values[Math.floor(rand() * values.length)]
  const present = new Set(values)
  const max = Math.max(...values)
  for (let tries = 0; tries < 500; tries++) {
    const v = 1 + Math.floor(rand() * max)
    if (!present.has(v)) return v
  }
  return max + 1
}

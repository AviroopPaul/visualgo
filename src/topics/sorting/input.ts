import { mulberry32 } from '../../engine/rng'

export const PRESETS = [
  { id: 'random', label: 'Random' },
  { id: 'nearly', label: 'Nearly sorted' },
  { id: 'reversed', label: 'Reversed' },
  { id: 'few', label: 'Few unique' },
] as const
export type Preset = (typeof PRESETS)[number]['id']

export const MIN_N = 4
export const MAX_N = 128

/** Deterministic input for (n, preset, seed). Values are 5..100. */
export function makeInput(n: number, preset: Preset, seed: number): number[] {
  const rand = mulberry32(seed)
  const lo = 5
  const hi = 100
  const ramp = (i: number) => Math.round(lo + ((hi - lo) * (i + 1)) / n)
  switch (preset) {
    case 'reversed':
      return Array.from({ length: n }, (_, i) => ramp(n - 1 - i))
    case 'nearly': {
      const a = Array.from({ length: n }, (_, i) => ramp(i))
      for (let s = 0; s < Math.max(1, Math.round(n / 12)); s++) {
        const i = Math.floor(rand() * (n - 3))
        const j = Math.min(n - 1, i + 1 + Math.floor(rand() * 3))
        ;[a[i], a[j]] = [a[j], a[i]]
      }
      return a
    }
    case 'few': {
      const levels = [20, 45, 70, 95]
      return Array.from({ length: n }, () => levels[Math.floor(rand() * levels.length)])
    }
    default:
      return Array.from({ length: n }, () => lo + Math.floor(rand() * (hi - lo + 1)))
  }
}

/** Parse "5, 3 8,1" into numbers, clamped to something drawable. */
export function parseCustom(text: string): number[] | null {
  const nums = text
    .split(/[\s,;]+/)
    .filter(Boolean)
    .map(Number)
  if (nums.length < 2 || nums.some((x) => !Number.isFinite(x))) return null
  return nums.slice(0, MAX_N).map((x) => Math.max(1, Math.min(500, Math.round(x))))
}

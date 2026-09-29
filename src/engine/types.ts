/**
 * The engine is topic-agnostic. Every visualization (sorting, trees, graphs…)
 * records its algorithm as a list of frames up front, then a player walks
 * through them. A frame only needs to say which code line is active and what
 * is happening in plain words; each topic extends it with whatever state its
 * stage needs to draw.
 */
export interface Frame {
  /** Label of the active code line (see code.ts). Empty = none. */
  line: string
  /** One-sentence narration of this step. */
  note: string
}

export type Lang = 'py' | 'js' | 'cpp'

/** A code listing whose lines are tagged with `// @label` (or `# @label`). */
export interface Listing {
  lang: Lang
  source: string
}

export interface Complexity {
  best: string
  average: string
  worst: string
  space: string
}

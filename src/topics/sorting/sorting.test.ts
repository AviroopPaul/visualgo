import { describe, expect, it } from 'vitest'
import { parseListing } from '../../engine/code'
import { ALGORITHMS, trace } from './registry'
import { makeInput, PRESETS } from './input'
import { Z } from './tracer'

const SIZES = [4, 5, 16, 33, 64, 128]

describe.each(ALGORITHMS.map((a) => [a.name, a] as const))('%s', (_, algo) => {
  it.each(PRESETS.flatMap((p) => SIZES.map((n) => [p.id, n] as const)))('sorts %s input of %i', (preset, n) => {
    const run = trace(algo, makeInput(n, preset, n * 7 + 1))
    const last = run.frames[run.frames.length - 1]
    const order = new Array(run.n).fill(-1)
    for (let id = 0; id < run.n; id++) {
      expect(last.zone[id]).toBe(Z.main)
      expect(order[last.slot[id]]).toBe(-1)
      order[last.slot[id]] = id
    }
    const vals = order.map((id) => run.values[id])
    expect(vals).toEqual([...run.values].sort((a, b) => a - b))
  })

  it('only highlights code lines that exist in every listing', () => {
    const run = trace(algo, makeInput(33, 'random', 3))
    const js = parseListing(algo.code.js)
    const py = parseListing(algo.code.py)
    const cpp = parseListing(algo.code.cpp)
    const used = new Set(run.frames.map((f) => f.line).filter(Boolean))
    for (const label of used) {
      expect(js.labels.has(label), `js missing @${label}`).toBe(true)
      expect(py.labels.has(label), `py missing @${label}`).toBe(true)
      expect(cpp.labels.has(label), `cpp missing @${label}`).toBe(true)
    }
  })

  it('never leaves @markers in rendered code', () => {
    for (const l of [algo.code.py, algo.code.js, algo.code.cpp]) {
      expect(parseListing(l).lines.join('\n')).not.toMatch(/@\w/)
    }
  })
})

// The listings people read and copy must actually work.
const insertionHelper = `function insertionSort(b){for(let i=1;i<b.length;i++){const k=b[i];let j=i-1;while(j>=0&&b[j]>k){b[j+1]=b[j];j--}b[j+1]=k}return b}`
describe('JavaScript listings run and sort', () => {
  it.each(ALGORITHMS.map((a) => [a.name, a] as const))('%s', (_, algo) => {
    const src = parseListing(algo.code.js).lines.join('\n')
    const entry = src.match(/function (\w+)/)![1]
    const needsHelper = algo.id === 'bucket'
    const fn = new Function(`${needsHelper ? insertionHelper : ''}\n${src}\nreturn ${entry};`)()
    for (const [preset, n] of [['random', 32], ['few', 17], ['reversed', 64], ['nearly', 9]] as const) {
      const input = makeInput(algo.pow2 ? 32 : n, preset, 11)
      const out = fn([...input])
      expect(out ?? input).toEqual([...input].sort((a, b) => a - b))
    }
  })
})

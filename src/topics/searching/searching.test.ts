import { describe, expect, it } from 'vitest'
import { parseListing } from '../../engine/code'
import { CPP_PRELUDE, cppBody, HAS_CPP, HAS_PYTHON, runCpp, runPython, shown } from '../../test/runners'
import { DISTS, makeArray, pickTarget } from './input'
import { SEARCHES, traceSearch } from './registry'

type Case = { a: number[]; t: number }

/** Every distribution × several sizes × every present value + a few misses. */
function cases(): Case[] {
  const out: Case[] = []
  for (const d of DISTS) {
    for (const n of [8, 9, 17, 40, 128]) {
      const a = makeArray(n, d.id, n * 31 + d.id.length)
      for (const t of new Set(a)) out.push({ a, t })
      for (let s = 0; s < 4; s++) out.push({ a, t: pickTarget(a, s, true) })
      out.push({ a, t: 0 }, { a, t: a[a.length - 1] + 10 })
    }
  }
  return out
}
const CASES = cases()

const jsFn = (algoId: string) => {
  const algo = SEARCHES.find((a) => a.id === algoId)!
  const src = shown(algo.code.js)
  return new Function(`${src}\nreturn ${src.match(/function (\w+)/)![1]};`)() as (a: number[], t: number) => number
}

describe.each(SEARCHES.map((a) => [a.name, a] as const))('%s', (_, algo) => {
  const listing = jsFn(algo.id)

  it('finds every present value, rejects every missing one, and matches its JS listing', () => {
    for (const { a, t } of CASES) {
      const run = traceSearch(algo, a, t)
      if (a.includes(t)) expect(a[run.result]).toBe(t)
      else expect(run.result).toBe(-1)
      expect(run.result).toBe(listing([...a], t))
      const last = run.frames[run.frames.length - 1]
      expect(last.status).toBe(run.result >= 0 ? 'found' : 'missing')
    }
  })

  it('only highlights code lines that exist in every listing', () => {
    const used = new Set<string>()
    for (const { a, t } of CASES.slice(0, 400)) for (const f of traceSearch(algo, a, t).frames) if (f.line) used.add(f.line)
    for (const l of [algo.code.py, algo.code.js, algo.code.cpp]) {
      const { labels } = parseListing(l)
      for (const label of used) expect(labels.has(label), `${l.lang} missing @${label}`).toBe(true)
      expect(parseListing(l).lines.join('\n')).not.toMatch(/@\w/)
    }
  })
})

// Python and C++ listings must return exactly what the JS listing returns.
const SAMPLE = CASES.filter((_, i) => i % 7 === 0)
const expected = (id: string) => {
  const f = jsFn(id)
  return SAMPLE.map((c) => f([...c.a], c.t))
}

describe.skipIf(!HAS_PYTHON)('Python listings', () => {
  it('match the JavaScript results', () => {
    const program = SEARCHES.map((a) => {
      const src = shown(a.code.py)
      const entry = src.match(/^def (\w+)/m)![1]
      return `
ns = {}
exec(${JSON.stringify(src)}, ns)
print(${JSON.stringify(a.id)}, [ns[${JSON.stringify(entry)}](c["a"], c["t"]) for c in ${JSON.stringify(SAMPLE)}])`
    }).join('\n')
    const out = runPython(program).trim().split('\n')
    for (const [k, a] of SEARCHES.entries()) {
      expect(out[k].startsWith(a.id + ' ')).toBe(true)
      expect(JSON.parse(out[k].slice(a.id.length + 1))).toEqual(expected(a.id))
    }
  })
})

describe.skipIf(!HAS_CPP)('C++ listings', () => {
  it('compile cleanly and match the JavaScript results', () => {
    const arrays = [...new Set(SAMPLE.map((c) => c.a))]
    const units = SEARCHES.map((a) => {
      const body = cppBody(a.code.cpp)
      const entry = body.match(/^int (\w+)\(const vector<int>& a, int target\)/m)![1]
      return { ns: `s_${a.id}`, body, entry }
    })
    const program = `${CPP_PRELUDE}#include <cmath>
${units.map((u) => `namespace ${u.ns} {\n${u.body}\n}`).join('\n')}
int main() {
  vector<vector<int>> arrays = {${arrays.map((a) => `{${a.join(',')}}`).join(',')}};
  int ai[] = {${SAMPLE.map((c) => arrays.indexOf(c.a)).join(',')}};
  int ts[] = {${SAMPLE.map((c) => c.t).join(',')}};
${units
  .map(
    (u) => `  printf("%s", "${u.ns}");
  for (int k = 0; k < ${SAMPLE.length}; k++) printf(" %d", ${u.ns}::${u.entry}(arrays[ai[k]], ts[k]));
  printf("\\n");`,
  )
  .join('\n')}
}
`
    const out = runCpp(program).trim().split('\n')
    for (const [k, a] of SEARCHES.entries()) {
      const nums = out[k].split(' ').slice(1).map(Number)
      expect(nums).toEqual(expected(a.id))
    }
  }, 120_000)
})

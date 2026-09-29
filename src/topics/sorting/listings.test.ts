import { describe, expect, it } from 'vitest'
import { CPP_PRELUDE, cppBody, HAS_CPP, HAS_PYTHON, runCpp, runPython, shown } from '../../test/runners'
import { makeInput, PRESETS } from './input'
import { ALGORITHMS } from './registry'

// Bucket sort's listing calls a helper it doesn't define (as in most textbooks).
const PY_INSERTION = `
def insertion_sort(b):
    for i in range(1, len(b)):
        k, j = b[i], i - 1
        while j >= 0 and b[j] > k:
            b[j + 1] = b[j]; j -= 1
        b[j + 1] = k
    return b
`
const CPP_INSERTION = `
void insertionSort(vector<int>& b) {
    for (int i = 1; i < (int)b.size(); i++) { int k = b[i], j = i - 1;
        while (j >= 0 && b[j] > k) { b[j + 1] = b[j]; j--; } b[j + 1] = k; }
}
`

const cases = (pow2: boolean) =>
  PRESETS.flatMap((p, pi) => [5, 17, 32, 64].map((n) => makeInput(pow2 ? 32 : n, p.id, n * 13 + pi)))

describe.skipIf(!HAS_PYTHON)('Python listings sort', () => {
  it('every algorithm', () => {
    const blocks = ALGORITHMS.map((a) => {
      const src = shown(a.code.py)
      const entry = src.match(/^def (\w+)/m)![1]
      return `
ns = {}
exec(${JSON.stringify((a.id === 'bucket' ? PY_INSERTION : '') + src)}, ns)
for case in ${JSON.stringify(cases(!!a.pow2))}:
    arr = list(case)
    out = ns[${JSON.stringify(entry)}](arr)
    got = out if out is not None else arr
    print(${JSON.stringify(a.id)}, 'ok' if got == sorted(case) else 'FAIL')`
    }).join('\n')
    const lines = runPython(blocks).trim().split('\n')
    expect(lines.filter((l) => !l.endsWith(' ok'))).toEqual([])
    expect(lines.length).toBe(ALGORITHMS.reduce((s, a) => s + cases(!!a.pow2).length, 0))
  })
})

describe.skipIf(!HAS_CPP)('C++ listings compile cleanly and sort', () => {
  it('every algorithm', () => {
    const ns = (id: string) => `algo_${id.replace(/-/g, '_')}`
    const units = ALGORITHMS.map((a) => {
      const body = cppBody(a.code.cpp)
      const entry = [...body.matchAll(/^void (\w+)\(vector<int>& a(, int lo, int hi)?/gm)].pop()!
      const call = entry[2] ? `${entry[1]}(a, 0, (int)a.size() - 1)` : `${entry[1]}(a)`
      return {
        code: `namespace ${ns(a.id)} {\n${a.id === 'bucket' ? CPP_INSERTION : ''}${body}\n}`,
        test: cases(!!a.pow2)
          .map(
            (c) => `  { vector<int> a = {${c.join(',')}}; vector<int> w = a; sort(w.begin(), w.end());
    { using namespace ${ns(a.id)}; ${call}; }
    printf("%s %s\\n", "${a.id}", a == w ? "ok" : "FAIL"); }`,
          )
          .join('\n'),
      }
    })
    const program = `${CPP_PRELUDE}${units.map((u) => u.code).join('\n')}\nint main() {\n${units.map((u) => u.test).join('\n')}\n}\n`
    const lines = runCpp(program).trim().split('\n')
    expect(lines.filter((l) => !l.endsWith(' ok'))).toEqual([])
    expect(lines.length).toBe(ALGORITHMS.reduce((s, a) => s + cases(!!a.pow2).length, 0))
  }, 120_000)
})

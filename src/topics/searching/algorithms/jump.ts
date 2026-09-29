import { cpp, js, py, type SearchAlgorithm } from '../types'

export const jump: SearchAlgorithm = {
  id: 'jump',
  name: 'Jump search',
  group: 'Scan',
  tagline: 'Leap ahead in blocks of √n, then walk the last block.',
  about: [
    'Split the array into blocks of about √n elements and check only the last element of each block.',
    'As soon as a block ends at a value ≥ the target, the target can only be inside that block.',
    'Walk that one block element by element. About 2√n probes in the worst case.',
  ],
  complexity: { best: 'O(1)', average: 'O(√n)', worst: 'O(√n)', space: 'O(1)' },
  sorted: true,
  run(t) {
    const n = t.n
    const step = Math.max(1, Math.floor(Math.sqrt(n)))
    t.setBlock(step)
    t.show('step', `Block size = √${n} ≈ ${step}`)
    let lo = 0
    while (lo < n) {
      const end = Math.min(lo + step, n) - 1
      t.ptr('lo', lo)
      t.ptr('end', end)
      if (t.probe(end, 'jump', `Block [${lo}..${end}] ends at ${t.a[end]}${t.a[end] < t.target ? ` < ${t.target}, jump ahead` : ` ≥ ${t.target}, it's in here`}`) >= 0) break
      t.kill(lo, end)
      lo += step
    }
    t.unptr('end', 'lo')
    const stop = Math.min(lo + step, n)
    if (lo < n) {
      t.window(lo, stop - 1)
      t.show('scan', `Walk the block [${lo}..${stop - 1}] one by one`)
    }
    for (let i = lo; i < stop; i++) {
      t.ptr('i', i)
      const c = t.probe(i, 'compare')
      if (c === 0) return t.found(i, 'found')
      if (c > 0) {
        t.show('passed', `${t.a[i]} > ${t.target}: walked past where it would be`)
        break
      }
      t.kill(i)
    }
    t.missing('notFound')
  },
  code: {
    py: py(`
import math

def jump_search(a, target):
    n = len(a)
    step = max(1, math.isqrt(n))                          # @step
    lo = 0
    while lo < n and a[min(lo + step, n) - 1] < target:   # @jump
        lo += step
    for i in range(lo, min(lo + step, n)):                # @scan
        if a[i] == target:                                # @compare
            return i                                      # @found
        if a[i] > target:
            break                                         # @passed
    return -1                                             # @notFound`),
    js: js(`
function jumpSearch(a, target) {
  const n = a.length;
  const step = Math.max(1, Math.floor(Math.sqrt(n)));     // @step
  let lo = 0;
  while (lo < n && a[Math.min(lo + step, n) - 1] < target) // @jump
    lo += step;
  for (let i = lo; i < Math.min(lo + step, n); i++) {     // @scan
    if (a[i] === target) return i;                        // @compare @found
    if (a[i] > target) break;                             // @passed
  }
  return -1;                                              // @notFound
}`),
    cpp: cpp(`
int jumpSearch(const vector<int>& a, int target) {
    int n = a.size();
    int step = max(1, (int)sqrt(n));                      // @step
    int lo = 0;
    while (lo < n && a[min(lo + step, n) - 1] < target)   // @jump
        lo += step;
    for (int i = lo; i < min(lo + step, n); i++) {        // @scan
        if (a[i] == target) return i;                     // @compare @found
        if (a[i] > target) break;                         // @passed
    }
    return -1;                                            // @notFound
}`),
  },
}

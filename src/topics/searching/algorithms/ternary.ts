import { SM } from '../tracer'
import { cpp, js, py, type SearchAlgorithm } from '../types'

export const ternary: SearchAlgorithm = {
  id: 'ternary',
  name: 'Ternary search',
  group: 'Halving',
  tagline: 'Two probes split the window into thirds; keep the third that fits.',
  about: [
    'Probe at one third (m1) and two thirds (m2) of the window.',
    'Depending on how the target compares with a[m1] and a[m2], keep only the left, middle or right third.',
    'The window shrinks faster per step than binary search, but each step costs two probes, so it usually does more probes in total. Race them to see.',
  ],
  complexity: { best: 'O(1)', average: 'O(log₃ n)', worst: 'O(log₃ n)', space: 'O(1)' },
  sorted: true,
  run(t) {
    const { a, target } = t
    let lo = 0
    let hi = t.n - 1
    while (lo <= hi) {
      t.window(lo, hi)
      const third = Math.floor((hi - lo) / 3)
      const m1 = lo + third
      const m2 = hi - third
      t.ptr('lo', lo)
      t.ptr('hi', hi)
      t.ptr('m1', m1)
      t.ptr('m2', m2)
      t.show('split', `Thirds of [${lo}..${hi}]: m1 = ${m1}, m2 = ${m2}`)
      if (t.probe(m1, 'compare1') === 0) return t.found(m1, 'found1')
      if (t.probe(m2, 'compare2', undefined, SM.probe2) === 0) return t.found(m2, 'found2')
      if (target < a[m1]) {
        hi = m1 - 1
        t.window(lo, hi)
        t.ptr('hi', hi)
        t.show('left', `${target} < a[m1] = ${a[m1]}: keep the left third`)
      } else if (target > a[m2]) {
        lo = m2 + 1
        t.window(lo, hi)
        t.ptr('lo', lo)
        t.show('right', `${target} > a[m2] = ${a[m2]}: keep the right third`)
      } else {
        lo = m1 + 1
        hi = m2 - 1
        t.window(lo, hi)
        t.ptr('lo', lo)
        t.ptr('hi', hi)
        t.show('middle', `${a[m1]} < ${target} < ${a[m2]}: keep the middle third`)
      }
    }
    t.missing('notFound', 'the window is empty')
  },
  code: {
    py: py(`
def ternary_search(a, target):
    lo, hi = 0, len(a) - 1
    while lo <= hi:
        third = (hi - lo) // 3
        m1, m2 = lo + third, hi - third          # @split
        if a[m1] == target:                      # @compare1
            return m1                            # @found1
        if a[m2] == target:                      # @compare2
            return m2                            # @found2
        if target < a[m1]:
            hi = m1 - 1                          # @left
        elif target > a[m2]:
            lo = m2 + 1                          # @right
        else:
            lo, hi = m1 + 1, m2 - 1              # @middle
    return -1                                    # @notFound`),
    js: js(`
function ternarySearch(a, target) {
  let lo = 0, hi = a.length - 1;
  while (lo <= hi) {
    const third = Math.floor((hi - lo) / 3);
    const m1 = lo + third, m2 = hi - third;      // @split
    if (a[m1] === target) return m1;             // @compare1 @found1
    if (a[m2] === target) return m2;             // @compare2 @found2
    if (target < a[m1]) {
      hi = m1 - 1;                               // @left
    } else if (target > a[m2]) {
      lo = m2 + 1;                               // @right
    } else {
      lo = m1 + 1;                               // @middle
      hi = m2 - 1;
    }
  }
  return -1;                                     // @notFound
}`),
    cpp: cpp(`
int ternarySearch(const vector<int>& a, int target) {
    int lo = 0, hi = (int)a.size() - 1;
    while (lo <= hi) {
        int third = (hi - lo) / 3;
        int m1 = lo + third, m2 = hi - third;    // @split
        if (a[m1] == target) return m1;          // @compare1 @found1
        if (a[m2] == target) return m2;          // @compare2 @found2
        if (target < a[m1]) {
            hi = m1 - 1;                         // @left
        } else if (target > a[m2]) {
            lo = m2 + 1;                         // @right
        } else {
            lo = m1 + 1;                         // @middle
            hi = m2 - 1;
        }
    }
    return -1;                                   // @notFound
}`),
  },
}

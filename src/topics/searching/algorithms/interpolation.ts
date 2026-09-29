import { SM } from '../tracer'
import { cpp, js, py, type SearchAlgorithm } from '../types'

export const interpolation: SearchAlgorithm = {
  id: 'interpolation',
  name: 'Interpolation search',
  group: 'Estimate',
  tagline: 'Guess where it should be from the values, like opening a phone book.',
  about: [
    'Instead of always probing the middle, estimate the position from the values at both ends of the window.',
    'Looking for 90 between 10 and 100? It is probably near the end, so probe there first.',
    'On evenly spread values this takes about log log n probes. On skewed values it can fall back to O(n): try the "Skewed" input.',
  ],
  complexity: { best: 'O(1)', average: 'O(log log n)', worst: 'O(n)', space: 'O(1)' },
  sorted: true,
  run(t) {
    const { a, target } = t
    let lo = 0
    let hi = t.n - 1
    while (lo <= hi) {
      t.window(lo, hi)
      t.ptr('lo', lo)
      t.ptr('hi', hi)
      // The range check reads a[lo], and a[hi] only if the first test passes.
      t.probes += a[lo] <= target ? 2 : 1
      const inside = a[lo] <= target && target <= a[hi]
      t.show('inRange', `Is ${target} between a[lo] = ${a[lo]} and a[hi] = ${a[hi]}? ${inside ? 'Yes' : 'No'}`, [
        [lo, SM.probe],
        [hi, SM.probe2],
      ])
      if (!inside) return t.missing('inRange', `it's outside [${a[lo]}, ${a[hi]}]`)
      if (a[hi] === a[lo]) {
        t.show('flat', `a[lo] = a[hi] = ${a[lo]}: every value in the window is the same`)
        return a[lo] === target ? t.found(lo, 'flat') : t.missing('flat')
      }
      const pos = lo + Math.floor(((target - a[lo]) * (hi - lo)) / (a[hi] - a[lo]))
      t.ptr('pos', pos)
      t.show('estimate', `pos = ${lo} + (${target} − ${a[lo]}) × (${hi} − ${lo}) / (${a[hi]} − ${a[lo]}) = ${pos}`, [[pos, SM.probe2]])
      const c = t.probe(pos, 'compare')
      if (c === 0) return t.found(pos, 'found')
      if (c < 0) {
        lo = pos + 1
        t.window(lo, hi)
        t.ptr('lo', lo)
        t.show('goRight', `${a[pos]} < ${target}: lo = ${lo}`)
      } else {
        hi = pos - 1
        t.window(lo, hi)
        t.ptr('hi', hi)
        t.show('goLeft', `${a[pos]} > ${target}: hi = ${hi}`)
      }
    }
    t.missing('notFound', 'the window is empty')
  },
  code: {
    py: py(`
def interpolation_search(a, target):
    lo, hi = 0, len(a) - 1
    while lo <= hi and a[lo] <= target <= a[hi]:           # @inRange
        if a[hi] == a[lo]:                                  # @flat
            return lo if a[lo] == target else -1
        pos = lo + (target - a[lo]) * (hi - lo) // (a[hi] - a[lo])  # @estimate
        if a[pos] == target:                                # @compare
            return pos                                      # @found
        if a[pos] < target:
            lo = pos + 1                                    # @goRight
        else:
            hi = pos - 1                                    # @goLeft
    return -1                                               # @notFound`),
    js: js(`
function interpolationSearch(a, target) {
  let lo = 0, hi = a.length - 1;
  while (lo <= hi && a[lo] <= target && target <= a[hi]) {  // @inRange
    if (a[hi] === a[lo])                                     // @flat
      return a[lo] === target ? lo : -1;
    const pos = lo + Math.floor(((target - a[lo]) * (hi - lo)) / (a[hi] - a[lo]));  // @estimate
    if (a[pos] === target) {                                 // @compare
      return pos;                                            // @found
    }
    if (a[pos] < target) {
      lo = pos + 1;                                          // @goRight
    } else {
      hi = pos - 1;                                          // @goLeft
    }
  }
  return -1;                                                 // @notFound
}`),
    cpp: cpp(`
int interpolationSearch(const vector<int>& a, int target) {
    int lo = 0, hi = (int)a.size() - 1;
    while (lo <= hi && a[lo] <= target && target <= a[hi]) {  // @inRange
        if (a[hi] == a[lo])                                    // @flat
            return a[lo] == target ? lo : -1;
        int pos = lo + (long long)(target - a[lo]) * (hi - lo) / (a[hi] - a[lo]);  // @estimate
        if (a[pos] == target) {                                // @compare
            return pos;                                        // @found
        }
        if (a[pos] < target) {
            lo = pos + 1;                                      // @goRight
        } else {
            hi = pos - 1;                                      // @goLeft
        }
    }
    return -1;                                                 // @notFound
}`),
  },
}

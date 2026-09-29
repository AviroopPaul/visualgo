import type { SearchTracer } from '../tracer'
import { cpp, js, py, type SearchAlgorithm } from '../types'

/**
 * Binary search over a[lo..hi] with pointer + window animation. Shared with
 * exponential search, whose listing uses the same labels for this loop.
 */
export function binaryWindow(t: SearchTracer, lo: number, hi: number) {
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    t.window(lo, hi)
    t.ptr('lo', lo)
    t.ptr('hi', hi)
    t.ptr('mid', mid)
    t.show('mid', `mid = (${lo} + ${hi}) / 2 = ${mid}`)
    const c = t.probe(mid, 'compare')
    if (c === 0) return t.found(mid, 'found')
    if (c < 0) {
      lo = mid + 1
      t.window(lo, hi)
      t.ptr('lo', lo)
      t.show('goRight', `${t.a[mid]} < ${t.target}, so drop the left half: lo = ${lo}`)
    } else {
      hi = mid - 1
      t.window(lo, hi)
      t.ptr('hi', hi)
      t.show('goLeft', `${t.a[mid]} > ${t.target}, so drop the right half: hi = ${hi}`)
    }
  }
  t.missing('notFound', 'the window is empty')
}

export const binary: SearchAlgorithm = {
  id: 'binary',
  name: 'Binary search',
  group: 'Halving',
  tagline: 'Look in the middle, throw away the half that cannot hold it.',
  about: [
    'Keep a window [lo, hi] that must contain the target if it exists. Start with the whole array.',
    'Check the middle element. If it is too small, the target is to its right; if too big, to its left.',
    'Each probe halves the window, so even a million elements take only about 20 probes.',
  ],
  complexity: { best: 'O(1)', average: 'O(log n)', worst: 'O(log n)', space: 'O(1)' },
  sorted: true,
  run(t) {
    t.show('init', `Start with the whole array: lo = 0, hi = ${t.n - 1}`)
    binaryWindow(t, 0, t.n - 1)
  },
  code: {
    py: py(`
def binary_search(a, target):
    lo, hi = 0, len(a) - 1                 # @init
    while lo <= hi:
        mid = (lo + hi) // 2               # @mid
        if a[mid] == target:               # @compare
            return mid                     # @found
        if a[mid] < target:
            lo = mid + 1                   # @goRight
        else:
            hi = mid - 1                   # @goLeft
    return -1                              # @notFound`),
    js: js(`
function binarySearch(a, target) {
  let lo = 0, hi = a.length - 1;           // @init
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;            // @mid
    if (a[mid] === target) {               // @compare
      return mid;                          // @found
    }
    if (a[mid] < target) {
      lo = mid + 1;                        // @goRight
    } else {
      hi = mid - 1;                        // @goLeft
    }
  }
  return -1;                               // @notFound
}`),
    cpp: cpp(`
int binarySearch(const vector<int>& a, int target) {
    int lo = 0, hi = (int)a.size() - 1;    // @init
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;      // @mid
        if (a[mid] == target) {            // @compare
            return mid;                    // @found
        }
        if (a[mid] < target) {
            lo = mid + 1;                  // @goRight
        } else {
            hi = mid - 1;                  // @goLeft
        }
    }
    return -1;                             // @notFound
}`),
  },
}

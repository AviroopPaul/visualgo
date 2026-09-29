import { cpp, js, py, type SearchAlgorithm } from '../types'
import { binaryWindow } from './binary'

export const exponential: SearchAlgorithm = {
  id: 'exponential',
  name: 'Exponential search',
  group: 'Halving',
  tagline: 'Double the reach until you overshoot, then binary search.',
  about: [
    'Probe index 1, 2, 4, 8, 16… until the value there is at least the target.',
    'The target is now trapped between the last two probes, so run binary search on just that range.',
    'Costs O(log i) where i is the target position, which is great when the target is near the start, or when the array has no known end.',
  ],
  complexity: { best: 'O(1)', average: 'O(log i)', worst: 'O(log n)', space: 'O(1)' },
  sorted: true,
  run(t) {
    const n = t.n
    t.ptr('i', 0)
    if (t.probe(0, 'first') === 0) return t.found(0, 'first')
    t.kill(0)
    let bound = 1
    while (bound < n) {
      t.ptr('bound', bound)
      const c = t.probe(bound, 'double', `a[${bound}] = ${t.a[bound]}${t.a[bound] < t.target ? ` < ${t.target}, double the bound` : ` ≥ ${t.target}, stop`}`)
      if (c >= 0) break
      t.kill(0, bound)
      bound *= 2
    }
    if (bound >= n) t.ptr('bound', n - 1)
    t.unptr('i')
    const lo = bound >> 1
    const hi = Math.min(bound, n - 1)
    t.window(lo, hi)
    t.show('range', `The target must be in [${lo}..${hi}]: binary search there`)
    t.unptr('bound')
    binaryWindow(t, lo, hi)
  },
  code: {
    py: py(`
def exponential_search(a, target):
    n = len(a)
    if a[0] == target: return 0                    # @first
    bound = 1
    while bound < n and a[bound] < target:         # @double
        bound *= 2
    lo, hi = bound // 2, min(bound, n - 1)         # @range
    while lo <= hi:
        mid = (lo + hi) // 2                       # @mid
        if a[mid] == target:                       # @compare
            return mid                             # @found
        if a[mid] < target:
            lo = mid + 1                           # @goRight
        else:
            hi = mid - 1                           # @goLeft
    return -1                                      # @notFound`),
    js: js(`
function exponentialSearch(a, target) {
  const n = a.length;
  if (a[0] === target) return 0;                   // @first
  let bound = 1;
  while (bound < n && a[bound] < target)           // @double
    bound *= 2;
  let lo = bound >> 1, hi = Math.min(bound, n - 1); // @range
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;                    // @mid
    if (a[mid] === target) {                       // @compare
      return mid;                                  // @found
    }
    if (a[mid] < target) {
      lo = mid + 1;                                // @goRight
    } else {
      hi = mid - 1;                                // @goLeft
    }
  }
  return -1;                                       // @notFound
}`),
    cpp: cpp(`
int exponentialSearch(const vector<int>& a, int target) {
    int n = a.size();
    if (a[0] == target) return 0;                  // @first
    int bound = 1;
    while (bound < n && a[bound] < target)         // @double
        bound *= 2;
    int lo = bound / 2, hi = min(bound, n - 1);    // @range
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;              // @mid
        if (a[mid] == target) {                    // @compare
            return mid;                            // @found
        }
        if (a[mid] < target) {
            lo = mid + 1;                          // @goRight
        } else {
            hi = mid - 1;                          // @goLeft
        }
    }
    return -1;                                     // @notFound
}`),
  },
}

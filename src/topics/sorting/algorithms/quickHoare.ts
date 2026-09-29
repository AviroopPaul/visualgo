import { M, type Tracer } from '../tracer'
import { cpp, js, py, type SortAlgorithm } from '../types'

function sort(t: Tracer, lo: number, hi: number) {
  if (lo >= hi) {
    if (lo === hi) {
      t.markSorted(lo)
      t.range(lo, hi)
      t.show('base', `${t.val(lo)} is alone, so it is in place`)
    }
    return
  }
  t.range(lo, hi)
  const pivot = t.id((lo + hi) >> 1)
  t.tag(pivot, M.pivot)
  t.show('pivot', `Pivot = ${t.v(pivot)} (middle element)`)
  let i = lo - 1
  let j = hi + 1
  while (true) {
    do {
      i++
      t.ptr('i', i)
    } while (t.cmpIds(t.id(i), pivot, 'scanLeft') < 0)
    do {
      j--
      t.ptr('j', j)
    } while (t.cmpIds(t.id(j), pivot, 'scanRight') > 0)
    if (i >= j) {
      t.show('cross', `i and j met, so split at ${j}`)
      break
    }
    t.swap(i, j, 'swap')
  }
  t.untag(pivot)
  t.unptr('i', 'j')
  sort(t, lo, j)
  sort(t, j + 1, hi)
}

export const quickHoare: SortAlgorithm = {
  id: 'quick-hoare',
  name: 'Quick sort (Hoare)',
  family: 'Divide & conquer',
  tagline: 'Two pointers race inward and swap what is on the wrong side.',
  about: [
    "Hoare's original scheme: i walks right past small values, j walks left past big values, then they swap.",
    'When the pointers cross, the range is split. It does about three times fewer swaps than the Lomuto version.',
    'Using the middle element as pivot avoids the worst case on already sorted input.',
  ],
  complexity: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n²)', space: 'O(log n)' },
  stable: false,
  inPlace: true,
  run(t) {
    sort(t, 0, t.n - 1)
  },
  code: {
    js: js(`
function quickSort(a, lo = 0, hi = a.length - 1) {
  if (lo >= hi) return a;                      // @base
  const pivot = a[(lo + hi) >> 1];             // @pivot
  let i = lo - 1, j = hi + 1;
  while (true) {
    do i++; while (a[i] < pivot);              // @scanLeft
    do j--; while (a[j] > pivot);              // @scanRight
    if (i >= j) break;                         // @cross
    [a[i], a[j]] = [a[j], a[i]];               // @swap
  }
  quickSort(a, lo, j);
  quickSort(a, j + 1, hi);
  return a;
}`),
    py: py(`
def quick_sort(a, lo=0, hi=None):
    if hi is None: hi = len(a) - 1
    if lo >= hi: return a                        # @base
    pivot = a[(lo + hi) // 2]                    # @pivot
    i, j = lo - 1, hi + 1
    while True:
        i += 1
        while a[i] < pivot: i += 1               # @scanLeft
        j -= 1
        while a[j] > pivot: j -= 1               # @scanRight
        if i >= j: break                         # @cross
        a[i], a[j] = a[j], a[i]                  # @swap
    quick_sort(a, lo, j)
    quick_sort(a, j + 1, hi)
    return a`),
    cpp: cpp(`
void quickSort(vector<int>& a, int lo, int hi) {
    if (lo >= hi) return;                            // @base
    int pivot = a[(lo + hi) / 2];                    // @pivot
    int i = lo - 1, j = hi + 1;
    while (true) {
        do i++; while (a[i] < pivot);                // @scanLeft
        do j--; while (a[j] > pivot);                // @scanRight
        if (i >= j) break;                           // @cross
        swap(a[i], a[j]);                            // @swap
    }
    quickSort(a, lo, j);
    quickSort(a, j + 1, hi);
}
// call: quickSort(a, 0, a.size() - 1);`),
  },
}

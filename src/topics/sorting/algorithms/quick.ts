import { M, type Tracer } from '../tracer'
import { cpp, js, py, type SortAlgorithm } from '../types'

function partition(t: Tracer, lo: number, hi: number) {
  t.range(lo, hi)
  const pivot = t.id(hi)
  t.tag(pivot, M.pivot)
  t.show('pivot', `Pivot = ${t.v(pivot)} (last element)`)
  let i = lo
  t.ptr('i', i)
  for (let j = lo; j < hi; j++) {
    t.ptr('j', j)
    if (t.cmpIds(t.id(j), pivot, 'compare') < 0) {
      if (i !== j) t.swap(i, j, 'swap', `${t.val(j)} < pivot, swap it into the left side`)
      else t.show('swap', `${t.val(j)} < pivot, already on the left side`)
      i++
      t.ptr('i', i)
    }
  }
  t.unptr('j')
  t.swap(i, hi, 'place', `Drop the pivot into slot ${i}`)
  t.untag(pivot)
  t.markSorted(i)
  t.unptr('i')
  return i
}

function sort(t: Tracer, lo: number, hi: number) {
  if (lo >= hi) {
    if (lo === hi) {
      t.markSorted(lo)
      t.range(lo, hi)
      t.show('base', `${t.val(lo)} is alone, so it is in place`)
    }
    return
  }
  const p = partition(t, lo, hi)
  sort(t, lo, p - 1)
  sort(t, p + 1, hi)
}

export const quick: SortAlgorithm = {
  id: 'quick',
  name: 'Quick sort',
  family: 'Divide & conquer',
  tagline: 'Pick a pivot, smaller left, bigger right, recurse.',
  about: [
    'Choose a pivot (here the last element), then walk the range moving anything smaller to the left side.',
    'Putting the pivot right after that left side lands it in its final slot.',
    'Recurse on both sides. Fast in practice; a bad pivot on already-sorted input degrades it to O(n²).',
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
  const p = partition(a, lo, hi);
  quickSort(a, lo, p - 1);
  quickSort(a, p + 1, hi);
  return a;
}

function partition(a, lo, hi) {
  const pivot = a[hi];                         // @pivot
  let i = lo;
  for (let j = lo; j < hi; j++) {
    if (a[j] < pivot) {                        // @compare
      [a[i], a[j]] = [a[j], a[i]];             // @swap
      i++;
    }
  }
  [a[i], a[hi]] = [a[hi], a[i]];               // @place
  return i;
}`),
    py: py(`
def quick_sort(a, lo=0, hi=None):
    if hi is None: hi = len(a) - 1
    if lo >= hi: return a                        # @base
    p = partition(a, lo, hi)
    quick_sort(a, lo, p - 1)
    quick_sort(a, p + 1, hi)
    return a

def partition(a, lo, hi):
    pivot, i = a[hi], lo                         # @pivot
    for j in range(lo, hi):
        if a[j] < pivot:                         # @compare
            a[i], a[j] = a[j], a[i]              # @swap
            i += 1
    a[i], a[hi] = a[hi], a[i]                    # @place
    return i`),
    cpp: cpp(`
int partition(vector<int>& a, int lo, int hi) {
    int pivot = a[hi];                               // @pivot
    int i = lo;
    for (int j = lo; j < hi; j++) {
        if (a[j] < pivot) {                          // @compare
            swap(a[i], a[j]);                        // @swap
            i++;
        }
    }
    swap(a[i], a[hi]);                               // @place
    return i;
}

void quickSort(vector<int>& a, int lo, int hi) {
    if (lo >= hi) return;                            // @base
    int p = partition(a, lo, hi);
    quickSort(a, lo, p - 1);
    quickSort(a, p + 1, hi);
}
// call: quickSort(a, 0, a.size() - 1);`),
  },
}

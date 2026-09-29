import type { Tracer } from '../tracer'
import { cpp, js, py, type SortAlgorithm } from '../types'
import { mergeRange } from './shared'

function sort(t: Tracer, lo: number, hi: number) {
  if (lo >= hi) return
  const mid = (lo + hi) >> 1
  t.range(lo, hi)
  t.show('split', `Split [${lo}..${hi}] into [${lo}..${mid}] and [${mid + 1}..${hi}]`)
  sort(t, lo, mid)
  sort(t, mid + 1, hi)
  mergeRange(t, lo, mid, hi)
}

export const merge: SortAlgorithm = {
  id: 'merge',
  name: 'Merge sort',
  family: 'Divide & conquer',
  tagline: 'Split in half, sort each half, zip them back together.',
  about: [
    'Keep splitting until each piece has one element, which is trivially sorted.',
    'Merging two sorted halves only needs to compare their front elements, taking the smaller each time.',
    'Always O(n log n), and stable, at the cost of an extra buffer (the scratch row below).',
  ],
  complexity: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n log n)', space: 'O(n)' },
  stable: true,
  inPlace: false,
  run(t) {
    sort(t, 0, t.n - 1)
  },
  code: {
    js: js(`
function mergeSort(a, lo = 0, hi = a.length - 1) {
  if (lo >= hi) return a;
  const mid = (lo + hi) >> 1;                  // @split
  mergeSort(a, lo, mid);
  mergeSort(a, mid + 1, hi);
  merge(a, lo, mid, hi);
  return a;
}

function merge(a, lo, mid, hi) {
  const tmp = a.slice(lo, hi + 1);             // @copy
  let i = 0, j = mid - lo + 1, k = lo;
  while (i <= mid - lo && j <= hi - lo) {
    if (tmp[i] <= tmp[j]) {                    // @mcompare
      a[k++] = tmp[i++];                       // @takeLeft
    } else {
      a[k++] = tmp[j++];                       // @takeRight
    }
  }
  while (i <= mid - lo) a[k++] = tmp[i++];     // @restLeft
  while (j <= hi - lo) a[k++] = tmp[j++];      // @restRight
}`),
    py: py(`
def merge_sort(a, lo=0, hi=None):
    if hi is None: hi = len(a) - 1
    if lo >= hi: return a
    mid = (lo + hi) // 2                         # @split
    merge_sort(a, lo, mid)
    merge_sort(a, mid + 1, hi)
    merge(a, lo, mid, hi)
    return a

def merge(a, lo, mid, hi):
    left, right = a[lo:mid + 1], a[mid + 1:hi + 1]   # @copy
    i = j = 0
    k = lo
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:                  # @mcompare
            a[k] = left[i]; i += 1               # @takeLeft
        else:
            a[k] = right[j]; j += 1              # @takeRight
        k += 1
    for x in left[i:]: a[k] = x; k += 1          # @restLeft
    for x in right[j:]: a[k] = x; k += 1         # @restRight`),
    cpp: cpp(`
void merge(vector<int>& a, int lo, int mid, int hi) {
    vector<int> tmp(a.begin() + lo, a.begin() + hi + 1);  // @copy
    int i = 0, j = mid - lo + 1, k = lo;
    while (i <= mid - lo && j <= hi - lo) {
        if (tmp[i] <= tmp[j]) {                      // @mcompare
            a[k++] = tmp[i++];                       // @takeLeft
        } else {
            a[k++] = tmp[j++];                       // @takeRight
        }
    }
    while (i <= mid - lo) a[k++] = tmp[i++];         // @restLeft
    while (j <= hi - lo) a[k++] = tmp[j++];          // @restRight
}

void mergeSort(vector<int>& a, int lo, int hi) {
    if (lo >= hi) return;
    int mid = (lo + hi) / 2;                         // @split
    mergeSort(a, lo, mid);
    mergeSort(a, mid + 1, hi);
    merge(a, lo, mid, hi);
}
// call: mergeSort(a, 0, a.size() - 1);`),
  },
}

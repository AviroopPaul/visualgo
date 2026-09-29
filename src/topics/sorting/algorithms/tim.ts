import { cpp, js, py, type SortAlgorithm } from '../types'
import { insertionRange, mergeRange } from './shared'

const RUN = 8

export const tim: SortAlgorithm = {
  id: 'tim',
  name: 'Tim sort',
  family: 'Hybrid & networks',
  tagline: 'Insertion-sort small runs, then merge runs pairwise.',
  about: [
    "The idea behind Python's and Java's built-in sorts: insertion sort is fastest on tiny pieces, merge sort scales.",
    'Cut the array into runs of 8, insertion-sort each run, then merge neighbouring runs, doubling the size each round.',
    'Simplified here: real TimSort also detects existing runs and "gallops" through lopsided merges.',
  ],
  complexity: { best: 'O(n)', average: 'O(n log n)', worst: 'O(n log n)', space: 'O(n)' },
  stable: true,
  inPlace: false,
  run(t) {
    const n = t.n
    for (let lo = 0; lo < n; lo += RUN) {
      const hi = Math.min(lo + RUN - 1, n - 1)
      t.range(lo, hi)
      t.show('runs', `Insertion-sort the run [${lo}..${hi}]`)
      insertionRange(t, lo, hi)
    }
    for (let size = RUN; size < n; size *= 2) {
      t.clearRange()
      t.show('size', `Merge neighbouring runs of ${size}`)
      for (let lo = 0; lo < n - size; lo += 2 * size) {
        const mid = lo + size - 1
        const hi = Math.min(lo + 2 * size - 1, n - 1)
        t.range(lo, hi)
        t.show('merge', `Merge [${lo}..${mid}] with [${mid + 1}..${hi}]`)
        mergeRange(t, lo, mid, hi)
      }
    }
  },
  code: {
    js: js(`
const RUN = 8;

function timSort(a) {
  const n = a.length;
  for (let lo = 0; lo < n; lo += RUN)              // @runs
    insertionSort(a, lo, Math.min(lo + RUN - 1, n - 1));
  for (let size = RUN; size < n; size *= 2)        // @size
    for (let lo = 0; lo < n - size; lo += 2 * size) {
      const mid = lo + size - 1;
      const hi = Math.min(lo + 2 * size - 1, n - 1);
      merge(a, lo, mid, hi);                       // @merge
    }
  return a;
}

function insertionSort(a, lo, hi) {
  for (let i = lo + 1; i <= hi; i++) {
    const key = a[i];                              // @lift
    let j = i - 1;
    while (j >= lo && a[j] > key) {                // @icompare
      a[j + 1] = a[j];                             // @shift
      j--;
    }
    a[j + 1] = key;                                // @drop
  }
}

function merge(a, lo, mid, hi) {
  const tmp = a.slice(lo, hi + 1);                 // @copy
  let i = 0, j = mid - lo + 1, k = lo;
  while (i <= mid - lo && j <= hi - lo) {
    if (tmp[i] <= tmp[j]) a[k++] = tmp[i++];       // @mcompare @takeLeft
    else a[k++] = tmp[j++];                        // @takeRight
  }
  while (i <= mid - lo) a[k++] = tmp[i++];         // @restLeft
  while (j <= hi - lo) a[k++] = tmp[j++];          // @restRight
}`),
    py: py(`
RUN = 8

def tim_sort(a):
    n = len(a)
    for lo in range(0, n, RUN):                        # @runs
        insertion_sort(a, lo, min(lo + RUN - 1, n - 1))
    size = RUN
    while size < n:                                    # @size
        for lo in range(0, n - size, 2 * size):
            mid = lo + size - 1
            hi = min(lo + 2 * size - 1, n - 1)
            merge(a, lo, mid, hi)                      # @merge
        size *= 2
    return a

def insertion_sort(a, lo, hi):
    for i in range(lo + 1, hi + 1):
        key, j = a[i], i - 1                           # @lift
        while j >= lo and a[j] > key:                  # @icompare
            a[j + 1] = a[j]                            # @shift
            j -= 1
        a[j + 1] = key                                 # @drop

def merge(a, lo, mid, hi):
    left, right = a[lo:mid + 1], a[mid + 1:hi + 1]     # @copy
    i = j = 0
    for k in range(lo, hi + 1):
        if j >= len(right) or (i < len(left) and left[i] <= right[j]):  # @mcompare @restLeft
            a[k] = left[i]; i += 1                     # @takeLeft
        else:
            a[k] = right[j]; j += 1                    # @takeRight @restRight`),
    cpp: cpp(`
const int RUN = 8;

void insertionSort(vector<int>& a, int lo, int hi) {
    for (int i = lo + 1; i <= hi; i++) {
        int key = a[i];                              // @lift
        int j = i - 1;
        while (j >= lo && a[j] > key) {              // @icompare
            a[j + 1] = a[j];                         // @shift
            j--;
        }
        a[j + 1] = key;                              // @drop
    }
}

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

void timSort(vector<int>& a) {
    int n = a.size();
    for (int lo = 0; lo < n; lo += RUN)              // @runs
        insertionSort(a, lo, min(lo + RUN - 1, n - 1));
    for (int size = RUN; size < n; size *= 2)        // @size
        for (int lo = 0; lo < n - size; lo += 2 * size) {
            int mid = lo + size - 1;
            int hi = min(lo + 2 * size - 1, n - 1);
            merge(a, lo, mid, hi);                   // @merge
        }
}`),
  },
}

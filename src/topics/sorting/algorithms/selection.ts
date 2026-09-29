import { M } from '../tracer'
import { cpp, js, py, type SortAlgorithm } from '../types'

export const selection: SortAlgorithm = {
  id: 'selection',
  name: 'Selection sort',
  family: 'Selection',
  tagline: 'Find the smallest, put it first, repeat.',
  about: [
    'Scan the unsorted part for its minimum and swap it to the front of that part.',
    'It always does about n²/2 comparisons, but never more than n − 1 swaps, which helps when writes are expensive.',
  ],
  complexity: { best: 'O(n²)', average: 'O(n²)', worst: 'O(n²)', space: 'O(1)' },
  stable: false,
  inPlace: true,
  run(t) {
    const n = t.n
    for (let i = 0; i < n - 1; i++) {
      t.range(i, n - 1)
      let min = i
      t.tag(t.id(min), M.focus)
      t.show('start', `Assume ${t.val(i)} is the smallest so far`)
      for (let j = i + 1; j < n; j++) {
        t.ptr('j', j)
        if (t.compare(j, min, 'compare') < 0) {
          t.untag(t.id(min))
          min = j
          t.tag(t.id(min), M.focus)
          t.show('newMin', `New minimum: ${t.val(min)}`)
        }
      }
      t.unptr('j')
      t.untag(t.id(min))
      if (min !== i) t.swap(i, min, 'swap', `Swap the minimum ${t.val(min)} into slot ${i}`)
      else t.show('swap', `${t.val(i)} is already in place`)
      t.markSorted(i)
    }
  },
  code: {
    js: js(`
function selectionSort(a) {
  const n = a.length;
  for (let i = 0; i < n - 1; i++) {
    let min = i;                           // @start
    for (let j = i + 1; j < n; j++) {
      if (a[j] < a[min]) {                 // @compare
        min = j;                           // @newMin
      }
    }
    [a[i], a[min]] = [a[min], a[i]];       // @swap
  }
  return a;
}`),
    py: py(`
def selection_sort(a):
    n = len(a)
    for i in range(n - 1):
        lo = i                               # @start
        for j in range(i + 1, n):
            if a[j] < a[lo]:                 # @compare
                lo = j                       # @newMin
        a[i], a[lo] = a[lo], a[i]            # @swap
    return a`),
    cpp: cpp(`
void selectionSort(vector<int>& a) {
    int n = a.size();
    for (int i = 0; i < n - 1; i++) {
        int mn = i;                                  // @start
        for (int j = i + 1; j < n; j++) {
            if (a[j] < a[mn]) {                      // @compare
                mn = j;                              // @newMin
            }
        }
        swap(a[i], a[mn]);                           // @swap
    }
}`),
  },
}

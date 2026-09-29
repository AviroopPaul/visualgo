import { cpp, js, py, type SortAlgorithm } from '../types'
import { insertionRange } from './shared'

export const shell: SortAlgorithm = {
  id: 'shell',
  name: 'Shell sort',
  family: 'Insertion',
  tagline: 'Insertion sort over long jumps first, then shorter ones.',
  about: [
    'Run insertion sort on elements that are gap apart, then halve the gap and repeat until it is 1.',
    'Early passes move values across the array in a few big hops, so the final gap-1 pass has little left to do.',
  ],
  complexity: { best: 'O(n log n)', average: 'O(n^1.25)', worst: 'O(n²)', space: 'O(1)' },
  stable: false,
  inPlace: true,
  run(t) {
    for (let gap = t.n >> 1; gap > 0; gap >>= 1) {
      t.show('gap', `Gap = ${gap}: insertion sort every ${gap === 1 ? 'element' : `${gap}th element`}`)
      insertionRange(t, 0, t.n - 1, gap)
    }
  },
  code: {
    js: js(`
function shellSort(a) {
  for (let gap = a.length >> 1; gap > 0; gap >>= 1) {  // @gap
    for (let i = gap; i < a.length; i++) {
      const key = a[i];                                 // @lift
      let j = i;
      while (j >= gap && a[j - gap] > key) {            // @icompare
        a[j] = a[j - gap];                              // @shift
        j -= gap;
      }
      a[j] = key;                                       // @drop
    }
  }
  return a;
}`),
    py: py(`
def shell_sort(a):
    gap = len(a) // 2
    while gap > 0:                                   # @gap
        for i in range(gap, len(a)):
            key, j = a[i], i                         # @lift
            while j >= gap and a[j - gap] > key:     # @icompare
                a[j] = a[j - gap]                    # @shift
                j -= gap
            a[j] = key                               # @drop
        gap //= 2
    return a`),
    cpp: cpp(`
void shellSort(vector<int>& a) {
    int n = a.size();
    for (int gap = n / 2; gap > 0; gap /= 2) {       // @gap
        for (int i = gap; i < n; i++) {
            int key = a[i];                          // @lift
            int j = i;
            while (j >= gap && a[j - gap] > key) {   // @icompare
                a[j] = a[j - gap];                   // @shift
                j -= gap;
            }
            a[j] = key;                              // @drop
        }
    }
}`),
  },
}

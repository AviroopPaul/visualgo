import { cpp, js, py, type SortAlgorithm } from '../types'
import { insertionRange } from './shared'

export const insertion: SortAlgorithm = {
  id: 'insertion',
  name: 'Insertion sort',
  family: 'Insertion',
  tagline: 'Slide each new card into place, like sorting a hand of cards.',
  about: [
    'Everything left of the current element is already sorted among itself.',
    'Pick up the next element, shift larger ones one slot right, and drop it into the gap.',
    'Very fast on small or nearly sorted input, which is why real-world sorts use it for short runs.',
  ],
  complexity: { best: 'O(n)', average: 'O(n²)', worst: 'O(n²)', space: 'O(1)' },
  stable: true,
  inPlace: true,
  run(t) {
    insertionRange(t, 0, t.n - 1)
  },
  code: {
    js: js(`
function insertionSort(a) {
  for (let i = 1; i < a.length; i++) {
    const key = a[i];                      // @lift
    let j = i - 1;
    while (j >= 0 && a[j] > key) {         // @icompare
      a[j + 1] = a[j];                     // @shift
      j--;
    }
    a[j + 1] = key;                        // @drop
  }
  return a;
}`),
    py: py(`
def insertion_sort(a):
    for i in range(1, len(a)):
        key = a[i]                           # @lift
        j = i - 1
        while j >= 0 and a[j] > key:         # @icompare
            a[j + 1] = a[j]                  # @shift
            j -= 1
        a[j + 1] = key                       # @drop
    return a`),
    cpp: cpp(`
void insertionSort(vector<int>& a) {
    for (int i = 1; i < (int)a.size(); i++) {
        int key = a[i];                              // @lift
        int j = i - 1;
        while (j >= 0 && a[j] > key) {               // @icompare
            a[j + 1] = a[j];                         // @shift
            j--;
        }
        a[j + 1] = key;                              // @drop
    }
}`),
  },
}

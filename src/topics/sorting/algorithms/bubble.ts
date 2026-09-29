import { cpp, js, py, type SortAlgorithm } from '../types'

export const bubble: SortAlgorithm = {
  id: 'bubble',
  name: 'Bubble sort',
  family: 'Exchange',
  tagline: 'Swap neighbours until the biggest value floats to the end.',
  about: [
    'Walk the array comparing each pair of neighbours and swap them when they are out of order.',
    'After one pass the largest value has bubbled to the end, so each pass can stop one slot earlier.',
    'If a whole pass makes no swaps, the array is already sorted and we stop early.',
  ],
  complexity: { best: 'O(n)', average: 'O(n²)', worst: 'O(n²)', space: 'O(1)' },
  stable: true,
  inPlace: true,
  run(t) {
    const n = t.n
    for (let i = 0; i < n - 1; i++) {
      let swapped = false
      t.range(0, n - 1 - i)
      t.show('outer', `Pass ${i + 1}: carry the largest remaining value to slot ${n - 1 - i}`)
      for (let j = 0; j < n - 1 - i; j++) {
        t.ptr('j', j)
        if (t.compare(j, j + 1, 'compare') > 0) {
          t.swap(j, j + 1, 'swap')
          swapped = true
        }
      }
      t.unptr('j')
      t.markSorted(n - 1 - i)
      t.show('sorted', `${t.val(n - 1 - i)} is locked in place`)
      if (!swapped) {
        t.show('early', 'No swaps this pass, so everything is already in order')
        break
      }
    }
  },
  code: {
    js: js(`
function bubbleSort(a) {
  const n = a.length;
  for (let i = 0; i < n - 1; i++) {            // @outer
    let swapped = false;
    for (let j = 0; j < n - 1 - i; j++) {
      if (a[j] > a[j + 1]) {                   // @compare
        [a[j], a[j + 1]] = [a[j + 1], a[j]];   // @swap
        swapped = true;
      }
    }
    // a[n - 1 - i] is now in its final place  // @sorted
    if (!swapped) break;                       // @early
  }
  return a;
}`),
    py: py(`
def bubble_sort(a):
    n = len(a)
    for i in range(n - 1):                       # @outer
        swapped = False
        for j in range(n - 1 - i):
            if a[j] > a[j + 1]:                  # @compare
                a[j], a[j + 1] = a[j + 1], a[j]  # @swap
                swapped = True
        # a[n - 1 - i] is now in its final place # @sorted
        if not swapped:                          # @early
            break
    return a`),
    cpp: cpp(`
void bubbleSort(vector<int>& a) {
    int n = a.size();
    for (int i = 0; i < n - 1; i++) {                // @outer
        bool swapped = false;
        for (int j = 0; j < n - 1 - i; j++) {
            if (a[j] > a[j + 1]) {                   // @compare
                swap(a[j], a[j + 1]);                // @swap
                swapped = true;
            }
        }
        // a[n - 1 - i] is now in its final place    // @sorted
        if (!swapped) break;                         // @early
    }
}`),
  },
}

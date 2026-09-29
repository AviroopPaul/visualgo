import { cpp, js, py, type SortAlgorithm } from '../types'

export const oddEven: SortAlgorithm = {
  id: 'odd-even',
  name: 'Odd–even sort',
  family: 'Exchange',
  tagline: 'Alternate between odd and even neighbour pairs.',
  about: [
    'Also called brick sort. One phase compares pairs (1,2), (3,4)…; the next compares (0,1), (2,3)…',
    'Pairs in a phase never overlap, so on parallel hardware every comparison in a phase can happen at once.',
  ],
  complexity: { best: 'O(n)', average: 'O(n²)', worst: 'O(n²)', space: 'O(1)' },
  stable: true,
  inPlace: true,
  run(t) {
    const n = t.n
    let sorted = false
    while (!sorted) {
      sorted = true
      t.show('odd', 'Odd phase: pairs starting at 1, 3, 5…')
      for (let j = 1; j < n - 1; j += 2) {
        t.ptr('j', j)
        if (t.compare(j, j + 1, 'compareOdd') > 0) {
          t.swap(j, j + 1, 'swapOdd')
          sorted = false
        }
      }
      t.show('even', 'Even phase: pairs starting at 0, 2, 4…')
      for (let j = 0; j < n - 1; j += 2) {
        t.ptr('j', j)
        if (t.compare(j, j + 1, 'compareEven') > 0) {
          t.swap(j, j + 1, 'swapEven')
          sorted = false
        }
      }
      t.unptr('j')
    }
  },
  code: {
    js: js(`
function oddEvenSort(a) {
  let sorted = false;
  while (!sorted) {
    sorted = true;
    for (let j = 1; j < a.length - 1; j += 2) {  // @odd
      if (a[j] > a[j + 1]) {                     // @compareOdd
        [a[j], a[j + 1]] = [a[j + 1], a[j]];     // @swapOdd
        sorted = false;
      }
    }
    for (let j = 0; j < a.length - 1; j += 2) {  // @even
      if (a[j] > a[j + 1]) {                     // @compareEven
        [a[j], a[j + 1]] = [a[j + 1], a[j]];     // @swapEven
        sorted = false;
      }
    }
  }
  return a;
}`),
    py: py(`
def odd_even_sort(a):
    done = False
    while not done:
        done = True
        for j in range(1, len(a) - 1, 2):        # @odd
            if a[j] > a[j + 1]:                  # @compareOdd
                a[j], a[j + 1] = a[j + 1], a[j]  # @swapOdd
                done = False
        for j in range(0, len(a) - 1, 2):        # @even
            if a[j] > a[j + 1]:                  # @compareEven
                a[j], a[j + 1] = a[j + 1], a[j]  # @swapEven
                done = False
    return a`),
    cpp: cpp(`
void oddEvenSort(vector<int>& a) {
    int n = a.size();
    bool sorted = false;
    while (!sorted) {
        sorted = true;
        for (int j = 1; j < n - 1; j += 2) {         // @odd
            if (a[j] > a[j + 1]) {                   // @compareOdd
                swap(a[j], a[j + 1]);                // @swapOdd
                sorted = false;
            }
        }
        for (int j = 0; j < n - 1; j += 2) {         // @even
            if (a[j] > a[j + 1]) {                   // @compareEven
                swap(a[j], a[j + 1]);                // @swapEven
                sorted = false;
            }
        }
    }
}`),
  },
}

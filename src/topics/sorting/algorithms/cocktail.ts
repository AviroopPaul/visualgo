import { cpp, js, py, type SortAlgorithm } from '../types'

export const cocktail: SortAlgorithm = {
  id: 'cocktail',
  name: 'Cocktail shaker sort',
  family: 'Exchange',
  tagline: 'Bubble sort that sweeps both ways.',
  about: [
    'A forward pass carries the largest value to the right end, then a backward pass carries the smallest to the left end.',
    'Sweeping both ways moves small values near the end ("turtles") home much faster than plain bubble sort.',
  ],
  complexity: { best: 'O(n)', average: 'O(n²)', worst: 'O(n²)', space: 'O(1)' },
  stable: true,
  inPlace: true,
  run(t) {
    let lo = 0
    let hi = t.n - 1
    let swapped = true
    while (swapped) {
      swapped = false
      t.range(lo, hi)
      for (let j = lo; j < hi; j++) {
        t.ptr('j', j)
        if (t.compare(j, j + 1, 'compare') > 0) {
          t.swap(j, j + 1, 'swap')
          swapped = true
        }
      }
      t.markSorted(hi)
      hi--
      t.show('sortedHi', 'Largest value parked on the right. Now sweep back.')
      t.range(lo, hi)
      for (let j = hi; j > lo; j--) {
        t.ptr('j', j)
        if (t.compare(j - 1, j, 'compareBack') > 0) {
          t.swap(j - 1, j, 'swapBack')
          swapped = true
        }
      }
      t.markSorted(lo)
      lo++
      t.unptr('j')
      t.show('sortedLo', 'Smallest value parked on the left.')
    }
  },
  code: {
    js: js(`
function cocktailSort(a) {
  let lo = 0, hi = a.length - 1, swapped = true;
  while (swapped) {
    swapped = false;
    for (let j = lo; j < hi; j++) {
      if (a[j] > a[j + 1]) {                   // @compare
        [a[j], a[j + 1]] = [a[j + 1], a[j]];   // @swap
        swapped = true;
      }
    }
    hi--;                                      // @sortedHi
    for (let j = hi; j > lo; j--) {
      if (a[j - 1] > a[j]) {                   // @compareBack
        [a[j - 1], a[j]] = [a[j], a[j - 1]];   // @swapBack
        swapped = true;
      }
    }
    lo++;                                      // @sortedLo
  }
  return a;
}`),
    py: py(`
def cocktail_sort(a):
    lo, hi, swapped = 0, len(a) - 1, True
    while swapped:
        swapped = False
        for j in range(lo, hi):
            if a[j] > a[j + 1]:                  # @compare
                a[j], a[j + 1] = a[j + 1], a[j]  # @swap
                swapped = True
        hi -= 1                                  # @sortedHi
        for j in range(hi, lo, -1):
            if a[j - 1] > a[j]:                  # @compareBack
                a[j - 1], a[j] = a[j], a[j - 1]  # @swapBack
                swapped = True
        lo += 1                                  # @sortedLo
    return a`),
    cpp: cpp(`
void cocktailSort(vector<int>& a) {
    int lo = 0, hi = a.size() - 1;
    bool swapped = true;
    while (swapped) {
        swapped = false;
        for (int j = lo; j < hi; j++) {
            if (a[j] > a[j + 1]) {                   // @compare
                swap(a[j], a[j + 1]);                // @swap
                swapped = true;
            }
        }
        hi--;                                        // @sortedHi
        for (int j = hi; j > lo; j--) {
            if (a[j - 1] > a[j]) {                   // @compareBack
                swap(a[j - 1], a[j]);                // @swapBack
                swapped = true;
            }
        }
        lo++;                                        // @sortedLo
    }
}`),
  },
}

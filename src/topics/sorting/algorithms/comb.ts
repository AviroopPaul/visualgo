import { cpp, js, py, type SortAlgorithm } from '../types'

export const comb: SortAlgorithm = {
  id: 'comb',
  name: 'Comb sort',
  family: 'Exchange',
  tagline: 'Bubble sort with a shrinking gap.',
  about: [
    'Compare elements far apart first, then shrink the gap by a factor of about 1.3 each pass.',
    'Big early jumps clear out small values stuck at the end; once the gap reaches 1 it finishes like bubble sort.',
  ],
  complexity: { best: 'O(n log n)', average: 'O(n²/2ᵖ)', worst: 'O(n²)', space: 'O(1)' },
  stable: false,
  inPlace: true,
  run(t) {
    const n = t.n
    let gap = n
    let sorted = false
    while (!sorted) {
      gap = Math.floor(gap / 1.3)
      if (gap <= 1) {
        gap = 1
        sorted = true
      }
      t.show('gap', `Gap shrinks to ${gap}`)
      for (let i = 0; i + gap < n; i++) {
        t.ptr('i', i)
        t.ptr('i+gap', i + gap)
        if (t.compare(i, i + gap, 'compare') > 0) {
          t.swap(i, i + gap, 'swap')
          sorted = false
        }
      }
      t.unptr('i', 'i+gap')
    }
  },
  code: {
    js: js(`
function combSort(a) {
  let gap = a.length, sorted = false;
  while (!sorted) {
    gap = Math.floor(gap / 1.3);                   // @gap
    if (gap <= 1) { gap = 1; sorted = true; }
    for (let i = 0; i + gap < a.length; i++) {
      if (a[i] > a[i + gap]) {                     // @compare
        [a[i], a[i + gap]] = [a[i + gap], a[i]];   // @swap
        sorted = false;
      }
    }
  }
  return a;
}`),
    py: py(`
def comb_sort(a):
    gap, done = len(a), False
    while not done:
        gap = int(gap / 1.3)                            # @gap
        if gap <= 1:
            gap, done = 1, True
        for i in range(len(a) - gap):
            if a[i] > a[i + gap]:                       # @compare
                a[i], a[i + gap] = a[i + gap], a[i]     # @swap
                done = False
    return a`),
    cpp: cpp(`
void combSort(vector<int>& a) {
    int n = a.size(), gap = n;
    bool sorted = false;
    while (!sorted) {
        gap = int(gap / 1.3);                        // @gap
        if (gap <= 1) { gap = 1; sorted = true; }
        for (int i = 0; i + gap < n; i++) {
            if (a[i] > a[i + gap]) {                 // @compare
                swap(a[i], a[i + gap]);              // @swap
                sorted = false;
            }
        }
    }
}`),
  },
}

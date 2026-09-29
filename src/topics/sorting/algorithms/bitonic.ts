import { cpp, js, py, type SortAlgorithm } from '../types'

export const bitonic: SortAlgorithm = {
  id: 'bitonic',
  name: 'Bitonic sort',
  family: 'Hybrid & networks',
  tagline: 'A fixed sorting network, built for parallel hardware.',
  about: [
    'The sequence of comparisons never depends on the data, so GPUs can run a whole pass at once.',
    'It builds up "bitonic" runs (rising then falling) of length 2, 4, 8… and merges each into a sorted run.',
    'Needs a power-of-two length, so the input is trimmed to one.',
  ],
  complexity: { best: 'O(n log² n)', average: 'O(n log² n)', worst: 'O(n log² n)', space: 'O(1)' },
  stable: false,
  inPlace: true,
  pow2: true,
  run(t) {
    const n = t.n
    for (let k = 2; k <= n; k *= 2) {
      t.show('stage', `Build sorted runs of ${k}`)
      for (let j = k >> 1; j > 0; j >>= 1) {
        t.show('pass', `Compare elements ${j} apart`)
        for (let i = 0; i < n; i++) {
          const l = i ^ j
          if (l > i) {
            const up = (i & k) === 0
            t.ptr('i', i)
            t.ptr('l', l)
            if (t.compare(i, l, 'compare') > 0 === up) t.swap(i, l, 'swap')
          }
        }
      }
    }
    t.unptr('i', 'l')
  },
  code: {
    js: js(`
function bitonicSort(a) {
  const n = a.length; // must be a power of two
  for (let k = 2; k <= n; k *= 2)                  // @stage
    for (let j = k >> 1; j > 0; j >>= 1)           // @pass
      for (let i = 0; i < n; i++) {
        const l = i ^ j;
        if (l > i) {
          const up = (i & k) === 0;
          if ((a[i] > a[l]) === up)                // @compare
            [a[i], a[l]] = [a[l], a[i]];           // @swap
        }
      }
  return a;
}`),
    py: py(`
def bitonic_sort(a):
    n = len(a)  # must be a power of two
    k = 2
    while k <= n:                                  # @stage
        j = k // 2
        while j > 0:                               # @pass
            for i in range(n):
                l = i ^ j
                if l > i:
                    up = (i & k) == 0
                    if (a[i] > a[l]) == up:        # @compare
                        a[i], a[l] = a[l], a[i]    # @swap
            j //= 2
        k *= 2
    return a`),
    cpp: cpp(`
void bitonicSort(vector<int>& a) {
    int n = a.size();  // must be a power of two
    for (int k = 2; k <= n; k *= 2)                  // @stage
        for (int j = k / 2; j > 0; j /= 2)           // @pass
            for (int i = 0; i < n; i++) {
                int l = i ^ j;
                if (l > i) {
                    bool up = (i & k) == 0;
                    if ((a[i] > a[l]) == up)         // @compare
                        swap(a[i], a[l]);            // @swap
                }
            }
}`),
  },
}

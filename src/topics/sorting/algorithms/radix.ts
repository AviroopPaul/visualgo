import { M } from '../tracer'
import { cpp, js, py, type SortAlgorithm } from '../types'

const PLACE = ['ones', 'tens', 'hundreds', 'thousands']

export const radix: SortAlgorithm = {
  id: 'radix',
  name: 'Radix sort (LSD)',
  family: 'Distribution',
  tagline: 'Sort by the last digit, then the next, and so on.',
  about: [
    'Deal every number into ten buckets by its ones digit, then gather the buckets back in order.',
    'Repeat for the tens digit, the hundreds digit, and so on. Each pass is stable, so earlier digits stay ordered.',
    'After the last digit the whole array is sorted, and no two elements were ever compared.',
  ],
  complexity: { best: 'O(d·n)', average: 'O(d·n)', worst: 'O(d·n)', space: 'O(n + 10)' },
  stable: true,
  inPlace: false,
  run(t) {
    t.setBuckets(Array.from({ length: 10 }, (_, d) => String(d)))
    const max = Math.max(...t.values)
    for (let exp = 1, p = 0; Math.floor(max / exp) > 0; exp *= 10, p++) {
      t.show('digit', `Pass ${p + 1}: deal by the ${PLACE[p] ?? `10^${p}`} digit`)
      for (let i = 0; i < t.n; i++) {
        const id = t.id(i)
        const d = Math.floor(t.v(id) / exp) % 10
        t.ptr('i', i)
        t.toBucket(i, d)
        t.show('scatter', `${t.v(id)} → bucket ${d}`, [[id, M.write]])
      }
      t.unptr('i')
      let k = 0
      for (let b = 0; b < 10; b++) {
        while (t.buckets[b].length) {
          const id = t.buckets[b][0]
          t.fromBucket(b, k++)
          t.show('gather', `Gather ${t.v(id)} from bucket ${b}`, [[id, M.write]])
        }
      }
    }
  },
  code: {
    js: js(`
function radixSort(a) {
  const max = Math.max(...a);
  for (let exp = 1; Math.floor(max / exp) > 0; exp *= 10) {   // @digit
    const buckets = Array.from({ length: 10 }, () => []);
    for (const x of a)
      buckets[Math.floor(x / exp) % 10].push(x);             // @scatter
    let k = 0;
    for (const b of buckets)
      for (const x of b) a[k++] = x;                         // @gather
  }
  return a;
}`),
    py: py(`
def radix_sort(a):
    exp = 1
    while max(a) // exp > 0:                          # @digit
        buckets = [[] for _ in range(10)]
        for x in a:
            buckets[(x // exp) % 10].append(x)        # @scatter
        a[:] = [x for b in buckets for x in b]        # @gather
        exp *= 10
    return a`),
    cpp: cpp(`
void radixSort(vector<int>& a) {
    int mx = *max_element(a.begin(), a.end());
    for (int exp = 1; mx / exp > 0; exp *= 10) {     // @digit
        vector<vector<int>> buckets(10);
        for (int x : a)
            buckets[(x / exp) % 10].push_back(x);    // @scatter
        int k = 0;
        for (auto& b : buckets)
            for (int x : b) a[k++] = x;              // @gather
    }
}`),
  },
}

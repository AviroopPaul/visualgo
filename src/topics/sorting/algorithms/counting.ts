import { M } from '../tracer'
import { cpp, js, py, type SortAlgorithm } from '../types'

export const counting: SortAlgorithm = {
  id: 'counting',
  name: 'Counting sort',
  family: 'Distribution',
  tagline: 'No comparisons: tally each value, then read the tally back.',
  about: [
    'Make one bin per possible value and drop every element into the bin for its value.',
    'Walking the bins from smallest to largest gives the sorted order without comparing any two elements.',
    'Linear time, but only practical when the range of values (k) is small.',
  ],
  complexity: { best: 'O(n + k)', average: 'O(n + k)', worst: 'O(n + k)', space: 'O(n + k)' },
  stable: true,
  inPlace: false,
  run(t) {
    const min = Math.min(...t.values)
    const max = Math.max(...t.values)
    t.setBuckets(Array.from({ length: max - min + 1 }, (_, b) => String(min + b)))
    t.show('range', `Values run from ${min} to ${max}, so ${max - min + 1} counters`)
    for (let i = 0; i < t.n; i++) {
      const id = t.id(i)
      t.ptr('i', i)
      t.toBucket(i, t.v(id) - min)
      t.show('count', `count[${t.v(id)}]++`, [[id, M.write]])
    }
    t.unptr('i')
    let k = 0
    for (let b = 0; b < t.buckets.length; b++) {
      while (t.buckets[b].length) {
        const id = t.buckets[b][0]
        t.fromBucket(b, k)
        t.markSorted(k)
        t.show('write', `Write ${t.v(id)} to slot ${k}`, [[id, M.write]])
        k++
      }
    }
  },
  code: {
    js: js(`
function countingSort(a) {
  const min = Math.min(...a), max = Math.max(...a);  // @range
  const count = new Array(max - min + 1).fill(0);
  for (const x of a) count[x - min]++;               // @count
  let k = 0;
  for (let v = 0; v < count.length; v++)
    while (count[v]-- > 0) a[k++] = v + min;         // @write
  return a;
}`),
    py: py(`
def counting_sort(a):
    lo, hi = min(a), max(a)                          # @range
    count = [0] * (hi - lo + 1)
    for x in a:
        count[x - lo] += 1                           # @count
    k = 0
    for v, c in enumerate(count):
        for _ in range(c):
            a[k] = v + lo; k += 1                    # @write
    return a`),
    cpp: cpp(`
void countingSort(vector<int>& a) {
    int mn = *min_element(a.begin(), a.end());       // @range
    int mx = *max_element(a.begin(), a.end());
    vector<int> count(mx - mn + 1, 0);
    for (int x : a) count[x - mn]++;                 // @count
    int k = 0;
    for (int v = 0; v < (int)count.size(); v++)
        while (count[v]-- > 0) a[k++] = v + mn;      // @write
}`),
  },
}

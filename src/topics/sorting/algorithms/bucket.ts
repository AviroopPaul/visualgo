import { M } from '../tracer'
import { cpp, js, py, type SortAlgorithm } from '../types'

const K = 8

export const bucket: SortAlgorithm = {
  id: 'bucket',
  name: 'Bucket sort',
  family: 'Distribution',
  tagline: 'Scatter into ranges, sort each small bucket, concatenate.',
  about: [
    'Split the value range into k equal buckets and drop each element into the bucket its value falls in.',
    'Each bucket is small, so a simple insertion sort finishes it quickly.',
    'Reading the buckets in order gives the sorted array. Great when values are spread evenly.',
  ],
  complexity: { best: 'O(n + k)', average: 'O(n + k)', worst: 'O(n²)', space: 'O(n + k)' },
  stable: true,
  inPlace: false,
  run(t) {
    const max = Math.max(...t.values) + 1
    t.setBuckets(
      Array.from({ length: K }, (_, b) => `${Math.ceil((b * max) / K)}–${Math.ceil(((b + 1) * max) / K) - 1}`),
    )
    for (let i = 0; i < t.n; i++) {
      const id = t.id(i)
      const b = Math.floor((t.v(id) / max) * K)
      t.ptr('i', i)
      t.toBucket(i, b)
      t.show('scatter', `${t.v(id)} → bucket ${b}`, [[id, M.write]])
    }
    t.unptr('i')
    let k = 0
    for (let b = 0; b < K; b++) {
      const bk = t.buckets[b]
      for (let x = 1; x < bk.length; x++) {
        for (let j = x; j > 0; j--) {
          if (t.cmpIds(bk[j - 1], bk[j], 'sortBucket') <= 0) break
          const [p, q] = [bk[j - 1], bk[j]]
          t.bucketSwap(b, j - 1, j)
          t.show('sortBucket', `Insertion sort inside bucket ${b}`, [
            [p, M.swap],
            [q, M.swap],
          ])
        }
      }
      while (bk.length) {
        const id = bk[0]
        t.fromBucket(b, k)
        t.markSorted(k)
        t.show('gather', `Gather ${t.v(id)} into slot ${k}`, [[id, M.write]])
        k++
      }
    }
  },
  code: {
    js: js(`
function bucketSort(a, k = 8) {
  const max = Math.max(...a) + 1;
  const buckets = Array.from({ length: k }, () => []);
  for (const x of a)
    buckets[Math.floor((x / max) * k)].push(x);  // @scatter
  let i = 0;
  for (const b of buckets) {
    insertionSort(b);                            // @sortBucket
    for (const x of b) a[i++] = x;               // @gather
  }
  return a;
}`),
    py: py(`
def bucket_sort(a, k=8):
    top = max(a) + 1
    buckets = [[] for _ in range(k)]
    for x in a:
        buckets[x * k // top].append(x)          # @scatter
    i = 0
    for b in buckets:
        insertion_sort(b)                        # @sortBucket
        for x in b:
            a[i] = x; i += 1                     # @gather
    return a`),
    cpp: cpp(`
void bucketSort(vector<int>& a, int k = 8) {
    int mx = *max_element(a.begin(), a.end()) + 1;
    vector<vector<int>> buckets(k);
    for (int x : a)
        buckets[x * k / mx].push_back(x);            // @scatter
    int i = 0;
    for (auto& b : buckets) {
        insertionSort(b);                            // @sortBucket
        for (int x : b) a[i++] = x;                  // @gather
    }
}`),
  },
}

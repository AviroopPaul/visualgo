import type { Tracer } from '../tracer'
import { cpp, js, py, type SortAlgorithm } from '../types'

function siftDown(t: Tracer, i: number, size: number) {
  while (true) {
    let big = i
    const l = 2 * i + 1
    const r = l + 1
    if (l < size && t.compare(l, big, 'left', `Left child ${t.val(l)} vs ${t.val(big)}`) > 0) big = l
    if (r < size && t.compare(r, big, 'right', `Right child ${t.val(r)} vs ${t.val(big)}`) > 0) big = r
    if (big === i) {
      t.show('settled', `${t.val(i)} is bigger than its children, so it settles`)
      return
    }
    t.swap(i, big, 'swap', `Sift ${t.val(i)} down below ${t.val(big)}`)
    i = big
  }
}

export const heap: SortAlgorithm = {
  id: 'heap',
  name: 'Heap sort',
  family: 'Selection',
  tagline: 'Build a max-heap, then keep pulling off the top.',
  about: [
    'Read the array as a binary tree: slot i has children 2i + 1 and 2i + 2.',
    'First heapify so every parent is larger than its children, which puts the maximum at the root.',
    'Then swap the root to the end, shrink the heap by one, and sift the new root down. Repeat.',
  ],
  complexity: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n log n)', space: 'O(1)' },
  stable: false,
  inPlace: true,
  run(t) {
    const n = t.n
    t.setHeap(n)
    t.show('build', 'Read the array as a tree and heapify it from the bottom up')
    for (let i = (n >> 1) - 1; i >= 0; i--) siftDown(t, i, n)
    for (let end = n - 1; end > 0; end--) {
      t.swap(0, end, 'extract', `Move the max ${t.val(0)} to slot ${end}`)
      t.markSorted(end)
      t.setHeap(end)
      siftDown(t, 0, end)
    }
    t.markSorted(0)
  },
  code: {
    js: js(`
function heapSort(a) {
  const n = a.length;
  for (let i = (n >> 1) - 1; i >= 0; i--)    // @build
    siftDown(a, i, n);
  for (let end = n - 1; end > 0; end--) {
    [a[0], a[end]] = [a[end], a[0]];         // @extract
    siftDown(a, 0, end);
  }
  return a;
}

function siftDown(a, i, n) {
  while (true) {
    let big = i;
    const l = 2 * i + 1, r = l + 1;
    if (l < n && a[l] > a[big]) big = l;     // @left
    if (r < n && a[r] > a[big]) big = r;     // @right
    if (big === i) return;                   // @settled
    [a[i], a[big]] = [a[big], a[i]];         // @swap
    i = big;
  }
}`),
    py: py(`
def heap_sort(a):
    n = len(a)
    for i in range(n // 2 - 1, -1, -1):          # @build
        sift_down(a, i, n)
    for end in range(n - 1, 0, -1):
        a[0], a[end] = a[end], a[0]              # @extract
        sift_down(a, 0, end)
    return a

def sift_down(a, i, n):
    while True:
        big, l, r = i, 2 * i + 1, 2 * i + 2
        if l < n and a[l] > a[big]: big = l      # @left
        if r < n and a[r] > a[big]: big = r      # @right
        if big == i: return                      # @settled
        a[i], a[big] = a[big], a[i]              # @swap
        i = big`),
    cpp: cpp(`
void siftDown(vector<int>& a, int i, int n) {
    while (true) {
        int big = i, l = 2 * i + 1, r = l + 1;
        if (l < n && a[l] > a[big]) big = l;         // @left
        if (r < n && a[r] > a[big]) big = r;         // @right
        if (big == i) return;                        // @settled
        swap(a[i], a[big]);                          // @swap
        i = big;
    }
}

void heapSort(vector<int>& a) {
    int n = a.size();
    for (int i = n / 2 - 1; i >= 0; i--)             // @build
        siftDown(a, i, n);
    for (int end = n - 1; end > 0; end--) {
        swap(a[0], a[end]);                          // @extract
        siftDown(a, 0, end);
    }
}`),
  },
}

import { M } from '../tracer'
import { cpp, js, py, type SortAlgorithm } from '../types'

export const pancake: SortAlgorithm = {
  id: 'pancake',
  name: 'Pancake sort',
  family: 'Selection',
  tagline: 'The only move allowed: flip the top of the stack.',
  about: [
    'Imagine a stack of pancakes and a spatula. You can only reverse the first k elements.',
    'Find the largest unsorted pancake, flip it to the front, then flip it down to the bottom of the unsorted part.',
  ],
  complexity: { best: 'O(n)', average: 'O(n²)', worst: 'O(n²)', space: 'O(1)' },
  stable: false,
  inPlace: true,
  run(t) {
    for (let size = t.n; size > 1; size--) {
      t.range(0, size - 1)
      let max = 0
      t.tag(t.id(0), M.focus)
      for (let i = 1; i < size; i++) {
        t.ptr('i', i)
        if (t.compare(i, max, 'findMax') > 0) {
          t.untag(t.id(max))
          max = i
          t.tag(t.id(max), M.focus)
        }
      }
      t.unptr('i')
      t.untag(t.id(max))
      if (max !== size - 1) {
        if (max > 0) t.reverse(0, max, 'flipTop', `Flip the first ${max + 1} to bring ${t.val(max)} to the front`)
        t.reverse(0, size - 1, 'flipDown', `Flip the first ${size} to sink ${t.val(0)} into slot ${size - 1}`)
      } else t.show('already', `${t.val(max)} is already at the bottom`)
      t.markSorted(size - 1)
    }
  },
  code: {
    js: js(`
function pancakeSort(a) {
  for (let size = a.length; size > 1; size--) {
    let max = 0;
    for (let i = 1; i < size; i++)
      if (a[i] > a[max]) max = i;          // @findMax
    if (max === size - 1) continue;        // @already
    flip(a, max);                          // @flipTop
    flip(a, size - 1);                     // @flipDown
  }
  return a;
}

function flip(a, k) {
  for (let i = 0; i < k; i++, k--)
    [a[i], a[k]] = [a[k], a[i]];
}`),
    py: py(`
def pancake_sort(a):
    for size in range(len(a), 1, -1):
        m = a.index(max(a[:size]))           # @findMax
        if m == size - 1:                    # @already
            continue
        a[:m + 1] = a[:m + 1][::-1]          # @flipTop
        a[:size] = a[:size][::-1]            # @flipDown
    return a`),
    cpp: cpp(`
void pancakeSort(vector<int>& a) {
    for (int size = a.size(); size > 1; size--) {
        int mx = max_element(a.begin(), a.begin() + size) - a.begin();  // @findMax
        if (mx == size - 1) continue;                // @already
        reverse(a.begin(), a.begin() + mx + 1);      // @flipTop
        reverse(a.begin(), a.begin() + size);        // @flipDown
    }
}`),
  },
}

import { cpp, js, py, type SearchAlgorithm } from '../types'

export const linear: SearchAlgorithm = {
  id: 'linear',
  name: 'Linear search',
  group: 'Scan',
  tagline: 'Check every element, left to right.',
  about: [
    'Start at the first element and compare each one with the target until you find it or run out.',
    'The only search here that also works on unsorted data, but it may look at every single element.',
  ],
  complexity: { best: 'O(1)', average: 'O(n)', worst: 'O(n)', space: 'O(1)' },
  sorted: false,
  run(t) {
    for (let i = 0; i < t.n; i++) {
      t.ptr('i', i)
      if (t.probe(i, 'compare') === 0) return t.found(i, 'found')
      t.kill(i)
    }
    t.missing('notFound', 'checked every element')
  },
  code: {
    py: py(`
def linear_search(a, target):
    for i in range(len(a)):
        if a[i] == target:                 # @compare
            return i                       # @found
    return -1                              # @notFound`),
    js: js(`
function linearSearch(a, target) {
  for (let i = 0; i < a.length; i++) {
    if (a[i] === target) {                 // @compare
      return i;                            // @found
    }
  }
  return -1;                               // @notFound
}`),
    cpp: cpp(`
int linearSearch(const vector<int>& a, int target) {
    for (int i = 0; i < (int)a.size(); i++) {
        if (a[i] == target) {              // @compare
            return i;                      // @found
        }
    }
    return -1;                             // @notFound
}`),
  },
}

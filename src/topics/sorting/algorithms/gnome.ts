import { cpp, js, py, type SortAlgorithm } from '../types'

export const gnome: SortAlgorithm = {
  id: 'gnome',
  name: 'Gnome sort',
  family: 'Exchange',
  tagline: 'Step forward when in order, step back after a swap.',
  about: [
    'A garden gnome sorts flower pots: if the pot behind is smaller, step forward; if not, swap them and step back.',
    'It is insertion sort done with swaps and a single moving position.',
  ],
  complexity: { best: 'O(n)', average: 'O(n²)', worst: 'O(n²)', space: 'O(1)' },
  stable: true,
  inPlace: true,
  run(t) {
    let i = 0
    while (i < t.n) {
      t.ptr('gnome', i)
      if (i === 0) {
        t.show('compare', 'At the start, nothing behind, so step forward')
        i++
        continue
      }
      if (t.compare(i - 1, i, 'compare') <= 0) i++
      else {
        t.swap(i - 1, i, 'swap')
        i--
      }
    }
    t.unptr('gnome')
  },
  code: {
    js: js(`
function gnomeSort(a) {
  let i = 0;
  while (i < a.length) {
    if (i === 0 || a[i - 1] <= a[i]) {     // @compare
      i++;
    } else {
      [a[i - 1], a[i]] = [a[i], a[i - 1]]; // @swap
      i--;
    }
  }
  return a;
}`),
    py: py(`
def gnome_sort(a):
    i = 0
    while i < len(a):
        if i == 0 or a[i - 1] <= a[i]:       # @compare
            i += 1
        else:
            a[i - 1], a[i] = a[i], a[i - 1]  # @swap
            i -= 1
    return a`),
    cpp: cpp(`
void gnomeSort(vector<int>& a) {
    size_t i = 0;
    while (i < a.size()) {
        if (i == 0 || a[i - 1] <= a[i]) {            // @compare
            i++;
        } else {
            swap(a[i - 1], a[i]);                    // @swap
            i--;
        }
    }
}`),
  },
}

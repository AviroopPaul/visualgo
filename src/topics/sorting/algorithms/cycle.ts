import { M, type Tracer } from '../tracer'
import { cpp, js, py, type SortAlgorithm } from '../types'

/**
 * The visual version breaks ties by original position so every element has
 * one exact destination; the listing shows the usual duplicate handling.
 */
function countSmaller(t: Tracer, start: number, held: number, line: string) {
  let pos = start
  t.ptr('pos', pos)
  for (let i = start + 1; i < t.n; i++) {
    t.ptr('i', i)
    const other = t.id(i)
    t.cmpIds(other, held, line, undefined)
    if (t.v(other) < t.v(held) || (t.v(other) === t.v(held) && other < held)) {
      pos++
      t.ptr('pos', pos)
    }
  }
  t.unptr('i')
  return pos
}

export const cycle: SortAlgorithm = {
  id: 'cycle',
  name: 'Cycle sort',
  family: 'Selection',
  tagline: 'Count how many are smaller, and that is where you go.',
  about: [
    'Pick up an element and count how many elements are smaller than it: that count is its final slot.',
    'Drop it there and pick up whatever was in the way, repeating until the cycle closes back at the start.',
    'Every element is written at most once, the fewest writes possible.',
  ],
  complexity: { best: 'O(n²)', average: 'O(n²)', worst: 'O(n²)', space: 'O(1)' },
  stable: false,
  inPlace: true,
  run(t) {
    const n = t.n
    t.setAuxLabel('item: the value being carried to its slot')
    for (let start = 0; start < n - 1; start++) {
      t.range(start, n - 1)
      t.ptr('start', start)
      t.toAux(start, start)
      let held = t.aux[start]
      let heldAt = start
      t.tag(held, M.key)
      t.show('pick', `Pick up ${t.v(held)}`)
      let pos = countSmaller(t, start, held, 'count')
      if (pos === start) {
        t.fromAux(start, start)
        t.untag(held)
        t.markSorted(start)
        t.unptr('pos')
        t.show('inPlace', `Nothing smaller: ${t.v(held)} stays at ${start}`)
        continue
      }
      const exchange = (line: string) => {
        const other = t.id(pos)
        t.main[pos] = held
        t.aux[heldAt] = -1
        t.aux[pos] = other
        t.writes++
        t.untag(held)
        t.markSorted(pos)
        t.tag(other, M.key)
        t.show(line, `${t.v(held)} belongs at ${pos}; pick up ${t.v(other)}`, [[held, M.write]])
        held = other
        heldAt = pos
      }
      exchange('write')
      while (true) {
        pos = countSmaller(t, start, held, 'count2')
        if (pos === start) {
          t.fromAux(heldAt, start)
          t.untag(held)
          t.markSorted(start)
          t.unptr('pos')
          t.show('write2', `${t.v(held)} closes the cycle at slot ${start}`, [[held, M.write]])
          break
        }
        exchange('write2')
      }
    }
  },
  code: {
    js: js(`
function cycleSort(a) {
  for (let start = 0; start < a.length - 1; start++) {
    let item = a[start];                          // @pick
    let pos = start;
    for (let i = start + 1; i < a.length; i++)
      if (a[i] < item) pos++;                     // @count
    if (pos === start) continue;                  // @inPlace
    while (item === a[pos]) pos++;
    [a[pos], item] = [item, a[pos]];              // @write
    while (pos !== start) {
      pos = start;
      for (let i = start + 1; i < a.length; i++)
        if (a[i] < item) pos++;                   // @count2
      while (item === a[pos]) pos++;
      [a[pos], item] = [item, a[pos]];            // @write2
    }
  }
  return a;
}`),
    py: py(`
def cycle_sort(a):
    for start in range(len(a) - 1):
        item = a[start]                              # @pick
        pos = start + sum(1 for x in a[start + 1:] if x < item)  # @count
        if pos == start:                             # @inPlace
            continue
        while item == a[pos]:
            pos += 1
        a[pos], item = item, a[pos]                  # @write
        while pos != start:
            pos = start + sum(1 for x in a[start + 1:] if x < item)  # @count2
            while item == a[pos]:
                pos += 1
            a[pos], item = item, a[pos]              # @write2
    return a`),
    cpp: cpp(`
void cycleSort(vector<int>& a) {
    int n = a.size();
    for (int start = 0; start < n - 1; start++) {
        int item = a[start];                         // @pick
        int pos = start;
        for (int i = start + 1; i < n; i++)
            if (a[i] < item) pos++;                  // @count
        if (pos == start) continue;                  // @inPlace
        while (item == a[pos]) pos++;
        swap(a[pos], item);                          // @write
        while (pos != start) {
            pos = start;
            for (int i = start + 1; i < n; i++)
                if (a[i] < item) pos++;              // @count2
            while (item == a[pos]) pos++;
            swap(a[pos], item);                      // @write2
        }
    }
}`),
  },
}

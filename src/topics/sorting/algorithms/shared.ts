import { M, type Tracer } from '../tracer'

/**
 * Insertion sort over main[lo..hi], stepping by `gap`. The key drops into the
 * scratch row (the `key` variable) and slides along underneath while larger
 * elements shift right.
 *
 * Pointers mirror the listings: with gap 1, `j` is the element being compared
 * (j = i - 1 …); in Shell sort `j` is the hole and `j-gap` is compared.
 */
export function insertionRange(t: Tracer, lo: number, hi: number, gap = 1) {
  t.setAuxLabel('key: the value being inserted')
  const point = (i: number, hole: number) => {
    t.ptr('i', i)
    if (gap === 1) {
      if (hole - 1 >= lo) t.ptr('j', hole - 1)
      else t.unptr('j')
    } else {
      t.ptr('j', hole)
      if (hole - gap >= lo) t.ptr('j-gap', hole - gap)
      else t.unptr('j-gap')
    }
  }
  for (let i = lo + gap; i <= hi; i++) {
    t.toAux(i, i)
    const key = t.aux[i]
    t.tag(key, M.key)
    let hole = i
    point(i, hole)
    t.show('lift', `Pick up ${t.v(key)} as the key`)
    while (hole - gap >= lo) {
      if (t.cmpIds(t.id(hole - gap), key, 'icompare') <= 0) break
      const moving = t.id(hole - gap)
      t.shift(hole - gap, hole)
      t.auxMove(hole, hole - gap)
      t.show('shift', `${t.v(moving)} is bigger, shift it ${gap > 1 ? `${gap} places ` : ''}right`, [[moving, M.write]])
      hole -= gap
      point(i, hole)
    }
    t.fromAux(hole, hole)
    t.untag(key)
    t.show('drop', `Drop ${t.v(key)} into slot ${hole}`, [[key, M.write]])
  }
  t.unptr('i', 'j', 'j-gap')
}

/**
 * Merge main[lo..mid] and main[mid+1..hi] through the scratch row (the `tmp`
 * buffer). `i` and `j` walk the two halves in scratch; `k` is the next slot
 * to write in the main array.
 */
export function mergeRange(t: Tracer, lo: number, mid: number, hi: number) {
  t.setAuxLabel('tmp: copy of the two halves being merged')
  t.range(lo, hi)
  for (let k = lo; k <= hi; k++) t.toAux(k, k)
  let i = lo
  let j = mid + 1
  let k = lo
  const point = () => {
    if (i <= mid) t.ptr('i', i, 1)
    else t.unptr('i')
    if (j <= hi) t.ptr('j', j, 1)
    else t.unptr('j')
    if (k <= hi) t.ptr('k', k)
    else t.unptr('k')
  }
  point()
  t.show('copy', `Copy [${lo}..${hi}] down into tmp`)
  const take = (from: number, line: string, note: (v: number) => string) => {
    const id = t.aux[from]
    t.fromAux(from, k++)
    t.show(line, note(t.v(id)), [[id, M.write]])
  }
  while (i <= mid && j <= hi) {
    point()
    if (t.cmpIds(t.aux[i], t.aux[j], 'mcompare') <= 0) {
      take(i++, 'takeLeft', (v) => `${v} is smaller, take it from the left half`)
    } else {
      take(j++, 'takeRight', (v) => `${v} is smaller, take it from the right half`)
    }
  }
  while (i <= mid) {
    point()
    take(i++, 'restLeft', (v) => `Right half is empty, copy the leftover ${v}`)
  }
  while (j <= hi) {
    point()
    take(j++, 'restRight', (v) => `Left half is empty, copy the leftover ${v}`)
  }
  t.unptr('i', 'j', 'k')
}

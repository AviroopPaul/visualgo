import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { TREE_GROUPS, TREES } from './registry'
import { TreeStage } from './TreeStage'
import type { TreeItem } from './types'

/** Small live tree for a card: the demo's final frame, replayed while hovered. */
function TreeMini({ item, active }: { item: TreeItem<unknown>; active: boolean }) {
  const frames = useMemo(() => {
    const variant = item.variants?.[0].id
    return item.run(item.initial(4), item.demo(4, variant), variant).frames
  }, [item])
  const [k, setK] = useState(frames.length - 1)
  useEffect(() => {
    if (!active) return setK(frames.length - 1)
    setK(0)
    const step = Math.max(1, Math.round(frames.length / 60))
    const id = setInterval(() => setK((i) => (i + step >= frames.length - 1 ? (clearInterval(id), frames.length - 1) : i + step)), 45)
    return () => clearInterval(id)
  }, [active, frames])
  return (
    <div className="mini tree-mini">
      <TreeStage frame={frames[k]} duration={active ? 60 : 0} compact />
    </div>
  )
}

export function TreeCards() {
  const [hover, setHover] = useState<string | null>(null)
  return (
    <>
      {TREE_GROUPS.map((g) => (
        <div key={g} className="family-row">
          <h3>{g}</h3>
          <div className="cards">
            {TREES.filter((t) => t.group === g).map((t) => (
              <Link
                key={t.id}
                to={`/trees/${t.id}`}
                className="card"
                onMouseEnter={() => setHover(t.id)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(t.id)}
                onBlur={() => setHover(null)}
              >
                <TreeMini item={t} active={hover === t.id} />
                <div className="card-text">
                  <strong>{t.name}</strong>
                  <span className="mono dim">{t.chips[0][1]}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </>
  )
}

export function TreesShelf() {
  return (
    <section className="shelf" id="trees">
      <header className="shelf-head">
        <h2>Trees</h2>
        <span className="dim">
          {TREES.length} structures · insert, search and delete your own values · <Link to="/trees">overview →</Link>
        </span>
      </header>
      <TreeCards />
    </section>
  )
}

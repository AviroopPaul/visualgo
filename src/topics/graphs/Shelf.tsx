import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { GraphStage } from './GraphStage'
import { GRAPH_GROUPS, GRAPHS } from './registry'
import type { GraphAlgorithm } from './types'

/** Small live graph for a card: the finished run, replayed while hovered. */
function GraphMini({ algo, active }: { algo: GraphAlgorithm; active: boolean }) {
  const graph = useMemo(() => algo.presets[0].make(3), [algo])
  const frames = useMemo(() => algo.run(graph, 0).frames, [algo, graph])
  const [k, setK] = useState(frames.length - 1)
  useEffect(() => {
    if (!active) return setK(frames.length - 1)
    setK(0)
    const step = Math.max(1, Math.round(frames.length / 50))
    const id = setInterval(() => setK((i) => (i + step >= frames.length - 1 ? (clearInterval(id), frames.length - 1) : i + step)), 50)
    return () => clearInterval(id)
  }, [active, frames])
  return (
    <div className="mini tree-mini">
      <GraphStage graph={graph} frame={frames[k]} step={k} duration={0} compact />
    </div>
  )
}

export function GraphCards() {
  const [hover, setHover] = useState<string | null>(null)
  return (
    <>
      {GRAPH_GROUPS.map((g) => (
        <div key={g} className="family-row">
          <h3>{g}</h3>
          <div className="cards">
            {GRAPHS.filter((a) => a.group === g).map((a) => (
              <Link
                key={a.id}
                to={`/graphs/${a.id}`}
                className="card"
                onMouseEnter={() => setHover(a.id)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(a.id)}
                onBlur={() => setHover(null)}
              >
                <GraphMini algo={a} active={hover === a.id} />
                <div className="card-text">
                  <strong>{a.name}</strong>
                  <span className="mono dim">{a.complexity.average}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </>
  )
}

export function GraphsShelf() {
  return (
    <section className="shelf" id="graphs">
      <header className="shelf-head">
        <h2>Graph algorithms</h2>
        <span className="dim">
          {GRAPHS.length} algorithms · BFS and DFS also run on a grid you draw · <Link to="/graphs">overview →</Link>
        </span>
      </header>
      <GraphCards />
    </section>
  )
}

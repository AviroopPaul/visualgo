import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { makeArray, pickTarget } from './input'
import { GROUPS, SEARCHES, traceSearch } from './registry'
import { SM } from './tracer'
import type { SearchAlgorithm } from './types'

const VALUES = makeArray(24, 'uniform', 3)
const TARGET = pickTarget(VALUES, 9)

/** Canvas thumbnail; plays the search while hovered. */
function SearchMini({ algo, active }: { algo: SearchAlgorithm; active: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const [run] = useState(() => traceSearch(algo, VALUES, TARGET))
  useEffect(() => {
    const c = canvas.current!
    const ctx = c.getContext('2d')!
    const dpr = window.devicePixelRatio || 1
    const w = c.clientWidth
    const h = c.clientHeight
    c.width = w * dpr
    c.height = h * dpr
    ctx.scale(dpr, dpr)
    const draw = (k: number) => {
      const f = run.frames[k]
      ctx.clearRect(0, 0, w, h)
      const slot = w / run.n
      for (let i = 0; i < run.n; i++) {
        const v = run.values[i] / run.maxValue
        const m = f.mark[i]
        ctx.globalAlpha = f.dead[i] ? 0.18 : 1
        ctx.fillStyle = m === SM.found ? '#35e0a1' : m === SM.probe ? '#ffc145' : m === SM.probe2 ? '#ff8ad8' : `rgba(150,165,200,${0.35 + v * 0.45})`
        ctx.fillRect(i * slot + 1, h - v * (h - 4), slot - 2, v * (h - 4))
      }
      ctx.globalAlpha = 1
      const ty = h - (run.target / run.maxValue) * (h - 4)
      ctx.strokeStyle = 'rgba(255,193,69,.7)'
      ctx.setLineDash([4, 3])
      ctx.beginPath()
      ctx.moveTo(0, ty)
      ctx.lineTo(w, ty)
      ctx.stroke()
      ctx.setLineDash([])
    }
    if (!active) return draw(0)
    let k = 0
    draw(0)
    const id = setInterval(() => {
      k = Math.min(run.frames.length - 1, k + 1)
      draw(k)
      if (k === run.frames.length - 1) clearInterval(id)
    }, Math.max(60, 1600 / run.frames.length))
    return () => clearInterval(id)
  }, [active, run])
  return <canvas ref={canvas} className="mini" />
}

/** Every search as a card, grouped; hovering plays a preview. */
export function SearchCards() {
  const [hover, setHover] = useState<string | null>(null)
  return (
    <>
      {GROUPS.map((g) => (
        <div key={g} className="family-row">
          <h3>{g}</h3>
          <div className="cards">
            {SEARCHES.filter((a) => a.group === g).map((a) => (
              <Link
                key={a.id}
                to={`/searching/${a.id}`}
                className="card"
                onMouseEnter={() => setHover(a.id)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(a.id)}
                onBlur={() => setHover(null)}
              >
                <SearchMini algo={a} active={hover === a.id} />
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

export function SearchingShelf() {
  return (
    <section className="shelf" id="searching">
      <header className="shelf-head">
        <h2>Searching algorithms</h2>
        <span className="dim">
          {SEARCHES.length} algorithms · hover to preview · <Link to="/searching#complexity">compare complexity →</Link>
        </span>
      </header>
      <SearchCards />
    </section>
  )
}

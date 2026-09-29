import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MiniPreview } from './MiniPreview'
import { ALGORITHMS, FAMILIES } from './registry'

/** Every sorting algorithm as a card, grouped by family; hovering plays a preview. */
export function AlgoCards() {
  const [hover, setHover] = useState<string | null>(null)
  return (
    <>
      {FAMILIES.map((f) => (
        <div key={f} className="family-row">
          <h3>{f}</h3>
          <div className="cards">
            {ALGORITHMS.filter((a) => a.family === f).map((a) => (
              <Link
                key={a.id}
                to={`/sorting/${a.id}`}
                className="card"
                onMouseEnter={() => setHover(a.id)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(a.id)}
                onBlur={() => setHover(null)}
              >
                <MiniPreview algo={a} active={hover === a.id} />
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

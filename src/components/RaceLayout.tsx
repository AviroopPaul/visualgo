import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

export interface RaceLane {
  id: string
  name: string
  /** Link to the single-algorithm page with the same input. */
  to: string
  /** 0..1 progress through this lane's frames. */
  progress: number
  finished: boolean
  /** 1-based finishing place, shown once finished. */
  place: number
  /** Right-aligned status, e.g. "12/346" or "7 probes". */
  score: string
  stage: ReactNode
}

interface Props {
  topic: string
  tagline: string
  picks: { id: string; label: string }[]
  selected: string[]
  onToggle(id: string): void
  lanes: RaceLane[]
  dock: ReactNode
}

/** Several algorithms on one input and one clock. Shared by every topic's race. */
export function RaceLayout({ topic, tagline, picks, selected, onToggle, lanes, dock }: Props) {
  return (
    <div className="race-page">
      <section className="race-head">
        <div>
          <span className="family">{topic}</span>
          <h1>Race</h1>
          <p className="tagline">{tagline}</p>
        </div>
        <div className="race-picks">
          {picks.map((p) => (
            <button key={p.id} className={`pick${selected.includes(p.id) ? ' on' : ''}`} onClick={() => onToggle(p.id)}>
              {p.label}
            </button>
          ))}
        </div>
      </section>

      <section className="race-grid">
        {lanes.map((l) => (
          <article key={l.id} className={`lane${l.finished ? ' is-finished' : ''}`}>
            <header>
              <Link to={l.to}>{l.name}</Link>
              <span className="mono dim">
                {l.finished ? <b className={`place p${l.place}`}>#{l.place}</b> : null} {l.score}
              </span>
            </header>
            <div className="lane-stage">{l.stage}</div>
            <div className="lane-bar">
              <i style={{ width: `${l.progress * 100}%` }} />
            </div>
          </article>
        ))}
      </section>

      {dock}
    </div>
  )
}

/** Toggle helper that keeps at least one and at most `max` picks. */
export const togglePick = (max: number) => (ids: string[], id: string) =>
  ids.includes(id) ? (ids.length > 1 ? ids.filter((x) => x !== id) : ids) : ids.length < max ? [...ids, id] : ids

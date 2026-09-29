import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { TOPICS } from '../catalog'
import { usePlayer } from '../engine/usePlayer'
import { makeInput } from '../topics/sorting/input'
import { MiniPreview } from '../topics/sorting/MiniPreview'
import { ALGORITHMS, byId, FAMILIES, trace } from '../topics/sorting/registry'
import { SortStage } from '../topics/sorting/SortStage'

const HERO_CYCLE = ['quick', 'merge', 'heap', 'radix', 'shell', 'insertion']

function HeroStage() {
  const [round, setRound] = useState(0)
  const algo = byId(HERO_CYCLE[round % HERO_CYCLE.length])!
  const run = useMemo(() => trace(algo, makeInput(algo.id === 'heap' ? 31 : 40, 'random', 100 + round)), [algo, round])
  const player = usePlayer(run.frames.length, run, algo.id === 'insertion' ? 64 : 56)
  const { play } = player

  useEffect(() => {
    const t = setTimeout(play, 500)
    return () => clearTimeout(t)
  }, [run, play])
  useEffect(() => {
    if (!player.atEnd || player.index === 0) return
    const t = setTimeout(() => setRound((r) => r + 1), 1600)
    return () => clearTimeout(t)
  }, [player.atEnd, player.index])

  return (
    <div className="hero-stage">
      <div className="hero-stage-label mono">
        <span>{algo.name}</span>
        <Link to={`/sorting/${algo.id}`}>open →</Link>
      </div>
      <SortStage run={run} frame={run.frames[player.index]} duration={player.duration} done={player.atEnd && player.index > 0} compact />
    </div>
  )
}

export function Home() {
  const [hover, setHover] = useState<string | null>(null)
  const soon = TOPICS.filter((t) => t.status === 'soon')

  return (
    <div className="home">
      <section className="hero">
        <div className="hero-copy">
          <h1 className="hero-title">
            Watch algorithms <em>think</em>.
          </h1>
          <p className="hero-sub">
            Every compare, swap and move, animated one step at a time. Scrub back, slow down, read the code as it runs.
          </p>
          <div className="hero-cta">
            <Link to="/sorting/bubble" className="solid-btn lg">
              Start sorting
            </Link>
            <Link to="/sorting/race" className="ghost-btn lg">
              Race 19 algorithms
            </Link>
          </div>
        </div>
        <HeroStage />
      </section>

      <section className="shelf" id="sorting">
        <header className="shelf-head">
          <h2>Sorting</h2>
          <span className="dim">{ALGORITHMS.length} algorithms · hover to preview</span>
        </header>
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
      </section>

      <section className="shelf" id="topics">
        <header className="shelf-head">
          <h2>Coming next</h2>
          <span className="dim">The same engine, new stages</span>
        </header>
        <div className="topics">
          {soon.map((t) => (
            <Link key={t.id} to={`/${t.id}`} className="topic" style={{ '--accent': t.accent } as CSSProperties}>
              <span className="topic-dot" />
              <strong>{t.title}</strong>
              <p>{t.blurb}</p>
              <span className="soon mono">soon</span>
            </Link>
          ))}
        </div>
      </section>

      <footer className="foot dim">
        <span>visualgo</span>
        <span>Space play · ← → step · R shuffle · C code</span>
      </footer>
    </div>
  )
}
